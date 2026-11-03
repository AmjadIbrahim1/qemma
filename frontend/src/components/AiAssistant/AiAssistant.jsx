// frontend/src/components/AiAssistant/AiAssistant.jsx

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  TextField,
  CircularProgress,
  Paper,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  SmartToy as RobotIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import aiAssistantService from '../../services/ai-assistant.service';

const ASSISTANT_LABELS = {
  student: 'المساعد الذكي للطالب',
  teacher: 'المساعد الذكي للمدرس',
  assistant_teacher: 'المساعد الذكي للمدرس',
};

const WELCOME_MESSAGES = {
  student: 'مرحباً! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك اليوم؟',
  teacher: 'مرحباً! أنا المساعد الذكي للمدرسين. كيف يمكنني مساعدتك في تحضير الدروس؟',
  assistant_teacher: 'مرحباً! أنا المساعد الذكي للمدرسين. كيف يمكنني مساعدتك؟',
};

const AiAssistant = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageLimit, setUsageLimit] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || 'student';
  const label = ASSISTANT_LABELS[role] || 'المساعد الذكي';
  const welcome = WELCOME_MESSAGES[role] || 'مرحباً! كيف يمكنني مساعدتك؟';

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    (async () => {
      try {
        const res = await aiAssistantService.checkUsage();
        setUsageLimit(res?.data?.data || null);
      } catch {
        // silently fail
      }
    })();
  }, []);

  const handleToggle = () => {
    if (!open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcome }]);
      (async () => {
        try {
          const res = await aiAssistantService.checkUsage();
          setUsageLimit(res?.data?.data || null);
        } catch {
          // silently fail
        }
      })();
    }
    setOpen(!open);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const history = updated
        .filter((m) => m.role !== 'system')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await aiAssistantService.sendMessage(text, history);
      const reply = res?.data?.data?.reply || 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (res?.data?.data?.limit) {
        setUsageLimit(res.data.data.limit);
      }
    } catch (err) {
      const msg = err?.response?.status === 429
        ? err?.response?.data?.message || 'لقد استنفدت حد الرسائل المسموح به.'
        : 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user || (role !== 'student' && role !== 'teacher' && role !== 'assistant_teacher')) {
    return null;
  }

  const usagePercent = usageLimit ? Math.round((usageLimit.used / usageLimit.limit) * 100) : 0;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1.5,
      }}
    >
      {/* Chat Panel */}
      {open && (
        <Paper
          elevation={12}
          sx={{
            width: 360,
            maxWidth: 'calc(100vw - 48px)',
            height: 520,
            maxHeight: 'calc(100vh - 180px)',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: darkMode ? '#1e293b' : 'white',
            border: '1px solid',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              pb: usageLimit ? 1.5 : 2,
              background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
              color: 'white',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: usageLimit ? 1 : 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
                <RobotIcon sx={{ fontSize: 22 }} />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ fontSize: '0.9rem' }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ opacity: 0.8 }}
                >
                  {loading ? 'جارٍ الكتابة...' : 'متصل'}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setOpen(false)}
                size="small"
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {usageLimit && (
              <Box sx={{ px: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.85, fontSize: '0.7rem' }}>
                    {usageLimit.remaining} رسالة متبقية
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.85, fontSize: '0.7rem' }}>
                    {usageLimit.used}/{usageLimit.limit}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(usagePercent, 100)}
                  sx={{
                    height: 3,
                    borderRadius: 10,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 10,
                      bgcolor: usagePercent >= 80 ? '#ef4444' : usagePercent >= 60 ? '#f59e0b' : 'rgba(255,255,255,0.8)',
                    },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              bgcolor: darkMode ? '#0f172a' : '#f8fafc',
            }}
          >
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-start',
                  gap: 1,
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: '#7c3aed',
                      mt: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <RobotIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                )}
                <Box
                  sx={{
                    maxWidth: '80%',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor:
                      msg.role === 'user'
                        ? darkMode
                          ? '#1e293b'
                          : 'white'
                        : darkMode
                          ? '#334155'
                          : '#ede9fe',
                    border: '1px solid',
                    borderColor:
                      msg.role === 'user'
                        ? darkMode
                          ? '#334155'
                          : '#e5e7eb'
                        : 'transparent',
                  }}
                >
                  <Typography
                    variant="body2"
                    fontFamily="Cairo, sans-serif"
                    sx={{
                      color: darkMode ? '#e2e8f0' : '#334155',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </Typography>
                </Box>
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Avatar
                  sx={{ width: 30, height: 30, bgcolor: '#7c3aed' }}
                >
                  <RobotIcon sx={{ fontSize: 16 }} />
                </Avatar>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: darkMode ? '#334155' : '#ede9fe',
                    display: 'flex',
                    gap: 0.5,
                  }}
                >
                  <CircularProgress size={10} sx={{ color: '#7c3aed' }} />
                  <CircularProgress
                    size={10}
                    sx={{ color: '#7c3aed' }}
                    style={{ animationDelay: '0.2s' }}
                  />
                  <CircularProgress
                    size={10}
                    sx={{ color: '#7c3aed' }}
                    style={{ animationDelay: '0.4s' }}
                  />
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                size="small"
                placeholder="اكتب رسالتك..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontFamily: 'Cairo, sans-serif',
                    bgcolor: darkMode ? '#0f172a' : '#f8fafc',
                  },
                  '& .MuiOutlinedInput-input': {
                    fontFamily: 'Cairo, sans-serif',
                  },
                }}
              />
              <IconButton
                onClick={handleSend}
                disabled={!input.trim() || loading}
                sx={{
                  bgcolor: '#7c3aed',
                  color: 'white',
                  borderRadius: 2,
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: '#6d28d9' },
                  '&.Mui-disabled': {
                    bgcolor: darkMode ? '#334155' : '#e5e7eb',
                    color: darkMode ? '#64748b' : '#94a3b8',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SendIcon fontSize="small" />
                )}
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Floating Button */}
      <IconButton
        onClick={handleToggle}
        sx={{
          width: 60,
          height: 60,
          background: open
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
          color: 'white',
          boxShadow: open
            ? '0 8px 24px rgba(239,68,68,0.4)'
            : '0 8px 24px rgba(124,58,237,0.4)',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: open
              ? '0 12px 32px rgba(239,68,68,0.5)'
              : '0 12px 32px rgba(124,58,237,0.5)',
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {open ? <CloseIcon sx={{ fontSize: 28 }} /> : <RobotIcon sx={{ fontSize: 28 }} />}
      </IconButton>
    </Box>
  );
};

export default AiAssistant;
