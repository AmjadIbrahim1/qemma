// frontend/src/pages/parent/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import parentsService from '../../services/parents.service';
import { normalizeChild, safePercentage, safeProgressValue, safeNumber } from '../../utils/normalizeApiResponse';
import AddChildModal from '../../components/parent/AddChildModal';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import {
  People,
  TrendingUp,
  TrendingDown,
  Assignment,
  EventAvailable,
  Warning,
  CheckCircle,
  Cancel,
  School,
  BarChart,
  Notifications,
  Settings,
  ExitToApp,
  MoreVert,
  ArrowForward,
  Info,
  CalendarToday,
  AccessTime,
  PersonAdd,
} from '@mui/icons-material';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addChildOpen, setAddChildOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fetch real children data from API
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        const res = await parentsService.getChildren();
        const raw = res.data.data || res.data || [];
        setChildren(Array.isArray(raw) ? raw.map(normalizeChild) : []);
      } catch (err) {
        console.error('Failed to fetch children:', err);
        setError('فشل تحميل بيانات الأبناء');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // Compute stats from real data
  const totalCourses = children.reduce((sum, child) => sum + Number(child.totalCourses), 0);
  const totalPendingAssignments = children.reduce((sum, child) => sum + Number(child.pendingAssignments), 0);
  const totalAlerts = children.reduce((sum, child) => sum + Number(child.behaviorAlerts), 0);

  const stats = [
    {
      title: 'إجمالي الأبناء',
      value: children.length,
      icon: <People sx={{ fontSize: 40 }} />,
      color: '#2563eb',
      bgColor: '#eff6ff',
    },
    {
      title: 'الكورسات النشطة',
      value: totalCourses,
      icon: <School sx={{ fontSize: 40 }} />,
      color: '#7c3aed',
      bgColor: '#f5f3ff',
    },
    {
      title: 'الواجبات المعلقة',
      value: totalPendingAssignments,
      icon: <Assignment sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
    {
      title: 'التنبيهات',
      value: totalAlerts,
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: '#dc2626',
      bgColor: '#fef2f2',
    },
  ];

  // Recent activities from children's data
  const recentActivities = [];
  children.forEach(child => {
    const notifs = child.notifications || [];
    notifs.slice(0, 3).forEach(n => {
      const type = n.type === 'exam' ? 'success' : n.type === 'assignment' ? 'warning' : 'info';
      const iconMap = {
        success: <CheckCircle sx={{ color: '#059669' }} />,
        warning: <Warning sx={{ color: '#f59e0b' }} />,
        info: <EventAvailable sx={{ color: '#2563eb' }} />,
        error: <Cancel sx={{ color: '#dc2626' }} />,
      };
      recentActivities.push({
        id: n.id,
        childName: child.name?.split(' ')[0] || '',
        activity: n.title,
        type,
        time: n.createdAt || n.time || 'منذ قليل',
        icon: iconMap[type] || iconMap.info,
      });
    });
  });
  recentActivities.sort((a, b) => a.id - b.id).slice(0, 5);

  // Upcoming events from children's tasks
  const upcomingEvents = [];
  children.forEach(child => {
    const tasks = Array.isArray(child.tasks) ? child.tasks : [];
    tasks.filter(t => !t.completed).slice(0, 3).forEach(t => {
      upcomingEvents.push({
        id: t.id,
        childName: child.name?.split(' ')[0] || '',
        title: t.title,
        date: t.dueDate || 'قريباً',
        time: t.dueLabel || '',
        type: t.type || 'exam',
      });
    });
  });
  upcomingEvents.sort(() => Math.random() - 0.5).slice(0, 5);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
          color: 'white',
          py: 3,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  bgcolor: 'white',
                  color: '#7c3aed',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                {user?.name?.charAt(0) || 'و'}
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 0.5 }}
                >
                  مرحباً، {user?.name || 'ولي الأمر'}
                </Typography>
                <Chip
                  label="ولي أمر"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 700,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }} onClick={() => navigate('/parent/notifications')}>
                <Notifications />
              </IconButton>
              <IconButton sx={{ color: 'white' }} onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            navigate('/profile');
            handleMenuClose();
          }}
        >
          <Settings sx={{ mr: 1 }} />
          الإعدادات
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleLogout();
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ExitToApp sx={{ mr: 1 }} />
          تسجيل الخروج
        </MenuItem>
      </Menu>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: darkMode ? '#334155' : '#e5e7eb',
                  bgcolor: darkMode ? '#1e293b' : 'white',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: darkMode
                      ? '0 10px 20px rgba(0,0,0,0.3)'
                      : '0 10px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        bgcolor: darkMode ? stat.color + '20' : stat.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ mb: 0.5, color: darkMode ? '#f1f5f9' : 'inherit' }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontFamily="Cairo, sans-serif"
                    fontWeight={600}
                    sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}
                  >
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Children Overview */}
          <Grid item xs={12} lg={8}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                mb: 3,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                  >
                    نظرة عامة على الأبناء
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<PersonAdd />}
                      onClick={() => setAddChildOpen(true)}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        color: '#db2777',
                        borderColor: '#db2777',
                        '&:hover': { bgcolor: '#fdf2f8' },
                      }}
                      variant="outlined"
                      size="small"
                    >
                      إضافة طالب
                    </Button>
                    <Button
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/parent/children')}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        color: '#2563eb',
                      }}
                    >
                      عرض الكل
                    </Button>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {children.map((child) => (
                    <Grid item xs={12} key={child.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          border: '1px solid',
                          borderColor: darkMode ? '#334155' : '#e5e7eb',
                          bgcolor: darkMode ? '#0f172a' : '#f9fafb',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#2563eb',
                            transform: 'translateY(-2px)',
                          },
                        }}
                        onClick={() => navigate(`/parent/child/${child.id}`)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar
                              sx={{
                                width: 50,
                                height: 50,
                                bgcolor: '#2563eb',
                                fontFamily: 'Cairo, sans-serif',
                                fontWeight: 900,
                                fontSize: '1.25rem',
                              }}
                            >
                              {child.avatar || child.name?.charAt(0) || ''}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                              >
                                {child.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}
                              >
                                {child.grade}
                              </Typography>
                            </Box>
                          </Box>

                          {child.behaviorAlerts > 0 && (
                            <Chip
                              icon={<Warning />}
                              label={`${child.behaviorAlerts} تنبيه`}
                              size="small"
                              sx={{
                                bgcolor: '#fef2f2',
                                color: '#dc2626',
                                fontFamily: 'Cairo, sans-serif',
                                fontWeight: 700,
                              }}
                            />
                          )}
                        </Box>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={6} sm={3}>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', display: 'block', mb: 0.5 }}
                            >
                              المتوسط
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography
                                variant="h6"
                                fontWeight={900}
                                fontFamily="Cairo, sans-serif"
                                sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                              >
                                {safePercentage(child.averageGrade)}
                              </Typography>
                              {safeNumber(child.averageGrade) >= 80 ? (
                                <TrendingUp sx={{ color: '#059669', fontSize: 20 }} />
                              ) : (
                                <TrendingDown sx={{ color: '#dc2626', fontSize: 20 }} />
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', display: 'block', mb: 0.5 }}
                            >
                              الحضور
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={900}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                            >
                              {safePercentage(child.attendance)}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', display: 'block', mb: 0.5 }}
                            >
                              الكورسات
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={900}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                            >
                              {child.totalCourses}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary', display: 'block', mb: 0.5 }}
                            >
                              الواجبات المعلقة
                            </Typography>
                            <Typography
                              variant="h6"
                              fontWeight={900}
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: child.pendingAssignments > 0 ? '#f59e0b' : darkMode ? '#f1f5f9' : 'inherit' }}
                            >
                              {child.pendingAssignments}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Progress Bar */}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#94a3b8' : 'text.secondary' }}
                            >
                              التقدم الكلي
                            </Typography>
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={700}
                              sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                            >
                              {safePercentage(child.averageGrade)}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={safeProgressValue(child.averageGrade)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: darkMode ? '#334155' : '#e5e7eb',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: safeNumber(child.averageGrade) >= 80 ? '#059669' : safeNumber(child.averageGrade) >= 60 ? '#f59e0b' : '#dc2626',
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}
                >
                  النشاط الأخير
                </Typography>
                <List>
                  {recentActivities.map((activity, index) => (
                    <ListItem
                      key={activity.id}
                      sx={{
                        px: 0,
                        borderBottom: index < recentActivities.length - 1 ? '1px solid' : 'none',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {activity.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            fontWeight={600}
                            sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}
                          >
                            <strong>{activity.childName}:</strong> {activity.activity}
                          </Typography>
                        }
                        secondary={
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}
                          >
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            {/* Upcoming Events */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
                mb: 3,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}
                >
                  الأحداث القادمة
                </Typography>
                <List>
                  {upcomingEvents.map((event, index) => (
                    <ListItem
                      key={event.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        mb: 1.5,
                        borderRadius: 2,
                        bgcolor: darkMode ? '#0f172a' : '#f9fafb',
                        border: '1px solid',
                        borderColor: darkMode ? '#334155' : '#e5e7eb',
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={event.childName}
                            size="small"
                            sx={{
                              bgcolor: '#2563eb',
                              color: 'white',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            icon={event.type === 'exam' ? <Assignment sx={{ fontSize: 14 }} /> : <Info sx={{ fontSize: 14 }} />}
                            label={event.type === 'exam' ? 'اختبار' : 'واجب'}
                            size="small"
                            sx={{
                              bgcolor: event.type === 'exam' ? '#fef2f2' : '#fffbeb',
                              color: event.type === 'exam' ? '#dc2626' : '#f59e0b',
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          fontFamily="Cairo, sans-serif"
                          fontWeight={700}
                          sx={{ mb: 0.5, color: darkMode ? '#f1f5f9' : 'inherit' }}
                        >
                          {event.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14, color: darkMode ? '#64748b' : 'text.secondary' }} />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}
                            >
                              {event.date}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTime sx={{ fontSize: 14, color: darkMode ? '#64748b' : 'text.secondary' }} />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? '#64748b' : 'text.secondary' }}
                            >
                              {event.time}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: darkMode ? '#334155' : '#e5e7eb',
                bgcolor: darkMode ? '#1e293b' : 'white',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}
                >
                  إجراءات سريعة
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/parent/children')}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        py: 1.5,
                        borderColor: darkMode ? '#334155' : undefined,
                        color: darkMode ? '#f1f5f9' : 'inherit',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      <People />
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}>
                        الأبناء
                      </Typography>
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/parent/reports')}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        py: 1.5,
                        borderColor: darkMode ? '#334155' : undefined,
                        color: darkMode ? '#f1f5f9' : 'inherit',
                        flexDirection: 'column',
                        gap: 0.5,
                      }}
                    >
                      <BarChart />
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}>
                        التقارير
                      </Typography>
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setAddChildOpen(true)}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 700,
                        py: 1.5,
                        borderColor: '#db2777',
                        color: '#db2777',
                        flexDirection: 'column',
                        gap: 0.5,
                        '&:hover': { bgcolor: '#fdf2f8' },
                      }}
                    >
                      <PersonAdd />
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700}>
                        إضافة طالب
                      </Typography>
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Add Child Modal */}
      <AddChildModal
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        onChildAdded={() => {
          // Refresh children data after adding a new child
          const fetchChildren = async () => {
            try {
              setLoading(true);
              const res = await parentsService.getChildren();
              const raw = res.data.data || res.data || [];
              setChildren(Array.isArray(raw) ? raw.map(normalizeChild) : []);
            } catch (err) {
              console.error('Failed to fetch children:', err);
              setError('فشل تحميل بيانات الأبناء');
            } finally {
              setLoading(false);
            }
          };
          fetchChildren();
        }}
      />
    </Box>
  );
};

export default ParentDashboard;