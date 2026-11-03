// frontend/src/pages/parent/ChildProgress.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import parentsService from "../../services/parents.service";
import { normalizeChild, normalizeTasks, safePercentage, safeProgressValue, safeNumber } from "../../utils/normalizeApiResponse";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Warning,
  School,
  Assignment,
  EventAvailable,
} from "@mui/icons-material";

const ChildProgress = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [children, setChildren] = useState([]);

  // Fetch real children data from API
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const res = await parentsService.getChildren();
        const raw = res.data.data || res.data || [];
        setChildren(Array.isArray(raw) ? raw.map(normalizeChild) : []);
      } catch (err) {
        if (err.response?.status === 403) {
          setChildren([]);
        } else {
          console.error('Failed to fetch children:', err);
          setError('فشل تحميل بيانات الأبناء');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // ── Derive child summary stats from normalised data ──────────
  const childrenSummaries = children.map((child) => {
    const tasks = Array.isArray(child.tasks) ? child.tasks : [];
    const normalizedTasksList = normalizeTasks(tasks);
    const pendingAssignments = normalizedTasksList.filter(t => t.type === 'assignment' && !t.completed).length;
    const pendingExams = normalizedTasksList.filter(t => t.type === 'exam' && !t.completed).length;

    return {
      id: child.id,
      name: child.name || 'غير محدد',
      grade: child.grade || '',
      avatar: child.avatar || (child.name || '?').charAt(0),
      totalCourses: Number(child.totalCourses),
      averageGrade: Number(child.averageGrade),
      attendance: Number(child.attendance),
      pendingAssignments,
      upcomingExams: pendingExams,
      behaviorAlerts: Number(child.behaviorAlerts),
    };
  });

  // Summary stats
  const totalAlerts = childrenSummaries.reduce((s, c) => s + c.behaviorAlerts, 0);
  const avgAllGrades = childrenSummaries.length > 0
    ? Math.round(childrenSummaries.reduce((s, c) => s + c.averageGrade, 0) / childrenSummaries.length)
    : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
      {/* Header */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
          color: "white",
          py: 3,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              sx={{ color: "white" }}
              onClick={() => navigate("/parent/dashboard")}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
            >
              متابعة الأبناء
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#2563eb", mb: 1 }}
                >
                  {childrenSummaries.length}
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={600}
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  إجمالي الأبناء
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#059669", mb: 1 }}
                >
                  {safePercentage(avgAllGrades)}
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={600}
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  متوسط الدرجات
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{
                    color: totalAlerts > 0 ? "#dc2626" : "#059669",
                    mb: 1,
                  }}
                >
                  {totalAlerts}
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={600}
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  التنبيهات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Children Cards */}
        <Grid container spacing={3}>
          {childrenSummaries.map((child) => (
            <Grid item xs={12} lg={6} key={child.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#2563eb",
                    transform: "translateY(-4px)",
                    boxShadow: darkMode
                      ? "0 10px 20px rgba(0,0,0,0.3)"
                      : "0 10px 20px rgba(0,0,0,0.1)",
                  },
                }}
                onClick={() => navigate(`/parent/child/${child.id}`)}
              >
                {/* Child Header */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 3,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Avatar
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "#2563eb",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 900,
                        fontSize: "1.5rem",
                      }}
                    >
                      {child.avatar}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {child.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                      >
                        {child.grade || 'غير محدد'}
                      </Typography>
                    </Box>
                  </Box>

                  {child.behaviorAlerts > 0 && (
                    <Chip
                      icon={<Warning />}
                      label={`${child.behaviorAlerts} تنبيه`}
                      size="small"
                      sx={{
                        bgcolor: "#fef2f2",
                        color: "#dc2626",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Box>

                {/* Stats Grid */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 1.5,
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      <School
                        sx={{ fontSize: 28, color: "#7c3aed", mb: 0.5 }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {child.totalCourses}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                      >
                        كورسات
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 1.5,
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      <Assignment
                        sx={{ fontSize: 28, color: "#f59e0b", mb: 0.5 }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {child.pendingAssignments}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                      >
                        واجبات
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 1.5,
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      <EventAvailable
                        sx={{ fontSize: 28, color: "#2563eb", mb: 0.5 }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {child.upcomingExams}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                      >
                        اختبارات
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 1.5,
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      {child.averageGrade >= 80 ? (
                        <TrendingUp
                          sx={{ fontSize: 28, color: "#059669", mb: 0.5 }}
                        />
                      ) : (
                        <TrendingDown
                          sx={{ fontSize: 28, color: "#dc2626", mb: 0.5 }}
                        />
                      )}
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {safePercentage(child.attendance)}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                      >
                        حضور
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Progress Bar */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={600}
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      متوسط الدرجات
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={900}
                      sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      {safePercentage(child.averageGrade)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={safeProgressValue(child.averageGrade)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: darkMode ? "#334155" : "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        bgcolor:
                          safeNumber(child.averageGrade) >= 80
                            ? "#059669"
                            : safeNumber(child.averageGrade) >= 60
                              ? "#f59e0b"
                              : "#dc2626",
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          ))}
          {childrenSummaries.length === 0 && (
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: '1px solid',
                  borderColor: darkMode ? '#334155' : '#e5e7eb',
                  bgcolor: darkMode ? '#1e293b' : 'white',
                }}
              >
                <Typography fontFamily="Cairo, sans-serif" color="text.secondary" fontWeight={600}>
                  No children available yet.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default ChildProgress;
