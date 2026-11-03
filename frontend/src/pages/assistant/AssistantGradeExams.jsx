// frontend/src/pages/assistant/AssistantGradeExams.jsx
// Assistant Teacher page for grading essay questions in exams.
// Lists pending attempts, allows grading each essay question,
// and submits the final scores.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import assistantService from '../../services/assistant.service';
import {
  Container, Box, Typography, Card, CardContent, Button, IconButton,
  Avatar, Chip, CircularProgress, Grid, Divider, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, LinearProgress, Tooltip,
} from '@mui/material';
import {
  ArrowBack, Assignment, Person, School, CheckCircle,
  HourglassEmpty, Star, Send, Close, EmojiEvents,
  Quiz, MenuBook, Refresh as RefreshIcon,
} from '@mui/icons-material';

const ACCENT = '#f59e0b';
const GRADIENTS = {
  header: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  success: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
};

const AssistantGradeExams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const isDark = darkMode;

  // Data states
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Grading modal state
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [essayScores, setEssayScores] = useState({});
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeError, setGradeError] = useState('');
  const [gradeSuccess, setGradeSuccess] = useState('');

  // Theme helpers
  const textPrimary = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#1e293b' : 'white';
  const borderC = isDark ? '#334155' : '#e5e7eb';

  // ── Fetch pending attempts ─────────────────────────────────────
  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assistantService.getPendingAttempts({ limit: 50 });
      setAttempts(res.data?.data?.attempts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في تحميل الاختبارات');
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  // ── Open grading modal ─────────────────────────────────────────
  const handleOpenGrading = async (attempt) => {
    setGradeError('');
    setGradeSuccess('');
    setEssayScores({});
    setSubmittingGrade(false);

    try {
      const res = await assistantService.getAttemptDetail(attempt.id);
      const fullAttempt = res.data?.data || attempt;
      setSelectedAttempt(fullAttempt);
      setGradingModalOpen(true);
    } catch (err) {
      setGradeError('فشل تحميل تفاصيل المحاولة');
    }
  };

  // ── Handle score change ────────────────────────────────────────
  const handleScoreChange = (questionId, value) => {
    const question = selectedAttempt?.exam?.questions?.find(q => q.id === questionId);
    const maxMarks = question?.marks || 0;
    const numValue = parseFloat(value);
    if (value === '') {
      setEssayScores(prev => ({ ...prev, [questionId]: '' }));
    } else if (!isNaN(numValue) && numValue >= 0 && numValue <= maxMarks) {
      setEssayScores(prev => ({ ...prev, [questionId]: numValue }));
    }
  };

  // ── Submit grades ──────────────────────────────────────────────
  const handleSubmitGrades = async () => {
    if (!selectedAttempt) return;

    // Validate all essay questions have scores
    const essayQuestions = selectedAttempt.exam.questions.filter(
      q => (q.type || '').toLowerCase() === 'essay'
    );
    const missing = essayQuestions.filter(q => essayScores[q.id] === undefined || essayScores[q.id] === '');
    if (missing.length > 0) {
      setGradeError(`يرجى تقييم جميع الأسئلة المقالية (${missing.length} متبقي)`);
      return;
    }

    setSubmittingGrade(true);
    setGradeError('');

    try {
      // Convert scores to numbers
      const scoresObj = {};
      for (const q of essayQuestions) {
        scoresObj[q.id] = parseFloat(essayScores[q.id]) || 0;
      }

      const res = await assistantService.gradeEssays(selectedAttempt.id, scoresObj);
      const result = res.data?.data;

      setGradeSuccess(`✓ تم تقييم الأسئلة المقالية بنجاح! الدرجة النهائية: ${result.score} من ${result.totalMarks}`);
      setSuccess(`تم تقييم اختبار ${selectedAttempt.exam.title} للطالب ${selectedAttempt.student?.user?.name || ''}`);

      // Refresh the list
      fetchAttempts();
    } catch (err) {
      setGradeError(err.response?.data?.message || 'حدث خطأ أثناء تقييم الأسئلة');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // ── Get score % ────────────────────────────────────────────────
  const getScorePct = (attempt) => {
    if (!attempt.score || !attempt.exam?.totalMarks) return null;
    return Math.round((attempt.score / attempt.exam.totalMarks) * 100);
  };

  const scoreColor = (pct) => {
    if (pct === null) return textSecondary;
    if (pct >= 75) return '#059669';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: isDark ? '#0f172a' : '#f8fafc',
      pt: 10, pb: 6,
    }}>
      <Container maxWidth="lg">

        {/* ═══════════════════════════════════════════════════════
            HEADER
           ═══════════════════════════════════════════════════════ */}
        <Card sx={{
          mb: 4, borderRadius: 3, overflow: 'hidden',
          border: '1px solid', borderColor: borderC,
          bgcolor: cardBg,
        }}>
          <Box sx={{ background: GRADIENTS.header, p: 3, color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <IconButton onClick={() => navigate('/assistant-teacher/dashboard')}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                <ArrowBack />
              </IconButton>
              <Assignment sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                تقييم الأسئلة المقالية
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={fetchAttempts} disabled={loading}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                <RefreshIcon />
              </IconButton>
            </Box>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mr: 7 }}>
              قم بتقييم إجابات الطلاب على الأسئلة المقالية وإضافة الدرجات
            </Typography>
          </Box>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')}
            sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
            {success}
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError('')}
            sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
            {error}
          </Alert>
        )}

        {/* ═══════════════════════════════════════════════════════
            PENDING ATTEMPTS LIST
           ═══════════════════════════════════════════════════════ */}
        <Card sx={{
          borderRadius: 3, overflow: 'hidden',
          border: '1px solid', borderColor: borderC,
          bgcolor: cardBg,
        }}>
          <Box sx={{
            px: 3, py: 2.5,
            borderBottom: '1px solid', borderColor: borderC,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <HourglassEmpty sx={{ color: ACCENT, fontSize: 24 }} />
              <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif"
                sx={{ color: textPrimary }}>
                الاختبارات التي تحتاج تقييم
              </Typography>
              <Chip
                label={loading ? '...' : `${attempts.length} طالب`}
                size="small"
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
                  color: ACCENT,
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip icon={<Quiz sx={{ fontSize: 14 }} />} label="أسئلة مقالية" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.7rem',
                  bgcolor: isDark ? 'rgba(37,99,235,0.15)' : '#dbeafe',
                  color: '#2563eb' }} />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={48} />
              <Typography fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, mt: 2 }}>
                جاري تحميل الاختبارات...
              </Typography>
            </Box>
          ) : attempts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                sx={{ color: textPrimary, mb: 1 }}>
                لا توجد مهام تقييم حالياً
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif"
                sx={{ color: textSecondary, mb: 3 }}>
                عندما يقدم الطلاب اختبارات تحتوي على أسئلة مقالية، ستظهر هنا للتقييم
              </Typography>
              <Button variant="outlined" onClick={fetchAttempts}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
                تحديث
              </Button>
            </Box>
          ) : (
            <Box>
              {attempts.map((attempt, idx) => {
                const scorePct = getScorePct(attempt);
                const studentName = attempt.student?.user?.name || 'طالب';
                const examTitle = attempt.exam?.title || 'اختبار';

                return (
                  <Box key={attempt.id}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 2.5,
                      p: 2.5, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)',
                      },
                    }}>
                      {/* Avatar */}
                      <Avatar sx={{
                        width: 48, height: 48,
                        background: GRADIENTS.header,
                        color: 'white', fontWeight: 700,
                        border: '2px solid', borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                      }}>
                        {studentName.charAt(0) || 'ط'}
                      </Avatar>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif"
                            sx={{ color: textPrimary }}>
                            {studentName}
                          </Typography>
                          <Chip label={examTitle} size="small"
                            sx={{
                              fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.65rem',
                              bgcolor: isDark ? 'rgba(99,102,241,0.15)' : '#ede9fe',
                              color: '#6366f1',
                            }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: textSecondary }}>
                            <School sx={{ fontSize: 13, verticalAlign: 'middle', ml: 0.3 }} />
                            {attempt.exam?.courseId ? 'تاريخ التسليم: ' : ''}
                            {formatDate(attempt.submittedAt)}
                          </Typography>
                          {scorePct !== null && (
                            <Chip
                              label={`الدرجة التلقائية: ${Math.round(attempt.score)}/${attempt.exam.totalMarks}`}
                              size="small"
                              sx={{
                                fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.65rem',
                                bgcolor: isDark ? 'rgba(5,150,105,0.15)' : '#d1fae5',
                                color: '#059669',
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Score indicator */}
                      <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                        {scorePct !== null ? (
                          <Box>
                            <Typography variant="h5" fontWeight={900}
                              sx={{ color: scoreColor(scorePct) }}>
                              {scorePct}%
                            </Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif"
                              sx={{ color: textSecondary, fontSize: '0.6rem' }}>
                              تلقائي
                            </Typography>
                          </Box>
                        ) : (
                          <Chip label="لم يصحح" size="small"
                            sx={{
                              fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                              bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
                              color: ACCENT,
                            }} />
                        )}
                      </Box>

                      {/* Grade button */}
                      <Button
                        variant="contained"
                        onClick={(e) => { e.stopPropagation(); handleOpenGrading(attempt); }}
                        disableElevation
                        startIcon={<Star />}
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                          borderRadius: 2, px: 2.5, py: 1, flexShrink: 0,
                          background: GRADIENTS.header,
                          '&:hover': { background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        تقييم
                      </Button>
                    </Box>
                    {idx < attempts.length - 1 && (
                      <Divider sx={{ borderColor: borderC }} />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════════
            Quick Nav
           ═══════════════════════════════════════════════════════ */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card onClick={() => navigate('/assistant-teacher/dashboard')}
              sx={{
                borderRadius: 2.5, cursor: 'pointer',
                border: '1px solid', borderColor: borderC,
                bgcolor: cardBg,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', borderColor: `${ACCENT}55` },
              }}>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>🏠</Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: textPrimary }}>
                  لوحة التحكم
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card onClick={() => navigate('/assistant-teacher/chat')}
              sx={{
                borderRadius: 2.5, cursor: 'pointer',
                border: '1px solid', borderColor: borderC,
                bgcolor: cardBg,
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', borderColor: '#05966955' },
              }}>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Typography sx={{ fontSize: '1.8rem', mb: 0.5 }}>💬</Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: textPrimary }}>
                  المحادثات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* ═══════════════════════════════════════════════════════════
          GRADING MODAL
         ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={gradingModalOpen}
        onClose={() => { if (!submittingGrade) setGradingModalOpen(false); }}
        maxWidth="md"
        fullWidth
        dir="rtl"
        PaperProps={{
          sx: {
            bgcolor: cardBg,
            borderRadius: 3,
            border: '1px solid', borderColor: borderC,
          },
        }}
      >
        {selectedAttempt && (
          <>
            {/* Dialog Header */}
            <DialogTitle sx={{
              background: GRADIENTS.header,
              color: 'white',
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 2,
              px: 3,
            }}>
              <Assignment />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>
                  تقييم: {selectedAttempt.exam?.title || 'اختبار'}
                </Typography>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.85 }}>
                  الطالب: {selectedAttempt.student?.user?.name || 'طالب'} · 
                  قدّم في: {formatDate(selectedAttempt.submittedAt)}
                </Typography>
              </Box>
              <IconButton onClick={() => { if (!submittingGrade) setGradingModalOpen(false); }}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {/* Grade messages */}
              {gradeError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
                  {gradeError}
                </Alert>
              )}
              {gradeSuccess && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
                  {gradeSuccess}
                </Alert>
              )}

              {/* Student info card */}
              <Card variant="outlined" sx={{
                mb: 3, borderRadius: 2,
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                borderColor: borderC,
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
                  <Avatar sx={{
                    width: 48, height: 48,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', fontWeight: 700,
                  }}>
                    {selectedAttempt.student?.user?.name?.charAt(0) || 'ط'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif"
                      sx={{ color: textPrimary }}>
                      {selectedAttempt.student?.user?.name || 'طالب'}
                    </Typography>
                    {selectedAttempt.student?.user?.email && (
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        {selectedAttempt.student.user.email}
                      </Typography>
                    )}
                  </Box>
                  {selectedAttempt.score > 0 && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={900} sx={{ color: '#059669' }}>
                        {Math.round(selectedAttempt.score)}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: textSecondary, fontSize: '0.6rem' }}>
                        درجة تلقائية
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Essays list */}
              {selectedAttempt.exam?.questions
                ?.filter(q => (q.type || '').toLowerCase() === 'essay')
                .map((question, idx) => {
                  const studentAnswer = selectedAttempt.answers?.[question.id] || '';
                  return (
                    <Card key={question.id} variant="outlined" sx={{
                      mb: 2.5, borderRadius: 2,
                      borderColor: borderC,
                      borderLeft: '4px solid #2563eb',
                    }}>
                      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        {/* Question header */}
                        <Box sx={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', mb: 1.5, gap: 1,
                        }}>
                          <Box sx={{ flex: 1 }}>
                            <Chip label={`السؤال المقالي ${idx + 1}`} size="small"
                              sx={{
                                fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                                bgcolor: isDark ? 'rgba(37,99,235,0.15)' : '#dbeafe',
                                color: '#2563eb', mb: 1,
                              }} />
                            <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif"
                              sx={{ color: textPrimary, lineHeight: 1.7 }}>
                              {question.questionText}
                            </Typography>
                          </Box>
                          <Chip label={`${question.marks} درجات`} size="small"
                            sx={{
                              fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                              bgcolor: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7',
                              color: ACCENT, flexShrink: 0,
                            }} />
                        </Box>

                        {/* Student answer */}
                        <Box sx={{
                          p: 2, borderRadius: 2, mb: 2,
                          bgcolor: isDark ? '#0f172a' : '#f1f5f9',
                          border: '1px solid', borderColor: borderC,
                        }}>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: textSecondary, display: 'block', mb: 1, fontWeight: 600 }}>
                            📝 إجابة الطالب:
                          </Typography>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ color: textPrimary, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                            {studentAnswer || 'لم يقدم الطالب إجابة'}
                          </Typography>
                        </Box>

                        {/* Score input */}
                        <Box sx={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          bgcolor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)',
                          p: 2, borderRadius: 2,
                        }}>
                          <TextField
                            label="الدرجة"
                            type="number"
                            size="small"
                            value={essayScores[question.id] ?? ''}
                            onChange={(e) => handleScoreChange(question.id, e.target.value)}
                            disabled={submittingGrade || !!gradeSuccess}
                            InputProps={{
                              inputProps: { min: 0, max: question.marks, step: 0.5 },
                              sx: { fontFamily: 'Cairo, sans-serif', fontWeight: 700 },
                            }}
                            InputLabelProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                            sx={{
                              width: 120,
                              '& .MuiOutlinedInput-root': {
                                bgcolor: isDark ? '#0f172a' : 'white',
                                borderRadius: 2,
                              },
                            }}
                          />
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ color: textSecondary }}>
                            من {question.marks} درجات
                          </Typography>
                          {essayScores[question.id] !== undefined && essayScores[question.id] !== '' && (
                            <Chip
                              label={`${essayScores[question.id]} / ${question.marks}`}
                              size="small"
                              sx={{
                                fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                                bgcolor: isDark ? 'rgba(5,150,105,0.15)' : '#d1fae5',
                                color: '#059669',
                              }}
                            />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Auto-graded summary */}
              {selectedAttempt.score > 0 && (
                <Card variant="outlined" sx={{
                  mt: 2, borderRadius: 2,
                  borderColor: borderC,
                  bgcolor: isDark ? '#0f172a' : '#f8fafc',
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CheckCircle sx={{ color: '#059669', fontSize: 24 }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary }}>
                        تم تصحيح الأسئلة التلقائية تلقائياً:
                        <strong style={{ color: '#059669', margin: '0 4px' }}>
                          {Math.round(selectedAttempt.score)}
                        </strong>
                        درجة
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </DialogContent>

            <DialogActions sx={{
              p: 2.5,
              borderTop: '1px solid', borderColor: borderC,
              gap: 1,
            }}>
              <Button onClick={() => setGradingModalOpen(false)}
                disabled={submittingGrade}
                variant="outlined"
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2,
                  borderColor: borderC,
                  color: textSecondary,
                }}>
                إلغاء
              </Button>
              {!gradeSuccess && (
                <Button
                  onClick={handleSubmitGrades}
                  disabled={submittingGrade}
                  variant="contained"
                  disableElevation
                  startIcon={submittingGrade ? <CircularProgress size={18} color="inherit" /> : <Send />}
                  sx={{
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, px: 3,
                    background: GRADIENTS.success,
                    '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
                    '&.Mui-disabled': { bgcolor: isDark ? '#334155' : '#e5e7eb' },
                  }}>
                  {submittingGrade ? 'جاري الحفظ...' : 'حفظ التقييم'}
                </Button>
              )}
              {gradeSuccess && (
                <Button onClick={() => setGradingModalOpen(false)}
                  variant="contained"
                  disableElevation
                  sx={{
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, px: 3,
                    background: GRADIENTS.success,
                  }}>
                  تم ✓
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Keyframes for typing animation (if not already defined globally) */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default AssistantGradeExams;
