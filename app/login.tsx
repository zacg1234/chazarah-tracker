import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/components/Dialog';
import { handleLogin } from '@/utils/authutil';
import { inputStyle } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import { Text, TextInput } from '@/components/Text';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, recovery } = useAuth();

  useEffect(() => {
    if (!authLoading && user && !recovery) {
      router.replace('/(tabs)/chazarah');
    }
  }, [authLoading, user, recovery]);

  if (authLoading || user) {
    return null; // let redirect happen or wait for auth resolution
  }

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
          <Image
            source={require('@/assets/images/AALogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>CHAZARAH TRACKER</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCorrect={false}
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity
            style={styles.forgotWrap}
            onPress={() => router.push({ pathname: '/forgot-password' as any, params: { email: email.trim() } })}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
          <Button title={loading ? 'Logging in...' : 'Log In'} onPress={async () => {
              try {
                await handleLogin(email.trim(), password, setLoading)
                router.replace('/(tabs)/chazarah');
              } catch (error: Error | any) {
                showAlert('Login failed', error?.message ?? 'Something went wrong.');
              }
            }}
            disabled={loading} />
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.link}>Don’t have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', alignItems: 'center' },
  logo: { width: 320, height: 60, marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25, marginTop: 20, color: '#b39d0e' },
  input: inputStyle,
  forgotWrap: { alignSelf: 'flex-end', marginTop: 2 },
  forgotText: { color: '#2563eb', fontSize: 14 },
  link: { color: '#2563eb', marginTop: 20 },
});