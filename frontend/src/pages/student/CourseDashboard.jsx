// frontend/src/pages/student/CourseDashboard.jsx
// ✅ FIXES:
//   1. Header stats: totalExams now reads from course.stats.totalExams (backend) correctly
//   2. Notifications: improved response parsing for all backend shapes
//   3. Exam tab counter uses course.exams.length (already correct — kept)
//   4. Sessions tab counter uses course.upcomingSessions.length (already correct — kept)
//   5. COURSE-BASED CHAT: each course has its own isolated chat room
//      Chat sessions are scoped to this courseId — no cross-course mixing

import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Grid, Typography, Card, CardContent,
  Avatar, LinearProgress, Chip, Button, IconButton,
  List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Divider, Badge, TextField, CircularProgress, Alert,
  Tabs, Tab,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBackRounded, PlayCircleFilledRounded, PictureAsPdfRounded,
  QuizRounded, NotificationsRounded, LiveTvRounded, ChatRounded,
  CheckCircleRounded, LockRounded, PersonRounded, PeopleRounded,
  SchoolRounded,
  CalendarTodayRounded, AccessTimeRounded, SendRounded,
  EmojiEventsRounded, MenuBookRounded, LinkRounded, StarRounded,
  RefreshRounded,
} from '@mui/icons-material';
import ThemeContext from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import enrollmentsService from '../../services/enrollments.service';
import API from '../../services/api';
import { io } from 'socket.io-client';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT = '#2563eb';
const GRADIENTS = {
  main:   'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  green:  'linear-gradient(135deg, #059669 0%, #047857 100%)',
  orange: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
  purple: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
};

const TABS = [
  { label: 'الدروس',    icon: <MenuBookRounded />      },
  { label: 'الامتحانات', icon: <QuizRounded />          },
  { label: 'الجلسات',   icon: <LiveTvRounded />        },
  { label: 'التواصل',   icon: <ChatRounded />          },
  { label: 'الإشعارات', icon: <NotificationsRounded /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const toArray = (val) => (Array.isArray(val) ? val : []);

const parseNotifications = (res) => {
  const d = res?.data;
  if (!d) return [];
  if (Array.isArray(d?.data?.notifications)) return d.data.notifications;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.notifications)) return d.notifications;
  if (Array.isArray(d)) return d;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const CourseDashboard = () => {
  const { courseId }  = useParams();
  const navigate      = useNavigate();
  const { darkMode }  = useContext(ThemeContext);
  const { user }      = useAuth();

  // ── Core data ───────────────────────────────────────────────
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [activeTab,     setActiveTab]     = useState(0);

  // ── Notifications ────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [notiLoading,   setNotiLoading]   = useState(false);

  // ── Chat (course-scoped) ──────────────────────────────────────
  // One session per course — chatSession is the session for THIS courseId
  const [chatSession,   setChatSession]   = useState(null);
  const [chatMessages,  setChatMessages]  = useState([]);
  const [chatLoading,   setChatLoading]   = useState(false);
  const [newMessage,    setNewMessage]    = useState('');
  const [sendingMsg,    setSendingMsg]    = useState(false);
  const [chatError,     setChatError]     = useState('');
  const chatEndRef = useRef(null);

  // ── Socket ref ────────────────────────────────────────────────
  const socketRef = useRef(null);
  const chatSessionRef = useRef(null);

  useEffect(() => {
    chatSessionRef.current = chatSession;
  }, [chatSession]);

  // ─────────────────────────────────────────────────────────────
  // 1. Fetch course detail (initial load)
  // ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await enrollmentsService.getCourseDetail(courseId);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في تحميل الكورس');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─────────────────────────────────────────────────────────────
  // 2. Socket — connect once after data loaded
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user?.id) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const sock = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current = sock;

    sock.on('connect', () => {
      console.log('✅ CourseDashboard socket connected');
    });

    sock.on('notification:new', (notif) => {
      if (!notif?.data?.courseId || notif.data.courseId === courseId) {
        setNotifications((prev) => [notif, ...toArray(prev)]);
      }
    });

    sock.on('lesson:published', (lesson) => {
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.course.lessons.some((l) => l.id === lesson.id);
        const lessons = exists
          ? prev.course.lessons.map((l) => l.id === lesson.id ? { ...l, ...lesson } : l)
          : [...prev.course.lessons, lesson].sort((a, b) => a.order - b.order);
        return { ...prev, course: { ...prev.course, lessons } };
      });
    });

    sock.on('exam:published', (exam) => {
      setData((prev) => {
        if (!prev) return prev;
        const exists = prev.course.exams.some((e) => e.id === exam.id);
        const exams = exists
          ? prev.course.exams.map((e) => e.id === exam.id ? { ...e, ...exam } : e)
          : [exam, ...prev.course.exams];
        return { ...prev, course: { ...prev.course, exams } };
      });
    });

    sock.on('schedule:new', (session) => {
      setData((prev) => {
        if (!prev) return prev;
        const sessions = [session, ...toArray(prev.course.upcomingSessions)];
        return { ...prev, course: { ...prev.course, upcomingSessions: sessions } };
      });
    });

    sock.on('live_class:started', (payload) => {
      setNotifications((prev) => [{
        id:        `live-${Date.now()}`,
        type:      'live_class',
        title:     payload.title,
        body:      payload.body,
        data:      payload,
        isRead:    false,
        createdAt: new Date().toISOString(),
      }, ...toArray(prev)]);

      setData((prev) => {
        if (!prev) return prev;
        const liveRooms = toArray(prev.course.liveRooms).map((r) => {
          if (r.roomName === payload.roomName) {
            return { ...r, isActive: true, startedAt: new Date().toISOString(), status: 'live' };
          }
          return r;
        });
        if (!liveRooms.some((r) => r.roomName === payload.roomName)) {
          liveRooms.unshift({
            id:        payload.roomId,
            roomName:  payload.roomName,
            title:     payload.title?.replace('📡 حصة مباشرة: ', '') || '',
            status:    'live',
            isActive:  true,
            startedAt: new Date().toISOString(),
            roomCode:  payload.roomCode,
          });
        }
        return { ...prev, course: { ...prev.course, liveRooms } };
      });
    });

    sock.on('live_class:room_status_changed', (payload) => {
      setData((prev) => {
        if (!prev) return prev;
        const liveRooms = toArray(prev.course.liveRooms).map((r) => {
          if (r.roomName === payload.roomName || r.id === payload.roomId) {
            return { ...r, ...payload };
          }
          return r;
        });
        return { ...prev, course: { ...prev.course, liveRooms } };
      });
    });

    // ── Real-time: new chat message scoped to this course ────────
    sock.on('chat:message', (msg) => {
      // Only add if the message belongs to this course's session
      const currentSession = chatSessionRef.current;
      if (currentSession && msg.sessionId === currentSession.id) {
        setChatMessages((prev) => {
          const exists = prev.some((m) => m.id === msg.id);
          return exists ? prev : [...prev, msg];
        });
      }
    });

    sock.on('disconnect', () => {
      console.log('❌ CourseDashboard socket disconnected');
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, courseId]);

  // ─────────────────────────────────────────────────────────────
  // Tab side-effects
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 4) fetchNotifications();
  }, [activeTab]);

  useEffect(() => {
    // When the user opens the chat tab, load/create the course-scoped session
    if (activeTab === 3 && data?.course?.teacher?.userId) {
      fetchOrCreateCourseChat();
    }
  }, [activeTab, data]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    setNotiLoading(true);
    try {
      const res = await API.get('/notifications', { params: { courseId, limit: 50 } });
      setNotifications(toArray(parseNotifications(res)));
    } catch {
      setNotifications([]);
    } finally {
      setNotiLoading(false);
    }
  };

  const markNotifRead = async (notifId) => {
    try {
      await API.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        toArray(prev).map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const markAllNotifRead = async () => {
    try {
      await API.patch('/notifications/read-all');
      setNotifications((prev) => toArray(prev).map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  // ─────────────────────────────────────────────────────────────
  // Chat — course-scoped
  // Fetches the existing session for (this student, this course)
  // or creates a new one if it doesn't exist yet.
  // ─────────────────────────────────────────────────────────────
  const fetchOrCreateCourseChat = async () => {
    if (!data?.course?.teacher?.userId) return;
    setChatLoading(true);
    setChatError('');
    try {
      // Try to find an existing session for this course
      const sessionsRes = await API.get('/chat/sessions');
      const sessions = toArray(sessionsRes.data?.data ?? sessionsRes.data ?? []);
      const existingSession = sessions.find((s) => s.courseId === courseId);

      if (existingSession) {
        setChatSession(existingSession);
        await fetchChatMessages(existingSession.id);
      } else {
        setChatSession(null);
        setChatMessages([]);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setChatError('خدمة المحادثة غير متاحة حالياً');
      } else {
        setChatError('حدث خطأ في تحميل المحادثة');
      }
    } finally {
      setChatLoading(false);
    }
  };

  const fetchChatMessages = async (sessionId) => {
    try {
      const res = await API.get(`/chat/sessions/${sessionId}/messages`);
      setChatMessages(toArray(res.data?.data ?? res.data ?? []));
    } catch {
      setChatMessages([]);
    }
  };

  // Start a new chat for this course (creates a session scoped to courseId)
  const startCourseChat = async () => {
    if (!data?.course?.teacher?.userId) return;
    setChatLoading(true);
    setChatError('');
    try {
      const res = await API.post('/chat/sessions', {
        teacherUserId: data.course.teacher.userId,
        courseId,
        sessionType: 'teacher_support',
      });
      const session = res.data?.data ?? res.data;
      setChatSession(session);
      setChatMessages([]);
      // Join the socket room for real-time
      socketRef.current?.emit('chat:join_session', { sessionId: session.id });
    } catch (err) {
      if (err.response?.status === 404) setChatError('خدمة المحادثة غير متاحة حالياً');
      else setChatError('حدث خطأ في إنشاء المحادثة');
    } finally {
      setChatLoading(false);
    }
  };

  // Join socket room when session is loaded
  useEffect(() => {
    if (chatSession?.id && socketRef.current?.connected) {
      socketRef.current.emit('chat:join_session', { sessionId: chatSession.id });
    }
  }, [chatSession?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMsg) return;

    // Auto-create session if it doesn't exist yet
    let sessionId = chatSession?.id;
    if (!sessionId) {
      await startCourseChat();
      sessionId = chatSessionRef.current?.id;
      if (!sessionId) return;
    }

    setSendingMsg(true);
    try {
      const res = await API.post(`/chat/sessions/${sessionId}/messages`, {
        message: newMessage.trim(),
      });
      const newMsg = res.data?.data ?? res.data;
      setChatMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg];
      });
      setNewMessage('');
    } catch (err) {
      if (err.response?.status === 404) setChatError('خدمة المحادثة غير متاحة حالياً');
    } finally {
      setSendingMsg(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Loading / Error
  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} thickness={4} />
          <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
            جاري تحميل الكورس...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: darkMode ? '#0f172a' : '#f8fafc', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: '3rem' }}>😕</Typography>
        <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
          {error || 'الكورس غير موجود'}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/student/courses')}
          sx={{ background: GRADIENTS.main, fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 3 }}>
          العودة للكورسات
        </Button>
      </Box>
    );
  }

  const { course, enrollment } = data;
  const safeNotifs  = toArray(notifications);
  const unreadCount = safeNotifs.filter((n) => !n.isRead).length;

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f1f5f9' }}>

      {/* ═══ HERO HEADER ═══════════════════════════════════════ */}
      <Box sx={{ background: GRADIENTS.main, color: 'white', pb: 0, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/student/courses')}
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <ArrowBackRounded />
            </IconButton>
            <IconButton onClick={fetchData} title="تحديث البيانات"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
              <RefreshRounded />
            </IconButton>
          </Box>

          <Grid container spacing={3} sx={{ pb: 3 }} alignItems="center">
            {/* Course Info */}
            <Grid item xs={12} md={8}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: 80, height: 80, borderRadius: 3, flexShrink: 0,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {course.thumbnail
                      ? <img src={course.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <SchoolRounded sx={{ fontSize: 40, color: 'white' }} />}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>
                      {course.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {course.category && (
                        <Chip label={course.category} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
                      )}
                      {course.level && (
                        <Chip label={course.level} size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {course.teacher?.avatar
                          ? <img src={course.teacher.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <PersonRounded />}
                      </Avatar>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
                        {course.teacher?.name}
                      </Typography>
                      {course.teacher?.verified && (
                        <Chip icon={<StarRounded sx={{ fontSize: 14 }} />} label="معتمد" size="small"
                          sx={{ bgcolor: 'rgba(251,191,36,0.3)', color: '#fbbf24', fontFamily: 'Cairo, sans-serif', fontSize: '0.7rem' }} />
                      )}
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Progress Card */}
            <Grid item xs={12} md={4}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Card elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
                      تقدمك في الكورس
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>
                        {enrollment.progress}%
                      </Typography>
                      {enrollment.progress === 100 && <EmojiEventsRounded sx={{ fontSize: 40, color: '#fbbf24' }} />}
                    </Box>
                    <LinearProgress variant="determinate" value={enrollment.progress}
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'white' } }} />
                    <Grid container spacing={1} sx={{ mt: 2 }}>
                      {[
                        { label: 'درس',    value: course.stats?.totalLessons   ?? course.lessons?.length ?? 0 },
                        { label: 'امتحان', value: course.stats?.totalExams     ?? course.exams?.length   ?? 0 },
                        { label: 'طالب',   value: course.stats?.totalStudents  ?? 0 },
                        { label: 'حضرت',   value: course.stats?.attendedCount  ?? 0 },
                      ].map((s) => (
                        <Grid item xs={3} key={s.label}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>{s.value}</Typography>
                            <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable" scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo, sans-serif', fontWeight: 600,
                minHeight: 56, fontSize: '0.95rem',
                '&.Mui-selected': { color: 'white' },
              },
              '& .MuiTabs-indicator': { bgcolor: 'white', height: 3, borderRadius: 2 },
            }}
          >
            {TABS.map((tab, i) => (
              <Tab
                key={i}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {i === 4
                      ? <Badge badgeContent={unreadCount} color="error" max={99}>{tab.icon}</Badge>
                      : tab.icon}
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Container>
      </Box>

      {/* ═══ TAB CONTENT ═══════════════════════════════════════ */}
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
          >

            {/* ══ TAB 0: LESSONS ══════════════════════════════ */}
            {activeTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                    📖 محتوى الكورس — {course.lessons?.length ?? 0} درس
                  </Typography>
                </Grid>
                {!course.lessons?.length ? (
                  <Grid item xs={12}><EmptyState icon="📚" text="لم يتم رفع دروس بعد" /></Grid>
                ) : (
                  course.lessons.map((lesson, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={lesson.id}>
                      <LessonCard
                        lesson={lesson} idx={idx} darkMode={darkMode}
                        onClick={() => navigate(`/student/course/${courseId}/lesson/${lesson.id}`)}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* ══ TAB 1: EXAMS ════════════════════════════════ */}
            {activeTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                    📝 الامتحانات — {course.exams?.length ?? 0} امتحان
                  </Typography>
                </Grid>
                {!course.exams?.length ? (
                  <Grid item xs={12}><EmptyState icon="📝" text="لا توجد امتحانات بعد" /></Grid>
                ) : (
                  course.exams.map((exam) => (
                    <Grid item xs={12} md={6} key={exam.id}>
                      <ExamCard exam={exam} darkMode={darkMode} courseId={courseId} navigate={navigate} />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* ══ TAB 2: SESSIONS ═════════════════════════════ */}
            {activeTab === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 2 }}>
                    🔴 الجلسات — {((course.liveRooms?.length ?? 0) + (course.upcomingSessions?.length ?? 0))} جلسة
                  </Typography>
                </Grid>

                {course.liveRooms?.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif"
                        sx={{ color: '#10b981', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LiveTvRounded sx={{ fontSize: 20 }} />
                        الحصص المباشرة
                      </Typography>
                    </Grid>
                    {course.liveRooms.map((room) => (
                      <Grid item xs={12} md={6} key={room.id || room.roomName}>
                        <LiveRoomCard room={room} darkMode={darkMode} navigate={navigate} courseId={courseId} />
                      </Grid>
                    ))}
                  </>
                )}

                {course.upcomingSessions?.length > 0 && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayRounded sx={{ fontSize: 18 }} />
                        الجلسات المجدولة
                      </Typography>
                    </Grid>
                    {course.upcomingSessions.map((session) => (
                      <Grid item xs={12} md={6} key={session.id}>
                        <SessionCard session={session} darkMode={darkMode} />
                      </Grid>
                    ))}
                  </>
                )}

                {!course.liveRooms?.length && !course.upcomingSessions?.length && (
                  <Grid item xs={12}><EmptyState icon="📡" text="لا توجد جلسات حالياً" /></Grid>
                )}
              </Grid>
            )}

            {/* ══ TAB 3: CHAT (COURSE-SCOPED) ═════════════════ */}
            {activeTab === 3 && (
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} md={8}>
                  <Card elevation={0} sx={{
                    border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
                    bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3,
                    height: 560, display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Chat Header */}
                    <CardContent sx={{ p: 2, borderBottom: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: ACCENT }}>
                          {course.teacher?.avatar
                            ? <img src={course.teacher.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : <PersonRounded />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                            {course.teacher?.name}
                          </Typography>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#059669' }}>
                            مدرس الكورس • {course.title}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<PeopleRounded sx={{ fontSize: 14 }} />}
                          label="3-way"
                          size="small"
                          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.65rem', bgcolor: `${ACCENT}10`, color: ACCENT }}
                        />
                      </Box>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8', display: 'block', mt: 0.5 }}>
                        💬 محادثة ثلاثية خاصة بكورس: {course.title}
                      </Typography>
                    </CardContent>

                    {/* Messages area */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {chatError ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                          <ChatRounded sx={{ fontSize: 56, color: darkMode ? '#334155' : '#e2e8f0' }} />
                          <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center' }}>
                            {chatError}
                          </Typography>
                        </Box>
                      ) : chatLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <CircularProgress size={32} />
                        </Box>
                      ) : !chatSession ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                          <ChatRounded sx={{ fontSize: 56, color: darkMode ? '#334155' : '#e2e8f0' }} />
                          <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                            ابدأ محادثة مع مدرس الكورس
                          </Typography>
                          <Button variant="contained" onClick={startCourseChat}
                            sx={{ background: GRADIENTS.main, fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 3 }}>
                            بدء محادثة
                          </Button>
                        </Box>
                      ) : chatMessages.length === 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                          <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                            لا توجد رسائل. اكتب أول رسالة!
                          </Typography>
                        </Box>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMine = msg.senderUserId === user?.id;
                          return (
                            <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                              <Box sx={{
                                maxWidth: '70%', px: 2, py: 1.5,
                                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                background: isMine ? GRADIENTS.main : (darkMode ? '#0f172a' : '#f1f5f9'),
                                color: isMine ? 'white' : (darkMode ? '#f1f5f9' : '#1e293b'),
                              }}>
                                {!isMine && (
                                  <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                    sx={{ color: msg.sender?.role === 'teacher' ? '#7c3aed' : '#059669', fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                                    {msg.sender?.name} {msg.sender?.role === 'teacher' ? '• مدرس' : msg.sender?.role === 'assistant_teacher' ? '• مساعد' : ''}
                                  </Typography>
                                )}
                                <Typography variant="body2" fontFamily="Cairo, sans-serif">{msg.message}</Typography>
                                <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                  sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: 'left', fontSize: '0.65rem' }}>
                                  {new Date(msg.sentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </Box>

                    {/* Input */}
                    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth size="small"
                        placeholder={chatError ? 'المحادثة غير متاحة حالياً' : 'اكتب رسالتك للمدرس...'}
                        value={newMessage}
                        disabled={!!chatError}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: 3, fontFamily: 'Cairo, sans-serif',
                          },
                        }}
                      />
                      <IconButton
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMsg || !!chatError}
                        sx={{ bgcolor: ACCENT, color: 'white', '&:hover': { bgcolor: '#1d4ed8' }, '&.Mui-disabled': { bgcolor: darkMode ? '#334155' : '#e5e7eb' } }}
                      >
                        {sendingMsg ? <CircularProgress size={20} color="inherit" /> : <SendRounded />}
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ══ TAB 4: NOTIFICATIONS ════════════════════════ */}
            {activeTab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                      🔔 إشعاراتك ({unreadCount} غير مقروءة)
                    </Typography>
                    {unreadCount > 0 && (
                      <Button size="small" variant="outlined"
                        onClick={markAllNotifRead}
                        sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
                        تعليم الكل كمقروء
                      </Button>
                    )}
                  </Box>
                </Grid>

                {notiLoading ? (
                  <Grid item xs={12} sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Grid>
                ) : safeNotifs.length === 0 ? (
                  <Grid item xs={12}><EmptyState icon="🔔" text="لا توجد إشعارات" /></Grid>
                ) : (
                  safeNotifs.map((notif) => (
                    <Grid item xs={12} key={notif.id}>
                      <NotifCard notif={notif} darkMode={darkMode} onRead={markNotifRead} />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

          </motion.div>
        </AnimatePresence>
      </Container>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes livePulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.3); } }
      `}</style>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

const LessonCard = ({ lesson, idx, darkMode, onClick }) => {
  const color = ['#2563eb','#7c3aed','#059669','#db2777','#0891b2','#ca8a04'][idx % 6];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
      <Card
        elevation={0}
        onClick={lesson.isPublished ? onClick : undefined}
        sx={{
          border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
          bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3,
          cursor: lesson.isPublished ? 'pointer' : 'not-allowed',
          transition: 'all 0.25s', opacity: lesson.isPublished ? 1 : 0.5,
          '&:hover': lesson.isPublished
            ? { borderColor: color, transform: 'translateY(-4px)', boxShadow: `0 12px 32px ${color}20` }
            : {},
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {lesson.isPublished
                ? (lesson.attended
                    ? <CheckCircleRounded sx={{ color: 'white', fontSize: 22 }} />
                    : <PlayCircleFilledRounded sx={{ color: 'white', fontSize: 22 }} />)
                : <LockRounded sx={{ color: 'white', fontSize: 22 }} />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" noWrap
                sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                {lesson.title}
              </Typography>
              <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                درس {lesson.order}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {lesson.videoUrl && (
              <Chip icon={<PlayCircleFilledRounded sx={{ fontSize: 14 }} />} label="فيديو" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: `${color}15`, color, fontSize: '0.7rem' }} />
            )}
            {lesson.pdfFileRef && (
              <Chip icon={<PictureAsPdfRounded sx={{ fontSize: 14 }} />} label="PDF" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: '#dc262615', color: '#dc2626', fontSize: '0.7rem' }} />
            )}
            {lesson.attended && (
              <Chip icon={<CheckCircleRounded sx={{ fontSize: 14 }} />} label="حضرت" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: '#05966915', color: '#059669', fontSize: '0.7rem' }} />
            )}
            {!lesson.isPublished && (
              <Chip label="غير متاح" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: darkMode ? '#334155' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '0.7rem' }} />
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ExamCard = ({ exam, darkMode, courseId, navigate }) => {
  const now         = new Date();
  const from        = exam.availableFrom ? new Date(exam.availableFrom) : null;
  const to          = exam.availableTo   ? new Date(exam.availableTo)   : null;
  const isAvailable = (!from || now >= from) && (!to || now <= to);
  const hasPassed   = exam.myAttempt?.isPassed;
  const hasAttempt  = !!exam.myAttempt;

  const statusColor = hasPassed ? '#059669' : hasAttempt ? '#ea580c' : isAvailable ? ACCENT : '#64748b';
  const statusLabel = hasPassed
    ? 'نجحت ✓'
    : hasAttempt ? `${exam.myAttempt.score?.toFixed(0) ?? 0} درجة`
    : isAvailable ? 'متاح' : 'غير متاح';

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}>
            {exam.title}
          </Typography>
          <Chip label={statusLabel} size="small"
            sx={{ bgcolor: `${statusColor}15`, color: statusColor, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
        </Box>

        {exam.description && (
          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
            {exam.description}
          </Typography>
        )}

        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[
            { label: 'المدة',         value: `${exam.durationMinutes ?? exam.duration ?? 0} دقيقة`, icon: '⏱' },
            { label: 'الأسئلة',       value: exam.questionsCount ?? 0,                               icon: '❓' },
            { label: 'الدرجة الكلية', value: exam.totalMarks,                                       icon: '📊' },
            { label: 'درجة النجاح',   value: exam.passingMarks,                                     icon: '🎯' },
          ].map((s) => (
            <Grid item xs={6} key={s.label}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>{s.icon}</Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>{s.value}</Typography>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>{s.label}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {from && (
          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8', display: 'block', mb: 2 }}>
            📅 من {new Date(from).toLocaleString('ar-EG')} {to ? `— إلى ${new Date(to).toLocaleString('ar-EG')}` : ''}
          </Typography>
        )}

        <Button
          fullWidth variant="contained"
          disabled={!isAvailable || hasAttempt}
          onClick={() => navigate('/student/exams')}
          sx={{
            background: isAvailable && !hasAttempt ? `linear-gradient(135deg, ${ACCENT} 0%, #7c3aed 100%)` : undefined,
            fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2,
            '&.Mui-disabled': { bgcolor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#64748b' : '#94a3b8' },
          }}
        >
          {hasAttempt ? 'تم التقديم' : isAvailable ? 'ابدأ الامتحان' : 'غير متاح الآن'}
        </Button>
      </CardContent>
    </Card>
  );
};

const LiveRoomCard = ({ room, darkMode, navigate, courseId }) => {
  const statusColors = {
    live:      { bg: '#059669', label: 'مباشر الآن', pulse: true },
    scheduled: { bg: '#2563eb', label: 'مجدول',      pulse: false },
    ended:     { bg: '#64748b', label: 'انتهى',      pulse: false },
  };
  const statusInfo = statusColors[room.status] || statusColors.ended;

  return (
    <Card elevation={0} sx={{
      border: '1px solid',
      borderColor: room.status === 'live' ? '#059669' : (darkMode ? '#334155' : '#e5e7eb'),
      bgcolor: darkMode ? '#1e293b' : 'white',
      borderRadius: 3, overflow: 'visible', position: 'relative', transition: 'all 0.25s',
      '&:hover': room.status === 'live'
        ? { borderColor: '#10b981', transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(5,150,105,0.2)' }
        : {},
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}>
            {room.title || 'حصة مباشرة'}
          </Typography>
          <Chip
            icon={statusInfo.pulse
              ? <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white', display: 'inline-block', animation: 'livePulse 1.5s infinite', ml: 0.5 }} />
              : undefined}
            label={statusInfo.label} size="small"
            sx={{ bgcolor: statusInfo.bg, color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 700, animation: statusInfo.pulse ? 'pulse 2s infinite' : 'none' }}
          />
        </Box>

        {room.description && (
          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
            {room.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonRounded sx={{ fontSize: 16, color: '#7c3aed' }} />
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              {room.teacherName || 'المدرس'}
            </Typography>
          </Box>
          {room.scheduledAt && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayRounded sx={{ fontSize: 16, color: '#2563eb' }} />
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                {new Date(room.scheduledAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' — '}
                {new Date(room.scheduledAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleRounded sx={{ fontSize: 16, color: '#2563eb' }} />
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              {room.participantCount || 0} مشارك{room.maxCapacity ? ` (الحد الأقصى: ${room.maxCapacity})` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#f59e0b', letterSpacing: '0.15em' }}>
              🔑 {room.roomCode}
            </Box>
          </Box>
        </Box>

        {room.status === 'live' ? (
          <Button fullWidth variant="contained" onClick={() => navigate(`/student/live-class?room=${room.roomName}`)}
            startIcon={<LiveTvRounded />}
            sx={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            🚀 انضم الآن
          </Button>
        ) : room.status === 'scheduled' ? (
          <Button fullWidth variant="outlined" disabled sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            ⌛ انتظر حتى الموعد
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2, color: darkMode ? '#64748b' : '#94a3b8' }}>
            ✅ انتهت
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const SessionCard = ({ session, darkMode }) => {
  const date      = new Date(session.date);
  const dayName   = date.toLocaleDateString('ar-EG', { weekday: 'long' });
  const dateStr   = date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
  const typeLabel = session.type === 'online' ? 'أونلاين' : 'حضوري';
  const typeColor = session.type === 'online' ? '#059669' : '#2563eb';

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            {session.title}
          </Typography>
          <Chip label={typeLabel} size="small" sx={{ bgcolor: `${typeColor}15`, color: typeColor, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
        </Box>
        {session.description && (
          <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', mb: 2 }}>
            {session.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayRounded sx={{ fontSize: 16, color: ACCENT }} />
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              {dayName} — {dateStr}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeRounded sx={{ fontSize: 16, color: ACCENT }} />
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              {session.startTime} — {session.endTime}
            </Typography>
          </Box>
          {session.maxStudents && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonRounded sx={{ fontSize: 16, color: ACCENT }} />
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                الحد الأقصى: {session.maxStudents} طالب
              </Typography>
            </Box>
          )}
        </Box>
        {session.meetingLink ? (
          <Button fullWidth variant="contained" href={session.meetingLink} target="_blank" rel="noopener noreferrer"
            startIcon={<LinkRounded />}
            sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            انضم للجلسة
          </Button>
        ) : (
          <Button fullWidth variant="outlined" disabled sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2 }}>
            الرابط لم يُضف بعد
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const NotifCard = ({ notif, darkMode, onRead }) => (
  <Card elevation={0} onClick={() => onRead(notif.id)} sx={{
    border: '1px solid',
    borderColor: !notif.isRead ? ACCENT : (darkMode ? '#334155' : '#e5e7eb'),
    bgcolor: !notif.isRead ? (darkMode ? 'rgba(37,99,235,0.08)' : '#eff6ff') : (darkMode ? '#1e293b' : 'white'),
    borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { borderColor: ACCENT },
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, flexShrink: 0,
          background: !notif.isRead ? GRADIENTS.main : (darkMode ? '#334155' : '#f1f5f9'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <NotificationsRounded sx={{ fontSize: 22, color: !notif.isRead ? 'white' : (darkMode ? '#64748b' : '#94a3b8') }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
            <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
              {notif.title}
            </Typography>
            {!notif.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ACCENT, flexShrink: 0, mt: 0.5 }} />}
          </Box>
          {notif.body && (
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', whiteSpace: 'pre-line' }}>
              {notif.body}
            </Typography>
          )}
          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#475569' : '#94a3b8', display: 'block', mt: 1 }}>
            {new Date(notif.createdAt).toLocaleString('ar-EG')}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const EmptyState = ({ icon, text }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="h1" sx={{ fontSize: '3.5rem', mb: 1.5 }}>{icon}</Typography>
    <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: '#94a3b8' }}>
      {text}
    </Typography>
  </Box>
);

export default CourseDashboard;