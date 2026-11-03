// frontend/src/pages/student/MyCoursesPage.jsx
// Enhanced: clicking a course card now shows an inline detail view
// with real lessons, exams, sessions, and notifications from the API

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent,
  Avatar, LinearProgress, TextField, InputAdornment,
  Chip, Button, IconButton, Menu, MenuItem, Tabs, Tab,
  CircularProgress, Alert, Badge,
} from '@mui/material';
import {
  SearchRounded, SchoolRounded, SortRounded,
  PlayCircleFilledRounded, ArrowBackRounded,
  PersonRounded, RefreshRounded, MenuBookRounded,
  QuizRounded, NotificationsRounded,
  CheckCircleRounded, LockRounded, PictureAsPdfRounded,
  CalendarTodayRounded, AccessTimeRounded, LinkRounded,
  ArrowForwardRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import enrollmentsService from '../../services/enrollments.service';
import API from '../../services/api';

const COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#db2777',
  '#0891b2', '#ca8a04', '#dc2626', '#9333ea',
];
const getColor = (i) => COLORS[i % COLORS.length];
const ACCENT = '#2563eb';
const GRADIENT_MAIN = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';

const toArray = (val) => (Array.isArray(val) ? val : []);

const DETAIL_TABS = [
  { label: 'الدروس',    icon: <MenuBookRounded /> },
  { label: 'الامتحانات', icon: <QuizRounded /> },
  { label: 'الإشعارات', icon: <NotificationsRounded /> },
];

