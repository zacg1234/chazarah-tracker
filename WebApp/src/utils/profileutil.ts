import { createEphemeralClient, supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';

// A person whose minutes can be entered: the logged-in user, or a sub-account they own.
// `id` is the auth user id and is what TblSession/TblObligation/TblPayment store as UserId.
export type Profile = { id: string; name: string; isSelf: boolean };

export function profileNameOf(user: User) {
  const meta = user.user_metadata ?? {};
  return meta.display_name || [meta.firstname, meta.lastname].filter(Boolean).join(' ') || user.email || 'Me';
}

// The user themself first, then the sub-accounts they own
export async function getFamilyProfiles(user: User): Promise<Profile[]> {
  const self: Profile = { id: user.id, name: profileNameOf(user), isSelf: true };
  const { data, error } = await supabase
    .from('TblProfile')
    .select('ProfileUserId, DisplayName')
    .eq('OwnerId', user.id)
    .order('CreatedAt', { ascending: true });
  if (error) {
    // e.g. sub_accounts.sql hasn't been run yet: just behave like a single-profile app
    console.warn('Could not load family profiles', error.message);
    return [self];
  }
  return [self, ...(data ?? []).map((p: any) => ({ id: p.ProfileUserId, name: p.DisplayName, isSelf: false }))];
}

function randomString(length: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Creates a real auth user for the family member (so admins can give them an obligation),
// then links it to the current user. Nobody logs in to it; the parent switches into it.
export async function createSubAccount(owner: User, firstname: string, lastname: string): Promise<Profile> {
  const first = firstname.trim();
  const last = lastname.trim();
  if (!first || !last) throw new Error('First and Last name are required.');
  if (!owner.email) throw new Error('Your account has no email address.');

  // parent+firstname@domain (parent+firstname2, 3, ... if that address is already taken)
  const [local, domain] = owner.email.split('@');
  const nameTag = first.toLowerCase().replace(/[^a-z0-9]/g, '') || 'family';
  const displayName = `${first} ${last}`;

  const temp = createEphemeralClient();
  let data: Awaited<ReturnType<typeof temp.auth.signUp>>['data'] | null = null;
  for (let attempt = 1; attempt <= 10 && !data; attempt++) {
    const email = `${local.split('+')[0]}+${nameTag}${attempt === 1 ? '' : attempt}@${domain}`;
    const result = await temp.auth.signUp({
      email,
      password: randomString(32),
      options: {
        data: { display_name: displayName, firstname: first, lastname: last, parent_id: owner.id, is_sub_account: true },
      },
    });
    const taken = result.error
      ? result.error.code === 'user_already_exists' || /already (been )?registered/i.test(result.error.message)
      : result.data.user?.identities?.length === 0; // confirmation-on projects hide duplicates this way
    if (result.error && !taken) throw new Error(result.error.message);
    if (!taken) data = result.data;
  }
  if (!data) throw new Error('Could not create the profile. Try a different name.');
  const childId = data.user?.id;
  if (!childId) throw new Error('Could not create the profile.');

  const { error: linkError } = await supabase.rpc('link_sub_account', { child_id: childId });
  if (linkError) throw new Error(linkError.message);
  return { id: childId, name: displayName, isSelf: false };
}

export async function deleteSubAccount(profileId: string) {
  const { error } = await supabase.rpc('delete_sub_account', { child_id: profileId });
  if (error) throw new Error(error.message);
}
