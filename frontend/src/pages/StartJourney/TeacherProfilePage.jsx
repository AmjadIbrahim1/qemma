// pages/StartJourney/TeacherProfilePage.jsx
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
  Avatar,
  IconButton,
  Chip,
  Divider,
  Tab,
  Tabs,
  Rating,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  TextField,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  PersonRounded,
  StarRounded,
  SchoolRounded,
  MenuBookRounded,
  PlayCircleOutlineRounded,
  PeopleRounded,
  EmojiEventsRounded,
  CheckCircleRounded,
  FacebookRounded,
  YouTube,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  TrendingUpRounded,
  VerifiedRounded,
  WorkspacePremiumRounded,
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
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const formatProfile = (data) => ({
  id:           data.userId,
  teacherId:    data.id,
  name:         data.name || 'مدرس',
  title:        data.specialties?.[0] ? `مدرس ${data.specialties[0]}` : 'مدرس',
  specialization: data.specialties?.join(' - ') || 'عام',
  rating:       data.ratingAvg || 0,
  reviewsCount: 0,
  studentsCount: data.courses.reduce((s, c) => s + (c.studentsCount || 0), 0),
  verified:     data.verified || false,
  coursesCount: data.coursesCount || data.courses?.length || 0,
  booksCount:   data.booksCount || data.books?.length || 0,
  yearsOfExperience: 0,
  bio:          data.bio || 'لا توجد سيرة ذاتية',
  qualifications: [],
  achievements: [],
  subjects:     data.specialties || [],
  contact: {
    email:    data.email || '',
    phone:    data.phone || '',
    location: '',
  },
  stats: {
    totalHours:     0,
    completionRate: 0,
    responseTime:   '',
    satisfaction:   0,
  },
  courses: (data.courses || []).map(c => ({
    id:       c.id,
    title:    c.title,
    price:    c.price,
    students: c.studentsCount || 0,
    rating:   c.ratingAvg || 0,
    category: c.category || '',
    level:    c.level || '',
  })),
  books: (data.books || []).map(b => ({
    id:        b.id,
    title:     b.title,
    price:     b.price,
    downloads: b.purchases || 0,
    rating:    0,
    subject:   b.subject || '',
  })),
  reviews: [],
});

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const TeacherProfilePage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { teacherId } = useParams();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [teacherRatingData, setTeacherRatingData] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchRating = async (teacherId) => {
    try {
      const res = await API.get(`/students/rate/teacher/${teacherId}`);
      const data = res.data?.data || null;
      setTeacherRatingData(data);
      if (data?.myRating) setUserRating(data.myRating.rating);
    } catch (_) {}
  };

  const fetchCourseRatings = async (courses) => {
    const results = await Promise.allSettled(
      courses.map(c => API.get(`/students/rate/course/${c.id}`))
    );
    return courses.map((c, i) => {
      const res = results[i];
      if (res.status === 'fulfilled' && res.value.data?.data) {
        return { ...c, rating: res.value.data.data.averageRating };
      }
      return c;
    });
  };

  const fetchBookRatings = async (books) => {
    const results = await Promise.allSettled(
      books.map(b => API.get(`/students/rate/book/${b.id}`))
    );
    return books.map((b, i) => {
      const res = results[i];
      if (res.status === 'fulfilled' && res.value.data?.data) {
        return { ...b, rating: res.value.data.data.averageRating };
      }
      return b;
    });
  };

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);
        setError(null);
        // Try as Teacher.id first, fallback to User.id
        let res;
        try {
          res = await API.get(`/courses/teacher/${teacherId}`);
        } catch {
          // Try as User.id
          res = await API.get(`/courses/teacher-by-user/${teacherId}`);
        }
        const data = res.data?.data;
        if (!data) {
          setError('المدرس غير موجود');
          return;
        }
        const formatted = formatProfile(data);
        setTeacher(formatted);
        fetchRating(data.id);
        // Fetch real ratings for courses and books in background
        Promise.all([
          fetchCourseRatings(formatted.courses),
          fetchBookRatings(formatted.books),
        ]).then(([courses, books]) => {
          setTeacher(prev => prev ? { ...prev, courses, books } : prev);
        });
      } catch (err) {
        console.error('Failed to fetch teacher profile:', err);
        setError('فشل تحميل بيانات المدرس');
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [teacherId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", p: 4 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={250} sx={{ borderRadius: 3, mb: 3 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
        </Container>
      </Box>
    );
  }

  if (error || !teacher) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h1" sx={{ fontSize: 80, mb: 2 }}>👨‍🏫</Typography>
          <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
            {error || 'المدرس غير موجود'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}
          >
            العودة
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
      {/* Header with Cover */}
      <Box
        sx={{
          background: GRADIENTS.main,
          color: "white",
          pt: 3,
          pb: 12,
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          {/* Back Button */}
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              mb: 3,
              "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
            }}
          >
            <ArrowForwardRounded />
          </IconButton>

          {/* Teacher Basic Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Avatar
                src={teacher.avatar || undefined}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  bgcolor: "#6366f1",
                }}
              >
                {!teacher.avatar && <PersonRounded sx={{ fontSize: 60 }} />}
              </Avatar>
            </motion.div>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                >
                  {teacher.name}
                </Typography>
                {teacher.verified && (
                  <VerifiedRounded sx={{ fontSize: 32, color: "#fbbf24" }} />
                )}
              </Box>

              <Typography
                variant="h6"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.95, mb: 2 }}
              >
                {teacher.title} • {teacher.specialization}
              </Typography>

              {/* Stats */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <StarRounded sx={{ fontSize: 24, color: "#fbbf24" }} />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                  >
                    {teacher.rating}
                  </Typography>
                  {teacher.reviewsCount > 0 && (
                    <Typography variant="body2" fontFamily="Cairo, sans-serif">
                      ({teacher.reviewsCount.toLocaleString()} تقييم)
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PeopleRounded sx={{ fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                  >
                    {teacher.studentsCount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    طالب
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SchoolRounded sx={{ fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                  >
                    {teacher.coursesCount}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    كورسات
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MenuBookRounded sx={{ fontSize: 24 }} />
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    fontFamily="Cairo, sans-serif"
                  >
                    {teacher.booksCount}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif">
                    كتب
                  </Typography>
                </Box>
                {teacher.yearsOfExperience > 0 && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 24 }} />
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                    >
                      {teacher.yearsOfExperience}
                    </Typography>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif">
                      سنة خبرة
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -6, position: "relative", zIndex: 2 }}>
        <Grid container spacing={3}>
          {/* Left Column - Main Content */}
          <Grid item xs={12} md={8}>
            {/* Tabs */}
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
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  borderBottom: 1,
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  "& .MuiTab-root": {
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    color: darkMode ? "#94a3b8" : "#64748b",
                    "&.Mui-selected": {
                      color: "#2563eb",
                    },
                  },
                }}
              >
                <Tab label="نبذة عني" />
                <Tab label="الكورسات" />
                <Tab label="الكتب" />
                <Tab label="التقييمات" />
              </Tabs>

              <CardContent sx={{ p: 3 }}>
                {/* Tab 0: About */}
                {activeTab === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                    >
                      عن المدرس
                    </Typography>
                    <Typography
                      variant="body1"
                      fontFamily="Cairo, sans-serif"
                      sx={{
                        color: darkMode ? "#94a3b8" : "#64748b",
                        lineHeight: 2,
                        mb: 3,
                      }}
                    >
                      {teacher.bio}
                    </Typography>

                    {teacher.qualifications.length > 0 && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                        >
                          المؤهلات
                        </Typography>
                        <List sx={{ p: 0 }}>
                          {teacher.qualifications.map((qual, index) => (
                            <ListItem key={index} sx={{ py: 1, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircleRounded sx={{ fontSize: 20, color: "#059669" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#e2e8f0" : "#475569" }}>
                                    {qual}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}

                    {teacher.achievements.length > 0 && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                        >
                          الإنجازات
                        </Typography>
                        <List sx={{ p: 0 }}>
                          {teacher.achievements.map((achievement, index) => (
                            <ListItem key={index} sx={{ py: 1, px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <EmojiEventsRounded sx={{ fontSize: 20, color: "#f59e0b" }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#e2e8f0" : "#475569" }}>
                                    {achievement}
                                  </Typography>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}

                    {teacher.subjects.length > 0 && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}
                        >
                          المواد التي أدرسها
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {teacher.subjects.map((subject) => (
                            <Chip
                              key={subject}
                              label={subject}
                              sx={{
                                bgcolor: darkMode ? "#334155" : "#f1f5f9",
                                color: darkMode ? "#e2e8f0" : "#475569",
                                fontFamily: "Cairo, sans-serif",
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Tab 1: Courses */}
                {activeTab === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      كورسات المدرس ({teacher.courses.length})
                    </Typography>
                    {teacher.courses.length === 0 ? (
                      <Typography
                        variant="body1"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b", textAlign: "center", py: 4 }}
                      >
                        لا توجد كورسات متاحة حالياً
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {teacher.courses.map((course) => (
                          <Grid item xs={12} key={course.id}>
                            <Paper
                              onClick={() => navigate(`/courses/${course.id}`)}
                              sx={{
                                p: 2.5,
                                cursor: "pointer",
                                border: "1px solid",
                                borderColor: darkMode ? "#334155" : "#e5e7eb",
                                bgcolor: darkMode ? "#0f172a" : "white",
                                borderRadius: 2,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: "#2563eb",
                                  transform: "translateX(-5px)",
                                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}>
                                    {course.title}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <StarRounded sx={{ fontSize: 16, color: "#fbbf24" }} />
                                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                        {course.rating || 0}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <PeopleRounded sx={{ fontSize: 16, color: darkMode ? "#64748b" : "#94a3b8" }} />
                                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                        {course.students.toLocaleString()} طالب
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={course.category || course.level}
                                      size="small"
                                      sx={{ height: 20, fontSize: 10, bgcolor: darkMode ? "#334155" : "#f1f5f9", color: darkMode ? "#94a3b8" : "#64748b", fontFamily: "Cairo, sans-serif" }}
                                    />
                                  </Box>
                                </Box>
                                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: "#2563eb" }}>
                                  {course.price} جنيه
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </motion.div>
                )}

                {/* Tab 2: Books */}
                {activeTab === 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                    >
                      كتب المدرس ({teacher.books.length})
                    </Typography>
                    {teacher.books.length === 0 ? (
                      <Typography
                        variant="body1"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b", textAlign: "center", py: 4 }}
                      >
                        لا توجد كتب متاحة حالياً
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {teacher.books.map((book) => (
                          <Grid item xs={12} key={book.id}>
                            <Paper
                              onClick={() => navigate(`/teachers-books/${book.id}`)}
                              sx={{
                                p: 2.5,
                                cursor: "pointer",
                                border: "1px solid",
                                borderColor: darkMode ? "#334155" : "#e5e7eb",
                                bgcolor: darkMode ? "#0f172a" : "white",
                                borderRadius: 2,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: "#7c3aed",
                                  transform: "translateX(-5px)",
                                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}>
                                    {book.title}
                                  </Typography>
                                  <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <StarRounded sx={{ fontSize: 16, color: "#fbbf24" }} />
                                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                        {book.rating || 0}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                      <PlayCircleOutlineRounded sx={{ fontSize: 16, color: darkMode ? "#64748b" : "#94a3b8" }} />
                                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                                        {book.downloads.toLocaleString()} تحميل
                                      </Typography>
                                    </Box>
                                    {book.subject && (
                                      <Chip
                                        label={book.subject}
                                        size="small"
                                        sx={{ height: 20, fontSize: 10, bgcolor: darkMode ? "#334155" : "#f1f5f9", color: darkMode ? "#94a3b8" : "#64748b", fontFamily: "Cairo, sans-serif" }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: "#7c3aed" }}>
                                  {book.price} جنيه
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </motion.div>
                )}

                {/* Tab 3: Reviews */}
                {activeTab === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Average Rating */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                          {teacherRatingData?.averageRating?.toFixed(1) || 0}
                        </Typography>
                        <Rating value={teacherRatingData?.averageRating || 0} precision={0.5} readOnly size="medium" sx={{ color: "#fbbf24" }} />
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", display: "block" }}>
                          ({teacherRatingData?.totalRatings || 0} تقييم)
                        </Typography>
                      </Box>
                    </Box>

                    {/* Submit Rating */}
                    <Card elevation={0} sx={{ mb: 3, p: 2.5, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#0f172a" : "white", borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
                        تقييمك للمدرس
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <Rating
                          name="teacher-rating"
                          value={userRating}
                          onChange={(_, value) => setUserRating(value || 0)}
                          size="large"
                          sx={{ color: "#fbbf24" }}
                        />
                        {userRating > 0 && (
                          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                            {userRating} / 5
                          </Typography>
                        )}
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="أكتب تعليقك (اختياري)"
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}
                      />
                      <Button
                        variant="contained"
                        disabled={userRating === 0 || submittingRating}
                        onClick={async () => {
                          setSubmittingRating(true);
                          try {
                            await API.post(`/students/rate/teacher/${teacher.teacherId}`, { rating: userRating, comment: ratingComment });
                            fetchRating(teacher.teacherId);
                            setUserRating(0);
                            setRatingComment('');
                          } catch (_) {}
                          setSubmittingRating(false);
                        }}
                        sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                      >
                        {submittingRating ? <CircularProgress size={20} color="inherit" /> : 'إرسال التقييم'}
                      </Button>
                    </Card>

                    {/* Rating List */}
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}>
                      تقييمات الطلاب ({teacherRatingData?.reviews?.length || 0})
                    </Typography>
                    {!teacherRatingData?.reviews?.length ? (
                      <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", textAlign: "center", py: 4 }}>
                        لا توجد تقييمات متاحة حالياً
                      </Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {teacherRatingData.reviews.map((review, index) => (
                          <Paper
                            key={review.id || index}
                            sx={{
                              p: 2.5,
                              border: "1px solid",
                              borderColor: darkMode ? "#334155" : "#e5e7eb",
                              bgcolor: darkMode ? "#0f172a" : "white",
                              borderRadius: 2,
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1 }}>
                              <Box>
                                <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                                  {review.studentName}
                                </Typography>
                                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}>
                                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ar-EG') : ''}
                                </Typography>
                              </Box>
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
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Contact Card */}
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
                  sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}
                >
                  معلومات التواصل
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {teacher.contact.email && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Email sx={{ fontSize: 20, color: darkMode ? "#64748b" : "#94a3b8" }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                        {teacher.contact.email}
                      </Typography>
                    </Box>
                  )}
                  {teacher.contact.phone && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Phone sx={{ fontSize: 20, color: darkMode ? "#64748b" : "#94a3b8" }} />
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                        {teacher.contact.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Stats Card */}
            {teacher.yearsOfExperience > 0 && (
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
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 3 }}>
                    إحصائيات المدرس
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          معدل الإتمام
                        </Typography>
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                          {teacher.stats.completionRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={teacher.stats.completionRate}
                        sx={{ height: 8, borderRadius: 1, bgcolor: darkMode ? "#334155" : "#e5e7eb", "& .MuiLinearProgress-bar": { background: GRADIENTS.blue, borderRadius: 1 } }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          رضا الطلاب
                        </Typography>
                        <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                          {teacher.stats.satisfaction}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={teacher.stats.satisfaction}
                        sx={{ height: 8, borderRadius: 1, bgcolor: darkMode ? "#334155" : "#e5e7eb", "& .MuiLinearProgress-bar": { background: GRADIENTS.green, borderRadius: 1 } }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Badge Card */}
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
              <Box sx={{ background: GRADIENTS.orange, p: 3, textAlign: "center" }}>
                <WorkspacePremiumRounded sx={{ fontSize: 48, color: "white", mb: 1 }} />
                <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: "white" }}>
                  مدرس معتمد
                </Typography>
              </Box>
              <CardContent sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  هذا المدرس معتمد من منصة قِمّة ويتمتع بسجل حافل من النجاحات مع الطلاب
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherProfilePage;
