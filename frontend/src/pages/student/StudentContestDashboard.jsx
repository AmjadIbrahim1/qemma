// frontend/src/pages/student/StudentContestDashboard.jsx - Student Golden Contest Dashboard - Grade 3
import { useState, useContext, useEffect } from "react";   // ✅ NEW: useEffect for API fetch
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Button,
  LinearProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,   // ✅ NEW: dashboard loading state
  Alert,              // ✅ NEW: dashboard error state
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  Code,
  Timer,
  CheckCircle,
  ArrowBack,
  CalendarToday,
  Assessment,
  Star,
  EmojiEventsOutlined,
  School,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ThemeContext from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
// ✅ CHANGED: commented out mock data imports — dashboard now uses real API data
// import {
//   studentContestHistory,
//   ratingHistory,
//   getDifficultyColor,
//   getDifficultyLabel,
//   getRatingColor,
// } from "../../data/contestData";
import {
  getDifficultyColor,
  getDifficultyLabel,
  getRatingColor,
  DIFFICULTY_LEVELS,
} from "../../data/contestData";
// ✅ NEW: real contest dashboard API + stream label mapping
import contestsService from "../../services/contests.service";
import { STREAM_LABELS } from "../../utils/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const StudentContestDashboard = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const studentYear = user?.student?.year;
  const isThirdYear = studentYear === 'third';

  useEffect(() => {
    if (!isThirdYear) {
      navigate('/student/contests', { replace: true });
    }
  }, [isThirdYear, navigate]);

  const [selectedContest, setSelectedContest] = useState(null);
  // ✅ NEW: dashboard API state (replaces mock studentContestHistory + ratingHistory)
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ NEW: fetch dashboard aggregates (stats + rating history + per-contest rows) on mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await contestsService.getDashboard();
        setDashboard(res.data?.data ?? null);
      } catch (err) {
        setError(err.response?.data?.message || "فشل تحميل لوحة المسابقات");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ✅ NEW: student's stream → Arabic label (replaces the hardcoded multi-stream header subtitle)
  const studentStreamLabel = user?.student?.stream
    ? STREAM_LABELS[user.student.stream] || user.student.stream
    : "";

  // ✅ NEW: map backend difficulty strings (Easy/Medium/Hard) → DIFFICULTY_LEVEL constants
  //   so getDifficultyColor/getDifficultyLabel keep working
  const diffMap = {
    Easy: DIFFICULTY_LEVELS.EASY,
    Medium: DIFFICULTY_LEVELS.MEDIUM,
    Hard: DIFFICULTY_LEVELS.HARD,
  };

  // ✅ NEW: format contest duration (minutes) → "H:MM:SS" to match the existing detail-view shape
  const formatDuration = (minutes) => {
    if (minutes == null) return "";
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h}:${String(m).padStart(2, "0")}:00`;
  };

  // ✅ NEW: normalize API rows into the shape the table/detail view expect
  const contests = (dashboard?.contests ?? []).map((c) => ({
    ...c,
    difficulty: diffMap[c.difficulty] || c.difficulty,                 // string → lowercase constant
    date: c.date ? new Date(c.date).toLocaleDateString("ar-EG") : "",  // ISO → Arabic date label
    duration: formatDuration(c.duration),                              // minutes → "H:MM:SS"
  }));

  // ✅ NEW: rating history + stats + current rating from API (was: derived from mock arrays)
  const ratingHistoryApi = dashboard?.ratingHistory ?? [];
  const currentRating = dashboard?.currentRating ?? 0;
  const stats = dashboard?.stats ?? { totalContests: 0, totalSolved: 0, avgRank: 0, bestRank: 0 };
  // const totalContests = studentContestHistory.length;  // OLD: mock
  const totalContests = stats.totalContests;
  // const totalSolved = studentContestHistory.reduce((sum, c) => sum + c.solvedProblems, 0);  // OLD: mock
  const totalSolved = stats.totalSolved;
  // const avgRank = Math.round(studentContestHistory.reduce((sum, c) => sum + c.rank, 0) / totalContests);  // OLD: mock
  const avgRank = stats.avgRank;
  // const bestRank = Math.min(...studentContestHistory.map((c) => c.rank));  // OLD: mock
  const bestRank = stats.bestRank;

  const ratingInfo = getRatingColor(currentRating);

  // Rating chart data (✅ now driven by API rating history)
  const chartData = {
    labels: ratingHistoryApi.map((r) => {
      const date = new Date(r.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        label: "التقييم",
        data: ratingHistoryApi.map((r) => r.rating),
        borderColor: ratingInfo.color,
        backgroundColor: `${ratingInfo.color}20`,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: ratingInfo.color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? "#1e293b" : "#fff",
        titleColor: darkMode ? "#f1f5f9" : "#1e293b",
        bodyColor: darkMode ? "#f1f5f9" : "#1e293b",
        borderColor: darkMode ? "#334155" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            // ✅ CHANGED: use API rating history (was: mock ratingHistory)
            return ratingHistoryApi[index]?.contestName || "";
          },
          label: (context) => {
            return `التقييم: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        ticks: {
          font: {
            family: "Cairo, sans-serif",
            size: 11,
          },
          color: darkMode ? "#94a3b8" : "#64748b",
        },
      },
      y: {
        grid: {
          color: darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        },
        ticks: {
          font: {
            family: "Cairo, sans-serif",
            size: 11,
          },
          color: darkMode ? "#94a3b8" : "#64748b",
        },
      },
    },
  };

  // If contest selected, show details
  if (selectedContest) {
    const diffColor = getDifficultyColor(selectedContest.difficulty);

    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          {/* Back Button */}
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setSelectedContest(null)}
            sx={{
              mb: 3,
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              color: darkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            العودة للوحة المسابقات
          </Button>

          {/* Contest Details Card */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: diffColor.gradient,
                color: "white",
                p: 4,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ mb: 1 }}
                  >
                    {selectedContest.contestName}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={getDifficultyLabel(selectedContest.difficulty)}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      label={selectedContest.date}
                      icon={
                        <CalendarToday sx={{ color: "white !important" }} />
                      }
                      sx={{
                        bgcolor: "rgba(255,255,255,0.2)",
                        color: "white",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      label="الصف الثالث الثانوي"
                      icon={<School sx={{ color: "white !important" }} />}
                      sx={{
                        bgcolor: "rgba(255,255,255,0.3)",
                        color: "white",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h2"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                  >
                    #{selectedContest.rank}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    من {selectedContest.totalParticipants}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Stats Grid */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}
                    >
                      {selectedContest.score}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      النقاط
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{
                          color:
                            selectedContest.ratingChange >= 0
                              ? "#059669"
                              : "#dc2626",
                        }}
                      >
                        {selectedContest.ratingChange >= 0 ? "+" : ""}
                        {selectedContest.ratingChange}
                      </Typography>
                      {selectedContest.ratingChange >= 0 ? (
                        <TrendingUp sx={{ color: "#059669", fontSize: 32 }} />
                      ) : (
                        <TrendingDown sx={{ color: "#dc2626", fontSize: 32 }} />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      التغير في التقييم
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}
                    >
                      {selectedContest.solvedProblems}/
                      {selectedContest.totalProblems}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      المسائل المحلولة
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={3}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}
                    >
                      {selectedContest.duration}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      الوقت المستغرق
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* New Rating */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: darkMode
                    ? `${ratingInfo.color}15`
                    : `${ratingInfo.color}10`,
                  border: "2px solid",
                  borderColor: `${ratingInfo.color}40`,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={700}
                  sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 1 }}
                >
                  التقييم الجديد
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: ratingInfo.color, mb: 1 }}
                >
                  {selectedContest.newRating}
                </Typography>
                <Chip
                  label={ratingInfo.rank}
                  sx={{
                    bgcolor: ratingInfo.color,
                    color: "white",
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // Main Dashboard View
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/student/dashboard")}
            sx={{
              mb: 2,
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              color: darkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            العودة للوحة التحكم
          </Button>

          <Typography
            variant="h3"
            fontWeight={900}
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}
          >
            🏆 لوحة المسابقات الذهبية
          </Typography>
          <Typography
            variant="h6"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            {/* ✅ CHANGED: was hardcoded multi-stream label — now the student's actual stream in Arabic */}
            {/* الصف الثالث الثانوي • علمي رياضة • علمي علوم • أدبي */}
            {studentStreamLabel}
          </Typography>
        </Box>

        {/* ✅ NEW: dashboard loading state */}
        {loading && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress size={48} sx={{ color: "#7c3aed" }} />
            <Typography
              variant="body1"
              fontFamily="Cairo, sans-serif"
              sx={{ mt: 2, color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              جاري تحميل لوحة المسابقات...
            </Typography>
          </Box>
        )}
        {/* ✅ NEW: dashboard error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, fontFamily: "Cairo, sans-serif" }}>
            {error}
          </Alert>
        )}
        {/* ✅ NEW: render dashboard content only once loaded and without error */}
        {!loading && !error && (
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Rating Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${ratingInfo.color}20 0%, ${ratingInfo.color}05 100%)`,
                  borderBottom: "1px solid",
                  borderBottomColor: darkMode ? "#334155" : "#e5e7eb",
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={700}
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 1 }}
                    >
                      التقييم الحالي
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography
                        variant="h2"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: ratingInfo.color }}
                      >
                        {currentRating}
                      </Typography>
                      <Chip
                        label={ratingInfo.rank}
                        sx={{
                          bgcolor: ratingInfo.color,
                          color: "white",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          px: 2,
                          py: 2.5,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: "left" }}>
                    <EmojiEvents
                      sx={{
                        fontSize: 60,
                        color: ratingInfo.color,
                        opacity: 0.3,
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={900}
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  📈 منحنى التقييم
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>

            {/* Contest History */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={900}
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  📋 سجل المسابقات الذهبية
                </Typography>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          المسابقة
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          الترتيب
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          النقاط
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          المحلولة
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        >
                          التغير
                        </TableCell>
                        <TableCell
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            color: darkMode ? "#94a3b8" : "#64748b",
                          }}
                        ></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* ✅ CHANGED: was studentContestHistory.map — now real API rows (contests) */}
                      {contests.map((contest) => {
                        const diffColor = getDifficultyColor(
                          contest.difficulty,
                        );
                        return (
                          <TableRow
                            key={contest.id}
                            hover
                            sx={{
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: darkMode ? "#334155" : "#f8fafc",
                              },
                            }}
                            onClick={() => setSelectedContest(contest)}
                          >
                            <TableCell>
                              <Box>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  fontFamily="Cairo, sans-serif"
                                  sx={{
                                    color: darkMode ? "#f1f5f9" : "#1e293b",
                                    mb: 0.5,
                                  }}
                                >
                                  {contest.contestName}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Chip
                                    label={getDifficultyLabel(
                                      contest.difficulty,
                                    )}
                                    size="small"
                                    sx={{
                                      bgcolor: darkMode
                                        ? `${diffColor.bg}20`
                                        : diffColor.bg,
                                      color: diffColor.text,
                                      fontFamily: "Cairo, sans-serif",
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                  <Chip
                                    label={contest.date}
                                    size="small"
                                    sx={{
                                      bgcolor: darkMode ? "#334155" : "#f1f5f9",
                                      color: darkMode ? "#94a3b8" : "#64748b",
                                      fontFamily: "Cairo, sans-serif",
                                      fontWeight: 600,
                                      fontSize: "0.7rem",
                                    }}
                                  />
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {/* ✅ NEW: rank is null until the scoring job runs */}
                              {contest.rank != null ? (
                                <>
                                  <Typography
                                    variant="h6"
                                    fontWeight={900}
                                    fontFamily="Cairo, sans-serif"
                                    sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                                  >
                                    #{contest.rank}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    fontFamily="Cairo, sans-serif"
                                    sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                                  >
                                    من {contest.totalParticipants}
                                  </Typography>
                                </>
                              ) : (
                                <Typography
                                  variant="body2"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {/* ✅ NEW: score is null until scored */}
                              <Typography
                                variant="h6"
                                fontWeight={900}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                              >
                                {contest.score != null
                                  ? Math.round(contest.score)
                                  : "—"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                              >
                                {contest.solvedProblems}/{contest.totalProblems}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {/* ✅ NEW: ratingChange is null until scored */}
                              {contest.ratingChange != null ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  {contest.ratingChange >= 0 ? (
                                    <TrendingUp
                                      sx={{ color: "#059669", fontSize: 20 }}
                                    />
                                  ) : (
                                    <TrendingDown
                                      sx={{ color: "#dc2626", fontSize: 20 }}
                                    />
                                  )}
                                  <Typography
                                    variant="body2"
                                    fontWeight={800}
                                    fontFamily="Cairo, sans-serif"
                                    sx={{
                                      color:
                                        contest.ratingChange >= 0
                                          ? "#059669"
                                          : "#dc2626",
                                    }}
                                  >
                                    {contest.ratingChange >= 0 ? "+" : ""}
                                    {contest.ratingChange}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography
                                  variant="body2"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <ArrowBack
                                  sx={{
                                    color: darkMode ? "#94a3b8" : "#64748b",
                                  }}
                                />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {/* ✅ NEW: empty state when the student has no contest participations yet */}
                      {contests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                            >
                              لم تشارك في أي مسابقات بعد
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Stats */}
          <Grid item xs={12} lg={4}>
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <EmojiEventsOutlined
                      sx={{ fontSize: 40, color: "#f59e0b", mb: 1 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 0.5 }}
                    >
                      {totalContests}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      مسابقة ذهبية
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <CheckCircle
                      sx={{ fontSize: 40, color: "#059669", mb: 1 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 0.5 }}
                    >
                      {totalSolved}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      مسألة محلولة
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Assessment
                      sx={{ fontSize: 40, color: "#2563eb", mb: 1 }}
                    />
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 0.5 }}
                    >
                      #{avgRank}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      متوسط الترتيب
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <Star sx={{ fontSize: 40, color: "#7c3aed", mb: 1 }} />
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 0.5 }}
                    >
                      #{bestRank}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      أفضل ترتيب
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Grade 3 Specializations Card — ✅ REMOVED per student-dashboard-feature-frontend.md
                ("الصف الثالث الثانوي" tab removed completely). Original markup preserved, commented out.
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: "2px solid",
                borderColor: "#f59e0b",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={900}
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  📚 الصف الثالث الثانوي
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: darkMode ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                      border: "1px solid",
                      borderColor: darkMode
                        ? "rgba(245, 158, 11, 0.3)"
                        : "#fcd34d",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: "#f59e0b", mb: 0.5 }}
                    >
                      🔬 علمي رياضة
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      رياضيات • فيزياء • كيمياء
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: darkMode ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                      border: "1px solid",
                      borderColor: darkMode
                        ? "rgba(245, 158, 11, 0.3)"
                        : "#fcd34d",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: "#f59e0b", mb: 0.5 }}
                    >
                      🧬 علمي علوم
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      أحياء • كيمياء • فيزياء
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      bgcolor: darkMode ? "rgba(245, 158, 11, 0.1)" : "#fffbeb",
                      border: "1px solid",
                      borderColor: darkMode
                        ? "rgba(245, 158, 11, 0.3)"
                        : "#fcd34d",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: "#f59e0b", mb: 0.5 }}
                    >
                      📖 أدبي
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      لغة عربية • تاريخ • جغرافيا
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
            */}

            {/* Achievements — ✅ REMOVED: "الإنجازات" tab removed per user request.
                Original markup preserved below, commented out.
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={900}
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  🏅 الإنجازات
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: "#059669", width: 48, height: 48 }}
                      >
                        <EmojiEvents />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            mb: 0.5,
                          }}
                        >
                          خمس مسابقات ذهبية
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: darkMode ? "#334155" : "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "#059669",
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                      <CheckCircle sx={{ color: "#059669" }} />
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: "#2563eb", width: 48, height: 48 }}
                      >
                        <Code />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            mb: 0.5,
                          }}
                        >
                          20 مسألة محلولة
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(totalSolved / 20) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: darkMode ? "#334155" : "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "#2563eb",
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                      {totalSolved >= 20 && (
                        <CheckCircle sx={{ color: "#059669" }} />
                      )}
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{ bgcolor: "#7c3aed", width: 48, height: 48 }}
                      >
                        <Star />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            mb: 0.5,
                          }}
                        >
                          وصول التقييم 1600+
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(currentRating / 1600) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: darkMode ? "#334155" : "#e5e7eb",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: "#7c3aed",
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                      {currentRating >= 1600 && (
                        <CheckCircle sx={{ color: "#059669" }} />
                      )}
                    </Box>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
            */}
          </Grid>
        </Grid>
        )}
      </Container>
    </Box>
  );
};

export default StudentContestDashboard;
