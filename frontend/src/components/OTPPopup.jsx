// frontend/src/components/OTPPopup.jsx
// Real-time OTP popup shown to:
//   • Teachers  → when assistant_teacher sends a verification request
//   • Students  → when a parent sends a verification request
//
// Triggered via Socket.IO event: notification:new
//   (type = assistant_request | parent_request)
//
// Rendered once globally inside AppLayout so it appears on every page.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, IconButton, Chip, Paper, Slide,
} from '@mui/material';
import {
  CloseRounded,
  ContentCopy,
  CheckCircleRounded,
  AccessTimeRounded,
  SupervisorAccountRounded,
  FamilyRestroomRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────
const CODE_TTL_SECONDS = 120; // matches backend TTL (2 minutes)

// ─── Single OTP card ─────────────────────────────────────────
const OTPCard = ({ notification, onDismiss }) => {
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SECONDS);
  const [copied,      setCopied]      = useState(false);
  const [visible,     setVisible]     = useState(true);
  const intervalRef                   = useRef(null);

  const isAssistantRequest = notification.type === 'assistant_request';
  const code               = notification.data?.code;

  // ── countdown ────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(notification.id), 400);
          }, 1500);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [notification.id, onDismiss]);

  const handleCopy = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('تم نسخ الكود! 📋');
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(notification.id), 400);
  }, [notification.id, onDismiss]);

  const progress  = (secondsLeft / CODE_TTL_SECONDS) * 100;
  const isExpired = secondsLeft === 0;
  const isUrgent  = secondsLeft <= 30 && !isExpired;
  const digits    = code ? code.split('') : [];

  const gradient    = isAssistantRequest
    ? 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)'
    : 'linear-gradient(135deg, #db2777 0%, #f59e0b 100%)';
  const accentColor = isAssistantRequest ? '#7c3aed' : '#db2777';
  const Icon        = isAssistantRequest
    ? SupervisorAccountRounded
    : FamilyRestroomRounded;

  return (
    <Slide direction="left" in={visible} mountOnEnter unmountOnExit>
      <Paper
        elevation={0}
        sx={{
          width: 340,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: isUrgent
            ? '#f59e0b'
            : isExpired
            ? '#ef4444'
            : 'rgba(124,58,237,0.15)',
          bgcolor: 'white',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.1)',
          animation: isUrgent
            ? 'urgentPulse 1s ease-in-out infinite'
            : 'none',
          '@keyframes urgentPulse': {
            '0%,100%': { boxShadow: '0 20px 60px rgba(0,0,0,0.18)' },
            '50%':     {
              boxShadow: `0 20px 60px rgba(0,0,0,0.18), 0 0 0 4px ${accentColor}30`,
            },
          },
        }}
      >
        {/* progress bar */}
        <Box sx={{ position: 'relative', height: 6, bgcolor: '#e5e7eb' }}>
          <Box
            sx={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${progress}%`,
              background: isExpired
                ? '#ef4444'
                : isUrgent
                ? '#f59e0b'
                : gradient,
              transition: 'width 1s linear, background 0.3s',
              borderRadius: '0 3px 3px 0',
            }}
          />
        </Box>

        {/* header */}
        <Box
          sx={{
            background: gradient, px: 2.5, py: 2,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon sx={{ color: 'white', fontSize: 22 }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1" fontWeight={900} fontFamily="Cairo, sans-serif"
              sx={{ color: 'white', lineHeight: 1.2 }}
            >
              {isAssistantRequest ? '🔔 طلب مدرس مساعد' : '👨‍👩‍👦 طلب ولي أمر'}
            </Typography>
            <Typography
              variant="caption" fontFamily="Cairo, sans-serif"
              sx={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {notification.data?.requesterEmail || 'طلب ربط جديد'}
            </Typography>
          </Box>

          <IconButton
            size="small" onClick={handleClose}
            sx={{
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </Box>

        {/* body */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
          {/* timer chip */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Chip
              icon={<AccessTimeRounded sx={{ fontSize: 14 }} />}
              label={
                isExpired
                  ? 'انتهت الصلاحية'
                  : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')} متبقي`
              }
              size="small"
              sx={{
                bgcolor:   isExpired ? '#fef2f2' : isUrgent ? '#fffbeb' : '#f5f3ff',
                color:     isExpired ? '#ef4444' : isUrgent ? '#d97706' : accentColor,
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: 12,
                border: '1px solid',
                borderColor: isExpired
                  ? '#fecaca'
                  : isUrgent
                  ? '#fde68a'
                  : `${accentColor}30`,
                '& .MuiChip-icon': {
                  color: isExpired ? '#ef4444' : isUrgent ? '#d97706' : accentColor,
                },
              }}
            />
          </Box>

          {/* description */}
          <Typography
            variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600}
            sx={{ textAlign: 'center', color: '#475569', mb: 2, lineHeight: 1.6 }}
          >
            {isExpired
              ? '❌ انتهت صلاحية الكود. سيطلب منك الطرف الآخر كوداً جديداً.'
              : 'أرسل هذا الكود للشخص الذي طلب الربط بحسابك'}
          </Typography>

          {/* big digit boxes */}
          {!isExpired && code && (
            <Box
              sx={{
                display: 'flex', justifyContent: 'center',
                gap: 1, mb: 2.5, direction: 'ltr',
              }}
            >
              {digits.map((d, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 42, height: 52,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 1.5,
                    bgcolor: isUrgent ? '#fffbeb' : '#f5f3ff',
                    border: '2px solid',
                    borderColor: isUrgent ? '#fde68a' : `${accentColor}30`,
                    fontWeight: 900,
                    fontFamily: '"Courier New", monospace',
                    color: isUrgent ? '#d97706' : accentColor,
                    fontSize: '1.4rem',
                    boxShadow: `inset 0 2px 4px ${accentColor}10`,
                    transition: 'all 0.3s',
                    animation: isUrgent
                      ? 'digitPulse 0.5s ease-in-out infinite alternate'
                      : 'none',
                    animationDelay: `${i * 0.05}s`,
                    '@keyframes digitPulse': {
                      from: { transform: 'scale(1)' },
                      to:   { transform: 'scale(1.06)' },
                    },
                  }}
                >
                  {d}
                </Box>
              ))}
            </Box>
          )}

          {/* copy button */}
          {!isExpired && code && (
            <Box
              onClick={handleCopy}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 1, py: 1.5, borderRadius: 2, cursor: 'pointer',
                background: copied ? '#dcfce7' : gradient,
                transition: 'all 0.3s',
                '&:hover': { opacity: 0.9, transform: 'translateY(-1px)' },
                '&:active': { transform: 'scale(0.98)' },
              }}
            >
              {copied
                ? <CheckCircleRounded sx={{ color: '#059669', fontSize: 20 }} />
                : <ContentCopy sx={{ color: 'white', fontSize: 18 }} />}
              <Typography
                variant="body2" fontWeight={800} fontFamily="Cairo, sans-serif"
                sx={{ color: copied ? '#059669' : 'white' }}
              >
                {copied ? 'تم النسخ! ✓' : 'انسخ الكود'}
              </Typography>
            </Box>
          )}

          {/* dismiss */}
          <Box
            onClick={handleClose}
            sx={{
              mt: 1.5, py: 1, textAlign: 'center', cursor: 'pointer',
              borderRadius: 2, color: '#94a3b8',
              fontFamily: 'Cairo, sans-serif', fontWeight: 600, fontSize: 13,
              '&:hover': { bgcolor: '#f8fafc', color: '#64748b' },
            }}
          >
            إغلاق
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
};

// ─── Container — rendered once globally in AppLayout ─────────
const OTPPopupContainer = ({ socketEvents }) => {
  const [popups, setPopups] = useState([]);

  useEffect(() => {
    if (!socketEvents || socketEvents.length === 0) return;
    const latest = socketEvents[socketEvents.length - 1];
    if (!latest) return;

    const isOtp =
      latest.type === 'assistant_request' ||
      latest.type === 'parent_request';
    if (!isOtp) return;

    setPopups((prev) => {
      if (prev.some((p) => p.id === latest.id)) return prev;
      return [...prev, latest];
    });
  }, [socketEvents]);

  const handleDismiss = useCallback((id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (popups.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'all' },
      }}
    >
      {popups.map((popup) => (
        <OTPCard key={popup.id} notification={popup} onDismiss={handleDismiss} />
      ))}
    </Box>
  );
};

export default OTPPopupContainer;