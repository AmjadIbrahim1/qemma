// pages/student/PerformanceReportPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as EmojiEventsIcon,
  AutoAwesome,
  Psychology,
  TipsAndUpdates,
  Lightbulb,
  Insights,
  AutoGraph,
  FormatQuote,
  Speed,
  Stars,
  WarningAmberRounded,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import ThemeContext from '../../contexts/ThemeContext';
import studentsService from '../../services/students.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTooltip,
  Legend,
  Filler
);

const STATS_CONFIG = {
  avgGrade: { icon: StarIcon, color: '#f59e0b' },
  homework: { icon: CheckCircleIcon, color: '#059669' },
  attendance: { icon: SchoolIcon, color: '#2563eb' },
  studyTime: { icon: AccessTimeIcon, color: '#7c3aed' },
};

const PerformanceReportPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await studentsService.getPerformance();
        const result = res?.data?.data ?? res?.data;
        setData(result);
      } catch (err) {
        console.error('Failed to load performance report:', err);
        setError(err.response?.data?.message || err.message || 'فشل تحميل التقرير');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── AI Analysis State ────────────────────────────────────────
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const handleAnalyzeWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const res = await studentsService.analyzePerformance();
      setAiAnalysis(res?.data?.data || null);
    } catch (err) {
      setAiError(err.response?.data?.message || 'فشل تحليل الأداء. حاول مرة أخرى.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} thickness={4} sx={{ color: '#7c3aed' }} />
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
            جاري تحميل التقرير...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
            تعذر تحميل التقرير
          </Typography>
          <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 3 }}>
            {error}
          </Typography>
        </Container>
      </Box>
    );
  }

  if (!data) return null;

  const { stats, ranking, courseProgress, subjectsPerformance, weeklyProgress, strengths, weaknesses,
          maxScore, minScore, studentName, studentLevel } = data;

  const enrichedStats = (stats || []).map((stat) => ({
    ...stat,
    icon: STATS_CONFIG[stat.type]?.icon || StarIcon,
    color: STATS_CONFIG[stat.type]?.color || '#64748b',
  }));

  const gradesChartData = {
    labels: (subjectsPerformance || []).map((s) => s.name),
    datasets: [
      {
        label: 'درجاتك',
        data: (subjectsPerformance || []).map((s) => s.grade),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderRadius: 8,
      },
      {
        label: 'متوسط الفصل',
        data: (subjectsPerformance || []).map((s) => s.classAvg),
        backgroundColor: 'rgba(148, 163, 184, 0.5)',
        borderRadius: 8,
      },
    ],
  };

  const progressChartData = {
    labels: weeklyProgress?.labels || [],
    datasets: [
      {
        label: 'درجاتك',
        data: weeklyProgress?.studentGrades || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#2563eb',
        spanGaps: true,
      },
      {
        label: 'متوسط الفصل',
        data: weeklyProgress?.classAverage || [],
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        spanGaps: true,
      },
    ],
  };

  const courseProgressChartData = {
    labels: ['مكتمل', 'قيد التقدم', 'لم يبدأ'],
    datasets: [
      {
        data: [
          courseProgress?.completed || 0,
          courseProgress?.inProgress || 0,
          courseProgress?.notStarted || 0,
        ],
        backgroundColor: ['#059669', '#f59e0b', '#94a3b8'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Cairo, sans-serif' },
          color: darkMode ? '#94a3b8' : '#64748b',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { family: 'Cairo, sans-serif' },
          color: darkMode ? '#94a3b8' : '#64748b',
        },
        grid: { display: false },
      },
      y: {
        ticks: {
          font: { family: 'Cairo, sans-serif' },
          color: darkMode ? '#94a3b8' : '#64748b',
        },
        grid: { color: darkMode ? '#334155' : '#e5e7eb' },
      },
    },
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
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => navigate('/student/dashboard')}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <ArrowForwardIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                  📊 تقرير الأداء
                </Typography>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                  {studentName || 'الطالب'} {studentLevel ? `• ${studentLevel}` : ''}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                onClick={handleAnalyzeWithAI}
                disabled={aiLoading}
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                  color: "white",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": { background: "linear-gradient(135deg, #6d28d9 0%, #1d4ed8 100%)" },
                }}
              >
                {aiLoading ? "جارٍ التحليل..." : "تحليل الأداء بالذكاء الاصطناعي"}
              </Button>
            </Box>
          </Box>

            {/* Stats Cards */}
          <Grid container spacing={2}>
            {enrichedStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Grid item xs={6} sm={3} key={stat.id}>
                  <Box
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 3,
                      p: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        bgcolor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Icon sx={{ fontSize: 24 }} />
                      <Chip
                        icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                        label={stat.change}
                        size="small"
                        sx={{
                          bgcolor: '#dcfce7',
                          color: '#059669',
                          fontWeight: 700,
                          height: 22,
                          fontSize: 11,
                          '& .MuiChip-icon': { color: '#059669' },
                        }}
                      />
                    </Box>
                    <Typography variant="h4" fontWeight={900}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Ranking Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode
                    ? '0 10px 30px rgba(0,0,0,0.3)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <EmojiEventsIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  الترتيب والتصنيف
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Typography variant="h3" fontWeight={900} sx={{ color: 'white' }}>
                    #{ranking?.classRank || '—'}
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  من أصل {ranking?.totalStudents || 0} طالب
                </Typography>
                {ranking?.rankImproved && (
                  <Chip
                    icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                    label={`تقدم مستواك`}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: '#dcfce7',
                      color: '#059669',
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 600,
                      '& .MuiChip-icon': { color: '#059669' },
                    }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      النسبة المئوية
                    </Typography>
                    <Chip
                      label={`أفضل ${100 - (ranking?.percentile || 0)}%`}
                      size="small"
                      sx={{
                        bgcolor: '#dbeafe',
                        color: '#2563eb',
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>                    {maxScore > 0 && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                            أعلى درجة
                          </Typography>
                          <Typography variant="h6" fontWeight={800} sx={{ color: '#059669' }}>
                            {maxScore}%
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {minScore < 100 && (
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                            أدنى درجة
                          </Typography>
                          <Typography variant="h6" fontWeight={800} sx={{ color: '#ef4444' }}>
                            {minScore}%
                          </Typography>
                        </Box>
                      </Box>
                    )}
              </Box>
            </Card>
          </Grid>

          {/* Course Progress */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode
                    ? '0 10px 30px rgba(0,0,0,0.3)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 3 }}>
                📚 تقدم الكورسات
              </Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                {courseProgress?.total > 0 ? (
                  <Doughnut
                    data={courseProgressChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            font: { family: 'Cairo, sans-serif' },
                            color: darkMode ? '#94a3b8' : '#64748b',
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#475569' : '#94a3b8' }}>
                      لا توجد كورسات مسجلة
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#059669' }}>
                    {courseProgress?.completed || 0}
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    مكتمل
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#f59e0b' }}>
                    {courseProgress?.inProgress || 0}
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    قيد التقدم
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={900} sx={{ color: '#94a3b8' }}>
                    {courseProgress?.notStarted || 0}
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    لم يبدأ
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

          {/* Grades Comparison */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
                height: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode
                    ? '0 10px 30px rgba(0,0,0,0.3)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 3 }}>
                📈 مقارنة الدرجات
              </Typography>
              <Box sx={{ height: 250 }}>
                {subjectsPerformance?.length > 0 ? (
                  <Bar data={gradesChartData} options={chartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#475569' : '#94a3b8' }}>
                      لا توجد نتائج امتحانات بعد
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Subjects Performance */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 3 }}>
                📚 أداء المواد
              </Typography>
              {subjectsPerformance?.length > 0 ? (
                <Grid container spacing={2}>
                  {subjectsPerformance.map((subject, idx) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={idx}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: darkMode ? '#334155' : '#f8fafc',
                          borderTop: `4px solid ${subject.color}`,
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: darkMode
                              ? '0 10px 25px rgba(0,0,0,0.3)'
                              : '0 10px 25px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
                          {subject.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="h5" fontWeight={900} sx={{ color: subject.color }}>
                            {subject.grade}%
                          </Typography>
                          <Chip
                            icon={subject.trend === 'up' ? <TrendingUpIcon sx={{ fontSize: 12 }} /> : <TrendingDownIcon sx={{ fontSize: 12 }} />}
                            label={subject.trendValue}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              bgcolor: subject.trend === 'up' ? '#dcfce7' : '#fee2e2',
                              color: subject.trend === 'up' ? '#059669' : '#ef4444',
                              fontWeight: 700,
                              '& .MuiChip-icon': { color: subject.trend === 'up' ? '#059669' : '#ef4444' },
                            }}
                          />
                        </Box>

                        <LinearProgress
                          variant="determinate"
                          value={subject.grade}
                          sx={{
                            height: 6,
                            borderRadius: 10,
                            bgcolor: darkMode ? '#475569' : '#e2e8f0',
                            mb: 1,
                            '& .MuiLinearProgress-bar': { borderRadius: 10, bgcolor: subject.color },
                          }}
                        />

                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                          متوسط الفصل: {subject.classAvg}% • {subject.examsCount} اختبار
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#475569' : '#94a3b8' }}>
                    لا توجد بيانات أداء للمواد بعد. قم بحل الاختبارات لترى تحليلك.
                  </Typography>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Strengths & Weaknesses */}
          {(strengths?.length > 0 || weaknesses?.length > 0) && (
            <Grid item xs={12}>
              <Grid container spacing={3}>
                {/* Strengths */}
                {strengths?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                        bgcolor: darkMode ? '#1e293b' : 'white',
                        borderRadius: 3,
                        p: 3,
                        height: '100%',
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: '#059669', mb: 2 }}>
                        💪 نقاط القوة
                      </Typography>
                      {strengths.map((s, idx) => (
                        <Box key={idx} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                              {s.subject}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" fontWeight={700} sx={{ color: '#059669' }}>
                                {s.score}%
                              </Typography>
                              <TrendingUpIcon sx={{ fontSize: 14, color: '#059669' }} />
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={s.score}
                            sx={{
                              height: 6,
                              borderRadius: 10,
                              bgcolor: darkMode ? '#334155' : '#e5e7eb',
                              '& .MuiLinearProgress-bar': { borderRadius: 10, bgcolor: '#059669' },
                            }}
                          />
                        </Box>
                      ))}
                    </Card>
                  </Grid>
                )}

                {/* Weaknesses */}
                {weaknesses?.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card
                      elevation={0}
                      sx={{
                        border: '1px solid',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                        bgcolor: darkMode ? '#1e293b' : 'white',
                        borderRadius: 3,
                        p: 3,
                        height: '100%',
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: '#ef4444', mb: 2 }}>
                        ⚠️ نقاط الضعف
                      </Typography>
                      {weaknesses.map((s, idx) => (
                        <Box key={idx} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#e2e8f0' : '#334155' }}>
                              {s.subject}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" fontWeight={700} sx={{ color: '#ef4444' }}>
                                {s.score}%
                              </Typography>
                              {s.trend === 'up' ? (
                                <TrendingUpIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
                              ) : (
                                <TrendingDownIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                              )}
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={s.score}
                            sx={{
                              height: 6,
                              borderRadius: 10,
                              bgcolor: darkMode ? '#334155' : '#e5e7eb',
                              '& .MuiLinearProgress-bar': { borderRadius: 10, bgcolor: '#ef4444' },
                            }}
                          />
                        </Box>
                      ))}
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

          {/* Progress Over Time */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                borderRadius: 3,
                p: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: darkMode
                    ? '0 10px 30px rgba(0,0,0,0.3)'
                    : '0 10px 30px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 3 }}>
                📊 تطور الأداء عبر الوقت
              </Typography>
              <Box sx={{ height: 280 }}>
                {weeklyProgress?.studentGrades?.some(g => g !== null) ? (
                  <Line data={progressChartData} options={chartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#475569' : '#94a3b8' }}>
                      لا توجد بيانات أداء كافية بعد
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* ── AI Analysis Results ─────────────────────────────── */}
        {aiError && (
          <Alert severity="error" sx={{ mt: 4, fontFamily: "Cairo, sans-serif" }}>{aiError}</Alert>
        )}

        {aiAnalysis && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome sx={{ color: '#7c3aed' }} /> تحليل الأداء بالذكاء الاصطناعي
            </Typography>

            {/* Overall Assessment */}
            {aiAnalysis.overallAssessment && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Insights sx={{ color: '#7c3aed' }} />
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    التقييم العام
                  </Typography>
                </Box>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569', lineHeight: 1.8 }}>
                  {aiAnalysis.overallAssessment}
                </Typography>
              </Card>
            )}

            <Grid container spacing={3}>
              {/* Strengths */}
              {aiAnalysis.strengths?.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Stars sx={{ color: '#059669' }} />
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        نقاط القوة
                      </Typography>
                    </Box>
                    {aiAnalysis.strengths.map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ color: '#059669', fontFamily: 'Cairo, sans-serif' }}>✅</Typography>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{item}</Typography>
                      </Box>
                    ))}
                  </Card>
                </Grid>
              )}

              {/* Weaknesses */}
              {aiAnalysis.weaknesses?.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <WarningAmberRounded sx={{ color: '#dc2626' }} />
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        نقاط الضعف
                      </Typography>
                    </Box>
                    {aiAnalysis.weaknesses.map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ color: '#dc2626', fontFamily: 'Cairo, sans-serif' }}>❌</Typography>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{item}</Typography>
                      </Box>
                    ))}
                  </Card>
                </Grid>
              )}

              {/* Weak Lessons */}
              {aiAnalysis.weakLessons?.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Psychology sx={{ color: '#7c3aed' }} />
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        الدروس التي تحتاج مراجعة
                      </Typography>
                    </Box>
                    {aiAnalysis.weakLessons.map((lesson, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ color: '#7c3aed', fontFamily: 'Cairo, sans-serif' }}>📖</Typography>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{lesson}</Typography>
                      </Box>
                    ))}
                  </Card>
                </Grid>
              )}

              {/* Topics to Study */}
              {aiAnalysis.topicsToStudy?.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AutoGraph sx={{ color: '#2563eb' }} />
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                        المواضيع المقترحة للمذاكرة
                      </Typography>
                    </Box>
                    {aiAnalysis.topicsToStudy.map((topic, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Typography sx={{ color: '#2563eb', fontFamily: 'Cairo, sans-serif' }}>🎯</Typography>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{topic}</Typography>
                      </Box>
                    ))}
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Advice */}
            {aiAnalysis.advice && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FormatQuote sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    نصيحة
                  </Typography>
                </Box>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569', lineHeight: 1.8, fontStyle: 'italic' }}>
                  "{aiAnalysis.advice}"
                </Typography>
              </Card>
            )}

            {/* Improvements */}
            {aiAnalysis.improvements?.length > 0 && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TipsAndUpdates sx={{ color: '#059669' }} />
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    مقترحات للتحسين
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {aiAnalysis.improvements.map((item, i) => (
                    <Grid item xs={12} sm={6} key={i}>
                      <Paper elevation={0} sx={{ p: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', borderRadius: 2, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                          💡 {item}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            )}

            {/* Study Plan */}
            {aiAnalysis.studyPlan && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Lightbulb sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    خطة الدراسة المقترحة
                  </Typography>
                </Box>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#cbd5e1' : '#475569', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {aiAnalysis.studyPlan}
                </Typography>
              </Card>
            )}

            {/* Motivational Message */}
            {aiAnalysis.motivationalMessage && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 3, mt: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <Speed sx={{ color: '#7c3aed' }} />
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                    رسالة تحفيزية
                  </Typography>
                </Box>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: '#7c3aed', lineHeight: 1.8, fontWeight: 600, fontSize: '1.1rem' }}>
                  {aiAnalysis.motivationalMessage}
                </Typography>
              </Card>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PerformanceReportPage;
