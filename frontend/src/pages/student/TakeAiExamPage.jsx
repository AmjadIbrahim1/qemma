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
  CircularProgress,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  Divider,
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
  Send as SendIcon,
  WarningAmber as WarningIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import { Slide } from "@mui/material";
import { useTheme } from "../../hooks/useTheme";
import examsService from "../../services/exams.service";

const QUESTION_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#db2777",
  "#f59e0b", "#0891b2",
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

const TakeAiExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeQ, setActiveQ] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

  const [timeLeft, setTimeLeft] = useState(1800);
  const timerRef = useRef(null);

  const fetchExam = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await examsService.getMyAiExams();
      const list = response?.data?.data ?? [];
      const exam = Array.isArray(list) ? list.find(e => e.id === examId) : null;
      if (!exam) {
        setError("الاختبار غير موجود.");
        return;
      }
      if (exam.isCompleted) {
        navigate(`/exams/ai/review/${examId}`);
        return;
      }
      const examDetailRes = await examsService.getAiExamReview(examId);
      const detail = examDetailRes?.data?.data;
      if (detail?.questions) {
        setExamData(detail);
      } else {
        setError("لم يتم تحميل بيانات الاختبار.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "فشل تحميل الاختبار";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [examId, navigate]);

  useEffect(() => {
    fetchExam();
  }, [fetchExam]);

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

  useEffect(() => {
    if (timeLeft === 0 && examData && !result && !submitting) {
      handleSubmit();
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (submitting || !examData) return;
    setSubmitting(true);
    try {
      const response = await examsService.submitAiExam(examId, answers);
      const data = response?.data?.data;
      if (data) {
        setResult(data);
        setSuccessDialogOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "فشل تقديم الاختبار");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setConfirmSubmitOpen(true);
  };

  const questions = examData?.questions ?? [];
  const totalQ = questions.length;
  const answered = Object.keys(answers).length;
  const progressPct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
  const timerPct = timeLeft !== null ? Math.round((timeLeft / 1800) * 100) : 100;
  const isTimerWarning = timeLeft !== null && timeLeft <= 300;
  const isTimerCritical = timeLeft !== null && timeLeft <= 60;

  if (result) {
    const scorePct = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
    const gradeColor = getGradeColor(scorePct);

    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
        <Box sx={{
          background: result.passed
            ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
            : "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
          color: "white", py: 4, px: 2,
        }}>
          <Container maxWidth="md" sx={{ textAlign: "center" }}>
            <Box sx={{ fontSize: 64, mb: 2 }}>{result.passed ? "🎉" : "😔"}</Box>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>
              {result.passed ? "مبروك! لقد نجحت في الاختبار 🎉" : "لم تحقق الدرجة المطلوبة"}
            </Typography>
          </Container>
        </Box>
        <Container maxWidth="md" sx={{ py: 3 }}>
          <Card elevation={0} sx={{
            border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3,
          }}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Box sx={{
                width: 140, height: 140, borderRadius: "50%", bgcolor: `${gradeColor}15`,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", mx: "auto", mb: 2,
              }}>
                <Typography variant="h2" fontWeight={900} sx={{ color: gradeColor, lineHeight: 1 }}>
                  {Math.round(result.score)}
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  من {result.totalMarks}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: gradeColor, mb: 1 }}>
                {scorePct}%
              </Typography>
              <Chip
                icon={result.passed ? <CheckCircleIcon /> : <CancelIcon />}
                label={result.passed ? "ناجح ✓" : "لم تنجح"}
                sx={{
                  fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14,
                  bgcolor: result.passed ? "#dcfce7" : "#fef3c7",
                  color: result.passed ? "#059669" : "#f59e0b", py: 2, px: 1,
                }}
              />
            </CardContent>
          </Card>

          {result.gradedDetails && result.gradedDetails.length > 0 && (
            <Card elevation={0} sx={{
              border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3,
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
                  تفاصيل الإجابات
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {result.gradedDetails.map((detail, i) => (
                    <Box key={detail.questionId} sx={{
                      display: "flex", alignItems: "center", gap: 2, p: 1.5,
                      borderRadius: 2,
                      bgcolor: detail.correct
                        ? darkMode ? "#064e3b" : "#f0fdf4"
                        : darkMode ? "#450a0a" : "#fef2f2",
                    }}>
                      <Box sx={{ flexShrink: 0 }}>
                        {detail.correct
                          ? <CheckCircleIcon sx={{ color: "#059669", fontSize: 28 }} />
                          : <CancelIcon sx={{ color: "#ef4444", fontSize: 28 }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#e2e8f0" : "#334155", mb: 0.25 }} noWrap>
                          {detail.questionText?.length > 60
                            ? detail.questionText.substring(0, 60) + "..."
                            : detail.questionText}
                        </Typography>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          {detail.correct
                            ? `✓ الإجابة صحيحة (${detail.marks}/${detail.maxMarks})`
                            : `✗ إجابة خاطئة (0/${detail.maxMarks})`}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}
                        sx={{ color: detail.correct ? "#059669" : "#ef4444" }}>
                        {detail.correct ? `${detail.marks}/${detail.maxMarks}` : `0/${detail.maxMarks}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" onClick={() => navigate("/exams")}
              startIcon={<QuizIcon />} sx={{
                background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
                fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, px: 4, py: 1.5,
              }}>
              العودة للاختبارات
            </Button>
            <Button variant="outlined" onClick={() => navigate("/student/dashboard")} sx={{
              fontFamily: "Cairo, sans-serif", fontWeight: 600, borderRadius: 2, px: 4, py: 1.5,
              borderColor: darkMode ? "#475569" : "#e5e7eb",
              color: darkMode ? "#94a3b8" : "#64748b",
            }}>
              الرئيسية
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  if (!loading && error) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 64, color: "#ef4444", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}>
            تعذر تحميل الاختبار
          </Typography>
          <Typography variant="body1" fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/exams")} sx={{
            fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
          }}>
            العودة للاختبارات
          </Button>
        </Container>
      </Box>
    );
  }

  if (loading || !examData) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={56} thickness={4} sx={{ color: "#7c3aed" }} />
          <Typography variant="h6" fontFamily="Cairo, sans-serif"
            sx={{ mt: 2, color: darkMode ? "#94a3b8" : "#64748b" }}>
            جاري تحميل الاختبار...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
      <Box sx={{
        background: "linear-gradient(135deg, #db2777 0%, #7c3aed 100%)",
        color: "white", py: 2, px: 2, position: "sticky", top: 0, zIndex: 100,
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <IconButton onClick={() => setExitDialogOpen(true)} sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)" }}>
              <ArrowBackIcon />
            </IconButton>
            <QuizIcon sx={{ fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif">
                {examData.subject} - {examData.chapter}
              </Typography>
              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.8 }}>
                {examData.grade} • {examData.difficulty}
              </Typography>
            </Box>
            {timeLeft !== null && (
              <Box sx={{ textAlign: "center", minWidth: 100 }}>
                <AccessTimeIcon sx={{ fontSize: 20, verticalAlign: "middle", mr: 0.5 }} />
                <Typography variant="h5" fontWeight={900} fontFamily="monospace"
                  sx={{
                    color: isTimerCritical ? "#fca5a5" : isTimerWarning ? "#fbbf24" : "white",
                    display: "inline",
                  }}>
                  {formatTime(timeLeft)}
                </Typography>
                <Typography variant="caption" display="block" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.8 }}>
                  الوقت المتبقي
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <LinearProgress variant="determinate" value={timerPct} sx={{
              flex: 1, height: 6, borderRadius: 3, bgcolor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                bgcolor: isTimerCritical ? "#ef4444" : isTimerWarning ? "#f59e0b" : "#34d399",
                borderRadius: 3,
              },
            }} />
            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ whiteSpace: "nowrap" }}>
              {answered} / {totalQ} تمت الإجابة
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
            <Card elevation={0} sx={{
              border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3,
              position: { md: "sticky" }, top: { md: 100 },
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
                  قائمة الأسئلة
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {questions.map((q, i) => {
                    const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== "";
                    const isActive = i === activeQ;
                    return (
                      <Box key={q.id} onClick={() => setActiveQ(i)} sx={{
                        width: 40, height: 40, borderRadius: 2, display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer",
                        fontWeight: 700, fontSize: 14, fontFamily: "Cairo, sans-serif",
                        bgcolor: isActive ? "#7c3aed" : isAnswered ? "#059669" : darkMode ? "#334155" : "#f1f5f9",
                        color: isActive || isAnswered ? "white" : darkMode ? "#94a3b8" : "#64748b",
                        transition: "all 0.2s",
                        "&:hover": { transform: "scale(1.1)", boxShadow: 1 },
                      }}>
                        {i + 1}
                      </Box>
                    );
                  })}
                </Box>
                <Divider sx={{ my: 2, borderColor: darkMode ? "#334155" : "#e5e7eb" }} />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: "#059669" }} />
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>تمت الإجابة</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: "#7c3aed" }} />
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>السؤال الحالي</Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: darkMode ? "#334155" : "#f1f5f9" }} />
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>لم تُجب بعد</Typography>
                  </Box>
                </Box>
                <Button fullWidth variant="contained" startIcon={<SendIcon />}
                  onClick={handleConfirmSubmit} disabled={submitting} sx={{
                    mt: 3, background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                    fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5,
                    "&:hover": { background: "linear-gradient(135deg, #047857 0%, #059669 100%)" },
                    "&.Mui-disabled": { bgcolor: darkMode ? "#334155" : "#e5e7eb" },
                  }}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : "تقديم الاختبار"}
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            {questions.map((q, i) => {
              const color = QUESTION_COLORS[i % QUESTION_COLORS.length];
              const options = Array.isArray(q.options) ? q.options : [];
              const isCurrent = i === activeQ;

              return (
                <Box key={q.id} sx={{ display: isCurrent ? "block" : "none" }}>
                  <Card elevation={0} sx={{
                    border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3,
                    borderTop: `4px solid ${color}`,
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Chip label={`سؤال ${i + 1} من ${totalQ}`} size="small" sx={{
                          fontFamily: "Cairo, sans-serif", fontWeight: 600,
                          bgcolor: `${color}15`, color,
                        }} />
                        <Chip label={`${q.marks} درجة`} size="small" sx={{
                          fontFamily: "Cairo, sans-serif", fontWeight: 600,
                          bgcolor: "#fef3c7", color: "#f59e0b",
                        }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3, lineHeight: 1.8 }}>
                        {q.questionText}
                      </Typography>
                      {options.length > 0 && (
                        <RadioGroup value={answers[q.id] ?? ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {options.map((option, oi) => {
                              const isSelected = answers[q.id] === option;
                              return (
                                <Card key={oi} elevation={0}
                                  onClick={() => handleAnswerChange(q.id, option)} sx={{
                                    border: "2px solid",
                                    borderColor: isSelected ? color : darkMode ? "#334155" : "#e5e7eb",
                                    bgcolor: isSelected ? `${color}08` : "transparent",
                                    borderRadius: 2, cursor: "pointer", transition: "all 0.2s",
                                    "&:hover": { borderColor: color, bgcolor: `${color}05` },
                                  }}>
                                  <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                                    <FormControlLabel value={option}
                                      control={<Radio sx={{ color, "&.Mui-checked": { color } }} />}
                                      label={<Typography fontFamily="Cairo, sans-serif"
                                        sx={{ color: darkMode ? "#e2e8f0" : "#334155" }}>
                                        {option}
                                      </Typography>}
                                      sx={{ width: "100%", m: 0 }}
                                    />
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Box>
                        </RadioGroup>
                      )}
                    </CardContent>
                  </Card>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                    <Button variant="outlined" disabled={i === 0}
                      onClick={() => setActiveQ(i - 1)} startIcon={<ArrowBackIcon />} sx={{
                        fontFamily: "Cairo, sans-serif", fontWeight: 600, borderRadius: 2,
                        borderColor: darkMode ? "#475569" : "#e5e7eb",
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}>
                      السابق
                    </Button>
                    {i < totalQ - 1 ? (
                      <Button variant="contained" onClick={() => setActiveQ(i + 1)} sx={{
                        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                        fontFamily: "Cairo, sans-serif", fontWeight: 600, borderRadius: 2,
                      }}>
                        التالي
                      </Button>
                    ) : (
                      <Button variant="contained" onClick={handleConfirmSubmit}
                        disabled={submitting} startIcon={<SendIcon />} sx={{
                          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
                          "&:hover": { background: "linear-gradient(135deg, #047857 0%, #059669 100%)" },
                        }}>
                        {submitting ? <CircularProgress size={20} color="inherit" /> : "تقديم الاختبار"}
                      </Button>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Container>

      <Dialog open={exitDialogOpen} onClose={() => setExitDialogOpen(false)}
        TransitionComponent={Slide} TransitionProps={{ direction: "down" }}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 420, width: "90%", overflow: "visible" } }}>
        <Box sx={{ textAlign: "center", pt: 3, position: "relative" }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 1, boxShadow: "0 8px 24px rgba(239,68,68,0.3)",
          }}>
            <WarningIcon sx={{ fontSize: 36, color: "white" }} />
          </Box>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: "radial-gradient(circle at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 70%)",
            pointerEvents: "none", borderRadius: 4 }} />
        </Box>
        <DialogTitle sx={{
          fontFamily: "Cairo, sans-serif", fontWeight: 900, textAlign: "center",
          fontSize: "1.35rem", pt: 1, pb: 0.5,
        }}>
          تأكيد الخروج
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <DialogContentText sx={{
            fontFamily: "Cairo, sans-serif", textAlign: "center",
            fontSize: "0.95rem", lineHeight: 1.7,
          }}>
            هل أنت متأكد من رغبتك في مغادرة الاختبار؟
          </DialogContentText>
          <Box sx={{
            mt: 2, p: 2, borderRadius: 2,
            bgcolor: darkMode ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
            border: "1px solid", borderColor: darkMode ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)",
          }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#fca5a5" : "#dc2626", fontWeight: 600, textAlign: "center" }}>
              <WarningIcon sx={{ fontSize: 18, verticalAlign: "middle", ml: 0.5 }} />
              سيتم فقدان أي تقدم لم تقم بحفظه إذا غادرت الآن.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, justifyContent: "center", flexDirection: { xs: "column", sm: "row" } }}>
          <Button onClick={() => setExitDialogOpen(false)} variant="outlined"
            startIcon={<ArrowBackIcon />} fullWidth={false}
            sx={{
              fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
              px: 3, py: 1.2, minWidth: 140,
              borderColor: darkMode ? "#475569" : "#e5e7eb",
              color: darkMode ? "#f1f5f9" : "#334155",
              "&:hover": { borderColor: darkMode ? "#64748b" : "#cbd5e1" },
            }}>
            استمرار الاختبار
          </Button>
          <Button onClick={() => { setExitDialogOpen(false); navigate("/exams"); }}
            variant="contained" startIcon={<ExitIcon />} fullWidth={false}
            sx={{
              fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
              px: 3, py: 1.2, minWidth: 140,
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              "&:hover": { background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" },
            }}>
            مغادرة الاختبار
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmSubmitOpen} onClose={() => setConfirmSubmitOpen(false)}>
        <DialogTitle sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          تأكيد التقديم
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Cairo, sans-serif" }}>
            هل أنت متأكد من تقديم الاختبار؟ لا يمكنك العودة بعد التقديم.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmitOpen(false)} sx={{ fontFamily: "Cairo, sans-serif" }}>
            إلغاء
          </Button>
          <Button onClick={() => { setConfirmSubmitOpen(false); handleSubmit(); }}
            variant="contained" sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}>
            تقديم
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={successDialogOpen} onClose={() => {}}>
        <DialogTitle sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, textAlign: "center" }}>
          تم التسليم بنجاح
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Cairo, sans-serif", textAlign: "center" }}>
            تم تسليم الاختبار بنجاح! يمكنك مراجعة النتائج الآن.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button onClick={() => setSuccessDialogOpen(false)} variant="contained" sx={{
            fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, px: 4,
          }}>
            حسناً
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeAiExamPage;
