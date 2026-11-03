// frontend/src/pages/TestBackend.jsx
import { useState, useEffect } from 'react';
import { Container, Box, Typography, Button, Paper, Chip } from '@mui/material';
import { CheckCircle, Error, Refresh } from '@mui/icons-material';
import api from '../services/api';

const TestBackend = () => {
  const [status, setStatus] = useState({
    backend: 'loading',
    database: 'loading',
    clerk: 'loading',
  });
  const [backendData, setBackendData] = useState(null);
  const [error, setError] = useState(null);

  const testConnection = async () => {
    setStatus({
      backend: 'loading',
      database: 'loading',
      clerk: 'loading',
    });
    setError(null);

    try {
      // Test 1: Backend API
      console.log('🧪 Testing backend connection...');
      const response = await api.get('/auth/test');
      console.log('✅ Backend response:', response.data);
      setBackendData(response.data);
      setStatus((prev) => ({ ...prev, backend: 'success' }));

      // Test 2: Database (implicit in the test endpoint)
      setStatus((prev) => ({ ...prev, database: 'success' }));

      // Test 3: Clerk (check if keys are set)
      const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      if (clerkKey && clerkKey.startsWith('pk_')) {
        setStatus((prev) => ({ ...prev, clerk: 'success' }));
      } else {
        setStatus((prev) => ({ ...prev, clerk: 'error' }));
      }
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err.message);
      setStatus({
        backend: 'error',
        database: 'error',
        clerk: 'unknown',
      });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      case 'loading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>;
      default:
        return <Error sx={{ color: 'warning.main' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'متصل';
      case 'error':
        return 'غير متصل';
      case 'loading':
        return 'جاري الفحص...';
      default:
        return 'غير معروف';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'loading':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography
        variant="h4"
        fontWeight={900}
        fontFamily="Cairo, sans-serif"
        textAlign="center"
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        اختبار الاتصال بالخادم
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Backend Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusIcon(status.backend)}
              <Typography variant="h6" fontFamily="Cairo, sans-serif">
                خادم الباك إند
              </Typography>
            </Box>
            <Chip
              label={getStatusText(status.backend)}
              color={getStatusColor(status.backend)}
              sx={{ fontFamily: 'Cairo, sans-serif' }}
            />
          </Box>

          {/* Database Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusIcon(status.database)}
              <Typography variant="h6" fontFamily="Cairo, sans-serif">
                قاعدة البيانات
              </Typography>
            </Box>
            <Chip
              label={getStatusText(status.database)}
              color={getStatusColor(status.database)}
              sx={{ fontFamily: 'Cairo, sans-serif' }}
            />
          </Box>

          {/* Clerk Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusIcon(status.clerk)}
              <Typography variant="h6" fontFamily="Cairo, sans-serif">
                Clerk (Google Sign-in)
              </Typography>
            </Box>
            <Chip
              label={getStatusText(status.clerk)}
              color={getStatusColor(status.clerk)}
              sx={{ fontFamily: 'Cairo, sans-serif' }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Backend Response Data */}
      {backendData && (
        <Paper sx={{ p: 4, borderRadius: 3, mb: 3, bgcolor: 'rgba(37, 99, 235, 0.05)' }}>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            بيانات الخادم
          </Typography>
          <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
            {JSON.stringify(backendData, null, 2)}
          </Box>
        </Paper>
      )}

      {/* Error Message */}
      {error && (
        <Paper sx={{ p: 4, borderRadius: 3, mb: 3, bgcolor: 'rgba(239, 68, 68, 0.1)' }}>
          <Typography variant="h6" color="error" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            ❌ خطأ في الاتصال
          </Typography>
          <Typography variant="body1" fontFamily="Cairo, sans-serif">
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif" sx={{ mt: 2 }}>
            تأكد من تشغيل الباك إند على: http://localhost:5000
          </Typography>
        </Paper>
      )}

      {/* Refresh Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={testConnection}
        startIcon={<Refresh />}
        disableElevation
        sx={{
          fontFamily: 'Cairo, sans-serif',
          fontWeight: 900,
          borderRadius: 2,
          py: 1.5,
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
          },
        }}
      >
        إعادة الاختبار
      </Button>

      {/* Instructions */}
      <Paper sx={{ p: 4, borderRadius: 3, mt: 3, bgcolor: 'rgba(251, 191, 36, 0.1)' }}>
        <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
          📝 تعليمات
        </Typography>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" component="div">
          <ol style={{ marginTop: '0.5rem', paddingRight: '1.5rem' }}>
            <li>تأكد من تشغيل الباك إند: <code>cd backend && npm run dev</code></li>
            <li>تأكد من ملف .env في الفرونت إند يحتوي على:<br/>
              <code>VITE_API_URL=http://localhost:5000/api</code>
            </li>
            <li>تأكد من ملف .env في الباك إند يحتوي على:<br/>
              <code>CLERK_SECRET_KEY=sk_test_...</code>
            </li>
            <li>افتح Console في المتصفح للمزيد من المعلومات</li>
          </ol>
        </Typography>
      </Paper>
    </Container>
  );
};

export default TestBackend;