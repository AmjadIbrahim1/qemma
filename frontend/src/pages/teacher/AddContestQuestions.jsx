// frontend/src/pages/teacher/AddContestQuestions.jsx
// ✅ NEW (contests feature): Teacher adds MCQ questions to a contest.
// Reuses the question-card layout from CreateExam.jsx Step 2 (Paper + Chip + RadioGroup + add/remove option).
// Simplified: MCQ-only (no type selector, no essay), pointValue instead of marks, correct option stored
// as isCorrect per ContestOption row (normalized options, not JSON).

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Box, Typography, Card, CardContent, TextField, Button,
  Grid, IconButton, Chip, Radio, RadioGroup, Paper, CircularProgress, Alert, Divider,
} from '@mui/material';
import { ArrowBack, Save, Add, Delete, EmojiEvents } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useTheme } from '../../hooks/useTheme';
import contestsService from '../../services/contests.service';
import { STREAM_LABELS, CONTEST_DIFFICULTY } from '../../utils/constants';

// ✅ NEW: type 'mcq' (default) or 'true_false'.
// tfCorrect = true → الإجابة صحيح, false → الإجابة خطأ.
const newQuestion = () => ({ text: '', type: 'mcq', options: ['', '', '', ''], correctIndex: 0, tfCorrect: true });

// ✅ NEW: auto-assigned mark per contest difficulty (matches backend TEACHER_POINT_VALUE).
// Used to display the assigned mark while adding/viewing questions.
const POINT_VALUE_BY_DIFFICULTY = { Easy: 1, Medium: 2, Hard: 4 };

