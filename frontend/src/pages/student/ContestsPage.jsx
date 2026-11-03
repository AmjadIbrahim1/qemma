// frontend/src/pages/student/ContestsPage.jsx - All Golden Contests View - Grade 3
import { useState, useContext, useEffect } from 'react';   // ✅ NEW: useEffect for API fetch
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {                                             // ✅ NEW: extra MUI components for inline participation
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
  IconButton,
  Avatar,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  CalendarToday,
  People,
  Timer,
  EmojiEvents,
  Psychology,
  Upcoming,
  CheckCircle,
  School,
  PlayArrow,
} from '@mui/icons-material';
import ThemeContext from '../../contexts/ThemeContext';
import {
  // contestsData, // ✅ CHANGED: commented out — tab 1 now uses real API (getMyHistory)
  getDifficultyColor,
  getDifficultyLabel,
  DIFFICULTY_LEVELS,
} from '../../data/contestData';
// ✅ NEW: real contest API + inline participation
import contestsService from '../../services/contests.service';
// ✅ CHANGED: participation is now a dedicated route (/student/contests/:contestId) — no inline rendering.
// import TakeContestPage from './TakeContestPage';
import { STREAM_LABELS, CONTEST_DIFFICULTY } from '../../utils/constants';
// ✅ NEW: Dialog for the disabled-start popup (explains why the contest can't be started).
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const ContestsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user: authUser } = useAuth();
  const studentYear = authUser?.student?.year;
  const isThirdYear = studentYear === 'third';
  const [activeTab, setActiveTab] = useState(0);
  // ✅ NEW: API state + inline participation (replaces mock data for tab 0)
  // ✅ CHANGED: inline participation moved to a dedicated route — state commented out.
  // const [selectedContestId, setSelectedContestId] = useState(null);
  const [realContests, setRealContests] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  // ✅ NEW: tab 1 past-contests API state (replaces mock contestsData)
  const [pastContests, setPastContests] = useState([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [pastError, setPastError] = useState('');
  // ✅ NEW: popup reason shown when a disabled "بدء المسابقة" button is clicked.
  const [startDisabledReason, setStartDisabledReason] = useState('');
  // ✅ NEW: real-time clock — ticks every second so the countdown + isUpcoming update without an API call
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setApiLoading(true);
        const res = await contestsService.getAvailableContests();
        setRealContests(res.data?.data ?? []);
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
        const res = await contestsService.getMyHistory();
        setPastContests(res.data?.data ?? []);
      } catch (err) {
        setPastError(err.response?.data?.message || 'فشل تحميل المسابقات السابقة');
      } finally {
        setPastLoading(false);
      }
    };
    fetchPast();
  }, []);

  // ✅ NEW: normalize API difficulty strings to DIFFICULTY_LEVEL constants
  const diffMap = { Easy: DIFFICULTY_LEVELS.EASY, Medium: DIFFICULTY_LEVELS.MEDIUM, Hard: DIFFICULTY_LEVELS.HARD };

  // Filter contests by status
  // ✅ NEW: tab 0 uses real API data (normalized); tab 1 uses real API past contests
  const upcomingContests = apiLoading ? [] : realContests.map(c => ({
    ...c,
    difficulty: diffMap[c.difficulty] || c.difficulty,          // string → DIFFICULTY_LEVEL constant
    level: STREAM_LABELS[c.stream] || c.level || '',             // stream → Arabic label
    date: c.startTime || c.date,                                  // API startTime as canonical date
    participants: c.participationCount ?? c.participants ?? 0,
    questionCount: c.questionCount ?? c._count?.questions ?? 0,
  }));
  // ✅ CHANGED: tab 1 now uses real API past contests (was: contestsData.filter(completed))
  const completedContests = pastLoading ? [] : pastContests.map(c => ({
    ...c,
    difficulty: diffMap[c.difficulty] || c.difficulty,
    level: STREAM_LABELS[c.stream] || c.level || '',
    date: c.startTime || c.date,
    participants: c.participationCount ?? c.participants ?? 0,
    questionCount: c.questionCount ?? c._count?.questions ?? 0,
  }));

  const displayContests = activeTab === 0 ? upcomingContests : completedContests;

  // ✅ NEW: show loading/error for tab 0
  const showApiLoading = activeTab === 0 && apiLoading;
  const showApiError   = activeTab === 0 && apiError;
  // ✅ NEW: show loading/error for tab 1
  const showPastLoading = activeTab === 1 && pastLoading;
  const showPastError   = activeTab === 1 && pastError;

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('ar-EG', options);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة${mins > 0 ? ` ${mins} دقيقة` : ''}`;
  };

  const getTimeUntilContest = (date) => {
    const now = new Date();
    const contestDate = new Date(date);
    const diff = contestDate - now;
    
    if (diff < 0) return 'انتهت';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} يوم${hours > 0 ? ` ${hours} ساعة` : ''}`;
    } else if (hours > 0) {
      return `${hours} ساعة`;
    } else {
      const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} دقيقة`;
    }
  };

  // ✅ NEW: inline participation view (state-based, not route-based)
  // ✅ CHANGED: moved to a dedicated route (/student/contests/:contestId) — block commented out.
  // if (selectedContestId) {
  //   return (
  //     <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
  //       <Container maxWidth="xl" sx={{ pt: 2 }}>
  //         <Button startIcon={<ArrowBack />} onClick={() => setSelectedContestId(null)}
  //           sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
  //           العودة لقائمة المسابقات
  //         </Button>
  //       </Container>
  //       <TakeContestPage contestId={selectedContestId} onBack={() => setSelectedContestId(null)} />
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
            onClick={() => navigate('/student/dashboard')}
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
            🎯 جميع المسابقات الذهبية
          </Typography>
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
            الصف الثالث الثانوي • اكتشف المسابقات القادمة والسابقة
          </Typography>
          
          {/* Grade 3 Specializations */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                  <Upcoming />
                  <span>المسابقات القادمة ({upcomingContests.length})</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle />
                  <span>المسابقات السابقة ({completedContests.length})</span>
                </Box>
              }
            />
          </Tabs>
        </Card>

        {/* ✅ NEW: API loading/error for tab 0 */}
        {showApiLoading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#7c3aed' }} />
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
              جاري تحميل المسابقات...
            </Typography>
          </Box>
        )}
        {showApiError && (
          <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{apiError}</Alert>
        )}

        {/* ✅ NEW: API loading/error for tab 1 */}
        {showPastLoading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#7c3aed' }} />
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
              جاري تحميل المسابقات السابقة...
            </Typography>
          </Box>
        )}
        {showPastError && (
          <Alert severity="error" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}>{pastError}</Alert>
        )}

        {!isThirdYear && (
          <Alert severity="warning" sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mb: 3, fontSize: '1rem' }}>
            يجب أن تكون في الصف الثالث الثانوي للمشاركة في المسابقات.
          </Alert>
        )}

        {/* Contests Grid */}
        {!showApiLoading && !showApiError && !showPastLoading && !showPastError && (
        <Grid container spacing={3}>
          {displayContests.map((contest) => {
            const diffColor = getDifficultyColor(contest.difficulty);
            const isUpcoming = new Date(contest.date) > now;
            // ✅ CHANGED: "عرض النتائج" button removed — only "بدء المسابقة" is shown (disabled when not startable).
            // ✅ NEW: disable Start when (1) the contest has not started yet, or (2) it has no questions.
            const hasNoQuestions = !contest.questionCount || contest.questionCount === 0;
            // ✅ NEW: hasSubmitted = student already submitted this contest → show disabled "تم التسليم".
            const hasSubmitted = contest.hasSubmitted === true;
            // ✅ NEW: eligible = 3rd-year AND stream match (backend still enforces in startContest).
            const eligible = contest.eligible !== false;   // defaults to true if field is missing
            const startDisabled = isUpcoming || hasNoQuestions;
            const startReason = isUpcoming
              ? 'المسابقة لم تبدأ بعد'
              : hasNoQuestions
                ? 'المسابقة لا تحتوي على أسئلة'
                : '';
            // ✅ CHANGED: was `canParticipate = contest.status !== 'ended'` — now always show the start button.
            // const canParticipate = contest.status !== 'ended';
            
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
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: darkMode
                        ? '0 12px 24px rgba(0,0,0,0.3)'
                        : '0 12px 24px rgba(0,0,0,0.1)',
                      borderColor: diffColor.border,
                    },
                  }}
                >
                  {/* Header with difficulty gradient */}
                  <Box
                    sx={{
                      height: 6,
                      background: diffColor.gradient,
                    }}
                  />

                  <CardContent sx={{ p: 3 }}>
                    {/* Title and Level */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}
                        >
                          {contest.title}
                        </Typography>
                        
                        {contest.aiGenerated && (
                          <Chip
                            icon={<Psychology sx={{ fontSize: 16 }} />}
                            label="AI"
                            size="small"
                            sx={{
                              bgcolor: darkMode ? 'rgba(124, 58, 237, 0.2)' : '#f5f3ff',
                              color: '#7c3aed',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={getDifficultyLabel(contest.difficulty)}
                          size="small"
                          sx={{
                            bgcolor: darkMode ? `${diffColor.bg}20` : diffColor.bg,
                            color: diffColor.text,
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            border: '1px solid',
                            borderColor: darkMode ? `${diffColor.border}40` : diffColor.border,
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
                          label="الصف الثالث"
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
                    </Box>

                    {/* Contest Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                        >
                          {formatDuration(contest.duration)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                        >
                          {contest.participants} مشارك
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ fontSize: 18, color: darkMode ? '#94a3b8' : '#64748b' }} />
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                        >
                          {contest.questionCount} أسئلة
                        </Typography>
                      </Box>
                    </Box>

                    {/* Time Until / Status */}
                    {isUpcoming && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: darkMode ? 'rgba(37, 99, 235, 0.1)' : '#eff6ff',
                          border: '1px solid',
                          borderColor: darkMode ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                          sx={{ color: darkMode ? '#93c5fd' : '#1e40af', display: 'block', mb: 0.5 }}
                        >
                          ⏰ تبدأ خلال
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: '#2563eb' }}
                        >
                          {getTimeUntilContest(contest.date)}
                        </Typography>
                      </Box>
                    )}

                    {/* Action Button */}
                    {/* ✅ CHANGED: renamed "التسجيل في المسابقة" → "بدء المسابقة"; "عرض النتائج" removed. */}
                    {/* ✅ NEW: disabled when not started / no questions; clicking a disabled button shows a popup. */}
                    {/* ✅ NEW: hide the "بدء المسابقة" button on the past-contests tab (activeTab === 1). */}
                    {/* ✅ NEW: show a disabled "تم التسليم" button when the student already submitted (can't rejoin). */}
                    {/* ✅ NEW: hide the "بدء المسابقة" button when the student is not eligible (wrong stream/year). */}
                    {activeTab !== 1 && (
                    hasSubmitted ? (
                      <Button
                        fullWidth
                        variant="contained"
                        disableElevation
                        disabled
                        sx={{
                          fontFamily: 'Cairo, sans-serif',
                          fontWeight: 900,
                          borderRadius: 2,
                          py: 1.5,
                          bgcolor: darkMode ? '#334155' : '#e5e7eb',
                          color: darkMode ? '#64748b' : '#94a3b8',
                          '&:hover': { bgcolor: darkMode ? '#334155' : '#e5e7eb' },
                        }}
                      >
                        ✅ تم التسليم
                      </Button>
                    ) : eligible ? (
                    <Button
                      fullWidth
                      variant="contained"
                      disableElevation
                      onClick={() => startDisabled ? setStartDisabledReason(startReason) : navigate(`/student/contests/${contest.id}`)}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 900,
                        borderRadius: 2,
                        py: 1.5,
                        ...(startDisabled
                          ? {
                              bgcolor: darkMode ? '#334155' : '#e5e7eb',
                              color: darkMode ? '#64748b' : '#94a3b8',
                              '&:hover': { bgcolor: darkMode ? '#334155' : '#e5e7eb' },
                            }
                          : {
                              background: diffColor.gradient,
                              color: 'white',
                              '&:hover': { opacity: 0.9 },
                            }),
                      }}
                    >
                      🚀 بدء المسابقة
                    </Button>
                    ) : null
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        )}

        {/* Empty State */}
        {!showApiLoading && !showApiError && !showPastLoading && !showPastError && displayContests.length === 0 && (
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>
                {activeTab === 0 ? '📅' : '✅'}
              </Typography>
              <Typography
                variant="h6"
                fontFamily="Cairo, sans-serif"
                fontWeight={700}
                sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}
              >
                {activeTab === 0 ? 'لا توجد مسابقات قادمة' : 'لا توجد مسابقات سابقة'}
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}
              >
                {activeTab === 0
                  ? 'تابع لاحقاً لمعرفة المسابقات الجديدة'
                  : 'لم تشارك في أي مسابقات بعد'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* ✅ NEW: popup shown when a disabled "بدء المسابقة" button is clicked (explains the reason). */}
        <Dialog
          open={!!startDisabledReason}
          onClose={() => setStartDisabledReason('')}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            تعذر بدء المسابقة
          </DialogTitle>
          <DialogContent>
            <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
              {startDisabledReason}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setStartDisabledReason('')}
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

export default ContestsPage;