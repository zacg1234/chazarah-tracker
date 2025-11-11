import type { Router } from 'expo-router';
import { Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';

  // 🔹 Logout handler
export async function handleLogout(router: Router) {
    await supabase.auth.signOut();
    router.replace('/login');
}

export async function handleLogin(email: string, password: string, router: Router, setLoading?: (loading: boolean) => void) {
    setLoading?.(true);

    try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            Alert.alert('Login Failed', error.message);
        } else {
            // Navigate into the tabs navigator explicitly
            router.replace('/(tabs)/chazarah');
        }
    } finally {
        setLoading?.(false);
    }
}


export async function handleSignUp(email: string, password: string, firstname: string, lastname: string, router: Router, setLoading?: (loading: boolean) => void) {
    setLoading?.(true);

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
                Alert.alert('Error', error.message);
                return;
            }

        Alert.alert('Success', 'Account created successfully!');
        router.replace('/login');
    } catch (err) {
        console.error('Unexpected signup error:', err);
        Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
        setLoading?.(false);
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
            Alert.alert('Error', 'No logged in user.');
            return { success: false };
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

        if (Object.keys(attributes).length === 0) {
            Alert.alert('No changes', 'Nothing to update.');
            return { success: true };
        }

        const { data: updated, error } = await supabase.auth.updateUser(attributes);
        if (error) {
            Alert.alert('Update Failed', error.message);
            return { success: false, error } as const;
        }

        Alert.alert('Success', 'Profile updated successfully.');
        
        return { success: true, user: updated?.user } as const;
    } catch (err: any) {
        console.error('Unexpected update error:', err);
        Alert.alert('Error', 'Something went wrong. Please try again.');
        return { success: false, error: err } as const;
    } finally {
        setLoading?.(false);
    }
}



