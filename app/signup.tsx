import { handleSignUp } from '@/utils/authutil';
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
                        placeholderTextColor="#777"
                        autoCapitalize="words"
                        onChangeText={setFirstname}
                        value={firstname}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#777"
                        autoCapitalize="words"
                        onChangeText={setLastname}
                        value={lastname}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#777"
                        autoCapitalize="none"
                        onChangeText={setEmail}
                        value={email}
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#777"
                        onChangeText={setPassword}
                        value={password}
                    />

                    <TouchableOpacity style={styles.button} onPress={async () => {
                        try {
                            setLoading(true);
                            await handleSignUp(email, password, firstname, lastname);
                            router.replace('/login');
                        } catch (error: Error | any) {
                            Alert.alert('Sign Up failed', error.message);
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
    input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginVertical: 8 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    link: { color: '#007AFF', marginTop: 20 },
});
