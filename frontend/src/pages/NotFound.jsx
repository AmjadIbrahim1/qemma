// frontend/src/pages/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { HomeOutlined } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <Typography
          variant="h1"
          fontWeight={900}
          fontFamily="Cairo, sans-serif"
          sx={{
            fontSize: '8rem',
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          404
        </Typography>

        <Typography variant="h4" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
          الصفحة غير موجودة
        </Typography>

        <Typography variant="body1" color="text.secondary" fontFamily="Cairo, sans-serif" sx={{ mb: 4 }}>
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<HomeOutlined />}
          onClick={() => navigate('/')}
          disableElevation
          sx={{
            fontFamily: 'Cairo, sans-serif',
            fontWeight: 900,
            borderRadius: 2,
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
            },
          }}
        >
          العودة للرئيسية
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;