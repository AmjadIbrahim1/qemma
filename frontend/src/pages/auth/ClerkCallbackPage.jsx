// File: frontend/src/pages/auth/ClerkCallbackPage.jsx
// Purpose: Login callback — auto-assigns default role and DOES NOT show role-selection UI

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  Container,
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
const ClerkCallbackPage = () => {
  const navigate = useNavigate();
  const { loginWithClerk } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Default role for the login flow (no UI)
  const DEFAULT_ROLE = 'student';

  const [step, setStep] = useState('loading');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Clear any leftover backend token on mount
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        if (!isLoaded) return;
        if (!clerkUser) throw new Error('No Clerk user found');

        const existingRole = clerkUser.publicMetadata?.role;
        const existingDivision = clerkUser.publicMetadata?.division;

        if (existingRole) {
          await handleLogin(clerkUser.id, existingRole, existingDivision);
        } else {
          // Auto assign default role and login immediately
          await handleLogin(clerkUser.id, DEFAULT_ROLE, existingDivision);
        }
      } catch (err) {
        console.error('Clerk callback (login) error:', err);
        setError(err.message || 'فشل تسجيل الدخول');
        setStep('error');
      }
    };

    checkUser();
  }, [clerkUser, isLoaded]);

  const getDashboardRoute = (role) => {
    if (role === 'assistant_teacher' || role === 'teacher') return '/teacher/dashboard';
    if (role === 'parent') return '/parent/dashboard';
    return '/student/dashboard';
  };

  const doRedirect = useCallback((role) => {
    const route = getDashboardRoute(role);
    navigate(route, { replace: true });
  }, [navigate]);

  const handleLogin = async (clerkUserId, role = 'student', division = null) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      setStep('processing');

      // try to save metadata back to Clerk (best-effort)
      try {
        const meta = { role };
        if (division) meta.division = division;
        await clerkUser.update({ publicMetadata: meta });
      } catch (metaErr) {
        console.warn('Could not save metadata to Clerk:', metaErr);
      }

      // login to backend
      await loginWithClerk(clerkUserId, role, division);

      doRedirect(role);
    } catch (err) {
      console.error('Login error (login flow):', err);

      // Existing local account — redirect to login page
      if (err.response?.data?.existingAccount) {
        navigate('/login', { replace: true });
        return;
      }

      // If backend says exists, try to re-login
      if (err.response?.status === 409 || err.message?.includes('already exists')) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          await loginWithClerk(clerkUserId, role, division);
          navigate('/', { replace: true });
          return;
        } catch (retryErr) {
          console.error('Retry login failed:', retryErr);
        }
      }

      setError(err.response?.data?.message || err.message || 'فشل تسجيل الدخول');
      setStep('error');
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Cancel error:', err);
      window.location.href = '/login';
    }
  };

  if (step === 'error') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h6" color="error" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            ❌ {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif" sx={{ mb: 3 }}>
            يرجى المحاولة مرة أخرى
          </Typography>
          <Button
            variant="contained"
            onClick={handleCancel}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
          >
            الرجوع لتسجيل الدخول
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" fontFamily="Cairo, sans-serif">
          {step === 'loading' ? 'جاري التحميل...' : 'جاري تسجيل الدخول...'}
        </Typography>
      </Box>
    </Container>
  );
};

export default ClerkCallbackPage;