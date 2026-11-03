// frontend/src/pages/student/TasksPage.jsx
// Fetches real data from unified /api/students/tasks endpoint
// Shows: exams not taken, assignments not submitted, lessons not viewed

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircleRounded,
  SearchRounded,
  AccessTimeRounded,
  QuizRounded,
  AssignmentRounded,
  MenuBookRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import studentsService from '../../services/students.service';

const TasksPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Data from unified API ───────────────────────────────────
  const [pendingExams, setPendingExams] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [unviewedLessons, setUnviewedLessons] = useState([]);
  const [stats, setStats] = useState({ total: 0, exams: 0, assignments: 0, lessons: 0 });

  // ── UI state ────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: الكل, 1: الامتحانات, 2: الواجبات, 3: الدروس

  // ── Fetch all tasks from unified backend endpoint ───────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentsService.getTasks();
      const data = response?.data?.data || response?.data || response;
      setPendingExams(data.pendingExams || []);
      setPendingAssignments(data.pendingAssignments || []);
      setUnviewedLessons(data.unviewedLessons || []);
      setStats(data.stats || { total: 0, exams: 0, assignments: 0, lessons: 0 });
    } catch (err) {
      setError('فشل تحميل المهام. تأكد من الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Combine all tasks ───────────────────────────────────────
  const allTasks = [...pendingExams, ...pendingAssignments, ...unviewedLessons];

  // ── Filtering ───────────────────────────────────────────────
  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = !searchQuery ||
      task.title?.includes(searchQuery) ||
      task.courseName?.includes(searchQuery);
    if (activeTab === 1) return matchesSearch && task.type === 'exam';
    if (activeTab === 2) return matchesSearch && task.type === 'assignment';
    if (activeTab === 3) return matchesSearch && task.type === 'lesson';
    return matchesSearch;
  });

  // ── Task icon / color ───────────────────────────────────────
  const getTaskConfig = (type) => {
    switch (type) {
      case 'exam':
        return { icon: <QuizRounded />, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', label: 'امتحان' };
      case 'assignment':
        return { icon: <AssignmentRounded />, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', label: 'واجب' };
      case 'lesson':
        return { icon: <MenuBookRounded />, color: '#2563eb', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)', label: 'درس' };
      default:
        return { icon: <CheckCircleRounded />, color: '#64748b', gradient: 'linear-gradient(135deg, #64748b, #475569)', label: '' };
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
        color: 'white', py: 4, px: 2, mb: 3,
      }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => navigate('/student/dashboard')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                📋 المهام المطلوبة
              </Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                {loading ? 'جاري التحميل...' : `${stats.total} مهمة تنتظرك`}
              </Typography>
            </Box>
          </Box>

          {/* Stats */}
          <Grid container spacing={2}>
            {[
              { label: 'إجمالي', value: stats.total, icon: '📋' },
              { label: 'امتحانات', value: stats.exams, icon: '📝' },
              { label: 'واجبات', value: stats.assignments, icon: '📤' },
              { label: 'دروس', value: stats.lessons, icon: '📖' },
            ].map((stat, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Box sx={{
                  bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  borderRadius: 3, p: 2, textAlign: 'center',
                }}>
                  <Typography variant="h4" fontWeight={900}>
                    {stat.icon} {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Search & Filters */}
        <Card elevation={0} sx={{
          border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
          bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, p: 2, mb: 3,
        }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="ابحث عن مهمة..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1, minWidth: 250,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc', fontFamily: 'Cairo, sans-serif' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: darkMode ? '#94a3b8' : '#64748b' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}
              sx={{
                minHeight: 40,
                '& .MuiTab-root': { minHeight: 40, fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 13 },
              }}>
              <Tab label={`الكل (${stats.total})`} />
              <Tab label={`امتحانات (${stats.exams})`} />
              <Tab label={`واجبات (${stats.assignments})`} />
              <Tab label={`دروس (${stats.lessons})`} />
            </Tabs>
          </Box>
        </Card>

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontFamily: 'Cairo, sans-serif' }}
            action={<Button size="small" onClick={fetchData} sx={{ fontFamily: 'Cairo, sans-serif' }}>إعادة المحاولة</Button>}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
              جاري تحميل المهام...
            </Typography>
          </Box>
        )}

        {/* Tasks List */}
        {!loading && !error && (
          <Grid container spacing={2}>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, idx) => {
                const cfg = getTaskConfig(task.type);

                return (
                  <Grid item xs={12} md={6} lg={4} key={`${task.type}-${task.id}-${idx}`}>
                    <Card elevation={0} sx={{
                      border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                      bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)' },
                    }}>
                      {/* Color bar */}
                      <Box sx={{ height: 4, background: cfg.gradient }} />

                      <Box sx={{ p: 2.5 }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                          <Avatar sx={{ bgcolor: cfg.color, width: 36, height: 36 }}>
                            {cfg.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700} fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}>
                              {task.title}
                            </Typography>
                            <Chip label={`${cfg.label} • ${task.courseName}`} size="small"
                              sx={{ height: 24, fontSize: 11, fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: `${cfg.color}15`, color: cfg.color }} />
                          </Box>
                        </Box>

                        {/* Details */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: darkMode ? '#334155' : '#f8fafc', mb: 2 }}>
                          <AccessTimeRounded sx={{ fontSize: 18, color: cfg.color }} />
                          {task.type === 'exam' && (
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
                              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                              🕐 {task.duration} دقيقة • 📊 {task.totalMarks} درجة
                            </Typography>
                          )}
                          {task.type === 'assignment' && (
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
                              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                              📅 {task.dueDate || 'بدون تاريخ'} • 🏆 {task.maxScore} درجة
                            </Typography>
                          )}
                          {task.type === 'lesson' && (
                            <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
                              sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                              📖 الدرس {task.order || ''} • لم يتم مشاهدته بعد
                            </Typography>
                          )}
                        </Box>

                        {/* Action Button */}
                        {task.type === 'exam' && (
                          <Button fullWidth variant="contained"
                            onClick={() => navigate(`/student/exam/${task.id}/start`)}
                            startIcon={<QuizRounded />}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, bgcolor: cfg.color, '&:hover': { bgcolor: '#dc2626' } }}>
                            ابدأ الامتحان
                          </Button>
                        )}
                        {task.type === 'assignment' && (
                          <Button fullWidth variant="contained"
                            onClick={() => navigate('/student/submit-assignment', { state: { assignmentId: task.id, task } })}
                            startIcon={<AssignmentRounded />}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, bgcolor: cfg.color, '&:hover': { bgcolor: '#7c3aed' } }}>
                            تسليم الواجب
                          </Button>
                        )}
                        {task.type === 'lesson' && (
                          <Button fullWidth variant="contained"
                            onClick={() => navigate(`/student/course/${task.courseId}/lesson/${task.id}`)}
                            startIcon={<MenuBookRounded />}
                            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, bgcolor: cfg.color, '&:hover': { bgcolor: '#1d4ed8' } }}>
                            مشاهدة الدرس
                          </Button>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                );
              })
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8, bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                  <Typography variant="h1" sx={{ mb: 2 }}>🎉</Typography>
                  <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700}
                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
                    {activeTab === 0 ? 'لا توجد مهام متبقية!' :
                     activeTab === 1 ? 'لا توجد امتحانات متبقية' :
                     activeTab === 2 ? 'لا توجد واجبات متبقية' :
                     'كل الدروس تم مشاهدتها!'}
                  </Typography>
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {activeTab === 0 ? 'أحسنت! أكملت كل المهام' : 'أنت على اطلاع كامل'}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TasksPage;
