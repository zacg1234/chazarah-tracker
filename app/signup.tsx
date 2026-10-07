import { EmailAlreadyUsedError, handleSignUp } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <Text style={styles.title}>Create Account</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                        onChangeText={setFirstname}
                        value={firstname}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                        onChangeText={setLastname}
                        value={lastname}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#94a3b8"
                        onChangeText={setPassword}
                        value={password}
                        autoCapitalize="none"
                        autoComplete="new-password"
                        autoCorrect={false}
                    />

                    <TouchableOpacity style={styles.button} onPress={async () => {
                        try {
                            setLoading(true);
                            await handleSignUp(email, password, firstname, lastname);
                            router.replace('/login');
                        } catch (error: Error | any) {
                            if (error instanceof EmailAlreadyUsedError) {
                                Alert.alert(
                                    'Email already in use',
                                    'That email is already being used for a different account.',
                                    [
                                        {
                                            text: 'Reset Password',
                                            onPress: () => router.push({ pathname: '/forgot-password' as any, params: { email: email.trim() } }),
                                        },
                                        { text: 'Close', style: 'cancel' },
                                    ]
                                );
                            } else {
                                Alert.alert('Sign Up failed', error.message);
                            }
                        } finally {
                            setLoading(false);
                        }
                    }} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.link}>Already have an account? Log in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { width: '90%', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 13, marginVertical: 6, backgroundColor: '#fff', color: '#0f172a', fontSize: 16 },
    button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    link: { color: '#2563eb', marginTop: 20 },
});
