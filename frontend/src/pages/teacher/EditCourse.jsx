// frontend/src/pages/teacher/EditCourse.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
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
  IconButton,
  Chip,
  Paper,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Image as ImageIcon,
  Save,
  Delete,
  School,
  Category,
  Description,
  AttachMoney,
  Close,
  CheckCircle,
  Warning,
} from "@mui/icons-material";
import toast from "react-hot-toast";

const EditCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const teacherSubject =
    user?.teacher?.specialties?.[0] ||
    user?.teacher?.expertise        ||
    user?.subject                   ||
    '';
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const imageInputRef = useRef(null);

  // Course Data
  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    category: teacherSubject,
    subject: "",
    grade: "",
    price: "",
    duration: "",
    level: "",
    isPublished: false,
    imageUrl: null,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Categories
  const categories = [
    "رياضيات",
    "علوم",
    "فيزياء",
    "كيمياء",
    "أحياء",
    "لغة عربية",
    "لغة إنجليزية",
    "لغة فرنسية",
    "تاريخ",
    "جغرافيا",
  ];

  const grades = [
    "الصف الأول الابتدائي",
    "الصف الثاني الابتدائي",
    "الصف الثالث الابتدائي",
    "الصف الرابع الابتدائي",
    "الصف الخامس الابتدائي",
    "الصف السادس الابتدائي",
    "الصف الأول الإعدادي",
    "الصف الثاني الإعدادي",
    "الصف الثالث الإعدادي",
    "الصف الأول الثانوي",
    "الصف الثاني الثانوي",
    "الصف الثالث الثانوي",
  ];

  const levels = ["مبتدئ", "متوسط", "متقدم"];

  // Fetch course data on mount
  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setInitialLoading(true);

      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data
      const mockCourse = {
        id: courseId,
        title: "الرياضيات - الصف الأول الثانوي",
        description:
          "كورس شامل لمنهج الرياضيات للصف الأول الثانوي يشمل الجبر والهندسة والمثلثات",
        category: "رياضيات",
        subject: "رياضيات",
        grade: "الصف الأول الثانوي",
        price: "500",
        duration: "40",
        level: "متوسط",
        isPublished: true,
        imageUrl:
          "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
      };

      setCourseData({ ...mockCourse, category: teacherSubject || mockCourse.category });
      if (mockCourse.imageUrl) {
        setImagePreview(mockCourse.imageUrl);
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("فشل تحميل بيانات الكورس");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setCourseData((prev) => ({
      ...prev,
      [name]: name === "isPublished" ? checked : value,
    }));
  };
  const handleEdit = (courseId) => {
    navigate(`/teacher/courses/edit/${courseId}`);
  };
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("يرجى اختيار ملف صورة صالح");
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      toast.success("تم اختيار الصورة بنجاح");
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setCourseData((prev) => ({ ...prev, imageUrl: null }));
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
    toast.success("تم حذف الصورة");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!courseData.title) {
      toast.error("يرجى إدخال عنوان الكورس");
      return;
    }
    if (!courseData.category) {
      toast.error("يرجى اختيار التصنيف");
      return;
    }
    if (!courseData.grade) {
      toast.error("يرجى اختيار الصف الدراسي");
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      const formData = new FormData();
      formData.append("title", courseData.title);
      formData.append("description", courseData.description);
      formData.append("category", courseData.category);
      formData.append("subject", courseData.subject);
      formData.append("grade", courseData.grade);
      formData.append("price", courseData.price);
      formData.append("duration", courseData.duration);
      formData.append("level", courseData.level);
      formData.append("isPublished", courseData.isPublished);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      console.log("Updating course:", courseData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("تم تحديث الكورس بنجاح! 🎉");

      setTimeout(() => {
        navigate("/teacher/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("فشل تحديث الكورس. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا الكورس؟ لن تتمكن من التراجع عن هذا الإجراء.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("تم حذف الكورس بنجاح");
      navigate("/teacher/dashboard");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("فشل حذف الكورس");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: darkMode ? "#0f172a" : "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#8b5cf6", mb: 2 }} />
          <Typography
            fontFamily="Cairo, sans-serif"
            fontWeight={700}
            sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
          >
            جاري تحميل بيانات الكورس...
          </Typography>
        </Box>
      </Box>
    );
  }

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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <Edit />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  تعديل الكورس
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  قم بتحديث معلومات الكورس
                </Typography>
              </Box>
            </Box>

            {/* Delete Button */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDeleteCourse}
              disabled={loading}
              sx={{
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
              }}
            >
              حذف الكورس
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} lg={8}>
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
                  {/* Course Image */}
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      صورة الكورس
                    </Typography>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        border: "2px dashed",
                        borderColor: darkMode ? "#334155" : "#e5e7eb",
                        bgcolor: darkMode ? "#0f172a" : "#f9fafb",
                        textAlign: "center",
                      }}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />

                      {imagePreview ? (
                        <Box>
                          <Box
                            sx={{
                              position: "relative",
                              display: "inline-block",
                            }}
                          >
                            <img
                              src={imagePreview}
                              alt="Course preview"
                              style={{
                                width: "100%",
                                maxHeight: "300px",
                                objectFit: "cover",
                                borderRadius: "8px",
                              }}
                            />
                            <IconButton
                              onClick={handleRemoveImage}
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                bgcolor: "rgba(0,0,0,0.6)",
                                color: "white",
                                "&:hover": {
                                  bgcolor: "rgba(0,0,0,0.8)",
                                },
                              }}
                            >
                              <Close />
                            </IconButton>
                          </Box>
                          <Button
                            variant="outlined"
                            onClick={() => imageInputRef.current?.click()}
                            sx={{
                              mt: 2,
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                              borderColor: darkMode ? "#334155" : undefined,
                              color: darkMode ? "#f1f5f9" : "inherit",
                            }}
                          >
                            تغيير الصورة
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <ImageIcon
                            sx={{
                              fontSize: 60,
                              color: darkMode ? "#475569" : "#d1d5db",
                              mb: 2,
                            }}
                          />
                          <Typography
                            variant="body1"
                            fontFamily="Cairo, sans-serif"
                            fontWeight={700}
                            sx={{
                              mb: 1,
                              color: darkMode ? "#f1f5f9" : "inherit",
                            }}
                          >
                            رفع صورة للكورس
                          </Typography>
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            sx={{
                              mb: 2,
                              color: darkMode ? "#94a3b8" : "text.secondary",
                            }}
                          >
                            الحد الأقصى: 5 ميجابايت (JPG, PNG)
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => imageInputRef.current?.click()}
                            startIcon={<ImageIcon />}
                            sx={{
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                              background:
                                "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                            }}
                          >
                            اختيار صورة
                          </Button>
                        </Box>
                      )}
                    </Paper>
                  </Box>

                  <Divider sx={{ mb: 4 }} />

                  {/* Course Info */}
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ mb: 3, color: darkMode ? "#f1f5f9" : "inherit" }}
                  >
                    معلومات الكورس
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Title */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        name="title"
                        label="عنوان الكورس"
                        value={courseData.title}
                        onChange={handleChange}
                        placeholder="مثال: الرياضيات - الصف الأول الثانوي"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                        InputProps={{
                          sx: { fontFamily: "Cairo, sans-serif" },
                        }}
                      />
                    </Grid>

                    {/* Description */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        name="description"
                        label="وصف الكورس"
                        value={courseData.description}
                        onChange={handleChange}
                        placeholder="اكتب وصفاً تفصيلياً عن محتوى الكورس..."
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                        InputProps={{
                          sx: { fontFamily: "Cairo, sans-serif" },
                        }}
                      />
                    </Grid>

                    {/* Category — locked to teacher's registered subject */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="التصنيف"
                        value={teacherSubject || ""}
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                            cursor: "default",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                      />
                    </Grid>

                    {/* Grade */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth required>
                        <InputLabel
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          }}
                        >
                          الصف الدراسي
                        </InputLabel>
                        <Select
                          name="grade"
                          value={courseData.grade}
                          onChange={handleChange}
                          label="الصف الدراسي"
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
                          {grades.map((grade) => (
                            <MenuItem key={grade} value={grade}>
                              <Typography
                                fontFamily="Cairo, sans-serif"
                                fontWeight={700}
                              >
                                {grade}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Level */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel
                          sx={{
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          }}
                        >
                          مستوى الصعوبة
                        </InputLabel>
                        <Select
                          name="level"
                          value={courseData.level}
                          onChange={handleChange}
                          label="مستوى الصعوبة"
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
                          {levels.map((level) => (
                            <MenuItem key={level} value={level}>
                              <Typography
                                fontFamily="Cairo, sans-serif"
                                fontWeight={700}
                              >
                                {level}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Price */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        name="price"
                        label="السعر (جنيه مصري)"
                        value={courseData.price}
                        onChange={handleChange}
                        placeholder="500"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                        InputProps={{
                          sx: { fontFamily: "Cairo, sans-serif" },
                        }}
                      />
                    </Grid>

                    {/* Duration */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        name="duration"
                        label="مدة الكورس (ساعة)"
                        value={courseData.duration}
                        onChange={handleChange}
                        placeholder="40"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                        InputProps={{
                          sx: { fontFamily: "Cairo, sans-serif" },
                        }}
                      />
                    </Grid>

                    {/* Subject */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="subject"
                        label="المادة (اختياري)"
                        value={courseData.subject}
                        onChange={handleChange}
                        placeholder="رياضيات"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "& fieldset": {
                              borderColor: darkMode ? "#334155" : undefined,
                            },
                          },
                          "& .MuiInputBase-input": {
                            color: darkMode ? "#f1f5f9" : undefined,
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Cairo, sans-serif",
                            color: darkMode ? "#94a3b8" : undefined,
                          },
                        }}
                        InputProps={{
                          sx: { fontFamily: "Cairo, sans-serif" },
                        }}
                      />
                    </Grid>

                    {/* Published Toggle */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={courseData.isPublished}
                            onChange={handleChange}
                            name="isPublished"
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#8b5cf6",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                {
                                  backgroundColor: "#8b5cf6",
                                },
                            }}
                          />
                        }
                        label={
                          <Typography
                            fontFamily="Cairo, sans-serif"
                            fontWeight={700}
                            sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                          >
                            نشر الكورس (متاح للطلاب)
                          </Typography>
                        }
                      />
                    </Grid>
                  </Grid>

                  {/* Action Buttons */}
                  <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/teacher/dashboard")}
                      disabled={loading}
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        borderColor: darkMode ? "#334155" : undefined,
                        color: darkMode ? "#f1f5f9" : "inherit",
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={
                        loading ? <CircularProgress size={20} /> : <Save />
                      }
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 900,
                        py: 1.5,
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)",
                        },
                      }}
                    >
                      {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Side Panel */}
          <Grid item xs={12} lg={4}>
            {/* Status Card */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  حالة الكورس
                </Typography>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  {courseData.isPublished ? (
                    <>
                      <CheckCircle sx={{ color: "#059669", fontSize: 20 }} />
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={700}
                        sx={{ color: "#059669" }}
                      >
                        منشور ومتاح للطلاب
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Warning sx={{ color: "#f59e0b", fontSize: 20 }} />
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={700}
                        sx={{ color: "#f59e0b" }}
                      >
                        غير منشور (مسودة)
                      </Typography>
                    </>
                  )}
                </Box>

                <Alert
                  severity={courseData.isPublished ? "success" : "warning"}
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  {courseData.isPublished
                    ? "الكورس متاح حالياً للطلاب ويمكنهم التسجيل فيه"
                    : "الكورس غير متاح للطلاب حالياً. قم بتفعيله من الأعلى"}
                </Alert>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  نصائح التحديث
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <CheckCircle
                      sx={{ color: "#059669", fontSize: 20, mt: 0.3 }}
                    />
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      استخدم صورة واضحة وجذابة للكورس
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <CheckCircle
                      sx={{ color: "#059669", fontSize: 20, mt: 0.3 }}
                    />
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      حدّث الوصف ليعكس المحتوى الحالي
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <CheckCircle
                      sx={{ color: "#059669", fontSize: 20, mt: 0.3 }}
                    />
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      تأكد من دقة السعر والمدة الزمنية
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <CheckCircle
                      sx={{ color: "#059669", fontSize: 20, mt: 0.3 }}
                    />
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                    >
                      راجع المحتوى قبل النشر للطلاب
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default EditCourse;
