// frontend/src/pages/teacher/TeacherContests.jsx - Teacher Golden Contest Management - Grade 3
import { useState, useContext, useEffect } from 'react';   // ✅ NEW: useEffect for API fetch
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,   // ✅ NEW: loading spinner
  Alert,              // ✅ NEW: error display
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Edit,
  EmojiEvents,
  Assignment,
  CheckCircle,
  CalendarToday,
  Timer,
  People,
  Assessment,
  Delete,
  School,
} from '@mui/icons-material';
import ThemeContext from '../../contexts/ThemeContext';
import {
  // teacherPastContests, // ✅ CHANGED: commented out — tab 1 now uses real API (getTeacherPastContests)
  contestsData,
  getDifficultyColor,
  getDifficultyLabel,
  DIFFICULTY_LEVELS,
} from '../../data/contestData';
// ✅ NEW: real contest API + inline question management
import contestsService from '../../services/contests.service';
// ✅ CHANGED: question management is now a dedicated route (/teacher/contests/:contestId) — no inline rendering.
// import AddContestQuestions from './AddContestQuestions';
import { STREAM_LABELS, CONTEST_DIFFICULTY } from '../../utils/constants';

// ✅ NEW: per-difficulty max question count (matches backend REQUIRED_QUESTIONS). Used to disable
// "Add Question" when the contest already has the maximum allowed number of questions.
const REQUIRED_QUESTIONS = { Easy: 10, Medium: 30, Hard: 50 };

