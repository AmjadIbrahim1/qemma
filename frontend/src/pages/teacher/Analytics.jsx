// frontend/src/pages/teacher/Analytics.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Rating,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  CheckCircle,
  School,
  BarChart as BarChartIcon,
  Download,
  Refresh,
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
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // ── Filter State ────────────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // ── Data State ──────────────────────────────────────────────────
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [teacherRating, setTeacherRating] = useState(null);
  const [lessonRatings, setLessonRatings] = useState([]);
  const [lessonRatingsLoading, setLessonRatingsLoading] = useState(false);
  const { user } = useAuth();

  // ── Course Selector + AI Analysis ──────────────────────────────
  const [courses, setCourses]           = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [aiAnalysis, setAiAnalysis]     = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState(null);

  // ── Fetch teacher report ────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/analytics/teacher");
      setReport(res.data?.data || null);
    } catch (err) {
      setError("تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى.");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    const teacherId = user?.teacher?.id;
    if (teacherId) {
      api.get(`/students/rate/teacher/${teacherId}`)
        .then(res => setTeacherRating(res.data?.data || null))
        .catch(() => {});
    }
  }, [user]);

  // ── Fetch teacher's courses for course selector ──────────────
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses/my");
        const data = res.data?.data || res.data?.courses || [];
        setCourses(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      } catch {
        try {
          const res = await api.get("/teachers/me");
          const teacherData = res.data?.data;
          if (teacherData?.courses) {
            setCourses(teacherData.courses);
            if (teacherData.courses.length > 0) setSelectedCourseId(teacherData.courses[0].id);
          }
        } catch {}
      }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    const teacherId = user?.teacher?.id;
    if (!teacherId) return;
    const fetchLessonRatings = async () => {
      setLessonRatingsLoading(true);
      try {
        let res;
        try {
          res = await api.get(`/courses/teacher/${teacherId}`);
        } catch {
          res = await api.get(`/courses/teacher-by-user/${teacherId}`);
        }
        const teacher = res.data?.data;
        const courses = teacher?.courses || [];
        if (!courses.length) return;
        // Fetch full course details including lessons
        const courseResults = await Promise.allSettled(
          courses.map(c => api.get(`/courses/public/${c.id}`))
        );
        const lessons = [];
        courseResults.forEach((cr, i) => {
          if (cr.status === 'fulfilled') {
            const courseData = cr.value.data?.data;
            const courseTitle = courses[i]?.title || '';
            (courseData?.lessons || []).forEach(l => {
              lessons.push({ id: l.id, title: l.title, courseTitle });
            });
          }
        });
        if (!lessons.length) return;
        const ratingResults = await Promise.allSettled(
          lessons.map(l => api.get(`/students/rate/lesson/${l.id}`))
        );
        const data = lessons.map((l, i) => {
          const r = ratingResults[i];
          return {
            id: l.id,
            title: l.title,
            courseTitle: l.courseTitle,
            rating: r.status === 'fulfilled' && r.value.data?.data ? r.value.data.data : null,
          };
        });
        setLessonRatings(data);
      } catch (_) {} finally {
        setLessonRatingsLoading(false);
      }
    };
    fetchLessonRatings();
  }, [user]);

  const handleAnalyzeWithAI = async () => {
    if (!selectedCourseId) return;
    setAiLoading(true);
    setAiError(null);
    setAiAnalysis(null);
    try {
      const res = await api.post(`/analytics/teacher/courses/${selectedCourseId}/analyze`);
      setAiAnalysis(res.data?.data || null);
    } catch (err) {
      setAiError(err.response?.data?.message || "فشل تحليل الكورس. حاول مرة أخرى.");
      console.error("AI Analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/analytics/teacher/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'teacher-statistics.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // ── Derived data from report ────────────────────────────────────
  const summary          = report?.summary          || {};
  const enrollmentTrend  = report?.enrollmentTrend  || [];
  const scoreDist        = report?.scoreDist        || [];
  const topStudents      = report?.topStudents      || [];
  const coursePerformance = report?.coursePerformance || [];

  // Summary cards config (built from real data)
  const statCards = [
    {
      title: "إجمالي الطلاب",
      value: summary.totalStudents ?? "—",
      change: null,
      trend: "up",
      icon: <People sx={{ fontSize: 40 }} />,
      color: "#2563eb",
      bgColor: "#eff6ff",
    },
    {
      title: "الاختبارات المنشورة",
      value: summary.totalExams ?? "—",
      change: null,
      trend: "up",
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
    },
    {
      title: "معدل النجاح",
      value: summary.passRate != null ? `${summary.passRate}%` : "—",
      change: null,
      trend: summary.passRate >= 70 ? "up" : "down",
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: "#059669",
      bgColor: "#ecfdf5",
    },
    {
      title: "متوسط الدرجات",
      value: summary.avgScore ?? "—",
      change: null,
      trend: summary.avgScore >= 70 ? "up" : "down",
      icon: <School sx={{ fontSize: 40 }} />,
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
  ];

  const periods = [
    { value: "week",    label: "آخر أسبوع" },
    { value: "month",   label: "آخر شهر" },
    { value: "quarter", label: "آخر 3 أشهر" },
    { value: "year",    label: "آخر سنة" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
        py: 4,
      }}
    >
      <Container maxWidth="xl">

        {/* ── Header ─────────────────────────────────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/teacher/dashboard")}
            sx={{
              mb: 2,
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              color: darkMode ? "#f1f5f9" : "inherit",
            }}
          >
            العودة للوحة التحكم
          </Button>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <BarChartIcon />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  الإحصائيات والتحليلات
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  تابع أداء طلابك وتحليلات شاملة
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel sx={{ fontFamily: "Cairo, sans-serif", color: darkMode ? "#94a3b8" : undefined }}>
                  اختر الكورس
                </InputLabel>
                <Select
                  value={selectedCourseId}
                  onChange={(e) => { setSelectedCourseId(e.target.value); setAiAnalysis(null); setAiError(null); }}
                  label="اختر الكورس"
                  sx={{
                    fontFamily: "Cairo, sans-serif",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: darkMode ? "#334155" : undefined },
                    "& .MuiSelect-select": { color: darkMode ? "#f1f5f9" : undefined },
                  }}
                >
                  {courses.map((c) => (
                    <MenuItem key={c.id} value={c.id} sx={{ fontFamily: "Cairo, sans-serif" }}>
                      {c.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                onClick={handleAnalyzeWithAI}
                disabled={!selectedCourseId || aiLoading}
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                  color: "white",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    background: "linear-gradient(135deg, #6d28d9 0%, #1d4ed8 100%)",
                  },
                  "&.Mui-disabled": {
                    background: darkMode ? "#334155" : "#e5e7eb",
                  },
                }}
              >
                {aiLoading ? "جارٍ التحليل..." : "تحليل بالذكاء الاصطناعي"}
              </Button>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel
                  sx={{
                    fontFamily: "Cairo, sans-serif",
                    color: darkMode ? "#94a3b8" : undefined,
                  }}
                >
                  الفترة
                </InputLabel>
                <Select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  label="الفترة"
                  sx={{
                    fontFamily: "Cairo, sans-serif",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: darkMode ? "#334155" : undefined },
                    "& .MuiSelect-select": { color: darkMode ? "#f1f5f9" : undefined },
                  }}
                >
                  {periods.map((p) => (
                    <MenuItem key={p.value} value={p.value} sx={{ fontFamily: "Cairo, sans-serif" }}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchReport}
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 700,
                  borderColor: darkMode ? "#334155" : undefined,
                  color: darkMode ? "#f1f5f9" : "inherit",
                }}
              >
                تحديث
              </Button>

              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExport}
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 700,
                  borderColor: darkMode ? "#334155" : undefined,
                  color: darkMode ? "#f1f5f9" : "inherit",
                }}
              >
                تصدير Excel
              </Button>
            </Box>
          </Box>
        </Box>

        {/* ── Error Banner ───────────────────────────────────────── */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Loading Overlay ────────────────────────────────────── */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress size={48} />
          </Box>
        )}

        {!loading && (
          <>
            {/* ── Summary Cards ────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {statCards.map((stat, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: darkMode
                          ? "0 10px 20px rgba(0,0,0,0.3)"
                          : "0 10px 20px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            bgcolor: darkMode ? stat.color + "20" : stat.bgColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: stat.color,
                          }}
                        >
                          {stat.icon}
                        </Box>
                        <Chip
                          icon={stat.trend === "up" ? <TrendingUp /> : <TrendingDown />}
                          label={stat.trend === "up" ? "↑" : "↓"}
                          size="small"
                          sx={{
                            bgcolor: stat.trend === "up" ? "#ecfdf5" : "#fef2f2",
                            color: stat.trend === "up" ? "#059669" : "#dc2626",
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h4"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ mb: 0.5, color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                        sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                      >
                        {stat.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* ── Charts Row 1 ─────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Enrollment Trend Line Chart */}
              <Grid item xs={12} lg={8}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      تطور التسجيلات (آخر 6 أشهر)
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={enrollmentTrend}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={darkMode ? "#334155" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="month"
                          stroke={darkMode ? "#94a3b8" : "#6b7280"}
                          style={{ fontFamily: "Cairo, sans-serif" }}
                        />
                        <YAxis
                          stroke={darkMode ? "#94a3b8" : "#6b7280"}
                          style={{ fontFamily: "Cairo, sans-serif" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: darkMode ? "#1e293b" : "white",
                            border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
                            borderRadius: "8px",
                            fontFamily: "Cairo, sans-serif",
                          }}
                        />
                        <Legend wrapperStyle={{ fontFamily: "Cairo, sans-serif" }} />
                        <Line
                          type="monotone"
                          dataKey="students"
                          stroke="#2563eb"
                          strokeWidth={3}
                          name="الطلاب المسجلون"
                          dot={{ fill: "#2563eb", r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Score Distribution Pie Chart */}
              <Grid item xs={12} lg={4}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      توزيع النتائج
                    </Typography>
                    {scoreDist.every((s) => s.value === 0) ? (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                        <Typography fontFamily="Cairo, sans-serif" color="text.secondary">
                          لا توجد بيانات كافية
                        </Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={scoreDist}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {scoreDist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: darkMode ? "#1e293b" : "white",
                              border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
                              borderRadius: "8px",
                              fontFamily: "Cairo, sans-serif",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <Box sx={{ mt: 2 }}>
                      {scoreDist.map((item, index) => (
                        <Box
                          key={index}
                          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              bgcolor: item.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ── Charts Row 2 ─────────────────────────────────────── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Course / Grade Performance Bar Chart */}
              <Grid item xs={12} lg={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      توزيع الطلاب على الكورسات
                    </Typography>
                    {coursePerformance.length === 0 ? (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
                        <Typography fontFamily="Cairo, sans-serif" color="text.secondary">
                          لا توجد كورسات بعد
                        </Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={coursePerformance}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={darkMode ? "#334155" : "#e5e7eb"}
                          />
                          <XAxis
                            dataKey="name"
                            stroke={darkMode ? "#94a3b8" : "#6b7280"}
                            style={{ fontFamily: "Cairo, sans-serif" }}
                          />
                          <YAxis
                            stroke={darkMode ? "#94a3b8" : "#6b7280"}
                            style={{ fontFamily: "Cairo, sans-serif" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: darkMode ? "#1e293b" : "white",
                              border: `1px solid ${darkMode ? "#334155" : "#e5e7eb"}`,
                              borderRadius: "8px",
                              fontFamily: "Cairo, sans-serif",
                            }}
                          />
                          <Bar
                            dataKey="students"
                            fill="#7c3aed"
                            radius={[8, 8, 0, 0]}
                            name="عدد الطلاب"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Top Students */}
              <Grid item xs={12} lg={6}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      أفضل الطلاب
                    </Typography>
                    {topStudents.length === 0 ? (
                      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200 }}>
                        <Typography fontFamily="Cairo, sans-serif" color="text.secondary">
                          لا توجد بيانات بعد
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        {topStudents.map((student, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              p: 2,
                              mb: 1,
                              borderRadius: 2,
                              bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                              border: "1px solid",
                              borderColor: darkMode ? "#334155" : "#e5e7eb",
                            }}
                          >
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Chip
                                label={index + 1}
                                size="small"
                                sx={{
                                  bgcolor:
                                    index === 0 ? "#fbbf24"
                                    : index === 1 ? "#94a3b8"
                                    : index === 2 ? "#c2410c"
                                    : darkMode ? "#334155" : "#e5e7eb",
                                  color: "white",
                                  fontFamily: "Cairo, sans-serif",
                                  fontWeight: 900,
                                }}
                              />
                              <Avatar
                                sx={{
                                  bgcolor: "#2563eb",
                                  width: 40,
                                  height: 40,
                                  fontFamily: "Cairo, sans-serif",
                                  fontWeight: 900,
                                }}
                              >
                                {student.avatar}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="body1"
                                  fontWeight={700}
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                                >
                                  {student.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                                >
                                  {student.examsCount} اختبار
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={`${student.avgScore}`}
                              sx={{
                                bgcolor: "#ecfdf5",
                                color: "#059669",
                                fontFamily: "Cairo, sans-serif",
                                fontWeight: 900,
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ── Course Performance Table ──────────────────────────── */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  أداء الكورسات
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["الكورس", "عدد الطلاب", "عدد الاختبارات", "الدروس", "الأداء"].map((h) => (
                          <TableCell
                            key={h}
                            align={h === "الكورس" ? "left" : "center"}
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                              color: darkMode ? "#f1f5f9" : "inherit",
                            }}
                          >
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {coursePerformance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                            <Typography fontFamily="Cairo, sans-serif" color="text.secondary">
                              لا توجد بيانات لعرضها
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        coursePerformance.map((course, index) => (
                          <TableRow
                            key={index}
                            sx={{ "&:hover": { bgcolor: darkMode ? "#0f172a" : "#f9fafb" } }}
                          >
                            <TableCell
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                color: darkMode ? "#f1f5f9" : "inherit",
                              }}
                            >
                              {course.name}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                color: darkMode ? "#94a3b8" : "text.secondary",
                              }}
                            >
                              {course.students}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                color: darkMode ? "#94a3b8" : "text.secondary",
                              }}
                            >
                              {course.exams ?? "—"}
                            </TableCell>
                            <TableCell
                              align="center"
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                color: darkMode ? "#94a3b8" : "text.secondary",
                              }}
                            >
                              {course.lessons ?? "—"}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ width: "100%", px: 2 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(
                                    100,
                                    summary.totalStudents
                                      ? Math.round((course.students / summary.totalStudents) * 100)
                                      : 0
                                  )}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: darkMode ? "#334155" : "#e5e7eb",
                                    "& .MuiLinearProgress-bar": {
                                      bgcolor: "#7c3aed",
                                      borderRadius: 4,
                                    },
                                  }}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Lesson Ratings ──────────────────────────────────── */}
        {lessonRatings.length > 0 && (
          <Card
            elevation={0}
            sx={{
              mt: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}>
                تقييمات الدروس
              </Typography>
              {lessonRatingsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["الدرس", "الكورس", "التقييم", "عدد التقييمات"].map(h => (
                          <TableCell key={h} align="right" sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lessonRatings.map((l, i) => (
                        <TableRow key={l.id} sx={{ "&:hover": { bgcolor: darkMode ? "#0f172a" : "#f9fafb" } }}>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", color: darkMode ? "#f1f5f9" : "inherit" }}>
                            {l.title}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", color: darkMode ? "#94a3b8" : "text.secondary" }}>
                            {l.courseTitle}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Rating value={l.rating?.averageRating || 0} readOnly size="small" sx={{ color: "#fbbf24" }} />
                              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                {l.rating?.averageRating?.toFixed(1) || "—"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                              {l.rating?.totalRatings ?? 0}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Teacher Ratings ──────────────────────────────────── */}
        {/* ── AI Course Analysis ───────────────────────────────── */}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <AutoAwesome sx={{ color: "#7c3aed", fontSize: 28 }} />
            <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
              تحليل الذكاء الاصطناعي
            </Typography>
          </Box>

          {aiError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setAiError(null)}>
              {aiError}
            </Alert>
          )}

          {aiLoading && (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 4, textAlign: "center" }}>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <Box sx={{ position: "relative", width: 80, height: 80 }}>
                    <CircularProgress size={80} sx={{ color: "#7c3aed" }} />
                    <AutoAwesome sx={{ position: "absolute", top: 20, left: 20, fontSize: 40, color: "#7c3aed" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                    جارٍ تحليل بيانات الكورس بالذكاء الاصطناعي...
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}>
                    يقوم الذكاء الاصطناعي بتحليل نتائج الاختبارات والواجبات والحضور وأداء الطلاب
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {aiAnalysis && !aiLoading && (
            <>
              {/* ── Overall Assessment ───────────────────────────── */}
              <Card elevation={0} sx={{ border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      <Insights />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                        التقييم العام
                      </Typography>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}>
                        {aiAnalysis.courseTitle} — {new Date(aiAnalysis.analyzedAt).toLocaleString("ar-EG")}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#e2e8f0" : "#334155", lineHeight: 1.8 }}>
                    {aiAnalysis.analysis.overallAssessment}
                  </Typography>
                </CardContent>
              </Card>

              {/* ── Strengths & Weaknesses ───────────────────────── */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <Stars sx={{ color: "#059669", fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                          نقاط القوة
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {(aiAnalysis.analysis.strengths || []).map((s, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: darkMode ? "#064e3b" : "#ecfdf5" }}>
                            <CheckCircle sx={{ color: "#059669", fontSize: 20, mt: 0.3, flexShrink: 0 }} />
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#a7f3d0" : "#065f46", lineHeight: 1.7 }}>
                              {s}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <WarningAmberRounded sx={{ color: "#dc2626", fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                          نقاط الضعف
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {(aiAnalysis.analysis.weaknesses || []).map((w, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: darkMode ? "#450a0a" : "#fef2f2" }}>
                            <WarningAmberRounded sx={{ color: "#dc2626", fontSize: 20, mt: 0.3, flexShrink: 0 }} />
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#fca5a5" : "#991b1b", lineHeight: 1.7 }}>
                              {w}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* ── Struggling Topics ────────────────────────────── */}
              {aiAnalysis.analysis.strugglingTopics?.length > 0 && (
                <Card elevation={0} sx={{ border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                      <Psychology sx={{ color: "#7c3aed", fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                        المواضيع التي يعاني منها الطلاب
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {aiAnalysis.analysis.strugglingTopics.map((t, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Paper elevation={0} sx={{ p: 2, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#0f172a" : "#faf5ff", borderRadius: 2, height: "100%" }}>
                            <Typography variant="subtitle2" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: "#7c3aed", mb: 1 }}>
                              📖 {t.topic}
                            </Typography>
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#cbd5e1" : "#475569", mb: 1.5, lineHeight: 1.7 }}>
                              {t.analysis}
                            </Typography>
                            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: darkMode ? "#1e293b" : "#ede9fe" }}>
                              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#a5b4fc" : "#6d28d9", fontWeight: 700 }}>
                                💡 توصية: {t.recommendation}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* ── Suggestions Grid ─────────────────────────────── */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <AutoGraph sx={{ color: "#2563eb", fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                          تحسين الأداء
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {(aiAnalysis.analysis.performanceSuggestions || []).map((s, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1, p: 1.5, borderRadius: 2, bgcolor: darkMode ? "#172554" : "#eff6ff" }}>
                            <TipsAndUpdates sx={{ color: "#2563eb", fontSize: 20, flexShrink: 0 }} />
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#93c5fd" : "#1e40af", lineHeight: 1.7 }}>
                              {s}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card elevation={0} sx={{ height: "100%", border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <Speed sx={{ color: "#f59e0b", fontSize: 28 }} />
                        <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                          استراتيجيات التفاعل
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {(aiAnalysis.analysis.engagementStrategies || []).map((s, i) => (
                          <Box key={i} sx={{ display: "flex", gap: 1, p: 1.5, borderRadius: 2, bgcolor: darkMode ? "#451a03" : "#fffbeb" }}>
                            <Lightbulb sx={{ color: "#f59e0b", fontSize: 20, flexShrink: 0 }} />
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#fde68a" : "#92400e", lineHeight: 1.7 }}>
                              {s}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* ── Teaching Tips ────────────────────────────────── */}
              {aiAnalysis.analysis.teachingTips?.length > 0 && (
                <Card elevation={0} sx={{ border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                      <FormatQuote sx={{ color: "#059669", fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                        نصائح تدريسية من خبير بخبرة 60 عامًا
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      {aiAnalysis.analysis.teachingTips.map((t, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#0f172a" : "#f0fdf4", borderRadius: 2, height: "100%", position: "relative" }}>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: "#059669", fontWeight: 700, display: "block", mb: 0.5 }}>
                              نصيحة #{i + 1}
                            </Typography>
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#bbf7d0" : "#065f46", fontWeight: 600, mb: 1, lineHeight: 1.7 }}>
                              {t.tip}
                            </Typography>
                            {t.context && (
                              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#6ee7b7" : "#047857", display: "block", fontStyle: "italic" }}>
                                — {t.context}
                              </Typography>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* ── Recommended Actions ──────────────────────────── */}
              {aiAnalysis.analysis.recommendedActions?.length > 0 && (
                <Card elevation={0} sx={{ border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                      <Assignment sx={{ color: "#dc2626", fontSize: 28 }} />
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                        الإجراءات المقترحة
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            {["الإجراء", "الأولوية", "الأثر المتوقع"].map(h => (
                              <TableCell key={h} align="right" sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {aiAnalysis.analysis.recommendedActions.map((a, i) => (
                            <TableRow key={i} sx={{ "&:hover": { bgcolor: darkMode ? "#0f172a" : "#f9fafb" } }}>
                              <TableCell sx={{ fontFamily: "Cairo, sans-serif", color: darkMode ? "#e2e8f0" : "#334155" }}>{a.action}</TableCell>
                              <TableCell>
                                <Chip
                                  label={a.priority}
                                  size="small"
                                  sx={{
                                    fontFamily: "Cairo, sans-serif",
                                    fontWeight: 700,
                                    bgcolor:
                                      a.priority === "عالي" ? "#fef2f2"
                                      : a.priority === "متوسط" ? "#fffbeb"
                                      : "#f0fdf4",
                                    color:
                                      a.priority === "عالي" ? "#dc2626"
                                      : a.priority === "متوسط" ? "#d97706"
                                      : "#059669",
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontFamily: "Cairo, sans-serif", color: darkMode ? "#94a3b8" : "#64748b" }}>{a.expectedImpact}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>

        {teacherRating && (
          <Card
            elevation={0}
            sx={{
              mt: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}>
                تقييمات الطلاب
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                  {teacherRating.averageRating?.toFixed(1) || 0}
                </Typography>
                <Box>
                  <Rating value={teacherRating.averageRating || 0} precision={0.5} readOnly sx={{ color: "#fbbf24" }} />
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", display: "block" }}>
                    ({teacherRating.totalRatings || 0} تقييم)
                  </Typography>
                </Box>
              </Box>
              {teacherRating.reviews?.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>
                    آخر التقييمات
                  </Typography>
                  {teacherRating.reviews.slice(0, 5).map((review, i) => (
                    <Paper
                      key={i}
                      sx={{
                        p: 2,
                        border: "1px solid",
                        borderColor: darkMode ? "#334155" : "#e5e7eb",
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                          {review.studentName}
                        </Typography>
                        <Rating value={review.rating} readOnly size="small" sx={{ color: "#fbbf24" }} />
                      </Box>
                      {review.comment && (
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          {review.comment}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default Analytics;