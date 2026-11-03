// pages/CourseDetailsPage.jsx
import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Rating,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  ArrowBackRounded,
  SchoolRounded,
  PersonRounded,
  StarRounded,
  ShoppingCartRounded,
  PlayCircleOutlineRounded,
  AccessTimeRounded,
  PeopleRounded,
  CheckCircleRounded,
  ChevronLeftRounded,
  PlayArrowRounded,
  LockRounded,
  EmojiEventsRounded,
  TrendingUpRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import API from "../../services/api";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  green: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  orange: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  pink: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
  cyan: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
};

const SUBJECT_COLORS = {
  "الرياضيات":       { color: "#2563eb", gradient: GRADIENTS.blue },
  "الفيزياء":        { color: "#059669", gradient: GRADIENTS.green },
  "الكيمياء":        { color: "#db2777", gradient: GRADIENTS.pink },
  "الأحياء":         { color: "#059669", gradient: GRADIENTS.green },
  "اللغة العربية":   { color: "#f59e0b", gradient: GRADIENTS.orange },
  "اللغة الإنجليزية": { color: "#2563eb", gradient: GRADIENTS.blue },
  "التاريخ":         { color: "#7c3aed", gradient: GRADIENTS.purple },
  "الجغرافيا":       { color: "#0891b2", gradient: GRADIENTS.cyan },
  "الفلسفة":         { color: "#7c3aed", gradient: GRADIENTS.purple },
};

const getSubjectStyle = (category) =>
  SUBJECT_COLORS[category] || { color: "#2563eb", gradient: GRADIENTS.blue };

