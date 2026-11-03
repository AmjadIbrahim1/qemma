// pages/ExamsPage.jsx
import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  QuizRounded,
  SchoolRounded,
  MenuBookRounded,
  TuneRounded,
  PlayArrowRounded,
  CheckCircleRounded,
  EmojiEventsRounded,
  TimerRounded,
  DescriptionRounded,
  LoginRounded,
  HistoryRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import examsService from "../../services/exams.service";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  pink: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
};

// البيانات
const GRADES = [
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const SUBJECTS = {
  "الصف الأول الثانوي": [
    "الرياضيات",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التاريخ",
    "الجغرافيا",
  ],
  "الصف الثاني الثانوي": [
    "الرياضيات",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التاريخ",
    "الجغرافيا",
    "الفلسفة",
  ],
  "الصف الثالث الثانوي": [
    "الرياضيات",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "اللغة العربية",
    "اللغة الإنجليزية",
    "التاريخ",
    "الجغرافيا",
    "الفلسفة",
    "علم النفس",
  ],
};

const CHAPTERS = {
  "الرياضيات": [
    "الجبر",
    "الهندسة",
    "التفاضل والتكامل",
    "الإحصاء",
    "المثلثات",
  ],
  "الفيزياء": [
    "الميكانيكا",
    "الكهربية",
    "المغناطيسية",
    "الضوء",
    "الصوت",
  ],
  "الكيمياء": [
    "الكيمياء العضوية",
    "الكيمياء غير العضوية",
    "الكيمياء الفيزيائية",
    "الكيمياء التحليلية",
  ],
  "الأحياء": [
    "علم النبات",
    "علم الحيوان",
    "الوراثة",
    "البيئة",
    "التشريح",
  ],
  "اللغة العربية": [
    "النحو",
    "البلاغة",
    "الأدب",
    "النصوص",
    "القراءة",
  ],
  "اللغة الإنجليزية": [
    "Grammar",
    "Vocabulary",
    "Reading",
    "Writing",
    "Literature",
  ],
  "التاريخ": [
    "التاريخ القديم",
    "التاريخ الإسلامي",
    "التاريخ الحديث",
    "تاريخ مصر",
  ],
  "الجغرافيا": [
    "الجغرافيا الطبيعية",
    "الجغرافيا البشرية",
    "جغرافيا مصر",
    "الخرائط",
  ],
  "الفلسفة": [
    "الفلسفة القديمة",
    "الفلسفة الحديثة",
    "المنطق",
    "علم الجمال",
  ],
  "علم النفس": [
    "علم النفس العام",
    "علم النفس التربوي",
    "علم النفس الاجتماعي",
  ],
};

const DIFFICULTY_LEVELS = [
  { value: "سهل", label: "سهل", color: "#059669", icon: "😊" },
  { value: "متوسط", label: "متوسط", color: "#f59e0b", icon: "🤔" },
  { value: "صعب", label: "صعب", color: "#ef4444", icon: "😰" },
];

const STEPS = ["اختر الصف", "اختر المادة", "اختر الفصل", "اختر الصعوبة"];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const ExamsPageOut = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchLimitAndHistory = useCallback(async () => {
    if (!user) return;
    try {
      const [limitRes, historyRes] = await Promise.all([
        examsService.checkAiExamLimit(),
        examsService.getMyAiExams(),
      ]);
      setLimitInfo(limitRes?.data?.data ?? null);
      const list = historyRes?.data?.data ?? [];
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchLimitAndHistory();
  }, [user, fetchLimitAndHistory]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleGradeSelect = (grade) => {
    setSelectedGrade(grade);
    setSelectedSubject("");
    setSelectedChapter("");
    setSelectedDifficulty("");
    handleNext();
  };

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setSelectedChapter("");
    setSelectedDifficulty("");
    handleNext();
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedDifficulty("");
    handleNext();
  };

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleStartExam = async () => {
    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    setError("");
    setGenerating(true);
    try {
      const response = await examsService.generateAiExam({
        grade: selectedGrade,
        subject: selectedSubject,
        chapter: selectedChapter,
        difficulty: selectedDifficulty,
      });
      const exam = response?.data?.data;
      if (exam?.id) {
        navigate(`/exams/ai/take/${exam.id}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "فشل إنشاء الاختبار";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const canStartExam = selectedGrade && selectedSubject && selectedChapter && selectedDifficulty;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        pb: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: GRADIENTS.pink,
          color: "white",
          pt: 3,
          pb: 6,
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Circles */}
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.1)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 250,
            height: 250,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/start-journey")}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              <ArrowForwardRounded />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
              >
                🎯 الاختبارات والتدريبات
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.9 }}
              >
                اختبر نفسك واعرف مستواك الحقيقي
              </Typography>
            </Box>
            {user && (
              <IconButton
                onClick={() => setShowHistory(!showHistory)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
              >
                <HistoryRounded />
              </IconButton>
            )}
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -3, position: "relative", zIndex: 2 }}>
        {/* Stepper */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
            borderRadius: 3,
            p: 3,
          }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 700,
                      color: darkMode ? "#94a3b8" : "#64748b",
                      "&.Mui-active": {
                        color: "#db2777",
                      },
                      "&.Mui-completed": {
                        color: "#059669",
                      },
                    },
                    "& .MuiStepIcon-root": {
                      color: darkMode ? "#334155" : "#e5e7eb",
                      "&.Mui-active": {
                        color: "#db2777",
                      },
                      "&.Mui-completed": {
                        color: "#059669",
                      },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Card>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
              fontFamily: "Cairo, sans-serif",
              "& .MuiAlert-message": { fontFamily: "Cairo, sans-serif" },
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {user && limitInfo && !limitInfo.canGenerate && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: 3,
              fontFamily: "Cairo, sans-serif",
              "& .MuiAlert-message": { fontFamily: "Cairo, sans-serif" },
            }}
          >
            {limitInfo.hasPurchases
              ? `لقد وصلت إلى الحد الأقصى لإنشاء الاختبارات لهذا اليوم (${limitInfo.usedToday}/${limitInfo.maxPerDay}).`
              : `يمكنك إنشاء اختبار واحد فقط. قم بشراء كورس أو كتاب لإنشاء المزيد من الاختبارات. (${limitInfo.usedToday}/${limitInfo.maxPerDay})`}
          </Alert>
        )}

        {user && limitInfo && limitInfo.canGenerate && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 3,
              fontFamily: "Cairo, sans-serif",
              "& .MuiAlert-message": { fontFamily: "Cairo, sans-serif" },
            }}
            icon={limitInfo.hasPurchases ? <EmojiEventsRounded /> : <QuizRounded />}
          >
            {limitInfo.hasPurchases
              ? `يمكنك إنشاء ${limitInfo.maxPerDay - limitInfo.usedToday} اختبارات من أصل ${limitInfo.maxPerDay} اليوم.`
              : `يمكنك إنشاء ${limitInfo.maxPerDay - limitInfo.usedToday} اختبار. قم بشراء كورس أو كتاب لزيادة الحد اليومي.`}
          </Alert>
        )}

        {/* History Section */}
        {user && showHistory && history.length > 0 && (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
              p: 2,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
            >
              اختباراتي السابقة
            </Typography>
            <Grid container spacing={2}>
              {history.map((exam) => (
                <Grid item xs={12} sm={6} md={4} key={exam.id}>
                  <Paper
                    elevation={0}
                    onClick={() => {
                      if (exam.isCompleted) {
                        navigate(`/exams/ai/review/${exam.id}`);
                      } else {
                        navigate(`/exams/ai/take/${exam.id}`);
                      }
                    }}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                      borderRadius: 2,
                      transition: "all 0.2s",
                      "&:hover": { borderColor: "#db2777", transform: "translateY(-2px)" },
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {exam.subject} - {exam.chapter}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      {exam.difficulty} • {exam.questionsCount} أسئلة
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={
                          exam.isCompleted
                            ? exam.passed
                              ? "ناجح"
                              : "مكتمل"
                            : "لم يكتمل"
                        }
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                          fontSize: 11,
                          bgcolor: exam.isCompleted
                            ? exam.passed
                              ? "#dcfce7"
                              : "#fef3c7"
                            : "#e5e7eb",
                          color: exam.isCompleted
                            ? exam.passed
                              ? "#059669"
                              : "#f59e0b"
                            : "#64748b",
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        <Grid container spacing={3}>
          {/* Selection Panel */}
          <Grid item xs={12} md={8}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  background: GRADIENTS.pink,
                  p: 3,
                  color: "white",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TuneRounded sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                    >
                      {STEPS[activeStep]}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ opacity: 0.9 }}
                    >
                      الخطوة {activeStep + 1} من {STEPS.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 4 }}>
                {/* Step 0: Select Grade */}
                {activeStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      اختر الصف الدراسي
                    </Typography>
                    <Grid container spacing={2}>
                      {GRADES.map((grade) => (
                        <Grid item xs={12} key={grade}>
                          <Paper
                            onClick={() => handleGradeSelect(grade)}
                            sx={{
                              p: 3,
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor:
                                selectedGrade === grade
                                  ? "#db2777"
                                  : darkMode
                                  ? "#334155"
                                  : "#e5e7eb",
                              bgcolor:
                                selectedGrade === grade
                                  ? darkMode
                                    ? "rgba(219, 39, 119, 0.1)"
                                    : "#fdf2f8"
                                  : darkMode
                                  ? "#0f172a"
                                  : "white",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#db2777",
                                transform: "translateX(-5px)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 2,
                                  background: GRADIENTS.pink,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <SchoolRounded
                                  sx={{ fontSize: 28, color: "white" }}
                                />
                              </Box>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                              >
                                {grade}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </motion.div>
                )}

                {/* Step 1: Select Subject */}
                {activeStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      اختر المادة
                    </Typography>
                    <Grid container spacing={2}>
                      {SUBJECTS[selectedGrade]?.map((subject) => (
                        <Grid item xs={12} sm={6} key={subject}>
                          <Paper
                            onClick={() => handleSubjectSelect(subject)}
                            sx={{
                              p: 2.5,
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor:
                                selectedSubject === subject
                                  ? "#db2777"
                                  : darkMode
                                  ? "#334155"
                                  : "#e5e7eb",
                              bgcolor:
                                selectedSubject === subject
                                  ? darkMode
                                    ? "rgba(219, 39, 119, 0.1)"
                                    : "#fdf2f8"
                                  : darkMode
                                  ? "#0f172a"
                                  : "white",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#db2777",
                                transform: "translateY(-5px)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 45,
                                  height: 45,
                                  borderRadius: 2,
                                  background: GRADIENTS.pink,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <MenuBookRounded
                                  sx={{ fontSize: 24, color: "white" }}
                                />
                              </Box>
                              <Typography
                                variant="body1"
                                fontWeight={700}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                              >
                                {subject}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <Button
                      onClick={handleBack}
                      sx={{
                        mt: 3,
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      رجوع
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Select Chapter */}
                {activeStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      اختر الفصل
                    </Typography>
                    <Grid container spacing={2}>
                      {CHAPTERS[selectedSubject]?.map((chapter) => (
                        <Grid item xs={12} sm={6} key={chapter}>
                          <Paper
                            onClick={() => handleChapterSelect(chapter)}
                            sx={{
                              p: 2.5,
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor:
                                selectedChapter === chapter
                                  ? "#db2777"
                                  : darkMode
                                  ? "#334155"
                                  : "#e5e7eb",
                              bgcolor:
                                selectedChapter === chapter
                                  ? darkMode
                                    ? "rgba(219, 39, 119, 0.1)"
                                    : "#fdf2f8"
                                  : darkMode
                                  ? "#0f172a"
                                  : "white",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: "#db2777",
                                transform: "translateY(-5px)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 45,
                                  height: 45,
                                  borderRadius: 2,
                                  background: GRADIENTS.pink,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <DescriptionRounded
                                  sx={{ fontSize: 24, color: "white" }}
                                />
                              </Box>
                              <Typography
                                variant="body1"
                                fontWeight={700}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                              >
                                {chapter}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <Button
                      onClick={handleBack}
                      sx={{
                        mt: 3,
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      رجوع
                    </Button>
                  </motion.div>
                )}

                {/* Step 3: Select Difficulty */}
                {activeStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      اختر مستوى الصعوبة
                    </Typography>
                    <Grid container spacing={2}>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <Grid item xs={12} key={level.value}>
                          <Paper
                            onClick={() => handleDifficultySelect(level.value)}
                            sx={{
                              p: 3,
                              cursor: "pointer",
                              border: "2px solid",
                              borderColor:
                                selectedDifficulty === level.value
                                  ? level.color
                                  : darkMode
                                  ? "#334155"
                                  : "#e5e7eb",
                              bgcolor:
                                selectedDifficulty === level.value
                                  ? darkMode
                                    ? `${level.color}20`
                                    : `${level.color}10`
                                  : darkMode
                                  ? "#0f172a"
                                  : "white",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                borderColor: level.color,
                                transform: "translateX(-5px)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <Typography sx={{ fontSize: 40 }}>
                                {level.icon}
                              </Typography>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={700}
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                                >
                                  {level.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                                >
                                  {level.value === "سهل" &&
                                    "مناسب للمبتدئين والمراجعة السريعة"}
                                  {level.value === "متوسط" &&
                                    "مستوى الامتحانات الشهرية"}
                                  {level.value === "صعب" &&
                                    "مستوى امتحانات الثانوية العامة"}
                                </Typography>
                              </Box>
                              {selectedDifficulty === level.value && (
                                <CheckCircleRounded
                                  sx={{ fontSize: 32, color: level.color }}
                                />
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <Button
                      onClick={handleBack}
                      sx={{
                        mt: 3,
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      رجوع
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Summary Panel */}
          <Grid item xs={12} md={4}>
            {/* Selection Summary */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 2,
                      background: GRADIENTS.pink,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <QuizRounded sx={{ fontSize: 28, color: "white" }} />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                  >
                    ملخص الاختيار
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {/* Grade */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    >
                      الصف الدراسي
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {selectedGrade || "لم يتم الاختيار"}
                    </Typography>
                  </Box>

                  {/* Subject */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    >
                      المادة
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {selectedSubject || "لم يتم الاختيار"}
                    </Typography>
                  </Box>

                  {/* Chapter */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    >
                      الفصل
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {selectedChapter || "لم يتم الاختيار"}
                    </Typography>
                  </Box>

                  {/* Difficulty */}
                  <Box>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    >
                      مستوى الصعوبة
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {selectedDifficulty ? (
                        <Chip
                          label={selectedDifficulty}
                          sx={{
                            bgcolor:
                              DIFFICULTY_LEVELS.find(
                                (l) => l.value === selectedDifficulty
                              )?.color + "20",
                            color: DIFFICULTY_LEVELS.find(
                              (l) => l.value === selectedDifficulty
                            )?.color,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                        >
                          لم يتم الاختيار
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Start Exam Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={!canStartExam || generating}
              onClick={handleStartExam}
              startIcon={generating ? <CircularProgress size={22} color="inherit" /> : <PlayArrowRounded />}
              sx={{
                background: GRADIENTS.pink,
                fontFamily: "Cairo, sans-serif",
                fontWeight: 900,
                fontSize: "1.1rem",
                py: 2,
                borderRadius: 3,
                boxShadow: canStartExam
                  ? "0 10px 30px rgba(219, 39, 119, 0.3)"
                  : "none",
                "&:hover": {
                  boxShadow: canStartExam
                    ? "0 15px 40px rgba(219, 39, 119, 0.4)"
                    : "none",
                },
                "&.Mui-disabled": {
                  background: darkMode ? "#334155" : "#e5e7eb",
                  color: darkMode ? "#64748b" : "#94a3b8",
                },
              }}
            >
              {generating ? "جاري إنشاء الاختبار..." : "ابدأ الامتحان"}
            </Button>

            {!canStartExam && (
              <Typography
                variant="caption"
                fontFamily="Cairo, sans-serif"
                sx={{
                  color: darkMode ? "#64748b" : "#94a3b8",
                  textAlign: "center",
                  display: "block",
                  mt: 2,
                }}
              >
                يرجى إكمال جميع الخطوات للبدء
              </Typography>
            )}

            {/* Exam Info */}
            {canStartExam && (
              <Card
                elevation={0}
                sx={{
                  mt: 3,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <EmojiEventsRounded sx={{ color: "#f59e0b", fontSize: 20 }} />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      معلومات الامتحان
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TimerRounded
                        sx={{ fontSize: 18, color: darkMode ? "#64748b" : "#94a3b8" }}
                      />
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        المدة: 60 دقيقة
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <QuizRounded
                        sx={{ fontSize: 18, color: darkMode ? "#64748b" : "#94a3b8" }}
                      />
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        عدد الأسئلة: 20 سؤال
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EmojiEventsRounded
                        sx={{ fontSize: 18, color: darkMode ? "#64748b" : "#94a3b8" }}
                      />
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        الدرجة النهائية: 100 درجة
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Container>
      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onClose={() => setShowLoginDialog(false)}>
        <DialogTitle sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, textAlign: "center" }}>
          <LoginRounded sx={{ fontSize: 48, color: "#db2777", mb: 1 }} />
          <br />
          تسجيل الدخول مطلوب
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Cairo, sans-serif", textAlign: "center", fontSize: 16 }}>
            يجب تسجيل الدخول أولاً لإنشاء اختبار باستخدام الذكاء الاصطناعي.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <Button
            onClick={() => setShowLoginDialog(false)}
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 600,
              borderRadius: 2,
              color: darkMode ? "#94a3b8" : "#64748b",
            }}
          >
            إلغاء
          </Button>
          <Button
            onClick={() => {
              setShowLoginDialog(false);
              navigate("/login");
            }}
            variant="contained"
            startIcon={<LoginRounded />}
            sx={{
              background: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
              px: 4,
            }}
          >
            تسجيل الدخول
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExamsPageOut;