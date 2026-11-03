// frontend/src/pages/teacher/TeacherAssignmentsPage.jsx
// Full system: teacher creates assignments → students submit → teacher grades

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import {
  Container, Box, Typography, Card, CardContent, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton,
  LinearProgress, Chip, Alert, Paper, List, ListItem,
  ListItemText, CircularProgress, Tabs, Tab, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  ArrowBack, Assignment, LibraryBooks, School, Send,
  CheckCircle, PendingActions, Grade, Visibility,
  CalendarMonth, Description, Close,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import assignmentsService from '../../services/assignments.service';

const TeacherAssignmentsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // ── Tab state ──────────────────────────────────────────────────
  const [tab, setTab] = useState(0); // 0: create, 1: view

  // ── Courses ────────────────────────────────────────────────────
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // ── Lessons per selected course ─────────────────────────────────
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);

  // ── Form state ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    courseId: '',
    lessonId: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    isPublished: true,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Assignments list ───────────────────────────────────────────
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [filterCourse, setFilterCourse] = useState('');

  // ── Assignment detail (submissions) ─────────────────────────────
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);

  // ── Grading dialog ─────────────────────────────────────────────
  const [gradeDialog, setGradeDialog] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // ── File preview (inline) ──────────────────────────────────────
  const [previewFile, setPreviewFile] = useState(null);

  // ── Fetch courses ──────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await assignmentsService.getTeacherCourses();
      setCourses(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      toast.error('فشل تحميل الكورسات');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Fetch lessons when course changes ──────────────────────────
  useEffect(() => {
    if (!form.courseId) { setLessons([]); return; }
    setLessonsLoading(true);
    assignmentsService.getCourseLessons(form.courseId)
      .then(res => setLessons(Array.isArray(res?.data?.data) ? res.data.data : []))
      .catch(() => setLessons([]))
      .finally(() => setLessonsLoading(false));
  }, [form.courseId]);

  // ── Fetch assignments ─────────────────────────────────────────
  const fetchAssignments = useCallback(async (courseId) => {
    setAssignmentsLoading(true);
    try {
      const res = await assignmentsService.getTeacherAssignments(courseId || undefined);
      setAssignments(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch {
      toast.error('فشل تحميل الواجبات');
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) fetchAssignments(filterCourse);
  }, [tab, filterCourse, fetchAssignments]);

  // ── Form handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.courseId) newErrors.courseId = 'اختر الكورس';
    if (!form.title.trim()) newErrors.title = 'عنوان الواجب مطلوب';
    if (!form.maxScore || form.maxScore < 1) newErrors.maxScore = 'الدرجة القصوى يجب أن تكون 1 على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await assignmentsService.createAssignment(form);
      toast.success('تم إنشاء الواجب بنجاح! 🎉');
      setForm({ courseId: '', lessonId: '', title: '', description: '', dueDate: '', maxScore: 100, isPublished: true });
      setTab(1);
      fetchAssignments(filterCourse);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل إنشاء الواجب');
    } finally {
      setSubmitting(false);
    }
  };

  // ── View assignment detail ─────────────────────────────────────
  const handleViewDetail = async (assignmentId) => {
    setDetailLoading(true);
    setDetailDialog(true);
    try {
      const res = await assignmentsService.getAssignmentDetail(assignmentId);
      setSelectedAssignment(res?.data?.data || null);
    } catch {
      toast.error('فشل تحميل تفاصيل الواجب');
      setDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Grade submission ───────────────────────────────────────────
  const handleOpenGrade = (submission) => {
    setGradingSubmission(submission);
    setGradeScore(submission.score?.toString() || '');
    setGradeFeedback(submission.feedback || '');
    setGradeDialog(true);
  };

  const handleGrade = async () => {
    if (!gradingSubmission) return;
    try {
      await assignmentsService.gradeSubmission(gradingSubmission.id, {
        score: parseInt(gradeScore) || 0,
        feedback: gradeFeedback,
      });
      toast.success('تم تصحيح الواجب ✅');
      setGradeDialog(false);
      // Refresh detail
      if (selectedAssignment) handleViewDetail(selectedAssignment.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل التصحيح');
    }
  };
  // ── Build file URL ───────────────────────────
const getFileUrl = (path) => {
  if (!path) return '';

  // لو الرابط كامل بالفعل
  if (path.startsWith('http')) {
    return path;
  }

  // ضيفي رابط السيرفر الخاص بالـ backend
  return `http://localhost:5000${path}`;
};

  // ── Styles ────────────────────────────────────────────────────
  const cardSx = {
    elevation: 0,
    border: '1px solid',
    borderColor: darkMode ? '#334155' : '#e5e7eb',
    bgcolor: darkMode ? '#1e293b' : 'white',
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: darkMode ? '#334155' : undefined } },
    '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined },
    '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined },
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', pb: 4 }}>
      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        color: 'white', py: 4, px: 2, mb: 3,
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate('/teacher/dashboard')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                📝 إدارة الواجبات
              </Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                إنشاء واجبات جديدة ومتابعة تسليمات الطلاب
              </Typography>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(e, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 14 },
              '& .Mui-selected': { color: 'white !important' },
              '& .MuiTabs-indicator': { bgcolor: 'white' },
            }}>
            <Tab icon={<Assignment />} label="إنشاء واجب" iconPosition="start" />
            <Tab icon={<Visibility />} label="عرض الواجبات" iconPosition="start" />
          </Tabs>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {tab === 0 && (
          <Grid container spacing={3}>
            {/* ════ Create Assignment ════ */}
            <Grid item xs={12} lg={8}>
              <Card sx={cardSx}>
                <CardContent sx={{ p: 4 }}>
                  <Box component="form" onSubmit={handleCreate}>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                      إنشاء واجب جديد
                    </Typography>

                    <Grid container spacing={3}>
                      {/* Course */}
                      <Grid item xs={12} sm={6}>
                        {coursesLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                            <CircularProgress size={24} />
                            <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                              جاري تحميل الكورسات...
                            </Typography>
                          </Box>
                        ) : (
                          <FormControl fullWidth required error={!!errors.courseId}>
                            <InputLabel sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <School /> الكورس
                              </Box>
                            </InputLabel>
                            <Select name="courseId" value={form.courseId} onChange={handleChange}
                              label="الكورس" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                              {courses.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                  <Typography fontFamily="Cairo, sans-serif" fontWeight={700}>{c.title}</Typography>
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.courseId && <Typography variant="caption" color="error" fontFamily="Cairo, sans-serif">{errors.courseId}</Typography>}
                          </FormControl>
                        )}
                      </Grid>

                      {/* Lesson (optional) */}
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LibraryBooks /> الدرس (اختياري)
                            </Box>
                          </InputLabel>
                          <Select name="lessonId" value={form.lessonId} onChange={handleChange}
                            label="الدرس (اختياري)" sx={{ fontFamily: 'Cairo, sans-serif' }}
                            disabled={!form.courseId || lessonsLoading}>
                            <MenuItem value=""><em>بدون درس محدد</em></MenuItem>
                            {lessons.map(l => (
                              <MenuItem key={l.id} value={l.id}>
                                <Typography fontFamily="Cairo, sans-serif">{l.order} - {l.title}</Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Title */}
                      <Grid item xs={12}>
                        <TextField fullWidth required name="title" label="عنوان الواجب"
                          value={form.title} onChange={handleChange}
                          placeholder="مثال: حل تمارين الباب الثالث"
                          error={!!errors.title} helperText={errors.title}
                          sx={inputSx}
                          InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                      </Grid>

                      {/* Description */}
                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={3} name="description"
                          label="وصف الواجب" value={form.description} onChange={handleChange}
                          placeholder="اشرح ما هو مطلوب من الطلاب بالضبط..."
                          sx={inputSx}
                          InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                      </Grid>

                      {/* Due date */}
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth type="date" name="dueDate"
                          label="تاريخ التسليم" value={form.dueDate} onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          sx={inputSx}
                          InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                      </Grid>

                      {/* Max score */}
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth type="number" name="maxScore"
                          label="الدرجة القصوى" value={form.maxScore} onChange={handleChange}
                          inputProps={{ min: 1 }}
                          error={!!errors.maxScore} helperText={errors.maxScore}
                          sx={inputSx}
                          InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
                      </Grid>

                      {/* Published toggle */}
                      <Grid item xs={12}>
                        <Box sx={{
                          display: 'flex', alignItems: 'center', gap: 2, p: 2,
                          border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                          borderRadius: 2,
                        }}>
                          <Typography fontFamily="Cairo, sans-serif" fontWeight={700}
                            sx={{ flex: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            نشر الواجب فوراً للطلاب
                          </Typography>
                          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isPublished}
                              onChange={e => setForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                              style={{ opacity: 0, width: 0, height: 0 }} />
                            <span style={{
                              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                              background: form.isPublished ? '#8b5cf6' : '#475569',
                              borderRadius: '26px', transition: '0.3s',
                            }} />
                            <span style={{
                              position: 'absolute', top: '3px',
                              left: form.isPublished ? '25px' : '3px',
                              width: '20px', height: '20px', background: 'white',
                              borderRadius: '50%', transition: '0.3s',
                            }} />
                          </label>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Actions */}
                    <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                      <Button variant="outlined" onClick={() => navigate('/teacher/dashboard')}
                        disabled={submitting}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                        إلغاء
                      </Button>
                      <Button fullWidth type="submit" variant="contained" size="large"
                        disabled={submitting || coursesLoading}
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                          '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' },
                        }}>
                        {submitting ? 'جاري الإنشاء...' : 'إنشاء الواجب'}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar tips */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ ...cardSx, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    💡 نصائح
                  </Typography>
                  <List disablePadding>
                    {[
                      'اختر كورساً محدداً للواجب',
                      'اربط الواجب بدرس معين إن أمكن',
                      'حدد تاريخ تسليم واضح',
                      'اكتب وصفاً مفصلاً للمطلوب',
                      'يمكنك النشر فوراً أو لاحقاً',
                    ].map((tip, i) => (
                      <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                        <CheckCircle sx={{ color: '#059669', fontSize: 18, mt: 0.3, mr: 1 }} />
                        <ListItemText primary={
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>{tip}</Typography>
                        } />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <>
            {/* ════ Filter ─────────────── */}
            <Card sx={{ ...cardSx, mb: 3, p: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <School sx={{ color: darkMode ? '#94a3b8' : '#64748b' }} />
                <FormControl sx={{ minWidth: 250 }} size="small">
                  <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>فلترة حسب الكورس</InputLabel>
                  <Select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}
                    label="فلترة حسب الكورس" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                    <MenuItem value=""><em>جميع الكورسات</em></MenuItem>
                    {courses.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        <Typography fontFamily="Cairo, sans-serif">{c.title}</Typography>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={() => { setTab(0); }}
                  startIcon={<Assignment />}
                  sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', mr: 'auto' }}>
                  إنشاء واجب جديد
                </Button>
              </Box>
            </Card>

            {/* ════ Assignments List ───── */}
            {assignmentsLoading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress />
                <Typography fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                  جاري تحميل الواجبات...
                </Typography>
              </Box>
            ) : assignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, ...cardSx, borderRadius: 3 }}>
                <Assignment sx={{ fontSize: 64, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700}
                  sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
                  لا توجد واجبات بعد
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 3 }}>
                  أنشئ أول واجب الآن
                </Typography>
                <Button variant="contained" onClick={() => setTab(0)}
                  startIcon={<Assignment />}
                  sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                  إنشاء واجب
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {assignments.map(a => (
                  <Grid item xs={12} md={6} lg={4} key={a.id}>
                    <Card elevation={0} sx={{
                      border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                      bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3,
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: darkMode ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 25px rgba(0,0,0,0.1)' },
                    }}>
                      <Box sx={{ height: 4, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }} />
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                          <Assignment sx={{ color: '#8b5cf6', mt: 0.3 }} />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={800} fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                              {a.title}
                            </Typography>
                            <Chip label={a.courseTitle} size="small"
                              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: '#8b5cf615', color: '#8b5cf6', height: 24 }} />
                            {a.lessonTitle && (
                              <Chip label={`📖 ${a.lessonTitle}`} size="small"
                                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: '#6366f115', color: '#6366f1', height: 24, mr: 0.5 }} />
                            )}
                          </Box>
                          <Chip label={`${a.maxScore} درجات`} size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: '#05966915', color: '#059669' }} />
                        </Box>

                        {a.description && (
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {a.description}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1.5, bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2 }}>
                          <PendingActions sx={{ fontSize: 18, color: '#8b5cf6' }} />
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
                            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                            التسليمات: {a.submissionsCount}
                          </Typography>
                          {a.dueDate && (
                            <>
                              <CalendarMonth sx={{ fontSize: 16, color: '#64748b', mr: 1 }} />
                              <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                                {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                              </Typography>
                            </>
                          )}
                        </Box>

                        <Button fullWidth variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetail(a.id)}
                          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: '#8b5cf6', color: '#8b5cf6', borderRadius: 2 }}>
                          عرض التسليمات
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* ════════════ Detail Dialog ───────────────────────────── */}
        <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment sx={{ color: '#8b5cf6' }} />
            {selectedAssignment?.title || 'تفاصيل الواجب'}
            <IconButton onClick={() => setDetailDialog(false)} sx={{ mr: 'auto' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
            ) : selectedAssignment ? (
              <>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  <Chip label={`📚 ${selectedAssignment.courseTitle}`} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                  <Chip label={`📝 ${selectedAssignment.submissions?.length || 0} تسليم`} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                  <Chip label={`🏆 ${selectedAssignment.maxScore} درجة`} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                  {selectedAssignment.dueDate && (
                    <Chip label={`📅 ${new Date(selectedAssignment.dueDate).toLocaleDateString('ar-EG')}`} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                  )}
                </Box>

                {selectedAssignment.submissions?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PendingActions sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
                    <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      لا توجد تسليمات بعد
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {selectedAssignment.submissions?.map((s, idx) => (
                      <Paper key={s.id} elevation={0} sx={{
                        p: 2, mb: 1.5,
                        border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                        bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2,
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: '#8b5cf6', width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
                            {s.studentName?.[0] || '?'}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={700} fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                              {s.studentName || 'طالب'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                                🕒 {new Date(s.submittedAt).toLocaleString('ar-EG')}
                              </Typography>
                            </Box>
                          </Box>
                          {s.score !== null ? (
                            <Chip label={`${s.score}/${selectedAssignment.maxScore}`}
                              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: s.score >= 50 ? '#05966915' : '#ef444415', color: s.score >= 50 ? '#059669' : '#ef4444' }} />
                          ) : (
                            <Button variant="contained" size="small"
                              startIcon={<Grade />}
                              onClick={() => handleOpenGrade(s)}
                              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 11, bgcolor: '#8b5cf6' }}>
                              تصحيح
                            </Button>
                          )}
                        </Box>
                        {s.notes && (
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ mt: 1, color: darkMode ? '#94a3b8' : '#64748b', p: 1, bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 1 }}>
                            📝 {s.notes}
                          </Typography>
                        )}
                        {s.feedback && (
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ mt: 1, color: '#059669', p: 1, bgcolor: '#05966910', borderRadius: 1 }}>
                            💬 {s.feedback}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </List>
                )}

              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* ════════════ Grade Dialog ─────────────────────────────── */}
        <Dialog open={gradeDialog} onClose={() => setGradeDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}>
            📊 تصحيح الواجب
          </DialogTitle>
          <DialogContent>
            {gradingSubmission && (
              <Box sx={{ mt: 1 }}>
                <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 2 }}>
                  الطالب: {gradingSubmission.studentName}
                </Typography>
                {gradingSubmission.fileUrl && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: '#8b5cf610', borderRadius: 2, textAlign: 'center' }}>
                    <Button
                      startIcon={<Description />}
                      onClick={() => {
                        console.log("Original file:", gradingSubmission.fileUrl);
                        console.log("Final URL:", getFileUrl(gradingSubmission.fileUrl));
                        setPreviewFile(getFileUrl(gradingSubmission.fileUrl));
                      }}
                      sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: '#8b5cf6' }}>
                      عرض ملف الطالب
                    </Button>
                  </Box>
                )}
                <TextField fullWidth label="الدرجة" type="number" value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                  inputProps={{ min: 0, max: selectedAssignment?.maxScore || 100 }} />
                <TextField fullWidth multiline rows={3} label="ملاحظات (اختياري)"
                  value={gradeFeedback} onChange={(e) => setGradeFeedback(e.target.value)}
                  InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }} />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setGradeDialog(false)}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
              إلغاء
            </Button>
            <Button variant="contained" onClick={handleGrade}
              startIcon={<Grade />}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: '#8b5cf6' }}>
              حفظ التصحيح
            </Button>
          </DialogActions>
        </Dialog>

        {/* ════════════ File Preview Dialog ──────────────────────────── */}
        <Dialog open={!!previewFile} onClose={() => setPreviewFile(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            معاينة الملف
            <IconButton onClick={() => setPreviewFile(null)} sx={{ mr: 'auto' }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {previewFile && (
              <iframe src={previewFile} width="100%" height="600px" style={{ border: 'none' }} title="معاينة الملف" />
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TeacherAssignmentsPage;
