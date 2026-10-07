import { inputStyle } from '@/constants/theme';
import { sendPasswordReset } from '@/utils/authutil';
import { showAlert } from '@/components/Dialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import { Text, TextInput } from '@/components/Text';

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    try {
      setSending(true);
      await sendPasswordReset(email);
      showAlert(
        'Check your email',
        `If an account exists for ${email.trim()}, a reset link is on its way. The link opens a page where you can choose a new password.`,
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: Error | any) {
      showAlert('Reset failed', error?.message ?? 'Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your email and we’ll send you a link to reset it.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
            placeholderTextColor="#94a3b8"
          />
          <Button title={sending ? 'Sending...' : 'Send Reset Link'} onPress={submit} disabled={sending} />
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.link}>Back to log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 16 },
  input: inputStyle,
  link: { color: '#2563eb', marginTop: 20 },
});
