// pages/CoursesPage.jsx
import { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  SearchRounded,
  SchoolRounded,
  PersonRounded,
  StarRounded,
  ArrowBackRounded,
  ChevronLeftRounded,
  ShoppingCartRounded,
  PlayCircleOutlineRounded,
  AccessTimeRounded,
  PeopleRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import coursesService from "../../services/courses.service";
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
  "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A":       { color: "#2563eb", gradient: GRADIENTS.blue },
  "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621":        { color: "#059669", gradient: GRADIENTS.green },
  "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621":        { color: "#db2777", gradient: GRADIENTS.pink },
  "\u0627\u0644\u0623\u062D\u064A\u0627\u0621":         { color: "#059669", gradient: GRADIENTS.green },
  "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629":   { color: "#f59e0b", gradient: GRADIENTS.orange },
  "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629": { color: "#2563eb", gradient: GRADIENTS.blue },
  "\u0627\u0644\u062A\u0627\u0631\u064A\u062E":         { color: "#7c3aed", gradient: GRADIENTS.purple },
  "\u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A\u0627":       { color: "#0891b2", gradient: GRADIENTS.cyan },
  "\u0627\u0644\u0641\u0644\u0633\u0641\u0629":         { color: "#7c3aed", gradient: GRADIENTS.purple },
};

const getSubjectStyle = (category) =>
  SUBJECT_COLORS[category] || { color: "#2563eb", gradient: GRADIENTS.blue };

const formatCourse = (c) => {
  const style = getSubjectStyle(c.category);
  return {
    id:            c.id,
    title:         c.title,
    subject:       c.category || '',
    description:   c.description || '',
    price:         c.price || 0,
    oldPrice:      0,
    duration:      c.duration ? `${c.duration} ساعة` : '',
    lessonsCount:  c.stats?.lessons ?? 0,
    studentsCount: c.stats?.enrollments ?? 0,
    rating:        0,
    level:         c.level || '',
    color:         style.color,
    gradient:      style.gradient,
    tags:          [],
    completionRate: 0,
    teacher: c.teacher ? {
      id:      c.teacher.id,
      userId:  c.teacher.userId,
      name:    c.teacher.name || 'مدرس',
      rating:  0,
      students: 0,
    } : { id: '', name: 'مدرس', rating: 0, students: 0 },
  };
};

