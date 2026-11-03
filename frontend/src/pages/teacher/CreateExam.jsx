// frontend/src/pages/teacher/CreateExam.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Chip,
  Radio,
  RadioGroup,
  Paper,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { ArrowBack, Save, Add, Delete, Assignment } from "@mui/icons-material";
import toast from "react-hot-toast";
import API from "../../services/api";

const CreateExam = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Exam Basic Info
  const [examData, setExamData] = useState({
    courseId: "",
    title: "",
    description: "",
    durationMinutes: 60,
    totalMarks: 100,
    passingMarks: 50,
    availableFrom: "",
    availableTo: "",
    
    isPublished: true, // ✅ افتراضي true حتى تظهر للطلاب فور الحفظ
  });

  // Questions
  const [questions, setQuestions] = useState([
    {
      type: "multiple-choice",
      questionText: "",
      marks: 5,
      options: ["", "", "", ""],
      correctAnswer: "",
      gradingCriteria: "",
    },
  ]);

  const [essayDialogOpen, setEssayDialogOpen] = useState(false);
  const [pendingEssayIndex, setPendingEssayIndex] = useState(null);
  const hasAssistantCache = useRef(null);

  const steps = ["معلومات الاختبار", "إضافة الأسئلة", "المراجعة والنشر"];

  const questionTypes = [
    { value: "multiple-choice", label: "اختيار من متعدد" },
    { value: "true-false", label: "صح أو خطأ" },
    { value: "essay", label: "سؤال مقالي" },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await API.get("/notifications/teacher/courses");
      setCourses(res.data.data || []);
    } catch (err) {
      toast.error("فشل تحميل الكورسات");
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleExamChange = (e) => {
    const { name, value, checked, type } = e.target;
    setExamData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    if (field === "type" && value === "essay") {
      setPendingEssayIndex(index);
      const check = (has) => {
        if (has) {
          applyTypeChange(index, value);
        } else {
          setEssayDialogOpen(true);
        }
      };
      if (hasAssistantCache.current !== null) {
        check(hasAssistantCache.current);
      } else {
        API.get("/teachers/me/has-assistant")
          .then((res) => {
            const has = res.data?.data?.hasAssistant === true;
            hasAssistantCache.current = has;
            check(has);
          })
          .catch(() => {
            hasAssistantCache.current = false;
            setEssayDialogOpen(true);
          });
      }
      return;
    }
    const updatedQuestions = [...questions];
    if (field === "type") {
      if (value === "true-false") {
        updatedQuestions[index].options = ["صح", "خطأ"];
        updatedQuestions[index].correctAnswer = "";
        updatedQuestions[index].gradingCriteria = "";
      } else if (value === "multiple-choice") {
        updatedQuestions[index].options = ["", "", "", ""];
        updatedQuestions[index].correctAnswer = "";
        updatedQuestions[index].gradingCriteria = "";
      }
    }
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const applyTypeChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].options = [];
    updatedQuestions[index].correctAnswer = "";
    updatedQuestions[index].gradingCriteria = "";
    updatedQuestions[index].type = value;
    setQuestions(updatedQuestions);
  };

  const handleCloseEssayDialog = () => {
    setEssayDialogOpen(false);
    setPendingEssayIndex(null);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: "multiple-choice",
        questionText: "",
        marks: 5,
        options: ["", "", "", ""],
        correctAnswer: "",
        gradingCriteria: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    } else {
      toast.error("يجب أن يحتوي الاختبار على سؤال واحد على الأقل");
    }
  };

  const addOption = (qIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options.push("");
    setQuestions(updatedQuestions);
  };

  const removeOption = (qIndex, optIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[qIndex].options.length > 2) {
      updatedQuestions[qIndex].options.splice(optIndex, 1);
      setQuestions(updatedQuestions);
    } else {
      toast.error("يجب أن يكون هناك خيارين على الأقل");
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!examData.title || !examData.courseId) {
        toast.error("يرجى ملء جميع الحقول المطلوبة");
        return;
      }
    } else if (activeStep === 1) {
      const hasEmptyQuestion = questions.some((q) => !q.questionText);
      if (hasEmptyQuestion) {
        toast.error("يرجى ملء جميع الأسئلة");
        return;
      }

      const hasNoCorrectAnswer = questions.some(
        (q) => q.type !== "essay" && !q.correctAnswer
      );
      if (hasNoCorrectAnswer) {
        toast.error("يرجى اختيار الإجابة الصحيحة لكل سؤال (غير المقالي)");
        return;
      }

      const hasEmptyOptions = questions.some(
        (q) =>
          q.type === "multiple-choice" && q.options.some((opt) => !opt.trim())
      );
      if (hasEmptyOptions) {
        toast.error("يرجى ملء جميع الخيارات في أسئلة الاختيار من متعدد");
        return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const examPayload = {
        ...examData,
        isPublished: true, // ✅ دائماً true عند الحفظ حتى تظهر للطلاب
        durationMinutes: parseInt(examData.durationMinutes),
        totalMarks: parseInt(examData.totalMarks),
        passingMarks: parseInt(examData.passingMarks),
        availableFrom: examData.availableFrom || null,
        availableTo: examData.availableTo || null,
        questions: questions.map((q, index) => ({
          type: q.type,
          questionText: q.questionText,
          marks: q.marks,
          options: q.type === "essay" ? [] : q.options,
          correctAnswer: q.type === "essay" ? null : q.correctAnswer,
          gradingCriteria:
            q.type === "essay" ? q.gradingCriteria || null : null,
          order: index + 1,
        })),
      };

      const res = await API.post("/exams", examPayload);

      if (res.data.success) {
        toast.success("تم إنشاء الاختبار ونشره بنجاح! 🎉");
        navigate("/teacher/dashboard");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || "فشل إنشاء الاختبار. حاول مرة أخرى.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseName =
    courses.find((c) => c.id === examData.courseId)?.title || examData.courseId;

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: darkMode ? "#334155" : undefined },
    },
    "& .MuiInputBase-input": { color: darkMode ? "#f1f5f9" : undefined },
    "& .MuiInputLabel-root": {
      fontFamily: "Cairo, sans-serif",
      color: darkMode ? "#94a3b8" : undefined,
    },
  };

  const getQuestionTypeLabel = (type) =>
    questionTypes.find((t) => t.value === type)?.label || type;

  const getQuestionTypeColor = (type) => {
    if (type === "essay") return { bg: "#7c3aed", text: "#ede9fe" };
    if (type === "true-false") return { bg: "#0891b2", text: "#e0f2fe" };
    return { bg: "#2563eb", text: "#e0e7ff" };
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                background: "linear-gradient(135deg, #dc2626 0%, #db2777 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Assignment />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
              >
                إنشاء اختبار جديد
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
              >
                أنشئ اختبار تقييمي لطلابك
              </Typography>
            </Box>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 700,
                      color: darkMode ? "#94a3b8" : "inherit",
                    },
                    "& .MuiStepLabel-label.Mui-active": {
                      color: darkMode ? "#f1f5f9" : "inherit",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step Content */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* ── Step 1: Basic Info ── */}
            {activeStep === 0 && (
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  المعلومات الأساسية
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#94a3b8" : undefined,
                        }}
                      >
                        اختر الكورس
                      </InputLabel>
                      <Select
                        name="courseId"
                        value={examData.courseId}
                        onChange={handleExamChange}
                        label="اختر الكورس"
                        disabled={loadingCourses}
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: darkMode ? "#334155" : undefined,
                          },
                          "& .MuiSelect-select": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                        }}
                      >
                        {loadingCourses ? (
                          <MenuItem
                            disabled
                            sx={{ fontFamily: "Cairo, sans-serif" }}
                          >
                            جاري التحميل...
                          </MenuItem>
                        ) : courses.length === 0 ? (
                          <MenuItem
                            disabled
                            sx={{ fontFamily: "Cairo, sans-serif" }}
                          >
                            لا توجد كورسات
                          </MenuItem>
                        ) : (
                          courses.map((course) => (
                            <MenuItem
                              key={course.id}
                              value={course.id}
                              sx={{ fontFamily: "Cairo, sans-serif" }}
                            >
                              {course.title}
                              {course._count?.enrollments !== undefined && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: "text.secondary" }}
                                >
                                  ({course._count.enrollments} طالب)
                                </Typography>
                              )}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      name="title"
                      label="عنوان الاختبار"
                      value={examData.title}
                      onChange={handleExamChange}
                      placeholder="مثال: اختبار الفصل الأول - الجبر"
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      name="description"
                      label="وصف الاختبار (اختياري)"
                      value={examData.description}
                      onChange={handleExamChange}
                      placeholder="اكتب وصفاً مختصراً عن الاختبار..."
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      name="durationMinutes"
                      label="مدة الاختبار (بالدقائق)"
                      value={examData.durationMinutes}
                      onChange={handleExamChange}
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      name="totalMarks"
                      label="إجمالي الدرجات"
                      value={examData.totalMarks}
                      onChange={handleExamChange}
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      name="passingMarks"
                      label="درجة النجاح"
                      value={examData.passingMarks}
                      onChange={handleExamChange}
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      name="availableFrom"
                      label="متاح من (اختياري)"
                      value={examData.availableFrom}
                      onChange={handleExamChange}
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#94a3b8" : undefined,
                        },
                      }}
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      name="availableTo"
                      label="متاح حتى (اختياري)"
                      value={examData.availableTo}
                      onChange={handleExamChange}
                      InputLabelProps={{
                        shrink: true,
                        sx: {
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#94a3b8" : undefined,
                        },
                      }}
                      sx={fieldSx}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>

                  

                  {/* ✅ Switch للنشر الفوري */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={examData.isPublished}
                          onChange={handleExamChange}
                          name="isPublished"
                          color="success"
                        />
                      }
                      label={
                        <Box>
                          <Typography
                            fontFamily="Cairo, sans-serif"
                            fontWeight={600}
                            sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                          >
                            نشر الاختبار فور الحفظ
                          </Typography>
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                          >
                            {examData.isPublished
                              ? "سيظهر الاختبار للطلاب المسجلين في الكورس فور الحفظ"
                              : "الاختبار سيُحفظ كمسودة ولن يظهر للطلاب"}
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* ── Step 2: Questions ── */}
            {activeStep === 1 && (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      الأسئلة ({questions.length})
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      يدعم: اختيار من متعدد · صح أو خطأ · سؤال مقالي
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={addQuestion}
                    sx={{
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 700,
                      background:
                        "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                    }}
                  >
                    إضافة سؤال
                  </Button>
                </Box>

                {questions.map((question, qIndex) => {
                  const typeColor = getQuestionTypeColor(question.type);
                  return (
                    <Paper
                      key={qIndex}
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        border: "1px solid",
                        borderColor: darkMode ? "#334155" : "#e5e7eb",
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          <Chip
                            label={`السؤال ${qIndex + 1}`}
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                              bgcolor: darkMode ? "#1e293b" : "#e0e7ff",
                              color: darkMode ? "#f1f5f9" : "#3730a3",
                            }}
                          />
                          <Chip
                            label={getQuestionTypeLabel(question.type)}
                            size="small"
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 600,
                              bgcolor: typeColor.bg,
                              color: "#fff",
                              fontSize: "0.7rem",
                            }}
                          />
                          {question.type === "essay" && (
                            <Chip
                              label="تصحيح يدوي"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                fontWeight: 600,
                                borderColor: "#f59e0b",
                                color: "#f59e0b",
                                fontSize: "0.7rem",
                              }}
                            />
                          )}
                        </Box>
                        <IconButton
                          onClick={() => removeQuestion(qIndex)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                color: darkMode ? "#94a3b8" : undefined,
                              }}
                            >
                              نوع السؤال
                            </InputLabel>
                            <Select
                              value={question.type}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "type",
                                  e.target.value
                                )
                              }
                              label="نوع السؤال"
                              sx={{
                                fontFamily: "Cairo, sans-serif",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: darkMode ? "#334155" : undefined,
                                },
                                "& .MuiSelect-select": {
                                  color: darkMode ? "#f1f5f9" : undefined,
                                },
                              }}
                            >
                              {questionTypes.map((type) => (
                                <MenuItem
                                  key={type.value}
                                  value={type.value}
                                  sx={{ fontFamily: "Cairo, sans-serif" }}
                                >
                                  {type.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="الدرجة"
                            value={question.marks}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIndex,
                                "marks",
                                parseInt(e.target.value)
                              )
                            }
                            sx={fieldSx}
                            InputProps={{
                              sx: { fontFamily: "Cairo, sans-serif" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="نص السؤال"
                            value={question.questionText}
                            onChange={(e) =>
                              handleQuestionChange(
                                qIndex,
                                "questionText",
                                e.target.value
                              )
                            }
                            placeholder="اكتب السؤال هنا..."
                            sx={fieldSx}
                            InputProps={{
                              sx: { fontFamily: "Cairo, sans-serif" },
                            }}
                          />
                        </Grid>

                        {/* Essay fields */}
                        {question.type === "essay" && (
                          <>
                            <Grid item xs={12}>
                              <Divider
                                sx={{
                                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                                  mb: 1,
                                }}
                              />
                              <Box
                                sx={{
                                  p: 2,
                                  borderRadius: 2,
                                  bgcolor: darkMode ? "#1e293b" : "#fefce8",
                                  border: "1px solid",
                                  borderColor: darkMode
                                    ? "#854d0e"
                                    : "#fde68a",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  fontFamily="Cairo, sans-serif"
                                  fontWeight={700}
                                  sx={{
                                    color: "#f59e0b",
                                    display: "block",
                                    mb: 0.5,
                                  }}
                                >
                                  ℹ️ سؤال مقالي — سيتم تصحيحه يدوياً من قِبَل
                                  المعلم
                                </Typography>
                                <Typography
                                  variant="caption"
                                  fontFamily="Cairo, sans-serif"
                                  sx={{
                                    color: darkMode ? "#94a3b8" : "#78716c",
                                  }}
                                >
                                  يمكنك إضافة معايير التصحيح لمساعدتك أثناء
                                  المراجعة.
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="معايير التصحيح / الإجابة النموذجية (اختياري)"
                                value={question.gradingCriteria || ""}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    qIndex,
                                    "gradingCriteria",
                                    e.target.value
                                  )
                                }
                                placeholder="اكتب النقاط الأساسية التي يجب أن تتضمنها إجابة الطالب..."
                                sx={fieldSx}
                                InputProps={{
                                  sx: { fontFamily: "Cairo, sans-serif" },
                                }}
                                helperText={
                                  <Typography
                                    variant="caption"
                                    fontFamily="Cairo, sans-serif"
                                    sx={{
                                      color: darkMode
                                        ? "#64748b"
                                        : "text.secondary",
                                    }}
                                  >
                                    هذه المعايير لن تظهر للطالب، فقط للمعلم
                                    أثناء التصحيح
                                  </Typography>
                                }
                              />
                            </Grid>
                          </>
                        )}

                        {/* MCQ / True-False options */}
                        {question.type !== "essay" && (
                          <Grid item xs={12}>
                            <Typography
                              variant="subtitle2"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={700}
                              sx={{
                                mb: 1,
                                color: darkMode ? "#f1f5f9" : "inherit",
                              }}
                            >
                              الخيارات:{" "}
                              {question.type === "true-false" &&
                                "(اختر الإجابة الصحيحة)"}
                            </Typography>

                            <RadioGroup
                              value={question.correctAnswer}
                              onChange={(e) =>
                                handleQuestionChange(
                                  qIndex,
                                  "correctAnswer",
                                  e.target.value
                                )
                              }
                            >
                              {question.options.map((option, optIndex) => (
                                <Box
                                  key={optIndex}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  <Radio value={option} />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={option}
                                    onChange={(e) =>
                                      handleOptionChange(
                                        qIndex,
                                        optIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`الخيار ${optIndex + 1}`}
                                    disabled={question.type === "true-false"}
                                    sx={fieldSx}
                                    InputProps={{
                                      sx: { fontFamily: "Cairo, sans-serif" },
                                    }}
                                  />
                                  {question.type === "multiple-choice" &&
                                    question.options.length > 2 && (
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          removeOption(qIndex, optIndex)
                                        }
                                        color="error"
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    )}
                                </Box>
                              ))}
                            </RadioGroup>

                            {question.type === "multiple-choice" && (
                              <Button
                                size="small"
                                startIcon={<Add />}
                                onClick={() => addOption(qIndex)}
                                sx={{
                                  mt: 1,
                                  fontFamily: "Cairo, sans-serif",
                                  fontWeight: 700,
                                  color: darkMode ? "#f1f5f9" : "inherit",
                                }}
                              >
                                إضافة خيار
                              </Button>
                            )}
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  );
                })}
              </Box>
            )}

            {/* ── Step 3: Review ── */}
            {activeStep === 2 && (
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  مراجعة الاختبار
                </Typography>

                {/* ✅ بادج النشر */}
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: examData.isPublished
                      ? darkMode
                        ? "rgba(5, 150, 105, 0.15)"
                        : "#dcfce7"
                      : darkMode
                      ? "rgba(245, 158, 11, 0.15)"
                      : "#fef3c7",
                    border: "1px solid",
                    borderColor: examData.isPublished ? "#059669" : "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Typography
                    fontFamily="Cairo, sans-serif"
                    fontWeight={700}
                    sx={{
                      color: examData.isPublished ? "#059669" : "#f59e0b",
                    }}
                  >
                    {examData.isPublished
                      ? "✅ سيتم نشر الاختبار فور الحفظ وسيظهر للطلاب المسجلين"
                      : "⚠️ سيُحفظ الاختبار كمسودة ولن يظهر للطلاب"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                  {[
                    {
                      label: "اختيار من متعدد",
                      count: questions.filter(
                        (q) => q.type === "multiple-choice"
                      ).length,
                      color: "#2563eb",
                    },
                    {
                      label: "صح أو خطأ",
                      count: questions.filter((q) => q.type === "true-false")
                        .length,
                      color: "#0891b2",
                    },
                    {
                      label: "مقالي",
                      count: questions.filter((q) => q.type === "essay").length,
                      color: "#7c3aed",
                    },
                  ].map((s) => (
                    <Chip
                      key={s.label}
                      label={`${s.label}: ${s.count}`}
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        bgcolor: s.color,
                        color: "#fff",
                      }}
                    />
                  ))}
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                    sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                  >
                    معلومات الاختبار:
                  </Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: "العنوان", value: examData.title },
                      { label: "الكورس", value: selectedCourseName },
                      {
                        label: "المدة",
                        value: `${examData.durationMinutes} دقيقة`,
                      },
                      {
                        label: "إجمالي الدرجات",
                        value: examData.totalMarks,
                      },
                      { label: "درجة النجاح", value: examData.passingMarks },
                      { label: "عدد الأسئلة", value: questions.length },
                    ].map((item) => (
                      <Grid item xs={12} sm={6} key={item.label}>
                        <Typography
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                        >
                          <strong>{item.label}:</strong> {item.value}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>

                {questions.map((q, index) => {
                  const typeColor = getQuestionTypeColor(q.type);
                  return (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 2,
                        border: "1px solid",
                        borderColor: darkMode ? "#334155" : "#e5e7eb",
                        bgcolor: darkMode ? "#020617" : "#ffffff",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          mb: 1.5,
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#f1f5f9" : "inherit",
                            flex: 1,
                          }}
                        >
                          {index + 1}. {q.questionText}
                        </Typography>
                        <Chip
                          label={getQuestionTypeLabel(q.type)}
                          size="small"
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 600,
                            bgcolor: typeColor.bg,
                            color: "#fff",
                            fontSize: "0.65rem",
                          }}
                        />
                        <Chip
                          label={`${q.marks} درجة`}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            borderColor: darkMode ? "#475569" : "#d1d5db",
                            color: darkMode ? "#94a3b8" : "#6b7280",
                          }}
                        />
                      </Box>

                      {q.type !== "essay" && (
                        <Box sx={{ pl: 2 }}>
                          {q.options.map((opt, i) => (
                            <Typography
                              key={i}
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color:
                                  opt === q.correctAnswer
                                    ? "#22c55e"
                                    : darkMode
                                    ? "#94a3b8"
                                    : "text.secondary",
                                fontWeight:
                                  opt === q.correctAnswer ? 700 : 400,
                              }}
                            >
                              {opt === q.correctAnswer ? "✓" : "•"} {opt}
                            </Typography>
                          ))}
                        </Box>
                      )}

                      {q.type === "essay" && (
                        <Box sx={{ pl: 2 }}>
                          <Typography
                            fontFamily="Cairo, sans-serif"
                            variant="body2"
                            sx={{
                              color: darkMode ? "#64748b" : "#9ca3af",
                              fontStyle: "italic",
                              mb: q.gradingCriteria ? 1 : 0,
                            }}
                          >
                            [سيكتب الطالب إجابته المقالية هنا]
                          </Typography>
                          {q.gradingCriteria && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 1.5,
                                borderRadius: 1,
                                bgcolor: darkMode ? "#1e293b" : "#fefce8",
                                border: "1px solid",
                                borderColor: darkMode ? "#854d0e" : "#fde68a",
                              }}
                            >
                              <Typography
                                fontFamily="Cairo, sans-serif"
                                variant="caption"
                                fontWeight={700}
                                sx={{
                                  color: "#f59e0b",
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                معايير التصحيح:
                              </Typography>
                              <Typography
                                fontFamily="Cairo, sans-serif"
                                variant="caption"
                                sx={{
                                  color: darkMode ? "#94a3b8" : "#78716c",
                                }}
                              >
                                {q.gradingCriteria}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              color: darkMode ? "#f1f5f9" : "inherit",
            }}
          >
            رجوع
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              }}
            >
              التالي
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <Save />
                )
              }
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
              }}
            >
              {loading ? "جاري الحفظ..." : "حفظ ونشر الاختبار"}
            </Button>
          )}
        </Box>
      </Container>

      <Dialog open={essayDialogOpen} onClose={handleCloseEssayDialog}>
        <DialogTitle sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          🔒 يتطلب تفعيل مدرس مساعد
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Cairo, sans-serif", lineHeight: 1.8 }}>
            يجب أن يكون لديك <strong>مدرس مساعد واحد على الأقل</strong> تم تفعيله حتى تتمكن من إضافة أسئلة مقالية.
          </DialogContentText>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: darkMode ? "#1e293b" : "#fefce8",
              border: "1px solid",
              borderColor: darkMode ? "#854d0e" : "#fde68a",
            }}
          >
            <Typography
              variant="caption"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#94a3b8" : "#78716c" }}
            >
              يمكنك تفعيل مدرس مساعد من صفحة {" "}
              <strong
                onClick={() => {
                  handleCloseEssayDialog();
                  navigate("/teacher/assistant-teachers");
                }}
                style={{ color: "#059669", cursor: "pointer", textDecoration: "underline" }}
              >
                إدارة المدرسين المساعدين
              </strong>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEssayDialog} sx={{ fontFamily: "Cairo, sans-serif" }}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateExam;