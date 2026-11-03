// pages/student/LiveClassPage.jsx — FULL WEIRTC INTEGRATION
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, Chip, Avatar,
  IconButton, TextField, List, ListItem, Tooltip, Badge, Divider,
  CircularProgress, Alert,
} from '@mui/material';
import {
  ArrowBackRounded, PlayCircleFilledRounded, PeopleRounded,
  MicRounded, MicOffRounded, VideocamRounded, VideocamOffRounded,
  ScreenShareRounded, StopScreenShareRounded, PanToolRounded,
  ChatRounded, CallEndRounded, SendRounded, CloseRounded,
  VolumeUpRounded, ContentCopy, CheckCircle, AccessTimeRounded,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import liveClassesService from '../../services/liveClasses.service';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const COLORS = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  accent: '#db2777',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// IN-ROOM PANEL — Real WebRTC, Socket, Chat
// ═══════════════════════════════════════════════════════════════════

const InRoomPanel = ({ roomData, onLeave, darkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── WebRTC / Socket state ─────────────────────────────────
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [teacherSpeaking, setTeacherSpeaking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [teacherMicOn, setTeacherMicOn] = useState(true);
  const [teacherCamOn, setTeacherCamOn] = useState(true);
  const [teacherScreenShare, setTeacherScreenShare] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── Refs ──────────────────────────────────────────────────
  const teacherVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);
  const chatUnreadRef = useRef(0);
  const showChatRef = useRef(true);

  // ── Duration timer ────────────────────────────────────────
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  // ── Refs for tracking video track count ─────────────────
  const videoTrackCountRef = useRef(0);

  // ── Connect WebRTC & Socket on mount ──────────────────────
  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        // 1. Get local audio stream (student only sends audio)
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        if (cancelled) { localStream.getTracks().forEach(t => t.stop()); return; }
        localStreamRef.current = localStream;

        // 2. Connect to socket
        const token = localStorage.getItem('token');
        const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const { io } = await import('socket.io-client');
        const socket = io(wsUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
        });
        if (cancelled) { socket.disconnect(); return; }
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('live_class:join', { roomName: roomData.roomName });

          setParticipants(prev => {
            const exists = prev.some(p => p.userId === user?.id);
            return exists ? prev : [...prev, {
              userId: user?.id,
              name: user?.name || 'أنت',
              role: 'student',
              isLocal: true,
            }];
          });
        });

        // 3. Listen for WebRTC events
        socket.on('webrtc:offer', async ({ fromUserId, offer }) => {
          if (pcRef.current) {
            // Renegotiation — update existing PC (e.g., when screen share track added/removed)
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pcRef.current.createAnswer();
              await pcRef.current.setLocalDescription(answer);
              socket.emit('webrtc:answer', {
                roomName: roomData.roomName, targetUserId: fromUserId, answer,
              });
            } catch (e) {
              console.warn('Renegotiation error:', e);
            }
            return;
          }

          const pc = new RTCPeerConnection(STUN_SERVERS);
          pcRef.current = pc;
          videoTrackCountRef.current = 0;

          // Add local audio track
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

          pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              socket.emit('webrtc:ice-candidate', {
                roomName: roomData.roomName,
                targetUserId: fromUserId,
                candidate,
              });
            }
          };

          pc.ontrack = ({ track, streams: [remoteStream] }) => {
            if (track.kind === 'video') {
              remoteStream.onaddtrack = () => {}; // suppress
              // Increment video track counter to distinguish camera vs screen share
              videoTrackCountRef.current++;
              if (videoTrackCountRef.current === 1) {
                // First video track = teacher's camera
                if (teacherVideoRef.current) {
                  teacherVideoRef.current.srcObject = remoteStream;
                }
                setTeacherCamOn(true);
              } else if (videoTrackCountRef.current >= 2) {
                // Second+ video track = teacher's screen share
                if (screenShareVideoRef.current) {
                  screenShareVideoRef.current.srcObject = remoteStream;
                }
                setTeacherScreenShare(true);
              }
            } else if (track.kind === 'audio' && teacherVideoRef.current?.srcObject) {
              // Audio track — add to whichever stream is being used
              const existing = teacherVideoRef.current.srcObject;
              if (existing && !existing.getAudioTracks().length) {
                existing.addTrack(track);
              }
            }
            // Track audio presence
            if (remoteStream.getAudioTracks().length > 0) {
              setTeacherMicOn(true);
            }
          };

          pc.onnegotiationneeded = async () => {
            try {
              await pc.setLocalDescription(await pc.createOffer());
              socket.emit('webrtc:offer', {
                roomName: roomData.roomName, targetUserId: fromUserId, offer: pc.localDescription,
              });
            } catch (e) {
              console.warn('Student negotiation failed:', e);
            }
          };

          pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
              setTeacherSpeaking(false);
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:answer', {
            roomName: roomData.roomName,
            targetUserId: fromUserId,
            answer,
          });
        });

        socket.on('webrtc:answer', async ({ fromUserId, answer }) => {
          try {
            if (pcRef.current) {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
          } catch (e) {
            console.warn('Answer handling:', e);
          }
        });

        socket.on('webrtc:ice-candidate', async ({ fromUserId, candidate }) => {
          try {
            if (pcRef.current && candidate) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (e) {
            // ignore
          }
        });

        // 4. Listen for chat messages
        socket.on('live_class:chat_message', ({ senderName, message, senderId }) => {
          const isTeacher = senderId !== user?.id;
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: senderName || 'مشارك',
            message,
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
            isTeacher,
            isMe: senderId === user?.id,
          }]);
          if (!showChatRef.current) {
            chatUnreadRef.current += 1;
            setChatUnreadCount(chatUnreadRef.current);
          }
        });

        // 5. Listen for participant events
        socket.on('live_class:student_joined', ({ userId: joinedId, name }) => {
          setParticipants(prev => {
            if (prev.some(p => p.userId === joinedId)) return prev;
            return [...prev, { userId: joinedId, name: name || 'طالب', role: 'student' }];
          });
        });

        socket.on('live_class:student_left', ({ userId: leftId }) => {
          setParticipants(prev => prev.filter(p => p.userId !== leftId));
        });

        // 6. Listen for live class ended
        socket.on('live_class:ended', () => {
          toast.success('انتهت الحصة');
          cleanup();
          onLeave();
        });

        // 7. Listen for screen share events from teacher
        socket.on('live_class:screen_share_started', () => {
          setTeacherScreenShare(true);
        });
        socket.on('live_class:screen_share_stopped', () => {
          setTeacherScreenShare(false);
          videoTrackCountRef.current = 1; // reset to camera only
        });

        // 8. Listen for mute/unmute from teacher
        socket.on('live_class:muted', () => {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
            setMicOn(false);
            toast('قام المدرس بكتم الميكروفون الخاص بك 🔇', { icon: '🔇' });
          }
        });
        socket.on('live_class:unmuted', () => {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = true; });
            setMicOn(true);
            toast('قام المدرس بتشغيل الميكروفون الخاص بك 🎤', { icon: '🎤' });
          }
        });

      } catch (e) {
        console.error('Failed to connect to live class:', e);
        toast.error('فشل الاتصال بالحصة المباشرة');
      }
    };

    connect();

    const cleanup = () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      socketRef.current?.disconnect();
      clearInterval(timerRef.current);
    };

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [roomData.roomName]);

  // ── Auto-scroll chat ──────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Chat send ─────────────────────────────────────────────
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current?.emit('live_class:chat_message', {
      roomName: roomData.roomName,
      senderName: user?.name || 'طالب',
      message: newMessage,
    });
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: user?.name || 'أنت',
      message: newMessage,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isTeacher: false,
      isMe: true,
    }]);
    setNewMessage('');
  };

  // ── Raise hand ────────────────────────────────────────────
  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    if (newState) {
      socketRef.current?.emit('live_class:raise_hand', {
        roomName: roomData.roomName,
        name: user?.name || 'طالب',
      });
    }
  };

  // ── Leave ─────────────────────────────────────────────────
  const handleLeave = () => {
    socketRef.current?.emit('live_class:leave', { roomName: roomData.roomName });
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    socketRef.current?.disconnect();
    clearInterval(timerRef.current);
    onLeave();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const teacher = participants.find(p => p.role === 'teacher') || {
    name: roomData.teacherName || 'المدرس',
  };
  const studentCount = participants.filter(p => p.role === 'student').length;

  // ── RENDER ────────────────────────────────────────────────
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: 'white' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: COLORS.error, px: 2, py: 0.5, borderRadius: 5, animation: 'pulse 2s infinite' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
            <Typography variant="caption" fontWeight={700} fontFamily="Cairo, sans-serif">مباشر</Typography>
          </Box>
          <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif">
            {roomData.title || 'حصة مباشرة'}
          </Typography>
          <Chip label={formatDuration(duration)} size="small"
            sx={{ bgcolor: '#334155', color: '#94a3b8', fontFamily: 'monospace' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip icon={<PeopleRounded sx={{ color: 'white !important', fontSize: 16 }} />}
            label={`${participants.length} مشارك`} size="small"
            sx={{ bgcolor: '#2563eb', color: 'white', fontFamily: 'Cairo, sans-serif' }} />
          <Tooltip title="ملء الشاشة">
            <IconButton sx={{ color: 'white' }} onClick={toggleFullscreen}>
              <Box component="svg" sx={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </Box>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
          {/* Main Video - Teacher's camera/screen */}
          <Box sx={{ flex: 1, bgcolor: '#1e293b', borderRadius: 3, overflow: 'hidden', position: 'relative', mb: 2 }}>
            {!connected ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <CircularProgress size={48} sx={{ color: '#2563eb' }} />
                <Typography fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8' }}>
                  جاري الاتصال بالحصة...
                </Typography>
              </Box>
            ) : teacherScreenShare ? (
              <>
                <video ref={screenShareVideoRef} autoPlay playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <Box sx={{ position: 'absolute', top: 16, right: 16, bgcolor: '#059669', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ScreenShareRounded sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={600} fontFamily="Cairo, sans-serif">مشاركة الشاشة</Typography>
                </Box>
                {/* Teacher camera PIP */}
                {teacherCamOn && (
                  <Box sx={{ position: 'absolute', bottom: 16, left: 16, width: 180, height: 120, borderRadius: 2, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)' }}>
                    <video ref={teacherVideoRef} autoPlay playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                )}
              </>
            ) : (
              <>
                <video ref={teacherVideoRef} autoPlay playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!teacherCamOn && (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b', gap: 2 }}>
                    <Avatar sx={{ width: 100, height: 100, bgcolor: COLORS.secondary, fontSize: 40, fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                      {teacher.name?.charAt(0) || 'م'}
                    </Avatar>
                    <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif">{teacher.name}</Typography>
                  </Box>
                )}
                {teacherCamOn && (
                  <Box sx={{ position: 'absolute', bottom: 16, left: 16, bgcolor: 'rgba(0,0,0,0.6)', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontWeight={600} fontFamily="Cairo, sans-serif">{teacher.name}</Typography>
                    {teacherMicOn && <VolumeUpRounded sx={{ fontSize: 16, color: COLORS.success }} />}
                    {!teacherMicOn && <MicOffRounded sx={{ fontSize: 16, color: COLORS.error }} />}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Side Panel */}
        {(showChat || showParticipants) && (
          <Box sx={{ width: 340, borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', bgcolor: '#1e293b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => { setShowChat(true); setShowParticipants(false); }}
                  sx={{ bgcolor: showChat ? COLORS.primary : 'transparent', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 600, borderRadius: 2, px: 2 }}>
                  💬 المحادثة
                </Button>
                <Button size="small" onClick={() => { setShowParticipants(true); setShowChat(false); }}
                  sx={{ bgcolor: showParticipants ? COLORS.primary : 'transparent', color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 600, borderRadius: 2, px: 2 }}>
                  👥 {participants.length}
                </Button>
              </Box>
              <IconButton size="small" onClick={() => { setShowChat(false); setShowParticipants(false); }} sx={{ color: 'white' }}>
                <CloseRounded />
              </IconButton>
            </Box>

            {/* Chat */}
            {showChat && (
              <>
                <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {messages.length === 0 && (
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#475569', textAlign: 'center', mt: 4 }}>
                      لا توجد رسائل بعد
                    </Typography>
                  )}
                  {messages.map((msg) => (
                    <Box key={msg.id} sx={{ alignSelf: msg.isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                      {!msg.isMe && (
                        <Typography variant="caption" fontFamily="Cairo, sans-serif"
                          sx={{ color: msg.isTeacher ? '#a78bfa' : '#94a3b8', fontWeight: msg.isTeacher ? 700 : 600, mb: 0.5, display: 'block' }}>
                          {msg.sender} {msg.isTeacher && '(المدرس)'}
                        </Typography>
                      )}
                      <Box sx={{
                        bgcolor: msg.isMe ? COLORS.primary : msg.isTeacher ? COLORS.secondary : '#475569',
                        p: 1.5, borderRadius: 2,
                        borderTopRightRadius: msg.isMe ? 0 : 2,
                        borderTopLeftRadius: msg.isMe ? 2 : 0,
                      }}>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ wordBreak: 'break-word' }}>
                          {msg.message}
                        </Typography>
                      </Box>
                      <Typography variant="caption" fontFamily="Cairo, sans-serif"
                        sx={{ color: '#64748b', mt: 0.5, display: 'block', textAlign: msg.isMe ? 'right' : 'left' }}>
                        {msg.time}
                      </Typography>
                    </Box>
                  ))}
                  <div ref={chatEndRef} />
                </Box>
                <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1 }}>
                  <TextField fullWidth size="small" placeholder="اكتب رسالة..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#0f172a', borderRadius: 2, color: 'white', fontFamily: 'Cairo, sans-serif', '& fieldset': { border: 'none' } },
                          '& .MuiInputBase-input::placeholder': { color: '#64748b', opacity: 1 } }} />
                  <IconButton onClick={sendMessage} disabled={!newMessage.trim()}
                    sx={{ bgcolor: COLORS.primary, color: 'white', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    <SendRounded />
                  </IconButton>
                </Box>
              </>
            )}

            {/* Participants */}
            {showParticipants && (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>
                    المدرس
                  </Typography>
                  {participants.filter(p => p.role === 'teacher').length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: '#334155' }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: COLORS.secondary, fontFamily: 'Cairo, sans-serif' }}>
                        {roomData.teacherName?.charAt(0) || 'م'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600} fontFamily="Cairo, sans-serif">
                          {roomData.teacherName || 'المدرس'}
                        </Typography>
                        <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#a78bfa' }}>المدرس</Typography>
                      </Box>
                    </Box>
                  ) : (
                    participants.filter(p => p.role === 'teacher').map(p => (
                      <Box key={p.userId} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: '#334155' }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          badgeContent={<Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS.success, border: '2px solid #1e293b' }} />}>
                          <Avatar sx={{ width: 40, height: 40, bgcolor: COLORS.secondary, fontFamily: 'Cairo, sans-serif' }}>
                            {p.name?.charAt(0) || 'م'}
                          </Avatar>
                        </Badge>
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={600} fontFamily="Cairo, sans-serif">{p.name}</Typography>
                          <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#a78bfa' }}>المدرس</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {teacherMicOn ? <MicRounded sx={{ fontSize: 18, color: COLORS.success }} /> : <MicOffRounded sx={{ fontSize: 18, color: COLORS.error }} />}
                          {teacherCamOn ? <VideocamRounded sx={{ fontSize: 18, color: COLORS.success }} /> : <VideocamOffRounded sx={{ fontSize: 18, color: COLORS.error }} />}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ p: 2 }}>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#94a3b8', mb: 1, display: 'block' }}>
                    الطلاب ({studentCount})
                  </Typography>
                  <List sx={{ p: 0 }}>
                    {participants.filter(p => p.role === 'student').map(p => (
                      <ListItem key={p.userId} sx={{ px: 1.5, py: 1, borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: '#334155' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: p.isLocal ? COLORS.success : COLORS.primary, fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
                            {p.name?.charAt(0) || 'ط'}
                          </Avatar>
                          <Typography fontFamily="Cairo, sans-serif" sx={{ flex: 1 }} noWrap>
                            {p.name} {p.isLocal && '(أنت)'}
                          </Typography>
                        </Box>
                      </ListItem>
                    ))}
                    {participants.filter(p => p.role === 'student').length === 0 && (
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b', textAlign: 'center', py: 2 }}>
                        لا يوجد طلاب بعد
                      </Typography>
                    )}
                  </List>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Control Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3, borderTop: '1px solid rgba(255,255,255,0.1)', bgcolor: '#0f172a' }}>
        <Tooltip title={micOn ? 'إيقاف الميكروفون' : 'تشغيل الميكروفون'}>
          <IconButton onClick={() => {
            if (localStreamRef.current) {
              localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
            }
            setMicOn(v => !v);
          }}
            sx={{ width: 56, height: 56, bgcolor: micOn ? '#475569' : COLORS.error, color: 'white',
              '&:hover': { bgcolor: micOn ? '#64748b' : '#dc2626' } }}>
            {micOn ? <MicRounded sx={{ fontSize: 28 }} /> : <MicOffRounded sx={{ fontSize: 28 }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title={handRaised ? 'إنزال اليد' : 'رفع اليد'}>
          <IconButton onClick={toggleHandRaise}
            sx={{
              width: 56, height: 56,
              bgcolor: handRaised ? COLORS.warning : '#475569',
              color: 'white',
              '&:hover': { bgcolor: handRaised ? '#d97706' : '#64748b' },
              animation: handRaised ? 'wave 0.5s infinite alternate' : 'none',
              '@keyframes wave': { '0%': { transform: 'rotate(-5deg)' }, '100%': { transform: 'rotate(5deg)' } },
            }}>
            <PanToolRounded sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="المحادثة">
          <IconButton onClick={() => {
            const next = !showChat;
            setShowChat(next);
            showChatRef.current = next;
            setShowParticipants(false);
            if (next) {
              chatUnreadRef.current = 0;
              setChatUnreadCount(0);
            }
          }}
            sx={{ width: 56, height: 56, bgcolor: showChat ? COLORS.primary : '#475569', color: 'white',
              '&:hover': { bgcolor: showChat ? '#1d4ed8' : '#64748b' } }}>
            <Badge badgeContent={chatUnreadCount} color="error" max={99}>
              <ChatRounded sx={{ fontSize: 28 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="المشاركون">
          <IconButton onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
            sx={{ width: 56, height: 56, bgcolor: showParticipants ? COLORS.primary : '#475569', color: 'white',
              '&:hover': { bgcolor: showParticipants ? '#1d4ed8' : '#64748b' } }}>
            <Badge badgeContent={participants.length} color="primary">
              <PeopleRounded sx={{ fontSize: 28 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="مغادرة الحصة">
          <Button onClick={handleLeave} startIcon={<CallEndRounded />}
            sx={{ height: 56, px: 4, bgcolor: COLORS.error, color: 'white',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 3,
              '&:hover': { bgcolor: '#dc2626' } }}>
            مغادرة
          </Button>
        </Tooltip>
      </Box>

      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.7 } }
      `}</style>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Fetches room data and shows entry view
// ═══════════════════════════════════════════════════════════════════

const LiveClassPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inSession, setInSession] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // ── Try to fetch room from URL param ──────────────────────
  useEffect(() => {
    const roomName = searchParams.get('room');
    if (roomName) {
      fetchRoom(roomName);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRoom = async (roomName) => {
    setLoading(true);
    setError('');
    try {
      const res = await liveClassesService.getRoomByName(roomName);
      const room = res.data?.data;
      if (!room) throw new Error('الغرفة غير موجودة');
      // Allow fetching ended rooms too — show status in UI instead of error
      setRoomData(room);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'فشل تحميل معلومات الغرفة');
    } finally {
      setLoading(false);
    }
  };

  // ── Join by code ──────────────────────────────────────────
  const handleJoinByCode = async () => {
    if (!joinCode.trim()) { toast.error('يرجى إدخال كود الانضمام'); return; }
    setJoining(true);
    try {
      const res = await liveClassesService.joinByCode(joinCode.trim());
      const data = res.data?.data;
      if (data?.roomName) {
        fetchRoom(data.roomName);
      } else {
        throw new Error('الكود غير صحيح');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'الكود غير صحيح أو الغرفة غير موجودة');
    } finally {
      setJoining(false);
    }
  };

  // ── Join directly ─────────────────────────────────────────
  const handleJoinSession = () => {
    if (roomData) {
      setInSession(true);
    }
  };

  const handleLeaveSession = () => {
    setInSession(false);
  };

  // ── If in session, show the room panel ────────────────────
  if (inSession && roomData) {
    return <InRoomPanel roomData={roomData} onLeave={handleLeaveSession} darkMode={darkMode} />;
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} thickness={4} />
          <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ mt: 2, color: darkMode ? '#94a3b8' : '#64748b' }}>
            جاري تحميل معلومات الحصة...
          </Typography>
        </Box>
      </Box>
    );
  }

  // ── Room found from URL ───────────────────────────────────
  if (roomData) {
    const isLive = roomData.isActive;
    const isEnded = !roomData.isActive && roomData.endedAt;
    const heroGradient = isLive
      ? 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
      : 'linear-gradient(135deg, #64748b 0%, #475569 100%)';

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
        <Box sx={{ background: heroGradient, color: 'white', py: 6, px: 2, mb: 3 }}>
          <Container maxWidth="md">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button startIcon={<ArrowBackRounded />} onClick={() => navigate(-1)} sx={{ color: 'white', fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>
                العودة
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <PlayCircleFilledRounded sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>
                {roomData.title || 'حصة مباشرة'}
              </Typography>
              {roomData.course?.title && (
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mb: 1 }}>
                  📚 {roomData.course.title}
                </Typography>
              )}
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.8, mb: 3 }}>
                👨‍🏫 {roomData.host?.user?.name || roomData.teacherName || 'المدرس'}
              </Typography>

              {isLive ? (
                <Button
                  fullWidth variant="contained" size="large"
                  onClick={handleJoinSession}
                  startIcon={<PlayCircleFilledRounded />}
                  sx={{ maxWidth: 400, fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' } }}>
                  🚀 انضم الآن
                </Button>
              ) : (
                <Button
                  fullWidth variant="outlined" size="large" disabled
                  startIcon={<CheckCircleRounded />}
                  sx={{ maxWidth: 400, fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, fontSize: '1.1rem',
                    borderColor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.6)' }}>
                  ✅ انتهت الحصة
                </Button>
              )}
            </Box>
          </Container>
        </Box>

        <Container maxWidth="md">
          <Card elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mb: 2, color: darkMode ? '#f1f5f9' : '#1e293b' }}>
              📋 معلومات الحصة
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {roomData.description && (
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  {roomData.description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleRounded sx={{ fontSize: 18, color: '#2563eb' }} />
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  {roomData._count?.participants || 0} مشارك
                </Typography>
              </Box>
              {roomData.maxCapacity && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleRounded sx={{ fontSize: 18, color: '#f59e0b' }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    الحد الأقصى: {roomData.maxCapacity} طالب
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {isLive ? (
                  <>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse2 1.5s infinite' }} />
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#059669', fontWeight: 600 }}>
                      الحصة نشطة الآن
                    </Typography>
                  </>
                ) : (
                  <>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                      انتهت الحصة
                    </Typography>
                  </>
                )}
              </Box>
              {isEnded && roomData.endedAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeRounded sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    انتهت في: {new Date(roomData.endedAt).toLocaleString('ar-EG')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Container>

        {error && (
          <Container maxWidth="md" sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
          </Container>
        )}

        <style>{`
          @keyframes pulse2 { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        `}</style>
      </Box>
    );
  }

  // ── No room — show join by code form ──────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f8fafc', pb: 4 }}>
      <Box sx={{ background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)', color: 'white', py: 6, px: 2, mb: 3 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button startIcon={<ArrowBackRounded />} onClick={() => navigate('/student/dashboard')} sx={{ color: 'white', fontFamily: 'Cairo, sans-serif' }}>
              العودة
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif">🎥 الحصص المباشرة</Typography>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mt: 1 }}>
              أدخل كود الانضمام للدخول إلى الحصة
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm">
        <Card elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 2, background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', mb: 2 }}>
              <PlayCircleFilledRounded sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : '#1e293b', mb: 1 }}>
              الانضمام بحصة مباشرة
            </Typography>
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              استخدم الكود الذي شاركه معك المدرس
            </Typography>
          </Box>

          <TextField fullWidth label="كود الانضمام" placeholder="أدخل الكود (مثال: A1B2C3)"
            value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') handleJoinByCode(); }}
            sx={{ mb: 2, '& .MuiInputLabel-root': { fontFamily: 'Cairo, sans-serif' }, '& .MuiInputBase-input': { fontFamily: 'Cairo, sans-serif', letterSpacing: '0.3em', fontWeight: 700 } }}
            inputProps={{ style: { textTransform: 'uppercase', textAlign: 'center' } }} />

          <Button fullWidth variant="contained" size="large" onClick={handleJoinByCode} disabled={joining}
            startIcon={joining ? <CircularProgress size={20} color="inherit" /> : <PlayCircleFilledRounded />}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, mb: 2,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' } }}>
            {joining ? 'جاري الانضمام...' : 'انضم'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default LiveClassPage;
