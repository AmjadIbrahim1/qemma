import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Card,
  List,
  ListItem,
  CircularProgress,
  Rating,
} from '@mui/material';
import {
  ArrowBackRounded,
  ArrowForwardRounded,
  PlayCircleFilledRounded,
  PauseCircleFilledRounded,
  CheckCircleRounded,
  VolumeUpRounded,
  SettingsRounded,
  FullscreenRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { getCourseById, getCurriculumData } from '../../data/coursesData';
import API from '../../services/api';

const BACKEND_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return base.replace(/\/api\/?$/, '');
})();

function toAbsoluteUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BACKEND_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

function fmtTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const LessonPage = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const location = useLocation();
  const { darkMode } = useTheme();

  const course = getCourseById(courseId);
  const curriculum = getCurriculumData(courseId);

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(35);
  const [completed, setCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [lessonRatingData, setLessonRatingData] = useState({ averageRating: 0, totalRatings: 0, myRating: null });
  const [lessonRatingLoading, setLessonRatingLoading] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);

    // Use nav state as initial display while API loads
    if (location.state?.lesson) {
      setLesson(location.state.lesson);
    }

    API.get(`/lessons/${lessonId}`)
      .then(res => {
        const data = res.data?.data || res.data;
        setLesson(data);
      })
      .catch(err => {
        if (!location.state?.lesson) setLesson(null);
        console.error("Failed to fetch lesson:", err);
      })
      .finally(() => setLoading(false));

    API.get(`/students/rate/lesson/${lessonId}`)
      .then(res => {
        const data = res.data?.data;
        if (data) setLessonRatingData(data);
      })
      .catch(() => {});
  }, [lessonId]);

  const videoUrl = lesson?.videoUrl ? toAbsoluteUrl(lesson.videoUrl) : null;
  const pdfUrl = lesson?.pdfFileRef ? toAbsoluteUrl(lesson.pdfFileRef) : null;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setVideoProgress((v.currentTime / v.duration) * 100);
    setCurrentTime(fmtTime(v.currentTime));
    setDuration(fmtTime(v.duration));
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(fmtTime(v.duration));
    setVideoProgress(0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  };

  const handleComplete = () => {
    setCompleted(true);
    setTimeout(() => {
      navigate(`/student/course/${courseId}`);
    }, 2000);
  };

  const notes = [
    'النقاط الأساسية في هذا الدرس...',
    'تعريف المفهوم الأول...',
    'خطوات الحل: 1. ... 2. ... 3. ...',
    'ملاحظة مهمة: ...',
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#1e293b' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate(`/student/course/${courseId}`)}
            sx={{ color: 'white' }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }} fontFamily="Cairo, sans-serif">
              {course?.title}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }} fontFamily="Cairo, sans-serif">
              {lesson?.title || `الدرس ${lessonId}`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${progress}% مكتمل`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'white',
              fontFamily: 'Cairo, sans-serif',
            }}
          />
        </Box>
      </Box>

      {/* Content Area — Video / PDF / Placeholder */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 1200,
          mx: 'auto',
          aspectRatio: '16/9',
          bgcolor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <CircularProgress sx={{ color: 'white' }} />
        ) : completed ? (
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <CheckCircleRounded sx={{ fontSize: 80, color: '#059669', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} fontFamily="Cairo, sans-serif">
              أحسنت! 🎉
            </Typography>
            <Typography fontFamily="Cairo, sans-serif" sx={{ opacity: 0.8 }}>
              لقد أكملت هذا الدرس بنجاح
            </Typography>
          </Box>
        ) : videoUrl ? (
          <>
            <Box
              component="video"
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              sx={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
            />

            {!isPlaying && (
              <IconButton
                onClick={togglePlay}
                sx={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  zIndex: 2,
                }}
              >
                <PlayCircleFilledRounded sx={{ fontSize: 60 }} />
              </IconButton>
            )}

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                zIndex: 2,
              }}
            >
              <LinearProgress
                variant="determinate"
                value={videoProgress}
                sx={{
                  mb: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' },
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton sx={{ color: 'white' }} onClick={togglePlay}>
                    {isPlaying ? <PauseCircleFilledRounded /> : <PlayCircleFilledRounded />}
                  </IconButton>
                  <IconButton sx={{ color: 'white' }}>
                    <VolumeUpRounded />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    {currentTime} / {duration}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton sx={{ color: 'white' }}>
                    <SettingsRounded />
                  </IconButton>
                  <IconButton sx={{ color: 'white' }} onClick={toggleFullscreen}>
                    <FullscreenRounded />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        ) : pdfUrl ? (
          <>
            <Box
              component="iframe"
              src={pdfUrl}
              sx={{ width: '100%', height: '100%', border: 'none', bgcolor: 'white' }}
              title="PDF Viewer"
            />
            <Button
              component="a"
              href={pdfUrl}
              download
              variant="contained"
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                bgcolor: '#2563eb',
                color: 'white',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 700,
                '&:hover': { bgcolor: '#1d4ed8' },
                zIndex: 2,
              }}
            >
              تحميل الملف
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h3" sx={{ color: 'rgba(255,255,255,0.3)' }}>
              🎬
            </Typography>

            <IconButton
              sx={{
                position: 'absolute',
                width: 80,
                height: 80,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              <PlayCircleFilledRounded sx={{ fontSize: 60 }} />
            </IconButton>

            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              }}
            >
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  mb: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': { bgcolor: '#2563eb' },
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton sx={{ color: 'white' }}>
                    <PlayCircleFilledRounded />
                  </IconButton>
                  <IconButton sx={{ color: 'white' }}>
                    <VolumeUpRounded />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white' }}>
                    15:30 / 45:00
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton sx={{ color: 'white' }}>
                    <SettingsRounded />
                  </IconButton>
                  <IconButton sx={{ color: 'white' }}>
                    <FullscreenRounded />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Content Below */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            <Card
              elevation={0}
              sx={{
                bgcolor: darkMode ? '#1e293b' : '#334155',
                borderRadius: 2,
                p: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: 'white', mb: 2 }}>
                📝 ملاحظات الدرس
              </Typography>
              <List sx={{ p: 0 }}>
                {notes.map((note, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      • {note}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Box>

          {/* Lesson Rating */}
          <Card
            elevation={0}
            sx={{
              bgcolor: darkMode ? '#1e293b' : '#334155',
              borderRadius: 2,
              p: 3,
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: 'white', mb: 1 }}>
              تقييم الدرس
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Rating
                name="lesson-rating"
                value={lessonRatingData.myRating || 0}
                precision={1}
                  onChange={async (_, value) => {
                  setLessonRatingLoading(true);
                  setLessonRatingData(prev => ({ ...prev, myRating: value }));
                  try {
                    await API.post(`/students/rate/lesson/${lessonId}`, { rating: value });
                    const res = await API.get(`/students/rate/lesson/${lessonId}`);
                    if (res.data?.data) setLessonRatingData(res.data.data);
                  } catch (_) {}
                  setLessonRatingLoading(false);
                }}
                disabled={lessonRatingLoading}
                sx={{ color: '#fbbf24' }}
              />
            </Box>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              متوسط التقييم: {lessonRatingData.averageRating.toFixed(1)} ⭐ ({lessonRatingData.totalRatings} تقييم)
            </Typography>
          </Card>

          {/* Sidebar - Navigation */}
          <Card
            elevation={0}
            sx={{
              width: { xs: '100%', md: 300 },
              bgcolor: darkMode ? '#1e293b' : '#334155',
              borderRadius: 2,
              p: 2,
              height: 'fit-content',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: 'white', mb: 2 }}>
              التنقل بين الدروس
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleComplete}
                sx={{
                  bgcolor: '#059669',
                  color: 'white',
                  fontFamily: 'Cairo, sans-serif',
                  fontWeight: 700,
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                ✓ إنهاء الدرس
              </Button>
            </Box>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default LessonPage;
