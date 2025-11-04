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
            router.replace('/chazarah');
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
