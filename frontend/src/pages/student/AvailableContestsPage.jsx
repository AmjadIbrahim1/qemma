// frontend/src/pages/student/AvailableContestsPage.jsx
// ✅ NEW (contests feature): Real list of contests the student can participate in.
// Replaces the mock-based ContestsPage.jsx for the participation flow.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Card, CardContent, Button, Chip,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import { ArrowBack, EmojiEvents, Timer, School, PlayArrow, CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import contestsService from '../../services/contests.service';
import { STREAM_LABELS, CONTEST_DIFFICULTY } from '../../utils/constants';

const AvailableContestsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contests, setContests] = useState([]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await contestsService.getAvailableContests();
      setContests(res.data?.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تحميل المسابقات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContests(); }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={56} sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/dashboard')}
          sx={{ mb: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : 'inherit' }}>
          العودة للوحة التحكم
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ width: 50, height: 50, borderRadius: 2, background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <EmojiEvents />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
              المسابقات المتاحة
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
              المسابقات النشطة الآن التي يمكنك المشاركة فيها
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>}

        {contests.length === 0 ? (
          <Alert severity="info" sx={{ fontFamily: 'Cairo, sans-serif' }}>
            لا توجد مسابقات نشطة متاحة لك حالياً. تأكد من أنك طالب بالصف الثالث الثانوي وأن قسمك الدراسي مطابق.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {contests.map((c) => {
              const diff = CONTEST_DIFFICULTY[c.difficulty] || { label: c.difficulty, color: '#64748b' };
              const submitted = c.hasSubmitted;
              return (
                <Grid item xs={12} md={6} key={c.id}>
                  <Card elevation={0} sx={{
                    border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                    bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, '&:hover': { boxShadow: 3 },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}>
                          {c.title}
                        </Typography>
                        <Chip label={diff.label} size="small" sx={{ bgcolor: diff.color, color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip icon={<School sx={{ fontSize: 16 }} />} label={STREAM_LABELS[c.stream] || c.stream} size="small" variant="outlined"
                          sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Chip icon={<Timer sx={{ fontSize: 16 }} />} label={`${c.duration} دقيقة`} size="small" variant="outlined"
                          sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Chip label={`${c.questionCount} سؤال`} size="small" variant="outlined"
                          sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
                      </Box>

                      <Button fullWidth variant="contained"
                        startIcon={submitted ? <CheckCircle /> : <PlayArrow />}
                        onClick={() => navigate(`/student/contests/${c.id}/take`)}
                        disabled={submitted}
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2,
                          background: submitted ? (darkMode ? '#334155' : '#e5e7eb') : 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)',
                          color: submitted ? (darkMode ? '#94a3b8' : '#64748b') : '#fff',
                        }}>
                        {submitted ? 'تم التقديم' : 'ابدأ المسابقة'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default AvailableContestsPage;
