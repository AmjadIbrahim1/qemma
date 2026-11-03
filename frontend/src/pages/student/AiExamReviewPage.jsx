import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useTheme } from "../../hooks/useTheme";
import examsService from "../../services/exams.service";

const getGradeColor = (score) => {
  if (score >= 90) return "#059669";
  if (score >= 80) return "#2563eb";
  if (score >= 70) return "#7c3aed";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
};

const AiExamReviewPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewData, setReviewData] = useState(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await examsService.getAiExamReview(examId);
        const data = response?.data?.data;
        if (data?.questions) {
          setReviewData(data);
        } else {
          setError("لم يتم العثور على بيانات الاختبار.");
        }
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "فشل تحميل المراجعة";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [examId]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={56} thickness={4} sx={{ color: "#7c3aed" }} />
          <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? "#94a3b8" : "#64748b" }}>
            جاري تحميل المراجعة...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <ErrorIcon sx={{ fontSize: 64, color: "#ef4444", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}>
            تعذر تحميل المراجعة
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

  if (!reviewData) return null;

  const scorePct = reviewData.totalMarks > 0
    ? Math.round((reviewData.score / reviewData.totalMarks) * 100)
    : 0;
  const gradeColor = getGradeColor(scorePct);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", pb: 4 }}>
      <Box sx={{
        background: reviewData.passed
          ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
          : "linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)",
        color: "white", py: 4, px: 2,
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <IconButton onClick={() => navigate("/exams")}
              sx={{ color: "white", bgcolor: "rgba(255,255,255,0.1)" }}>
              <ArrowForwardIcon />
            </IconButton>
            <QuizIcon sx={{ fontSize: 32 }} />
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
              مراجعة الاختبار
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Box sx={{ fontSize: 48, mb: 1 }}>{reviewData.passed ? "🎉" : "😔"}</Box>
            <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif">
              {reviewData.passed ? "مبروك! لقد نجحت 🎉" : "لم تحقق الدرجة المطلوبة"}
            </Typography>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mt: 1 }}>
              {reviewData.subject} - {reviewData.chapter}
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.7 }}>
              {reviewData.grade} • {reviewData.difficulty}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -3, position: "relative", zIndex: 2 }}>
        <Card elevation={0} sx={{
          mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
          bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3,
        }}>
          <CardContent sx={{ p: 3, textAlign: "center" }}>
            <Box sx={{
              width: 120, height: 120, borderRadius: "50%", bgcolor: `${gradeColor}15`,
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", mx: "auto", mb: 1,
            }}>
              <Typography variant="h3" fontWeight={900} sx={{ color: gradeColor, lineHeight: 1 }}>
                {Math.round(reviewData.score)}
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                من {reviewData.totalMarks}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
              sx={{ color: gradeColor, mb: 1 }}>
              {scorePct}%
            </Typography>
            <Chip
              icon={reviewData.passed ? <CheckCircleIcon /> : <CancelIcon />}
              label={reviewData.passed ? "ناجح ✓" : "لم تنجح"}
              sx={{
                fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 14,
                bgcolor: reviewData.passed ? "#dcfce7" : "#fef3c7",
                color: reviewData.passed ? "#059669" : "#f59e0b", py: 2, px: 1,
              }}
            />
          </CardContent>
        </Card>

        <Card elevation={0} sx={{
          border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb",
          bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3, mb: 3,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}>
              جميع الأسئلة مع الإجابات
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {reviewData.questions.map((q, i) => {
                const options = Array.isArray(q.options) ? q.options : [];
                return (
                  <Card key={q.id} elevation={0} sx={{
                    border: "1px solid",
                    borderColor: q.isCorrect
                      ? darkMode ? "#064e3b" : "#dcfce7"
                      : darkMode ? "#450a0a" : "#fef2f2",
                    bgcolor: q.isCorrect
                      ? darkMode ? "#064e3b10" : "#f0fdf4"
                      : darkMode ? "#450a0a10" : "#fef2f2",
                    borderRadius: 2,
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                        <Chip label={`سؤال ${i + 1}`} size="small" sx={{
                          fontFamily: "Cairo, sans-serif", fontWeight: 600,
                          bgcolor: q.isCorrect ? "#dcfce7" : "#fef3c7",
                          color: q.isCorrect ? "#059669" : "#f59e0b",
                        }} />
                        <Chip label={`${q.marks} درجة`} size="small" variant="outlined" sx={{
                          fontFamily: "Cairo, sans-serif",
                          borderColor: darkMode ? "#475569" : "#e5e7eb",
                          color: darkMode ? "#94a3b8" : "#64748b",
                        }} />
                        <Box sx={{ flex: 1 }} />
                        {q.isCorrect !== null && (
                          q.isCorrect
                            ? <CheckCircleIcon sx={{ color: "#059669", fontSize: 24 }} />
                            : <CancelIcon sx={{ color: "#ef4444", fontSize: 24 }} />
                        )}
                      </Box>

                      <Typography variant="body1" fontWeight={600} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2, lineHeight: 1.8 }}>
                        {q.questionText}
                      </Typography>

                      {options.length > 0 && (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {options.map((opt, oi) => {
                            const isCorrectAnswer = opt === q.correctAnswer;
                            const isStudentAnswer = opt === q.studentAnswer;
                            let bgColor = "transparent";
                            let borderColor = darkMode ? "#334155" : "#e5e7eb";
                            let textColor = darkMode ? "#cbd5e1" : "#475569";

                            if (isCorrectAnswer) {
                              bgColor = darkMode ? "#064e3b" : "#dcfce7";
                              borderColor = "#059669";
                              textColor = darkMode ? "#f1f5f9" : "#065f46";
                            } else if (isStudentAnswer && !q.isCorrect) {
                              bgColor = darkMode ? "#450a0a" : "#fef2f2";
                              borderColor = "#ef4444";
                              textColor = darkMode ? "#f1f5f9" : "#991b1b";
                            }

                            return (
                              <Box key={oi} sx={{
                                p: 1.5, borderRadius: 1.5, border: "2px solid",
                                bgcolor: bgColor, borderColor,
                                display: "flex", alignItems: "center", gap: 1.5,
                              }}>
                                {isCorrectAnswer && <CheckCircleIcon sx={{ color: "#059669", fontSize: 20 }} />}
                                {isStudentAnswer && !q.isCorrect && <CancelIcon sx={{ color: "#ef4444", fontSize: 20 }} />}
                                <Typography variant="body2" fontFamily="Cairo, sans-serif"
                                  sx={{ color: textColor, flex: 1 }}>
                                  {opt}
                                </Typography>
                                {isCorrectAnswer && (
                                  <Chip label="الإجابة الصحيحة" size="small" sx={{
                                    fontFamily: "Cairo, sans-serif", fontWeight: 600, fontSize: 10,
                                    bgcolor: "#059669", color: "white",
                                  }} />
                                )}
                                {isStudentAnswer && !q.isCorrect && (
                                  <Chip label="إجابتك" size="small" sx={{
                                    fontFamily: "Cairo, sans-serif", fontWeight: 600, fontSize: 10,
                                    bgcolor: "#ef4444", color: "white",
                                  }} />
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="contained" onClick={() => navigate("/exams")}
            startIcon={<VisibilityIcon />} sx={{
              background: "linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)",
              fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, px: 4, py: 1.5,
            }}>
            العودة للاختبارات
          </Button>
          <Button variant="outlined" onClick={() => navigate("/exams")} sx={{
            fontFamily: "Cairo, sans-serif", fontWeight: 600, borderRadius: 2, px: 4, py: 1.5,
            borderColor: darkMode ? "#475569" : "#e5e7eb",
            color: darkMode ? "#94a3b8" : "#64748b",
          }}>
            إنشاء اختبار جديد
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default AiExamReviewPage;
