// frontend/src/pages/teacher/MyCourses.jsx
// ربط حقيقي: Frontend → Backend → Database
// يجلب كورسات المدرس الفعلية من API
// تعديل الكورس يفتح Dialog حقيقي متصل بـ Backend
// حذف الكورس يظهر Popup تأكيد قبل الحذف

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import {
  Container, Box, Typography, Card, CardContent, Button, Grid,
  Chip, IconButton, Menu, MenuItem, TextField, InputAdornment,
  Tab, Tabs, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, Switch, FormControlLabel,
  Paper, Divider,
} from '@mui/material';
import {
  ArrowBack, Add, Search, MoreVert, Edit, Delete,
  Visibility, School, Assignment, People, TrendingUp,
  VideoLibrary, Refresh, Warning, Close, Save, Image as ImageIcon,
  CheckCircle, CloudUpload, PictureAsPdf, AttachFile, MenuBook,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import coursesService from '../../services/courses.service';
import lessonsService from '../../services/lessons.service';

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────
const DeleteConfirmDialog = ({ open, course, onClose, onConfirm, loading, darkMode }) => (
  <Dialog
    open={open}
    onClose={!loading ? onClose : undefined}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        bgcolor: darkMode ? '#1e293b' : 'white',
        border: '1px solid',
        borderColor: darkMode ? '#334155' : '#e5e7eb',
        borderRadius: 3,
      },
    }}
  >
    <DialogTitle sx={{ pb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          bgcolor: 'rgba(220,38,38,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Warning sx={{ color: '#dc2626', fontSize: 24 }} />
        </Box>
        <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18}
          sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
          تأكيد حذف الكورس
        </Typography>
      </Box>
    </DialogTitle>

    <DialogContent sx={{ pt: 1 }}>
      <Typography fontFamily="Cairo, sans-serif" fontSize={15}
        sx={{ color: darkMode ? '#94a3b8' : '#475569', mb: 2 }}>
        هل أنت متأكد أنك تريد حذف الكورس التالي؟
      </Typography>

      <Box sx={{
        p: 2, borderRadius: 2,
        bgcolor: darkMode ? '#0f172a' : '#f8fafc',
        border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
        mb: 2,
      }}>
        <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={16}
          sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
          {course?.title}
        </Typography>
        {course?.description && (
          <Typography fontFamily="Cairo, sans-serif" fontSize={13}
            sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 0.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
            {course.description}
          </Typography>
        )}
      </Box>

      <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif', fontSize: 13 }}>
        ⚠️ هذا الإجراء لا يمكن التراجع عنه — سيتم حذف الكورس وجميع دروسه نهائياً.
      </Alert>
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
      <Button
        onClick={onClose} disabled={loading}
        variant="outlined"
        sx={{
          fontFamily: 'Cairo, sans-serif', fontWeight: 700,
          borderColor: darkMode ? '#334155' : '#e2e8f0',
          color: darkMode ? '#94a3b8' : '#64748b',
        }}
      >
        إلغاء
      </Button>
      <Button
        onClick={onConfirm} disabled={loading}
        variant="contained"
        startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Delete />}
        sx={{
          fontFamily: 'Cairo, sans-serif', fontWeight: 700,
          bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' },
        }}
      >
        {loading ? 'جاري الحذف...' : 'نعم، احذف الكورس'}
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Edit Course Dialog ───────────────────────────────────────────────────────
const EditCourseDialog = ({ open, course, onClose, onSaved, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', level: '',
    price: '', duration: '', isPublished: false,
    thumbnail: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const imageInputRef = useRef(null);

  const categories = [
    'رياضيات','علوم','فيزياء','كيمياء','أحياء',
    'لغة عربية','لغة إنجليزية','لغة فرنسية','تاريخ','جغرافيا',
  ];
  const levels = [
    'الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي',
    'الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي',
    'مبتدئ','متوسط','متقدم',
  ];

  // تعبئة الفورم من بيانات الكورس
  useEffect(() => {
    if (course && open) {
      setFormData({
        title:       course.title       || '',
        description: course.description || '',
        category:    course.category    || '',
        level:       course.level       || '',
        price:       course.price       ?? '',
        duration:    course.duration    || '',
        isPublished: course.isPublished  || false,
        thumbnail:   null,
      });
      setImagePreview(course.thumbnail || null);
      setImageFile(null);
    }
  }, [course, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار صورة'); return; }
    if (file.size > 5 * 1024 * 1024)    { toast.error('الحجم الأقصى 5 ميجابايت'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) { toast.error('عنوان الكورس مطلوب'); return; }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        thumbnail: imageFile || undefined,
      };
      // إذا لا يوجد imageFile جديد، لا نرسل thumbnail (يحتفظ بالقديم)
      if (!imageFile && imagePreview === null) payload.thumbnailBase64 = null;

      const res = await coursesService.updateCourse(course.id, payload);
      const updated = res?.data?.data ?? res?.data ?? {};
      toast.success('تم تحديث الكورس بنجاح ✅');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تحديث الكورس');
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: darkMode ? '#334155' : undefined } },
    '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined, fontFamily: 'Cairo, sans-serif' },
    '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined },
  };
  const selectSx = {
    fontFamily: 'Cairo, sans-serif',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? '#334155' : undefined },
    '& .MuiSelect-select': { color: darkMode ? '#f1f5f9' : undefined },
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#1e293b' : 'white',
          border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
          borderRadius: 3, maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Edit fontSize="small" />
          </Box>
          <Box>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
              تعديل الكورس
            </Typography>
            <Typography fontFamily="Cairo, sans-serif" fontSize={12}
              sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
              قم بتحديث معلومات الكورس
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={loading}
          sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>

          {/* ── صورة الكورس ── */}
          <Grid item xs={12}>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={15}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a', mb: 1.5 }}>
              صورة الكورس
            </Typography>
            <Paper elevation={0} sx={{
              p: 2, border: '2px dashed',
              borderColor: darkMode ? '#334155' : '#e2e8f0',
              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
              borderRadius: 2, textAlign: 'center',
            }}>
              <input ref={imageInputRef} type="file" accept="image/*"
                onChange={handleImageSelect} style={{ display: 'none' }} />
              {imagePreview ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <img src={imagePreview} alt="preview"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                  <IconButton onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute', top: 8, right: 8,
                      bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, p: 0.5,
                    }}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <ImageIcon sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 1 }} />
                  <Typography fontFamily="Cairo, sans-serif" fontSize={13}
                    sx={{ color: darkMode ? '#64748b' : '#94a3b8', mb: 1 }}>
                    لا توجد صورة — اضغط لرفع صورة جديدة
                  </Typography>
                </Box>
              )}
              <Button variant="outlined" size="small"
                onClick={() => imageInputRef.current?.click()}
                sx={{
                  mt: 1, fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
                  borderColor: darkMode ? '#475569' : '#cbd5e1',
                  color: darkMode ? '#94a3b8' : '#64748b',
                }}>
                {imagePreview ? 'تغيير الصورة' : 'اختر صورة'}
              </Button>
            </Paper>
          </Grid>

          {/* ── العنوان ── */}
          <Grid item xs={12}>
            <TextField fullWidth required name="title" label="عنوان الكورس"
              value={formData.title} onChange={handleChange}
              placeholder="مثال: الرياضيات - الصف الأول الثانوي"
              sx={inputSx} />
          </Grid>

          {/* ── الوصف ── */}
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={3} name="description" label="وصف الكورس"
              value={formData.description} onChange={handleChange}
              placeholder="اكتب وصفاً تفصيلياً للكورس..."
              sx={inputSx} />
          </Grid>

          {/* ── التصنيف ── */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined }}>
                التصنيف
              </InputLabel>
              <Select name="category" value={formData.category} onChange={handleChange}
                label="التصنيف" sx={selectSx}>
                {categories.map(c => (
                  <MenuItem key={c} value={c}>
                    <Typography fontFamily="Cairo, sans-serif" fontWeight={700}>{c}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ── المستوى ── */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined }}>
                المستوى
              </InputLabel>
              <Select name="level" value={formData.level} onChange={handleChange}
                label="المستوى" sx={selectSx}>
                {levels.map(l => (
                  <MenuItem key={l} value={l}>
                    <Typography fontFamily="Cairo, sans-serif" fontWeight={700}>{l}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* ── السعر ── */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" name="price" label="السعر (جنيه مصري)"
              value={formData.price} onChange={handleChange} placeholder="500"
              inputProps={{ min: 0 }} sx={inputSx} />
          </Grid>

          {/* ── المدة ── */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" name="duration" label="المدة (بالأسابيع)"
              value={formData.duration} onChange={handleChange} placeholder="8"
              inputProps={{ min: 1 }} sx={inputSx} />
          </Grid>

          {/* ── حالة النشر ── */}
          <Grid item xs={12}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, borderRadius: 2,
              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
              border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {formData.isPublished
                  ? <CheckCircle sx={{ color: '#059669', fontSize: 20 }} />
                  : <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />
                }
                <Box>
                  <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={14}
                    sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                    {formData.isPublished ? 'الكورس منشور ومرئي للطلاب' : 'الكورس غير منشور (مسودة)'}
                  </Typography>
                  <Typography fontFamily="Cairo, sans-serif" fontSize={12}
                    sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                    {formData.isPublished
                      ? 'يمكن للطلاب رؤيته والتسجيل فيه'
                      : 'لن يظهر للطلاب حتى تقوم بنشره'}
                  </Typography>
                </Box>
              </Box>
              <Switch
                checked={formData.isPublished}
                onChange={handleChange}
                name="isPublished"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b5cf6' },
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined"
          sx={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 700,
            borderColor: darkMode ? '#334155' : '#e2e8f0',
            color: darkMode ? '#94a3b8' : '#64748b',
          }}>
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit} disabled={loading} variant="contained"
          startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
          sx={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, px: 3,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' },
          }}>
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Lesson Edit Dialog ──────────────────────────────────────────────────────
const LessonEditDialog = ({ open, lesson, courseId, onClose, onSaved, darkMode }) => {
  const [formData, setFormData] = useState({
    title: '', content: '', summary: '', order: 1, isPublished: true,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const videoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  useEffect(() => {
    if (lesson && open) {
      setFormData({
        title: lesson.title || '',
        content: lesson.content || '',
        summary: lesson.summary || '',
        order: lesson.order || 1,
        isPublished: lesson.isPublished ?? true,
      });
      setVideoFile(null);
      setPdfFile(null);
      setErrors({});
    }
  }, [lesson, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { toast.error('يرجى اختيار ملف فيديو صالح'); return; }
    if (file.size > 500 * 1024 * 1024) { toast.error('حجم الفيديو يجب أن يكون أقل من 500 ميجابايت'); return; }
    setVideoFile(file);
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('يرجى اختيار ملف PDF صالح'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('حجم ملف PDF يجب أن يكون أقل من 50 ميجابايت'); return; }
    setPdfFile(file);
  };

  const handleRemoveVideo = () => { setVideoFile(null); if (videoInputRef.current) videoInputRef.current.value = ''; };
  const handleRemovePdf   = () => { setPdfFile(null);   if (pdfInputRef.current)   pdfInputRef.current.value   = ''; };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'عنوان الدرس مطلوب';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    try {
      await lessonsService.updateLesson(lesson.id, { ...formData, courseId }, videoFile, pdfFile);
      toast.success('تم تحديث الدرس بنجاح ✅');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تحديث الدرس');
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: darkMode ? '#334155' : undefined } },
    '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined, fontFamily: 'Cairo, sans-serif' },
    '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', color: darkMode ? '#94a3b8' : undefined },
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="md" fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#1e293b' : 'white',
          border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
          borderRadius: 3, maxHeight: '90vh',
        },
      }}>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          }}>
            <Edit fontSize="small" />
          </Box>
          <Box>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
              تعديل الدرس
            </Typography>
            <Typography fontFamily="Cairo, sans-serif" fontSize={12}
              sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
              {lesson?.title}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={loading}
          sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField fullWidth required name="title" label="عنوان الدرس"
              value={formData.title} onChange={handleChange}
              placeholder="مثال: المعادلات من الدرجة الأولى"
              error={!!errors.title} helperText={errors.title}
              sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} name="summary"
              label="ملخص الدرس" value={formData.summary} onChange={handleChange}
              placeholder="ملخص مختصر عن محتوى الدرس..."
              sx={inputSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={4} name="content"
              label="محتوى الدرس" value={formData.content} onChange={handleChange}
              placeholder="اكتب شرح تفصيلي أو ملاحظات عن الدرس..."
              sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth type="number" name="order"
              label="ترتيب الدرس" value={formData.order} onChange={handleChange}
              inputProps={{ min: 1 }} sx={inputSx} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
              borderRadius: 2, height: '56px',
            }}>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={700}
                sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                نشر الدرس
              </Typography>
              <Switch
                checked={formData.isPublished}
                onChange={e => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#8b5cf6' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#8b5cf6' },
                }}
              />
            </Box>
          </Grid>

          {/* Video replace */}
          <Grid item xs={12}>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={14}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              الفيديو {lesson?.videoUrl ? '(موجود حالياً — اختر فيديو جديداً لاستبداله)' : ''}
            </Typography>
            <input ref={videoInputRef} type="file" accept="video/*"
              onChange={handleVideoSelect} style={{ display: 'none' }} />
            {videoFile ? (
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2,
                border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideoLibrary sx={{ color: '#8b5cf6' }} />
                  <Typography fontFamily="Cairo, sans-serif" fontSize={13}
                    sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                    {videoFile.name}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleRemoveVideo}><Close fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Button variant="outlined" startIcon={<CloudUpload />}
                onClick={() => videoInputRef.current?.click()}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
                  borderColor: darkMode ? '#475569' : '#cbd5e1',
                  color: darkMode ? '#94a3b8' : '#64748b' }}>
                {lesson?.videoUrl ? 'استبدال الفيديو' : 'إضافة فيديو'}
              </Button>
            )}
          </Grid>

          {/* PDF replace */}
          <Grid item xs={12}>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={14}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a', mb: 1 }}>
              ملف PDF {lesson?.pdfFileRef ? '(موجود حالياً — اختر ملفاً جديداً لاستبداله)' : ''}
            </Typography>
            <input ref={pdfInputRef} type="file" accept=".pdf"
              onChange={handlePdfSelect} style={{ display: 'none' }} />
            {pdfFile ? (
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2,
                border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PictureAsPdf sx={{ color: '#dc2626' }} />
                  <Typography fontFamily="Cairo, sans-serif" fontSize={13}
                    sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                    {pdfFile.name}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleRemovePdf}><Close fontSize="small" /></IconButton>
              </Box>
            ) : (
              <Button variant="outlined" startIcon={<AttachFile />}
                onClick={() => pdfInputRef.current?.click()}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
                  borderColor: darkMode ? '#475569' : '#cbd5e1',
                  color: darkMode ? '#94a3b8' : '#64748b' }}>
                {lesson?.pdfFileRef ? 'استبدال PDF' : 'إضافة PDF'}
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined"
          sx={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 700,
            borderColor: darkMode ? '#334155' : '#e2e8f0',
            color: darkMode ? '#94a3b8' : '#64748b',
          }}>
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained"
          startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
          sx={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, px: 3,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' },
          }}>
          {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Lessons List Dialog ──────────────────────────────────────────────────────
const LessonsDialog = ({ open, course, onClose, onAddLesson, darkMode }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, lesson: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLesson, setEditLesson] = useState(null);

  const fetchLessons = useCallback(async () => {
    if (!course) return;
    setLoading(true);
    try {
      const res = await lessonsService.getCourseLessons(course.id);
      setLessons(res?.data?.data ?? []);
    } catch (err) {
      toast.error('فشل تحميل الدروس');
    } finally {
      setLoading(false);
    }
  }, [course]);

  useEffect(() => {
    if (open && course) fetchLessons();
  }, [open, course, fetchLessons]);

  const handleDeleteLesson = async () => {
    if (!deleteConfirm.lesson) return;
    setDeleteLoading(true);
    try {
      await lessonsService.deleteLesson(deleteConfirm.lesson.id);
      toast.success('تم حذف الدرس');
      setDeleteConfirm({ open: false, lesson: null });
      fetchLessons();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل حذف الدرس');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            bgcolor: darkMode ? '#1e293b' : 'white',
            border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            borderRadius: 3, minHeight: 400,
          },
        }}>
        {/* Header */}
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            }}>
              <MenuBook fontSize="small" />
            </Box>
            <Box>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18}
                sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                دروس الكورس
              </Typography>
              <Typography fontFamily="Cairo, sans-serif" fontSize={12}
                sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                {course?.title} — {lessons.length} درس
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />

        <DialogContent sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={48} />
            </Box>
          ) : lessons.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <MenuBook sx={{ fontSize: 64, color: darkMode ? '#334155' : '#e5e7eb', mb: 2 }} />
              <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={16}
                sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', mb: 1 }}>
                لا توجد دروس بعد
              </Typography>
              <Typography fontFamily="Cairo, sans-serif" fontSize={13}
                sx={{ color: darkMode ? '#64748b' : 'text.secondary', mb: 3 }}>
                أضف دروساً جديدة لهذا الكورس
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={onAddLesson}
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                }}>
                إضافة درس جديد
              </Button>
            </Box>
          ) : (
            <Box>
              {lessons.map((lesson, idx) => (
                <Paper key={lesson.id} elevation={0} sx={{
                  p: 2, mb: 1.5,
                  bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                  border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
                  borderRadius: 2,
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'translateX(-4px)' },
                }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          bgcolor: darkMode ? '#1e293b' : '#e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={13}
                            sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                            {idx + 1}
                          </Typography>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={14}
                            sx={{
                              color: darkMode ? '#f1f5f9' : '#0f172a',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                            {lesson.title}
                          </Typography>
                          <Typography fontFamily="Cairo, sans-serif" fontSize={11}
                            sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                            {lesson.summary ? (
                              <span style={{
                                display: 'inline-block', maxWidth: 250,
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap', verticalAlign: 'middle',
                              }}>
                                {lesson.summary}
                              </span>
                            ) : '—'}
                            {' · '}{formatDate(lesson.createdAt)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {lesson.videoUrl && (
                          <Chip icon={<VideoLibrary />} label="فيديو" size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 10 }} />
                        )}
                        {lesson.pdfFileRef && (
                          <Chip icon={<PictureAsPdf />} label="PDF" size="small"
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 10 }} />
                        )}
                        <Chip
                          label={lesson.isPublished ? 'منشور' : 'مسودة'}
                          size="small"
                          sx={{
                            fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 10,
                            bgcolor: lesson.isPublished
                              ? (darkMode ? 'rgba(5,150,105,0.2)' : '#f0fdf4')
                              : (darkMode ? 'rgba(245,158,11,0.2)' : '#fffbeb'),
                            color: lesson.isPublished ? '#059669' : '#b45309',
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <IconButton size="small" color="primary"
                          onClick={() => setEditLesson(lesson)}
                          sx={{ bgcolor: darkMode ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error"
                          onClick={() => setDeleteConfirm({ open: true, lesson })}
                          sx={{ bgcolor: darkMode ? 'rgba(220,38,38,0.1)' : 'rgba(220,38,38,0.05)' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>

        {lessons.length > 0 && (
          <>
            <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'center' }}>
              <Button variant="outlined" startIcon={<Add />} onClick={onAddLesson}
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  borderColor: darkMode ? '#475569' : '#cbd5e1',
                  color: darkMode ? '#94a3b8' : '#64748b',
                }}>
                إضافة درس جديد
              </Button>
            </Box>
          </>
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm.open} onClose={() => !deleteLoading && setDeleteConfirm({ open: false, lesson: null })}
        maxWidth="sm" fullWidth
        PaperProps={{
          sx: {
            bgcolor: darkMode ? '#1e293b' : 'white',
            border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            borderRadius: 3,
          },
        }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Warning sx={{ color: '#dc2626', fontSize: 24 }} />
            </Box>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
              تأكيد حذف الدرس
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography fontFamily="Cairo, sans-serif" fontSize={15}
            sx={{ color: darkMode ? '#94a3b8' : '#475569', mb: 2 }}>
            هل أنت متأكد أنك تريد حذف الدرس التالي؟
          </Typography>
          <Box sx={{
            p: 2, borderRadius: 2,
            bgcolor: darkMode ? '#0f172a' : '#f8fafc',
            border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
          }}>
            <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={15}
              sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
              {deleteConfirm.lesson?.title}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteConfirm({ open: false, lesson: null })} disabled={deleteLoading}
            variant="outlined"
            sx={{
              fontFamily: 'Cairo, sans-serif', fontWeight: 700,
              borderColor: darkMode ? '#334155' : '#e2e8f0',
              color: darkMode ? '#94a3b8' : '#64748b',
            }}>
            إلغاء
          </Button>
          <Button onClick={handleDeleteLesson} disabled={deleteLoading} variant="contained"
            startIcon={deleteLoading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Delete />}
            sx={{
              fontFamily: 'Cairo, sans-serif', fontWeight: 700,
              bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' },
            }}>
            {deleteLoading ? 'جاري الحذف...' : 'نعم، احذف الدرس'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit lesson dialog */}
      <LessonEditDialog
        open={Boolean(editLesson)}
        lesson={editLesson}
        courseId={course?.id}
        onClose={() => setEditLesson(null)}
        onSaved={fetchLessons}
        darkMode={darkMode}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyCourses = () => {
  const navigate    = useNavigate();
  const { darkMode } = useTheme();

  const [courses,         setCourses]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [tabValue,        setTabValue]        = useState(0);
  const [anchorEl,        setAnchorEl]        = useState(null);
  const [selectedCourse,  setSelectedCourse]  = useState(null);
  const [deletingId,      setDeletingId]      = useState(null);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, course: null });
  const [editDialog,   setEditDialog]   = useState({ open: false, course: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lessonsDialogCourse, setLessonsDialogCourse] = useState(null);

  // ── Fetch courses ─────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await coursesService.getMyCourses();
      const data = res?.data?.data ?? res?.data ?? [];
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'فشل تحميل الكورسات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Menu helpers ──────────────────────────────────────────────
  const handleMenuClick  = (e, course) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setSelectedCourse(course); };
  const handleMenuClose  = ()          => { setAnchorEl(null); setSelectedCourse(null); };

  // ── Open edit dialog ──────────────────────────────────────────
  const openEdit = (course) => {
    handleMenuClose();
    setEditDialog({ open: true, course });
  };

  const handleEditSaved = (updatedCourse) => {
    setCourses(prev =>
      prev.map(c => c.id === updatedCourse.id ? { ...c, ...updatedCourse } : c)
    );
  };

  // ── Open lessons dialog ───────────────────────────────────────
  const openLessons = (course) => {
    setLessonsDialogCourse(course);
  };

  const handleLessonsEditSaved = () => {
    // lessons are refetched inside LessonsDialog; also update course stats
    fetchCourses();
  };

  // ── Open delete confirm ───────────────────────────────────────
  const openDeleteConfirm = () => {
    if (!selectedCourse) return;
    setDeleteDialog({ open: true, course: selectedCourse });
    handleMenuClose();
  };

  // ── Confirm delete ────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteDialog.course) return;
    const { id, title } = deleteDialog.course;
    setDeleteLoading(true);
    try {
      await coursesService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success(`تم حذف الكورس: ${title}`);
      setDeleteDialog({ open: false, course: null });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل حذف الكورس');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Toggle publish ────────────────────────────────────────────
  const handleTogglePublish = async (course) => {
    try {
      const res    = await coursesService.togglePublish(course.id);
      const newVal = res?.data?.data?.isPublished ?? !course.isPublished;
      setCourses(prev =>
        prev.map(c => c.id === course.id ? { ...c, isPublished: newVal } : c)
      );
      toast.success(newVal ? 'تم نشر الكورس ✅' : 'تم إخفاء الكورس');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل تغيير حالة الكورس');
    }
  };

  // ── Filtering ─────────────────────────────────────────────────
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab    =
      tabValue === 0 ? true :
      tabValue === 1 ? course.isPublished === true :
                       course.isPublished === false;
    return matchesSearch && matchesTab;
  });

  // ── Stats ─────────────────────────────────────────────────────
  const totalStudents = courses.reduce((acc, c) => acc + (c.stats?.enrollments ?? 0), 0);
  const totalLessons  = courses.reduce((acc, c) => acc + (c.stats?.lessons      ?? 0), 0);

  const stats = [
    {
      label: 'إجمالي الكورسات', value: courses.length,
      icon: <School />, gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    },
    {
      label: 'إجمالي الطلاب', value: totalStudents,
      icon: <People />, gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    {
      label: 'إجمالي الدروس', value: totalLessons,
      icon: <VideoLibrary />, gradient: 'linear-gradient(135deg, #dc2626 0%, #db2777 100%)',
    },
    {
      label: 'الكورسات المنشورة',
      value: courses.filter(c => c.isPublished).length,
      icon: <TrendingUp />, gradient: 'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
    },
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', py: 4 }}>
      <Container maxWidth="xl">

        {/* ── Header ── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Button startIcon={<ArrowBack />} onClick={() => navigate('/teacher/dashboard')}
                sx={{ mb: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                العودة للوحة التحكم
              </Button>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#f1f5f9' : 'inherit', mb: 1 }}>
                كورساتي 📚
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
                إدارة ومتابعة جميع كورساتك
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCourses}
                disabled={loading}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                تحديث
              </Button>
              <Button variant="contained" startIcon={<Add />}
                onClick={() => navigate('/teacher/courses/new')}
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  px: 3, py: 1.5,
                }}>
                إنشاء كورس جديد
              </Button>
            </Box>
          </Box>

          {/* ── Stats ── */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Card elevation={0} sx={{
                  border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                  bgcolor: darkMode ? '#1e293b' : 'white',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', mb: 1 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          {loading ? '...' : stat.value}
                        </Typography>
                      </Box>
                      <Box sx={{
                        width: 50, height: 50, borderRadius: 2,
                        background: stat.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}>
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ── Search & Tabs ── */}
          <Card elevation={0} sx={{
            border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white', mb: 3,
          }}>
            <CardContent>
              <TextField fullWidth placeholder="ابحث عن كورس..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: darkMode ? '#94a3b8' : 'inherit' }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: 'Cairo, sans-serif' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: darkMode ? '#334155' : undefined } },
                  '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined },
                }}
              />
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
                sx={{
                  mt: 2,
                  '& .MuiTab-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#94a3b8' : 'inherit' },
                  '& .Mui-selected': { color: darkMode ? '#f1f5f9' : '#2563eb' },
                }}>
                <Tab label={`الكل (${courses.length})`} />
                <Tab label={`منشور (${courses.filter(c => c.isPublished).length})`} />
                <Tab label={`مسودة (${courses.filter(c => !c.isPublished).length})`} />
              </Tabs>
            </CardContent>
          </Card>
        </Box>

        {/* ── Loading ── */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif', mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={fetchCourses}
                sx={{ fontFamily: 'Cairo, sans-serif' }}>
                إعادة المحاولة
              </Button>
            }>
            {error}
          </Alert>
        )}

        {/* ── Empty ── */}
        {!loading && !error && filteredCourses.length === 0 && (
          <Card elevation={0} sx={{
            border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white', p: 8, textAlign: 'center',
          }}>
            <School sx={{ fontSize: 80, color: darkMode ? '#334155' : '#e5e7eb', mb: 2 }} />
            <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700}
              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', mb: 1 }}>
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد كورسات بعد'}
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#64748b' : 'text.secondary', mb: 3 }}>
              {searchQuery ? 'جرّب كلمة بحث مختلفة' : 'ابدأ بإنشاء كورسك الأول الآن'}
            </Typography>
            {!searchQuery && (
              <Button variant="contained" startIcon={<Add />}
                onClick={() => navigate('/teacher/courses/new')}
                sx={{
                  fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                }}>
                إنشاء كورس جديد
              </Button>
            )}
          </Card>
        )}

        {/* ── Courses Grid ── */}
        {!loading && !error && filteredCourses.length > 0 && (
          <Grid container spacing={3}>
            {filteredCourses.map(course => (
              <Grid item xs={12} sm={6} lg={4} key={course.id}>
                <Card elevation={0}
                  onClick={() => openLessons(course)}
                  sx={{
                    border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                    bgcolor: darkMode ? '#1e293b' : 'white',
                    opacity: deletingId === course.id ? 0.5 : 1,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.1)',
                    },
                  }}>

                  {/* ── Thumbnail ── */}
                  <Box sx={{ position: 'relative', height: 200, overflow: 'hidden', bgcolor: '#0f172a' }}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                        flexDirection: 'column', gap: 1,
                      }}>
                        <School sx={{ fontSize: 60, color: '#475569' }} />
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b' }}>
                          بدون صورة
                        </Typography>
                      </Box>
                    )}

                    {/* Badges */}
                    <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {course.category && (
                        <Chip label={course.category} size="small"
                          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: '#2563eb', color: 'white' }} />
                      )}
                      {course.level && (
                        <Chip label={course.level} size="small"
                          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: '#7c3aed', color: 'white' }} />
                      )}
                      <Chip
                        label={course.isPublished ? 'منشور' : 'مسودة'} size="small"
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                          bgcolor: course.isPublished ? '#059669' : '#f59e0b', color: 'white',
                        }}
                      />
                    </Box>

                    {/* Menu button */}
                    <IconButton onClick={e => handleMenuClick(e, course)}
                      sx={{
                        position: 'absolute', top: 8, left: 8,
                        bgcolor: 'rgba(0,0,0,0.5)', color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                      }}>
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <CardContent>
                    {/* Title */}
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{
                        color: darkMode ? '#f1f5f9' : 'inherit', mb: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                      {course.title}
                    </Typography>

                    {/* Description */}
                    {course.description && (
                      <Typography variant="body2" fontFamily="Cairo, sans-serif"
                        sx={{
                          color: darkMode ? '#94a3b8' : 'text.secondary', mb: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                        {course.description}
                      </Typography>
                    )}

                    {/* Stats row */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <People sx={{ fontSize: 20, color: darkMode ? '#94a3b8' : 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            {course.stats?.enrollments ?? 0}
                          </Typography>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>طالب</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <VideoLibrary sx={{ fontSize: 20, color: darkMode ? '#94a3b8' : 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            {course.stats?.lessons ?? 0}
                          </Typography>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>درس</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Assignment sx={{ fontSize: 20, color: darkMode ? '#94a3b8' : 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                            {course.price ?? 0}
                          </Typography>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}>جنيه</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Divider */}
                    <Box sx={{ borderTop: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', pt: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                          {course.price} جنيه
                        </Typography>
                        <Chip
                          label={course.isPublished ? '🟢 منشور' : '🟡 مسودة'}
                          size="small" onClick={(e) => { e.stopPropagation(); handleTogglePublish(course); }}
                          sx={{
                            fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: 'pointer',
                            bgcolor: course.isPublished
                              ? (darkMode ? 'rgba(5,150,105,0.2)' : '#f0fdf4')
                              : (darkMode ? 'rgba(245,158,11,0.2)' : '#fffbeb'),
                            color: course.isPublished ? '#059669' : '#b45309',
                            '&:hover': { opacity: 0.8 },
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Edit button */}
                    <Button fullWidth variant="contained"
                      onClick={(e) => { e.stopPropagation(); openEdit(course); }}
                      startIcon={<Edit />}
                      sx={{
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' },
                      }}>
                      تعديل الكورس
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Context Menu ── */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}
          PaperProps={{
            sx: {
              bgcolor: darkMode ? '#1e293b' : 'white',
              border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            },
          }}>
          <MenuItem
            onClick={() => selectedCourse && openEdit(selectedCourse)}
            sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#f1f5f9' : 'inherit' }}>
            <Edit sx={{ mr: 1 }} fontSize="small" />
            تعديل
          </MenuItem>
          <MenuItem
            onClick={() => { if (selectedCourse) { handleTogglePublish(selectedCourse); handleMenuClose(); } }}
            sx={{ fontFamily: 'Cairo, sans-serif', color: darkMode ? '#f1f5f9' : 'inherit' }}>
            <Visibility sx={{ mr: 1 }} fontSize="small" />
            {selectedCourse?.isPublished ? 'إخفاء' : 'نشر'}
          </MenuItem>
          <MenuItem onClick={openDeleteConfirm}
            sx={{ fontFamily: 'Cairo, sans-serif', color: '#dc2626' }}>
            <Delete sx={{ mr: 1 }} fontSize="small" />
            حذف
          </MenuItem>
        </Menu>

      </Container>

      {/* ── Delete Confirm Dialog ── */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        course={deleteDialog.course}
        onClose={() => !deleteLoading && setDeleteDialog({ open: false, course: null })}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
        darkMode={darkMode}
      />

      {/* ── Edit Course Dialog ── */}
      <EditCourseDialog
        open={editDialog.open}
        course={editDialog.course}
        onClose={() => setEditDialog({ open: false, course: null })}
        onSaved={handleEditSaved}
        darkMode={darkMode}
      />

      {/* ── Lessons Dialog ── */}
      <LessonsDialog
        open={Boolean(lessonsDialogCourse)}
        course={lessonsDialogCourse}
        onClose={() => setLessonsDialogCourse(null)}
        onAddLesson={() => { setLessonsDialogCourse(null); navigate('/teacher/upload-lesson'); }}
        darkMode={darkMode}
      />
    </Box>
  );
};

export default MyCourses;