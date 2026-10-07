import { sendPasswordReset } from '@/utils/authutil';
import { showAlert } from '@/components/Dialog';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import FormInput from '@/components/FormInput';
import AuthLink from '@/components/AuthLink';

export default function ForgotPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    try {
      setSending(true);
      // Supabase can take a long time to hand the email to its mail server. Validation and rate-limit
      // errors come back quickly, so after a few seconds assume it's on its way instead of making the
      // user stare at a spinner (the request keeps going in the background).
      const request = sendPasswordReset(email);
      request.catch((e) => console.warn('Password reset request failed', e));
      await Promise.race([request, new Promise((resolve) => setTimeout(resolve, 4000))]);
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
          <Text style={styles.subtitle}>We’ll email you a link to reset your password.</Text>
          <FormInput
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />
          <Button title={sending ? 'Sending...' : 'Send Reset Link'} onPress={submit} disabled={sending} style={{ marginTop: 20, width: '100%' }} />
          <AuthLink action="Back to log in" onPress={() => router.replace('/login')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#64748b', textAlign: 'center', marginBottom: 28 },
});
