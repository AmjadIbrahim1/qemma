// frontend/src/pages/parent/CourseDetails.jsx
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
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  Assignment,
  EventAvailable,
  BarChart,
  Warning,
  CheckCircle,
  Cancel,
  CalendarToday,
  AccessTime,
  TrendingUp,
} from "@mui/icons-material";

const CourseDetails = () => {
  const navigate = useNavigate();
  const { childId, courseId } = useParams();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseData, setCourseData] = useState(null);

  // Fetch real course details from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await parentsService.getChildCourseDetails(childId, courseId);
        const data = extractPayload(res);
        setCourseData(data);
      } catch (err) {
        console.error('Failed to fetch course details:', err);
        setError('فشل تحميل تفاصيل الكورس');
      } finally {
        setLoading(false);
      }
    };
    if (childId && courseId) fetchData();
  }, [childId, courseId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "graded":
        return { bg: "#f0fdf4", color: "#059669" };
      case "submitted":
        return { bg: "#eff6ff", color: "#2563eb" };
      case "pending":
        return { bg: "#eff6ff", color: "#2563eb" };
      case "late":
      case "missed":
        return { bg: "#fef2f2", color: "#dc2626" };
      case "upcoming":
        return { bg: "#fffbeb", color: "#f59e0b" };
      default:
        return { bg: "#f9fafb", color: "#64748b" };
    }
  };

  const getPriorityColor = (status) => {
    if (status === 'late') return "#dc2626";
    if (status === 'pending') return "#f59e0b";
    if (status === 'submitted') return "#2563eb";
    return "#059669";
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
      </Box>
    );
  }

  if (!courseData || Object.keys(courseData).length === 0) return null;

  const { course, progress, attendance, assignments, exams, grades, liveSessions, schedules, avgGrade, totalExams, pendingAssignments } = courseData;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
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
              onClick={() => navigate(`/parent/child/${childId}`)}
            >
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="h5"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
              >
                {course?.title || 'الكورس'}
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.9 }}
              >
                {course?.teacher?.name || ''}
              </Typography>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: darkMode ? "#1e293b" : "#f1f5f9",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#2563eb" }}
                >
                  {safePercentage(avgGrade)}
                </Typography>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "black" }}
                >
                  الدرجة
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: darkMode ? "#1e293b" : "#f1f5f9",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#059669" }}
                >
                  {safePercentage(attendance?.rate)}
                </Typography>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "black" }}
                >
                  الحضور
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: darkMode ? "#1e293b" : "#f1f5f9",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#7c3aed" }}
                >
                  {attendance?.attendedSessions || 0}/{attendance?.totalSessions || 0}
                </Typography>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "black" }}
                >
                  الحصص
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: darkMode ? "#1e293b" : "#f1f5f9",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: "#f59e0b" }}
                >
                  {pendingAssignments || 0}
                </Typography>
                <Typography
                  variant="h6"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "black" }}
                >
                  واجبات معلقة
                </Typography>
              </Paper>
            </Grid>
          </Grid>
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
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              "& .MuiTab-root": {
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
              },
            }}
          >
            <Tab icon={<Assignment />} label="الواجبات" iconPosition="start" />
            <Tab icon={<EventAvailable />} label="الحصص" iconPosition="start" />
            <Tab icon={<BarChart />} label="الاختبارات" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="سجل الدرجات" iconPosition="start" />
            <Tab icon={<CalendarToday />} label="سجل الحضور" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Assignments */}
        {activeTab === 0 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <List>
              {assignments.map((assignment, idx) => (
                <ListItem
                  key={assignment.id}
                  sx={{
                    borderBottom:
                      idx < assignments.length - 1 ? "1px solid" : "none",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <Box
                    sx={{
                      width: 4,
                      height: 40,
                      bgcolor: getPriorityColor(assignment.status),
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
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
                            assignment.status === "graded"
                              ? "مصحح"
                              : assignment.status === "submitted"
                                ? "تم التسليم"
                                : assignment.status === "late"
                                  ? "متأخر"
                                  : "معلق"
                          }
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(assignment.status).bg,
                            color: getStatusColor(assignment.status).color,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
                        {assignment.dueDate && (
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{
                              color: darkMode ? "#64748b" : "text.secondary",
                            }}
                          >
                            📅 {new Date(assignment.dueDate).toLocaleDateString('ar-EG')}
                          </Typography>
                        )}
                        {assignment.submission?.score !== null && assignment.submission?.score !== undefined && (
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            fontWeight={700}
                            sx={{ color: "#059669" }}
                          >
                            ✓ {assignment.submission.score}/{assignment.maxScore || 100}
                          </Typography>
                        )}
                        {assignment.maxScore && (
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                          >
                            الدرجة القصوى: {assignment.maxScore}
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
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={3}>
                        لا توجد واجبات في هذا الكورس
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}

        {/* Tab 1: Live Sessions / Schedules */}
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
              {(liveSessions.length > 0 ? liveSessions : schedules).map((session, idx) => {
                const isUpcoming = session.upcoming || (session.date && new Date(session.date) > new Date());
                const attended = session.attended;
                return (
                  <ListItem
                    key={session.id}
                    sx={{
                      borderBottom:
                        idx < (liveSessions.length > 0 ? liveSessions : schedules).length - 1 ? "1px solid" : "none",
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
                            {session.title}
                          </Typography>
                          {isUpcoming ? (
                            <Chip
                              label="قادمة"
                              size="small"
                              sx={{
                                bgcolor: "#fffbeb",
                                color: "#f59e0b",
                                fontFamily: "Cairo, sans-serif",
                                fontWeight: 700,
                              }}
                            />
                          ) : session.isLive ? (
                            <Chip
                              label="مباشر الآن"
                              size="small"
                              sx={{
                                bgcolor: "#fef2f2",
                                color: "#dc2626",
                                fontFamily: "Cairo, sans-serif",
                                fontWeight: 700,
                              }}
                            />
                          ) : attended === true ? (
                            <CheckCircle sx={{ color: "#059669", fontSize: 20 }} />
                          ) : attended === false ? (
                            <Cancel sx={{ color: "#dc2626", fontSize: 20 }} />
                          ) : null}
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                        >
                          {session.scheduledAt
                            ? `📅 ${new Date(session.scheduledAt).toLocaleDateString('ar-EG')} • 🕐 ${new Date(session.scheduledAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
                            : session.date
                              ? `📅 ${session.date}${session.startTime ? ` • 🕐 ${session.startTime}` : ''}`
                              : ''}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
              {liveSessions.length === 0 && schedules.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={3}>
                        لا توجد حصص مسجلة
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}

        {/* Tab 2: Exams */}
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
              {exams.map((exam, idx) => (
                <ListItem
                  key={exam.id}
                  sx={{
                    borderBottom: idx < exams.length - 1 ? "1px solid" : "none",
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
                        {exam.status === "upcoming" && (
                          <Chip
                            label="قادم"
                            size="small"
                            sx={{
                              bgcolor: "#fffbeb",
                              color: "#f59e0b",
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                            }}
                          />
                        )}
                        {exam.status === "completed" && (
                          <Chip
                            label="مكتمل"
                            size="small"
                            sx={{
                              bgcolor: "#f0fdf4",
                              color: "#059669",
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                            }}
                          />
                        )}
                        {exam.status === "missed" && (
                          <Chip
                            label="فات"
                            size="small"
                            sx={{
                              bgcolor: "#fef2f2",
                              color: "#dc2626",
                              fontFamily: "Cairo, sans-serif",
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          fontFamily="Cairo, sans-serif"
                          sx={{
                            color: darkMode ? "#64748b" : "text.secondary",
                          }}
                        >
                          {exam.availableFrom
                            ? `📅 ${new Date(exam.availableFrom).toLocaleDateString('ar-EG')} • 🕐 ${new Date(exam.availableFrom).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
                            : ''}
                          {exam.questionsCount ? ` • ${exam.questionsCount} سؤال` : ''}
                          {exam.totalMarks ? ` • ${exam.totalMarks} درجة` : ''}
                        </Typography>
                        {exam.attempt && exam.attempt.score !== null && exam.attempt.score !== undefined && (
                          <Box sx={{ mt: 1 }}>
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={700}
                              sx={{ color: "#059669", mb: 0.5 }}
                            >
                              الدرجة: {exam.attempt.score}/{exam.totalMarks} (
                              {exam.totalMarks > 0 ? safePercentage(Math.round((exam.attempt.score / exam.totalMarks) * 100), 'لم يحسب بعد') : safePercentage(0)}
                              )
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={safeProgressValue(exam.totalMarks > 0 ? (exam.attempt.score / exam.totalMarks) * 100 : 0)}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: darkMode ? "#334155" : "#e5e7eb",
                                "& .MuiLinearProgress-bar": {
                                  bgcolor:
                                    safeNumber(exam.totalMarks > 0 ? (exam.attempt.score / exam.totalMarks) * 100 : 0) >= 80
                                      ? "#059669"
                                      : "#f59e0b",
                                  borderRadius: 3,
                                },
                              }}
                            />
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
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={3}>
                        لا توجد اختبارات في هذا الكورس
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Card>
        )}

        {/* Tab 3: Grades Record */}
        {activeTab === 3 && (
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
                    <TableCell
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#f1f5f9" : "inherit",
                      }}
                    >
                      الاختبار
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#f1f5f9" : "inherit",
                      }}
                    >
                      الدرجة
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#f1f5f9" : "inherit",
                      }}
                    >
                      التقدير
                    </TableCell>
                    <TableCell
                      sx={{
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                        color: darkMode ? "#f1f5f9" : "inherit",
                      }}
                    >
                      التاريخ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((grade, idx) => (
                    <TableRow key={grade.id || idx}>
                      <TableCell
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                          color: darkMode ? "#f1f5f9" : "inherit",
                        }}
                      >
                        {grade.examTitle}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#f1f5f9" : "inherit",
                        }}
                      >
                        {grade.score}/{grade.totalMarks || '-'}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#f1f5f9" : "inherit",
                        }}
                      >
                        <Chip
                          label={grade.gradeLetter || (grade.score && grade.totalMarks ? (
                            (grade.score / grade.totalMarks) >= 0.9 ? 'A' :
                            (grade.score / grade.totalMarks) >= 0.8 ? 'B' :
                            (grade.score / grade.totalMarks) >= 0.7 ? 'C' :
                            (grade.score / grade.totalMarks) >= 0.6 ? 'D' : 'F'
                          ) : '-')}
                          size="small"
                          sx={{
                            bgcolor: grade.score && grade.totalMarks && (grade.score / grade.totalMarks) >= 0.7 ? "#f0fdf4" : "#fef2f2",
                            color: grade.score && grade.totalMarks && (grade.score / grade.totalMarks) >= 0.7 ? "#059669" : "#dc2626",
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          fontFamily: "Cairo, sans-serif",
                          color: darkMode ? "#f1f5f9" : "inherit",
                        }}
                      >
                        {grade.gradedAt ? new Date(grade.gradedAt).toLocaleDateString('ar-EG') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography fontFamily="Cairo, sans-serif" color="text.secondary" py={2}>
                          لا توجد درجات مسجلة
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Tab 4: Attendance Record */}
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
              {attendance?.records?.map((record, idx) => (
                <ListItem
                  key={record.id || idx}
                  sx={{
                    borderBottom:
                      idx < (attendance?.records?.length || 0) - 1 ? "1px solid" : "none",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <Box sx={{ mr: 2 }}>
                    {record.present ? (
                      <CheckCircle sx={{ color: "#059669" }} />
                    ) : (
                      <Cancel sx={{ color: "#dc2626" }} />
                    )}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        fontFamily="Cairo, sans-serif"
                        fontWeight={600}
                        sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                      >
                        {record.lessonTitle || 'حصة'}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#64748b" : "text.secondary" }}
                      >
                        {record.date ? new Date(record.date).toLocaleDateString('ar-EG') : ''}
                      </Typography>
                    }
                  />
                  <Chip
                    label={record.present ? "حاضر" : "غائب"}
                    size="small"
                    sx={{
                      bgcolor: record.present ? "#f0fdf4" : "#fef2f2",
                      color: record.present ? "#059669" : "#dc2626",
                      fontFamily: "Cairo, sans-serif",
                      fontWeight: 700,
                    }}
                  />
                </ListItem>
              ))}
              {(!attendance?.records || attendance.records.length === 0) && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography fontFamily="Cairo, sans-serif" textAlign="center" color="text.secondary" py={3}>
                        لا توجد سجلات حضور
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

export default CourseDetails;
