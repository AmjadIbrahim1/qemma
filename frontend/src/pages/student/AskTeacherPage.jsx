import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  Alert,
} from '@mui/material';
import {
  ArrowBackRounded,
  SendRounded,
  AttachFileRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { getCourseById } from '../../data/coursesData';

const AskTeacherPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { darkMode } = useTheme();
  const course = getCourseById(courseId);

  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'lesson', label: 'استفسار عن درس', color: '#2563eb' },
    { id: 'homework', label: 'مساعدة في واجب', color: '#7c3aed' },
    { id: 'exam', label: 'سؤال عن اختبار', color: '#f59e0b' },
    { id: 'other', label: 'أخرى', color: '#64748b' },
  ];

  const previousQuestions = [
    { id: 1, question: 'كيف أحل المسألة رقم 5؟', answer: 'يمكنك استخدام قاعدة...', date: 'أمس', answered: true },
    { id: 2, question: 'هل يوجد شرح إضافي للباب الثالث؟', answer: null, date: 'منذ يومين', answered: false },
  ];

  const handleSubmit = () => {
    if (!question.trim() || !category) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setQuestion('');
      setCategory('');
    }, 3000);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          color: 'white',
          py: 4,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/student/course/${courseId}`)}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
            >
              <ArrowBackRounded />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                💬 سؤال للمدرس
              </Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                {course?.title} • {course?.teacher}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {submitted && (
          <Alert icon={<CheckCircleRounded />} severity="success" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}>
            تم إرسال سؤالك بنجاح! سيتم الرد عليك قريباً 📨
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Ask Form */}
          <Card
            elevation={0}
            sx={{
              flex: 1,
              border: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#7c3aed', width: 48, height: 48 }}>
                {course?.teacher?.charAt(0)}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  {course?.teacher}
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  متوسط وقت الرد: 2 ساعة
                </Typography>
              </Box>
            </Box>

            <Typography variant="subtitle2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1.5 }}>
              نوع السؤال
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.label}
                  onClick={() => setCategory(cat.id)}
                  sx={{
                    bgcolor: category === cat.id ? cat.color : darkMode ? '#334155' : '#f8fafc',
                    color: category === cat.id ? 'white' : darkMode ? '#f1f5f9' : '#1e293b',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 600,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: cat.color, color: 'white' },
                  }}
                />
              ))}
            </Box>

            <Typography variant="subtitle2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1.5 }}>
              سؤالك
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              placeholder="اكتب سؤالك هنا بالتفصيل..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  fontFamily: 'Cairo, sans-serif',
                  bgcolor: darkMode ? '#334155' : '#f8fafc',
                },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AttachFileRounded />}
                sx={{
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 600,
                  borderColor: darkMode ? '#475569' : '#e5e7eb',
                  color: darkMode ? '#f1f5f9' : '#64748b',
                }}
              >
                إرفاق ملف
              </Button>
              <Button
                fullWidth
                startIcon={<SendRounded />}
                onClick={handleSubmit}
                disabled={!question.trim() || !category}
                sx={{
                  bgcolor: '#2563eb',
                  color: 'white',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#1d4ed8' },
                }}
              >
                إرسال السؤال
              </Button>
            </Box>
          </Card>

          {/* Previous Questions */}
          <Card
            elevation={0}
            sx={{
              width: { xs: '100%', md: 350 },
              border: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
              📋 أسئلتك السابقة
            </Typography>

            <List sx={{ p: 0 }}>
              {previousQuestions.map((q) => (
                <ListItem
                  key={q.id}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2,
                    mb: 1,
                    borderRadius: 2,
                    bgcolor: darkMode ? '#334155' : '#f8fafc',
                  }}
                >
                  <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                    {q.question}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {q.date}
                    </Typography>
                    <Chip
                      label={q.answered ? 'تم الرد' : 'في الانتظار'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        bgcolor: q.answered ? '#ecfdf5' : '#fef3c7',
                        color: q.answered ? '#059669' : '#f59e0b',
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default AskTeacherPage;