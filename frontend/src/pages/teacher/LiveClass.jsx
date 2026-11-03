// frontend/src/pages/teacher/LiveClass.jsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }                              from 'react-router-dom';
import { useTheme }                                 from '../../hooks/useTheme';
import { useAuth }                                  from '../../hooks/useAuth';
import liveClassesService                           from '../../services/liveClasses.service';
import {
  Container, Box, Typography, Card, CardContent,
  TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Grid, Chip,
  Alert, Divider, List, ListItem, ListItemText,
  ListItemIcon, Paper, CircularProgress,
  IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Badge, Avatar,
} from '@mui/material';
import {
  ArrowBack, VideoCall, ContentCopy, People,
  Mic, MicOff, Videocam, VideocamOff,
  Chat, CheckCircle, Close,
  CallEnd, FiberManualRecord, Save,
  Cancel as CancelIcon, Warning,
  ScreenShare, StopScreenShare,
  PanToolRounded, VolumeUpRounded, VolumeOffRounded,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ── مساعد: الوقت الحالي بصيغة datetime-local ─────────────────────────────
const getNowLocal = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  // تحويل لـ local ISO بدون timezone offset
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 16);
};

const TeacherLiveClass = () => {
  const navigate     = useNavigate();
  const { darkMode } = useTheme();
  const { user }     = useAuth();

  const [step, setStep]                     = useState('setup');
  const [loading, setLoading]               = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [roomData, setRoomData] = useState({
    courseId:      '',
    title:         '',
    description:   '',
    maxCapacity:   100,
    scheduledTime: getNowLocal(),   // ← الوقت الحالي تلقائياً
  });
  const [createdRoom, setCreatedRoom] = useState(null);
  const [courses, setCourses]         = useState([]);

  // WebRTC state
  const [micOn,         setMicOn]        = useState(true);
  const [camOn,         setCamOn]        = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [chatOpen,      setChatOpen]     = useState(false);
  const [messages,      setMessages]     = useState([]);
  const [chatInput,     setChatInput]    = useState('');
  const [participants,  setParticipants] = useState([]);
  const [duration,      setDuration]     = useState(0);
  const [ending,        setEnding]       = useState(false);
  const screenStreamRef = useRef(null);
  const [raiseHands, setRaiseHands]   = useState([]);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const chatUnreadRef   = useRef(0);
  const chatOpenRef     = useRef(false);
  const [showParticipants, setShowParticipants] = useState(false);
  // Track screen track senders per peer for removal
  const screenSenderRefs = useRef({});

  // Dialogs
  const [endDialog,     setEndDialog]     = useState(false);
  const [savedLesson,   setSavedLesson]   = useState(null);
  const [cancelDialog,  setCancelDialog]  = useState(false);
  const [cancelling,    setCancelling]    = useState(false);

  // Recording
  const [isRecording, setIsRecording]     = useState(false);
  const mediaRecorderRef                  = useRef(null);
  const recordingChunksRef                = useRef([]);

  // Refs
  const localVideoRef   = useRef(null);
  const localStreamRef  = useRef(null);
  const socketRef       = useRef(null);
  const peersRef        = useRef({});
  const remoteVideosRef = useRef({});
  const timerRef        = useRef(null);

  // ── جلب الكورسات ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await liveClassesService.getTeacherCourses();
        setCourses(res.data?.data || []);
      } catch { setCourses([]); }
      finally  { setLoadingCourses(false); }
    })();
  }, []);

  // ── تحقق من غرفة نشطة ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await liveClassesService.getActiveRoom();
        if (res.data?.data) {
          setCreatedRoom(res.data.data);
          setStep('created');
        }
      } catch {}
    })();
  }, []);

  // ── مؤقت الحصة ─────────────────────────────────────────────────────
  useEffect(() => {
    if (step === 'live') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const startRecording = (stream) => {
    if (!stream || !createdRoom?.courseId) return;
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.warn('Failed to start recording:', err.message);
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, {
          type: recordingChunksRef.current[0]?.type || 'video/webm',
        });
        recordingChunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      if (recorder.state === 'recording') recorder.stop();
      else resolve(null);
    });
  };

  // ── إنشاء الغرفة ────────────────────────────────────────────────────
  const handleCreateRoom = async () => {
    if (!roomData.title.trim()) { toast.error('يرجى إدخال عنوان الحصة'); return; }
    setLoading(true);
    try {
      const res  = await liveClassesService.createRoom(roomData);
      const room = res.data?.data;
      setCreatedRoom(room);
      setStep('created');
      toast.success('تم إنشاء الحصة بنجاح! 🎉');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل إنشاء الحصة');
    } finally {
      setLoading(false);
    }
  };

  // ── بدء الحصة ───────────────────────────────────────────────────────
  const handleStartLive = useCallback(async () => {
    // Activate the room in the backend first
    try {
      await liveClassesService.startRoom(createdRoom.id);
    } catch (e) {
      toast.error('فشل تنشيط الحصة، حاول مرة أخرى');
      return;
    }

    setStep('live');
    try {
      let stream;

try {
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: true,
  });
} catch (err) {
  console.warn('Camera not available, using audio only');

  stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });

  setCamOn(false);
  toast('تم تشغيل الحصة بالصوت فقط 🎤', {
    icon: '🎤',
  });
}
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      startRecording(stream);

      const token  = localStorage.getItem('token');
      const wsUrl  = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const { io } = await import('socket.io-client');

      socketRef.current = io(wsUrl, {
        auth:       { token },
        transports: ['websocket', 'polling'],
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        socket.emit('live_class:join', { roomName: createdRoom.roomName });
        setParticipants(prev => [
          ...prev.filter(p => p.userId !== user?.id),
          { userId: user?.id, name: user?.name || 'أنت', role: 'teacher', isLocal: true },
        ]);
      });

      socket.on('live_class:student_joined', ({ userId, name }) => {
        setParticipants(prev => [
          ...prev.filter(p => p.userId !== userId),
          { userId, name: name || 'طالب', role: 'student' },
        ]);
        toast(`${name || 'طالب'} انضم للحصة 👋`, { icon: '👤' });

        // Initiate WebRTC connection: create offer for the new student
        const pc = createPeerConnection(userId, socket, stream);
        peersRef.current[userId] = pc;
        pc.createOffer()
          .then((offer) => {
            pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', {
              roomName: createdRoom.roomName,
              targetUserId: userId,
              offer,
            });
          })
          .catch((err) => console.error('Failed to create offer:', err));
      });

      socket.on('live_class:student_left', ({ userId }) => {
        setParticipants(prev => prev.filter(p => p.userId !== userId));
        if (peersRef.current[userId]) {
          peersRef.current[userId].close();
          delete peersRef.current[userId];
        }
      });

      socket.on('webrtc:offer', async ({ fromUserId, offer }) => {
        let pc = peersRef.current[fromUserId];
        if (pc) {
          // Renegotiation — update existing PC
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:answer', {
            roomName: createdRoom.roomName, targetUserId: fromUserId, answer,
          });
          return;
        }
        // First offer from student (who might be the one initiating)
        pc = createPeerConnection(fromUserId, socket, stream);
        peersRef.current[fromUserId] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', {
          roomName: createdRoom.roomName, targetUserId: fromUserId, answer,
        });
      });

      socket.on('webrtc:answer', async ({ fromUserId, answer }) => {
        const pc = peersRef.current[fromUserId];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('webrtc:ice-candidate', async ({ fromUserId, candidate }) => {
        const pc = peersRef.current[fromUserId];
        if (pc && candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
        }
      });

      socket.on('live_class:chat_message', ({ senderName, message }) => {
        setMessages(prev => [...prev, {
          sender:    senderName || 'طالب',
          message,
          time:      new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isTeacher: false,
        }]);
        if (!chatOpenRef.current) {
          chatUnreadRef.current += 1;
          setChatUnreadCount(chatUnreadRef.current);
        }
      });

      // ── Raise hand listener ─────────────────────────────────--
      socket.on('live_class:hand_raised', ({ userId, name }) => {
        setRaiseHands(prev => {
          if (prev.some(h => h.userId === userId)) return prev;
          return [...prev, { userId, name: name || 'طالب' }];
        });
        toast(`✋ ${name || 'طالب'} يرفع يده!`, { icon: '✋' });
        // Auto-dismiss after 15s
        setTimeout(() => {
          setRaiseHands(prev => prev.filter(h => h.userId !== userId));
        }, 15000);
      });

    } catch (e) {
      console.error('Failed to start live class:', e);
      toast.error('فشل الوصول للكاميرا أو الميكروفون');
      setStep('created');
    }
  }, [createdRoom, user]);

  const createPeerConnection = (targetUserId, socket, stream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('webrtc:ice-candidate', {
          roomName: createdRoom?.roomName, targetUserId, candidate,
        });
      }
    };

    pc.ontrack = ({ streams: [remoteStream] }) => {
      if (remoteVideosRef.current[targetUserId]) {
        remoteVideosRef.current[targetUserId].srcObject = remoteStream;
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        await pc.setLocalDescription(await pc.createOffer());
        socket.emit('webrtc:offer', {
          roomName: createdRoom?.roomName, targetUserId, offer: pc.localDescription,
        });
      } catch (e) {
        console.error('Negotiation failed:', e);
      }
    };

    return pc;
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicOn(v => !v);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOn(v => !v);
    }
  };

  const toggleScreenShare = async () => {
    const socket = socketRef.current;
    const roomName = createdRoom?.roomName;

    if (screenShareOn) {
      // Stop screen sharing — remove screen track from all PCs
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenShareOn(false);

      Object.entries(peersRef.current).forEach(([userId, pc]) => {
        const sender = screenSenderRefs.current[userId];
        if (sender) {
          try { pc.removeTrack(sender); } catch {}
          delete screenSenderRefs.current[userId];
        }
      });

      socket?.emit('live_class:screen_share_stopped', { roomName });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        setScreenShareOn(true);

        // Add screen track AS A SECOND video track to all peer connections
        // Camera track stays — student receives both via ontrack
        Object.entries(peersRef.current).forEach(([userId, pc]) => {
          const sender = pc.addTrack(screenTrack, screenStream);
          screenSenderRefs.current[userId] = sender;
        });

        socket?.emit('live_class:screen_share_started', { roomName });

        screenTrack.onended = () => {
          toggleScreenShare();
        };
      } catch (e) {
        console.error('Screen share failed:', e);
        toast.error('فشل مشاركة الشاشة');
      }
    }
  };

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit('live_class:chat_message', {
      roomName:   createdRoom?.roomName,
      senderName: user?.name || 'المدرس',
      message:    chatInput,
    });
    setMessages(prev => [...prev, {
      sender:    user?.name || 'أنت',
      message:   chatInput,
      time:      new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isTeacher: true,
    }]);
    setChatInput('');
  };

  // ── إنهاء الحصة ─────────────────────────────────────────────────────
  const handleEndClass = async () => {
    setEnding(true);
    try {
      // 1) Stop recording and upload the blob
      let recordingMeta = {};
      try {
        const blob = await stopRecording();
        if (blob && createdRoom?.courseId) {
          const formData = new FormData();
          formData.append('video', blob, 'recording.webm');
          formData.append('roomId', createdRoom.id);
          formData.append('duration', String(Math.floor(duration)));

          const token = localStorage.getItem('token');
          const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const uploadRes = await fetch(`${wsUrl}/api/webrtc/recording/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const uploadData = (await uploadRes.json())?.data;
          if (uploadData) {
            recordingMeta = {
              videoUrl: uploadData.videoUrl,
              fileName: uploadData.fileName,
              fileSize: blob.size,
              duration: Math.floor(duration),
            };
          }
        }
      } catch (recErr) {
        console.warn('Recording upload failed (continuing anyway):', recErr.message);
      }

      // 2) إيقاف streams
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      // 3) إغلاق peer connections
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
      // 4) قطع socket
      socketRef.current?.disconnect();

      // 5) إنهاء الغرفة في الـ Backend (مع videoUrl إن وُجد)
      const res    = await liveClassesService.endRoom(createdRoom.id, recordingMeta);
      const result = res.data?.data;

      if (result?.savedLesson) {
        setSavedLesson(result);
        setEndDialog(true);           // ← نفتح dialog الحفظ
      } else {
        toast.success('انتهت الحصة بنجاح');
        navigate('/teacher/dashboard');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إنهاء الحصة');
      navigate('/teacher/dashboard');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoomData(prev => ({ ...prev, [name]: value }));
  };

  // ── إلغاء الحصة المجدولة ──────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelling(true);
    try {
      await liveClassesService.cancelRoom(createdRoom.id);
      toast.success('تم إلغاء الحصة بنجاح');
      setCancelDialog(false);
      setCreatedRoom(null);
      setStep('setup');
    } catch (e) {
      toast.error(e.response?.data?.message || 'فشل إلغاء الحصة');
    } finally {
      setCancelling(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}!`);
  };

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: إعداد الغرفة
  // ─────────────────────────────────────────────────────────────────────
  if (step === 'setup') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/teacher/dashboard')}
              sx={{ mb: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: darkMode ? '#f1f5f9' : 'inherit' }}
            >
              العودة للوحة التحكم
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: 2, background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <VideoCall />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                  بدء حصة مباشرة
                </Typography>
                <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                  أنشئ حصة أونلاين مباشرة لطلابك
                </Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 3, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    إعدادات الحصة
                  </Typography>

                  <Grid container spacing={3}>
                    {/* الكورس */}
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>اختر الكورس (اختياري)</InputLabel>
                        <Select
                          name="courseId"
                          value={roomData.courseId}
                          onChange={handleChange}
                          label="اختر الكورس (اختياري)"
                          sx={{ fontFamily: 'Cairo, sans-serif' }}
                        >
                          <MenuItem value=""><em>بدون كورس</em></MenuItem>
                          {loadingCourses
                            ? <MenuItem disabled>جاري التحميل...</MenuItem>
                            : courses.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography fontFamily="Cairo, sans-serif" fontWeight={700}>{c.title}</Typography>
                                    <Chip label={`${c._count?.enrollments || 0} طالب`} size="small" sx={{ fontFamily: 'Cairo, sans-serif' }} />
                                  </Box>
                                </MenuItem>
                              ))
                          }
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* العنوان */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth required
                        name="title" label="عنوان الحصة"
                        value={roomData.title} onChange={handleChange}
                        placeholder="مثال: شرح الجبر - الفصل الأول"
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                        InputLabelProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* الوصف */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth multiline rows={2}
                        name="description" label="وصف الحصة (اختياري)"
                        value={roomData.description} onChange={handleChange}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                        InputLabelProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* الحد الأقصى */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth type="number"
                        name="maxCapacity" label="الحد الأقصى للطلاب"
                        value={roomData.maxCapacity} onChange={handleChange}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                        InputLabelProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                      />
                    </Grid>

                    {/* الموعد — يتحدد الوقت الحالي تلقائياً */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth type="datetime-local"
                        name="scheduledTime" label="موعد الحصة"
                        value={roomData.scheduledTime} onChange={handleChange}
                        InputLabelProps={{ shrink: true, sx: { fontFamily: 'Cairo, sans-serif' } }}
                        InputProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
                        helperText="يتحدد الوقت الحالي تلقائياً"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4 }}>
                    <Button
                      fullWidth variant="contained" size="large"
                      onClick={handleCreateRoom} disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VideoCall />}
                      sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' } }}
                    >
                      {loading ? 'جاري الإنشاء...' : 'إنشاء الحصة'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Info Panel */}
            <Grid item xs={12} lg={4}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 2, color: darkMode ? '#f1f5f9' : 'inherit' }}>
                    مميزات الحصة
                  </Typography>
                  <List dense>
                    {[
                      { icon: <Videocam sx={{ color: '#2563eb' }} />,  text: 'فيديو عالي الجودة' },
                      { icon: <Mic      sx={{ color: '#7c3aed' }} />,  text: 'صوت نقي' },
                      { icon: <Chat     sx={{ color: '#059669' }} />,  text: 'دردشة تفاعلية' },
                      { icon: <People   sx={{ color: '#f59e0b' }} />,  text: 'إدارة الحضور التلقائي' },
                      { icon: <Save     sx={{ color: '#db2777' }} />,  text: 'حفظ تلقائي كدرس بعد الانتهاء' },
                    ].map((item, i) => (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, sx: { color: darkMode ? '#f1f5f9' : 'inherit' } }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Alert severity="info" sx={{ mt: 2, fontFamily: 'Cairo, sans-serif', fontSize: 13 }}>
                    عند اختيار كورس، ستُحفظ الحصة تلقائياً كدرس في الكورس بعد الانتهاء.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: تم الإنشاء - انتظار البدء
  // ─────────────────────────────────────────────────────────────────────
  if (step === 'created') {
    const roomCode = createdRoom?.roomCode || createdRoom?.roomName?.slice(-6).toUpperCase();
    const roomLink = `${window.location.origin}/student/live-class?room=${createdRoom?.roomName}`;

    return (
      <Box sx={{ minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb', py: 4 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', mb: 3 }}>
              <CheckCircle sx={{ fontSize: 50 }} />
            </Box>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1, color: darkMode ? '#f1f5f9' : 'inherit' }}>
              تم إنشاء الحصة بنجاح!
            </Typography>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              شارك الرابط أو الكود مع طلابك للانضمام
            </Typography>
          </Box>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb', bgcolor: darkMode ? '#1e293b' : 'white', mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: darkMode ? '#0f172a' : '#f9fafb', border: '1px solid', borderColor: darkMode ? '#334155' : '#e5e7eb' }}>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>عنوان الحصة</Typography>
                <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#f1f5f9' : 'inherit' }}>
                  {createdRoom?.title || roomData.title}
                </Typography>
              </Paper>

              {/* الرابط */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1, color: darkMode ? '#94a3b8' : '#64748b' }}>رابط الحصة</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth value={roomLink}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'Cairo, sans-serif', fontSize: '0.8rem' } }}
                    sx={{ '& .MuiInputBase-input': { color: darkMode ? '#f1f5f9' : undefined } }}
                  />
                  <Button variant="outlined" onClick={() => copyToClipboard(roomLink, 'الرابط')} startIcon={<ContentCopy />} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, minWidth: 100 }}>
                    نسخ
                  </Button>
                </Box>
              </Box>

              {/* الكود */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1, color: darkMode ? '#94a3b8' : '#64748b' }}>كود الانضمام</Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Paper elevation={0} sx={{ px: 3, py: 2, flexGrow: 1, bgcolor: darkMode ? '#0f172a' : '#f9fafb', border: '2px solid', borderColor: '#2563eb', textAlign: 'center' }}>
                    <Typography variant="h3" fontFamily="monospace" fontWeight={900} letterSpacing="0.3em" sx={{ color: '#2563eb' }}>
                      {roomCode}
                    </Typography>
                  </Paper>
                  <Button variant="outlined" onClick={() => copyToClipboard(roomCode, 'الكود')} startIcon={<ContentCopy />} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, minWidth: 100 }}>
                    نسخ
                  </Button>
                </Box>
              </Box>

              {roomData.courseId && (
                <Alert severity="success" sx={{ fontFamily: 'Cairo, sans-serif', mb: 2 }}>
                  ✅ ستُحفظ هذه الحصة تلقائياً كدرس في الكورس المختار عند الانتهاء
                </Alert>
              )}

              <Alert severity="info" sx={{ fontFamily: 'Cairo, sans-serif' }}>
                سيتلقى الطلاب المشتركين في الكورس إشعاراً تلقائياً الآن
              </Alert>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth variant="outlined"
                onClick={() => { setCreatedRoom(null); setStep('setup'); }}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, py: 1.5, borderColor: darkMode ? '#334155' : undefined, color: darkMode ? '#f1f5f9' : 'inherit' }}
              >
                إنشاء حصة جديدة
              </Button>
            </Grid>
            {createdRoom?.scheduledAt && (
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth variant="outlined" color="error"
                  onClick={() => setCancelDialog(true)}
                  startIcon={<CancelIcon />}
                  sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, py: 1.5 }}
                >
                  إلغاء الحصة
                </Button>
              </Grid>
            )}
            <Grid item xs={12} sm={createdRoom?.scheduledAt ? 4 : 6}>
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleStartLive}
                startIcon={<VideoCall />}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' } }}
              >
                بدء الحصة الآن
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // RENDER: الحصة النشطة
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <Box sx={{ height: '100vh', bgcolor: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 3, py: 1.5, bgcolor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FiberManualRecord sx={{ color: '#ef4444', fontSize: 12 }} />
              <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#f1f5f9' }}>مباشر</Typography>
              {isRecording && (
                <Chip
                  icon={<FiberManualRecord sx={{ color: '#ef4444 !important', fontSize: 10, animation: 'pulse 1s infinite' }} />}
                  label="تسجيل"
                  size="small"
                  sx={{ bgcolor: '#7f1d1d', color: '#fca5a5', fontFamily: 'Cairo, sans-serif', fontSize: 10, fontWeight: 700, height: 22 }}
                />
              )}
            </Box>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#f1f5f9' }}>
              {createdRoom?.title || roomData.title}
            </Typography>
            <Chip label={formatDuration(duration)} size="small" sx={{ bgcolor: '#334155', color: '#94a3b8', fontFamily: 'monospace' }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<People sx={{ color: 'white !important', fontSize: 16 }} />}
              label={`${participants.length} مشارك`}
              size="small"
              sx={{ bgcolor: '#2563eb', color: 'white', fontFamily: 'Cairo, sans-serif' }}
            />
            {createdRoom?.courseId && (
              <Chip
                icon={<Save sx={{ color: 'white !important', fontSize: 14 }} />}
                label="سيُحفظ كدرس"
                size="small"
                sx={{ bgcolor: '#059669', color: 'white', fontFamily: 'Cairo, sans-serif', fontSize: 11 }}
              />
            )}
            <Button
              variant="contained" color="error" size="small"
              startIcon={ending ? <CircularProgress size={16} color="inherit" /> : <CallEnd />}
              onClick={handleEndClass} disabled={ending}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}
            >
              إنهاء الحصة
            </Button>
          </Box>
        </Box>

        {/* Main area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Videos Grid */}
          <Box sx={{ flex: 1, p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, alignContent: 'start', overflowY: 'auto' }}>
            {/* Local Video */}
            <Box sx={{ position: 'relative', bgcolor: '#1e293b', borderRadius: 2, overflow: 'hidden', aspectRatio: '16/9', border: '2px solid #2563eb' }}>
              <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              {!camOn && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1e293b' }}>
                  <VideocamOff sx={{ fontSize: 48, color: '#475569' }} />
                </Box>
              )}
              <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', px: 1.5, py: 0.5, borderRadius: 1 }}>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>
                  أنت (المدرس) {!micOn && '🔇'}
                </Typography>
              </Box>
              {screenShareOn && (
                <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: '#059669', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white', animation: 'pulse 1s infinite' }} />
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'white', fontWeight: 600 }}>مشاركة الشاشة</Typography>
                  <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
                </Box>
              )}
            </Box>

            {/* Remote Videos */}
            {participants.filter(p => !p.isLocal).map(p => {
              const isRaised = raiseHands.some(h => h.userId === p.userId);
              return (
                <Box key={p.userId} sx={{
                  position: 'relative', bgcolor: '#1e293b', borderRadius: 2, overflow: 'hidden', aspectRatio: '16/9',
                  border: isRaised ? '3px solid #f59e0b' : 'none',
                }}>
                  <video
                    ref={el => { if (el) remoteVideosRef.current[p.userId] = el; }}
                    autoPlay playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {isRaised && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: '#f59e0b', borderRadius: '50%', p: 0.5, animation: 'pulseHand 0.6s infinite alternate' }}>
                      <PanToolRounded sx={{ fontSize: 22, color: 'white' }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', px: 1.5, py: 0.5, borderRadius: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>{p.name}</Typography>
                    {isRaised && (
                      <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#fef3c7', fontWeight: 700, fontSize: 10 }}>
                        ✋
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Chat Panel */}
          {chatOpen && (
            <Box sx={{ width: 320, bgcolor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#f1f5f9' }}>الدردشة</Typography>
                <IconButton size="small" onClick={() => { setChatOpen(false); chatOpenRef.current = false; }} sx={{ color: '#94a3b8' }}><Close fontSize="small" /></IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {messages.length === 0 && (
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#475569', textAlign: 'center', mt: 4 }}>
                    لا توجد رسائل بعد
                  </Typography>
                )}
                {messages.map((msg, i) => (
                  <Box key={i} sx={{ alignSelf: msg.isTeacher ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: '#64748b', display: 'block', mb: 0.3, textAlign: msg.isTeacher ? 'left' : 'right' }}>
                      {msg.sender} · {msg.time}
                    </Typography>
                    <Box sx={{ bgcolor: msg.isTeacher ? '#2563eb' : '#334155', px: 1.5, py: 1, borderRadius: 2 }}>
                      <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: 'white' }}>{msg.message}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ p: 2, borderTop: '1px solid #334155', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth size="small" placeholder="اكتب رسالة..."
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  sx={{ '& .MuiInputBase-root': { fontFamily: 'Cairo, sans-serif', bgcolor: '#0f172a', color: '#f1f5f9' } }}
                />
                <Button variant="contained" size="small" onClick={sendMessage} sx={{ minWidth: 0, px: 1.5 }}>→</Button>
              </Box>
            </Box>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <Box sx={{ width: 340, bgcolor: '#1e293b', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#f1f5f9' }}>المشاركون ({participants.length})</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="كتم الكل">
                    <IconButton size="small" onClick={() => socketRef.current?.emit('live_class:mute_all', { roomName: createdRoom?.roomName })}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                      <VolumeOffRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="إلغاء كتم الكل">
                    <IconButton size="small" onClick={() => socketRef.current?.emit('live_class:unmute_all', { roomName: createdRoom?.roomName })}
                      sx={{ color: '#94a3b8', '&:hover': { color: '#22c55e' } }}>
                      <VolumeUpRounded fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={() => setShowParticipants(false)} sx={{ color: '#94a3b8' }}><Close fontSize="small" /></IconButton>
                </Box>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#64748b', mb: 1, display: 'block' }}>
                  المدرس
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, bgcolor: '#334155', mb: 2 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#7c3aed', fontSize: 14, fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
                    {user?.name?.charAt(0) || 'م'}
                  </Avatar>
                  <Typography fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: '#f1f5f9', flex: 1 }} noWrap>
                    {user?.name || 'المدرس'} (أنت)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {micOn ? <Mic sx={{ fontSize: 18, color: '#22c55e' }} /> : <MicOff sx={{ fontSize: 18, color: '#ef4444' }} />}
                    {camOn ? <Videocam sx={{ fontSize: 18, color: '#22c55e' }} /> : <VideocamOff sx={{ fontSize: 18, color: '#ef4444' }} />}
                  </Box>
                </Box>

                <Divider sx={{ borderColor: '#334155', mb: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: '#64748b' }}>
                    الطلاب ({participants.filter(p => p.role === 'student').length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="كتم الكل">
                      <IconButton size="small" onClick={() => socketRef.current?.emit('live_class:mute_all', { roomName: createdRoom?.roomName })}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' }, fontSize: 12 }}>
                        <VolumeOffRounded fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="إلغاء كتم الكل">
                      <IconButton size="small" onClick={() => socketRef.current?.emit('live_class:unmute_all', { roomName: createdRoom?.roomName })}
                        sx={{ color: '#94a3b8', '&:hover': { color: '#22c55e' }, fontSize: 12 }}>
                        <VolumeUpRounded fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {participants.filter(p => p.role === 'student').length === 0 && (
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: '#475569', textAlign: 'center', py: 4 }}>
                    لا يوجد طلاب بعد
                  </Typography>
                )}

                {participants.filter(p => p.role === 'student').map(p => {
                  const isRaised = raiseHands.some(h => h.userId === p.userId);
                  return (
                    <Box key={p.userId} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                      bgcolor: isRaised ? 'rgba(245,158,11,0.15)' : 'transparent',
                      border: isRaised ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
                      mb: 0.5,
                    }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: isRaised ? '#f59e0b' : '#2563eb', fontSize: 14, fontFamily: 'Cairo, sans-serif' }}>
                        {p.name?.charAt(0) || 'ط'}
                      </Avatar>
                      <Typography fontFamily="Cairo, sans-serif" sx={{ color: '#f1f5f9', flex: 1 }} noWrap>
                        {p.name}
                      </Typography>
                      {isRaised && (
                        <Tooltip title="يرفع يده">
                          <PanToolRounded sx={{ color: '#f59e0b', fontSize: 20, animation: 'pulseHand 0.6s infinite alternate' }} />
                        </Tooltip>
                      )}
                      <Tooltip title="كتم الميكروفون">
                        <IconButton size="small"
                          onClick={() => socketRef.current?.emit('live_class:mute_student', {
                            roomName: createdRoom?.roomName, targetUserId: p.userId,
                          })}
                          sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                          <VolumeUpRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تشغيل الميكروفون">
                        <IconButton size="small"
                          onClick={() => socketRef.current?.emit('live_class:unmute_student', {
                            roomName: createdRoom?.roomName, targetUserId: p.userId,
                          })}
                          sx={{ color: '#94a3b8', '&:hover': { color: '#22c55e' } }}>
                          <VolumeOffRounded fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
              <style>{`@keyframes pulseHand { 0% { opacity: 0.6; transform: translateY(0); } 100% { opacity: 1; transform: translateY(-3px); } }`}</style>
            </Box>
          )}
        </Box>

        {/* Controls Bar */}
        <Box sx={{ bgcolor: '#1e293b', borderTop: '1px solid #334155', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Tooltip title={micOn ? 'كتم الميكروفون' : 'تشغيل الميكروفون'}>
            <IconButton onClick={toggleMic} sx={{ bgcolor: micOn ? '#334155' : '#ef4444', color: 'white', '&:hover': { bgcolor: micOn ? '#475569' : '#dc2626' }, width: 52, height: 52 }}>
              {micOn ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title={camOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}>
            <IconButton onClick={toggleCam} sx={{ bgcolor: camOn ? '#334155' : '#ef4444', color: 'white', '&:hover': { bgcolor: camOn ? '#475569' : '#dc2626' }, width: 52, height: 52 }}>
              {camOn ? <Videocam /> : <VideocamOff />}
            </IconButton>
          </Tooltip>
          <Tooltip title={screenShareOn ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة'}>
            <IconButton
              onClick={toggleScreenShare}
              sx={{ bgcolor: screenShareOn ? '#059669' : '#334155', color: 'white', '&:hover': { bgcolor: screenShareOn ? '#047857' : '#475569' }, width: 52, height: 52 }}
            >
              {screenShareOn ? <ScreenShare /> : <StopScreenShare />}
            </IconButton>
          </Tooltip>
          <Tooltip title="الدردشة">
            <IconButton
              onClick={() => {
                const next = !chatOpen;
                setChatOpen(next);
                chatOpenRef.current = next;
                if (next) {
                  chatUnreadRef.current = 0;
                  setChatUnreadCount(0);
                }
              }}
              sx={{ bgcolor: chatOpen ? '#7c3aed' : '#334155', color: 'white', '&:hover': { bgcolor: chatOpen ? '#6d28d9' : '#475569' }, width: 52, height: 52 }}
            >
              <Badge badgeContent={chatUnreadCount} color="error" max={99}>
                <Chat />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="المشاركون">
            <IconButton
              onClick={() => setShowParticipants(v => !v)}
              sx={{ bgcolor: showParticipants ? '#7c3aed' : '#334155', color: 'white', '&:hover': { bgcolor: showParticipants ? '#6d28d9' : '#475569' }, width: 52, height: 52 }}
            >
              <Badge badgeContent={raiseHands.length} color="warning" max={99}>
                <People />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="إنهاء الحصة">
            <IconButton
              onClick={handleEndClass} disabled={ending}
              sx={{ bgcolor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' }, width: 52, height: 52 }}
            >
              {ending ? <CircularProgress size={20} color="inherit" /> : <CallEnd />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Dialog: الحصة انتهت + حُفظت كدرس ── */}
      <Dialog
        open={endDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor:     darkMode ? '#1e293b' : 'white',
            border:      '1px solid',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <CheckCircle sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18} sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                انتهت الحصة بنجاح 🎉
              </Typography>
              <Typography fontFamily="Cairo, sans-serif" fontSize={13} sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                مدة الحصة: {savedLesson?.durationMinutes || 0} دقيقة
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {savedLesson?.savedLesson && (
            <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f0fdf4', border: '1px solid', borderColor: '#10b981', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Save sx={{ color: '#059669', fontSize: 20 }} />
                <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={14} sx={{ color: '#059669' }}>
                  تم حفظ الحصة تلقائياً كدرس
                </Typography>
              </Box>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={700} fontSize={15} sx={{ color: darkMode ? '#f1f5f9' : '#0f172a', mb: 0.5 }}>
                {savedLesson.savedLesson.title}
              </Typography>
              {savedLesson.courseTitle && (
                <Typography fontFamily="Cairo, sans-serif" fontSize={13} sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                  في كورس: {savedLesson.courseTitle}
                </Typography>
              )}
            </Box>
          )}

          {!savedLesson?.savedLesson && (
            <Alert severity="info" sx={{ fontFamily: 'Cairo, sans-serif' }}>
              لم يتم اختيار كورس — لم تُحفظ الحصة كدرس.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          {savedLesson?.savedLesson?.courseId && (
            <Button
              variant="outlined"
              onClick={() => navigate(`/teacher/my-courses`)}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: '#059669', color: '#059669' }}
            >
              عرض الدروس
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => navigate('/teacher/dashboard')}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', px: 3 }}
          >
            العودة للوحة التحكم
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: تأكيد إلغاء الحصة المجدولة ── */}
      <Dialog
        open={cancelDialog}
        onClose={() => !cancelling && setCancelDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor:     darkMode ? '#1e293b' : 'white',
            border:      '1px solid',
            borderColor: darkMode ? '#334155' : '#e5e7eb',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Warning sx={{ color: '#ef4444', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={900} fontSize={18} sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                إلغاء الحصة المجدولة
              </Typography>
              <Typography fontFamily="Cairo, sans-serif" fontSize={13} sx={{ color: darkMode ? '#64748b' : '#94a3b8' }}>
                هذا الإجراء لا يمكن التراجع عنه
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Typography fontFamily="Cairo, sans-serif" fontSize={14} sx={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
            هل أنت متأكد من إلغاء الحصة <strong>{createdRoom?.title || roomData.title}</strong>؟
          </Typography>
          {createdRoom?.scheduledAt && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc', border: '1px solid', borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
              <Typography variant="caption" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                موعد الحصة
              </Typography>
              <Typography fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                {new Date(createdRoom.scheduledAt).toLocaleDateString('ar-EG', {
                  day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setCancelDialog(false)}
            disabled={cancelling}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderColor: darkMode ? '#334155' : undefined, color: darkMode ? '#f1f5f9' : 'inherit' }}
          >
            تراجع
          </Button>
          <Button
            variant="contained" color="error"
            onClick={handleCancel}
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={18} color="inherit" /> : <CancelIcon />}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, px: 3 }}
          >
            {cancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeacherLiveClass;