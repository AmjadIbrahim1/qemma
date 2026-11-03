// frontend/src/components/landing/ContestSection/ContestSection.jsx
// ✅ CHANGED: next-contest card now fetches real data from the public API (was mock getCurrentContest).
import { useContext, useState, useEffect } from "react";
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
  Button,
  Paper,
} from "@mui/material";
import {
  EmojiEvents,
  CalendarToday,
  Timer,
  People,
  Star,
  TrendingUp,
  School,
  ChevronLeft,
} from "@mui/icons-material";
import { useAuth } from "../../../hooks/useAuth";
import ThemeContext from "../../../contexts/ThemeContext";
import {
  getDifficultyColor,
  getDifficultyLabel,
  getRatingColor,
  DIFFICULTY_LEVELS,
} from "../../../data/contestData";
import contestsService from "../../../services/contests.service";
import studentsService from "../../../services/students.service";
import { STREAM_LABELS, CONTEST_DIFFICULTY } from "../../../utils/constants";

const ContestSection = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const [currentContest, setCurrentContest] = useState(null);
  const [topAchievers, setTopAchievers] = useState({});

  useEffect(() => {
    contestsService.getNextContest()
      .then((res) => setCurrentContest(res.data?.data ?? null))
      .catch(() => setCurrentContest(null));

    studentsService.getTopAchievers()
      .then((res) => setTopAchievers(res.data?.data ?? {}))
      .catch(() => setTopAchievers({}));
  }, []);
  // ✅ NEW: map canonical API difficulty (Easy/Medium/Hard) → mock lowercase for getDifficultyColor/Label.
  const diffMap = { Easy: DIFFICULTY_LEVELS.EASY, Medium: DIFFICULTY_LEVELS.MEDIUM, Hard: DIFFICULTY_LEVELS.HARD };
  // ✅ NEW: normalize the API contest into the shape the existing UI expects (difficulty label + level + date).
  const normalizedContest = currentContest ? {
    ...currentContest,
    difficulty: diffMap[currentContest.difficulty] || currentContest.difficulty,
    level: STREAM_LABELS[currentContest.stream] || currentContest.stream || '',
    date: currentContest.startTime,
  } : null;

  const formatDate = (date) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(date).toLocaleDateString("ar-EG", options);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ساعة${mins > 0 ? ` ${mins} دقيقة` : ""}`;
  };

  const getTimeUntilContest = (date) => {
    const now = new Date();
    const contestDate = new Date(date);
    const diff = contestDate - now;

    if (diff < 0) return "جارية الآن!";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} يوم${hours > 0 ? ` ${hours} ساعة` : ""}`;
    } else if (hours > 0) {
      const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} ساعة${minutes > 0 ? ` ${minutes} دقيقة` : ""}`;
    } else {
      const minutes = Math.ceil((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} دقيقة`;
    }
  };

  return (
    <Box
      id="contest-section"
      sx={{
        py: 8,
        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Decoration */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          background: darkMode
            ? "radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)"
            : "radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
        {/* Section Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            fontWeight={900}
            fontFamily="Cairo, sans-serif"
            sx={{
              mb: 2,
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            🏆 المسابقات الذهبيه
          </Typography>
          <Typography
            variant="h6"
            fontFamily="Cairo, sans-serif"
            sx={{
              color: darkMode ? "#94a3b8" : "#64748b",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            تحدى نفسك وشارك في المسابقات الذهبيه التنافسية
          </Typography>
        </Box>

        {/* Current/Upcoming Contest */}
        {/* ✅ CHANGED: uses normalizedContest (real API data) instead of currentContest (mock). */}
        {normalizedContest && (
          <Card
            elevation={0}
            sx={{
              mb: 6,
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {/* Header Gradient */}
            <Box
              sx={{
                height: 8,
                background: getDifficultyColor(normalizedContest.difficulty)
                  .gradient,
              }}
            />

            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Grid container spacing={4} alignItems="center">
                <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        flexWrap: "wrap",
                        mb: 2,
                      }}
                    >
                      <Chip
                        label="🔥 المسابقة القادمة"
                        sx={{
                          bgcolor: darkMode
                            ? "rgba(239, 68, 68, 0.2)"
                            : "#fee2e2",
                          color: "#dc2626",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          px: 2,
                          py: 2.5,
                        }}
                      />
                      <Chip
                        label={getDifficultyLabel(normalizedContest.difficulty)}
                        sx={{
                          bgcolor: darkMode
                            ? `${getDifficultyColor(normalizedContest.difficulty).bg}20`
                            : getDifficultyColor(normalizedContest.difficulty).bg,
                          color: getDifficultyColor(normalizedContest.difficulty)
                            .text,
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 800,
                          fontSize: "0.9rem",
                          px: 2,
                          py: 2.5,
                        }}
                      />
                      <Chip
                        label={normalizedContest.level}
                        sx={{
                          bgcolor: darkMode ? "#334155" : "#f1f5f9",
                          color: darkMode ? "#94a3b8" : "#64748b",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          px: 2,
                          py: 2.5,
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h3"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      {normalizedContest.title}
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CalendarToday
                            sx={{
                              fontSize: 20,
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                display: "block",
                              }}
                            >
                              التاريخ
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {formatDate(normalizedContest.date).split(",")[0]}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Timer
                            sx={{
                              fontSize: 20,
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                display: "block",
                              }}
                            >
                              المدة
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {formatDuration(normalizedContest.duration)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* ✅ CHANGED: "المشاركين" (participants) section removed completely per task requirement. */}
                      {/*
                      <Grid item xs={6} sm={3}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <People
                            sx={{
                              fontSize: 20,
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                display: "block",
                              }}
                            >
                              المشاركين
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {normalizedContest.participants}+
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      */}

                      <Grid item xs={6} sm={4}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <EmojiEvents
                            sx={{
                              fontSize: 20,
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                display: "block",
                              }}
                            >
                              الأسئلة
                            </Typography>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {/* ✅ CHANGED: مسائل → أسئلة. */}
                              {normalizedContest.questionCount} أسئلة
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} md={5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: darkMode
                        ? "linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.12) 100%)"
                        : "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)",
                      border: "1px solid",
                      borderColor: darkMode
                        ? "rgba(37, 99, 235, 0.3)"
                        : "rgba(37, 99, 235, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={700}
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 1 }}
                    >
                      ⏰ تبدأ خلال
                    </Typography>
                    <Typography
                      variant="h2"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{
                        mb: 3,
                        background:
                          "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {getTimeUntilContest(normalizedContest.date)}
                    </Typography>
                    {!user && (
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        disableElevation
                        endIcon={<ChevronLeft />}
                        onClick={() => navigate("/register")}
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          borderRadius: 2,
                          py: 2,
                          background:
                            "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)",
                          },
                        }}
                      >
                        🚀 سجل الآن
                      </Button>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Top 10 Students - Grade 3 Specializations */}
        <Box>
          <Typography
            variant="h4"
            fontWeight={900}
            fontFamily="Cairo, sans-serif"
            sx={{
              mb: 4,
              textAlign: "center",
              color: darkMode ? "#f1f5f9" : "#1e293b",
            }}
          >
            🌟 أوائل الصف الثالث الثانوي
          </Typography>

          <Grid container spacing={4}>
            {['علمي رياضة', 'علمي علوم', 'أدبي'].map((specialization) => {
              const students = topAchievers[specialization] || [];
              return (
                <Grid item xs={12} lg={4} key={specialization}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 3,
                      height: "100%",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 3,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background:
                              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                          }}
                        >
                          <School sx={{ fontSize: 28 }} />
                        </Box>
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                        >
                          {specialization}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        {students.slice(0, 10).map((student, index) => {
                          const ratingInfo = getRatingColor(student.rating);
                          const medalEmoji =
                            index === 0
                              ? "🥇"
                              : index === 1
                                ? "🥈"
                                : index === 2
                                  ? "🥉"
                                  : null;

                          return (
                            <Paper
                              key={student.id}
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                                border: "1px solid",
                                borderColor:
                                  index < 3
                                    ? darkMode
                                      ? "rgba(251, 191, 36, 0.3)"
                                      : "rgba(251, 191, 36, 0.2)"
                                    : darkMode
                                      ? "#334155"
                                      : "#e5e7eb",
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  transform: "translateX(-4px)",
                                  borderColor:
                                    index < 3
                                      ? "#fbbf24"
                                      : darkMode
                                        ? "#475569"
                                        : "#cbd5e1",
                                },
                              }}
                            >
                              <Typography
                                variant="h6"
                                fontWeight={900}
                                fontFamily="Cairo, sans-serif"
                                sx={{
                                  minWidth: 32,
                                  color:
                                    index < 3
                                      ? "#fbbf24"
                                      : darkMode
                                        ? "#64748b"
                                        : "#94a3b8",
                                }}
                              >
                                {medalEmoji || `#${index + 1}`}
                              </Typography>

                              <Avatar
                                src={student.avatar || undefined}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  fontSize: "1.5rem",
                                  bgcolor: student.avatar ? "transparent" : "#2563eb",
                                }}
                              >
                                {!student.avatar && student.name?.charAt(0)}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  fontFamily="Cairo, sans-serif"
                                  sx={{
                                    color: darkMode ? "#f1f5f9" : "#1e293b",
                                    mb: 0.25,
                                  }}
                                  noWrap
                                >
                                  {student.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{
                                    color: darkMode ? "#64748b" : "#94a3b8",
                                  }}
                                  noWrap
                                >
                                  {student.examsCount} اختبار
                                </Typography>
                              </Box>

                              <Box sx={{ textAlign: "left" }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={900}
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: ratingInfo.color, mb: 0.25 }}
                                >
                                  {student.rating}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <Star
                                    sx={{ fontSize: 14, color: "#fbbf24" }}
                                  />
                                  <Typography
                                    variant="caption"
                                    fontFamily="Cairo, sans-serif"
                                    fontWeight={600}
                                    sx={{
                                      color: darkMode ? "#64748b" : "#94a3b8",
                                    }}
                                  >
                                    {student.contestsCount}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default ContestSection;
