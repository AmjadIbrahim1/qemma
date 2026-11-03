// frontend/src/pages/teacher/UploadLesson.jsx
// ربط كامل: Frontend → Backend → Database
// يجلب كورسات المدرس الحقيقية — يرفع الفيديو والـ PDF عبر multipart/form-data

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import {
  Container, Box, Typography, Card, CardContent, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Grid, IconButton,
  LinearProgress, Chip, Alert, Paper, List, ListItem,
  ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import {
  ArrowBack, CloudUpload, VideoLibrary, PictureAsPdf,
  CheckCircle, AttachFile, Close, Refresh,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import coursesService from '../../services/courses.service';
import lessonsService  from '../../services/lessons.service';

const UploadLesson = () => {
  const navigate   = useNavigate();
  const { darkMode } = useTheme();

  // ── Courses from API ──────────────────────────────────────────
  const [courses,        setCourses]        = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError,   setCoursesError]   = useState(null);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const res  = await coursesService.getMyCourses();
      const data = res?.data?.data ?? res?.data ?? [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setCoursesError('فشل تحميل الكورسات');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Upload state ──────────────────────────────────────────────
  const [loading,        setLoading]        = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const videoInputRef = useRef(null);
  const pdfInputRef   = useRef(null);

  // ── Lesson form ───────────────────────────────────────────────
  const [lessonData, setLessonData] = useState({
    courseId:    '',
    title:       '',
    content:     '',
    summary:     '',
    order:       1,
    isPublished: true,
  });

  // ── Files ─────────────────────────────────────────────────────
  const [videoFile,    setVideoFile]    = useState(null);
  const [pdfFile,      setPdfFile]      = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // ── Errors ────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('يرجى اختيار ملف فيديو صالح');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('حجم الفيديو يجب أن يكون أقل من 500 ميجابايت');
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    toast.success('تم اختيار الفيديو ✅');
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('يرجى اختيار ملف PDF صالح');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم ملف PDF يجب أن يكون أقل من 50 ميجابايت');
      return;
    }
    setPdfFile(file);
    toast.success('تم اختيار ملف PDF ✅');
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!lessonData.courseId)    newErrors.courseId = 'يرجى اختيار الكورس';
    if (!lessonData.title.trim()) newErrors.title   = 'عنوان الدرس مطلوب';
    if (!videoFile && !pdfFile)  newErrors.files    = 'يرجى رفع فيديو أو ملف PDF على الأقل';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      await lessonsService.createLesson(
        lessonData,
        videoFile,
        pdfFile,
        (percent) => setUploadProgress(percent),
      );

      setUploadProgress(100);
      toast.success('تم رفع الدرس بنجاح! 🎉');

      setTimeout(() => navigate('/teacher/my-courses'), 1200);
    } catch (err) {
      console.error('❌ Upload error:', err);
      const msg = err?.response?.data?.message || 'فشل رفع الدرس';
      toast.error(msg);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', py: 4 }}>
      <Container maxWidth="lg">

        {/* ── Header ── */}
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/teacher/dashboard')}
            sx={{ mb: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : 'inherit' }}>
            العودة للوحة التحكم
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 50, height: 50, borderRadius: 2,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <CloudUpload />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                رفع درس جديد
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                أضف محتوى تعليمي جديد لطلابك
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>

          {/* ════ Main Form ════ */}
          <Grid item xs={12} lg={8}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit}>

                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    معلومات الدرس
                  </Typography>

                  <Grid container spacing={3}>

                    {/* ── Course selector ── */}
                    <Grid item xs={12}>
                      {coursesLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                          <CircularProgress size={24} />
                          <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                            جاري تحميل الكورسات...
                          </Typography>
                        </Box>
                      ) : coursesError ? (
                        <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}
                          action={
                            <Button color="inherit" size="small" startIcon={<Refresh />}
                              onClick={fetchCourses} sx={{ fontFamily: 'Cairo, sans-serif' }}>
                              إعادة
                            </Button>
                          }>
                          {coursesError}
                        </Alert>
                      ) : courses.length === 0 ? (
                        <Alert severity="warning" sx={{ fontFamily: 'Cairo, sans-serif' }}
                          action={
                            <Button color="inherit" size="small"
                              onClick={() => navigate('/teacher/courses/new')}
                              sx={{ fontFamily: 'Cairo, sans-serif' }}>
                              إنشاء كورس
                            </Button>
                          }>
                          لا توجد كورسات بعد. أنشئ كورساً أولاً ثم ارفع الدروس.
                        </Alert>
                      ) : (
                        <FormControl fullWidth required error={!!errors.courseId}>
                          <InputLabel sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined }}>
                            اختر الكورس
                          </InputLabel>
                          <Select
                            name="courseId"
                            value={lessonData.courseId}
                            onChange={handleChange}
                            label="اختر الكورس"
                            sx={{
                              fontFamily: 'Cairo, sans-serif',
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? '#334155' : undefined },
                              '& .MuiSelect-select': { color: darkMode ? '#f1f5f9' : undefined },
                            }}
                          >
                            {courses.map(course => (
                              <MenuItem key={course.id} value={course.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 1 }}>
                                  <Typography fontFamily="Cairo, sans-serif" fontWeight={700}>
                                    {course.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                    {course.category && (
                                      <Chip label={course.category} size="small"
                                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '11px' }} />
                                    )}
                                    {course.level && (
                                      <Chip label={course.level} size="small" color="primary"
                                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '11px' }} />
                                    )}
                                    <Chip
                                      label={`${course.stats?.lessons ?? 0} درس`}
                                      size="small" variant="outlined"
                                      sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '11px' }}
                                    />
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.courseId && (
                            <Typography variant="caption" color="error" fontFamily="Cairo, sans-serif" sx={{ mt: 0.5, mr: 1.5 }}>
                              {errors.courseId}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    </Grid>

                    {/* ── Title ── */}
                    <Grid item xs={12}>
                      <TextField fullWidth required name="title" label="عنوان الدرس"
                        value={lessonData.title} onChange={handleChange}
                        placeholder="مثال: المعادلات من الدرجة الأولى"
                        error={!!errors.title} helperText={errors.title}
                        sx={inputSx}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* ── Summary ── */}
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={2} name="summary"
                        label="ملخص الدرس" value={lessonData.summary} onChange={handleChange}
                        placeholder="ملخص مختصر عن محتوى الدرس..."
                        sx={inputSx}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* ── Content ── */}
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={4} name="content"
                        label="محتوى الدرس (اختياري)" value={lessonData.content} onChange={handleChange}
                        placeholder="اكتب شرح تفصيلي أو ملاحظات عن الدرس..."
                        sx={inputSx}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* ── Order ── */}
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" name="order"
                        label="ترتيب الدرس" value={lessonData.order} onChange={handleChange}
                        inputProps={{ min: 1 }}
                        sx={inputSx}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* ── Publish toggle ── */}
                    <Grid item xs={12} sm={6}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        p: 2, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                        borderRadius: 2, height: '56px',
                      }}>
                        <Typography fontFamily="Cairo, sans-serif" fontWeight={700}
                          sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          نشر الدرس فوراً
                        </Typography>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                          <input
                            type="checkbox" checked={lessonData.isPublished}
                            onChange={e => setLessonData(prev => ({ ...prev, isPublished: e.target.checked }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: lessonData.isPublished ? '#8b5cf6' : '#475569',
                            borderRadius: '26px', transition: '0.3s',
                          }} />
                          <span style={{
                            position: 'absolute', top: '3px',
                            left: lessonData.isPublished ? '25px' : '3px',
                            width: '20px', height: '20px', background: 'white',
                            borderRadius: '50%', transition: '0.3s',
                          }} />
                        </label>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* ════ File Uploads ════ */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                      الملفات
                    </Typography>

                    {errors.files && (
                      <Alert severity="error" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>
                        {errors.files}
                      </Alert>
                    )}

                    {/* ── Video Upload ── */}
                    <Paper elevation={0} sx={{
                      p: 3, mb: 3, border: '2px dashed',
                      borderColor: videoFile ? '#8b5cf6' : (darkMode ? '#334155' : '#e5e7eb'),
                      bgcolor: darkMode ? '#0f172a' : '#f9fafb', textAlign: 'center',
                      transition: 'border-color 0.2s',
                    }}>
                      <input ref={videoInputRef} type="file" accept="video/*"
                        onChange={handleVideoSelect} style={{ display: 'none' }} />

                      {!videoFile ? (
                        <Box>
                          <VideoLibrary sx={{ fontSize: 60, color: darkMode ? '#475569' : '#d1d5db', mb: 2 }} />
                          <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700}
                            sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            رفع فيديو الدرس
                          </Typography>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ mb: 2, color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                            الحد الأقصى: 500 ميجابايت — MP4, AVI, MOV, WMV
                          </Typography>
                          <Button variant="contained" onClick={() => videoInputRef.current?.click()}
                            startIcon={<CloudUpload />}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)' }}>
                            اختيار فيديو
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 2, mb: 2,
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <VideoLibrary sx={{ color: '#8b5cf6', fontSize: 30 }} />
                              <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700}
                                  sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                                  {videoFile.name}
                                </Typography>
                                <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>
                                  {formatFileSize(videoFile.size)}
                                </Typography>
                              </Box>
                            </Box>
                            <IconButton onClick={handleRemoveVideo} color="error" disabled={loading}>
                              <Close />
                            </IconButton>
                          </Box>
                          {videoPreview && (
                            <video src={videoPreview} controls
                              style={{ width: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                          )}
                        </Box>
                      )}
                    </Paper>

                    {/* ── PDF Upload ── */}
                    <Paper elevation={0} sx={{
                      p: 3, border: '2px dashed',
                      borderColor: pdfFile ? '#dc2626' : (darkMode ? '#334155' : '#e5e7eb'),
                      bgcolor: darkMode ? '#0f172a' : '#f9fafb', textAlign: 'center',
                      transition: 'border-color 0.2s',
                    }}>
                      <input ref={pdfInputRef} type="file" accept=".pdf"
                        onChange={handlePdfSelect} style={{ display: 'none' }} />

                      {!pdfFile ? (
                        <Box>
                          <PictureAsPdf sx={{ fontSize: 60, color: darkMode ? '#475569' : '#d1d5db', mb: 2 }} />
                          <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700}
                            sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            رفع ملف PDF (اختياري)
                          </Typography>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif"
                            sx={{ mb: 2, color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                            ملاحظات، تمارين، أو مواد إضافية (الحد الأقصى: 50 ميجابايت)
                          </Typography>
                          <Button variant="outlined" onClick={() => pdfInputRef.current?.click()}
                            startIcon={<AttachFile />}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: darkMode ? '#334155' : undefined, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            اختيار PDF
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 2, bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 2,
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PictureAsPdf sx={{ color: '#dc2626', fontSize: 30 }} />
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700}
                                sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                                {pdfFile.name}
                              </Typography>
                              <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>
                                {formatFileSize(pdfFile.size)}
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton onClick={handleRemovePdf} color="error" disabled={loading}>
                            <Close />
                          </IconButton>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  {/* ── Upload Progress ── */}
                  {loading && (
                    <Box sx={{ mt: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
                          sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          {uploadProgress < 100 ? 'جاري الرفع...' : 'تم الرفع ✅'}
                        </Typography>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
                          sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={uploadProgress}
                        sx={{
                          height: 8, borderRadius: 4,
                          bgcolor: darkMode ? '#334155' : '#e5e7eb',
                          '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6', borderRadius: 4 },
                        }}
                      />
                    </Box>
                  )}

                  {/* ── Actions ── */}
                  <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={() => navigate('/teacher/dashboard')}
                      disabled={loading}
                      sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: darkMode ? '#334155' : undefined, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                      إلغاء
                    </Button>
                    <Button fullWidth type="submit" variant="contained" size="large"
                      disabled={loading || coursesLoading || courses.length === 0}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                      sx={{
                        fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' },
                      }}>
                      {loading ? `جاري الرفع... ${uploadProgress}%` : 'رفع الدرس'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ════ Sidebar ════ */}
          <Grid item xs={12} lg={4}>

            {/* Tips */}
            <Card sx={{ ...cardSx, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                  نصائح لرفع الدروس
                </Typography>
                <List disablePadding>
                  {[
                    'استخدم عناوين واضحة ووصفية للدروس',
                    'تأكد من جودة الفيديو والصوت قبل الرفع',
                    'أضف ملف PDF للملاحظات والتمارين',
                    'رتّب الدروس بشكل منطقي ومتسلسل',
                    'اكتب ملخصاً مختصراً ليستفيد منه الطالب',
                  ].map((tip, i) => (
                    <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        <CheckCircle sx={{ color: '#059669', fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText primary={
                        <Typography variant="body2" fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                          {tip}
                        </Typography>
                      } />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* File formats */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                  صيغ الملفات المدعومة
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700}
                    sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    الفيديو:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['MP4', 'AVI', 'MOV', 'WMV'].map(f => (
                      <Chip key={f} label={f} size="small" sx={{ fontFamily: 'Cairo, sans-serif' }} />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700}
                    sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    المستندات:
                  </Typography>
                  <Chip label="PDF" size="small" sx={{ fontFamily: 'Cairo, sans-serif' }} />
                </Box>

                {/* Selected course info */}
                {lessonData.courseId && (() => {
                  const c = courses.find(x => x.id === lessonData.courseId);
                  return c ? (
                    <Box sx={{ mt: 3, p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}
                        sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', display: 'block', mb: 0.5 }}>
                        الكورس المختار:
                      </Typography>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
                        sx={{ color: darkMode ? '#f1f5f9' : 'inherit', mb: 0.5 }}>
                        {c.title}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>
                        {c.stats?.lessons ?? 0} درس حالياً
                      </Typography>
                    </Box>
                  ) : null;
                })()}
              </CardContent>
            </Card>

          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default UploadLesson;