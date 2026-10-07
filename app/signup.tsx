import { EmailAlreadyUsedError, handleSignUp } from '@/utils/authutil';
import { showAlert } from '@/components/Dialog';
import { inputStyle } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import { Text, TextInput } from '@/components/Text';

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

                    <Button title={loading ? 'Signing up...' : 'Sign Up'} onPress={async () => {
                        try {
                            setLoading(true);
                            await handleSignUp(email, password, firstname, lastname);
                            router.replace('/login');
                        } catch (error: Error | any) {
                            if (error instanceof EmailAlreadyUsedError) {
                                showAlert(
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
                                showAlert('Sign Up failed', error.message);
                            }
                        } finally {
                            setLoading(false);
                        }
                    }} disabled={loading} />

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
    input: inputStyle,
    link: { color: '#2563eb', marginTop: 20 },
});
