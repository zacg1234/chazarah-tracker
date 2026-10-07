import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading, recovery } = useAuth();
  if (loading || recovery) return null;
  return <Redirect href={user ? '/(tabs)/chazarah' : '/login'} />;
}
