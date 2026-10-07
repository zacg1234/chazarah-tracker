import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/components/Dialog';
import { handleLogin } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import FormInput from '@/components/FormInput';
import AuthLink from '@/components/AuthLink';

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
          <FormInput
            placeholder="Email"
            autoCapitalize="none"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoComplete="email"
            autoCorrect={false}
          />
          <FormInput
            placeholder="Password"
            onChangeText={setPassword}
            value={password}
            secureToggle
            autoCapitalize="none"
            autoComplete="current-password"
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
            disabled={loading} style={{ width: '100%' }} />
          <AuthLink lead="Don’t have an account?" action="Sign up" onPress={() => router.push('/signup')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { width: '90%', alignItems: 'center' },
  logo: { width: 320, height: 60, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32, marginTop: 24, color: '#b39d0e' },
  forgotWrap: { alignSelf: 'flex-end', paddingVertical: 10, marginTop: 4, marginBottom: 16 },
  forgotText: { color: '#2563eb', fontSize: 14 },
});