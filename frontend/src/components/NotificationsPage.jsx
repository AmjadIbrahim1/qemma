// frontend/src/components/NotificationsPage.jsx
// Universal Notifications Page — works for student, teacher, assistant, and parent roles.
// Fetches from API + receives real-time via Socket.IO.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { io } from 'socket.io-client';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ArrowBackRounded,
  NotificationsRounded,
  DeleteRounded,
  DoneAllRounded,
  CircleRounded,
  CheckCircleRounded,
  InfoRounded,
  WarningRounded,
  CampaignRounded,
  SchoolRounded,
  AssignmentRounded,
  VideoCallRounded,
  EmojiEventsRounded,
  ScheduleRounded,
  BookRounded,
} from '@mui/icons-material';
import API from '../services/api';

// ── Helper: dashboard path per role ──
const getDashboardPath = (role) => {
  switch (role) {
    case 'teacher':         return '/teacher/dashboard';
    case 'assistant_teacher': return '/teacher/dashboard';
    case 'parent':          return '/parent/dashboard';
    default:                return '/student/dashboard';
  }
};

// ── أيقونة حسب نوع الإشعار ──
const notificationConfig = {
  general:    { icon: InfoRounded,        color: '#2563eb', bgColor: '#eff6ff' },
  exam:       { icon: AssignmentRounded,   color: '#f59e0b', bgColor: '#fffbeb' },
  course:     { icon: SchoolRounded,       color: '#7c3aed', bgColor: '#f5f3ff' },
  live:       { icon: VideoCallRounded,    color: '#db2777', bgColor: '#fdf2f8' },
  grade:      { icon: CheckCircleRounded,  color: '#059669', bgColor: '#ecfdf5' },
  contest:    { icon: EmojiEventsRounded,  color: '#f59e0b', bgColor: '#fffbeb' },
  schedule:   { icon: ScheduleRounded,     color: '#0891b2', bgColor: '#ecfeff' },
  book:       { icon: BookRounded,         color: '#4f46e5', bgColor: '#eef2ff' },
  reminder:   { icon: WarningRounded,      color: '#dc2626', bgColor: '#fef2f2' },
  promotion:  { icon: CampaignRounded,     color: '#ea580c', bgColor: '#fff7ed' },
  assignment: { icon: AssignmentRounded,   color: '#f59e0b', bgColor: '#fffbeb' },
  discussion: { icon: InfoRounded,         color: '#ea580c', bgColor: '#fff7ed' },
  resource:   { icon: BookRounded,         color: '#4f46e5', bgColor: '#eef2ff' },
  badge:      { icon: EmojiEventsRounded,  color: '#7c3aed', bgColor: '#f5f3ff' },
  assistant_request: { icon: CampaignRounded, color: '#059669', bgColor: '#ecfdf5' },
  parent_request:    { icon: CampaignRounded, color: '#db2777', bgColor: '#fdf2f8' },
};

const getConfig = (type) => notificationConfig[type] || notificationConfig.general;

// ── تنسيق الوقت النسبي ──
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `منذ ${diffHrs} ساعة`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
};

