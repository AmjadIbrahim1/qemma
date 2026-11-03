// frontend/src/pages/assistant/AssistantTeacherDashboard.jsx
// CHANGE: أُضيف عرض الطلاب المشتركين عند المدرس الرئيسي + modal تفاصيل الطالب

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import ChatService from '../../services/chat.service';
import assistantService from '../../services/assistant.service';
import API from '../../services/api';
import {
  Container, Box, Typography, Card, CardContent, Grid, Button, IconButton,
  Avatar, Chip, Divider, CircularProgress, Badge, Paper, TextField,
  InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tooltip, LinearProgress, Tab, Tabs,
} from '@mui/material';
import {
  ChatBubbleOutline, PeopleOutline, Assignment, Notifications,
  School, TrendingUp, CheckCircle, HourglassEmpty,
  ExitToApp, MoreVert, MenuBook, Campaign, Settings, ArrowForward,
  Search, Person, Email, Phone, BookmarkBorder, EmojiEvents,
  Close, OpenInNew, FilterList, StarOutline, CheckCircleOutline,
  CancelOutlined, AccessTime, ExpandMore,
} from '@mui/icons-material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';

// ═══════════════════════════════════════════════════════════════
// SCORE BADGE
// ═══════════════════════════════════════════════════════════════
const ScoreBadge = ({ score }) => {
  if (score === null || score === undefined) return (
    <Chip label="لا يوجد" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', fontFamily: 'Cairo, sans-serif', fontSize: '0.7rem' }} />
  );
  const color = score >= 75 ? '#059669' : score >= 50 ? '#f59e0b' : '#ef4444';
  const bg    = score >= 75 ? '#d1fae5' : score >= 50 ? '#fef3c7' : '#fee2e2';
  return (
    <Chip
      label={`${score}%`}
      size="small"
      sx={{ bgcolor: bg, color, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.75rem' }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENT DETAIL MODAL
// ═══════════════════════════════════════════════════════════════
const StudentDetailModal = ({ studentId, open, onClose, isDark }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);

  const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8'  : '#64748b';
  const cardBg        = isDark ? '#1e293b'  : '#ffffff';
  const borderColor   = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(15,23,42,0.10)';

  useEffect(() => {
    if (!open || !studentId) return;
    setLoading(true);
    assistantService.getStudentDetail(studentId)
      .then(res => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [open, studentId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          bgcolor:      cardBg,
          borderRadius: 3,
          border:       '1px solid',
          borderColor,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor:      isDark ? '#0f172a' : '#f8fafc',
          borderBottom: `1px solid ${borderColor}`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'space-between',
          fontFamily:   'Cairo, sans-serif',
          fontWeight:   900,
          color:        textPrimary,
          py:           2,
          px:           3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Person sx={{ color: '#6366f1' }} />
          تفاصيل الطالب
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: textSecondary }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={40} />
          </Box>
        ) : !data ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
              تعذّر تحميل بيانات الطالب
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* ── Student Header ── */}
            <Box
              sx={{
                display:       'flex',
                alignItems:    'center',
                gap:           2.5,
                p:             3,
                borderRadius:  2.5,
                background:    'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.10))',
                border:        '1px solid',
                borderColor:   isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
              }}
            >
              <Avatar
                src={data.student.avatar}
                sx={{
                  width:      72,
                  height:     72,
                  fontSize:   '1.8rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color:      'white',
                  border:     '3px solid rgba(99,102,241,0.4)',
                }}
              >
                {data.student.name?.charAt(0) || 'ط'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 0.5 }}>
                  {data.student.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {data.student.username && (
                    <Chip label={`@${data.student.username}`} size="small" sx={{ bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#ede9fe', color: '#6366f1', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                  {data.student.gradeLevel && (
                    <Chip label={data.student.gradeLevel} size="small" sx={{ bgcolor: isDark ? 'rgba(5,150,105,0.2)' : '#d1fae5', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                  {data.student.stream && (
                    <Chip label={data.student.stream} size="small" sx={{ bgcolor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe', color: '#2563eb', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: '#f59e0b' }}>
                  {data.student.coins}
                </Typography>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                  عملات
                </Typography>
              </Box>
            </Box>

            {/* ── Contact Info ── */}
            <Grid container spacing={2}>
              {[
                { icon: <Email sx={{ fontSize: 18 }} />, label: 'البريد الإلكتروني', value: data.student.email,  color: '#2563eb' },
                { icon: <Phone sx={{ fontSize: 18 }} />, label: 'رقم الهاتف',        value: data.student.phone || 'غير محدد', color: '#059669' },
              ].map((item, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Box
                    sx={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        1.5,
                      p:          2,
                      borderRadius: 2,
                      bgcolor:    isDark ? '#0f172a' : '#f8fafc',
                      border:     '1px solid',
                      borderColor,
                    }}
                  >
                    <Box sx={{ color: item.color }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* ── Exam Summary ── */}
            <Box>
              <Typography variant="subtitle1" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 2 }}>
                📊 ملخص الاختبارات
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'إجمالي المحاولات', value: data.examSummary.totalAttempts,  color: '#6366f1' },
                  { label: 'متوسط الدرجات',    value: data.examSummary.avgScore !== null ? `${data.examSummary.avgScore}%` : '-', color: '#2563eb' },
                  { label: 'اختبارات ناجحة',  value: data.examSummary.passedCount,    color: '#059669' },
                  { label: 'اختبارات راسبة',   value: data.examSummary.failedCount,    color: '#ef4444' },
                ].map((item, i) => (
                  <Grid item xs={6} sm={3} key={i}>
                    <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc', border: '1px solid', borderColor }}>
                      <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: item.color }}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* ── Enrolled Courses ── */}
            {data.student.enrollments.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 2 }}>
                  📚 الكورسات المسجل فيها
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {data.student.enrollments.map((e, i) => (
                    <Box
                      key={i}
                      sx={{
                        p: 2, borderRadius: 2,
                        bgcolor: isDark ? '#0f172a' : '#f8fafc',
                        border: '1px solid', borderColor,
                        display: 'flex', alignItems: 'center', gap: 2,
                      }}
                    >
                      <School sx={{ color: '#6366f1', fontSize: 22 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                          {e.courseTitle}
                        </Typography>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                          سُجّل في {new Date(e.enrolledAt).toLocaleDateString('ar-EG')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography variant="body2" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: '#2563eb' }}>
                          {e.progress}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={e.progress}
                          sx={{
                            height: 6, borderRadius: 3, mt: 0.5,
                            bgcolor: isDark ? '#334155' : '#e2e8f0',
                            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#2563eb' },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* ── Recent Exam Attempts ── */}
            {data.recentAttempts.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 2 }}>
                  🎯 آخر الاختبارات
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {data.recentAttempts.map((a, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        p: 2, borderRadius: 2,
                        bgcolor: isDark ? '#0f172a' : '#f8fafc',
                        border: '1px solid', borderColor,
                      }}
                    >
                      {a.isPassed
                        ? <CheckCircleOutline sx={{ color: '#059669', fontSize: 22 }} />
                        : <CancelOutlined sx={{ color: '#ef4444', fontSize: 22 }} />}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                          {a.examTitle}
                        </Typography>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                          {a.courseTitle} · {new Date(a.submittedAt).toLocaleDateString('ar-EG')}
                        </Typography>
                      </Box>
                      <ScoreBadge score={a.score} />
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, minWidth: 50, textAlign: 'center' }}>
                        {a.rawScore}/{a.totalMarks}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: `1px solid ${borderColor}`, p: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
          إغلاق
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENTS TABLE
// ═══════════════════════════════════════════════════════════════
const StudentsTab = ({ isDark, onSelectStudent }) => {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterCourse, setFilterCourse] = useState('all');

  const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8'  : '#64748b';
  const cardBg        = isDark ? '#1e293b'  : '#ffffff';
  const borderColor   = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(15,23,42,0.10)';

  useEffect(() => {
    setLoading(true);
    assistantService.getStudents()
      .then(res => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={48} />
        <Typography fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, mt: 2 }}>
          جاري تحميل بيانات الطلاب...
        </Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <PeopleOutline sx={{ fontSize: 64, color: isDark ? '#334155' : '#e2e8f0', mb: 2 }} />
        <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: textPrimary, mb: 1 }}>
          تعذّر تحميل البيانات
        </Typography>
      </Box>
    );
  }

  if (!data.linkedTeacher) {
    return (
      <Box
        sx={{
          textAlign: 'center', py: 8, px: 4,
          borderRadius: 3,
          background: isDark
            ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.05))'
            : 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(220,38,38,0.04))',
          border: '1px solid',
          borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)',
        }}
      >
        <Typography sx={{ fontSize: '4rem', mb: 2 }}>🔗</Typography>
        <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 1 }}>
          غير مرتبط بمدرس رئيسي
        </Typography>
        <Typography fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
          يجب أن يكون حسابك مرتبطاً بمدرس رئيسي لعرض طلابه.
          تواصل مع المدرس ليقوم بالربط من خلال رمز التحقق.
        </Typography>
      </Box>
    );
  }

  // Filter students
  const filtered = (data.students || []).filter(s => {
    const matchSearch = !search || 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === 'all' ||
      s.enrollments?.some(e => e.courseId === filterCourse);
    return matchSearch && matchCourse;
  });

  return (
    <Box>
      {/* ── Linked Teacher Banner ── */}
      <Box
        sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          p: 2.5, mb: 3, borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.10))',
          border: '1px solid',
          borderColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)',
        }}
      >
        <Avatar
          src={data.linkedTeacher.avatar}
          sx={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontWeight: 900, fontSize: '1.3rem',
            border: '2px solid rgba(99,102,241,0.4)',
          }}
        >
          {data.linkedTeacher.name?.charAt(0) || 'م'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, mb: 0.3 }}>
            المدرس الرئيسي المرتبط
          </Typography>
          <Typography variant="subtitle1" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
            {data.linkedTeacher.name}
          </Typography>
          {data.linkedTeacher.username && (
            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#6366f1' }}>
              @{data.linkedTeacher.username}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {data.linkedTeacher.specialties?.slice(0, 2).map((s, i) => (
            <Chip key={i} label={s} size="small"
              sx={{ bgcolor: isDark ? 'rgba(99,102,241,0.2)' : '#ede9fe', color: '#6366f1', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }} />
          ))}
        </Box>
      </Box>

      {/* ── Stats Row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'إجمالي الطلاب',    value: data.stats.totalStudents,    icon: '👥', color: '#6366f1' },
          { label: 'الكورسات',         value: data.stats.totalCourses,     icon: '📚', color: '#2563eb' },
          { label: 'إجمالي التسجيلات', value: data.stats.totalEnrollments, icon: '📝', color: '#059669' },
          { label: 'كورسات منشورة',    value: data.stats.publishedCourses, icon: '✅', color: '#f59e0b' },
        ].map((stat, i) => (
          <Grid item xs={6} sm={3} key={i}>
            <Box
              sx={{
                textAlign: 'center', p: 2, borderRadius: 2,
                bgcolor: cardBg, border: '1px solid', borderColor,
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{stat.icon}</Typography>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: stat.color }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                {stat.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* ── Search & Filter ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="ابحث باسم الطالب أو البريد أو المستخدم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: textSecondary, fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1, minWidth: 220,
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: 2, fontFamily: 'Cairo, sans-serif',
            },
          }}
        />
        <TextField
          select
          size="small"
          value={filterCourse}
          onChange={e => setFilterCourse(e.target.value)}
          SelectProps={{ native: true }}
          sx={{
            minWidth: 180,
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: 2, fontFamily: 'Cairo, sans-serif',
            },
          }}
        >
          <option value="all">كل الكورسات</option>
          {(data.courses || []).map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </TextField>
      </Box>

      {/* ── Students List ── */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <PeopleOutline sx={{ fontSize: 56, color: isDark ? '#334155' : '#e2e8f0', mb: 2 }} />
          <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: textPrimary }}>
            لا يوجد طلاب مطابقون للبحث
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((student, idx) => (
            <Card
              key={student.id}
              elevation={0}
              sx={{
                borderRadius: 2.5,
                border: '1px solid', borderColor,
                bgcolor: cardBg,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#6366f1',
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 8px 32px rgba(0,0,0,0.5)'
                    : '0 8px 32px rgba(99,102,241,0.15)',
                },
              }}
              onClick={() => onSelectStudent(student.id)}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                  {/* Avatar + name */}
                  <Avatar
                    src={student.avatar}
                    sx={{
                      width: 52, height: 52,
                      background: `linear-gradient(135deg, hsl(${(idx * 47) % 360}, 70%, 55%), hsl(${(idx * 47 + 60) % 360}, 70%, 45%))`,
                      color: 'white', fontWeight: 900, fontSize: '1.3rem',
                      border: '2px solid rgba(99,102,241,0.25)',
                      flexShrink: 0,
                    }}
                  >
                    {student.name?.charAt(0) || 'ط'}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.3 }}>
                      <Typography variant="subtitle1" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                        {student.name}
                      </Typography>
                      {student.username && (
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#6366f1' }}>
                          @{student.username}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, display: 'block' }}>
                      {student.email}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.8, flexWrap: 'wrap' }}>
                      {student.gradeLevel && (
                        <Chip label={student.gradeLevel} size="small"
                          sx={{ bgcolor: isDark ? 'rgba(5,150,105,0.2)' : '#d1fae5', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                      )}
                      <Chip label={`${student.enrollments?.length || 0} كورس`} size="small"
                        sx={{ bgcolor: isDark ? 'rgba(37,99,235,0.2)' : '#dbeafe', color: '#2563eb', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                    </Box>
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, display: 'block', mb: 0.3 }}>
                        تقدم متوسط
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={student.avgProgress}
                          sx={{
                            width: 60, height: 6, borderRadius: 3,
                            bgcolor: isDark ? '#334155' : '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: student.avgProgress >= 75 ? '#059669' : student.avgProgress >= 40 ? '#f59e0b' : '#6366f1',
                            },
                          }}
                        />
                        <Typography variant="caption" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                          {student.avgProgress}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, display: 'block', mb: 0.3 }}>
                        متوسط الدرجات
                      </Typography>
                      <ScoreBadge score={student.avgScore} />
                    </Box>

                    <Box sx={{ textAlign: 'center', display: { xs: 'none', md: 'block' } }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, display: 'block', mb: 0.3 }}>
                        اختبارات
                      </Typography>
                      <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                        {student.examAttempts}
                      </Typography>
                    </Box>

                    <ArrowForward sx={{ color: '#6366f1', fontSize: 20, flexShrink: 0 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
const AssistantTeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const isDark = darkMode;

  // ── Tab state ───────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0);

  // ── Data State ──────────────────────────────────────────────
  const [chatSessions, setChatSessions] = useState([]);
  const [chatLoading,  setChatLoading]  = useState(true);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [notifLoading, setNotifLoading] = useState(true);
  const [pendingAttempts, setPendingAttempts] = useState([]);
  const [pendingLoading,  setPendingLoading]  = useState(true);
  const [studentsCount,   setStudentsCount]   = useState(null);

  // ── Student detail modal ────────────────────────────────────
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [modalOpen,         setModalOpen]         = useState(false);

  // ── Grade dialog ────────────────────────────────────────────
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);

  // ── Theme helpers ───────────────────────────────────────────
  const bgGradient = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #0f172a 100%)'
    : 'linear-gradient(135deg, #eff6ff 0%, #ffffff 45%, #eef2ff 100%)';

  const cardBg        = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.90)';
  const borderColor   = isDark ? 'rgba(51, 65, 85, 0.5)'  : 'rgba(15, 23, 42, 0.10)';
  const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';

  // ── Fetch chat sessions ─────────────────────────────────────
  const fetchChatData = useCallback(async () => {
    setChatLoading(true);
    try {
      const res = await ChatService.getSessions();
      setChatSessions(res.data?.data || []);
    } catch { setChatSessions([]); }
    finally  { setChatLoading(false); }
  }, []);

  // ── Fetch notifications ─────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await API.get('/notifications/unread-count');
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch { setUnreadCount(0); }
    finally  { setNotifLoading(false); }
  }, []);

  // ── Fetch pending attempts ──────────────────────────────────
  const fetchPendingAttempts = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await API.get('/attempts?status=pending&limit=10');
      setPendingAttempts(res.data?.data?.attempts || []);
    } catch { setPendingAttempts([]); }
    finally  { setPendingLoading(false); }
  }, []);

  // ── Fetch students count (for stats card) ──────────────────
  const fetchStudentsCount = useCallback(async () => {
    try {
      const res = await assistantService.getStudents();
      setStudentsCount(res.data?.data?.stats?.totalStudents ?? 0);
    } catch { setStudentsCount(0); }
  }, []);

  useEffect(() => {
    fetchChatData();
    fetchNotifications();
    fetchPendingAttempts();
    fetchStudentsCount();
  }, [fetchChatData, fetchNotifications, fetchPendingAttempts, fetchStudentsCount]);

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    setModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = now - d;
    if (diff < 86400000)  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    return d.toLocaleDateString('ar-EG');
  };

  // ── Stats ───────────────────────────────────────────────────
  const totalStudents = chatSessions.length;
  const activeChats   = chatSessions.filter(s => s.messagesCount > 0).length;
  const pendingEssays = pendingAttempts.length;

  const statsCards = [
    {
      title:    'طلاب المدرس',
      value:    studentsCount === null ? '...' : studentsCount.toString(),
      icon:     <PeopleOutline sx={{ fontSize: 32 }} />,
      color:    '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
      onClick:  () => setActiveTab(1),
    },
    {
      title:    'محادثات نشطة',
      value:    chatLoading ? '...' : activeChats.toString(),
      icon:     <ChatBubbleOutline sx={{ fontSize: 32 }} />,
      color:    '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
      onClick:  () => navigate('/assistant-teacher/chat'),
    },
    {
      title:    'تقييم مقالات',
      value:    pendingLoading ? '...' : pendingEssays.toString(),
      icon:     <Assignment sx={{ fontSize: 32 }} />,
      color:    '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      onClick:  () => navigate('/assistant-teacher/grade-exams'),
    },
    {
      title:    'إشعارات جديدة',
      value:    notifLoading ? '...' : unreadCount.toString(),
      icon:     <Notifications sx={{ fontSize: 32 }} />,
      color:    '#db2777',
      gradient: 'linear-gradient(135deg, #db2777, #ec4899)',
      onClick:  () => navigate('/assistant-teacher/notifications'),
    },
  ];

  // ── Quick Actions ───────────────────────────────────────────
  const quickActions = [
    { title: '👥 الطلاب',       description: 'عرض طلاب المدرس الرئيسي',                 color: '#2563eb', action: () => setActiveTab(1) },
    { title: '💬 المحادثات',    description: 'تواصل مع الطلاب والمدرس الرئيسي',        color: '#7c3aed', action: () => navigate('/assistant-teacher/chat') },
    { title: '📝 تقييم الاختبارات', description: 'راجع وصحح الأسئلة المقالية',          color: '#f59e0b', action: () => navigate('/assistant-teacher/grade-exams') },
    { title: '🔔 الإشعارات',    description: 'عرض الإشعارات والتنبيهات',               color: '#db2777', action: () => navigate('/assistant-teacher/notifications') },
  ];

  return (
    <Box
      sx={{
        minHeight:  '100vh',
        position:   'relative',
        overflow:   'hidden',
        background: bgGradient,
        pt: 10, pb: 6,
        '&::before': isDark ? {} : {
          content: '""',
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59,130,246,0.12), transparent 46%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.12), transparent 46%)
          `,
          opacity: 0.9, pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>

        {/* ═══════════════════════════════════════════════════════
            HEADER
           ═══════════════════════════════════════════════════════ */}
        <Card
          sx={{
            mb: 4, borderRadius: 3, overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.15)',
            background: cardBg, backdropFilter: 'blur(12px)',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(5,150,105,0.12)',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-2px)' },
          }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(5,150,105,0.2), rgba(16,185,129,0.15), rgba(5,150,105,0.1))',
              borderBottom: '1px solid',
              borderBottomColor: isDark ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.2)',
              p: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  sx={{
                    width: 64, height: 64,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: 'white', fontWeight: 900, fontSize: '2rem',
                    border: '3px solid', borderColor: isDark ? 'rgba(5,150,105,0.5)' : 'rgba(5,150,105,0.3)',
                  }}
                >
                  {user?.name?.charAt(0) || 'م'}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ color: textPrimary, mb: 0.5, letterSpacing: '-0.5px' }}>
                    مرحباً، {user?.name || 'المدرس المساعد'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="مدرس مساعد" size="small"
                      sx={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.75rem' }} />
                    <Chip label="تواصل مع الطلاب والمدرس الرئيسي" size="small"
                      icon={<School sx={{ color: `${textSecondary} !important`, fontSize: 14 }} />}
                      sx={{ bgcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.08)', color: textSecondary, fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => navigate('/profile')}
                  sx={{ color: isDark ? '#94a3b8' : '#64748b', bgcolor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.08)', '&:hover': { bgcolor: isDark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.15)' } }}>
                  <Settings />
                </IconButton>
                <IconButton onClick={handleLogout}
                  sx={{ color: '#ef4444', bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', '&:hover': { bgcolor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)' } }}>
                  <ExitToApp />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* ═══════════════════════════════════════════════════════
            STATS CARDS
           ═══════════════════════════════════════════════════════ */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((stat, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card
                onClick={stat.onClick}
                sx={{
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: isDark ? `${stat.color}33` : `${stat.color}22`,
                  background: cardBg, backdropFilter: 'blur(10px)',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : `0 4px 20px ${stat.color}15`,
                  transition: 'all 0.3s ease',
                  position: 'relative', overflow: 'hidden',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : `0 8px 32px ${stat.color}25`,
                    borderColor: `${stat.color}55`,
                  },
                  '&::before': {
                    content: '""', position: 'absolute',
                    top: 0, left: 0, right: 0, height: '4px',
                    background: stat.gradient,
                  },
                }}
              >
                <CardContent sx={{ py: 3, px: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 52, height: 52, borderRadius: '14px',
                      background: isDark ? `linear-gradient(135deg, ${stat.color}33, ${stat.color}22)` : `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: stat.color, border: '2px solid', borderColor: isDark ? `${stat.color}44` : `${stat.color}22`,
                    }}>
                      {stat.icon}
                    </Box>
                  </Box>
                  <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: textSecondary }}>
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ═══════════════════════════════════════════════════════
            TABS
           ═══════════════════════════════════════════════════════ */}
        <Card
          sx={{
            borderRadius: 3, border: '1px solid', borderColor,
            background: cardBg, backdropFilter: 'blur(10px)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              borderBottom: '1px solid', borderBottomColor: borderColor,
              bgcolor: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(248,250,252,0.8)',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                '& .MuiTab-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.9rem' },
                '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #2563eb, #6366f1)', height: 3, borderRadius: 2 },
              }}
            >
              <Tab label="🏠 الرئيسية" />
              <Tab label="👥 طلاب المدرس" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* ── TAB 0: Home ── */}
            {activeTab === 0 && (
              <Box>
                {/* Quick Actions */}
                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 2.5, color: textPrimary }}>
                  🚀 إجراءات سريعة
                </Typography>
                <Grid container spacing={2.5} sx={{ mb: 4 }}>
                  {quickActions.map((action, i) => (
                    <Grid item xs={12} sm={6} md={3} key={i}>
                      <Card
                        onClick={action.action}
                        sx={{
                          borderRadius: 2.5, border: '1px solid', borderColor,
                          background: cardBg, backdropFilter: 'blur(10px)',
                          cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
                          '&:hover': {
                            borderColor: `${action.color}55`, transform: 'translateY(-4px)',
                            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : `0 8px 24px ${action.color}20`,
                            '& .action-arrow': { transform: 'translateX(4px)', opacity: 1 },
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{
                              width: 48, height: 48, borderRadius: '12px',
                              background: isDark ? `${action.color}22` : `${action.color}12`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                            }}>
                              <Typography sx={{ fontSize: '1.3rem', lineHeight: 1 }}>
                                {action.title.split(' ')[0]}
                              </Typography>
                            </Box>
                            <ArrowForward className="action-arrow"
                              sx={{ color: action.color, fontSize: 20, opacity: 0, transition: 'all 0.3s ease' }} />
                          </Box>
                          <Typography variant="subtitle1" fontWeight={800} fontFamily="Cairo, sans-serif"
                            sx={{ color: textPrimary, mb: 0.5 }}>
                            {action.title.replace(/^[^\s]+\s/, '')}
                          </Typography>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
                            sx={{ color: textSecondary, fontSize: '0.82rem' }}>
                            {action.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                {/* Recent chat + pending grading */}
                <Grid container spacing={3}>
                  {/* Pending Essay Grading */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor, background: cardBg, height: '100%', overflow: 'hidden' }}>
                      <Box sx={{
                        background: isDark ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.14))' : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.06))',
                        borderBottom: '1px solid', borderBottomColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.15)',
                        p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                          sx={{ color: textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HourglassEmpty sx={{ color: '#f59e0b' }} />
                          تقييم الأسئلة المقالية
                        </Typography>
                        {pendingEssays > 0 && (
                          <Chip label={`${pendingEssays} طالب`} size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: isDark ? 'rgba(245,158,11,0.25)' : '#fef3c7', color: '#d97706' }} />
                        )}
                      </Box>
                      <Box sx={{ p: 3 }}>
                        {pendingLoading ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                        ) : pendingEssays > 0 ? (
                          <Box>
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: textSecondary, mb: 2 }}>
                              هناك {pendingEssays} محاولة اختبار تحتاج إلى تقييم
                            </Typography>
                            <Button variant="contained" fullWidth onClick={() => navigate('/assistant-teacher/grade-exams')} disableElevation
                              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, py: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                              الذهاب إلى التقييم
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <CheckCircle sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                            <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: textPrimary, mb: 0.5 }}>
                              لا توجد مهام تقييم حالياً
                            </Typography>
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                              ستظهر مهام التقييم هنا عندما يقدم الطلاب اختبارات مقالية
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Grid>

                  {/* Recent Chat Activity */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor, background: cardBg, height: '100%', overflow: 'hidden' }}>
                      <Box sx={{
                        background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(124,58,237,0.14))' : 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(124,58,237,0.06))',
                        borderBottom: '1px solid', borderBottomColor: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
                        p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                          sx={{ color: textPrimary, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ChatBubbleOutline sx={{ color: '#6366f1' }} />
                          آخر المحادثات
                        </Typography>
                        {chatSessions.length > 0 && (
                          <Button variant="text" size="small" onClick={() => navigate('/assistant-teacher/chat')}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: '#6366f1', minWidth: 'auto' }}>
                            عرض الكل
                          </Button>
                        )}
                      </Box>
                      <Box>
                        {chatLoading ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                        ) : chatSessions.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <ChatBubbleOutline sx={{ fontSize: 48, color: isDark ? '#475569' : '#cbd5e1', mb: 2 }} />
                            <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: textPrimary, mb: 0.5 }}>
                              لا توجد محادثات بعد
                            </Typography>
                          </Box>
                        ) : (
                          chatSessions.slice(0, 5).map((session, idx) => (
                            <Box key={session.id}>
                              <Box onClick={() => navigate('/assistant-teacher/chat')}
                                sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5, cursor: 'pointer', transition: 'all 0.2s ease',
                                  '&:hover': { bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' } }}>
                                <Badge badgeContent={session.messagesCount || 0} color="error">
                                  <Avatar sx={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700 }}>
                                    {session.student?.name?.charAt(0) || 'ط'}
                                  </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary, mb: 0.3, fontSize: '0.92rem' }}>
                                    {session.student?.name || 'طالب'}
                                  </Typography>
                                  <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                    sx={{ color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {session.lastMessage?.message || 'انقر لبدء المحادثة'}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, flexShrink: 0, fontSize: '0.65rem' }}>
                                  {formatTime(session.lastActive)}
                                </Typography>
                              </Box>
                              {idx < Math.min(chatSessions.length, 5) - 1 && (
                                <Divider sx={{ borderColor: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(15,23,42,0.06)' }} />
                              )}
                            </Box>
                          ))
                        )}
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ── TAB 1: Students ── */}
            {activeTab === 1 && (
              <StudentsTab isDark={isDark} onSelectStudent={handleSelectStudent} />
            )}
          </Box>
        </Card>
      </Container>

      {/* ── Student Detail Modal ── */}
      <StudentDetailModal
        studentId={selectedStudentId}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedStudentId(null); }}
        isDark={isDark}
      />

      {/* ── Grade Dialog ── */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ bgcolor: isDark ? '#1e293b' : 'white', color: textPrimary, fontFamily: 'Cairo, sans-serif', fontWeight: 900, borderBottom: `1px solid ${borderColor}` }}>
          📝 تقييم الأسئلة المقالية
        </DialogTitle>
        <DialogContent sx={{ bgcolor: isDark ? '#1e293b' : 'white', pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc', borderColor }}>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: textPrimary, mb: 1 }}>🎯 كيفية تقييم الإجابات المقالية</Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {`1. عندما يقدم الطالب اختباراً يحتوي على أسئلة مقالية، ستتلقى إشعاراً بذلك\n2. توجه إلى صفحة التقييم واطّلع على إجابة الطالب\n3. قم بتحديد درجة لكل سؤال مقالي بناءً على الإجابة\n4. بمجرد الانتهاء، سيتم تحديث درجة الطالب النهائية تلقائياً`}
              </Typography>
            </Card>
            <Button variant="contained" fullWidth onClick={() => { setGradeDialogOpen(false); navigate('/assistant-teacher/grade-exams'); }} disableElevation
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, py: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              الذهاب إلى التقييم
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AssistantTeacherDashboard;