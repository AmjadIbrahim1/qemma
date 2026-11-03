// frontend/src/pages/student/TakeExamPage.jsx
// ✅ Allows students to take an exam, submit answers, and see results.
//    Supports auto-grading for MCQ/True-False and notes pending essay review.

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  CircularProgress,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  AccessTime as AccessTimeIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  School as SchoolIcon,
  Send as SendIcon,
  EmojiEvents as EmojiEventsIcon,
  PendingActions as PendingIcon,
} from "@mui/icons-material";
import { useTheme } from "../../hooks/useTheme";
import examsService from "../../services/exams.service";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const QUESTION_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#db2777",
  "#f59e0b",
  "#0891b2",
];

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const getGradeColor = (score) => {
  if (score >= 90) return "#059669";
  if (score >= 80) return "#2563eb";
  if (score >= 70) return "#7c3aed";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const TakeExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  // Core states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examData, setExamData] = useState(null); // { exam, questions, attemptId }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // submission result
  const [activeQ, setActiveQ] = useState(0); // current question index
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(null); // seconds
  const timerRef = useRef(null);

  // ── Fetch exam data ────────────────────────────────────────────────
  const fetchExam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await examsService.startExam(examId);
      const data = response?.data?.data ?? response?.data;
      setExamData(data);
      // Initialize answers from existing attempt if any
      setAnswers({});
      // Set timer based on duration
      if (data?.exam?.durationMinutes) {
        setTimeLeft(data.exam.durationMinutes * 60);
      }
    } catch (err) {
      console.error("Failed to start exam:", err);
      const msg =
        err.response?.data?.message || err.message || "فشل تحميل الاختبار";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

  // ── Timer countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, result]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && examData && !result && !submitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (submitting || !examData) return;
    setSubmitting(true);
    try {
      await examsService.submitExamAttempt(examId, answers);
      setSuccessDialogOpen(true);
    } catch (err) {
      console.error("Submit failed:", err);
      setError(
        err.response?.data?.message || err.message || "فشل تقديم الاختبار",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmSubmitOpen(true);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const questions = examData?.questions ?? [];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;
  const progressPct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
  const timerPct = examData?.exam?.durationMinutes
    ? Math.round((timeLeft / (examData.exam.durationMinutes * 60)) * 100)
    : 100;

  const isTimerWarning = timeLeft !== null && timeLeft <= 300; // 5 min
  const isTimerCritical = timeLeft !== null && timeLeft <= 60; // 1 min

  // ── Results View ─────────────────────────────────────────────────
  if (result) {
    return (
      <ResultView
        result={result}
        examData={examData}
        darkMode={darkMode}
        navigate={navigate}
      />
    );
  }

  // ── Error / Not Found ────────────────────────────────────────────
  if (!loading && error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 64, color: "#ef4444", mb: 2 }} />
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}
          >
            تعذر تحميل الاختبار
          </Typography>
          <Typography
            variant="body1"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 3 }}
          >
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/student/exams")}
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            العودة للاختبارات
          </Button>
        </Container>
      </Box>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────
  if (loading || !examData) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={56} thickness={4} sx={{ color: "#7c3aed" }} />
          <Typography
            variant="h6"
            fontFamily="Cairo, sans-serif"
            sx={{ mt: 2, color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            جاري تحميل الاختبار...
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Main Exam View ──────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
      {/* ═══ HEADER ════════════════════════════════════════════════ */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
          color: "white",
          py: 2,
          px: 2,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <IconButton
              onClick={() => {
                if (
                  window.confirm(
                    "هل تريد الخروج من الاختبار؟ سيتم فقدان التقدم.",
                  )
                ) {
                  navigate("/student/exams");
                }
              }}
              sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <QuizIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h6"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
              >
                {examData.exam.title}
              </Typography>
              {examData.exam.courseTitle && (
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ opacity: 0.8 }}
                >
                  <SchoolIcon
                    sx={{ fontSize: 14, verticalAlign: "middle", mr: 0.5 }}
                  />
                  {examData.exam.courseTitle}
                </Typography>
              )}
            </Box>

            {/* Timer */}
            {timeLeft !== null && (
              <Box sx={{ textAlign: "center", minWidth: 100 }}>
                <AccessTimeIcon
                  sx={{ fontSize: 20, verticalAlign: "middle", mr: 0.5 }}
                />
                <Typography
                  variant="h5"
                  fontWeight={900}
                  fontFamily="monospace"
                  sx={{
                    color: isTimerCritical
                      ? "#fca5a5"
                      : isTimerWarning
                        ? "#fbbf24"
                        : "white",
                    display: "inline",
                  }}
                >
                  {formatTime(timeLeft)}
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  fontFamily="Cairo, sans-serif"
                  sx={{ opacity: 0.8 }}
                >
                  الوقت المتبقي
                </Typography>
              </Box>
            )}
          </Box>

          {/* Progress bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LinearProgress
              variant="determinate"
              value={timerPct}
              sx={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.2)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: isTimerCritical
                    ? "#ef4444"
                    : isTimerWarning
                      ? "#f59e0b"
                      : "#34d399",
                  borderRadius: 3,
                },
              }}
            />
            <Typography
              variant="caption"
              fontFamily="Cairo, sans-serif"
              sx={{ whiteSpace: "nowrap" }}
            >
              {answered} / {totalQ} تمت الإجابة
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* ═══ Question Navigation Sidebar ═══════════════════════ */}
          <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
                position: { md: "sticky" },
                top: { md: 100 },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                >
                  قائمة الأسئلة
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {questions.map((q, i) => {
                    const isAnswered =
                      answers[q.id] !== undefined &&
                      answers[q.id] !== null &&
                      answers[q.id] !== "";
                    const isActive = i === activeQ;
                    return (
                      <Box
                        key={q.id}
                        onClick={() => setActiveQ(i)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 14,
                          fontFamily: "Cairo, sans-serif",
                          bgcolor: isActive
                            ? "#7c3aed"
                            : isAnswered
                              ? "#059669"
                              : darkMode
                                ? "#334155"
                                : "#f1f5f9",
                          color:
                            isActive || isAnswered
                              ? "white"
                              : darkMode
                                ? "#94a3b8"
                                : "#64748b",
                          transition: "all 0.2s",
                          "&:hover": { transform: "scale(1.1)", boxShadow: 1 },
                        }}
                      >
                        {i + 1}
                      </Box>
                    );
                  })}
                </Box>

                <Divider
                  sx={{ my: 2, borderColor: darkMode ? "#334155" : "#e5e7eb" }}
                />

                {/* Legend */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 0.5,
                        bgcolor: "#059669",
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      تمت الإجابة
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 0.5,
                        bgcolor: "#7c3aed",
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      السؤال الحالي
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 0.5,
                        bgcolor: darkMode ? "#334155" : "#f1f5f9",
                      }}
                    />
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      لم تُجب بعد
                    </Typography>
                  </Box>
                </Box>

                {/* Submit button */}
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleConfirmSubmit}
                  disabled={submitting}
                  sx={{
                    mt: 3,
                    background:
                      "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    borderRadius: 2,
                    py: 1.5,
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #047857 0%, #059669 100%)",
                    },
                    "&.Mui-disabled": {
                      bgcolor: darkMode ? "#334155" : "#e5e7eb",
                    },
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "تقديم الاختبار"
                  )}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* ═══ Questions Area ══════════════════════════════════ */}
          <Box sx={{ flex: 1 }}>
            {questions.map((q, i) => {
              const color = QUESTION_COLORS[i % QUESTION_COLORS.length];
              const qType = (q.type || "").toLowerCase();
              const isMCQorTF = [
                "multiple-choice",
                "true-false",
                "true/false",
                "mcq",
              ].includes(qType);
              const isEssay = qType === "essay";
              const isCurrent = i === activeQ;

              return (
                <Box
                  key={q.id}
                  id={`q-${q.id}`}
                  sx={{ display: isCurrent ? "block" : "none" }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 3,
                      borderTop: `4px solid ${color}`,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Question header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={`سؤال ${i + 1} من ${totalQ}`}
                          size="small"
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 600,
                            bgcolor: `${color}15`,
                            color,
                          }}
                        />
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Chip
                            label={
                              q.type === "true-false" || q.type === "true/false"
                                ? "صح/خطأ"
                                : q.type === "essay"
                                  ? "مقالي"
                                  : "اختيار من متعدد"
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              borderColor: darkMode ? "#475569" : "#e5e7eb",
                              color: darkMode ? "#94a3b8" : "#64748b",
                            }}
                          />
                          <Chip
                            label={`${q.marks} درجة`}
                            size="small"
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 600,
                              bgcolor: "#fef3c7",
                              color: "#f59e0b",
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Question text */}
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        fontFamily="Cairo, sans-serif"
                        sx={{
                          color: darkMode ? "#f1f5f9" : "#1e293b",
                          mb: 3,
                          lineHeight: 1.8,
                        }}
                      >
                        {q.questionText}
                      </Typography>

                      {/* Answer area */}
                      {isMCQorTF && q.options && q.options.length > 0 && (
                        <RadioGroup
                          value={answers[q.id] ?? ""}
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1.5,
                            }}
                          >
                            {q.options.map((option, oi) => {
                              const isSelected = answers[q.id] === option;
                              return (
                                <Card
                                  key={oi}
                                  elevation={0}
                                  onClick={() =>
                                    handleAnswerChange(q.id, option)
                                  }
                                  sx={{
                                    border: "2px solid",
                                    borderColor: isSelected
                                      ? color
                                      : darkMode
                                        ? "#334155"
                                        : "#e5e7eb",
                                    bgcolor: isSelected
                                      ? `${color}08`
                                      : "transparent",
                                    borderRadius: 2,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    "&:hover": {
                                      borderColor: color,
                                      bgcolor: `${color}05`,
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{
                                      py: 1.5,
                                      px: 2,
                                      "&:last-child": { pb: 1.5 },
                                    }}
                                  >
                                    <FormControlLabel
                                      value={option}
                                      control={
                                        <Radio
                                          sx={{
                                            color,
                                            "&.Mui-checked": { color },
                                          }}
                                        />
                                      }
                                      label={
                                        <Typography
                                          fontFamily="Cairo, sans-serif"
                                          sx={{
                                            color: darkMode
                                              ? "#e2e8f0"
                                              : "#334155",
                                          }}
                                        >
                                          {option}
                                        </Typography>
                                      }
                                      sx={{ width: "100%", m: 0 }}
                                    />
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Box>
                        </RadioGroup>
                      )}

                      {isEssay && (
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          placeholder="اكتب إجابتك هنا..."
                          value={answers[q.id] ?? ""}
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                              borderRadius: 2,
                              fontFamily: "Cairo, sans-serif",
                              color: darkMode ? "#e2e8f0" : "#334155",
                            },
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Navigation buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 3,
                    }}
                  >
                    <Button
                      variant="outlined"
                      disabled={i === 0}
                      onClick={() => setActiveQ(i - 1)}
                      startIcon={<ArrowBackIcon />}
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 600,
                        borderRadius: 2,
                        borderColor: darkMode ? "#475569" : "#e5e7eb",
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      السابق
                    </Button>

                    {i < totalQ - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => setActiveQ(i + 1)}
                        sx={{
                          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      >
                        التالي
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleConfirmSubmit}
                        disabled={submitting}
                        startIcon={<SendIcon />}
                        sx={{
                          background:
                            "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 700,
                          borderRadius: 2,
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #047857 0%, #059669 100%)",
                          },
                        }}
                      >
                        {submitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "تقديم الاختبار"
                        )}
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Container>

      <Dialog
        open={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
      >
        <DialogTitle sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          تأكيد التقديم
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Cairo, sans-serif" }}>
            هل أنت متأكد من تقديم الاختبار؟ لا يمكنك العودة بعد التقديم.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmSubmitOpen(false)}
            sx={{ fontFamily: "Cairo, sans-serif" }}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => {
              setConfirmSubmitOpen(false);
              handleSubmit();
            }}
            variant="contained"
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            تقديم
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={successDialogOpen} onClose={() => {}}>
        <DialogTitle
          sx={{
            fontFamily: "Cairo, sans-serif",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          تم التسليم بنجاح
        </DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{ fontFamily: "Cairo, sans-serif", textAlign: "center" }}
          >
            تم تسليم الاختبار بنجاح! سيتم الإعلان عن النتائج قريباً
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={() => navigate("/student/dashboard")}
            variant="contained"
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
            }}
          >
            حسناً
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Result View (shown after submission)
// ─────────────────────────────────────────────────────────────────────────────

const ResultView = ({ result, examData, darkMode, navigate }) => {
  const scorePct =
    result.totalMarks > 0
      ? Math.round((result.score / result.totalMarks) * 100)
      : 0;
  const gradeColor = getGradeColor(scorePct);
  const hasPassed = result.isPassed;
  const hasEssays = result.hasEssayQuestions;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
      {/* Header */}
      <Box
        sx={{
          background: hasPassed
            ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
            : "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
          color: "white",
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Box sx={{ fontSize: 64, mb: 2 }}>
            {hasPassed ? "🎉" : hasEssays ? "📝" : "😔"}
          </Box>
          <Typography
            variant="h4"
            fontWeight={900}
            fontFamily="Cairo, sans-serif"
            sx={{ mb: 1 }}
          >
            {hasPassed
              ? "مبروك! لقد نجحت في الاختبار 🎉"
              : hasEssays
                ? "تم تقديم الاختبار بنجاح"
                : "لم تحقق الدرجة المطلوبة"}
          </Typography>
          <Typography
            variant="body1"
            fontFamily="Cairo, sans-serif"
            sx={{ opacity: 0.9 }}
          >
            {examData?.exam?.title}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Score Card */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
            borderRadius: 3,
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                bgcolor: `${gradeColor}15`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <Typography
                variant="h2"
                fontWeight={900}
                sx={{ color: gradeColor, lineHeight: 1 }}
              >
                {Math.round(result.score)}
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                من {result.totalMarks}
              </Typography>
            </Box>

            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily="Cairo, sans-serif"
              sx={{ color: gradeColor, mb: 1 }}
            >
              {scorePct}%
            </Typography>

            {/* Pass / Fail badge */}
            {hasPassed !== null && (
              <Chip
                icon={hasPassed ? <CheckCircleIcon /> : <CancelIcon />}
                label={hasPassed ? "ناجح ✓" : "لم تنجح"}
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  bgcolor: hasPassed ? "#dcfce7" : "#fef3c7",
                  color: hasPassed ? "#059669" : "#f59e0b",
                  py: 2,
                  px: 1,
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Essay pending notification */}
        {hasEssays && (
          <Alert
            severity="warning"
            icon={<PendingIcon />}
            sx={{
              borderRadius: 3,
              fontFamily: "Cairo, sans-serif",
              mb: 3,
              "& .MuiAlert-message": { fontFamily: "Cairo, sans-serif" },
            }}
          >
            <Typography
              variant="body1"
              fontWeight={700}
              fontFamily="Cairo, sans-serif"
              sx={{ mb: 0.5 }}
            >
              الأسئلة المقالية لم تُصحح بعد
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              تم تصحيح {result.autoTotal} درجة من الأسئلة التلقائية. الأسئلة
              المقالية ({result.essayCount}) تحتاج إلى مراجعة من المدرس. ستظهر
              النتيجة النهائية بعد التصحيح.
            </Typography>
          </Alert>
        )}

        {/* Score Breakdown */}
        {result.gradedDetails && result.gradedDetails.length > 0 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
              >
                تفاصيل الإجابات
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {result.gradedDetails.map((detail, i) => {
                  const qText =
                    examData?.questions?.find((q) => q.id === detail.questionId)
                      ?.questionText || `سؤال ${i + 1}`;
                  const isCorrect = detail.correct === true;
                  const isEssayPending = detail.pending;

                  return (
                    <Box
                      key={detail.questionId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: isEssayPending
                          ? darkMode
                            ? "#1e3a5f"
                            : "#eff6ff"
                          : isCorrect
                            ? darkMode
                              ? "#064e3b"
                              : "#f0fdf4"
                            : darkMode
                              ? "#450a0a"
                              : "#fef2f2",
                      }}
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        {isEssayPending ? (
                          <PendingIcon
                            sx={{ color: "#2563eb", fontSize: 28 }}
                          />
                        ) : isCorrect ? (
                          <CheckCircleIcon
                            sx={{ color: "#059669", fontSize: 28 }}
                          />
                        ) : (
                          <CancelIcon sx={{ color: "#ef4444", fontSize: 28 }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#e2e8f0" : "#334155",
                            mb: 0.25,
                          }}
                          noWrap
                        >
                          {qText.length > 60
                            ? qText.substring(0, 60) + "..."
                            : qText}
                        </Typography>
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                        >
                          {isEssayPending
                            ? "في انتظار التصحيح"
                            : isCorrect
                              ? `✓ الإجابة صحيحة (${detail.marks}/${detail.maxMarks})`
                              : `✗ إجابة خاطئة (0/${detail.maxMarks})`}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          color: isEssayPending
                            ? "#2563eb"
                            : isCorrect
                              ? "#059669"
                              : "#ef4444",
                        }}
                      >
                        {isEssayPending
                          ? "—"
                          : `${detail.marks}/${detail.maxMarks}`}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/student/exams")}
            startIcon={<QuizIcon />}
            sx={{
              background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
              py: 1.5,
            }}
          >
            العودة للاختبارات
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/student/dashboard")}
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 600,
              borderRadius: 2,
              px: 4,
              py: 1.5,
              borderColor: darkMode ? "#475569" : "#e5e7eb",
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            الرئيسية
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default TakeExamPage;
