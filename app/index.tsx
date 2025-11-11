import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect the root path to the login screen. Change to '/(tabs)/chazarah' if you prefer landing on tabs.
  return <Redirect href="/login" />;
}
