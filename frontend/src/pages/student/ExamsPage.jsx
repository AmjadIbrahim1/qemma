// frontend/src/pages/student/ExamsPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Button,
  IconButton,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Quiz as QuizIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarTodayIcon,
  Visibility as VisibilityIcon,
  EmojiEvents as EmojiEventsIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import examsService from '../../services/exams.service';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const POLL_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#db2777',
  '#f59e0b',
  '#0891b2',
  '#dc2626',
  '#0ea5e9',
];

const getExamColor = (index) => POLL_COLORS[index % POLL_COLORS.length];

const formatDateArabic = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ar-EG', {
      year:     'numeric',
      month:    'long',
      day:      'numeric',
      hour:     '2-digit',
      minute:   '2-digit',
      timeZone: 'Africa/Cairo',
    });
  } catch {
    return '—';
  }
};

const isExamCurrentlyAvailable = (exam) => {
  if (!exam.isPublished) return false;
  const now  = new Date();
  const from = exam.availableFrom ? new Date(exam.availableFrom) : null;
  const to   = exam.availableTo   ? new Date(exam.availableTo)   : null;
  return (!from || from <= now) && (!to || to >= now);
};

const getGradeColor = (grade) => {
  if (grade >= 90) return '#059669';
  if (grade >= 80) return '#2563eb';
  if (grade >= 70) return '#7c3aed';
  if (grade >= 60) return '#f59e0b';
  return '#ef4444';
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ExamsPage = () => {
  const navigate    = useNavigate();
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [exams,     setExams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await examsService.getStudentExams();

      // Handle all possible response shapes:
      // { data: { success, data: [...] } }  ← axios wraps in .data, backend wraps in { data }
      // { data: [...] }                      ← axios wraps, backend returns array directly
      const raw  = response?.data;
      const list = raw?.data ?? raw;

      setExams(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      // 404 on student profile means student has no profile yet — treat as empty, not error
      if (err.response?.status === 404) {
        setExams([]);
      } else {
        setError('فشل تحميل الاختبارات. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // ── Derived state ────────────────────────────────────────────────
  const upcomingExams  = exams.filter((e) => !e.hasCompleted && isExamCurrentlyAvailable(e));
  const futureExams    = exams.filter((e) => !e.hasCompleted && !isExamCurrentlyAvailable(e) && e.isPublished);
  const completedExams = exams.filter((e) => e.hasCompleted);

  const upcomingTotal = upcomingExams.length + futureExams.length;
  const avgGrade      = completedExams.length
    ? Math.round(
        completedExams.reduce((sum, e) => sum + (e.myAttempt?.score ?? 0), 0) /
          completedExams.length
      )
    : null;

  const allUpcomingSorted = [...upcomingExams, ...futureExams].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>

      {/* ── HEADER ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
          color:      'white',
          py:         4,
          px:         2,
          mb:         3,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate('/student/dashboard')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <ArrowForwardIcon />
            </IconButton>
            <QuizIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
              الاختبارات
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {[
              { icon: <CalendarTodayIcon sx={{ mb: 1 }} />, value: upcomingTotal,           label: 'اختبارات قادمة'   },
              { icon: <CheckCircleIcon   sx={{ mb: 1 }} />, value: completedExams.length,   label: 'اختبارات مكتملة'  },
              { icon: <TrendingUpIcon    sx={{ mb: 1 }} />, value: avgGrade !== null ? `${avgGrade}%` : '—', label: 'متوسط الدرجات' },
              { icon: <EmojiEventsIcon   sx={{ mb: 1 }} />, value: exams.length,            label: 'إجمالي الاختبارات' },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  {stat.icon}
                  <Typography variant="h4" fontWeight={900}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">

        {/* ── TABS ── */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 16 },
          }}
        >
          <Tab icon={<CalendarTodayIcon />} iconPosition="start" label={`الاختبارات (${exams.length})`} />
          <Tab icon={<CheckCircleIcon   />} iconPosition="start" label={`تم أداؤها (${completedExams.length})`} />
        </Tabs>

        {/* ── LOADING ── */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#7c3aed' }} />
          </Box>
        )}

        {/* ── ERROR ── */}
        {!loading && error && (
          <Alert
            severity="error"
            sx={{ borderRadius: 3, fontFamily: 'Cairo, sans-serif', mb: 3 }}
            action={
              <IconButton size="small" onClick={fetchExams} color="inherit">
                <RefreshIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* ── EMPTY (no exams at all) ── */}
        {!loading && !error && exams.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <QuizIcon sx={{ fontSize: 64, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
            <Typography
              variant="h6"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
            >
              لا توجد اختبارات متاحة حالياً
            </Typography>
            <Typography
              variant="body2"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 1 }}
            >
              سيتم عرض الاختبارات الخاصة بكورساتك هنا عند إضافتها من قبل المدرسين
            </Typography>
          </Box>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 0 — UPCOMING / ALL EXAMS
        ══════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === 0 && exams.length > 0 && (
          <Grid container spacing={3}>
            {allUpcomingSorted.length > 0 ? (
              allUpcomingSorted.map((exam, index) => {
                const color     = getExamColor(index);
                const available = isExamCurrentlyAvailable(exam);
                return (
                  <Grid item xs={12} md={6} lg={4} key={exam.id}>
                    <ExamCard
                      exam={exam}
                      color={color}
                      available={available}
                      darkMode={darkMode}
                      onStart={() => navigate(`/student/exam/${exam.id}/start`)}
                    />
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 3, fontFamily: 'Cairo, sans-serif' }}>
                  لا توجد اختبارات قادمة حالياً
                </Alert>
              </Grid>
            )}
          </Grid>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 1 — COMPLETED EXAMS
        ══════════════════════════════════════════════════════════ */}
        {!loading && !error && activeTab === 1 && (
          <Grid container spacing={3}>
            {completedExams.length > 0 ? (
              completedExams.map((exam) => (
                <Grid item xs={12} md={6} lg={4} key={exam.id}>
                  <CompletedExamCard
                    exam={exam}
                    darkMode={darkMode}
                    onReview={() => navigate(`/student/exam/${exam.id}/review`)}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 3, fontFamily: 'Cairo, sans-serif' }}>
                  لم تقم بأداء أي اختبار بعد
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ExamCard = ({ exam, color, available, darkMode, onStart }) => (
  <Card
    elevation={0}
    sx={{
      border:      '1px solid',
      borderColor: darkMode ? '#334155' : '#e5e7eb',
      bgcolor:     darkMode ? '#1e293b' : 'white',
      borderRadius: 3,
      borderTop:   `4px solid ${color}`,
      transition:  'all 0.3s ease',
      '&:hover': {
        transform:  'translateY(-4px)',
        boxShadow:  darkMode
          ? '0 12px 30px rgba(0,0,0,0.3)'
          : '0 12px 30px rgba(0,0,0,0.1)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}15`, color }}>
          <QuizIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}
          >
            {exam.title}
          </Typography>
          {exam.courseTitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SchoolIcon sx={{ fontSize: 14, color: darkMode ? '#94a3b8' : '#64748b' }} />
              <Typography
                variant="caption"
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
              >
                {exam.courseTitle}
              </Typography>
            </Box>
          )}
        </Box>
        <Chip
          label={exam.isPublished ? 'منشور' : 'مسودة'}
          size="small"
          sx={{
            fontFamily: 'Cairo, sans-serif',
            fontWeight:  600,
            fontSize:    11,
            bgcolor:     exam.isPublished ? '#dcfce7' : '#fef3c7',
            color:       exam.isPublished ? '#059669' : '#f59e0b',
          }}
        />
      </Box>

      {/* Description */}
      {exam.description && (
        <Typography
          variant="body2"
          fontFamily="Cairo, sans-serif"
          sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}
        >
          {exam.description}
        </Typography>
      )}

      {/* Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
          <Typography
            variant="body2"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            {exam.durationMinutes || exam.duration} دقيقة • {exam.totalMarks} درجة
          </Typography>
        </Box>

        {exam.availableFrom && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
            <Typography
              variant="body2"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
            >
              {formatDateArabic(exam.availableFrom)}
              {exam.availableTo ? ` — ${formatDateArabic(exam.availableTo)}` : ''}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QuizIcon sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
          <Typography
            variant="body2"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
          >
            {exam.questionsCount} سؤال
          </Typography>
        </Box>
      </Box>

      {/* Action Button */}
      <Stack spacing={1.5}>
        {available ? (
          <Button
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={onStart}
            sx={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color:       'white',
              fontFamily:  'Cairo, sans-serif',
              fontWeight:  700,
              borderRadius: 2,
              py:          1.25,
              '&:hover': {
                background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              },
            }}
          >
            ابدأ الاختبار
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            sx={{
              borderColor: darkMode ? '#475569' : '#e5e7eb',
              color:       darkMode ? '#94a3b8' : '#64748b',
              fontFamily:  'Cairo, sans-serif',
              fontWeight:  600,
              borderRadius: 2,
              py:          1.25,
            }}
          >
            {!exam.isPublished
              ? 'الاختبار قيد الإعداد'
              : exam.availableFrom && new Date(exam.availableFrom) > new Date()
              ? 'سيُتاح قريباً'
              : 'غير متاح حالياً'}
          </Button>
        )}
      </Stack>
    </CardContent>
  </Card>
);

const CompletedExamCard = ({ exam, darkMode, onReview }) => {
  const score        = exam.myAttempt?.score ?? 0;
  const essaysPending = exam.myAttempt?.isPassed === null;
  const gradeColor   = getGradeColor(score);

  return (
    <Card
      elevation={0}
      sx={{
        border:      '1px solid',
        borderColor: darkMode ? '#334155' : '#e5e7eb',
        bgcolor:     darkMode ? '#1e293b' : 'white',
        borderRadius: 3,
        transition:  'all 0.3s ease',
        '&:hover': {
          transform:  'translateY(-4px)',
          boxShadow:  darkMode
            ? '0 12px 30px rgba(0,0,0,0.3)'
            : '0 12px 30px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}
            >
              {exam.title}
            </Typography>
            <Typography
              variant="body2"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
            >
              {exam.courseTitle}
              {exam.myAttempt?.submittedAt && ` • ${formatDateArabic(exam.myAttempt.submittedAt)}`}
            </Typography>
          </Box>

          {/* Score circle */}
          {essaysPending ? (
            <Box
              sx={{
                width:          60,
                height:         60,
                borderRadius:   '50%',
                bgcolor:        darkMode ? '#1e3a5f' : '#eff6ff',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}
            >
              <PendingIcon sx={{ color: '#2563eb', fontSize: 28 }} />
            </Box>
          ) : (
            <Box
              sx={{
                width:          60,
                height:         60,
                borderRadius:   '50%',
                bgcolor:        `${gradeColor}15`,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}
            >
              <Typography variant="h5" fontWeight={900} sx={{ color: gradeColor }}>
                {Math.round(score)}
              </Typography>
            </Box>
          )}
        </Box>

        {essaysPending && (
          <Chip
            icon={<PendingIcon sx={{ fontSize: 16 }} />}
            label="بانتظار التصحيح"
            size="small"
            sx={{
              bgcolor:    '#eff6ff',
              color:      '#2563eb',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              mb:         2,
            }}
          />
        )}

        {!essaysPending && exam.myAttempt?.isPassed !== null && exam.myAttempt?.isPassed !== undefined && (
          <Chip
            icon={
              exam.myAttempt.isPassed
                ? <CheckCircleIcon sx={{ fontSize: 16 }} />
                : <EmojiEventsIcon sx={{ fontSize: 16 }} />
            }
            label={exam.myAttempt.isPassed ? 'ناجح' : 'لم يحقق الدرجة المطلوبة'}
            size="small"
            sx={{
              bgcolor:    exam.myAttempt.isPassed ? '#dcfce7' : '#fef3c7',
              color:      exam.myAttempt.isPassed ? '#059669' : '#f59e0b',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              mb:         2,
            }}
          />
        )}

        {exam.totalMarks && (
          <Typography
            variant="body2"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}
          >
            الدرجة الكلية: {exam.totalMarks}
            {exam.passingMarks ? ` • الحد الأدنى: ${exam.passingMarks}` : ''}
          </Typography>
        )}

        <Button
          fullWidth
          startIcon={<VisibilityIcon />}
          onClick={onReview}
          sx={{
            background:   'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            color:        'white',
            fontFamily:   'Cairo, sans-serif',
            fontWeight:   700,
            borderRadius: 2,
            py:           1.25,
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            },
          }}
        >
          عرض التفاصيل
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExamsPage;