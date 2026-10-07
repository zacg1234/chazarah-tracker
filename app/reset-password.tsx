import { useAuth } from '@/providers/AuthProvider';
import { setNewPassword } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
      Alert.alert('Passwords do not match', 'Please enter the same password twice.');
      return;
    }
    try {
      setSaving(true);
      await setNewPassword(password);
      await endRecovery();
      Alert.alert('Password updated', 'Log in with your new password.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error: Error | any) {
      Alert.alert('Could not update password', error?.message ?? 'Something went wrong.');
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
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/forgot-password')}>
              <Text style={styles.buttonText}>Request a new link</Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.button} onPress={submit} disabled={saving}>
            <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Update Password'}</Text>
          </TouchableOpacity>
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
  input: { width: '100%', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 13, marginVertical: 6, backgroundColor: '#fff', color: '#0f172a', fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  link: { color: '#2563eb', marginTop: 20 },
});
