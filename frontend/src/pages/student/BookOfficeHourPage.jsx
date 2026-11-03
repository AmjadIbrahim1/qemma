import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  Button,
  IconButton,
  Grid,
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import {
  ArrowBackRounded,
  CalendarTodayRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  VideocamRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { getCourseById } from '../../data/coursesData';

const BookOfficeHourPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { darkMode } = useTheme();
  const course = getCourseById(courseId);

  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booked, setBooked] = useState(false);

  const availableDays = [
    { id: 1, day: 'الأحد', date: '22 ديسمبر', available: true },
    { id: 2, day: 'الإثنين', date: '23 ديسمبر', available: true },
    { id: 3, day: 'الثلاثاء', date: '24 ديسمبر', available: false },
    { id: 4, day: 'الأربعاء', date: '25 ديسمبر', available: true },
    { id: 5, day: 'الخميس', date: '26 ديسمبر', available: true },
  ];

  const timeSlots = [
    { id: 1, time: '10:00 ص', available: true },
    { id: 2, time: '11:00 ص', available: false },
    { id: 3, time: '12:00 م', available: true },
    { id: 4, time: '2:00 م', available: true },
    { id: 5, time: '3:00 م', available: true },
    { id: 6, time: '4:00 م', available: false },
  ];

  const handleBook = () => {
    if (!selectedDay || !selectedTime) return;
    setBooked(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #059669 0%, #2563eb 100%)',
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
                📅 حجز Office Hour
              </Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                {course?.title} • {course?.teacher}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {booked ? (
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: '#059669',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
            }}
          >
            <CheckCircleRounded sx={{ fontSize: 64, color: '#059669', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
              تم الحجز بنجاح! 🎉
            </Typography>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 3 }}>
              موعدك مع {course?.teacher} يوم {selectedDay?.day} {selectedDay?.date} الساعة {selectedTime?.time}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                startIcon={<CalendarTodayRounded />}
                sx={{
                  bgcolor: '#059669',
                  color: 'white',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                إضافة للتقويم
              </Button>
              <Button
                onClick={() => navigate(`/student/course/${courseId}`)}
                sx={{
                  bgcolor: darkMode ? '#334155' : '#f8fafc',
                  color: darkMode ? '#f1f5f9' : '#1e293b',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                العودة للكورس
              </Button>
            </Box>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Booking Form */}
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
              {/* Teacher Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, p: 2, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc' }}>
                <Avatar sx={{ bgcolor: '#059669', width: 56, height: 56, fontSize: 24 }}>
                  {course?.teacher?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    {course?.teacher}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideocamRounded sx={{ fontSize: 16, color: '#059669' }} />
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#059669' }}>
                      جلسة فيديو • 30 دقيقة
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Select Day */}
              <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                اختر اليوم
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 4 }}>
                {availableDays.map((day) => (
                  <Grid item xs={6} sm={4} md={2.4} key={day.id}>
                    <Button
                      fullWidth
                      disabled={!day.available}
                      onClick={() => setSelectedDay(day)}
                      sx={{
                        flexDirection: 'column',
                        py: 2,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: selectedDay?.id === day.id ? '#059669' : darkMode ? '#475569' : '#e5e7eb',
                        bgcolor: selectedDay?.id === day.id ? '#05966915' : 'transparent',
                        '&:disabled': { opacity: 0.5 },
                      }}
                    >
                      <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        {day.day}
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {day.date}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {/* Select Time */}
              <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                اختر الوقت
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 4 }}>
                {timeSlots.map((slot) => (
                  <Grid item xs={4} sm={3} md={2} key={slot.id}>
                    <Chip
                      label={slot.time}
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot)}
                      sx={{
                        width: '100%',
                        height: 40,
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 600,
                        bgcolor: selectedTime?.id === slot.id ? '#059669' : darkMode ? '#334155' : '#f8fafc',
                        color: selectedTime?.id === slot.id ? 'white' : darkMode ? '#f1f5f9' : '#1e293b',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        '&:hover': slot.available ? { bgcolor: '#059669', color: 'white' } : {},
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Book Button */}
              <Button
                fullWidth
                size="large"
                startIcon={<CheckCircleRounded />}
                onClick={handleBook}
                disabled={!selectedDay || !selectedTime}
                sx={{
                  bgcolor: '#059669',
                  color: 'white',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  py: 1.5,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#047857' },
                  '&:disabled': { bgcolor: '#94a3b8' },
                }}
              >
                تأكيد الحجز
              </Button>
            </Card>

            {/* Info Card */}
            <Card
              elevation={0}
              sx={{
                width: { xs: '100%', md: 300 },
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
                height: 'fit-content',
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                ℹ️ معلومات مهمة
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <AccessTimeRounded sx={{ color: '#2563eb', mt: 0.3 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    مدة الجلسة 30 دقيقة
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <VideocamRounded sx={{ color: '#7c3aed', mt: 0.3 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    الجلسة عبر مكالمة فيديو
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <CalendarTodayRounded sx={{ color: '#059669', mt: 0.3 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    يمكنك إلغاء الحجز قبل 24 ساعة
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BookOfficeHourPage;