// ── تسمية النوع بالعربية ──
const typeLabel = (type) => {
  const labels = {
    general:           'عام',
    exam:              'اختبار',
    course:            'كورس',
    live:              'حصة مباشرة',
    grade:             'درجة',
    contest:           'مسابقة',
    schedule:          'موعد',
    book:              'كتاب',
    reminder:          'تذكير',
    promotion:         'ترويج',
    assignment:        'واجب',
    discussion:        'مناقشة',
    resource:          'مورد',
    badge:             'شارة',
    assistant_request: 'طلب مساعد',
    parent_request:    'طلب ولي أمر',
  };
  return labels[type] || 'عام';
};

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '');

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const role = user?.role || 'student';
  const dashboardPath = getDashboardPath(role);

  // ── الحالة الأساسية ──
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef(null);

  // ── جلب الإشعارات من API ──
  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await API.get(`/notifications?page=${page}&limit=20`);
      const data = res.data?.data;
      if (data) {
        setNotifications(prev =>
          append ? [...prev, ...data.notifications] : data.notifications
        );
        setPagination(data.pagination);
      }
    } catch {
      showSnackbar('فشل تحميل الإشعارات', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // Auto-mark all as read when opening the notifications page, then fetch
    API.patch('/notifications/read-all')
      .then(() => fetchNotifications())
      .catch(() => fetchNotifications());
  }, [fetchNotifications]);

  // ── الاتصال بالسوكيت للإشعارات المباشرة ──
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Notifications socket connected');
      setConnecting(false);
    });

    socket.on('connect_error', () => {
      setConnecting(false);
    });

    // ── استقبال الإشعارات الجديدة فوراً ──
    socket.on('notification:new', (data) => {
      console.log('📨 Realtime notification received:', data);
      setNotifications(prev => {
        // تجنب التكرار
        const exists = prev.some(n => n.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });
    });

    return () => {
      socket.off('notification:new');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── عرض رسالة ──
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── تصفية الإشعارات حسب التاب ──
  const filtered = () => {
    switch (activeTab) {
      case 1: return notifications.filter(n => !n.isRead);
      case 2: return notifications.filter(n => n.isRead);
      default: return notifications;
    }
  };
  const filteredList = filtered();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ── تعيين الكل كمقروء ──
  const markAllAsRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showSnackbar('تم تعيين الكل كمقروء');
    } catch {
      showSnackbar('فشل تعيين الإشعارات كمقروءة', 'error');
    }
  };

  // ── تعيين إشعار واحد كمقروء ──
  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch { /* تجاهل */ }
  };

  // ── حذف إشعار واحد ──
  const deleteOne = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSnackbar('تم حذف الإشعار');
    } catch {
      showSnackbar('فشل حذف الإشعار', 'error');
    }
  };

  // ── حذف الكل ──
  const deleteAll = async () => {
    try {
      await API.delete('/notifications');
      setNotifications([]);
      showSnackbar('تم حذف جميع الإشعارات');
    } catch {
      showSnackbar('فشل حذف الإشعارات', 'error');
    }
  };

  // ── تحميل المزيد (pagination) ──
  const loadMore = () => {
    if (pagination.page < pagination.totalPages && !loadingMore) {
      fetchNotifications(pagination.page + 1, true);
    }
  };

  // ── النقر على إشعار ── (marks as read only, no navigation)
  const handleClick = (notification) => {
    if (!notification.isRead) markAsRead(notification.id);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', pb: 4 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
          color: 'white',
          py: 4,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => navigate(dashboardPath)}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <ArrowBackRounded />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                  🔔 الإشعارات
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                  {connecting
                    ? 'جارٍ الاتصال...'
                    : `لديك ${unreadCount} إشعار غير مقروء`}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  startIcon={<DoneAllRounded />}
                  onClick={markAllAsRead}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  تحديد الكل مقروء
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  startIcon={<DeleteRounded />}
                  onClick={deleteAll}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  حذف الكل
                </Button>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* ── Tabs ── */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 600,
              color: darkMode ? '#94a3b8' : '#64748b',
              '&.Mui-selected': { color: '#2563eb' },
            },
            '& .MuiTabs-indicator': { bgcolor: '#2563eb' },
          }}
        >
          <Tab label={`الكل (${notifications.length})`} />
          <Tab label={`غير مقروء (${unreadCount})`} />
          <Tab label={`مقروء (${notifications.length - unreadCount})`} />
        </Tabs>

        {/* ── قائمة الإشعارات ── */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={48} sx={{ color: '#2563eb', mb: 2 }} />
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                جارٍ تحميل الإشعارات...
              </Typography>
            </Box>
          ) : filteredList.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <NotificationsRounded sx={{ fontSize: 64, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                {activeTab === 1 ? 'لا توجد إشعارات غير مقروءة 🎉' : 'لا توجد إشعارات'}
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 1 }}>
                {activeTab === 0 ? 'عندما يصلك إشعار جديد، سيظهر هنا' : ''}
              </Typography>
            </Box>
          ) : (
            <>
              {filteredList.map((notification, index) => {
                const cfg = getConfig(notification.type);
                const IconComponent = cfg.icon;
                const isNew = !notification.isRead;

                return (
                  <Box key={notification.id}>
                    <Box
                      onClick={() => handleClick(notification)}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        p: 2.5,
                        cursor: 'pointer',
                        bgcolor: isNew
                          ? darkMode ? 'rgba(37, 99, 235, 0.08)' : '#f8fafc'
                          : 'transparent',
                        transition: 'all 0.3s ease',
                        borderLeft: isNew ? '4px solid #2563eb' : '4px solid transparent',
                        '&:hover': {
                          bgcolor: darkMode ? '#334155' : '#f1f5f9',
                        },
                      }}
                    >
                      {/* مؤشر غير مقروء */}
                      {isNew && (
                        <CircleRounded
                          sx={{ fontSize: 10, color: '#2563eb', mt: 1.5, flexShrink: 0 }}
                        />
                      )}

                      {/* أيقونة */}
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: darkMode ? '#475569' : cfg.bgColor,
                          color: cfg.color,
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent />
                      </Avatar>

                      {/* المحتوى */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          fontWeight={isNew ? 700 : 500}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 0.5 }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.body && (
                          <Typography
                            variant="body2"
                            fontFamily="Cairo, sans-serif"
                            sx={{
                              color: darkMode ? '#94a3b8' : '#64748b',
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notification.body}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Chip
                            label={typeLabel(notification.type)}
                            size="small"
                            sx={{
                              bgcolor: darkMode ? '#475569' : cfg.bgColor,
                              color: cfg.color,
                              fontFamily: 'Cairo, sans-serif',
                              fontWeight: 600,
                              fontSize: 11,
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}
                          >
                            {timeAgo(notification.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* أزرار الإجراءات */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                        {isNew && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                            sx={{
                              color: '#2563eb',
                              '&:hover': { bgcolor: '#eff6ff' },
                            }}
                            title="تحديد كمقروء"
                          >
                            <DoneAllRounded fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => deleteOne(notification.id, e)}
                          sx={{
                            color: darkMode ? '#64748b' : '#94a3b8',
                            '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' },
                          }}
                          title="حذف"
                        >
                          <DeleteRounded fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {index < filteredList.length - 1 && (
                      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    )}
                  </Box>
                );
              })}

              {/* زر تحميل المزيد */}
              {pagination.page < pagination.totalPages && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  {loadingMore ? (
                    <CircularProgress size={28} sx={{ color: '#2563eb' }} />
                  ) : (
                    <Button
                      onClick={loadMore}
                      sx={{
                        fontFamily: 'Cairo, sans-serif',
                        fontWeight: 600,
                        color: '#2563eb',
                      }}
                    >
                      تحميل المزيد من الإشعارات
                    </Button>
                  )}
                </Box>
              )}
            </>
          )}
        </Card>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* مؤشر الاتصال المباشر — يظهر في أسفل اليمين */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: darkMode ? '#1e293b' : 'white',
          borderRadius: 2,
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: darkMode ? '#334155' : '#e5e7eb',
          boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: connecting ? '#f59e0b' : '#059669',
            animation: connecting ? 'pulse 1.5s infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }}
        />
        <Typography
          variant="caption"
          fontFamily="Cairo, sans-serif"
          sx={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}
        >
          {connecting ? 'جارٍ الاتصال...' : 'مباشر'}
        </Typography>
      </Box>
    </Box>
  );
};

export default NotificationsPage;
