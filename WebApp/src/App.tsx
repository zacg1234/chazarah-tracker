import type React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AppDataProvider, AuthProvider, useAuth } from './providers';
import ChartPage from './pages/ChartPage';
import Chazarah from './pages/Chazarah';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Obligation from './pages/Obligation';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import Sessions from './pages/Sessions';
import Signup from './pages/Signup';

function Protected({ children }: { children: React.JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/chart" element={<ChartPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Authenticated app */}
        <Route
          element={
            <Protected>
              <AppDataProvider>
                <Layout />
              </AppDataProvider>
            </Protected>
          }
        >
          <Route path="/chazarah" element={<Chazarah />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/obligation" element={<Obligation />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/chazarah" replace />} />
      </Routes>
    </AuthProvider>
  );
}
