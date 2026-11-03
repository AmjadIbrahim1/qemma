// frontend/src/pages/student/SubmitAssignmentPage.jsx
// Full system: fetches real assignments from API, submits with file upload

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  LinearProgress,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  ArrowBackRounded,
  CloudUploadRounded,
  AttachFileRounded,
  DeleteRounded,
  CheckCircleRounded,
  AccessTimeRounded,
  DescriptionRounded,
  SendRounded,
  AssignmentRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import assignmentsService from '../../services/assignments.service';
import toast from 'react-hot-toast';

const SubmitAssignmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Fetch real assignments from API
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentsService.getStudentAssignments();
      const data = Array.isArray(res?.data?.data) ? res.data.data : [];
      setAssignments(data);

      // If we came from TasksPage with a pre-selected task
      const preselectedId = location.state?.assignmentId || location.state?.task?.assignmentId;
      if (preselectedId) {
        const found = data.find(a => a.id === preselectedId);
        if (found) setSelectedAssignment(found);
      }
    } catch (err) {
      setError('فشل تحميل الواجبات. تأكد من الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }, [location.state]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(f => {
      const type = f.type;
      return type === 'application/pdf' || type.startsWith('image/');
    });
    if (validFiles.length !== files.length) {
      toast.error('الملفات المسموحة فقط: PDF وصور');
    }
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || selectedFiles.length === 0) {
      toast.error('اختر واجباً وارفَع ملفاً على الأقل');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0]);
      formData.append('notes', notes);

      await assignmentsService.submitAssignment(
        selectedAssignment.id,
        formData,
        (percent) => setUploadProgress(percent),
      );

      setUploadProgress(100);
      setSubmitted(true);
      toast.success('تم تسليم الواجب بنجاح! 🎉');

      // Refresh assignments list
      fetchAssignments();

      setTimeout(() => {
        setSubmitted(false);
        setSelectedAssignment(null);
        setSelectedFiles([]);
        setNotes('');
      }, 3000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'فشل تسليم الواجب';
      toast.error(msg);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const pendingAssignments = assignments.filter(a => !a.submitted);
  const submittedAssignments = assignments.filter(a => a.submitted);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          color: 'white',
          py: 4,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/student/dashboard')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <ArrowBackRounded />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                🚀 تسليم الواجبات
              </Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                {loading ? 'جاري التحميل...' : `لديك ${pendingAssignments.length} واجبات منتظرة`}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {submitted && (
          <Alert icon={<CheckCircleRounded />} severity="success" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
            تم تسليم الواجب بنجاح! 🎉
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* ════ Left: Assignments List ════ */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
              📋 الواجبات المنتظرة
            </Typography>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : pendingAssignments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                <CheckCircleRounded sx={{ fontSize: 48, color: '#059669', mb: 2 }} />
                <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  كل الواجبات تم تسليمها! 🎉
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {pendingAssignments.map((assignment) => (
                  <ListItem
                    key={assignment.id}
                    onClick={() => { setSelectedAssignment(assignment); setSelectedFiles([]); setNotes(''); }}
                    sx={{
                      mb: 1.5,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: selectedAssignment?.id === assignment.id
                        ? darkMode ? '#334155' : '#7c3aed10'
                        : darkMode ? '#1e293b' : 'white',
                      border: '2px solid',
                      borderColor: selectedAssignment?.id === assignment.id ? '#7c3aed' : darkMode ? '#334155' : '#e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { borderColor: '#7c3aed' },
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AssignmentRounded sx={{ color: '#7c3aed', fontSize: 20 }} />
                        <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                          {assignment.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={assignment.courseTitle} size="small"
                          sx={{ bgcolor: '#7c3aed15', color: '#7c3aed', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                        <Chip label={`${assignment.maxScore} درجات`} size="small"
                          sx={{ bgcolor: '#05966915', color: '#059669', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }} />
                        {assignment.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeRounded sx={{ fontSize: 14, color: darkMode ? '#94a3b8' : '#64748b' }} />
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                              {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}

            {/* Submitted assignments summary */}
            {submittedAssignments.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                  ✅ تم التسليم
                </Typography>
                {submittedAssignments.map(a => (
                  <Box key={a.id} sx={{
                    p: 1.5, mb: 1, borderRadius: 2,
                    bgcolor: darkMode ? '#1e293b' : 'white',
                    border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}>
                    <CheckCircleRounded sx={{ color: '#059669', fontSize: 20 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        {a.title}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {a.courseTitle}
                      </Typography>
                    </Box>
                    {a.submission?.score !== null && a.submission?.score !== undefined ? (
                      <Chip label={`${a.submission.score}/${a.maxScore}`} size="small"
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, bgcolor: '#05966915', color: '#059669' }} />
                    ) : (
                      <Chip label="قيد التصحيح" size="small"
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: '#f59e0b15', color: '#f59e0b' }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* ════ Right: Upload Form ════ */}
          <Card
            elevation={0}
            sx={{
              flex: 1,
              border: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
              p: 3,
              position: 'sticky',
              top: 24,
              alignSelf: 'flex-start',
            }}
          >
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 3 }}>
              📎 رفع الملفات
            </Typography>

            {selectedAssignment ? (
              <>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
                  تسليم: <strong>{selectedAssignment.title}</strong>
                  <br />
                  <Typography variant="caption">{selectedAssignment.courseTitle}</Typography>
                </Alert>

                {/* Upload area */}
                <Box
                  sx={{
                    border: '2px dashed',
                    borderColor: darkMode ? '#475569' : '#cbd5e1',
                    borderRadius: 3,
                    p: 4,
                    textAlign: 'center',
                    mb: 3,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#7c3aed',
                      bgcolor: darkMode ? '#334155' : '#f8fafc',
                    },
                  }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <CloudUploadRounded sx={{ fontSize: 48, color: '#7c3aed', mb: 2, display: 'block', mx: 'auto' }} />
                  <Typography variant="body1" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
                    اسحب الملفات هنا أو اضغط للرفع
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
                    PDF أو صور (حتى 50MB)
                  </Typography>
                </Box>

                {selectedFiles.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    {selectedFiles.map((file, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc', mb: 1 }}>
                        <DescriptionRounded sx={{ color: '#7c3aed' }} />
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ flex: 1, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                          {file.name}
                        </Typography>
                        <IconButton size="small" onClick={() => handleRemoveFile(index)} sx={{ color: '#ef4444' }}>
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="ملاحظات إضافية للطالب..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mb: 3, '& .MuiOutlinedInput-root': { fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#334155' : '#f8fafc' } }}
                />

                {/* Upload progress */}
                {uploading && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {uploadProgress < 100 ? 'جاري الرفع...' : 'تم الرفع ✅'}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}>
                        {uploadProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={uploadProgress}
                      sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }} />
                  </Box>
                )}

                <Button
                  fullWidth
                  size="large"
                  startIcon={uploading ? null : <SendRounded />}
                  onClick={handleSubmit}
                  disabled={selectedFiles.length === 0 || uploading}
                  sx={{
                    bgcolor: '#7c3aed',
                    color: 'white',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 700,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#6d28d9' },
                    '&.Mui-disabled': { bgcolor: darkMode ? '#334155' : '#e5e7eb' },
                  }}
                >
                  {uploading ? `جاري الرفع... ${uploadProgress}%` : 'تسليم الواجب'}
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AttachFileRounded sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  اختر واجباً من القائمة لرفع الملفات
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default SubmitAssignmentPage;
