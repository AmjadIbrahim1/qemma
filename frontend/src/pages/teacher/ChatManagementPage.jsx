// frontend/src/pages/teacher/ChatManagementPage.jsx
// COURSE-BASED CHAT: each student × course has its own isolated chat room.
// Teacher sees sessions grouped by course. Selecting a student+course opens
// that specific session. Sessions are NEVER merged across courses.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import ChatService from '../../services/chat.service';
import useChat from '../../hooks/useChat';
import {
  Container, Box, Typography, Card, CardContent, Avatar, IconButton,
  TextField, InputAdornment, Chip, Badge, Grid, Paper, Button,
  CircularProgress, Divider, ListItemButton, ListItemIcon, ListItemText,
  FormControl, InputLabel, Select, MenuItem, Tabs, Tab,
} from '@mui/material';
import {
  ArrowBack, Search, Send, Person, ChatBubbleOutline, School,
  People, MoreVert, CheckCircle, MenuBook,
} from '@mui/icons-material';

const ACCENT = '#7c3aed';
const GRADIENTS = {
  main: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
};

const ChatManagementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const chat = useChat();

  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [messageInput, setMessageInput]   = useState('');
  const [sendingMsg, setSendingMsg]       = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Data
  const [courses, setCourses]       = useState([]);
  const [students, setStudents]     = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [sessions, setSessions]     = useState([]);  // all sessions from backend
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  // Group sessions by course for display
  // Map: courseId → { courseTitle, sessions: [...] }
  const [sessionsByCourse, setSessionsByCourse] = useState({});

  const chatEndRef = useRef(null);

  // ── Connect to socket ────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) chat.connect(token);
    return () => chat.disconnect();
  }, []);

  // ── Fetch initial data ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, studentsRes, sessionsRes] = await Promise.all([
        ChatService.getTeacherCourses(),
        ChatService.getTeacherStudents(),
        ChatService.getSessions(),
      ]);
      const coursesData  = coursesRes.data?.data  || [];
      const studentsData = studentsRes.data?.data || [];
      const sessionsData = sessionsRes.data?.data || [];

      setCourses(coursesData);
      setAllStudents(studentsData);
      setSessions(sessionsData);
      chat.setSessions(sessionsData);

      // Group sessions by courseId
      groupSessionsByCourse(sessionsData, coursesData);
    } catch {
      setError('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Group sessions by course ──────────────────────────────────
  const groupSessionsByCourse = (sessionsData, coursesData) => {
    const courseMap = Object.fromEntries(coursesData.map((c) => [c.id, c.title]));
    const grouped   = {};
    for (const s of sessionsData) {
      const cId    = s.courseId || 'no-course';
      const cTitle = s.courseTitle || courseMap[cId] || 'بدون كورس';
      if (!grouped[cId]) grouped[cId] = { courseTitle: cTitle, courseId: cId, sessions: [] };
      grouped[cId].sessions.push(s);
    }
    setSessionsByCourse(grouped);
  };

  // ── Filter students when course changes ───────────────────────
  useEffect(() => {
    if (selectedCourse) {
      const filtered = allStudents.filter((s) =>
        s.courses?.some((c) => c.id === selectedCourse)
      );
      setStudents(filtered);
    } else {
      setStudents(allStudents);
    }
  }, [selectedCourse, allStudents]);

  // ── Filter by search ──────────────────────────────────────────
  const filteredStudents = students.filter((s) => {
    const name = s.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ── Select a student+course → open the correct session ───────
  const handleSelectStudentForCourse = async (studentUser, courseId) => {
    setError('');
    try {
      // Find existing session for this student × course
      const existingSession = sessions.find(
        (s) => s.student?.id === studentUser.userId && s.courseId === courseId
      );

      let session;
      if (existingSession) {
        session = existingSession;
      } else {
        // Create a new session scoped to this course
        const res = await ChatService.openSessionWithStudent(studentUser.userId, courseId);
        session = res.data?.data;
        const newSession = {
          ...session,
          student: { id: studentUser.userId, name: studentUser.name, avatar: studentUser.avatar },
        };
        setSessions((prev) => [newSession, ...prev]);
        session = newSession;
      }

      chat.selectSession(session);
      const msgsRes = await ChatService.getMessages(session.id);
      chat.setMessages(msgsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في فتح المحادثة');
    }
  };

  // Legacy: clicking a student without a specific course
  // Uses the first enrolled course of that student as the context
  const handleSelectStudent = async (studentUser) => {
    const firstCourse = studentUser.courses?.[0];
    if (!firstCourse) {
      setError('الطالب غير مسجّل في أي كورس');
      return;
    }
    await handleSelectStudentForCourse(studentUser, firstCourse.id);
  };

  // ── Send message ──────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMsg || !chat.activeSession) return;
    setSendingMsg(true);
    try {
      const res = await ChatService.sendMessage(chat.activeSession.id, messageInput.trim());
      const newMsg = res.data?.data || res.data;
      chat.addMessage(newMsg);
      setMessageInput('');
    } catch {
      // silent
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Typing ────────────────────────────────────────────────────
  const handleTyping = (value) => {
    setMessageInput(value);
    if (!chat.activeSession) return;
    chat.sendTyping(chat.activeSession.id, user?.name || 'المدرس');
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => chat.sendStopTyping(chat.activeSession.id), 2000);
    setTypingTimeout(t);
  };

  // ── Scroll to bottom ──────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // ── Stats ─────────────────────────────────────────────────────
  const totalStudentsCount = allStudents.length;
  const activeChatCount    = sessions.filter((s) => (s.messagesCount || 0) > 0).length;
  const courseCount        = courses.length;

  // ─────────────────────────────────────────────────────────────
  // If no active session → management view
  // ─────────────────────────────────────────────────────────────
  if (!chat.activeSession) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pt: 10, pb: 4 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white', overflow: 'hidden' }}>
            <Box sx={{ background: GRADIENTS.main, p: 3, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <IconButton onClick={() => navigate('/teacher/dashboard')}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                  💬 إدارة المحادثات
                </Typography>
              </Box>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mr: 7 }}>
                كل كورس له غرفة محادثة منفصلة — المحادثات لا تُدمج بين الكورسات
              </Typography>
            </Box>
          </Card>

          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <StatsCard value={totalStudentsCount} label="إجمالي الطلاب" icon={<People />} color={ACCENT} darkMode={darkMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCard value={activeChatCount} label="محادثات نشطة" icon={<ChatBubbleOutline />} color="#2563eb" darkMode={darkMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCard value={courseCount} label="الكورسات" icon={<School />} color="#059669" darkMode={darkMode} />
            </Grid>
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
            bgcolor: darkMode ? '#1e293b' : 'white' }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>تصفية بالكورس</InputLabel>
                    <Select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      label="تصفية بالكورس"
                      sx={{ fontFamily: 'Cairo, sans-serif', borderRadius: 2 }}
                    >
                      <MenuItem value="" sx={{ fontFamily: 'Cairo, sans-serif' }}>كل الكورسات</MenuItem>
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id} sx={{ fontFamily: 'Cairo, sans-serif' }}>{c.title}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth size="small"
                    placeholder="ابحث عن طالب بالاسم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                      sx: { fontFamily: 'Cairo, sans-serif', borderRadius: 2 },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fca5a5' }}>
              <Typography fontFamily="Cairo, sans-serif" sx={{ color: '#dc2626' }}>{error}</Typography>
            </Box>
          )}

          {/* ── Sessions grouped by course ── */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
          ) : selectedCourse ? (
            // When a course is filtered, show students in that course
            <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  طلاب الكورس ({filteredStudents.length})
                </Typography>
              </Box>
              {filteredStudents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <People sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
                  <Typography fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>
                    {searchQuery ? 'لا توجد نتائج' : 'لا يوجد طلاب في هذا الكورس'}
                  </Typography>
                </Box>
              ) : (
                filteredStudents.map((student, idx) => (
                  <Box key={student.userId || student.studentId}>
                    <StudentSessionRow
                      student={student}
                      courseId={selectedCourse}
                      sessions={sessions}
                      darkMode={darkMode}
                      onSelect={() => handleSelectStudentForCourse(student, selectedCourse)}
                    />
                    {idx < filteredStudents.length - 1 && (
                      <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
                    )}
                  </Box>
                ))
              )}
            </Card>
          ) : (
            // No filter → show all courses with their sessions
            Object.keys(sessionsByCourse).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ChatBubbleOutline sx={{ fontSize: 48, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
                <Typography fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>
                  لا توجد محادثات بعد
                </Typography>
              </Box>
            ) : (
              Object.values(sessionsByCourse)
                .filter((group) => {
                  if (!searchQuery) return true;
                  return group.sessions.some((s) =>
                    (s.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
                  );
                })
                .map((group) => (
                  <CourseSessionGroup
                    key={group.courseId}
                    group={group}
                    searchQuery={searchQuery}
                    darkMode={darkMode}
                    onSelectSession={(session) => {
                      const student = allStudents.find((s) => s.userId === session.student?.id);
                      if (student) handleSelectStudentForCourse(student, group.courseId);
                      else {
                        // Fall back: select session directly
                        chat.selectSession(session);
                        ChatService.getMessages(session.id).then((res) => {
                          chat.setMessages(res.data?.data || []);
                        });
                      }
                    }}
                  />
                ))
            )
          )}
        </Container>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Chat View
  // ─────────────────────────────────────────────────────────────
  const activeCourseTitle = chat.activeSession.courseTitle ||
    courses.find((c) => c.id === chat.activeSession.courseId)?.title || '';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
      {/* Chat Header */}
      <Box sx={{
        background: GRADIENTS.main, color: 'white', p: 2,
        display: 'flex', alignItems: 'center', gap: 2,
        boxShadow: '0 4px 20px rgba(124,58,237,0.2)', mt: 8,
      }}>
        <IconButton onClick={() => chat.selectSession(null)}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ width: 44, height: 44, bgcolor: 'white', color: ACCENT, fontWeight: 700 }}>
          {chat.activeSession.student?.avatar
            ? <img src={chat.activeSession.student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <Person />}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif">
            {chat.activeSession.student?.name || 'طالب'}
          </Typography>
          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.85 }}>
            محادثة 3-way • {chat.connected ? '🟢 متصل' : '🔴 غير متصل'}
            {activeCourseTitle ? ` • ${activeCourseTitle}` : ''}
          </Typography>
        </Box>
        {activeCourseTitle && (
          <Chip
            icon={<MenuBook sx={{ fontSize: 14 }} />}
            label={activeCourseTitle}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.65rem', maxWidth: 160 }}
          />
        )}
      </Box>

      {/* Messages */}
      <Box sx={{
        flex: 1, overflowY: 'auto', p: 3,
        background: darkMode ? 'linear-gradient(to bottom, #0f172a, #1e293b)' : 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
      }}>
        {chat.messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <ChatBubbleOutline sx={{ fontSize: 56, color: darkMode ? '#334155' : '#e2e8f0' }} />
            <Typography fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
              ابدأ المحادثة مع الطالب
            </Typography>
            {activeCourseTitle && (
              <Chip label={`كورس: ${activeCourseTitle}`} size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', bgcolor: `${ACCENT}15`, color: ACCENT }} />
            )}
          </Box>
        ) : (
          <>
            {chat.messages.map((msg) => {
              const isMine = msg.senderUserId === user?.id;
              const senderName = msg.sender?.name || (isMine ? 'أنت' : 'الطالب');
              return (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 2 }}>
                  <Paper elevation={0} sx={{
                    maxWidth: '70%', px: 2, py: 1.5,
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMine ? GRADIENTS.main : (darkMode ? '#1e293b' : 'white'),
                    color: isMine ? 'white' : (darkMode ? '#f1f5f9' : '#1e293b'),
                    border: isMine ? 'none' : '1px solid',
                    borderColor: darkMode ? '#334155' : '#e5e7eb',
                  }}>
                    {!isMine && (
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: msg.sender?.role === 'assistant_teacher' ? '#059669' : '#2563eb', fontWeight: 700, display: 'block', mb: 0.5 }}>
                        {senderName} {msg.sender?.role === 'assistant_teacher' ? '• مساعد' : msg.sender?.role === 'teacher' ? '• مدرس' : ''}
                      </Typography>
                    )}
                    <Typography variant="body2" fontFamily="Cairo, sans-serif">{msg.message}</Typography>
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: 'left', fontSize: '0.65rem' }}>
                      {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </Box>

      {/* Input */}
      <Box sx={{
        p: 2, bgcolor: darkMode ? '#1e293b' : 'white',
        borderTop: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
        display: 'flex', gap: 1,
      }}>
        <TextField
          fullWidth size="small"
          placeholder="اكتب رسالتك..."
          value={messageInput}
          onChange={(e) => handleTyping(e.target.value)}
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
          disabled={!messageInput.trim() || sendingMsg}
          sx={{ bgcolor: ACCENT, color: 'white', '&:hover': { bgcolor: '#6d28d9' }, '&.Mui-disabled': { bgcolor: darkMode ? '#334155' : '#e5e7eb' } }}
        >
          {sendingMsg ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </IconButton>
      </Box>
    </Box>
  );
};

