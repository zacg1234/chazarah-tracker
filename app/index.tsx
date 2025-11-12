import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Redirect href={user ? '/(tabs)/chazarah' : '/login'} />;
}
