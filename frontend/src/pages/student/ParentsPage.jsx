// frontend/src/pages/student/ParentsPage.jsx
// ✅ صفحة إدارة أولياء الأمور - للطالب لعرض وتفعيل ولي الأمر المرتبط عبر Stripe

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import API from '../../services/api';
import {
  Container, Box, Typography, Card, CardContent, Button, IconButton,
  Avatar, Chip, CircularProgress, Alert,
} from '@mui/material';
import {
  FamilyRestroom, CheckCircle, Cancel, Email, AccessTime,
  ArrowBack, CreditCard, Lock,
} from '@mui/icons-material';

const ParentsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const textPrimary   = darkMode ? '#f1f5f9' : '#1e293b';
  const textSecondary = darkMode ? '#94a3b8'  : '#64748b';
  const cardBg        = darkMode ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.90)';
  const borderColor   = darkMode ? 'rgba(51, 65, 85, 0.5)'  : 'rgba(15, 23, 42, 0.10)';

  // ── Check for success param in URL (after CheckoutPage redirect) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activated = params.get('activation_success');
    if (activated === 'true') {
      window.history.replaceState({}, document.title, '/student/parents');
      API.get('/students/parents').then(res => {
        setParents(res.data?.data || []);
      }).catch(() => {});
    }
  }, []);

  // ── Fetch only UNACTIVATED parents ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await API.get('/students/parents');
        setParents(res.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'فشل تحميل أولياء الأمور');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Activate → navigate to CheckoutPage ───────────────────
  const handleActivate = (parent) => {
    navigate('/checkout', {
      state: {
        itemType: 'parent_activation',
        item: {
          id: parent.id,
          title: `تفعيل ولي الأمر: ${parent.name}`,
          price: 500,
        },
      },
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', pb: 6 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #db2777 0%, #be185d 55%, #9d174d 100%)',
        color: 'white', py: 3, px: 2,
      }}>
        <Container maxWidth="md">
          <IconButton onClick={() => window.history.back()}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', mb: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FamilyRestroom sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif">
                إدارة أولياء الأمور
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }} fontFamily="Cairo, sans-serif">
                قم بتفعيل ولي الأمر المرتبط بحسابك
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif', borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} />
            <Typography fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: textSecondary }}>
              جاري تحميل أولياء الأمور...
            </Typography>
          </Box>
        ) : parents.length === 0 ? (
          /* Empty state */
          <Card sx={{ textAlign: 'center', py: 8, px: 4, border: '1px solid', borderColor, bgcolor: cardBg, borderRadius: 3 }}>
            <FamilyRestroom sx={{ fontSize: 80, color: darkMode ? '#334155' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 1 }}>
              لا يوجد أولياء أمور مرتبطون بعد
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, maxWidth: 400, mx: 'auto' }}>
              عندما يقوم ولي أمر بالتسجيل وربط حسابه بحسابك، سيظهر هنا لتتمكن من تفعيله
            </Typography>
          </Card>
        ) : (
          /* ── Single-column list ── */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {parents.map((parent) => (
              <Card key={parent.id} sx={{
                border: '1px solid',
                borderColor: parent.isActivated ? '#059669' : borderColor,
                bgcolor: cardBg, borderRadius: 3, overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}>
                {/* Status bar */}
                <Box sx={{
                  height: 4,
                  background: parent.isActivated
                    ? 'linear-gradient(135deg, #059669, #10b981)'
                    : 'linear-gradient(135deg, #94a3b8, #64748b)',
                }} />

                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                  {/* Avatar + name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flex: 1, minWidth: 200 }}>
                    <Avatar sx={{
                      width: 56, height: 56,
                      background: parent.isActivated
                        ? 'linear-gradient(135deg, #059669, #10b981)'
                        : 'linear-gradient(135deg, #94a3b8, #64748b)',
                      color: 'white', fontWeight: 900, fontSize: '1.3rem',
                    }}>
                      {parent.name?.charAt(0) || 'و'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                        {parent.name}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#db2777' }}>
                        @{parent.username}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {parent.isActivated ? (
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="مفعل" size="small"
                            sx={{ bgcolor: '#d1fae5', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
                        ) : (
                          <Chip icon={<Cancel sx={{ fontSize: 14 }} />} label="غير مفعل" size="small"
                            sx={{ bgcolor: '#fee2e2', color: '#ef4444', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Details */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 2, minWidth: 250 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16, color: textSecondary }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        {parent.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime sx={{ fontSize: 16, color: textSecondary }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        {formatDate(parent.linkedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Action */}
                  <Box sx={{ minWidth: 180 }}>
                    {parent.isActivated ? (
                      <Chip label="✅ مفعل" sx={{ bgcolor: '#d1fae5', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.85rem', py: 2, width: '100%' }} />
                    ) : (
                      <Button
                        variant="contained" size="large" fullWidth
                        startIcon={<CreditCard />}
                        onClick={() => handleActivate(parent)}
                        disableElevation
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 900,
                          py: 1.5, borderRadius: 2,
                          background: 'linear-gradient(135deg, #db2777, #be185d)',
                          '&:hover': { background: 'linear-gradient(135deg, #be185d, #9d174d)' },
                        }}
                      >
                        {'تفعيل - 500 جنيه'}
                      </Button>
                    )}
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        )}

        {/* Info card */}
        <Card sx={{ mt: 4, p: 3, border: '1px solid', borderColor, bgcolor: cardBg, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Lock sx={{ color: '#db2777', fontSize: 28, mt: 0.5 }} />
            <Box>
              <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 1 }}>
                🔒 معلومات التفعيل
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, lineHeight: 1.8 }}>
                • ولي الأمر لا يملك أي صلاحية لمشاهدة بياناتك حتى يتم تفعيله من قبلك.<br />
                • تكلفة التفعيل 500 جنيه مصري تُدفع مرة واحدة لكل ولي أمر.<br />
                • الدفع يتم عبر بطاقة ائتمان / خصم فقط (Visa, MasterCard).<br />
                • بعد الدفع، يتم تفعيل ولي الأمر فوراً ويحصل على صلاحية متابعة بياناتك.
              </Typography>
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default ParentsPage;