// ── Course Session Group ──────────────────────────────────────────
const CourseSessionGroup = ({ group, searchQuery, darkMode, onSelectSession }) => {
  const filteredSessions = group.sessions.filter((s) =>
    !searchQuery || (s.student?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!filteredSessions.length) return null;

  return (
    <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
      bgcolor: darkMode ? '#1e293b' : 'white', overflow: 'hidden' }}>
      {/* Course header */}
      <Box sx={{ px: 3, py: 2, background: darkMode ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
        borderBottom: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <School sx={{ color: '#7c3aed', fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={800} fontFamily="Cairo, sans-serif"
          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', flex: 1 }}>
          {group.courseTitle}
        </Typography>
        <Chip label={`${filteredSessions.length} طالب`} size="small"
          sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.65rem',
            bgcolor: 'rgba(124,58,237,0.1)', color: '#7c3aed' }} />
      </Box>

      {/* Sessions */}
      {filteredSessions.map((session, idx) => (
        <Box key={session.id}>
          <ListItemButton
            onClick={() => onSelectSession(session)}
            sx={{ px: 3, py: 2, '&:hover': { bgcolor: darkMode ? 'rgba(124,58,237,0.08)' : '#f8fafc' } }}
          >
            <ListItemIcon sx={{ minWidth: 52 }}>
              <Badge badgeContent={session.messagesCount || 0} color="error" max={99}>
                <Avatar sx={{ bgcolor: '#7c3aed' }}>
                  {session.student?.avatar
                    ? <img src={session.student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <Person />}
                </Avatar>
              </Badge>
            </ListItemIcon>
            <ListItemText
              primaryTypographyProps={{ component: 'div' }}
              secondaryTypographyProps={{ component: 'div' }}
              primary={
                <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
                  {session.student?.name || 'طالب'}
                </Typography>
              }
              secondary={
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  {session.lastMessage && (
                    <Typography variant="caption" fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? '#64748b' : '#94a3b8' }} noWrap>
                      آخر رسالة: {session.lastMessage.message}
                    </Typography>
                  )}
                </Box>
              }
            />
            <Typography variant="caption" fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? '#64748b' : '#94a3b8', flexShrink: 0 }}>
              {session.lastActive && new Date(session.lastActive).getTime() > 0
                ? new Date(session.lastActive).toLocaleDateString('ar-EG')
                : 'جديد'}
            </Typography>
          </ListItemButton>
          {idx < filteredSessions.length - 1 && (
            <Divider sx={{ borderColor: darkMode ? '#334155' : '#e5e7eb' }} />
          )}
        </Box>
      ))}
    </Card>
  );
};