const MyCoursesPage = () => {
  const navigate     = useNavigate();
  const { darkMode } = useTheme();

  // ── Grid state ──────────────────────────────────────────────
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab,   setActiveTab]   = useState(0);
  const [sortAnchor,  setSortAnchor]  = useState(null);
  const [sortBy,      setSortBy]      = useState('recent');

  // ── Detail view state ───────────────────────────────────────
  const [selectedCourse,   setSelectedCourse]   = useState(null);
  const [detailLoading,    setDetailLoading]    = useState(false);
  const [detailError,      setDetailError]      = useState('');
  const [detailTab,        setDetailTab]        = useState(0);
  const [notifications,    setNotifications]    = useState([]);
  const [notiLoading,      setNotiLoading]      = useState(false);

  // ── Fetch enrollments ───────────────────────────────────────
  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enrollmentsService.getMyEnrollments();
      setEnrollments(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في جلب الكورسات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  // ── Fetch course detail ─────────────────────────────────────
  const fetchCourseDetail = useCallback(async (courseId) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const res = await enrollmentsService.getCourseDetail(courseId);
      setSelectedCourse(res.data.data);
    } catch (err) {
      setDetailError(err.response?.data?.message || 'حدث خطأ في تحميل تفاصيل الكورس');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Fetch notifications for selected course ─────────────────
  const fetchNotifications = useCallback(async (courseId) => {
    setNotiLoading(true);
    try {
      const res = await API.get('/notifications', { params: { courseId, limit: 50 } });
      const d = res?.data;
      let list = [];
      if (Array.isArray(d?.data?.notifications)) list = d.data.notifications;
      else if (Array.isArray(d?.data))           list = d.data;
      else if (Array.isArray(d?.notifications))  list = d.notifications;
      else if (Array.isArray(d))                 list = d;
      setNotifications(list);
    } catch {
      setNotifications([]);
    } finally {
      setNotiLoading(false);
    }
  }, []);

  // ── Fetch notifications when detail tab changes to 2 ───────
  useEffect(() => {
    if (detailTab === 2 && selectedCourse?.course?.id) {
      fetchNotifications(selectedCourse.course.id);
    }
  }, [detailTab, selectedCourse?.course?.id, fetchNotifications]);

  // ── Mark notification as read ───────────────────────────────
  const markNotifRead = async (notifId) => {
    try {
      await API.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        toArray(prev).map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  // ── Handle card click ───────────────────────────────────────
  const handleCardClick = (courseId) => {
    fetchCourseDetail(courseId);
    setDetailTab(0);
    setNotifications([]);
  };

  // ── Back to grid ────────────────────────────────────────────
  const handleBackToGrid = () => {
    setSelectedCourse(null);
    setDetailTab(0);
    setNotifications([]);
  };

  // ── Filtering & sorting ─────────────────────────────────────
  const filterAndSort = () => {
    let list = [...enrollments];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.course.title.toLowerCase().includes(q) ||
          e.course.teacher?.name?.toLowerCase().includes(q) ||
          e.course.category?.toLowerCase().includes(q)
      );
    }

    switch (activeTab) {
      case 1: list = list.filter((e) => e.progress > 0 && e.progress < 100); break;
      case 2: list = list.filter((e) => e.progress === 100); break;
      case 3: list = list.filter((e) => e.progress === 0); break;
      default: break;
    }

    switch (sortBy) {
      case 'progress': list.sort((a, b) => b.progress - a.progress); break;
      case 'name':     list.sort((a, b) => a.course.title.localeCompare(b.course.title)); break;
      default:         list.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
    }

    return list;
  };

  const filtered = filterAndSort();

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  // ===================================================================
  // DETAIL VIEW — selected course expanded inline
  // ===================================================================
  if (selectedCourse) {
    const { course, enrollment } = selectedCourse;
    const color = getColor(course.title.length);
    const safeNotifs = toArray(notifications);
    const unreadCount = safeNotifs.filter((n) => !n.isRead).length;

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
        {/* ── Hero Header ── */}
        <Box sx={{ background: GRADIENT_MAIN, color: 'white', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <IconButton onClick={handleBackToGrid}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                <ArrowBackRounded />
              </IconButton>
              <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ flex: 1 }}>
                {course.title}
              </Typography>
              <Button
                variant="contained"
                endIcon={<ArrowForwardRounded />}
                onClick={() => navigate(`/student/course/${course.id}`)}
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 800, fontSize: '1rem',
                  borderRadius: 3, px: 4, py: 1.2,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#1e293b',
                  boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
                    boxShadow: '0 6px 24px rgba(251,191,36,0.6)',
                    transform: 'translateY(-2px) scale(1.02)',
                  },
                }}>
                اظهار جميع محتويات الكورس
              </Button>
            </Box>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{
                    width: 64, height: 64, borderRadius: 2, flexShrink: 0,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {course.thumbnail
                      ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <SchoolRounded sx={{ fontSize: 32, color: 'white' }} />}
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      {course.category && (
                        <Chip label={course.category} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
                      )}
                      {course.level && (
                        <Chip label={course.level} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28 }}>
                        {course.teacher?.avatar
                          ? <img src={course.teacher.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <PersonRounded sx={{ fontSize: 16 }} />}
                      </Avatar>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                        {course.teacher?.name}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                  borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        تقدمك
                      </Typography>
                      <Typography variant="body2" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>
                        {enrollment.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={enrollment.progress}
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'white' } }} />
                    <Grid container spacing={1} sx={{ mt: 1.5 }}>
                      {[
                        { label: 'درس',    value: course.stats?.totalLessons  ?? course.lessons?.length ?? 0 },
                        { label: 'امتحان', value: course.stats?.totalExams    ?? course.exams?.length   ?? 0 },
                        { label: 'جلسة',   value: course.upcomingSessions?.length ?? 0 },
                      ].map((s) => (
                        <Grid item xs={4} key={s.label}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>{s.value}</Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Tabs
              value={detailTab}
              onChange={(_, v) => setDetailTab(v)}
              variant="scrollable" scrollButtons="auto"
              sx={{
                mt: 2,
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo, sans-serif', fontWeight: 600,
                  minHeight: 48, fontSize: '0.9rem',
                  '&.Mui-selected': { color: 'white' },
                },
                '& .MuiTabs-indicator': { bgcolor: 'white', height: 3, borderRadius: 2 },
              }}
            >
              {DETAIL_TABS.map((tab, i) => (
                <Tab
                  key={i}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {i === 2
                        ? <Badge badgeContent={unreadCount} color="error" max={99}>{tab.icon}</Badge>
                        : tab.icon}
                      {tab.label}
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Container>
        </Box>

        {/* ── Tab content ── */}
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={48} />
            </Box>
          ) : detailError ? (
            <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}
              action={<Button onClick={() => fetchCourseDetail(course.id)} size="small" sx={{ fontFamily: 'Cairo, sans-serif' }}>إعادة المحاولة</Button>}>
              {detailError}
            </Alert>
          ) : (
            <>
              {/* ══ LESSONS ═══════════════════════════════════════ */}
              {detailTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                      📖 المحتوى التعليمي — {course.lessons?.length ?? 0} درس
                    </Typography>
                  </Grid>
                  {!course.lessons?.length ? (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>📚</Typography>
                        <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>لم يتم رفع دروس بعد</Typography>
                      </Box>
                    </Grid>
                  ) : (
                    course.lessons.map((lesson, idx) => {
                      const lColor = ['#2563eb','#7c3aed','#059669','#db2777','#0891b2','#ca8a04'][idx % 6];
                      return (
                        <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                          <Card
                            elevation={0}
                            onClick={() => navigate(`/student/course/${course.id}/lesson/${lesson.id}`)}
                            sx={{
                              cursor: 'pointer', border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                              bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 2,
                              opacity: lesson.isPublished ? 1 : 0.5,
                              transition: 'all 0.25s',
                              '&:hover': lesson.isPublished
                                ? { borderColor: lColor, transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${lColor}20` }
                                : {},
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <Box sx={{
                                  width: 38, height: 38, borderRadius: 1.5, flexShrink: 0,
                                  background: `linear-gradient(135deg, ${lColor} 0%, ${lColor}99 100%)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {lesson.isPublished
                                    ? <PlayCircleFilledRounded sx={{ color: 'white', fontSize: 20 }} />
                                    : <LockRounded sx={{ color: 'white', fontSize: 20 }} />}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" noWrap
                                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                                    {lesson.title}
                                  </Typography>
                                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                                    درس {lesson.order}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {lesson.videoUrl && (
                                  <Chip icon={<PlayCircleFilledRounded sx={{ fontSize: 12 }} />} label="فيديو" size="small"
                                    sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: `${lColor}15`, color: lColor, fontSize: '0.65rem', height: 22 }} />
                                )}
                                {lesson.pdfFileRef && (
                                  <Chip icon={<PictureAsPdfRounded sx={{ fontSize: 12 }} />} label="PDF" size="small"
                                    sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: '#dc262615', color: '#dc2626', fontSize: '0.65rem', height: 22 }} />
                                )}
                                {lesson.attended && (
                                  <Chip icon={<CheckCircleRounded sx={{ fontSize: 12 }} />} label="حضرت" size="small"
                                    sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: '#05966915', color: '#059669', fontSize: '0.65rem', height: 22 }} />
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })
                  )}
                </Grid>
              )}

              {/* ══ EXAMS ════════════════════════════════════════ */}
              {detailTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                      📝 الامتحانات — {course.exams?.length ?? 0} امتحان
                    </Typography>
                  </Grid>
                  {!course.exams?.length ? (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>📝</Typography>
                        <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>لا توجد امتحانات بعد</Typography>
                      </Box>
                    </Grid>
                  ) : (
                    course.exams.map((exam) => {
                      const now = new Date();
                      const from = exam.availableFrom ? new Date(exam.availableFrom) : null;
                      const to = exam.availableTo ? new Date(exam.availableTo) : null;
                      const isAvailable = (!from || now >= from) && (!to || now <= to);
                      const hasAttempt = !!exam.myAttempt;
                      const hasPassed = exam.myAttempt?.isPassed;
                      const statusColor = hasPassed ? '#059669' : hasAttempt ? '#ea580c' : isAvailable ? ACCENT : '#64748b';
                      const statusLabel = hasPassed ? 'نجحت ✓' : hasAttempt ? `${exam.myAttempt?.score?.toFixed(0) ?? 0} درجة` : isAvailable ? 'متاح' : 'غير متاح';

                      return (
                        <Grid item xs={12} md={6} key={exam.id}>
                          <Card elevation={0} sx={{
                            border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                            bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 2,
                          }}>
                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}>
                                  {exam.title}
                                </Typography>
                                <Chip label={statusLabel} size="small"
                                  sx={{ bgcolor: `${statusColor}15`, color: statusColor, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                              </Box>
                              {exam.description && (
                                <Typography variant="body2" fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 1.5 }}>
                                  {exam.description}
                                </Typography>
                              )}
                              <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                {[
                                  { label: 'المدة',         value: `${exam.durationMinutes ?? exam.duration ?? 0} دقيقة`, icon: '⏱' },
                                  { label: 'الأسئلة',       value: exam.questionsCount ?? 0, icon: '❓' },
                                  { label: 'الدرجة الكلية', value: exam.totalMarks, icon: '📊' },
                                  { label: 'درجة النجاح',   value: exam.passingMarks, icon: '🎯' },
                                ].map((s) => (
                                  <Grid item xs={6} sm={3} key={s.label}>
                                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                                      <Typography variant="caption" display="block">{s.icon}</Typography>
                                      <Typography variant="caption" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', display: 'block' }}>{s.value}</Typography>
                                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>{s.label}</Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                              <Button
                                fullWidth variant="contained" size="small"
                                disabled={!isAvailable || hasAttempt}
                                onClick={() => navigate(`/student/exam/${exam.id}/start`)}
                                sx={{
                                  background: isAvailable && !hasAttempt ? GRADIENT_MAIN : undefined,
                                  fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 1.5,
                                  '&.Mui-disabled': { bgcolor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#64748b' : '#94a3b8' },
                                }}
                              >
                                {hasAttempt ? 'تم التقديم' : isAvailable ? 'ابدأ الامتحان' : 'غير متاح الآن'}
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })
                  )}
                </Grid>
              )}

              {/* ══ NOTIFICATIONS ═══════════════════════════════ */}
              {detailTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        🔔 الإشعارات ({unreadCount} غير مقروءة)
                      </Typography>
                      {unreadCount > 0 && (
                        <Button size="small" variant="outlined"
                          onClick={async () => {
                            try {
                              await API.patch('/notifications/read-all');
                              setNotifications((prev) => toArray(prev).map((n) => ({ ...n, isRead: true })));
                            } catch {}
                          }}
                          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, fontSize: '0.75rem' }}>
                          تعليم الكل كمقروء
                        </Button>
                      )}
                    </Box>
                  </Grid>
                  {notiLoading ? (
                    <Grid item xs={12} sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Grid>
                  ) : safeNotifs.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>🔔</Typography>
                        <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>لا توجد إشعارات</Typography>
                      </Box>
                    </Grid>
                  ) : (
                    safeNotifs.map((notif) => (
                      <Grid item xs={12} key={notif.id}>
                        <Card
                          elevation={0}
                          onClick={() => markNotifRead(notif.id)}
                          sx={{
                            border: '1px solid',
                            borderColor: !notif.isRead ? ACCENT : (darkMode ? '#334155' : '#e5e7eb'),
                            bgcolor: !notif.isRead
                              ? (darkMode ? 'rgba(37,99,235,0.08)' : '#eff6ff')
                              : (darkMode ? '#1e293b' : 'white'),
                            borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
                            '&:hover': { borderColor: ACCENT },
                          }}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                              <Box sx={{
                                width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                                background: !notif.isRead ? GRADIENT_MAIN : (darkMode ? '#334155' : '#f1f5f9'),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <NotificationsRounded sx={{ fontSize: 18, color: !notif.isRead ? 'white' : (darkMode ? '#64748b' : '#94a3b8') }} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                                  <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                                    {notif.title}
                                  </Typography>
                                  {!notif.isRead && (
                                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ACCENT, flexShrink: 0, mt: 0.5 }} />
                                  )}
                                </Box>
                                {notif.body && (
                                  <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                    sx={{ color: darkMode ? '#94a3b8' : '#64748b', whiteSpace: 'pre-line' }}>
                                    {notif.body}
                                  </Typography>
                                )}
                                <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? '#475569' : '#94a3b8', display: 'block', mt: 0.5 }}>
                                  {new Date(notif.createdAt).toLocaleString('ar-EG')}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              )}
            </>
          )}
        </Container>
      </Box>
    );
  }

  // ===================================================================
  // GRID VIEW — enrolled courses (unchanged)
  // ===================================================================
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', color: 'white', py: 4, px: 2, mb: 3 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => navigate('/student/dashboard')} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
              <ArrowBackRounded />
            </IconButton>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">📚 كورساتي</Typography>
            <Chip label={enrollments.length} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
            <IconButton onClick={fetchEnrollments} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', ml: 'auto' }}>
              <RefreshRounded />
            </IconButton>
          </Box>
          <TextField
            fullWidth placeholder="ابحث عن كورس أو مدرس..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRounded sx={{ color: 'rgba(255,255,255,0.7)' }} /></InputAdornment> }}
            sx={{
              maxWidth: 500,
              '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 3, color: 'white', '& fieldset': { border: 'none' } },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.7)', opacity: 1 },
            }}
          />
        </Container>
      </Box>

      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}
            action={<Button onClick={fetchEnrollments} size="small" sx={{ fontFamily: 'Cairo, sans-serif' }}>إعادة المحاولة</Button>}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
            sx={{ '& .MuiTab-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600, color: darkMode ? '#94a3b8' : '#64748b', '&.Mui-selected': { color: '#2563eb' } }, '& .MuiTabs-indicator': { bgcolor: '#2563eb' } }}>
            <Tab label={`الكل (${enrollments.length})`} />
            <Tab label={`قيد التقدم (${enrollments.filter(e => e.progress > 0 && e.progress < 100).length})`} />
            <Tab label={`مكتملة (${enrollments.filter(e => e.progress === 100).length})`} />
            <Tab label={`لم تبدأ (${enrollments.filter(e => e.progress === 0).length})`} />
          </Tabs>
          <Button startIcon={<SortRounded />} onClick={(e) => setSortAnchor(e.currentTarget)}
            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
            ترتيب حسب
          </Button>
          <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
            <MenuItem onClick={() => { setSortBy('recent'); setSortAnchor(null); }}>الأحدث تسجيلاً</MenuItem>
            <MenuItem onClick={() => { setSortBy('progress'); setSortAnchor(null); }}>التقدم</MenuItem>
            <MenuItem onClick={() => { setSortBy('name'); setSortAnchor(null); }}>الاسم</MenuItem>
          </Menu>
        </Box>

        <Grid container spacing={3}>
          {filtered.map((enrollment, idx) => {
            const course = enrollment.course;
            const color  = getColor(idx);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={enrollment.enrollmentId}>
                <Card
                  elevation={0}
                  onClick={() => handleCardClick(course.id)}
                  sx={{
                    cursor: 'pointer', border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                    bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': { borderColor: color, transform: 'translateY(-8px)', boxShadow: `0 20px 40px ${color}25` },
                  }}
                >
                  <Box sx={{
                    height: 130,
                    background: course.thumbnail ? `url(${course.thumbnail}) center/cover no-repeat` : `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    {!course.thumbnail && <SchoolRounded sx={{ fontSize: 48, color: 'white', opacity: 0.9 }} />}
                    <Chip label={`${enrollment.progress}%`} size="small"
                      sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'white', color, fontWeight: 700, fontFamily: 'Cairo, sans-serif' }} />
                    {course.category && (
                      <Chip label={course.category} size="small"
                        sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', fontFamily: 'Cairo, sans-serif', fontSize: '0.7rem' }} />
                    )}
                  </Box>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" noWrap title={course.title}
                      sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                      {course.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: color }}>
                        {course.teacher?.avatar
                          ? <img src={course.teacher.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <PersonRounded sx={{ fontSize: 14 }} />}
                      </Avatar>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" noWrap sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {course.teacher?.name || 'المدرس'}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>التقدم</Typography>
                        <Typography variant="caption" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color }}>{enrollment.progress}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={enrollment.progress}
                        sx={{ height: 6, borderRadius: 3, bgcolor: darkMode ? '#334155' : '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color } }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkMode ? '#94a3b8' : '#64748b', fontFamily: 'Cairo, sans-serif' }}>
                        {course.totalLessons} درس
                      </Typography>
                      {course.level && (
                        <Chip label={course.level} size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'Cairo, sans-serif', bgcolor: `${color}15`, color }} />
                      )}
                    </Box>
                    <Button fullWidth startIcon={<PlayCircleFilledRounded />}
                      sx={{ bgcolor: `${color}15`, color, fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: color, color: 'white' } }}>
                      {enrollment.progress === 0 ? 'ابدأ الآن' : enrollment.progress === 100 ? 'مراجعة' : 'استمر'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
              {searchQuery || activeTab !== 0 ? '🔍' : '📚'}
            </Typography>
            <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
              {searchQuery ? 'لا توجد نتائج مطابقة' : activeTab !== 0 ? 'لا توجد كورسات في هذه الفئة' : 'لم تسجل في أي كورس بعد'}
            </Typography>
            {!searchQuery && activeTab === 0 && (
              <Button variant="contained" onClick={() => navigate('/courses')}
                sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 3, px: 4, py: 1.5 }}>
                استعرض الكورسات المتاحة
              </Button>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default MyCoursesPage;