const SUBJECTS = [
  "الكل",
  "الرياضيات",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "التاريخ",
  "الجغرافيا",
  "الفلسفة",
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const CoursesPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("الكل");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await coursesService.getPublishedCourses();
        const raw = res.data?.data?.courses || [];
        const formatted = raw.map(formatCourse);
        setCourses(formatted);
        // Fetch real teacher ratings in background
        const uniqueTeachers = [...new Map(formatted.map(c => [c.teacher.id, c.teacher])).values()].filter(t => t.id);
        if (uniqueTeachers.length) {
          Promise.allSettled(
            uniqueTeachers.map(t => API.get(`/students/rate/teacher/${t.id}`))
          ).then(results => {
            const ratingMap = {};
            uniqueTeachers.forEach((t, i) => {
              const r = results[i];
              if (r.status === 'fulfilled' && r.value.data?.data) {
                ratingMap[t.id] = r.value.data.data.averageRating;
              }
            });
            setCourses(prev => prev.map(c => ({
              ...c,
              teacher: { ...c.teacher, rating: ratingMap[c.teacher.id] ?? c.teacher.rating }
            })));
          });
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    let filtered = [...courses];

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.includes(searchQuery) ||
          course.teacher.name.includes(searchQuery) ||
          course.subject.includes(searchQuery) ||
          course.description.includes(searchQuery),
      );
    }

    if (selectedSubject !== "الكل") {
      filtered = filtered.filter((course) => course.subject === selectedSubject);
    }

    return filtered;
  }, [searchQuery, selectedSubject, courses]);

  const handleBuy = (e, course) => {
  e.stopPropagation();
  navigate("/checkout", {
    state: {
      item: course,
      itemType: "course",
    },
  });
};

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
        sx={{ background: GRADIENTS.main, color: "white", pt: 3, pb: 4, px: 2 }}
      >
        <Container maxWidth="xl">
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
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
              >
                🎓 الكورسات التعليمية
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.9 }}
              >
                دروس مشروحة بالفيديو مع أفضل المدرسين في كل المواد
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Filters */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                placeholder="ابحث عن كورس أو مدرس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: darkMode ? "#334155" : "#f8fafc",
                    borderRadius: 2,
                    fontFamily: "Cairo, sans-serif",
                    "& fieldset": {
                      borderColor: darkMode ? "#475569" : "#e5e7eb",
                    },
                  },
                  "& input": { color: darkMode ? "#f1f5f9" : "#1e293b" },
                }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    fontFamily: "Cairo, sans-serif",
                    color: darkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  المادة
                </InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="المادة"
                  sx={{
                    bgcolor: darkMode ? "#334155" : "#f8fafc",
                    borderRadius: 2,
                    fontFamily: "Cairo, sans-serif",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                  }}
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem
                      key={subject}
                      value={subject}
                      sx={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} md={3} />
          </Grid>
        </Card>

        {/* Results Count */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            {loading ? 'جاري التحميل...' : `عرض ${filteredCourses.length} كورس`}
          </Typography>
        </Box>

        {/* Courses Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {[1,2,3,4,5,6].map((i) => (
              <Grid item xs={12} sm={6} lg={4} key={i}>
                <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
                  <Skeleton variant="rectangular" height={180} />
                  <Box sx={{ p: 2.5 }}>
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="rectangular" height={40} sx={{ mt: 2, borderRadius: 1 }} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : filteredCourses.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
            }}
          >
            <Typography variant="h1" sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}>
              🎓
            </Typography>
            <Typography
              variant="h6"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              لا توجد كورسات تطابق البحث
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredCourses.map((course, index) => (
              <Grid item xs={12} sm={6} lg={4} key={course.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 3,
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: course.color,
                        transform: "translateY(-8px)",
                        boxShadow: darkMode
                          ? `0 20px 40px rgba(0,0,0,0.5)`
                          : `0 20px 40px ${course.color}20`,
                        bgcolor: darkMode ? "#253449" : "white",
                      },
                    }}
                  >
                    {/* Course Header */}
                    <Box
                      sx={{
                        background: course.gradient,
                        p: 3,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.1)",
                        }}
                      />

                      {/* Price Badge */}
                      <Box sx={{ position: "absolute", top: 12, left: 12 }}>
                        <Typography
                          variant="h6"
                          fontWeight={900}
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: "white",
                            bgcolor: "rgba(0,0,0,0.2)",
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          {course.price} جنيه
                        </Typography>
                        {course.oldPrice > 0 && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "white",
                              textDecoration: "line-through",
                              opacity: 0.7,
                              fontFamily: "Cairo, sans-serif",
                              display: "block",
                              textAlign: "center",
                              mt: 0.5,
                            }}
                          >
                            {course.oldPrice} جنيه
                          </Typography>
                        )}
                      </Box>

                      {/* Subject Badge */}
                      <Chip
                        label={course.subject}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                        }}
                      />

                      {/* Course Icon */}
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                          mt: 5,
                        }}
                      >
                        <SchoolRounded sx={{ fontSize: 32, color: "white" }} />
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: "white", mb: 1 }}
                      >
                        {course.title}
                      </Typography>

                      {/* Level Badge */}
                      <Chip
                        label={course.level}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.15)",
                          color: "white",
                          fontFamily: "Cairo, sans-serif",
                          fontSize: "0.7rem",
                        }}
                      />
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      {/* Teacher - Clickable */}
                      <Box
                        onClick={() => navigate(`/teacher/${course.teacher.id}`)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: darkMode ? "#334155" : `${course.color}08`,
                          mb: 2,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: darkMode ? "#475569" : `${course.color}15`,
                            transform: "translateX(-5px)",
                          },
                        }}
                      >
                        <Avatar
                          sx={{ width: 40, height: 40, bgcolor: course.color }}
                        >
                          <PersonRounded />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                          >
                            {course.teacher.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <StarRounded
                              sx={{ fontSize: 14, color: "#fbbf24" }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                            >
                              {course.teacher.rating}
                            </Typography>
                          </Box>
                        </Box>
                        <ChevronLeftRounded
                          sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                        />
                      </Box>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{
                          color: darkMode ? "#94a3b8" : "#64748b",
                          mb: 2,
                          lineHeight: 1.6,
                          height: 48,
                          overflow: "hidden",
                        }}
                      >
                        {course.description}
                      </Typography>

                      {/* Stats */}
                      <Grid container spacing={1} sx={{ mb: 2 }}>
                        <Grid item xs={4}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <PlayCircleOutlineRounded
                              sx={{
                                fontSize: 18,
                                color: darkMode ? "#64748b" : "#94a3b8",
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={600}
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {course.lessonsCount}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                fontSize: "0.65rem",
                              }}
                            >
                              درس
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <AccessTimeRounded
                              sx={{
                                fontSize: 18,
                                color: darkMode ? "#64748b" : "#94a3b8",
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={600}
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {course.duration}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                fontSize: "0.65rem",
                              }}
                            >
                              مدة
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <PeopleRounded
                              sx={{
                                fontSize: 18,
                                color: darkMode ? "#64748b" : "#94a3b8",
                              }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={600}
                              sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                            >
                              {course.studentsCount > 999 ? `${(course.studentsCount / 1000).toFixed(1)}K` : course.studentsCount}
                            </Typography>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                                fontSize: "0.65rem",
                              }}
                            >
                              طالب
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          endIcon={<ArrowBackRounded />}
                          onClick={() => navigate(`/courses/${course.id}`)}
                          sx={{
                            flex: 1,
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
                          التفاصيل
                        </Button>

                        <Button
                          variant="contained"
                          startIcon={<ShoppingCartRounded />}
                          onClick={(e) => handleBuy(e, course)}

                          sx={{
                            flex: 1,
                            background: course.gradient,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            borderRadius: 2,
                            boxShadow: "none",
                            "&:hover": {
                              boxShadow: `0 8px 20px ${course.color}40`,
                            },
                            "&.Mui-disabled": {
                              background: darkMode ? "#334155" : "#e5e7eb",
                              color: darkMode ? "#64748b" : "#94a3b8",
                            },
                          }}
                        >
                        اشترك الأن
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default CoursesPage;
