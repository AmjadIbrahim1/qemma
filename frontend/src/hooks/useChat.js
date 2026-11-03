// frontend/src/hooks/useChat.js
// Hook for managing 3-way chat (Student ↔ Teacher ↔ Assistant Teacher)

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '');

const useChat = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});

  const socketRef = useRef(null);
  const tokenRef = useRef(null);
  const activeSessionRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // ── Connect to socket ────────────────────────────────────────
  const connect = useCallback((token) => {
    if (!token) return;
    tokenRef.current = token;

    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // ── Incoming chat message ──────────────────────────────────
    socket.on('chat:message', (message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // ── Typing indicator (uses ref to avoid stale closure) ─────
    socket.on('chat:typing', ({ userId, userName, sessionId }) => {
      if (activeSessionRef.current?.id === sessionId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
      }
    });

    socket.on('chat:stop_typing', ({ userId, sessionId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    return () => {
      socket.off('chat:message');
      socket.off('chat:typing');
      socket.off('chat:stop_typing');
    };
  }, []); // stable — no deps needed since we use refs

  // ── Disconnect ────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  // ── Join a session room ───────────────────────────────────────
  const joinSession = useCallback((sessionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:join_session', { sessionId });
    }
  }, []);

  // ── Leave a session room ──────────────────────────────────────
  const leaveSession = useCallback((sessionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:leave_session', { sessionId });
    }
  }, []);

  // ── Send typing indicator ─────────────────────────────────────
  const sendTyping = useCallback((sessionId, userName) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:typing', { sessionId, userName });
    }
  }, []);

  // ── Send stop typing indicator ────────────────────────────────
  const sendStopTyping = useCallback((sessionId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:stop_typing', { sessionId });
    }
  }, []);

  // ── Select active session ─────────────────────────────────────
  const selectSession = useCallback((session) => {
    if (activeSession) {
      leaveSession(activeSession.id);
    }
    setActiveSession(session);
    setMessages([]);
    setTypingUsers({});
    if (session) {
      joinSession(session.id);
    }
  }, [activeSession, leaveSession, joinSession]);

  // ── Add message to local state (for optimistic UI) ─────────────
  const addMessage = useCallback((message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  return {
    // State
    sessions,
    activeSession,
    messages,
    loading,
    error,
    connected,
    typingUsers,

    // Actions
    setSessions,
    selectSession,
    setMessages,
    addMessage,
    setLoading,
    setError,
    connect,
    disconnect,
    joinSession,
    leaveSession,
    sendTyping,
    sendStopTyping,
  };
};

export default useChat;