// ── Student session row (when filtered by course) ─────────────────
const StudentSessionRow = ({ student, courseId, sessions, darkMode, onSelect }) => {
  const session = sessions.find(
    (s) => s.student?.id === student.userId && s.courseId === courseId
  );
  return (
    <ListItemButton
      onClick={onSelect}
      sx={{ px: 3, py: 2, '&:hover': { bgcolor: darkMode ? 'rgba(124,58,237,0.08)' : '#f8fafc' } }}
    >
      <ListItemIcon sx={{ minWidth: 52 }}>
        <Badge badgeContent={session?.messagesCount || 0} color="error" max={99}>
          <Avatar sx={{ bgcolor: '#7c3aed' }}>
            {student.avatar
              ? <img src={student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <Person />}
          </Avatar>
        </Badge>
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>
            {student.name || 'طالب'}
          </Typography>
        }
        secondary={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {session?.lastMessage && (
              <Typography variant="caption" fontFamily="Cairo, sans-serif"
                sx={{ color: darkMode ? '#64748b' : '#94a3b8' }} noWrap>
                آخر رسالة: {session.lastMessage.message}
              </Typography>
            )}
            {!session?.messagesCount && (
              <Chip label="لا توجد رسائل بعد" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.6rem',
                  bgcolor: darkMode ? '#334155' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b' }} />
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
};

// ── Stats Card ────────────────────────────────────────────────────
const StatsCard = ({ value, label, icon, color, darkMode }) => (
  <Card sx={{
    borderRadius: 2.5, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb',
    bgcolor: darkMode ? '#1e293b' : 'white',
    transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' },
  }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2, bgcolor: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
          sx={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}>{value}</Typography>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b' }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default ChatManagementPage;