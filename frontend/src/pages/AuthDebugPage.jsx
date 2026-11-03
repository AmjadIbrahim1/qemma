// frontend/src/pages/AuthDebugPage.jsx
import { useAuth } from '../hooks/useAuth';
import { Container, Box, Typography, Button, Card, CardContent, Chip } from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Refresh,
  Delete,
  Login,
  Logout
} from '@mui/icons-material';

const AuthDebugPage = () => {
  const { user, logout } = useAuth();

  const checkStorage = () => {
    const data = {
      localStorage: {
        token: localStorage.getItem('token') ? '✅ موجود' : '❌ غير موجود',
        user: localStorage.getItem('user') ? '✅ موجود' : '❌ غير موجود',
        allKeys: Object.keys(localStorage),
      },
      sessionStorage: {
        allKeys: Object.keys(sessionStorage),
        count: sessionStorage.length,
      },
      cookies: {
        all: document.cookie || 'لا يوجد',
      }
    };
    
    console.log('📊 Storage Check:', data);
    alert(JSON.stringify(data, null, 2));
  };

  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    alert('🧹 تم مسح كل البيانات!');
    window.location.reload();
  };

  const testLogout = async () => {
    console.log('🧪 Testing logout...');
    await logout();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        fontWeight={900}
        fontFamily="Cairo, sans-serif"
        sx={{ mb: 4, textAlign: 'center' }}
      >
        🔧 صفحة اختبار المصادقة
      </Typography>

      {/* User Status */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            حالة المستخدم
          </Typography>
          
          {user ? (
            <Box>
              <Chip 
                icon={<CheckCircle />} 
                label="مسجل دخول" 
                color="success" 
                sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}
              />
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" fontFamily="Cairo, sans-serif">
                  <strong>الاسم:</strong> {user.name}
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif">
                  <strong>البريد:</strong> {user.email}
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif">
                  <strong>النوع:</strong> {user.role}
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif">
                  <strong>المزود:</strong> {user.authProvider}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Chip 
              icon={<Cancel />} 
              label="غير مسجل" 
              color="error" 
              sx={{ fontFamily: 'Cairo, sans-serif' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            بيانات التخزين
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              <strong>Token:</strong> {localStorage.getItem('token') ? '✅ موجود' : '❌ غير موجود'}
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              <strong>User:</strong> {localStorage.getItem('user') ? '✅ موجود' : '❌ غير موجود'}
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              <strong>LocalStorage Keys:</strong> {Object.keys(localStorage).length}
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              <strong>SessionStorage Keys:</strong> {sessionStorage.length}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            الإجراءات
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkStorage}
              fullWidth
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
            >
              فحص التخزين (Console)
            </Button>

            {user && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Logout />}
                onClick={testLogout}
                fullWidth
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
              >
                اختبار Logout
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={clearAllStorage}
              fullWidth
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
            >
              مسح كل البيانات
            </Button>

            {!user && (
              <Button
                variant="contained"
                startIcon={<Login />}
                onClick={() => window.location.href = '/login'}
                fullWidth
                sx={{ 
                  fontFamily: 'Cairo, sans-serif', 
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
                }}
              >
                تسجيل الدخول
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mt: 3, borderRadius: 2, bgcolor: 'rgba(251, 191, 36, 0.1)' }}>
        <CardContent>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            📝 التعليمات
          </Typography>
          <Typography variant="body2" fontFamily="Cairo, sans-serif" component="div">
            <ol style={{ paddingRight: '1.5rem', margin: 0 }}>
              <li>سجل دخول بحساب جديد</li>
              <li>تحقق من أن البيانات موجودة</li>
              <li>اضغط "اختبار Logout"</li>
              <li>تأكد من مسح كل البيانات</li>
              <li>حاول تسجيل الدخول مرة أخرى</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AuthDebugPage;