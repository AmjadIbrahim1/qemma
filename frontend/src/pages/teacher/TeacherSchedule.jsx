// frontend/src/pages/teacher/TeacherSchedule.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import {
  Container, Box, Typography, Card, CardContent,
  TextField, Button, Grid, MenuItem, IconButton,
  Alert, Snackbar, CircularProgress, Chip,
} from '@mui/material';
import {
  ArrowBack, CalendarToday, Schedule, VideoCall,
  People, Class, Save, Link as LinkIcon, Delete, Edit,
} from '@mui/icons-material';
import scheduleService from '../../services/schedule.service';
import coursesService  from '../../services/courses.service';

// ── مساعد: الوقت الحالي بصيغة HH:MM ────────────────────────────────────
const getNowTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

// ── مساعد: الوقت بعد ساعة بصيغة HH:MM ──────────────────────────────────
const getOneHourLater = () => {
  const now = new Date(Date.now() + 60 * 60 * 1000);
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

// ── مساعد: اليوم بصيغة YYYY-MM-DD ───────────────────────────────────────
const getTodayDate = () => {
  const now    = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split('T')[0];
};

// ── مساعد: تنسيق التاريخ للعرض ─────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

const TeacherSchedule = () => {
//   const { darkMode } = useTheme();
//   const navigate     = useNavigate();

//   const [courses,          setCourses]          = useState([]);
//   const [schedules,        setSchedules]        = useState([]);
//   const [loadingSchedules, setLoadingSchedules] = useState(true);
//   const [submitting,       setSubmitting]       = useState(false);
//   const [editingId,        setEditingId]        = useState(null);

//   // الفورم الفارغ — الوقت الحالي كـ default
//   const emptyForm = {
//     title:       '',
//     course:      '',
//     date:        getTodayDate(),
//     startTime:   getNowTime(),
//     endTime:     getOneHourLater(),
//     type:        'online',
//     meetingLink: '',
//     description: '',
//     maxStudents: '',
//   };

//   const [formData, setFormData] = useState(emptyForm);

//   const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

//   useEffect(() => {
//     fetchCourses();
//     fetchSchedules();
//   }, []);

//   const fetchCourses = async () => {
//     try {
//       const res  = await coursesService.getMyCourses();
//       const data = res.data?.data || res.data || [];
//       setCourses(Array.isArray(data) ? data : []);
//     } catch { setCourses([]); }
//   };

//   const fetchSchedules = async () => {
//     setLoadingSchedules(true);
//     try {
//       const res  = await scheduleService.getAll();
//       const data = res.data?.data || res.data || [];
//       setSchedules(Array.isArray(data) ? data : []);
//     } catch { setSchedules([]); }
//     finally  { setLoadingSchedules(false); }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleEdit = (schedule) => {
//     setEditingId(schedule.id);
//     const rawDate = schedule.date ? new Date(schedule.date) : null;
//     const dateStr = rawDate ? rawDate.toISOString().split('T')[0] : getTodayDate();
//     setFormData({
//       title:       schedule.title       || '',
//       course:      schedule.courseId    || '',
//       date:        dateStr,
//       startTime:   schedule.startTime   || getNowTime(),
//       endTime:     schedule.endTime     || getOneHourLater(),
//       type:        schedule.type        || 'online',
//       meetingLink: schedule.meetingLink || '',
//       description: schedule.description || '',
//       maxStudents: schedule.maxStudents || '',
//     });
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleCancelEdit = () => {
//     setEditingId(null);
//     setFormData(emptyForm);
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('هل تريد حذف هذه الحصة؟')) return;
//     try {
//       await scheduleService.remove(id);
//       setSchedules(prev => prev.filter(s => s.id !== id));
//       setSnackbar({ open: true, message: 'تم حذف الحصة بنجاح', severity: 'success' });
//     } catch (e) {
//       setSnackbar({ open: true, message: e.response?.data?.message || 'حدث خطأ أثناء الحذف', severity: 'error' });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) {
//       setSnackbar({ open: true, message: 'الرجاء ملء جميع الحقول المطلوبة', severity: 'error' });
//       return;
//     }

//     setSubmitting(true);
//     try {
//       if (editingId) {
//         const res = await scheduleService.update(editingId, {
//           title:       formData.title,
//           courseId:    formData.course || null,
//           date:        formData.date,
//           startTime:   formData.startTime,
//           endTime:     formData.endTime,
//           type:        formData.type,
//           meetingLink: formData.meetingLink || null,
//           description: formData.description || null,
//           maxStudents: formData.maxStudents  || null,
//         });
//         const updated = res.data?.data || res.data;
//         setSchedules(prev => prev.map(s => s.id === editingId ? updated : s));
//         setSnackbar({ open: true, message: 'تم تعديل الحصة بنجاح!', severity: 'success' });
//         setEditingId(null);
//       } else {
//         const res     = await scheduleService.create(formData);
//         const created = res.data?.data || res.data;
//         setSchedules(prev => [created, ...prev]);
//         setSnackbar({ open: true, message: 'تم إضافة الحصة بنجاح!', severity: 'success' });
//         setTimeout(() => navigate('/teacher/dashboard'), 1500);
//       }
//       setFormData(emptyForm);
//     } catch (error) {
//       setSnackbar({
//         open:     true,
//         message:  error.response?.data?.message || 'حدث خطأ أثناء إضافة الحصة',
//         severity: 'error',
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', py: 4 }}>
//       <Container maxWidth="md">
//         {/* Header */}
//         <Box sx={{ mb: 4 }}>
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
//             <IconButton
//               onClick={() => navigate('/teacher/dashboard')}
//               sx={{ bgcolor: darkMode ? '#1e293b' : 'white', border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}
//             >
//               <ArrowBack />
//             </IconButton>
//             <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
//               إضافة حصة جديدة
//             </Typography>
//           </Box>
//           <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}>
//             قم بجدولة حصة جديدة لطلابك
//           </Typography>
//         </Box>



//         {/* Edit form — only shown when editing an existing session */}
//         {editingId && (
//           <Card elevation={0} sx={{ border: '1px solid', borderColor: '#2563eb', bgcolor: darkMode ? '#1e293b' : 'white', mb: 4 }}>
//             <CardContent sx={{ p: 4 }}>
//               <form onSubmit={handleSubmit}>
//                 <Grid container spacing={3}>
//                   <Grid item xs={12}>
//                     <TextField fullWidth required name="title" label="عنوان الحصة"
//                       value={formData.title} onChange={handleInputChange}
//                       placeholder="مثال: مراجعة الوحدة الأولى"
//                       InputProps={{ startAdornment: <Class sx={{ mr: 1, color: '#2563eb' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField fullWidth select name="course" label="اختر الكورس"
//                       value={formData.course} onChange={handleInputChange}
//                       InputProps={{ startAdornment: <People sx={{ mr: 1, color: '#7c3aed' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} >
//                       <MenuItem value="" sx={{ fontFamily: 'Cairo, sans-serif' }}>بدون كورس محدد</MenuItem>
//                       {courses.map(course => (<MenuItem key={course.id} value={course.id} sx={{ fontFamily: 'Cairo, sans-serif' }}>{course.title}</MenuItem>))}
//                     </TextField>
//                   </Grid>
//                   <Grid item xs={12} md={6}>
//                     <TextField fullWidth type="date" name="date" label="التاريخ"
//                       value={formData.date} onChange={handleInputChange} required
//                       InputLabelProps={{ shrink: true }}
//                       InputProps={{ startAdornment: <CalendarToday sx={{ mr: 1, color: '#db2777' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   <Grid item xs={12} md={6}>
//                     <TextField fullWidth select name="type" label="نوع الحصة"
//                       value={formData.type} onChange={handleInputChange} required
//                       InputProps={{ startAdornment: <VideoCall sx={{ mr: 1, color: '#059669' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} >
//                       <MenuItem value="online" sx={{ fontFamily: 'Cairo, sans-serif' }}>حصة أونلاين</MenuItem>
//                       <MenuItem value="offline" sx={{ fontFamily: 'Cairo, sans-serif' }}>حصة حضورية</MenuItem>
//                     </TextField>
//                   </Grid>
//                   <Grid item xs={12} md={6}>
//                     <TextField fullWidth type="time" name="startTime" label="وقت البداية"
//                       value={formData.startTime} onChange={handleInputChange} required
//                       InputLabelProps={{ shrink: true }}
//                       InputProps={{ startAdornment: <Schedule sx={{ mr: 1, color: '#f59e0b' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   <Grid item xs={12} md={6}>
//                     <TextField fullWidth type="time" name="endTime" label="وقت النهاية"
//                       value={formData.endTime} onChange={handleInputChange} required
//                       InputLabelProps={{ shrink: true }}
//                       InputProps={{ startAdornment: <Schedule sx={{ mr: 1, color: '#f59e0b' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   {formData.type === 'online' && (
//                     <Grid item xs={12}>
//                       <TextField fullWidth name="meetingLink" label="رابط الحصة (Zoom, Google Meet, etc.)"
//                         value={formData.meetingLink} onChange={handleInputChange}
//                         placeholder="https://zoom.us/j/..."
//                         InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, color: '#8b5cf6' }} /> }}
//                         sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                     </Grid>
//                   )}
//                   <Grid item xs={12} md={6}>
//                     <TextField fullWidth type="number" name="maxStudents" label="الحد الأقصى للطلاب (اختياري)"
//                       value={formData.maxStudents} onChange={handleInputChange}
//                       placeholder="مثال: 30"
//                       InputProps={{ startAdornment: <People sx={{ mr: 1, color: '#10b981' }} /> }}
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   <Grid item xs={12}>
//                     <TextField fullWidth multiline rows={4} name="description" label="وصف الحصة (اختياري)"
//                       value={formData.description} onChange={handleInputChange}
//                       placeholder="أضف تفاصيل إضافية عن الحصة..."
//                       sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif', fontWeight: 600 } }} />
//                   </Grid>
//                   <Grid item xs={12}>
//                     <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
//                       <Button variant="outlined" onClick={handleCancelEdit}
//                         sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#94a3b8' : 'inherit' }}>
//                         إلغاء التعديل
//                       </Button>
//                       <Button type="submit" variant="contained" disabled={submitting}
//                         startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Save />}
//                         sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, px: 4, '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' }, '&:disabled': { opacity: 0.7 } }}>
//                         {submitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
//                       </Button>
//                     </Box>
//                   </Grid>
//                 </Grid>
//               </form>
//             </CardContent>
//           </Card>
//         )}

//         {/* قائمة الحصص المجدولة */}
//         <Box>
//           <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
//             حصصي المجدولة
//           </Typography>

//           {loadingSchedules ? (
//             <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
//           ) : schedules.length === 0 ? (
//             <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
//               <CardContent sx={{ textAlign: 'center', py: 6 }}>
//                 <CalendarToday sx={{ fontSize: 60, color: darkMode ? '#475569' : '#d1d5db', mb: 2 }} />
//                 <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
//                   لا توجد حصص مجدولة بعد
//                 </Typography>
//               </CardContent>
//             </Card>
//           ) : (
//             <Grid container spacing={2}>
//               {schedules.map(schedule => (
//                 <Grid item xs={12} key={schedule.id}>
//                   <Card elevation={0} sx={{ border: '1px solid', borderColor: editingId === schedule.id ? '#2563eb' : (darkMode ? '#334155' : '#e5e7eb'), bgcolor: darkMode ? '#1e293b' : 'white', transition: 'border-color 0.2s' }}>
//                     <CardContent sx={{ p: 3 }}>
//                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
//                         <Box sx={{ flex: 1 }}>
//                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
//                             <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
//                               {schedule.title}
//                             </Typography>
//                             <Chip
//                               label={schedule.type === 'online' ? 'أونلاين' : 'حضوري'}
//                               size="small"
//                               sx={{ bgcolor: schedule.type === 'online' ? '#eff6ff' : '#f0fdf4', color: schedule.type === 'online' ? '#2563eb' : '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
//                             />
//                           </Box>
//                           <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
//                             <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                               <CalendarToday sx={{ fontSize: 14 }} />{formatDate(schedule.date)}
//                             </Typography>
//                             <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                               <Schedule sx={{ fontSize: 14 }} />{schedule.startTime} - {schedule.endTime}
//                             </Typography>
//                             {schedule.courseTitle && (
//                               <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                 <Class sx={{ fontSize: 14 }} />{schedule.courseTitle}
//                               </Typography>
//                             )}
//                           </Box>
//                           {schedule.meetingLink && (
//                             <Typography variant="body2" component="a" href={schedule.meetingLink} target="_blank" rel="noopener noreferrer" sx={{ color: '#2563eb', fontFamily: 'Cairo, sans-serif', mt: 0.5, display: 'block' }}>
//                               🔗 رابط الحصة
//                             </Typography>
//                           )}
//                         </Box>
//                         <Box sx={{ display: 'flex', gap: 1 }}>
//                           <IconButton size="small" onClick={() => handleEdit(schedule)} sx={{ color: '#2563eb', border: '1px solid #dbeafe', '&:hover': { bgcolor: '#eff6ff' } }}>
//                             <Edit fontSize="small" />
//                           </IconButton>
//                           <IconButton size="small" onClick={() => handleDelete(schedule.id)} sx={{ color: '#ef4444', border: '1px solid #fee2e2', '&:hover': { bgcolor: '#fef2f2' } }}>
//                             <Delete fontSize="small" />
//                           </IconButton>
//                         </Box>
//                       </Box>
//                     </CardContent>
//                   </Card>
//                 </Grid>
//               ))}
//             </Grid>
//           )}
//         </Box>
//       </Container>

//       <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
//         <Alert onClose={() => setSnackbar(p => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
};

export default TeacherSchedule;