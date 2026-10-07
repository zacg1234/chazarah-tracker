import { supabase } from '../services/supabaseClient';
import { deleteSubAccount, getFamilyProfiles } from './profileutil';

  // 🔹 Logout handler
export async function handleLogout() {
    await supabase.auth.signOut();
}

export async function handleLogin(email: string, password: string, setLoading?: (loading: boolean) => void) {
    setLoading?.(true);

    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
    } finally {
        setLoading?.(false);
    }
}


// Thrown by handleSignUp when the email already belongs to an account
export class EmailAlreadyUsedError extends Error {
    constructor() {
        super('This email is already being used for a different account.');
        this.name = 'EmailAlreadyUsedError';
    }
}

export async function handleSignUp(email: string, password: string, firstname: string, lastname: string) {
    
    if (firstname.length === 0 || lastname.length === 0) {
        throw new Error('First and Last name are required.');
    }
 
    if (email.length === 0 || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }

    const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
            data: {
                display_name: `${firstname.trim()} ${lastname.trim()}`,
                firstname: firstname.trim(),
                lastname: lastname.trim(),
            },
            emailRedirectTo: undefined, // disables email confirmation
        }
    });

    if (error) {
        if (error.code === 'user_already_exists' || /already (been )?registered/i.test(error.message)) {
            throw new EmailAlreadyUsedError();
        }
        throw new Error(error.message);
    }
    // With email confirmation on, Supabase hides duplicates by returning a user with no identities
    if (data.user && data.user.identities?.length === 0) {
        throw new EmailAlreadyUsedError();
    }
};

export async function deleteAccount() {
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp.user) throw new Error('No logged in user.');
    const userId = userResp.user.id;

    // Every step is safe to repeat, so a failure partway just means "run it again". Say so instead of
    // leaving the user with a bare error from whichever step happened to fail.
    try {
        // Remove any sub-accounts (and their data) first
        for (const profile of await getFamilyProfiles(userResp.user)) {
            if (!profile.isSelf) await deleteSubAccount(profile.id);
        }

        // Delete all user-scoped table records
        for (const table of ['TblSession', 'TblObligation', 'TblPayment']) {
            const { error } = await supabase.from(table).delete().eq('UserId', userId);
            if (error) throw new Error(error.message);
        }

        // Delete the auth user via a SECURITY DEFINER RPC (see CLAUDE.md for required SQL)
        const { error: rpcError } = await supabase.rpc('delete_user');
        if (rpcError) throw new Error(rpcError.message);
    } catch (error: Error | any) {
        throw new Error(`Your account was only partly deleted. Please try again. (${error.message})`);
    }

    await supabase.auth.signOut();
}

export async function getLoggedInUser() {
  const currentUser = await supabase.auth.getUser();
  return currentUser.data.user;
}

// 🔹 Update the currently logged-in user's profile
// - Updates user_metadata: firstname, lastname, display_name
// - Updates auth user: email and/or password
export async function updateLoggedInUserProfile(
    params: {
        firstname?: string;
        lastname?: string;
        email?: string;
        password?: string;
    },
    setLoading?: (loading: boolean) => void
) {
    setLoading?.(true);
    try {
        // Ensure there is a logged-in user
        const { data: userResp, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userResp.user) {
            throw new Error('No logged in user.')
        }

        const attributes: {
            email?: string;
            password?: string;
            data?: Record<string, any>;
        } = {};

        // Prepare metadata updates
        const data: Record<string, any> = {};
        const first = params.firstname?.trim();
        const last = params.lastname?.trim();
        if (first !== undefined) data.firstname = first;
        if (last !== undefined) data.lastname = last;
        if (first !== undefined || last !== undefined) {
            const display = `${first ?? ''} ${last ?? ''}`.trim();
            if (display) data.display_name = display;
        }
        if (Object.keys(data).length > 0) attributes.data = data;

        // Prepare auth updates
        if (params.email && params.email.trim()) attributes.email = params.email.trim();
        if (params.password && params.password.length > 0) attributes.password = params.password;

        const { data: updated, error } = await supabase.auth.updateUser(attributes);
        if (error) {
            throw new Error(error.message)
        }
        
        return { success: true, user: updated?.user } as const;
    } finally {
        setLoading?.(false);
    }
}




// 🔹 Send a password reset email. The link lands on /reset-password.
export async function sendPasswordReset(email: string) {
    if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
}

// 🔹 Set a new password for the user in the current (recovery) session
export async function setNewPassword(password: string) {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
}
