import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { FamilyProvider } from '@/providers/FamilyProvider';
import ResetPassword from './reset-password';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootNavigator() {
  const { user, loading, recovery } = useAuth();

  if (loading) {
    return null; // could render splash/loading here
  }

  // Resetting a password from an emailed link: show only the reset screen. It's rendered directly
  // (not as a route) because the recovery session counts as "logged in", and routes like the index
  // redirect or the login screen would otherwise send the user straight into the app.
  if (recovery) return <ResetPassword />;

  // If authenticated, only register tabs (and modal routes) so we don't land on signup
  if (user) {
    return (
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} initialRouteName="(tabs)">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal/profile" />
      </Stack>
    );
  }

  // If not authenticated, show auth flow only
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} initialRouteName="login">
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FamilyProvider>
          <ThemeProvider value={DefaultTheme}>
            <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
            <RootNavigator />
          </ThemeProvider>
        </FamilyProvider>
      </AuthProvider>
    </SafeAreaProvider> 
  );
}