const TeacherContests = ({ readOnly = false }) => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState(0);
  const [addQuestionDialog, setAddQuestionDialog] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    title: '',
    description: '',
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    points: 100,
    timeLimit: 2000,
    memoryLimit: 256,
    specialization: 'علمي رياضة', // NEW: Specialization field
  });
  // ✅ NEW: API state + inline question management (replaces mock data for tab 0)
  // ✅ CHANGED: inline question view moved to a dedicated route — state commented out.
  // const [selectedQuestionContestId, setSelectedQuestionContestId] = useState(null);
  const [realTeacherContests, setRealTeacherContests] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  // ✅ NEW: tab 1 past-contests API state (replaces mock teacherPastContests)
  const [realPastContests, setRealPastContests] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [pastError, setPastError] = useState('');
  // ✅ NEW: popup reason shown when a disabled "Add Question" button is clicked.
  const [addDisabledReason, setAddDisabledReason] = useState('');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setApiLoading(true);
        const res = await contestsService.getTeacherContests();
        setRealTeacherContests(res.data?.data ?? []);
      } catch (err) {
        setApiError(err.response?.data?.message || 'فشل تحميل المسابقات');
      } finally {
        setApiLoading(false);
      }
    };
    fetchContests();
  }, []);

  // ✅ NEW: fetch past contests (tab 1) from real API
  useEffect(() => {
    const fetchPast = async () => {
      try {
        setPastLoading(true);
        const res = await contestsService.getTeacherPastContests();
        setRealPastContests(res.data?.data ?? []);
      } catch (err) {
        setPastError(err.response?.data?.message || 'فشل تحميل المسابقات السابقة');
      } finally {
        setPastLoading(false);
      }
    };
    fetchPast();
  }, []);

  // ✅ NEW: normalize API difficulty strings to DIFFICULTY_LEVEL constants + API fields → mock shape
  const diffMap = { Easy: DIFFICULTY_LEVELS.EASY, Medium: DIFFICULTY_LEVELS.MEDIUM, Hard: DIFFICULTY_LEVELS.HARD };
  const normalizedTeacherContests = apiLoading ? [] : realTeacherContests.map(c => ({
    ...c,
    id: c.id,
    title: c.title,
    difficulty: diffMap[c.difficulty] || c.difficulty,
    canonicalDifficulty: c.difficulty,   // ✅ NEW: keep canonical (Easy/Medium/Hard) for REQUIRED_QUESTIONS lookup
    isTest: c.isTest === true,            // ✅ NEW: needed to bypass time-based disable for dev test contests
    canManage: c.canManage === true,      // ✅ NEW: stream match flag — hide "Add Question" when false
    level: STREAM_LABELS[c.stream] || '',
    date: c.startTime,
    duration: c.duration,
    questionCount: c.questionCount ?? c._count?.questions ?? 0,
    participationCount: c.participationCount ?? c._count?.participations ?? 0,
    status: c.status,
    // ✅ CHANGED: was `c.status === 'upcoming'` — now allows active contests too (dev test contests are always active)
    canEdit: c.status !== 'ended',
    questionsSubmitted: c.questionCount ?? 0,
    questionsRequired: Math.max(c.questionCount ?? 0, 1),  // prevent division by zero
  }));

  // ✅ NEW: normalize past contests from API (tab 1)
  const normalizedPastContests = pastLoading ? [] : realPastContests.map(c => ({
    ...c,
    id: c.id,
    title: c.title,
    difficulty: diffMap[c.difficulty] || c.difficulty,
    level: STREAM_LABELS[c.stream] || '',
    date: c.startTime,
    duration: c.duration,
    questionCount: c.questionCount ?? c._count?.questions ?? 0,
    participationCount: c.participationCount ?? c._count?.participations ?? 0,
    status: c.status,
    participants: c.participationCount ?? c._count?.participations ?? 0,
  }));

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('ar-EG', options);
  };

  // ✅ NEW: compute whether "Add Question" is disabled for a contest and why.
  // Disable when: (1) the contest has already started, (2) ≤60 minutes remain before start,
  // (3) the contest already has the maximum allowed questions. Dev test contests (isTest) bypass
  // the time-based disables (matches the backend isTest bypass) — only the max-questions check applies.
  const getAddQuestionState = (contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const maxQ = REQUIRED_QUESTIONS[contest.canonicalDifficulty] || 0;
    const currentQ = contest.questionCount ?? 0;
    const maxReached = maxQ > 0 && currentQ >= maxQ;
    const started = now >= start;                                   // active or ended
    const within60 = !started && (start - now) <= 60 * 60 * 1000;   // upcoming but ≤60min away
    const timeBlocked = contest.isTest ? false : (started || within60);
    const disabled = maxReached || timeBlocked;
    let reason = '';
    if (maxReached) reason = 'المسابقة وصلت إلى الحد الأقصى من الأسئلة';
    else if (timeBlocked) reason = 'المسابقة قد بدأت أو تبقى أقل من 60 دقيقة على بدئها';
    return { disabled, reason };
  };

  const handleOpenAddQuestion = (contest) => {
    setSelectedContest(contest);
    setAddQuestionDialog(true);
  };

  const handleCloseAddQuestion = () => {
    setAddQuestionDialog(false);
    setSelectedContest(null);
    setQuestionForm({
      title: '',
      description: '',
      difficulty: DIFFICULTY_LEVELS.MEDIUM,
      points: 100,
      timeLimit: 2000,
      memoryLimit: 256,
      specialization: 'علمي رياضة',
    });
  };

  const handleSubmitQuestion = () => {
    // TODO: Implement API call to submit question
    console.log('Submitting question:', questionForm);
    handleCloseAddQuestion();
  };

  const handleFormChange = (field, value) => {
    setQuestionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ NEW: inline question-management view (state-based, not route-based)
  // ✅ CHANGED: moved to a dedicated route (/teacher/contests/:contestId) — block commented out.
  // if (selectedQuestionContestId) {
  //   return (
  //     <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
  //       <Container maxWidth="xl" sx={{ pt: 2 }}>
  //         <Button startIcon={<ArrowBack />} onClick={() => setSelectedQuestionContestId(null)}
  //           sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
  //           العودة لقائمة المسابقات
  //         </Button>
  //       </Container>
  //       <AddContestQuestions contestId={selectedQuestionContestId} />
  //     </Box>
  //   );
  // }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            // ✅ NEW: read-only view (assistant/parent) navigates back to its own dashboard.
            onClick={() => navigate(readOnly ? -1 : '/teacher/dashboard')}
            sx={{
              mb: 2,
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 700,
              color: darkMode ? '#f1f5f9' : '#1e293b',
            }}
          >
            العودة للوحة التحكم
          </Button>
          
          <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
            🎯 إدارة المسابقات الذهبية
          </Typography>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            الصف الثالث الثانوي • أضف أسئلة وتابع المسابقات السابقة
          </Typography>
          
          {/* Grade 3 Specializations */}
          <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
            <Chip
              label="علمي رياضة"
              icon={<School sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb',
                color: '#f59e0b',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 2,
                py: 2.5,
                border: '1px solid',
                borderColor: darkMode ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d',
              }}
            />
            <Chip
              label="علمي علوم"
              icon={<School sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb',
                color: '#f59e0b',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 2,
                py: 2.5,
                border: '1px solid',
                borderColor: darkMode ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d',
              }}
            />
            <Chip
              label="أدبي"
              icon={<School sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb',
                color: '#f59e0b',
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 800,
                fontSize: '0.85rem',
                px: 2,
                py: 2.5,
                border: '1px solid',
                borderColor: darkMode ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d',
              }}
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white',
            borderRadius: 3,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              '& .MuiTab-root': {
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 700,
                fontSize: '1rem',
                color: darkMode ? '#94a3b8' : '#64748b',
                '&.Mui-selected': {
                  color: '#2563eb',
                },
              },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assignment />
                  <span>مسابقاتي المخصصة ({normalizedTeacherContests.length})</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle />
                  <span>مسابقاتي السابقة ({normalizedPastContests.length})</span>
                </Box>
              }
            />
            {/* ✅ CHANGED: "جميع المسابقات" tab removed per UI cleanup task (was mock data). */}
            {/* <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents />
                  <span>جميع المسابقات ({contestsData.length})</span>
                </Box>
              }
            /> */}
          </Tabs>
        </Card>

        {/* Assigned Contests */}
        {activeTab === 0 && (<>
          {/* ✅ NEW: API loading/error states */}
          {apiLoading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={48} sx={{ color: '#7c3aed' }} />
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
                جاري تحميل المسابقات...
              </Typography>
            </Box>
          )}
          {apiError && (
            <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{apiError}</Alert>
          )}
          {!apiLoading && !apiError && (
          <Grid container spacing={3}>
            {normalizedTeacherContests.map((contest) => {
              const diffColor = getDifficultyColor(contest.difficulty);
              
              return (
                <Grid item xs={12} md={6} key={contest.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: darkMode ? '#334155' : '#e5e7eb',
                      bgcolor: darkMode ? '#1e293b' : 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        height: 6,
                        background: diffColor.gradient,
                      }}
                    />

                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}
                        >
                          {contest.title}
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                          <Chip
                            label={getDifficultyLabel(contest.difficulty)}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? `${diffColor.bg}20` : diffColor.bg,
                              color: diffColor.text,
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            label={contest.level}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? '#334155' : '#f1f5f9',
                              color: darkMode ? '#94a3b8' : '#64748b',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            label="الصف الثالث الثانوي"
                            size="small"
                            icon={<School sx={{ fontSize: 14 }} />}
                            sx={{
                              bgcolor: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fffbeb',
                              color: '#f59e0b',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CalendarToday sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            fontWeight={600}
                            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                          >
                            {formatDate(contest.date)}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip icon={<Assignment sx={{ fontSize: 14 }} />}
                            label={`${contest.questionCount || 0} سؤال`}
                            size="small" variant="outlined"
                            sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
                          <Chip icon={<Timer sx={{ fontSize: 14 }} />}
                            label={`${contest.duration} دقيقة`}
                            size="small" variant="outlined"
                            sx={{ fontFamily: 'Cairo, sans-serif', borderColor: darkMode ? '#475569' : '#e5e7eb', color: darkMode ? '#94a3b8' : '#64748b' }} />
                        </Box>
                      </Box>

                      {/* ✅ CHANGED: "تفاصيل" button removed; "إضافة سؤال" now fills the available space (fullWidth + centered). */}
                      {/* ✅ CHANGED: button navigates to /teacher/contests/:contestId; disabled when started / ≤60min / max questions reached. */}
                      {/* ✅ NEW: hide the button entirely in read-only mode (assistant/parent) or when canManage=false (stream mismatch). */}
                      {(() => {
                        const { disabled: addDisabled, reason: addReason } = getAddQuestionState(contest);
                        if (readOnly || !contest.canManage) return null;
                        return (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Add />}
                        disableElevation
                        onClick={() => addDisabled ? setAddDisabledReason(addReason) : navigate(`/teacher/contests/${contest.id}`)}
                        sx={{
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 900,
                          borderRadius: 2,
                          py: 1.5,
                          background: addDisabled ? undefined : diffColor.gradient,
                          ...(addDisabled && {
                            bgcolor: darkMode ? '#334155' : '#e5e7eb',
                            color: darkMode ? '#64748b' : '#94a3b8',
                            '&:hover': { bgcolor: darkMode ? '#334155' : '#e5e7eb' },
                          }),
                          '&:hover': {
                            opacity: addDisabled ? 1 : 0.9,
                          },
                        }}
                      >
                        إضافة سؤال
                      </Button>
                        );
                      })()}
                      {/*
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => {
                          // Navigate to contest editor
                          console.log('Edit contest:', contest.id);
                        }}
                        sx={{
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 900,
                          borderRadius: 2,
                          py: 1.5,
                          px: 3,
                          borderColor: darkMode ? '#334155' : '#e5e7eb',
                          color: darkMode ? '#f1f5f9' : '#1e293b',
                          '&:hover': {
                            borderColor: diffColor.border,
                            bgcolor: darkMode ? '#334155' : '#f8fafc',
                          },
                        }}
                      >
                        تفاصيل
                      </Button>
                      */}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          )}
        </>
        )}

        {/* Past Contests */}
        {activeTab === 1 && (<>
          {/* ✅ NEW: API loading/error states for tab 1 */}
          {pastLoading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={48} sx={{ color: '#7c3aed' }} />
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
                جاري تحميل المسابقات السابقة...
              </Typography>
            </Box>
          )}
          {pastError && (
            <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{pastError}</Alert>
          )}
          {!pastLoading && !pastError && normalizedPastContests.length === 0 && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3 }}>
              <CardContent sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>✅</Typography>
                <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
                  لا توجد مسابقات سابقة
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  لم تكتمل أي مسابقات بعد
                </Typography>
              </CardContent>
            </Card>
          )}
          {!pastLoading && !pastError && normalizedPastContests.length > 0 && (
          <Grid container spacing={3}>
            {normalizedPastContests.map((contest) => {
              const diffColor = getDifficultyColor(contest.difficulty);
              
              return (
                <Grid item xs={12} md={6} key={contest.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: darkMode ? '#334155' : '#e5e7eb',
                      bgcolor: darkMode ? '#1e293b' : 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: 6,
                        background: diffColor.gradient,
                      }}
                    />

                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}
                      >
                        {contest.title}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                        <Chip
                          label={getDifficultyLabel(contest.difficulty)}
                          size="small"
                          sx={{
                            bgcolor: darkMode ? `${diffColor.bg}20` : diffColor.bg,
                            color: diffColor.text,
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Chip
                          label={contest.level}
                          size="small"
                          sx={{
                            bgcolor: darkMode ? '#334155' : '#f1f5f9',
                            color: darkMode ? '#94a3b8' : '#64748b',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label="مكتملة"
                          size="small"
                          sx={{
                            bgcolor: darkMode ? 'rgba(5, 150, 105, 0.2)' : '#dcfce7',
                            color: '#059669',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                          <Box
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: 2,
                              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                              border: '1px solid',
                              borderColor: darkMode ? '#334155' : '#e5e7eb',
                            }}
                          >
                            <People sx={{ fontSize: 24, color: '#2563eb', mb: 0.5 }} />
                            <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                              {contest.participants}
                            </Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                              مشارك
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={4}>
                          <Box
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: 2,
                              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                              border: '1px solid',
                              borderColor: darkMode ? '#334155' : '#e5e7eb',
                            }}
                          >
                            <Assignment sx={{ fontSize: 24, color: '#7c3aed', mb: 0.5 }} />
                            <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                              {contest.questionCount ?? 0}
                            </Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                              الأسئلة
                            </Typography>
                          </Box>
                        </Grid>

                        {/* ✅ CHANGED: averageScore stat box commented out (scoring not implemented yet) */}
                        {/*
                        <Grid item xs={4}>
                          <Box
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: 2,
                              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                              border: '1px solid',
                              borderColor: darkMode ? '#334155' : '#e5e7eb',
                            }}
                          >
                            <Assessment sx={{ fontSize: 24, color: '#f59e0b', mb: 0.5 }} />
                            <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                              {contest.averageScore}%
                            </Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                              متوسط
                            </Typography>
                          </Box>
                        </Grid>
                        */}
                      </Grid>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarToday sx={{ fontSize: 16, color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
                        >
                          {formatDate(contest.date)}
                        </Typography>
                      </Box>

                      {/* ✅ CHANGED: "عرض التفاصيل والنتائج" button removed per UI cleanup task. */}
                      {/*
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assessment />}
                        onClick={() => {
                          // Navigate to contest results
                          console.log('View results:', contest.id);
                        }}
                        sx={{
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 900,
                          borderRadius: 2,
                          py: 1.5,
                          borderColor: darkMode ? '#334155' : '#e5e7eb',
                          color: darkMode ? '#f1f5f9' : '#1e293b',
                          '&:hover': {
                            borderColor: diffColor.border,
                            bgcolor: darkMode ? '#334155' : '#f8fafc',
                          },
                        }}
                      >
                        عرض التفاصيل والنتائج
                      </Button>
                      */}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          )}
        </>)}
        {/* ✅ CHANGED: "جميع المسابقات" tab removed — block commented out below. */}
        {/*
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {contestsData.map((contest) => {
              const diffColor = getDifficultyColor(contest.difficulty);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={contest.id}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      border: '1px solid',
                      borderColor: darkMode ? '#334155' : '#e5e7eb',
                      bgcolor: darkMode ? '#1e293b' : 'white',
                      borderRadius: 3,
                      overflow: 'hidden',
                      opacity: contest.status === 'completed' ? 0.7 : 1,
                    }}
                  >
                    <Box
                      sx={{
                        height: 6,
                        background: diffColor.gradient,
                      }}
                    />

                    <CardContent sx={{ p: 2.5 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1.5 }}
                      >
                        {contest.title}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={getDifficultyLabel(contest.difficulty)}
                          size="small"
                          sx={{
                            bgcolor: darkMode ? `${diffColor.bg}20` : diffColor.bg,
                            color: diffColor.text,
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                        <Chip
                          label={contest.level}
                          size="small"
                          sx={{
                            bgcolor: darkMode ? '#334155' : '#f1f5f9',
                            color: darkMode ? '#94a3b8' : '#64748b',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                        <Chip
                          label={contest.status === 'completed' ? 'مكتملة' : 'قادمة'}
                          size="small"
                          sx={{
                            bgcolor: contest.status === 'completed'
                              ? darkMode ? 'rgba(5, 150, 105, 0.2)' : '#dcfce7'
                              : darkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                            color: contest.status === 'completed' ? '#059669' : '#2563eb',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 22,
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday sx={{ fontSize: 14, color: darkMode ? '#64748b' : '#94a3b8' }} />
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
                        >
                          {formatDate(contest.date)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ fontSize: 14, color: darkMode ? '#64748b' : '#94a3b8' }} />
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
                        >
                          {contest.participants} مشارك
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
        */}

        {/* Add Question Dialog */}
        <Dialog
          open={addQuestionDialog}
          onClose={handleCloseAddQuestion}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 900,
              color: darkMode ? '#f1f5f9' : '#1e293b',
            }}
          >
            ➕ إضافة سؤال جديد - {selectedContest?.title}
          </DialogTitle>
          
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                fullWidth
                label="عنوان السؤال"
                value={questionForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                InputLabelProps={{
                  sx: {
                    fontFamily: 'Cairo, sans-serif',
                    color: darkMode ? '#94a3b8' : undefined,
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'Cairo, sans-serif',
                    color: darkMode ? '#f1f5f9' : undefined,
                  },
                }}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="وصف السؤال"
                value={questionForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                InputLabelProps={{
                  sx: {
                    fontFamily: 'Cairo, sans-serif',
                    color: darkMode ? '#94a3b8' : undefined,
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'Cairo, sans-serif',
                    color: darkMode ? '#f1f5f9' : undefined,
                  },
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="الشعبة"
                    value={questionForm.specialization}
                    onChange={(e) => handleFormChange('specialization', e.target.value)}
                    InputLabelProps={{
                      sx: {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#f1f5f9' : undefined,
                      },
                    }}
                  >
                    <MenuItem value="علمي رياضة" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      علمي رياضة
                    </MenuItem>
                    <MenuItem value="علمي علوم" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      علمي علوم
                    </MenuItem>
                    <MenuItem value="أدبي" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      أدبي
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="مستوى الصعوبة"
                    value={questionForm.difficulty}
                    onChange={(e) => handleFormChange('difficulty', e.target.value)}
                    InputLabelProps={{
                      sx: {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#f1f5f9' : undefined,
                      },
                    }}
                  >
                    <MenuItem value={DIFFICULTY_LEVELS.EASY} sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      سهل
                    </MenuItem>
                    <MenuItem value={DIFFICULTY_LEVELS.MEDIUM} sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      متوسط
                    </MenuItem>
                    <MenuItem value={DIFFICULTY_LEVELS.HARD} sx={{ fontFamily: 'Cairo, sans-serif' }}>
                      صعب
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="النقاط"
                    value={questionForm.points}
                    onChange={(e) => handleFormChange('points', parseInt(e.target.value))}
                    InputLabelProps={{
                      sx: {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#f1f5f9' : undefined,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="حد الوقت (ms)"
                    value={questionForm.timeLimit}
                    onChange={(e) => handleFormChange('timeLimit', parseInt(e.target.value))}
                    InputLabelProps={{
                      sx: {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#f1f5f9' : undefined,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="حد الذاكرة (MB)"
                    value={questionForm.memoryLimit}
                    onChange={(e) => handleFormChange('memoryLimit', parseInt(e.target.value))}
                    InputLabelProps={{
                      sx: {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#94a3b8' : undefined,
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontFamily: 'Cairo, sans-serif',
                        color: darkMode ? '#f1f5f9' : undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={handleCloseAddQuestion}
              sx={{
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 700,
                color: darkMode ? '#94a3b8' : '#64748b',
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmitQuestion}
              variant="contained"
              disableElevation
              sx={{
                fontFamily: 'Cairo, sans-serif',
                fontWeight: 900,
                borderRadius: 2,
                px: 3,
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              }}
            >
              إضافة السؤال
            </Button>
          </DialogActions>
        </Dialog>

        {/* ✅ NEW: popup shown when a disabled "Add Question" button is clicked (explains the reason). */}
        <Dialog
          open={!!addDisabledReason}
          onClose={() => setAddDisabledReason('')}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            تعذر إضافة سؤال
          </DialogTitle>
          <DialogContent>
            <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
              {addDisabledReason}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setAddDisabledReason('')}
              variant="contained"
              disableElevation
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, borderRadius: 2, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)' }}
            >
              حسناً
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TeacherContests;