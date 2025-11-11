import { handleLogin } from '@/utils/authutil';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
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
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            // secureTextEntry
            onChangeText={setPassword}
            value={password}
          />

          <TouchableOpacity style={styles.button} onPress={async () => await handleLogin(email.trim(), password, router, setLoading)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
          </TouchableOpacity>

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
  logo: { width: 320, height: 60, marginBottom: 4 }, // ensure the image is visible
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 20, color: '#b39d0eff' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginVertical: 8 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, width: '100%', alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  link: { color: '#007AFF', marginTop: 20 },
});
