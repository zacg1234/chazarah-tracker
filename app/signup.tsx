import { EmailAlreadyUsedError, handleSignUp } from '@/utils/authutil';
import { showAlert } from '@/components/Dialog';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import FormInput from '@/components/FormInput';
import AuthLink from '@/components/AuthLink';

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

                    <FormInput
                        placeholder="First Name"
                        autoCapitalize="words"
                        onChangeText={setFirstname}
                        value={firstname}
                    />

                    <FormInput
                        placeholder="Last Name"
                        autoCapitalize="words"
                        onChangeText={setLastname}
                        value={lastname}
                    />

                    <FormInput
                        placeholder="Email"
                        autoCapitalize="none"
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                    />

                    <FormInput
                        placeholder="Password"
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
                    }} disabled={loading} style={{ marginTop: 20, width: '100%' }} />

                    <AuthLink lead="Already have an account?" action="Log in" onPress={() => router.push('/login')} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { width: '90%', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
});
