// frontend/src/pages/teacher/TeacherBooks.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Snackbar,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  MenuBook,
  Delete,
  Edit,
  CloudUpload,
  Visibility,
  GetApp,
  Close,
  Warning,
  School,
  AttachMoney,
  CardGiftcard,
} from '@mui/icons-material';
import api from '../../services/api';

const GRADE_OPTIONS = [
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
];

const TeacherBooks = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Subject is taken from the teacher's profile (set at registration)
  const teacherSubject =
    user?.teacher?.expertise ||
    user?.teacher?.specialties?.[0] ||
    user?.expertise ||
    user?.subject ||
    null;

  // States
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const emptyForm = {
    title:       '',
    grade:       '',
    description: '',
    price:       '',
    isFree:      true,
    bookType:    'physical',
    isPublished: false,
    coverImage:  null,
  };

  const [newBook, setNewBook] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [pdfFile, setPdfFile] = useState(null);

  // ── Fetch books on mount ──────────────────────────────────────
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/books/my');
      setBooks(res.data.data || []);
    } catch (e) {
      setSnackbar({
        open: true,
        message: e.response?.data?.message || 'فشل تحميل الكتب',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = (data) => {
    const errs = {};
    if (!data.title?.trim()) errs.title = 'عنوان الكتاب مطلوب';
    if (!data.grade)         errs.grade = 'الصف الدراسي مطلوب';
    if (!data.isFree) {
      const p = parseFloat(data.price);
      if (!data.price && data.price !== 0) {
        errs.price = 'السعر مطلوب';
      } else if (isNaN(p) || p <= 0) {
        errs.price = 'يجب أن يكون السعر رقماً موجباً';
      }
    }
    return errs;
  };

  // ── Open/close helpers ────────────────────────────────────────
  const handleOpenUploadDialog = () => {
    setNewBook(emptyForm);
    setFormErrors({});
    setPdfFile(null);
    setOpenUploadDialog(true);
  };

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false);
    setFormErrors({});
    setPdfFile(null);
  };

  const handleOpenEditDialog = (book) => {
    setSelectedBook(book);
    setNewBook({
      title:       book.title,
      grade:       book.grade,
      description: book.description || '',
      price:       book.price > 0 ? String(book.price) : '',
      isFree:      book.price === 0 || !book.price,
      bookType:    book.bookType || 'physical',
      isPublished: book.isPublished,
      coverImage:  book.coverImage,
    });
    setFormErrors({});
    setPdfFile(null);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedBook(null);
    setNewBook(emptyForm);
    setFormErrors({});
    setPdfFile(null);
  };

  const handleOpenViewDialog  = (book) => { setSelectedBook(book); setOpenViewDialog(true); };
  const handleCloseViewDialog = ()     => { setOpenViewDialog(false); setSelectedBook(null); };

  const handleOpenDeleteDialog  = (book) => { setSelectedBook(book); setOpenDeleteDialog(true); };
  const handleCloseDeleteDialog = ()     => { setOpenDeleteDialog(false); setSelectedBook(null); };

  // ── Upload ────────────────────────────────────────────────────
  const handleUploadBook = async () => {
    const errs = validate(newBook);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append('title',       newBook.title.trim());
      payload.append('grade',       newBook.grade);
      payload.append('description', newBook.description || '');
      payload.append('price',       String(newBook.isFree ? 0 : parseFloat(newBook.price)));
      payload.append('isPublished', String(newBook.isPublished));
      payload.append('bookType',    newBook.bookType);
      if (newBook.coverImage) payload.append('coverBase64', newBook.coverImage);
      if (newBook.bookType === 'pdf' && pdfFile) payload.append('pdfFile', pdfFile);

      const res = await api.post('/books', payload);
      setBooks(prev => [res.data.data, ...prev]);
      setSnackbar({ open: true, message: 'تم إضافة الكتاب بنجاح', severity: 'success' });
      handleCloseUploadDialog();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'فشل إضافة الكتاب', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle publish ────────────────────────────────────────────
  const handleTogglePublish = async (book) => {
    try {
      const res    = await api.patch(`/books/${book.id}/publish`);
      const newVal = res?.data?.data?.isPublished ?? !book.isPublished;
      setBooks(prev =>
        prev.map(b => b.id === book.id ? { ...b, isPublished: newVal } : b)
      );
      setSnackbar({
        open: true,
        message: newVal ? 'تم نشر الكتاب ✅' : 'تم إخفاء الكتاب',
        severity: 'success',
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: e.response?.data?.message || 'فشل تغيير حالة الكتاب',
        severity: 'error',
      });
    }
  };

  // ── Update ────────────────────────────────────────────────────
  const handleUpdateBook = async () => {
    const errs = validate(newBook);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append('title',       newBook.title.trim());
      payload.append('grade',       newBook.grade);
      payload.append('description', newBook.description || '');
      payload.append('price',       String(newBook.isFree ? 0 : parseFloat(newBook.price)));
      payload.append('isPublished', String(newBook.isPublished));
      payload.append('bookType',    newBook.bookType);
      if (newBook.coverImage) payload.append('coverBase64', newBook.coverImage);
      if (newBook.bookType === 'physical') payload.append('pdfFileRef', '');
      if (newBook.bookType === 'pdf' && pdfFile) payload.append('pdfFile', pdfFile);

      const res = await api.put(`/books/${selectedBook.id}`, payload);
      setBooks(prev => prev.map(b => b.id === selectedBook.id ? res.data.data : b));
      setSnackbar({ open: true, message: 'تم تحديث الكتاب بنجاح', severity: 'success' });
      handleCloseEditDialog();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'فشل تحديث الكتاب', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    try {
      setSubmitting(true);
      await api.delete(`/books/${selectedBook.id}`);
      setBooks(prev => prev.filter(book => book.id !== selectedBook.id));
      setSnackbar({ open: true, message: 'تم حذف الكتاب بنجاح', severity: 'success' });
      handleCloseDeleteDialog();
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'فشل حذف الكتاب', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Cover image ───────────────────────────────────────────────
  const handleCoverImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'حجم الصورة يجب أن يكون أقل من 2MB', severity: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBook(prev => ({ ...prev, coverImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ── Shared form fields ─────────────────────────────────────────
  const renderFormFields = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>

      {/* Subject — read-only, from teacher profile */}
      <Box sx={{
        p: 2, borderRadius: 2,
        bgcolor: darkMode ? 'rgba(37,99,235,0.1)' : '#eff6ff',
        border: '1px solid', borderColor: darkMode ? 'rgba(37,99,235,0.3)' : '#bfdbfe',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <School sx={{ color: '#2563eb', fontSize: 22 }} />
        <Box>
          <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}
            sx={{ color: darkMode ? '#93c5fd' : '#1e40af', display: 'block' }}>
            المادة الدراسية (من حسابك)
          </Typography>
          <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={800}
            sx={{ color: darkMode ? '#bfdbfe' : '#1d4ed8' }}>
            {teacherSubject || 'غير محدد — يُحدَّد عند إنشاء الحساب'}
          </Typography>
        </Box>
      </Box>

      {/* Grade */}
      <FormControl fullWidth error={!!formErrors.grade}>
        <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>الصف الدراسي *</InputLabel>
        <Select
          value={newBook.grade}
          onChange={(e) => {
            setNewBook(prev => ({ ...prev, grade: e.target.value }));
            if (formErrors.grade) setFormErrors(prev => ({ ...prev, grade: '' }));
          }}
          label="الصف الدراسي *"
          sx={{ fontFamily: 'Cairo, sans-serif' }}
        >
          {GRADE_OPTIONS.map(g => (
            <MenuItem key={g} value={g} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
              {g}
            </MenuItem>
          ))}
        </Select>
        {formErrors.grade && <FormHelperText sx={{ fontFamily: 'Cairo, sans-serif' }}>{formErrors.grade}</FormHelperText>}
      </FormControl>

      {/* Title */}
      <TextField
        label="عنوان الكتاب *"
        fullWidth
        value={newBook.title}
        onChange={(e) => {
          setNewBook(prev => ({ ...prev, title: e.target.value }));
          if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' }));
        }}
        error={!!formErrors.title}
        helperText={formErrors.title}
        InputProps={{ style: { fontFamily: 'Cairo, sans-serif' } }}
        InputLabelProps={{ style: { fontFamily: 'Cairo, sans-serif' } }}
      />

      {/* Description */}
      <TextField
        label="الوصف (اختياري)"
        fullWidth
        multiline
        rows={3}
        value={newBook.description}
        onChange={(e) => setNewBook(prev => ({ ...prev, description: e.target.value }))}
        InputProps={{ style: { fontFamily: 'Cairo, sans-serif' } }}
        InputLabelProps={{ style: { fontFamily: 'Cairo, sans-serif' } }}
      />

      {/* ── PRICE SECTION ── */}
      <Box>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
          sx={{ color: darkMode ? '#94a3b8' : '#475569', mb: 1.5 }}>
          تسعير الكتاب *
        </Typography>

        {/* Free / Paid Toggle */}
        <ToggleButtonGroup
          value={newBook.isFree ? 'free' : 'paid'}
          exclusive
          onChange={(_, val) => {
            if (!val) return;
            setNewBook(prev => ({ ...prev, isFree: val === 'free', price: val === 'free' ? '' : prev.price }));
            if (formErrors.price) setFormErrors(prev => ({ ...prev, price: '' }));
          }}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton
            value="free"
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              gap: 1,
              '&.Mui-selected': {
                bgcolor: darkMode ? 'rgba(34,197,94,0.15)' : '#f0fdf4',
                color: '#16a34a',
                borderColor: '#16a34a',
                '&:hover': { bgcolor: darkMode ? 'rgba(34,197,94,0.2)' : '#dcfce7' },
              },
            }}
          >
            <CardGiftcard fontSize="small" />
            مجاني
          </ToggleButton>
          <ToggleButton
            value="paid"
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              gap: 1,
              '&.Mui-selected': {
                bgcolor: darkMode ? 'rgba(234,179,8,0.15)' : '#fefce8',
                color: '#b45309',
                borderColor: '#d97706',
                '&:hover': { bgcolor: darkMode ? 'rgba(234,179,8,0.2)' : '#fef9c3' },
              },
            }}
          >
            <AttachMoney fontSize="small" />
            مدفوع
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Price input — shown only when paid */}
        {!newBook.isFree && (
          <>
            <TextField
              label="السعر *"
              fullWidth
              type="text"
              value={newBook.price}
              onChange={(e) => {
                // Allow only digits and decimal point
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setNewBook(prev => ({ ...prev, price: val }));
                  if (formErrors.price) setFormErrors(prev => ({ ...prev, price: '' }));
                }
              }}
              error={!!formErrors.price}
              helperText={formErrors.price || 'أدخل السعر بالجنيه المصري'}
              InputProps={{
                style: { fontFamily: 'Cairo, sans-serif' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
                      sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      ج.م
                    </Typography>
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ style: { fontFamily: 'Cairo, sans-serif' } }}
            />

            {newBook.price && parseFloat(newBook.price) > 0 && (
              <Alert
                severity="info"
                sx={{
                  mt: 1.5,
                  fontFamily: 'Cairo, sans-serif',
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}>
                    تنبيه: المنصة تأخذ <strong>10%</strong> من كل عملية بيع
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#059669', whiteSpace: 'nowrap', mr: 1 }}>
                    صافي أرباحك: {(parseFloat(newBook.price) * 0.9).toFixed(2)} ج.م
                  </Typography>
                </Box>
              </Alert>
            )}
          </>
        )}

        {/* Free badge */}
        {newBook.isFree && (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 2, py: 0.75, borderRadius: 2,
            bgcolor: darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4',
            border: '1px solid', borderColor: darkMode ? 'rgba(34,197,94,0.3)' : '#bbf7d0',
          }}>
            <CardGiftcard sx={{ fontSize: 18, color: '#16a34a' }} />
            <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#16a34a' }}>
              سيكون الكتاب مجاناً للطلاب
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── BOOK TYPE ── */}
      <Box>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
          sx={{ color: darkMode ? '#94a3b8' : '#475569', mb: 1.5 }}>
          نوع الكتاب
        </Typography>
        <ToggleButtonGroup
          value={newBook.bookType}
          exclusive
          onChange={(_, val) => {
            if (!val) return;
            setNewBook(prev => ({ ...prev, bookType: val }));
            if (val === 'physical') setPdfFile(null);
          }}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton
            value="physical"
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              gap: 1,
              '&.Mui-selected': {
                bgcolor: darkMode ? 'rgba(37,99,235,0.15)' : '#eff6ff',
                color: '#2563eb',
                borderColor: '#2563eb',
                '&:hover': { bgcolor: darkMode ? 'rgba(37,99,235,0.2)' : '#dbeafe' },
              },
            }}
          >
            📖 كتاب مطبوع
          </ToggleButton>
          <ToggleButton
            value="pdf"
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              gap: 1,
              '&.Mui-selected': {
                bgcolor: darkMode ? 'rgba(234,179,8,0.15)' : '#fefce8',
                color: '#b45309',
                borderColor: '#d97706',
                '&:hover': { bgcolor: darkMode ? 'rgba(234,179,8,0.2)' : '#fef9c3' },
              },
            }}
          >
            📄 PDF
          </ToggleButton>
        </ToggleButtonGroup>

        {newBook.bookType === 'pdf' && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
            >
              {pdfFile ? pdfFile.name : 'رفع ملف PDF'}
              <input
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPdfFile(file);
                }}
              />
            </Button>
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: darkMode ? '#64748b' : '#94a3b8', fontFamily: 'Cairo, sans-serif' }}>
              الحد الأقصى للحجم: 50MB — PDF فقط
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Publish toggle ── */}
      <Box sx={{
        p: 2, borderRadius: 2,
        bgcolor: darkMode ? 'rgba(99,102,241,0.08)' : '#f8fafc',
        border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box>
          <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700}
            sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
            {newBook.isPublished ? '📢 منشور ومرئي للطلاب' : '📝 مسودة (غير منشور)'}
          </Typography>
          <Typography variant="caption" fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
            {newBook.isPublished
              ? 'الكتاب سيظهر للطلاب فور الحفظ'
              : 'لن يظهر للطلاب حتى تقوم بنشره'}
          </Typography>
        </Box>
        <Box
          onClick={() => setNewBook(prev => ({ ...prev, isPublished: !prev.isPublished }))}
          sx={{
            width: 52, height: 28, borderRadius: 28,
            bgcolor: newBook.isPublished ? '#7c3aed' : '#475569',
            cursor: 'pointer', position: 'relative',
            transition: 'background 0.3s', flexShrink: 0,
          }}
        >
          <Box sx={{
            position: 'absolute', top: 3,
            left: newBook.isPublished ? '27px' : '3px',
            width: 22, height: 22, borderRadius: '50%',
            bgcolor: 'white', transition: 'left 0.3s',
          }} />
        </Box>
      </Box>

      {/* Cover image */}
      <Box>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={<CloudUpload />}
          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
        >
          {newBook.coverImage ? 'تغيير صورة الغلاف' : 'رفع صورة الغلاف (اختياري)'}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleCoverImageChange}
          />
        </Button>
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: darkMode ? '#64748b' : '#94a3b8', fontFamily: 'Cairo, sans-serif' }}>
          الحد الأقصى للحجم: 2MB — JPG, PNG, WEBP
        </Typography>
        {newBook.coverImage && (
          <Box sx={{ mt: 2, textAlign: 'center', position: 'relative' }}>
            <img
              src={newBook.coverImage}
              alt="Cover preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover' }}
            />
            <IconButton
              size="small"
              onClick={() => setNewBook(prev => ({ ...prev, coverImage: null }))}
              sx={{
                position: 'absolute', top: 4, right: 4,
                bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );

  // ── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', pb: 4 }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
        color: 'white', py: 3, px: 2,
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/teacher/dashboard')} sx={{ color: 'white' }}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <MenuBook sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif">مكتبة الكتب</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }} fontFamily="Cairo, sans-serif">
                  إدارة كتبك الدراسية
                  {teacherSubject && (
                    <Chip
                      label={teacherSubject}
                      size="small"
                      sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  )}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenUploadDialog}
              sx={{
                bgcolor: 'white', color: '#7c3aed',
                fontFamily: 'Cairo, sans-serif', fontWeight: 900,
                '&:hover': { bgcolor: '#f3f4f6' },
              }}
            >
              إضافة كتاب جديد
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>

        {/* ── Statistics ─────────────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              label: 'إجمالي الكتب',
              value: books.length,
              icon: <MenuBook />,
              bg: '#eff6ff', color: '#2563eb',
            },
            {
              label: 'إجمالي المبيعات',
              value: books.reduce((sum, b) => sum + (b.purchases || 0), 0),
              icon: <GetApp />,
              bg: '#f5f3ff', color: '#7c3aed',
            },
            {
              label: 'صافي أرباحك',
              value: books.reduce((sum, b) => sum + (b.price > 0 ? b.price * 0.9 * (b.purchases || 0) : 0), 0).toFixed(2) + ' ج.م',
              icon: <CardGiftcard />,
              bg: '#f0fdf4', color: '#059669',
            },
            {
              label: 'آخر تحديث',
              value: books.length > 0 ? books[0].updatedAt?.split('T')[0] : '—',
              icon: <CloudUpload />,
              bg: '#fdf2f8', color: '#db2777',
              small: true,
            },
          ].map((stat) => (
            <Grid item xs={12} sm={3} key={stat.label}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 50, height: 50, borderRadius: 2, bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant={stat.small ? 'body1' : 'h4'} fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : 'inherit', fontSize: stat.small ? '0.9rem' : undefined }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── No books ─────────────────────────────────────────────── */}
        {books.length === 0 ? (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <MenuBook sx={{ fontSize: 80, color: darkMode ? '#475569' : '#d1d5db', mb: 2 }} />
                <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 1 }}>
                  لا توجد كتب حالياً
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#9ca3af', mb: 3 }}>
                  ابدأ بإضافة كتابك الأول
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenUploadDialog}
                  sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
                >
                  إضافة كتاب جديد
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (

          /* ── Books grid ──────────────────────────────────────────── */
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.id}>
                <Card elevation={0} sx={{
                  height: '100%', border: '1px solid',
                  borderColor: darkMode ? '#334155' : '#e5e7eb',
                  bgcolor: darkMode ? '#1e293b' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode ? '0 10px 20px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.1)',
                  },
                }}>
                  {/* Cover */}
                  {book.coverImage ? (
                    <CardMedia component="img" height="200" image={book.coverImage} alt={book.title}
                      sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{
                      height: 200, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MenuBook sx={{ fontSize: 80, color: 'white', opacity: 0.5 }} />
                    </Box>
                  )}

                  <CardContent>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#f1f5f9' : 'inherit', mb: 1.5 }}>
                      {book.title}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={book.subject}
                        size="small"
                        sx={{ bgcolor: darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff', color: '#2563eb', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                      />
                      <Chip
                        label={book.grade}
                        size="small"
                        sx={{ bgcolor: darkMode ? 'rgba(124,58,237,0.2)' : '#f5f3ff', color: '#7c3aed', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
                      />
                      {/* Price chip */}
                      <Chip
                        label={book.price > 0 ? `${book.price} ج.م` : 'مجاني'}
                        size="small"
                        sx={{
                          bgcolor: book.price > 0
                            ? (darkMode ? 'rgba(234,179,8,0.2)' : '#fefce8')
                            : (darkMode ? 'rgba(34,197,94,0.2)' : '#f0fdf4'),
                          color: book.price > 0 ? '#b45309' : '#16a34a',
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 700,
                        }}
                      />
                      {/* Book type chip */}
                      <Chip
                        label={book.bookType === 'pdf' ? 'PDF' : 'مطبوع'}
                        size="small"
                        sx={{
                          bgcolor: book.bookType === 'pdf'
                            ? (darkMode ? 'rgba(234,179,8,0.2)' : '#fefce8')
                            : (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff'),
                          color: book.bookType === 'pdf' ? '#b45309' : '#2563eb',
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 700,
                        }}
                      />
                      {/* Publish status chip */}
                      <Chip
                        label={book.isPublished ? '🟢 منشور' : '🟡 مسودة'}
                        size="small"
                        onClick={() => handleTogglePublish(book)}
                        sx={{
                          fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: 'pointer',
                          bgcolor: book.isPublished
                            ? (darkMode ? 'rgba(5,150,105,0.2)' : '#f0fdf4')
                            : (darkMode ? 'rgba(245,158,11,0.2)' : '#fffbeb'),
                          color: book.isPublished ? '#059669' : '#b45309',
                          '&:hover': { opacity: 0.8 },
                        }}
                      />
                    </Box>

                    {book.description && (
                      <Typography variant="body2" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }} fontFamily="Cairo, sans-serif"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {book.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkMode ? '#64748b' : '#9ca3af' }} fontFamily="Cairo, sans-serif">
                        {book.purchases || 0} مبيعة
                      </Typography>
                      {book.price > 0 && (
                        <Typography variant="caption" sx={{ color: '#059669' }} fontFamily="Cairo, sans-serif" fontWeight={700}>
                          {(book.price * 0.9).toFixed(2)} ج.م صافي
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: darkMode ? '#64748b' : '#9ca3af' }} fontFamily="Cairo, sans-serif">
                        {book.createdAt?.split('T')[0]}
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, pt: 2, borderTop: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                      <Button fullWidth variant="contained" startIcon={<Visibility />}
                        onClick={() => handleOpenViewDialog(book)}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' } }}>
                        عرض
                      </Button>
                      <Button fullWidth variant="outlined" startIcon={<Edit />}
                        onClick={() => handleOpenEditDialog(book)}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: darkMode ? '#475569' : '#e2e8f0', color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        تعديل
                      </Button>
                      <IconButton
                        onClick={() => handleOpenDeleteDialog(book)}
                        sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ══════════════════════════════════════════════════════════
          UPLOAD DIALOG
          ══════════════════════════════════════════════════════════ */}
      <Dialog open={openUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
          إضافة كتاب جديد
        </DialogTitle>
        <DialogContent>{renderFormFields()}</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseUploadDialog} disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>إلغاء</Button>
          <Button onClick={handleUploadBook} variant="contained" disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'إضافة الكتاب'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          EDIT DIALOG
          ══════════════════════════════════════════════════════════ */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}>
          تعديل الكتاب
        </DialogTitle>
        <DialogContent>{renderFormFields()}</DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>إلغاء</Button>
          <Button onClick={handleUpdateBook} variant="contained" disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'حفظ التعديلات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          VIEW DIALOG
          ══════════════════════════════════════════════════════════ */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MenuBook sx={{ fontSize: 30, color: '#7c3aed' }} />
            <span>تفاصيل الكتاب</span>
          </Box>
          <IconButton onClick={handleCloseViewDialog} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedBook && (
            <Box sx={{ py: 2 }}>
              {/* Cover */}
              {selectedBook.coverImage ? (
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <img src={selectedBook.coverImage} alt={selectedBook.title}
                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
                </Box>
              ) : (
                <Box sx={{ height: 200, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, mb: 3 }}>
                  <MenuBook sx={{ fontSize: 100, color: 'white', opacity: 0.4 }} />
                </Box>
              )}

              {/* Title */}
              <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>عنوان الكتاب</Typography>
              <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mt: 0.5, mb: 2 }}>{selectedBook.title}</Typography>

              <Divider sx={{ mb: 2 }} />

              {/* Subject + Grade + Price + Type */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>المادة الدراسية</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label={selectedBook.subject} sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.95rem', py: 2 }} />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>الصف الدراسي</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label={selectedBook.grade} sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.95rem', py: 2 }} />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>السعر</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={selectedBook.price > 0 ? `${selectedBook.price} ج.م` : 'مجاني'}
                      sx={{
                        bgcolor: selectedBook.price > 0 ? '#fefce8' : '#f0fdf4',
                        color:   selectedBook.price > 0 ? '#b45309'  : '#16a34a',
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.95rem', py: 2,
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>النوع</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      icon={selectedBook.bookType === 'pdf' ? <CloudUpload fontSize="small" /> : <MenuBook fontSize="small" />}
                      label={selectedBook.bookType === 'pdf' ? 'PDF' : 'كتاب مطبوع'}
                      sx={{
                        bgcolor: selectedBook.bookType === 'pdf' ? '#fefce8' : '#eff6ff',
                        color:   selectedBook.bookType === 'pdf' ? '#b45309' : '#2563eb',
                        fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.95rem', py: 2,
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* Description */}
              <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>الوصف</Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 1, lineHeight: 1.8, mb: 2 }}>
                {selectedBook.description || 'لا يوجد وصف'}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {/* Stats */}
              <Grid container spacing={2}>
                {[
                  { icon: <GetApp sx={{ fontSize: 28, color: '#2563eb', mb: 0.5 }} />, value: selectedBook.purchases || 0, label: 'مبيعة', bg: '#eff6ff' },
                  {
                    icon: <AttachMoney sx={{ fontSize: 28, color: '#b45309', mb: 0.5 }} />,
                    value: selectedBook.price > 0 ? `${selectedBook.price} ج.م` : 'مجاني',
                    label: 'السعر',
                    bg: selectedBook.price > 0 ? '#fefce8' : '#f0fdf4',
                  },
                  {
                    icon: <CardGiftcard sx={{ fontSize: 28, color: '#059669', mb: 0.5 }} />,
                    value: selectedBook.price > 0 ? `${(selectedBook.price * 0.9).toFixed(2)} ج.م` : '—',
                    label: 'صافي أرباحك',
                    bg: '#f0fdf4',
                  },
                  { icon: <MenuBook sx={{ fontSize: 28, color: '#db2777', mb: 0.5 }} />, value: selectedBook.createdAt?.split('T')[0], label: 'تاريخ الإضافة', bg: '#fdf2f8', small: true },
                ].map((s, i) => (
                  <Grid item xs={3} key={i}>
                    <Box sx={{ bgcolor: s.bg, p: 2, borderRadius: 2, textAlign: 'center' }}>
                      {s.icon}
                      <Typography variant={s.small ? 'caption' : 'h6'} fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: '#1e293b', display: 'block' }}>{s.value}</Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b' }}>{s.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseViewDialog} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>إغلاق</Button>
          <Button variant="outlined" startIcon={<Edit />}
            onClick={() => { handleCloseViewDialog(); handleOpenEditDialog(selectedBook); }}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: '#7c3aed', color: '#7c3aed' }}>
            تعديل الكتاب
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE DIALOG
          ══════════════════════════════════════════════════════════ */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Warning sx={{ fontSize: 28, color: '#ef4444' }} />
          تأكيد الحذف
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
            هل أنت متأكد من حذف هذا الكتاب؟
          </Typography>
          {selectedBook && (
            <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 2, border: '1px solid #fecaca' }}>
              <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#991b1b', mb: 0.5 }}>
                {selectedBook.title}
              </Typography>
              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#dc2626' }}>
                {selectedBook.grade} • {selectedBook.subject} • {selectedBook.price > 0 ? `${selectedBook.price} ج.م` : 'مجاني'}
              </Typography>
              <br />
              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#dc2626' }}>
                لن تتمكن من استرجاع هذا الكتاب بعد الحذف
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} variant="outlined" disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: '#e5e7eb', color: '#64748b' }}>
            إلغاء
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            حذف الكتاب
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity} sx={{ fontFamily: 'Cairo, sans-serif' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TeacherBooks;