import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/components/Dialog';
import { setNewPassword } from '@/utils/authutil';
import { inputStyle } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import { Text, TextInput } from '@/components/Text';

// Landing screen for the link in the password-reset email (chazarahtracker://reset-password#...).
// AuthProvider turns the link into a recovery session; here the user picks a new password.
export default function ResetPassword() {
  const router = useRouter();
  const { user, recovery, recoveryError, endRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (password !== confirm) {
      showAlert('Passwords do not match', 'Please enter the same password twice.');
      return;
    }
    try {
      setSaving(true);
      await setNewPassword(password);
      await endRecovery();
      showAlert('Password updated', 'Log in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error: Error | any) {
      showAlert('Could not update password', error?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // Link opened but not (yet) turned into a recovery session
  if (!recovery || !user) {
    return (
      <View style={styles.center}>
        {recoveryError ? (
          <>
            <Text style={styles.title}>Link expired</Text>
            <Text style={styles.subtitle}>{recoveryError}</Text>
            <Button title={'Request a new link'} onPress={() => router.replace('/forgot-password')} />
          </>
        ) : (
          <ActivityIndicator />
        )}
        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.link}>Back to log in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Choose a new password</Text>
          <Text style={styles.subtitle}>Enter a new password for your account.</Text>
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
          />
          <Button title={saving ? 'Saving...' : 'Update Password'} onPress={submit} disabled={saving} />
          <TouchableOpacity onPress={endRecovery}>
            <Text style={styles.link}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 16 },
  input: inputStyle,
  link: { color: '#2563eb', marginTop: 20 },
});
