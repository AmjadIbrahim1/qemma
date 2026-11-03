import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../hooks/useTheme";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  HourglassEmpty,
  People,
  Close,
  Refresh,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const GradeExams = () => {
  const { darkMode } = useTheme();
  const isDark = darkMode;

  // ── Filters & UI State ──────────────────────────────────────────
  const [selectedExam, setSelectedExam]     = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTab, setSelectedTab]       = useState(0);
  const [page, setPage]                     = useState(1);
  const LIMIT                               = 20;

  // ── Data State ──────────────────────────────────────────────────
  const [attempts, setAttempts]         = useState([]);
  const [pagination, setPagination]     = useState({ total: 0, totalPages: 1 });
  const [stats, setStats]               = useState([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError]               = useState(null);

  // ── View Dialog State ───────────────────────────────────────────
  const [viewDialogOpen, setViewDialogOpen]   = useState(false);
  const [currentAttempt, setCurrentAttempt]   = useState(null);
  const [loadingAttempt, setLoadingAttempt]   = useState(false);

  // ── Theme helpers ───────────────────────────────────────────────
  const themeStyles = {
    bg:     isDark ? "#111827" : "#f9fafb",
    paper:  isDark ? "#1f2937" : "#ffffff",
    text:   isDark ? "#f3f4f6" : "#111827",
    border: isDark ? "#374151" : "#e5e7eb",
  };

  // ── Derived values from stats ───────────────────────────────────
  const totalPending = stats.reduce((sum, s) => sum + (s.pending || 0), 0);
  const totalGraded  = stats.reduce((sum, s) => sum + (s.graded  || 0), 0);
  const totalExams   = stats.length;
  const totalStudents = attempts.length > 0
    ? pagination.total
    : stats.reduce((sum, s) => sum + (s.submitted || 0), 0);

  const chartData = [
    { name: "قيد التصحيح", value: totalPending, color: "#f59e0b" },
    { name: "تم التصحيح",  value: totalGraded,  color: "#10b981" },
  ];

  // ── Unique exams list for filter dropdown ───────────────────────
  const examOptions = stats.map((s) => ({ id: s.examId, title: s.title }));

  // ── Fetch stats (sidebar summary) ──────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("/attempts/stats");
      setStats(res.data?.data || []);
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch attempts list ─────────────────────────────────────────
  const fetchAttempts = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (selectedExam)                        params.set("examId", selectedExam);
      if (selectedStatus !== "all")            params.set("status", selectedStatus);

      const res = await api.get(`/attempts?${params.toString()}`);
      const data = res.data?.data || {};
      setAttempts(data.attempts || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      setError("تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى.");
      console.error("Attempts fetch error:", err);
    } finally {
      setLoadingList(false);
    }
  }, [selectedExam, selectedStatus, page]);

  // ── Initial load ────────────────────────────────────────────────
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAttempts(); }, [fetchAttempts]);

  // ── Sync tab → status filter ────────────────────────────────────
  const handleTabChange = (tabIndex) => {
    setSelectedTab(tabIndex);
    setSelectedStatus(tabIndex === 0 ? "pending" : "graded");
    setPage(1);
  };

  // ── Open attempt detail dialog ──────────────────────────────────
  const handleOpenView = async (attemptId) => {
    setViewDialogOpen(true);
    setCurrentAttempt(null);
    setLoadingAttempt(true);
    try {
      const res = await api.get(`/attempts/${attemptId}`);
      setCurrentAttempt(res.data?.data || null);
    } catch (err) {
      console.error("Attempt detail fetch error:", err);
    } finally {
      setLoadingAttempt(false);
    }
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setCurrentAttempt(null);
  };

  // ── Auto-grade handler ──────────────────────────────────────────
  const handleAutoGrade = async (attemptId) => {
    try {
      await api.post(`/attempts/${attemptId}/auto-grade`);
      fetchAttempts();
      fetchStats();
    } catch (err) {
      console.error("Auto-grade error:", err);
    }
  };

  const getPercentage = (score, maxScore) =>
    maxScore ? ((score / maxScore) * 100).toFixed(0) : 0;

  // ── Helpers for rendering attempt row ──────────────────────────
  const getStudentName   = (a) => a?.student?.user?.name   || "—";
  const getStudentAvatar = (a) => a?.student?.user?.name?.[0] || "؟";
  const getExamTitle     = (a) => a?.exam?.title            || "—";
  const getScore         = (a) =>
    a?.score != null ? `${a.score}/${a.exam?.totalMarks ?? "?"}` : "—";
  const getDate          = (a) =>
    a?.submittedAt ? new Date(a.submittedAt).toLocaleString("ar-EG") : "—";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        bgcolor: themeStyles.bg,
        color: themeStyles.text,
        direction: "rtl",
        fontFamily: "Cairo, sans-serif",
      }}
    >
      <Container maxWidth="lg">

        {/* ── Header ─────────────────────────────────────────────── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Button
            startIcon={<ArrowBack sx={{ ml: 1 }} />}
            onClick={() => window.history.back()}
            sx={{ color: themeStyles.text, fontWeight: "bold" }}
          >
            العودة للوحة التحكم
          </Button>
          <IconButton onClick={() => { fetchAttempts(); fetchStats(); }} sx={{ color: themeStyles.text }}>
            <Refresh />
          </IconButton>
        </Box>

        {/* ── Title + Filters ────────────────────────────────────── */}
        <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "success.main", borderRadius: 2 }}>📝</Avatar>
            <Box>
              <Typography variant="h4" fontWeight={900}>مراجعة الاختبارات</Typography>
              <Typography variant="body2" sx={{ color: isDark ? "gray" : "text.secondary" }}>
                عرض نتائج الطلاب في الاختبارات
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex", gap: 2, justifyContent: { md: "flex-end" } }}>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel sx={{ color: themeStyles.text }}>الاختبار</InputLabel>
              <Select
                value={selectedExam}
                label="الاختبار"
                onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                sx={{ bgcolor: themeStyles.paper, color: themeStyles.text }}
              >
                <MenuItem value="">جميع الاختبارات</MenuItem>
                {examOptions.map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* ── Error Banner ───────────────────────────────────────── */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ── Stats Cards + Chart ────────────────────────────────── */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2}>
              {[
                { title: "قيد التصحيح",    value: totalPending,  icon: <HourglassEmpty />, color: "#f59e0b", bg: isDark ? "rgba(245,158,11,0.1)"  : "#fffbeb" },
                { title: "تم التصحيح",     value: totalGraded,   icon: <CheckCircle />,    color: "#10b981", bg: isDark ? "rgba(16,185,129,0.1)"  : "#ecfdf5" },
                { title: "الاختبارات",     value: totalExams,    icon: <Assignment />,     color: "#3b82f6", bg: isDark ? "rgba(59,130,246,0.1)"   : "#eff6ff" },
                { title: "إجمالي المحاولات", value: totalStudents, icon: <People />,         color: "#8b5cf6", bg: isDark ? "rgba(139,92,246,0.1)"   : "#f5f3ff" },
              ].map((card, i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Card sx={{ bgcolor: themeStyles.paper, border: `1px solid ${themeStyles.border}`, borderRadius: 3 }}>
                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: card.bg, color: card.color, display: "flex" }}>
                        {card.icon}
                      </Box>
                      <Box>
                        {loadingStats
                          ? <CircularProgress size={20} />
                          : <Typography variant="h5" fontWeight={900} color={themeStyles.text}>{card.value}</Typography>
                        }
                        <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ bgcolor: themeStyles.paper, border: `1px solid ${themeStyles.border}`, borderRadius: 3, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: themeStyles.text }}>
                  تحليل الحالة
                </Typography>
                <Box sx={{ height: 150 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#e5e7eb"} />
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <Tooltip cursor={{ fill: "transparent" }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ── Tabs + Table ───────────────────────────────────────── */}
        <Paper sx={{ bgcolor: themeStyles.paper, border: `1px solid ${themeStyles.border}`, borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ display: "flex", borderBottom: `1px solid ${themeStyles.border}` }}>
            {[
              { label: `قيد التصحيح (${totalPending})`, index: 0 },
              { label: `تم التصحيح (${totalGraded})`,   index: 1 },
            ].map((tab) => (
              <Button
                key={tab.index}
                fullWidth
                onClick={() => handleTabChange(tab.index)}
                sx={{
                  py: 2,
                  borderRadius: 0,
                  fontWeight: "bold",
                  borderBottom: selectedTab === tab.index ? "3px solid #3b82f6" : "none",
                  color: selectedTab === tab.index ? "#3b82f6" : "text.secondary",
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? "#111827" : "#f9fafb" }}>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: "bold", color: themeStyles.text }}>الطالب</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold", color: themeStyles.text }}>الاختبار</TableCell>
                  {selectedTab === 1 && (
                    <TableCell align="center" sx={{ fontWeight: "bold", color: themeStyles.text }}>الدرجة</TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: "bold", color: themeStyles.text }}>تاريخ التسليم</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold", color: themeStyles.text }}>
                    {selectedTab === 0 ? "الحالة" : "الإجراء"}
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loadingList ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : attempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
                      <Typography color="text.secondary">لا توجد بيانات لعرضها حالياً</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  attempts.map((attempt) => {
                    const percentage = getPercentage(attempt.score, attempt.exam?.totalMarks);
                    return (
                      <TableRow
                        key={attempt.id}
                        sx={{ "&:hover": { bgcolor: isDark ? "#2d3748" : "#f8fafc" } }}
                      >
                        {/* Student */}
                        <TableCell align="right">
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              src={attempt?.student?.user?.avatar || undefined}
                              sx={{
                                bgcolor: selectedTab === 0 ? "primary.main" : "secondary.main",
                                width: 32,
                                height: 32,
                                fontSize: 14,
                              }}
                            >
                              {getStudentAvatar(attempt)}
                            </Avatar>
                            <Typography variant="body2" fontWeight="bold" color={themeStyles.text}>
                              {getStudentName(attempt)}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Exam */}
                        <TableCell align="right" sx={{ color: "text.secondary" }}>
                          {getExamTitle(attempt)}
                        </TableCell>

                        {/* Score (graded tab only) */}
                        {selectedTab === 1 && (
                          <TableCell align="center">
                            <Chip
                              label={getScore(attempt)}
                              size="small"
                              color={percentage >= 70 ? "success" : "error"}
                              variant="outlined"
                            />
                          </TableCell>
                        )}

                        {/* Date */}
                        <TableCell align="center" sx={{ fontSize: 12, color: "text.secondary" }}>
                          {getDate(attempt)}
                        </TableCell>

                        {/* Action */}
                        <TableCell align="center">
                          {selectedTab === 0 ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleAutoGrade(attempt.id)}
                              sx={{ borderRadius: 2, fontSize: 11 }}
                            >
                              تصحيح تلقائي
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenView(attempt.id)}
                              sx={{ borderRadius: 2 }}
                            >
                              عرض
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Pagination ──────────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <Pagination
                count={pagination.totalPages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
                dir="ltr"
              />
            </Box>
          )}
        </Paper>
      </Container>

      {/* ── View Attempt Dialog ─────────────────────────────────── */}
      <Dialog open={viewDialogOpen} onClose={handleCloseView} fullWidth maxWidth="md" dir="rtl">
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: themeStyles.paper,
            color: themeStyles.text,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {currentAttempt
              ? `${currentAttempt?.student?.user?.name} — ${currentAttempt?.exam?.title}`
              : "تفاصيل المحاولة"}
          </Typography>
          <IconButton onClick={handleCloseView} sx={{ color: themeStyles.text }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ bgcolor: themeStyles.paper }}>
          {loadingAttempt ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !currentAttempt ? (
            <Typography color="text.secondary">تعذّر تحميل تفاصيل المحاولة</Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

              {/* Summary row */}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
                <Chip
                  label={`الدرجة: ${currentAttempt.score ?? "—"} / ${currentAttempt.exam?.totalMarks ?? "?"}`}
                  color={currentAttempt.isPassed ? "success" : "error"}
                />
                <Chip
                  label={currentAttempt.isPassed ? "ناجح" : "راسب"}
                  variant="outlined"
                  color={currentAttempt.isPassed ? "success" : "error"}
                />
              </Box>

              {/* Questions */}
              {currentAttempt?.exam?.questions?.length > 0 ? (
                currentAttempt.exam.questions.map((question, i) => {
                  const studentAnswer = currentAttempt?.answers?.[question.id];
                  const isCorrect     = studentAnswer === question.correctAnswer;

                  return (
                    <Card
                      key={question.id}
                      variant="outlined"
                      sx={{ bgcolor: isDark ? "#374151" : "#f8fafc", borderColor: themeStyles.border }}
                    >
                      <CardContent>
                        <Typography fontWeight="bold" gutterBottom color={themeStyles.text}>
                          سؤال {i + 1}: {question.text || question.questionText}
                        </Typography>

                        {/* MCQ options */}
                        {question.type === "mcq" && Array.isArray(question.options) && (
                          <Box sx={{ mb: 1 }}>
                            {question.options.map((opt, idx) => (
                              <Typography
                                key={idx}
                                variant="body2"
                                sx={{
                                  color: opt === question.correctAnswer ? "#10b981" : themeStyles.text,
                                  fontWeight: opt === studentAnswer ? "bold" : "normal",
                                  textDecoration: opt === studentAnswer ? "underline" : "none",
                                }}
                              >
                                • {opt}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {/* True/False */}
                        {question.type === "true-false" && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              إجابة الطالب: <strong>{studentAnswer ?? "لم يجب"}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              الإجابة الصحيحة: <strong style={{ color: "#10b981" }}>{question.correctAnswer}</strong>
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            الدرجة: {question.marks}
                          </Typography>
                          <Chip
                            label={isCorrect ? "صح" : "خطأ"}
                            size="small"
                            color={isCorrect ? "success" : "error"}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Typography color="text.secondary">لا توجد أسئلة مرتبطة بهذا الاختبار</Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GradeExams;