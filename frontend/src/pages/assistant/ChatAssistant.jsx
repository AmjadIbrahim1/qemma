// frontend/src/pages/assistant/ChatAssistant.jsx
// FIX:
//   1. استرجاع الطلاب المشتركين مع المدرس الأساسي
//   2. فتح شات مباشر مع أي طالب من القائمة (بدون انتظار الطالب)
//   3. الشات ثلاثي: طالب + مدرس + مساعد

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import ChatService from '../../services/chat.service';
import useChat from '../../hooks/useChat';
import API from '../../services/api';
import {
  Container, Box, Typography, Card, CardContent, Avatar, IconButton,
  TextField, InputAdornment, Chip, Badge, Grid, Paper, Button,
  CircularProgress, Divider, ListItemButton, ListItemIcon, ListItemText,
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent,
} from '@mui/material';
import {
  ArrowBack, Search, Send, Person, ChatBubbleOutline, School,
  People, CheckCircle, Assignment, Home as HomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ACCENT = '#059669';
const GRADIENTS = { main: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' };

const ChatAssistant = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const isDark = darkMode;
  const chat = useChat();

  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [messageInput,   setMessageInput]   = useState('');
  const [sendingMsg,     setSendingMsg]      = useState(false);

  const [courses,     setCourses]     = useState([]);
  const [students,    setStudents]    = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);

  const chatEndRef       = useRef(null);
  const typingTimeoutRef = useRef(null);

  // ── Theme helpers ─────────────────────────────────────────────
  const textPrimary   = isDark ? '#f1f5f9' : '#1e293b';
  const textSecondary = isDark ? '#94a3b8' : '#64748b';
  const cardBg        = isDark ? '#1e293b' : 'white';
  const borderC       = isDark ? '#334155' : '#e5e7eb';

  // ── Connect socket ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) chat.connect(token);
    return () => chat.disconnect();
  }, []);

  // ── Fetch data ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, studentsRes, sessionsRes] = await Promise.all([
        ChatService.getTeacherCourses(),
        ChatService.getTeacherStudents(),
        ChatService.getSessions(),
      ]);
      setCourses(coursesRes.data?.data || []);
      setAllStudents(studentsRes.data?.data || []);
      setSessions(sessionsRes.data?.data || []);
      chat.setSessions(sessionsRes.data?.data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message || 'لم يتم تفعيل حساب المدرس المساعد بعد. يرجى التواصل مع المدرس الرئيسي لتفعيل حسابك.');
      } else {
        setError('حدث خطأ في تحميل البيانات');
      }
      console.error('fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter by course ──────────────────────────────────────────
  useEffect(() => {
    if (selectedCourse) {
      setStudents(allStudents.filter((s) => s.courses?.some((c) => c.id === selectedCourse)));
    } else {
      setStudents(allStudents);
    }
  }, [selectedCourse, allStudents]);

  // ── Filter by search ──────────────────────────────────────────
  const filteredStudents = students.filter((s) =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Select student — يفتح شات مباشرةً (بدون انتظار الطالب) ──
  const handleSelectStudent = async (studentUser) => {
    setError('');
    try {
      // أولاً: هل في session موجودة لهذا الطالب في الـ sessions list؟
      const existingSession = sessions.find((s) => s.student?.id === studentUser.userId);

      let session;
      if (existingSession) {
        session = existingSession;
      } else {
        // إنشاء session جديدة عبر الـ endpoint الجديد
        const res = await API.post('/chat/teacher/open-session', {
          studentUserId: studentUser.userId,
        });
        session = res.data?.data;

        // إضافة الـ session للقائمة المحلية
        const newSession = {
          ...session,
          student: { id: studentUser.userId, name: studentUser.name, avatar: studentUser.avatar },
        };
        setSessions((prev) => [newSession, ...prev]);
        session = newSession;
      }

      chat.selectSession(session);

      // جلب الرسائل
      const msgsRes = await ChatService.getMessages(session.id);
      chat.setMessages(msgsRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في فتح المحادثة');
    }
  };

  // ── Send message ──────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMsg || !chat.activeSession) return;
    setSendingMsg(true);
    try {
      const res = await ChatService.sendMessage(chat.activeSession.id, messageInput.trim());
      chat.addMessage(res.data?.data || res.data);
      setMessageInput('');
    } catch (err) {
      console.error('sendMessage error:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Typing ────────────────────────────────────────────────────
  const handleTyping = (value) => {
    setMessageInput(value);
    if (!chat.activeSession) return;
    chat.sendTyping(chat.activeSession.id, user?.name || 'المساعد');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      chat.sendStopTyping(chat.activeSession.id);
    }, 2000);
  };

  // ── Scroll to bottom ──────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat.messages]);

  // ── Stats ─────────────────────────────────────────────────────
  const totalStudentsCount = allStudents.length;
  const activeChatCount    = sessions.filter((s) => (s.messagesCount || 0) > 0).length;
  const courseCount        = courses.length;

  // ── Format time ───────────────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = now - d;
    if (diff < 86400000)  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'أمس';
    return d.toLocaleDateString('ar-EG');
  };

  const getSenderLabel = (msg) => {
    if (msg.senderUserId === user?.id) return null;
    if (msg.senderRole === 'teacher')           return '👨‍🏫 مدرس';
    if (msg.senderRole === 'assistant_teacher') return '🧑‍🏫 مساعد';
    return '👨‍🎓 طالب';
  };

  // ══════════════════════════════════════════════════════════════
  // STUDENT LIST VIEW
  // ══════════════════════════════════════════════════════════════
  if (!chat.activeSession) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#0f172a' : '#f8fafc', pt: 10, pb: 4 }}>
        <Container maxWidth="xl">

          {/* Header */}
          <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: borderC, bgcolor: cardBg }}>
            <Box sx={{ background: GRADIENTS.main, p: 3, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <IconButton onClick={() => navigate('/assistant-teacher/dashboard')}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">
                  💬 إدارة المحادثات
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton onClick={fetchData} disabled={loading}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mr: 7 }}>
                تواصل مع الطلاب عبر المحادثة الثلاثية (طالب + مدرس + مساعد)
              </Typography>
            </Box>
          </Card>

          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <StatsCard value={totalStudentsCount} label="إجمالي الطلاب"   icon={<People />}          color={ACCENT}    isDark={isDark} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCard value={activeChatCount}    label="محادثات نشطة"    icon={<ChatBubbleOutline />} color="#2563eb"   isDark={isDark} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCard value={courseCount}        label="الكورسات"         icon={<School />}           color="#7c3aed"   isDark={isDark} />
            </Grid>
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 4, borderRadius: 3, border: '1px solid', borderColor: borderC, bgcolor: cardBg }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>اختر كورس</InputLabel>
                    <Select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
                      label="اختر كورس"
                      sx={{ fontFamily: 'Cairo, sans-serif', borderRadius: 2, color: textPrimary }}>
                      <MenuItem value="" sx={{ fontFamily: 'Cairo, sans-serif' }}>كل الكورسات</MenuItem>
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id} sx={{ fontFamily: 'Cairo, sans-serif' }}>{c.title}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <TextField fullWidth size="small" placeholder="ابحث عن طالب بالاسم..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94a3b8' }} /></InputAdornment>,
                      sx: { fontFamily: 'Cairo, sans-serif', fontWeight: 600, borderRadius: 2, color: textPrimary, bgcolor: isDark ? '#0f172a' : '#f8fafc' },
                    }} />
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

          {/* Students List */}
          <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: borderC, bgcolor: cardBg }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: borderC,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                الطلاب ({filteredStudents.length})
              </Typography>
              <Chip icon={<People sx={{ fontSize: 16 }} />} label="محادثة ثلاثية" size="small"
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.7rem',
                  bgcolor: isDark ? 'rgba(5,150,105,0.2)' : 'rgba(5,150,105,0.1)', color: ACCENT,
                  border: '1px solid', borderColor: isDark ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.2)' }} />
            </Box>

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
            ) : filteredStudents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <People sx={{ fontSize: 48, color: isDark ? '#475569' : '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>
                  {searchQuery ? 'لا توجد نتائج' : 'لا يوجد طلاب مسجلين'}
                </Typography>
                {!searchQuery && (
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b', mt: 1 }}>
                    تأكد من أن حسابك مرتبط بمدرس لديه طلاب مسجلين
                  </Typography>
                )}
              </Box>
            ) : (
              filteredStudents.map((student, idx) => {
                // آخر رسالة من الـ sessions
                const studentSession = sessions.find((s) => s.student?.id === student.userId);
                const lastMsg = studentSession?.lastMessage?.message || student.lastMessage?.message || null;

                return (
                  <Box key={student.userId || student.studentId}>
                    <ListItemButton onClick={() => handleSelectStudent(student)}
                      sx={{ px: 3, py: 2, transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: isDark ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.04)' } }}>
                      <ListItemIcon sx={{ minWidth: 52 }}>
                        <Badge badgeContent={studentSession?.messagesCount || 0} color="error"
                          max={99} sx={{ '& .MuiBadge-badge': { fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '0.6rem' } }}>
                          <Avatar sx={{ bgcolor: ACCENT, width: 44, height: 44, fontSize: '1.1rem', fontWeight: 700 }}>
                            {student.avatar
                              ? <img src={student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                              : <Person />}
                          </Avatar>
                        </Badge>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                            {student.name || 'طالب'}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                            {student.courses?.slice(0, 2).map((c) => (
                              <Chip key={c.id} label={c.title} size="small"
                                sx={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.65rem',
                                  bgcolor: isDark ? 'rgba(5,150,105,0.15)' : `${ACCENT}10`, color: ACCENT }} />
                            ))}
                            {lastMsg && (
                              <Typography variant="caption" fontFamily="Cairo, sans-serif"
                                sx={{ color: textSecondary, width: '100%', mt: 0.5 }} noWrap>
                                آخر رسالة: {lastMsg}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, flexShrink: 0 }}>
                        {studentSession ? formatTime(studentSession.lastActive) : ''}
                      </Typography>
                    </ListItemButton>
                    {idx < filteredStudents.length - 1 && (
                      <Divider sx={{ borderColor: borderC }} />
                    )}
                  </Box>
                );
              })
            )}
          </Card>

          {/* Quick Nav */}
          <Grid container spacing={2} sx={{ mt: 3 }}>
            <Grid item xs={6}>
              <Card onClick={() => navigate('/assistant-teacher/dashboard')}
                sx={{ borderRadius: 2.5, cursor: 'pointer', border: '1px solid', borderColor: borderC, bgcolor: cardBg,
                  transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', borderColor: `${ACCENT}55` } }}>
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <HomeIcon sx={{ fontSize: 28, color: ACCENT, mb: 1 }} />
                  <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                    لوحة التحكم
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card onClick={() => navigate('/assistant-teacher/grade-exams')}
                sx={{ borderRadius: 2.5, cursor: 'pointer', border: '1px solid', borderColor: borderC, bgcolor: cardBg,
                  transition: 'all 0.2s ease', '&:hover': { transform: 'translateY(-2px)', borderColor: '#f59e0b55' } }}>
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  <Assignment sx={{ fontSize: 28, color: '#f59e0b', mb: 1 }} />
                  <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: textPrimary }}>
                    تقييم الاختبارات
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>

        {/* Grade Dialog */}
        <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth dir="rtl">
          <DialogTitle sx={{ bgcolor: isDark ? '#1e293b' : 'white', color: textPrimary, fontFamily: 'Cairo, sans-serif', fontWeight: 900, borderBottom: `1px solid ${borderC}` }}>
            📝 تقييم الأسئلة المقالية
          </DialogTitle>
          <DialogContent sx={{ bgcolor: isDark ? '#1e293b' : 'white', pt: 3 }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: textSecondary, lineHeight: 1.8 }}>
              يمكنك تقييم الأسئلة المقالية للطلاب من خلال صفحة التقييم المخصصة.
            </Typography>
            <Button fullWidth variant="contained" onClick={() => { setGradeDialogOpen(false); navigate('/assistant-teacher/grade-exams'); }} sx={{ mt: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: GRADIENTS.main }}>
              الذهاب إلى التقييم ✓
            </Button>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // CHAT VIEW
  // ══════════════════════════════════════════════════════════════
  const studentName = chat.activeSession.student?.name || 'طالب';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>

      {/* Chat Header */}
      <Box sx={{ background: GRADIENTS.main, color: 'white', p: 2,
        display: 'flex', alignItems: 'center', gap: 2,
        boxShadow: '0 4px 20px rgba(5,150,105,0.2)', mt: 8,
        borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <IconButton onClick={() => chat.selectSession(null)}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ width: 44, height: 44, bgcolor: 'white', color: ACCENT, fontWeight: 700, border: '2px solid rgba(255,255,255,0.3)' }}>
          {chat.activeSession.student?.avatar
            ? <img src={chat.activeSession.student.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <Person />}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif">
            {studentName}
          </Typography>
          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.85 }}>
            محادثة ثلاثية • {chat.connected ? '🟢 متصل' : '🔴 غير متصل'}
          </Typography>
        </Box>
        <Chip label="طالب + مدرس + مساعد" size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: '0.65rem' }} />
        <IconButton onClick={() => navigate('/assistant-teacher/dashboard')}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
          <HomeIcon />
        </IconButton>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3,
        background: isDark ? 'linear-gradient(to bottom, #0f172a, #1e293b)' : 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}>

        {chat.messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <ChatBubbleOutline sx={{ fontSize: 56, color: isDark ? '#334155' : '#e2e8f0' }} />
            <Typography fontFamily="Cairo, sans-serif" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
              ابدأ المحادثة مع {studentName}
            </Typography>
            <Chip label="المدرس الرئيسي يستطيع رؤية هذه المحادثة أيضاً" size="small"
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, bgcolor: isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)', color: ACCENT }} />
          </Box>
        ) : (
          <>
            {chat.messages.map((msg) => {
              const isMine     = msg.senderUserId === user?.id;
              const senderLabel = getSenderLabel(msg);
              return (
                <Box key={msg.id} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', mb: 2 }}>
                  {!isMine && (
                    <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: msg.senderRole === 'teacher' ? '#7c3aed' : msg.senderRole === 'student' ? '#2563eb' : ACCENT, alignSelf: 'flex-end' }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700 }}>
                        {msg.sender?.name?.charAt(0) || '?'}
                      </Typography>
                    </Avatar>
                  )}
                  <Paper elevation={0} sx={{
                    maxWidth: '70%', px: 2, py: 1.5,
                    borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMine ? GRADIENTS.main : (isDark ? '#1e293b' : 'white'),
                    color: isMine ? 'white' : textPrimary,
                    border: isMine ? 'none' : '1px solid', borderColor: borderC,
                  }}>
                    {!isMine && senderLabel && (
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: msg.senderRole === 'teacher' ? '#7c3aed' : msg.senderRole === 'student' ? '#2563eb' : ACCENT,
                          fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                        {senderLabel}
                      </Typography>
                    )}
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {msg.message}
                    </Typography>
                    <Typography variant="caption"
                      sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: 'left', fontSize: '0.6rem',
                        color: isMine ? 'rgba(255,255,255,0.8)' : textSecondary }}>
                      {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}
                      {isMine && <CheckCircle sx={{ fontSize: 11, ml: 0.3, verticalAlign: 'middle', opacity: 0.8 }} />}
                    </Typography>
                  </Paper>
                </Box>
              );
            })}

            {/* Typing indicator */}
            {Object.keys(chat.typingUsers).length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: textSecondary, px: 1, py: 0.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5,
                  '& span': { width: 6, height: 6, borderRadius: '50%', bgcolor: textSecondary, animation: 'typingBounce 1.4s infinite ease-in-out' },
                  '& span:nth-child(1)': { animationDelay: '0s' },
                  '& span:nth-child(2)': { animationDelay: '0.2s' },
                  '& span:nth-child(3)': { animationDelay: '0.4s' } }}>
                  <span /><span /><span />
                </Box>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ fontStyle: 'italic' }}>
                  {Object.values(chat.typingUsers).join(' و ')} يكتب...
                </Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2.5, bgcolor: isDark ? '#1e293b' : 'white',
        borderTop: '1px solid', borderColor: borderC,
        display: 'flex', gap: 1.5,
        boxShadow: isDark ? '0 -4px 20px rgba(0,0,0,0.3)' : '0 -4px 20px rgba(0,0,0,0.04)' }}>
        <TextField fullWidth size="small" placeholder="اكتب رسالتك..."
          value={messageInput} onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          multiline maxRows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? '#0f172a' : '#f8fafc', borderRadius: 3,
              fontFamily: 'Cairo, sans-serif', fontWeight: 600, color: textPrimary,
              border: '1px solid', borderColor: borderC,
              '& fieldset': { border: 'none' },
              '&:focus-within': { borderColor: `${ACCENT}66`, boxShadow: `0 0 0 3px ${ACCENT}15` },
            },
          }} />
        <IconButton onClick={handleSendMessage} disabled={!messageInput.trim() || sendingMsg}
          sx={{ bgcolor: ACCENT, color: 'white', width: 46, height: 46,
            '&:hover': { bgcolor: '#047857', transform: 'scale(1.05)' },
            '&.Mui-disabled': { bgcolor: isDark ? '#334155' : '#e5e7eb' },
            transition: 'all 0.2s ease', boxShadow: `0 4px 12px ${ACCENT}44` }}>
          {sendingMsg ? <CircularProgress size={20} color="inherit" /> : <Send />}
        </IconButton>
      </Box>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </Box>
  );
};

// ── Stats Card ────────────────────────────────────────────────────
const StatsCard = ({ value, label, icon, color, isDark }) => (
  <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: isDark ? '#334155' : '#e5e7eb',
    bgcolor: isDark ? '#1e293b' : 'white', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
          sx={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{value}</Typography>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b' }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default ChatAssistant;