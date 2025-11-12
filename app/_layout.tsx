import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // could render splash/loading here
  }

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
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar style="dark" />
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
