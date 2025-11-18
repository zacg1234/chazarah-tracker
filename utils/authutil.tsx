import { supabase } from '../services/supabaseClient';

  // 🔹 Logout handler
export async function handleLogout() {
    try {
        await supabase.auth.signOut();
    } catch (error: Error | any) {
        throw new Error(error.message);
    }
}

export async function handleLogin(email: string, password: string, setLoading?: (loading: boolean) => void) {
    setLoading?.(true);

    try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            throw new Error(error.message);
        }

    } catch (error: Error | any) {
        throw new Error(error.message);
    } finally {
        setLoading?.(false);
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

    try {
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
                throw new Error(error.message);
            }
    } catch (Error: Error | any) {
        throw new Error(Error.message);
    }
};

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
    } catch (error: Error | any) {
        throw new Error(error.message);
    } finally {
        setLoading?.(false);
    }
}



