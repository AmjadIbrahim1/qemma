// frontend/src/pages/parent/ChildDetails.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import parentsService from "../../services/parents.service";
import { extractPayload, safePercentage, safeProgressValue, safeNumber } from "../../utils/normalizeApiResponse";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Warning,
  Cancel,
  School,
  Assignment,
  BarChart,
  CalendarToday,
  Person,
  MenuBook,
} from "@mui/icons-material";

const ChildDetails = () => {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [childData, setChildData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [activities, setActivities] = useState([]);
  const [books, setBooks] = useState([]);

  // Fetch all real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [dashboardRes, coursesRes, tasksRes, examResultsRes, booksRes] = await Promise.all([
          parentsService.getChildDashboard(childId),
          parentsService.getChildCourses(childId),
          parentsService.getChildTasks(childId),
          parentsService.getChildExamResults(childId),
          parentsService.getChildBooks(childId),
        ]);

        const dashboard = extractPayload(dashboardRes);
        const student = dashboard.student || {};

        // ── Child info ─────────────────────────────────────────
        const kpis = Array.isArray(dashboard.kpis) ? dashboard.kpis : [];
        setChildData({
          id: childId,
          name: student.name || '',
          grade: student.stream || student.gradeLevel || '',
          avatar: (student.name || '?').charAt(0),
          email: student.email || '',
          phone: student.phone || '',
          averageGrade: (kpis.find(k => k.type === 'avgGrade' || k.type === 'averageGrade')?.value || '0').toString().replace('%', ''),
          attendance: (kpis.find(k => k.type === 'attendance')?.value || '0').toString().replace('%', ''),
          behaviorAlerts: dashboard.alerts?.filter(a => a.urgency === 'high')?.length || 0,
        });

        // ── Courses ────────────────────────────────────────────
        const coursesRaw = extractPayload(coursesRes, []);
        const coursesData = Array.isArray(coursesRaw) ? coursesRaw : [];
        setCourses(coursesData.map(c => ({
          id: c.id,
          name: c.title,
          teacher: c.teacher?.name || '',
          grade: 0, // Will be derived from exam results if available
          progress: c.progress || 0,
        })));

        // Derive course grades from exam results
        const examResultsRaw = extractPayload(examResultsRes, []);
        const examResults = Array.isArray(examResultsRaw) ? examResultsRaw : [];
        const courseGrades = {};
        examResults.forEach(er => {
          if (er.courseId) {
            if (!courseGrades[er.courseId]) courseGrades[er.courseId] = { total: 0, count: 0 };
            courseGrades[er.courseId].total += er.percentage || 0;
            courseGrades[er.courseId].count++;
          }
        });
        setCourses(prev => prev.map(c => ({
          ...c,
          grade: courseGrades[c.id] ? Math.round(courseGrades[c.id].total / courseGrades[c.id].count) : 0,
        })));

        // ── Assignments (real pending assignments from tasks) ────
        const tasks = extractPayload(tasksRes, {});
        const pendingAssignments = tasks?.pendingAssignments || [];
        setAssignments(pendingAssignments.map(a => ({
          id: a.id,
          course: a.courseName || '',
          title: a.title,
          dueDate: a.dueDate || '',
          maxScore: a.maxScore || 100,
          status: 'pending',
        })));
        // Graded assignments (completed with scores)
        const gradedAssignments = pendingAssignments
          .filter(a => a.submission?.score !== null && a.submission?.score !== undefined)
          .map(a => ({
            id: a.id,
            course: a.courseName || '',
            title: a.title,
            dueDate: a.dueDate || '',
            status: 'completed',
            grade: a.submission?.score || 0,
            maxGrade: a.maxScore || 100,
          }));
        setAssignments(prev => [...gradedAssignments, ...prev.filter(a => a.status !== 'completed')]);

        // ── Exams ──────────────────────────────────────────────
        const pendingExams = (tasks.pendingExams || []).map(e => ({
          id: e.id,
          course: e.courseName || '',
          title: e.title,
          date: e.availableFrom ? new Date(e.availableFrom).toLocaleDateString('ar-EG') : e.dueDate || '',
          time: e.availableFrom ? new Date(e.availableFrom).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '',
          totalMarks: e.totalMarks || 0,
          status: 'upcoming',
        }));
        const completedExams = (examResults || []).map(e => ({
          id: e.id,
          course: e.courseTitle || '',
          title: e.examTitle || '',
          date: e.submittedAt ? new Date(e.submittedAt).toLocaleDateString('ar-EG') : '',
          grade: safeNumber(e.percentage) || (e.totalMarks > 0 ? Math.round((e.score / e.totalMarks) * 100) : 0) || 0,
          score: e.score || 0,
          totalMarks: e.totalMarks || 0,
          status: 'completed',
        }));
        setExams([...completedExams, ...pendingExams]);

        // ── Books ───────────────────────────────────────────────
        const booksRaw = extractPayload(booksRes, []);
        setBooks(Array.isArray(booksRaw) ? booksRaw : []);

        // ── Activities (from notifications) ─────────────────────
        const notifs = dashboard.notifications || [];
        setActivities(notifs.slice(0, 10).map(n => ({
          id: n.id,
          type: n.type === 'exam' ? 'success' : n.type === 'assignment' ? 'warning' : n.type === 'live' ? 'info' : 'info',
          text: n.title || n.body || '',
          time: n.createdAt || n.time || 'منذ قليل',
        })));

      } catch (err) {
        console.error('Failed to fetch child details:', err);
        setError('فشل تحميل بيانات الطالب');
      } finally {
        setLoading(false);
      }
    };
    if (childId) fetchData();
  }, [childId]);

  const chipStyle = {
    bgcolor: darkMode ? "#334155" : "#2563eb",
    color: "#ffffff",
    fontFamily: "Cairo, sans-serif",
    fontWeight: 700,
    "& .MuiChip-icon": {
      color: "#ffffff",
    },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#f0fdf4", color: "#059669" };
      case "pending":
        return { bg: "#fffbeb", color: "#f59e0b" };
      case "upcoming":
        return { bg: "#eff6ff", color: "#2563eb" };
      default:
        return { bg: "#f9fafb", color: "#64748b" };
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle sx={{ color: "#059669" }} />;
      case "warning":
        return <Warning sx={{ color: "#f59e0b" }} />;
      case "error":
        return <Cancel sx={{ color: "#dc2626" }} />;
      default:
        return <CheckCircle sx={{ color: "#2563eb" }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
      {/* Header */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
          color: "white",
          py: 3,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <IconButton
              sx={{ color: "white" }}
              onClick={() => navigate("/parent/children")}
            >
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
            >
              تفاصيل الطالب
            </Typography>
          </Box>

          {/* Student Info Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: darkMode ? "#1e293b" : "#f1f5f9",
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "#2563eb",
                  fontSize: "2rem",
                  fontWeight: 900,
                  fontFamily: "Cairo, sans-serif",
                }}
              >
                {childData?.avatar}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 0.5, color: darkMode ? "#f1f5f9" : "#1e293b" }}
                >
                  {childData?.name}
                </Typography>
                <Typography
                  variant="body1"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#64748b", mb: 1 }}
                >
                  {childData?.grade || 'غير محدد'}
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {childData?.email && (
                    <Chip
                      icon={<Person />}
                      label={childData.email}
                      size="small"
                      sx={chipStyle}
                    />
                  )}
                  {childData?.phone && (
                    <Chip label={childData.phone} size="small" sx={chipStyle} />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: "#2563eb" }}
                  >
                    {safePercentage(childData?.averageGrade)}
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif">
                    المتوسط
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: "#059669" }}
                  >
                    {safePercentage(childData?.attendance)}
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif">
                    الحضور
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Tabs */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              borderBottom: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              "& .MuiTab-root": {
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                color: darkMode ? "#94a3b8" : "text.secondary",
              },
            }}
          >
            <Tab icon={<School />} label="الكورسات" iconPosition="start" />
            <Tab icon={<Assignment />} label="الواجبات" iconPosition="start" />
            <Tab icon={<BarChart />} label="الاختبارات" iconPosition="start" />
            <Tab icon={<MenuBook />} label="الكتب" iconPosition="start" />
            <Tab icon={<CalendarToday />} label="النشاط" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab Content: Courses */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} md={6} key={course.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "#2563eb",
                      transform: "translateY(-4px)",
                      boxShadow: darkMode
                        ? "0 8px 16px rgba(0,0,0,0.3)"
                        : "0 8px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                  onClick={() =>
                    navigate(`/parent/child/${childId}/course/${course.id}`)
                  }
                >
                  <CardContent>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      fontFamily="Cairo, sans-serif"
                      sx={{ mb: 1, color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      {course.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{
                        mb: 2,
                        color: darkMode ? "#64748b" : "text.secondary",
                      }}
                    >
                      {course.teacher || 'غير محدد'}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                      >
                        الدرجة: {safePercentage(course.grade, '-')}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                      >
                        التقدم: {safePercentage(course.progress)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={safeProgressValue(course.progress)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: darkMode ? "#334155" : "#e5e7eb",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: course.progress >= 80 ? "#059669" : "#f59e0b",
                          borderRadius: 4,
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {courses.length === 0 && (
              <Grid item xs={12}>
                <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={4}>
                  لا توجد كورسات مسجلة
                </Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* Tab Content: Assignments */}
        {activeTab === 1 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <List>
              {assignments.map((assignment, index) => (
                <ListItem
                  key={assignment.id}
                  sx={{
                    borderBottom:
                      index < assignments.length - 1 ? "1px solid" : "none",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={700}
                          sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                        >
                          {assignment.title}
                        </Typography>
                        <Chip
                          label={
                            assignment.status === "completed" ? "مكتمل" : "معلق"
                          }
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(assignment.status).bg,
                            color: getStatusColor(assignment.status).color,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#64748b" : "text.secondary",
                          }}
                        >
                          {assignment.course || ''}{assignment.dueDate ? ` • التسليم: ${assignment.dueDate}` : ''}
                        </Typography>
                        {assignment.grade && (
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            fontWeight={700}
                            sx={{ color: "#059669", mt: 0.5 }}
                          >
                            الدرجة: {safePercentage(assignment.grade, 'لا توجد درجة')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {assignments.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary">
                        لا توجد واجبات
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}

        {/* Tab Content: Exams */}
        {activeTab === 2 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <List>
              {exams.map((exam, index) => (
                <ListItem
                  key={exam.id}
                  sx={{
                    borderBottom:
                      index < exams.length - 1 ? "1px solid" : "none",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={700}
                          sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                        >
                          {exam.title}
                        </Typography>
                        <Chip
                          label={exam.status === "upcoming" ? "قادم" : "مكتمل"}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(exam.status).bg,
                            color: getStatusColor(exam.status).color,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#64748b" : "text.secondary",
                          }}
                        >
                          {exam.course || ''}{exam.date ? ` • ${exam.date}` : ''}{exam.time ? ` • ${exam.time}` : ''}
                        </Typography>
                        {exam.grade !== undefined && exam.grade !== 0 && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={700}
                              sx={{ color: "#059669" }}
                            >
                              الدرجة: {safePercentage(exam.grade, 'لا توجد درجة')}
                            </Typography>
                            {safeNumber(exam.grade) >= 80 ? (
                              <TrendingUp
                                sx={{ fontSize: 18, color: "#059669" }}
                              />
                            ) : (
                              <TrendingDown
                                sx={{ fontSize: 18, color: "#dc2626" }}
                              />
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              {exams.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary">
                        لا توجد اختبارات
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}

        {/* Tab Content: Books */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            {books.map((book) => (
              <Grid item xs={12} sm={6} md={4} key={book.id}>
                <Card elevation={0} sx={{
                  border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                  bgcolor: darkMode ? '#1e293b' : 'white', height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: darkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.1)' },
                }}>
                  {book.coverImage ? (
                    <CardMedia component="img" height="180" image={book.coverImage} alt={book.title}
                      sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ height: 180, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MenuBook sx={{ fontSize: 60, color: 'white', opacity: 0.5 }} />
                    </Box>
                  )}
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#f1f5f9' : 'inherit', mb: 1 }}>
                      {book.title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={book.subject} size="small"
                        sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                      <Chip label={book.grade} size="small"
                        sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                      <Chip label={book.price > 0 ? `${book.price} ج.م` : 'مجاني'} size="small"
                        sx={{ bgcolor: book.price > 0 ? '#fefce8' : '#f0fdf4', color: book.price > 0 ? '#b45309' : '#16a34a', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      {book.teacherName ? `المدرس: ${book.teacherName}` : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {books.length === 0 && (
              <Grid item xs={12}>
                <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={4}>
                  لا توجد كتب مشتراة
                </Typography>
              </Grid>
            )}
          </Grid>
        )}

        {/* Tab Content: Activities */}
        {activeTab === 4 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <List>
              {activities.map((activity, index) => (
                <ListItem
                  key={activity.id}
                  sx={{
                    borderBottom:
                      index < activities.length - 1 ? "1px solid" : "none",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <Box sx={{ mr: 2 }}>{getActivityIcon(activity.type)}</Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {activity.text}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                      >
                        {activity.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {activities.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary">
                        لا يوجد نشاط حديث
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ChildDetails;
