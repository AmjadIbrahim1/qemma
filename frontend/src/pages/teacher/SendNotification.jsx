// frontend/src/pages/teacher/SendNotification.jsx
import { useState, useEffect } from "react";
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
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Send,
  Notifications,
  Campaign,
  Assignment,
  BarChart,
  Bolt,
  MenuBook,
  Schedule,
  People,
  Person,
  School,
} from "@mui/icons-material";
import toast from "react-hot-toast";
import API from "../../services/api";

const SendNotification = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [formData, setFormData] = useState({
    type: "announcement",
    title: "",
    message: "",
    recipient: "all",
    courseId: "",
    studentId: "",
    scheduleType: "now",
    scheduledDate: "",
    scheduledTime: "",
  });

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // جلب الكورسات عند اختيار "كورس محدد"
  useEffect(() => {
    if (formData.recipient === "course" && courses.length === 0) {
      fetchCourses();
    }
  }, [formData.recipient]);

  // جلب الطلاب عند اختيار "طالب محدد"
  useEffect(() => {
    if (formData.recipient === "student" && students.length === 0) {
      fetchStudents();
    }
  }, [formData.recipient]);

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

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await API.get("/notifications/teacher/students");
      setStudents(res.data.data || []);
    } catch (err) {
      toast.error("فشل تحميل الطلاب");
    } finally {
      setLoadingStudents(false);
    }
  };

  // أنواع الإشعارات
  const notificationTypes = [
    {
      value: "announcement",
      label: "إعلان عام",
      icon: <Campaign />,
      color: "#2563eb",
      bgColor: "#eff6ff",
    },
    {
      value: "exam",
      label: "إشعار بامتحان",
      icon: <Assignment />,
      color: "#dc2626",
      bgColor: "#fef2f2",
    },
    {
      value: "results",
      label: "ظهور النتائج",
      icon: <BarChart />,
      color: "#059669",
      bgColor: "#ecfdf5",
    },
    {
      value: "quiz",
      label: "اختبار مفاجئ",
      icon: <Bolt />,
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
    {
      value: "lesson",
      label: "درس جديد",
      icon: <MenuBook />,
      color: "#7c3aed",
      bgColor: "#f5f3ff",
    },
    {
      value: "reminder",
      label: "تذكير بحصة",
      icon: <Schedule />,
      color: "#db2777",
      bgColor: "#fdf2f8",
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("يرجى إدخال عنوان الإشعار");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("يرجى إدخال نص الإشعار");
      return;
    }
    if (formData.recipient === "course" && !formData.courseId) {
      toast.error("يرجى اختيار الكورس");
      return;
    }
    if (formData.recipient === "student" && !formData.studentId) {
      toast.error("يرجى اختيار الطالب");
      return;
    }
    if (
      formData.scheduleType === "scheduled" &&
      (!formData.scheduledDate || !formData.scheduledTime)
    ) {
      toast.error("يرجى تحديد تاريخ ووقت الإرسال");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        message: formData.message,
        recipient: formData.recipient,
        courseId: formData.recipient === "course" ? formData.courseId : undefined,
        studentId: formData.recipient === "student" ? formData.studentId : undefined,
        scheduleType: formData.scheduleType,
      };

      const res = await API.post("/notifications/send", payload);

      if (res.data.success) {
        const sent = res.data.data?.sent;
        if (sent !== undefined) {
          toast.success(`تم إرسال الإشعار بنجاح لـ ${sent} طالب! 🎉`);
        } else {
          toast.success("تم إرسال الإشعار بنجاح! 🎉");
        }

        // Reset form
        setFormData({
          type: "announcement",
          title: "",
          message: "",
          recipient: "all",
          courseId: "",
          studentId: "",
          scheduleType: "now",
          scheduledDate: "",
          scheduledTime: "",
        });

        setTimeout(() => {
          navigate("/teacher/dashboard");
        }, 1000);
      }
    } catch (error) {
      const msg =
        error.response?.data?.message || "فشل إرسال الإشعار. حاول مرة أخرى.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = notificationTypes.find((t) => t.value === formData.type);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/teacher/dashboard")}
            sx={{ mb: 2, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
          >
            العودة للوحة التحكم
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <Notifications />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
              >
                إرسال إشعار
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
              >
                أرسل إشعارات مهمة لطلابك
              </Typography>
            </Box>
          </Box>
        </Box>

        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Notification Type Selection */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  نوع الإشعار
                </Typography>
                <Grid container spacing={2}>
                  {notificationTypes.map((type) => {
                    const isSelected = formData.type === type.value;
                    return (
                      <Grid item xs={6} sm={4} key={type.value}>
                        <Card
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              type: type.value,
                            }))
                          }
                          sx={{
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: isSelected
                              ? type.color
                              : "transparent",
                            bgcolor: isSelected
                              ? type.bgColor
                              : "background.paper",
                            transition: "all 0.2s",
                            "&:hover": {
                              borderColor: type.color,
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <CardContent sx={{ textAlign: "center", py: 2 }}>
                            <Box sx={{ color: type.color, mb: 1 }}>
                              {type.icon}
                            </Box>
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={700}
                              sx={{
                                fontSize: "0.875rem",
                                color: isSelected
                                  ? type.color
                                  : "text.primary",
                                transition: "color 0.2s",
                              }}
                            >
                              {type.label}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Title */}
              <TextField
                fullWidth
                name="title"
                label="عنوان الإشعار"
                value={formData.title}
                onChange={handleChange}
                required
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: darkMode ? "#334155" : undefined,
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: darkMode ? "#f1f5f9" : undefined,
                  },
                  "& .MuiInputLabel-root": {
                    color: darkMode ? "#94a3b8" : undefined,
                  },
                }}
                InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
              />

              {/* Message */}
              <TextField
                fullWidth
                name="message"
                label="نص الإشعار"
                value={formData.message}
                onChange={handleChange}
                required
                multiline
                rows={4}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: darkMode ? "#334155" : undefined,
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: darkMode ? "#f1f5f9" : undefined,
                  },
                  "& .MuiInputLabel-root": {
                    color: darkMode ? "#94a3b8" : undefined,
                  },
                }}
                InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                placeholder="اكتب تفاصيل الإشعار هنا..."
              />

              {/* Recipients */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  المستقبلون
                </Typography>
                <RadioGroup
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <People fontSize="small" />
                        <Typography
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                        >
                          جميع الطلاب
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="course"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <School fontSize="small" />
                        <Typography
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                        >
                          كورس محدد
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="student"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Person fontSize="small" />
                        <Typography
                          fontFamily="Cairo, sans-serif"
                          fontWeight={600}
                        >
                          طالب محدد
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              {/* Course Selection */}
              {formData.recipient === "course" && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                    اختر الكورس
                  </InputLabel>
                  <Select
                    name="courseId"
                    value={formData.courseId}
                    onChange={handleChange}
                    label="اختر الكورس"
                    sx={{ fontFamily: "Cairo, sans-serif" }}
                    disabled={loadingCourses}
                    startAdornment={
                      loadingCourses ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null
                    }
                  >
                    {loadingCourses ? (
                      <MenuItem disabled sx={{ fontFamily: "Cairo, sans-serif" }}>
                        جاري التحميل...
                      </MenuItem>
                    ) : courses.length === 0 ? (
                      <MenuItem disabled sx={{ fontFamily: "Cairo, sans-serif" }}>
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
              )}

              {/* Student Selection */}
              {formData.recipient === "student" && (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                    اختر الطالب
                  </InputLabel>
                  <Select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    label="اختر الطالب"
                    sx={{ fontFamily: "Cairo, sans-serif" }}
                    disabled={loadingStudents}
                    startAdornment={
                      loadingStudents ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null
                    }
                  >
                    {loadingStudents ? (
                      <MenuItem disabled sx={{ fontFamily: "Cairo, sans-serif" }}>
                        جاري التحميل...
                      </MenuItem>
                    ) : students.length === 0 ? (
                      <MenuItem disabled sx={{ fontFamily: "Cairo, sans-serif" }}>
                        لا يوجد طلاب
                      </MenuItem>
                    ) : (
                      students.map((student) => (
                        <MenuItem
                          key={student.studentId}
                          value={student.studentId}
                          sx={{ fontFamily: "Cairo, sans-serif" }}
                        >
                          {student.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              )}

              {/* Schedule */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  موعد الإرسال
                </Typography>
                <RadioGroup
                  name="scheduleType"
                  value={formData.scheduleType}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="now"
                    control={<Radio />}
                    label={
                      <Typography
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                      >
                        إرسال فوري
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="scheduled"
                    control={<Radio />}
                    label={
                      <Typography
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                      >
                        جدولة الإرسال
                      </Typography>
                    }
                  />
                </RadioGroup>
              </Box>

              {/* Scheduled Date & Time */}
              {formData.scheduleType === "scheduled" && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      name="scheduledDate"
                      label="التاريخ"
                      value={formData.scheduledDate}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                        sx: { fontFamily: "Cairo, sans-serif" },
                      }}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      name="scheduledTime"
                      label="الوقت"
                      value={formData.scheduledTime}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                        sx: { fontFamily: "Cairo, sans-serif" },
                      }}
                      InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                    />
                  </Grid>
                </Grid>
              )}

              {/* Preview */}
              {formData.title && formData.message && (
                <Alert
                  severity="info"
                  sx={{ mb: 3, fontFamily: "Cairo, sans-serif" }}
                  icon={selectedType?.icon}
                >
                  <Typography
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                    sx={{ mb: 0.5 }}
                  >
                    معاينة الإشعار
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontFamily="Cairo, sans-serif"
                    fontWeight={700}
                  >
                    {formData.title}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    {formData.message}
                  </Typography>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
                disableElevation
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  borderRadius: 2,
                  py: 1.5,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)",
                  },
                  "&:disabled": {
                    background: "#e5e7eb",
                  },
                }}
              >
                {loading ? "جاري الإرسال..." : "إرسال الإشعار"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SendNotification;