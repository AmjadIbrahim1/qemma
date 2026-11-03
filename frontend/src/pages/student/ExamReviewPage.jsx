// frontend/src/pages/student/ExamReviewPage.jsx
// ✅ Displays completed exam details: questions, correct answers, student answers, score breakdown.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Divider,

  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  School as SchoolIcon,
  CalendarToday as CalendarTodayIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import examsService from '../../services/exams.service';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getGradeColor = (score) => {
  if (score >= 90) return '#059669';
  if (score >= 80) return '#2563eb';
  if (score >= 70) return '#7c3aed';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const formatDateArabic = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Cairo',
    });
  } catch {
    return '—';
  }
};

const QUESTION_COLORS = ['#2563eb', '#7c3aed', '#059669', '#db2777', '#f59e0b', '#0891b2'];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ExamReviewPage = () => {
  const { examId } = useParams();
  const navigate   = useNavigate();
  const { darkMode } = useTheme();

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [review,   setReview]   = useState(null);

  // ── Fetch review data ────────────────────────────────────────────
  const fetchReview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await examsService.getExamReview(examId);
      const data = response?.data?.data ?? response?.data;
      setReview(data);
    } catch (err) {
      console.error('Failed to load exam review:', err);
      const msg = err.response?.data?.message || err.message || 'فشل تحميل تفاصيل الاختبار';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} thickness={4} sx={{ color: '#7c3aed' }} />
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
            جاري تحميل تفاصيل الاختبار...
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <CancelIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
            تعذر تحميل التفاصيل
          </Typography>
          <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/student/exams')}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}
          >
            العودة للاختبارات
          </Button>
        </Container>
      </Box>
    );
  }

  if (!review) return null;

  const { questions, score, totalMarks, passingMarks, isPassed, examTitle, courseTitle,
          submittedAt, hasEssayQuestions, autoGradedCount, essayCount } = review;

  // Determine if essay questions have been graded
  const essaysGraded = hasEssayQuestions && questions
    .filter(q => q.isEssay)
    .every(q => !q.pending);

  const scoreIsNull = score === null || score === undefined;
  const scorePct    = !scoreIsNull && totalMarks > 0 ? Math.round((score / totalMarks) * 100) : null;
  const gradeColor  = scorePct !== null ? getGradeColor(scorePct) : '#94a3b8';

  // ── Render ───────────────────────────────────────────────────────
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        {/* ═══ HEADER ═══ */}
        <Box sx={{
          background: isPassed
            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          color: 'white', py: 4, px: 2,
        }}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton
                onClick={() => navigate('/student/exams')}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <ArrowBackIcon />
              </IconButton>
              <QuizIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                  نتيجة الاختبار
                </Typography>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {examTitle}
                  {courseTitle && <>
                    <SchoolIcon sx={{ fontSize: 16, verticalAlign: 'middle', mx: 0.5 }} />
                    {courseTitle}
                  </>}
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Grid container spacing={3}>
            {/* ═══ Score Summary ═══ */}
            <Grid item xs={12} md={4}>
              <Card elevation={0} sx={{
                border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3,
                position: { md: 'sticky' }, top: { md: 24 },
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  {/* Score circle */}
                  <Box sx={{
                    width: 140, height: 140, borderRadius: '50%',
                    bgcolor: `${gradeColor}15`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 2,
                  }}>
                    <Typography variant="h2" fontWeight={900} sx={{ color: gradeColor, lineHeight: 1 }}>
                      {score !== null && score !== undefined ? Math.round(score) : '—'}
                    </Typography>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      من {totalMarks}
                    </Typography>
                  </Box>

                  {scorePct !== null && (
                    <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif"
                      sx={{ color: gradeColor, mb: 1 }}>
                      {scorePct}%
                    </Typography>
                  )}

                  {/* Pass / Fail badge */}
                  {isPassed !== null && isPassed !== undefined && (
                    <Chip
                      icon={isPassed ? <CheckCircleIcon /> : <CancelIcon />}
                      label={isPassed ? 'ناجح ✓' : 'لم تنجح'}
                      sx={{
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14,
                        bgcolor: isPassed ? '#dcfce7' : '#fef3c7',
                        color: isPassed ? '#059669' : '#f59e0b',
                        py: 2, px: 1, mb: 2,
                      }}
                    />
                  )}

                  {passingMarks && (
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block', mb: 2 }}>
                      الحد الأدنى: {passingMarks} درجة
                    </Typography>
                  )}

                  <Divider sx={{ my: 2, borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

                  {/* Meta info */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'right' }}>
                    {submittedAt && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                          {formatDateArabic(submittedAt)}
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuizIcon sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                        {questions.length} أسئلة
                      </Typography>
                    </Box>
                    {autoGradedCount !== undefined && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                          {autoGradedCount} مصحح تلقائياً
                        </Typography>
                      </Box>
                    )}
                    {essayCount > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {essaysGraded ? (
                          <CheckCircleIcon sx={{ fontSize: 18, color: '#059669' }} />
                        ) : (
                          <PendingIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        )}
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                          {essaysGraded ? 'تم التصحيح' : `${essayCount} بانتظار التصحيح`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ═══ Questions List ═══ */}
            <Grid item xs={12} md={8}>
              {/* Essay banner - pending or graded */}
              {hasEssayQuestions && (
                essaysGraded ? (
                  <Alert
                    severity="success"
                    icon={<CheckCircleIcon />}
                    sx={{
                      borderRadius: 3, fontFamily: 'Cairo, sans-serif', mb: 3,
                      '& .MuiAlert-message': { fontFamily: 'Cairo, sans-serif' },
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mb: 0.5 }}>
                      تم تقييم الأسئلة المقالية بنجاح ✓
                    </Typography>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif">
                      تم تصحيح الأسئلة التلقائية ({autoGradedCount}) والأسئلة المقالية ({essayCount}). 
                      هذه هي النتيجة النهائية للاختبار.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert
                    severity="warning"
                    icon={<PendingIcon />}
                    sx={{
                      borderRadius: 3, fontFamily: 'Cairo, sans-serif', mb: 3,
                      '& .MuiAlert-message': { fontFamily: 'Cairo, sans-serif' },
                    }}
                  >
                    <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mb: 0.5 }}>
                      الأسئلة المقالية لم تُصحح بعد
                    </Typography>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif">
                      تم تصحيح الأسئلة التلقائية ({autoGradedCount}). الأسئلة المقالية ({essayCount})
                      تحتاج إلى مراجعة من المدرس وستظهر النتيجة النهائية بعد التصحيح.
                    </Typography>
                  </Alert>
                )
              )}

              {questions.map((q, i) => {
                const color = QUESTION_COLORS[i % QUESTION_COLORS.length];
                const isCorrect  = q.isCorrect === true;
                const isWrong    = q.isCorrect === false;
                const isEssayPending = q.isEssay && q.pending;

                return (
                  <Card
                    key={q.id}
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: isCorrect
                        ? '#059669'
                        : isWrong
                          ? '#ef4444'
                          : isEssayPending
                            ? '#f59e0b'
                            : (darkMode ? '#334155' : '#e5e7eb'),
                      borderTop: `4px solid ${color}`,
                      bgcolor: darkMode ? '#1e293b' : 'white',
                      borderRadius: 3,
                      mb: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: darkMode
                          ? '0 8px 20px rgba(0,0,0,0.3)'
                          : '0 8px 20px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Question header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={`سؤال ${i + 1}`}
                            size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: `${color}15`, color }}
                          />
                          <Chip
                            label={
                              q.isEssay
                                ? 'مقالي'
                                : q.type === 'true-false' || q.type === 'true/false'
                                  ? 'صح/خطأ'
                                  : 'اختيار من متعدد'
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              fontFamily: 'Cairo, sans-serif',
                              borderColor: darkMode ? '#475569' : '#e5e7eb',
                              color: darkMode ? '#94a3b8' : '#64748b',
                            }}
                          />
                          <Chip
                            label={`${q.marks} درجة`}
                            size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: '#fef3c7', color: '#f59e0b' }}
                          />
                        </Box>

                        {/* Result icon */}
                        <Box sx={{ flexShrink: 0 }}>
                          {isEssayPending ? (
                            <PendingIcon sx={{ color: '#2563eb', fontSize: 28 }} />
                          ) : isCorrect ? (
                            <CheckCircleIcon sx={{ color: '#059669', fontSize: 28 }} />
                          ) : isWrong ? (
                            <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
                          ) : (
                            <QuizIcon sx={{ color: darkMode ? '#475569' : '#cbd5e1', fontSize: 28 }} />
                          )}
                        </Box>
                      </Box>

                      {/* Question text */}
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2, lineHeight: 1.8 }}
                      >
                        {q.questionText}
                      </Typography>

                      {/* Options (for MCQ/TF) */}
                      {q.options && q.options.length > 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                          {q.options.map((option, oi) => {
                            const isStudentAnswer = q.studentAnswer === option;
                            const isCorrectAnswer = q.correctAnswer === option;

                            let borderColor = darkMode ? '#334155' : '#e5e7eb';
                            let bgColor = 'transparent';
                            let textColor = darkMode ? '#94a3b8' : '#64748b';

                            if (isCorrectAnswer) {
                              borderColor = '#059669';
                              bgColor = darkMode ? '#064e3b' : '#f0fdf4';
                              textColor = '#059669';
                            } else if (isStudentAnswer && !isCorrectAnswer) {
                              borderColor = '#ef4444';
                              bgColor = darkMode ? '#450a0a' : '#fef2f2';
                              textColor = '#ef4444';
                            }

                            return (
                              <Box
                                key={oi}
                                sx={{
                                  border: '2px solid',
                                  borderColor,
                                  bgcolor: bgColor,
                                  borderRadius: 2,
                                  p: 1.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {/* Indicator icon */}
                                <Box sx={{ flexShrink: 0, width: 24, textAlign: 'center' }}>
                                  {isCorrectAnswer && (
                                    <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                                  )}
                                  {isStudentAnswer && !isCorrectAnswer && (
                                    <CancelIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                                  )}
                                </Box>

                                <Typography
                                  fontFamily="Cairo, sans-serif"
                                  sx={{
                                    flex: 1,
                                    color: isCorrectAnswer
                                      ? '#059669'
                                      : isStudentAnswer
                                        ? '#ef4444'
                                        : (darkMode ? '#e2e8f0' : '#334155'),
                                    fontWeight: isStudentAnswer || isCorrectAnswer ? 700 : 400,
                                  }}
                                >
                                  {option}
                                </Typography>

                                {/* Labels */}
                                {isCorrectAnswer && (
                                  <Chip
                                    label="الإجابة الصحيحة"
                                    size="small"
                                    sx={{
                                      fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 11,
                                      bgcolor: '#dcfce7', color: '#059669',
                                    }}
                                  />
                                )}
                                {isStudentAnswer && !isCorrectAnswer && (
                                  <Chip
                                    label="إجابتك"
                                    size="small"
                                    sx={{
                                      fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 11,
                                      bgcolor: '#fef2f2', color: '#ef4444',
                                    }}
                                  />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}

                      {/* Essay answer */}
                      {q.isEssay && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 1 }}
                          >
                            إجابتك:
                          </Typography>
                          <Box sx={{
                            p: 2,
                            bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: darkMode ? '#334155' : '#e5e7eb',
                          }}>
                            <Typography
                              variant="body1"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#e2e8f0' : '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                            >
                              {q.studentAnswer || <Box component="span" sx={{ color: darkMode ? '#475569' : '#94a3b8', fontStyle: 'italic' }}>لم يتم تقديم إجابة</Box>}
                            </Typography>
                          </Box>

                          {isEssayPending && (
                            <Alert
                              severity="info"
                              icon={<PendingIcon />}
                              sx={{
                                mt: 1.5,
                                borderRadius: 2,
                                fontFamily: 'Cairo, sans-serif',
                                '& .MuiAlert-message': { fontFamily: 'Cairo, sans-serif' },
                              }}
                            >
                              هذا السؤال المقالي لم يُصحح بعد. سيقوم المدرس بتصحيحه لاحقاً.
                            </Alert>
                          )}
                        </Box>
                      )}

                      {/* Correct answer (for wrong answers) */}
                      {isWrong && !q.isEssay && (
                        <Box sx={{
                          p: 1.5,
                          bgcolor: '#f0fdf4',
                          borderRadius: 2,
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#059669', fontWeight: 600 }}>
                            الإجابة الصحيحة: {q.correctAnswer}
                          </Typography>
                        </Box>
                      )}

                      {/* Essay score if graded */}
                      {q.isEssay && !q.pending && q.isCorrect !== null && (
                        <Box sx={{
                          mt: 1.5,
                          p: 1.5,
                          bgcolor: q.isCorrect ? '#f0fdf4' : '#fef2f2',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: q.isCorrect ? '#bbf7d0' : '#fecaca',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}>
                          {q.isCorrect ? (
                            <CheckCircleIcon sx={{ color: '#059669', fontSize: 20 }} />
                          ) : (
                            <CancelIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                          )}
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ color: q.isCorrect ? '#059669' : '#ef4444', fontWeight: 600 }}>
                            {q.isCorrect ? '✓ ' : '✗ '}
                            الدرجة: {q.marksAwarded ?? q.marks} / {q.marks}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Bottom actions */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, mb: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/student/exams')}
                  startIcon={<QuizIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, px: 4, py: 1.5,
                  }}
                >
                  العودة للاختبارات
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/student/dashboard')}
                  sx={{
                    fontFamily: 'Cairo, sans-serif', fontWeight: 600, borderRadius: 2, px: 4, py: 1.5,
                    borderColor: darkMode ? '#475569' : '#e5e7eb',
                    color: darkMode ? '#94a3b8' : '#64748b',
                  }}
                >
                  الرئيسية
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  };



export default ExamReviewPage;