const AddContestQuestions = ({ contestId: propContestId }) => {
  // ✅ CHANGED: route param is now :contestId (was :id) per the /teacher/contests/:contestId route.
  const { contestId: routeContestId } = useParams();
  const contestId = propContestId || routeContestId;   // ✅ prop for inline rendering, fallback to route param
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [contest, setContest] = useState(null);
  const [existingQuestions, setExistingQuestions] = useState([]);
  const [questions, setQuestions] = useState([newQuestion()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch contest detail (includes existing questions with correct options) ──
  useEffect(() => {
    const fetchContest = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await contestsService.getContest(contestId);
        const c = res.data?.data;
        setContest(c);
        setExistingQuestions(c?.questions ?? []);
      } catch (err) {
        setError(err.response?.data?.message || 'فشل تحميل المسابقة');
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
  }, [contestId]);

  // ── Question handlers (adapted from CreateExam.jsx) ──
  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex] };
      copy[qIndex].options = [...copy[qIndex].options];
      copy[qIndex].options[optIndex] = value;
      return copy;
    });
  };

  const addOption = (qIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      // ✅ NEW: limit to 4 options max (matches backend validation).
      if (copy[qIndex].options.length >= 4) {
        toast.error('الحد الأقصى 4 خيارات لكل سؤال');
        return prev;
      }
      copy[qIndex] = { ...copy[qIndex], options: [...copy[qIndex].options, ''] };
      return copy;
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const copy = [...prev];
      if (copy[qIndex].options.length <= 2) {
        toast.error('يجب أن يكون هناك خيارين على الأقل');
        return prev;
      }
      const newOptions = copy[qIndex].options.filter((_, i) => i !== optIndex);
      // Fix correctIndex if removed option was the correct one or before it
      let newCorrect = copy[qIndex].correctIndex;
      if (optIndex === newCorrect) newCorrect = 0;
      else if (optIndex < newCorrect) newCorrect -= 1;
      copy[qIndex] = { ...copy[qIndex], options: newOptions, correctIndex: newCorrect };
      return copy;
    });
  };

  const addQuestion = () => setQuestions((prev) => [...prev, newQuestion()]);

  const removeQuestion = (index) => {
    setQuestions((prev) => {
      if (prev.length === 1) { toast.error('يجب أن يحتوي على سؤال واحد على الأقل'); return prev; }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Submit: validate + post each question via addContestQuestion ──
  const handleSubmit = async () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { toast.error(`يرجى ملء نص السؤال ${i + 1}`); return; }
      if (q.type !== 'true_false') {
        if (q.options.length < 2) { toast.error(`السؤال ${i + 1} يجب أن يحتوي على خيارين على الأقل`); return; }
        if (q.options.length > 4) { toast.error(`السؤال ${i + 1} يجب أن يحتوي على 4 خيارات كحد أقصى`); return; }
        if (q.options.some((o) => !o.trim())) { toast.error(`يرجى ملء جميع الخيارات في السؤال ${i + 1}`); return; }
      }
    }

    setSaving(true);
    let added = 0;
    try {
      for (const q of questions) {
        const payload = q.type === 'true_false'
          ? { text: q.text.trim(), questionType: 'true_false', isCorrect: q.tfCorrect }
          : { text: q.text.trim(), options: q.options.map((text, idx) => ({ text: text.trim(), isCorrect: idx === q.correctIndex })) };
        await contestsService.addContestQuestion(contestId, payload);
        added++;
      }
      toast.success(`تم إضافة ${added} سؤال بنجاح! 🎉`);
      // Refresh existing questions list
      const res = await contestsService.getContest(contestId);
      setContest(res.data?.data);
      setExistingQuestions(res.data?.data?.questions ?? []);
      setQuestions([newQuestion()]);
    } catch (err) {
      toast.error(err.response?.data?.message || `فشل إضافة السؤال (${added + 1})`);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete an existing question ──
  const handleDeleteExisting = async (questionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await contestsService.deleteContestQuestion(contestId, questionId);
      toast.success('تم حذف السؤال');
      const res = await contestsService.getContest(contestId);
      setContest(res.data?.data);
      setExistingQuestions(res.data?.data?.questions ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف السؤال');
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: darkMode ? '#334155' : undefined } },
    '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined },
    '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined },
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={56} sx={{ color: '#7c3aed' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
          <Button variant="contained" onClick={() => navigate('/teacher/contests')}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>رجوع</Button>
        </Container>
      </Box>
    );
  }

  const diff = CONTEST_DIFFICULTY[contest?.difficulty] || { label: contest?.difficulty, color: '#64748b' };
  // ✅ CHANGED: editing allowed only when the contest is upcoming with >60min before start (non-test).
  // Dev test contests (isTest) bypass the time window (matches the backend isTest bypass).
  // const canEdit = contest?.status !== 'ended' || contest?.isTest === true;
  const now = new Date();
  const startMs = new Date(contest?.startTime).getTime();
  const canEdit = contest?.isTest === true
    ? true
    : (contest?.status === 'upcoming' && now < new Date(startMs - 60 * 60 * 1000));
  // ✅ NEW: mark auto-assigned from contest difficulty (displayed while adding/viewing questions).
  const assignedMark = POINT_VALUE_BY_DIFFICULTY[contest?.difficulty] ?? null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', py: 4 }}>
      <Container maxWidth="lg">
        {/* ✅ CHANGED: Back button returns to /teacher/contests (was /teacher/contests/available). */}
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/teacher/contests')}
          sx={{ mb: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : 'inherit' }}>
          رجوع
        </Button>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ width: 50, height: 50, borderRadius: 2, background: 'linear-gradient(135deg, #f59e0b 0%, #db2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <EmojiEvents />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
              {contest?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={STREAM_LABELS[contest?.stream] || contest?.stream} size="small" variant="outlined"
                sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
              <Chip label={diff.label} size="small" sx={{ bgcolor: diff.color, color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
              <Chip label={`${contest?.duration} دقيقة`} size="small" variant="outlined"
                sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
            </Box>
          </Box>
        </Box>

        {!canEdit && (
          <Alert severity="warning" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>
            ⚠️ المسابقة قد بدأت أو تبقى أقل من 60 دقيقة على بدئها — لا يمكن إضافة أو حذف أسئلة بعد الآن.
          </Alert>
        )}

        {/* Existing questions */}
        {existingQuestions.length > 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                الأسئلة الحالية ({existingQuestions.length})
              </Typography>
              {existingQuestions.map((q, i) => (
                <Paper key={q.id} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit', flex: 1 }}>
                      {i + 1}. {q.text}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {/* ✅ NEW: attribution — AI-generated questions show "ذكاء اصطناعي"; teacher questions show the author's real name. */}
                      <Chip
                        label={q.aiGenerated ? '🤖 ذكاء اصطناعي' : (q.authorName || 'معلم')}
                        size="small"
                        sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.65rem', bgcolor: q.aiGenerated ? (darkMode ? 'rgba(124,58,237,0.2)' : '#ede9fe') : (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff'), color: q.aiGenerated ? '#7c3aed' : '#2563eb' }}
                      />
                      {q.questionType === 'true_false' && (
                        <Chip label="صح/خطأ" size="small"
                          sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.65rem', bgcolor: darkMode ? 'rgba(34,197,94,0.2)' : '#f0fdf4', color: '#22c55e' }} />
                      )}
                      <Chip label={`${q.pointValue} درجة`} size="small" variant="outlined" sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.65rem' }} />
                      {/* ✅ CHANGED: delete only own + non-AI questions (canDelete computed server-side). */}
                      {canEdit && q.canDelete && (
                        <IconButton size="small" color="error" onClick={() => handleDeleteExisting(q.id)}><Delete fontSize="small" /></IconButton>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ pl: 2 }}>
                    {q.options.map((opt, oi) => (
                      <Typography key={opt.id || oi} fontFamily="Cairo, sans-serif"
                        sx={{ color: opt.isCorrect ? '#22c55e' : (darkMode ? '#94a3b8' : 'text.secondary'), fontWeight: opt.isCorrect ? 700 : 400 }}>
                        {opt.isCorrect ? '✓' : '•'} {opt.text}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              ))}
            </CardContent>
          </Card>
        )}

        {/* New questions builder (reuses CreateExam.jsx Step-2 pattern) */}
        {canEdit && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', mb: 3, borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    إضافة أسئلة جديدة ({questions.length})
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                    أضف أسئلة اختيار من متعدد أو صح/خطأ
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={addQuestion}
                  sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
                  إضافة سؤال
                </Button>
              </Box>

              {questions.map((question, qIndex) => (
                <Paper key={qIndex} elevation={0} sx={{ p: 3, mb: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip label={`السؤال ${qIndex + 1}`} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: darkMode ? '#1e293b' : '#e0e7ff', color: darkMode ? '#f1f5f9' : '#3730a3' }} />
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label="اختيار من متعدد" size="small" clickable
                        variant={question.type === 'mcq' ? 'filled' : 'outlined'}
                        onClick={() => handleQuestionChange(qIndex, 'type', 'mcq')}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.7rem', fontWeight: 700, bgcolor: question.type === 'mcq' ? '#7c3aed' : undefined, color: question.type === 'mcq' ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }} />
                      <Chip label="صح/خطأ" size="small" clickable
                        variant={question.type === 'true_false' ? 'filled' : 'outlined'}
                        onClick={() => handleQuestionChange(qIndex, 'type', 'true_false')}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.7rem', fontWeight: 700, bgcolor: question.type === 'true_false' ? '#22c55e' : undefined, color: question.type === 'true_false' ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }} />
                      <IconButton onClick={() => removeQuestion(qIndex)} color="error"><Delete /></IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
                          الدرجة (تُحدد تلقائياً حسب صعوبة المسابقة)
                        </Typography>
                        <Typography fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                          {assignedMark != null ? `${assignedMark} درجة` : '—'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} label="نص السؤال" value={question.text}
                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                        placeholder="اكتب السؤال هنا..." sx={fieldSx} InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                    </Grid>

                    {question.type === 'mcq' ? (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          الخيارات: (اختر الإجابة الصحيحة)
                        </Typography>
                        <RadioGroup value={String(question.correctIndex)}
                          onChange={(e) => handleQuestionChange(qIndex, 'correctIndex', parseInt(e.target.value))}>
                          {question.options.map((option, optIndex) => (
                            <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Radio value={String(optIndex)} />
                              <TextField fullWidth size="small" value={option}
                                onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                placeholder={`الخيار ${optIndex + 1}`} sx={fieldSx} InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                              {question.options.length > 2 && (
                                <IconButton size="small" onClick={() => removeOption(qIndex, optIndex)} color="error"><Delete fontSize="small" /></IconButton>
                              )}
                            </Box>
                          ))}
                        </RadioGroup>
                        <Button size="small" startIcon={<Add />} onClick={() => addOption(qIndex)}
                          sx={{ mt: 1, fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          إضافة خيار
                        </Button>
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          الإجابة الصحيحة:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button variant={question.tfCorrect ? 'contained' : 'outlined'} onClick={() => handleQuestionChange(qIndex, 'tfCorrect', true)}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, minWidth: 120, bgcolor: question.tfCorrect ? '#22c55e' : undefined, color: question.tfCorrect ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }}>
                            صح
                          </Button>
                          <Button variant={!question.tfCorrect ? 'contained' : 'outlined'} onClick={() => handleQuestionChange(qIndex, 'tfCorrect', false)}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, minWidth: 120, bgcolor: !question.tfCorrect ? '#ef4444' : undefined, color: !question.tfCorrect ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }}>
                            خطأ
                          </Button>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}

              <Divider sx={{ my: 2, borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
              <Button fullWidth variant="contained" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSubmit} disabled={saving || questions.length === 0}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' }}>
                {saving ? 'جاري الحفظ...' : `حفظ الأسئلة (${questions.length})`}
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default AddContestQuestions;