const formatCourseDetail = (c) => {
  const style = getSubjectStyle(c.category);
  return {
    id:            c.id,
    title:         c.title,
    subject:       c.category || '',
    description:   c.description || '',
    price:         c.price || 0,
    duration:      c.duration ? `${c.duration} ساعة` : '',
    lessonsCount:  c.stats?.lessons ?? 0,
    studentsCount: c.stats?.enrollments ?? 0,
    level:         c.level || '',
    color:         style.color,
    gradient:      style.gradient,
    features:      [],
    requirements:  c.prerequisites || [],
    curriculum:    (c.lessons || []).map((l, i) => ({
      id:       l.id,
      title:    l.title,
      isFree:   i < 2,
      duration: '',
      order:    l.order || i + 1,
    })),
    teacher: c.teacher ? {
      id:      c.teacher.id,
      userId:  c.teacher.userId,
      name:    c.teacher.name || 'مدرس',
      avatar:  c.teacher.avatar,
      rating:  0,
      students: 0,
      bio:     '',
      qualifications: [],
    } : { id: '', name: 'مدرس', rating: 0, students: 0, bio: '', qualifications: [] },
  };
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const CourseDetailsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courseRatingData, setCourseRatingData] = useState({ averageRating: 0, totalRatings: 0, myRating: null });
  const [courseRatingLoading, setCourseRatingLoading] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/courses/public/${courseId}`);
        const raw = res.data?.data;
        if (raw) {
          setCourse(formatCourseDetail(raw));
        } else {
          setCourse(null);
        }
      } catch (err) {
        console.error('Failed to fetch course:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();

    API.get(`/students/rate/course/${courseId}`)
      .then(res => {
        const data = res.data?.data;
        if (data) setCourseRatingData(data);
      })
      .catch(() => {});
  }, [courseId]);

  const handleBuy = () => {
    if (!course) return;
    navigate("/checkout", {
      state: {
        item: course,
        itemType: "course",
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", pb: 4 }}>
        <Skeleton variant="rectangular" height={300} />
        <Container maxWidth="lg" sx={{ mt: -4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 3 }} />)}
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h1" sx={{ fontSize: 80, mb: 2 }}>🎓</Typography>
          <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
            الكورس غير موجود
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/courses")}
            sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}
          >
            العودة للكورسات
          </Button>
        </Box>
      </Box>
    );
  }

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
          background: course.gradient,
          color: "white",
          pt: 3,
          pb: 8,
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
          {/* Back Button */}
          <IconButton
            onClick={() => navigate("/courses")}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              mb: 3,
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <ArrowForwardRounded />
          </IconButton>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              {/* Subject Badge */}
              <Chip
                label={course.subject}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 600,
                  mb: 2,
                }}
              />

              {/* Title */}
              <Typography
                variant="h3"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
                sx={{ mb: 2 }}
              >
                {course.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.95, mb: 3, lineHeight: 1.8 }}
              >
                {course.description}
              </Typography>

              {/* Stats */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleRounded sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    {course.studentsCount.toLocaleString()} طالب
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccessTimeRounded sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    {course.duration}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlayCircleOutlineRounded sx={{ fontSize: 20 }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    {course.lessonsCount} درس
                  </Typography>
                </Box>
              </Box>

              {/* Teacher Info - Clickable */}
              <Box
                onClick={() => navigate(`/teacher/${course.teacher.id}`)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.25)",
                    transform: "translateX(-5px)",
                  },
                }}
              >
                <Avatar sx={{ width: 50, height: 50, bgcolor: "rgba(255,255,255,0.3)" }}>
                  <PersonRounded />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    fontFamily="Cairo, sans-serif"
                    sx={{ opacity: 0.8 }}
                  >
                    المدرس
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                  >
                    {course.teacher.name}
                  </Typography>
                </Box>
                <ChevronLeftRounded />
              </Box>
            </Grid>

            {/* Price Card */}
            <Grid item xs={12} md={4}>
              <Card
                elevation={3}
                sx={{
                  bgcolor: "white",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Price */}
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography
                      variant="h3"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: course.color }}
                    >
                      {course.price} جنيه
                    </Typography>
                  </Box>

                  {/* Buy Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCartRounded />}
                    onClick={handleBuy}
                    sx={{
                      background: course.gradient,
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                      py: 1.5,
                      borderRadius: 2,
                      mb: 2,
                      boxShadow: "none",
                      "&:hover": {
                        boxShadow: `0 8px 20px ${course.color}40`,
                      },
                    }}
                  >
                    اشتري الآن
                  </Button>

                  <Typography
                    variant="caption"
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: "#64748b", textAlign: "center", display: "block" }}
                  >
                    ضمان استرجاع المال خلال 30 يوم
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -4, position: "relative", zIndex: 2 }}>
        <Grid container spacing={3}>
          {/* Right Column */}
          <Grid item xs={12} md={8}>
            {/* Requirements */}
            {course.requirements.length > 0 && (
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
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                  >
                    المتطلبات
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {course.requirements.map((req, index) => (
                      <ListItem key={index} sx={{ py: 1, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: course.color,
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                            >
                              {req}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Curriculum */}
            {course.curriculum.length > 0 && (
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
                        background: course.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlayCircleOutlineRounded sx={{ color: "white", fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                      >
                        محتوى الكورس
                      </Typography>
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        {course.lessonsCount} درس
                      </Typography>
                    </Box>
                  </Box>

                  <List sx={{ p: 0 }}>
                    {course.curriculum.map((lesson, lessonIndex) => (
                      <ListItem
                        key={lesson.id}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderRadius: 2,
                          mb: 0.5,
                          "&:hover": {
                            bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {lesson.isFree ? (
                            <PlayArrowRounded
                              sx={{ fontSize: 20, color: "#059669" }}
                            />
                          ) : (
                            <LockRounded
                              sx={{ fontSize: 20, color: "#94a3b8" }}
                            />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#e2e8f0" : "#475569" }}
                            >
                              {lesson.title}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {lesson.isFree && (
                            <Chip
                              label="مجاني"
                              size="small"
                              sx={{
                                bgcolor: "#dcfce7",
                                color: "#059669",
                                fontFamily: "Cairo, sans-serif",
                                fontSize: "0.65rem",
                                height: 20,
                              }}
                            />
                          )}
                          {lesson.duration && (
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                            >
                              {lesson.duration}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {course.features.length > 0 && (
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
                        background: course.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <EmojiEventsRounded sx={{ color: "white", fontSize: 28 }} />
                    </Box>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      ماذا ستتعلم؟
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    {course.features.map((feature, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ display: "flex", alignItems: "start", gap: 1.5 }}>
                          <CheckCircleRounded
                            sx={{ fontSize: 20, color: "#059669", mt: 0.3 }}
                          />
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#e2e8f0" : "#475569" }}
                          >
                            {feature}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Left Column */}
          <Grid item xs={12} md={4}>
            {/* Teacher Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              {/* Header with gradient */}
              <Box
                sx={{
                  background: course.gradient,
                  p: 3,
                  textAlign: "center",
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: "auto",
                    mb: 2,
                    bgcolor: "rgba(255,255,255,0.2)",
                    border: "3px solid white",
                  }}
                >
                  <PersonRounded sx={{ fontSize: 40, color: "white" }} />
                </Avatar>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "white", mb: 0.5 }}
                >
                  {course.teacher.name}
                </Typography>
              </Box>

              <CardContent sx={{ p: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowBackRounded />}
                  onClick={() => navigate(`/teacher/${course.teacher.id}`)}
                  sx={{
                    mt: 2,
                    borderColor: course.color,
                    color: course.color,
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    borderRadius: 2,
                    "&:hover": {
                      borderColor: course.color,
                      bgcolor: `${course.color}10`,
                    },
                  }}
                >
                  الملف الشخصي
                </Button>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                >
                  إحصائيات الكورس
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      borderRadius: 2,
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <TrendingUpRounded sx={{ fontSize: 20, color: course.color }} />
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        المستوى
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {course.level}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      borderRadius: 2,
                      bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <SchoolRounded sx={{ fontSize: 20, color: course.color }} />
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        المادة
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                    >
                      {course.subject}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Course Rating */}
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
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                >
                  تقييم الكورس
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Rating
                    name="course-rating"
                    value={courseRatingData.myRating || 0}
                    precision={1}
                    onChange={async (_, value) => {
                      setCourseRatingLoading(true);
                      setCourseRatingData(prev => ({ ...prev, myRating: value }));
                      try {
                        await API.post(`/students/rate/course/${courseId}`, { rating: value });
                        const res = await API.get(`/students/rate/course/${courseId}`);
                        if (res.data?.data) setCourseRatingData(res.data.data);
                      } catch (_) {}
                      setCourseRatingLoading(false);
                    }}
                    disabled={courseRatingLoading}
                    sx={{ color: "#fbbf24" }}
                  />
                </Box>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  متوسط التقييم: {courseRatingData.averageRating.toFixed(1)} ⭐
                  ({courseRatingData.totalRatings} تقييم)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CourseDetailsPage;
