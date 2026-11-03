// frontend/src/hooks/useSocket.jsx
// Replaces the existing useSocket.jsx
// Manages a single Socket.IO connection for the authenticated user.
// Exposes `socketEvents` — a growing list of raw server events.
// AppLayout passes socketEvents to OTPPopupContainer.

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

// Strip /api suffix if present — Socket.IO lives on the root server
const SOCKET_URL =
  (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '');

/**
 * @param {string|null} token  JWT token for socket auth
 * @param {boolean}     active Connect only when true
 */
const useSocket = (token, active = false) => {
  const socketRef                     = useRef(null);
  const [connected,     setConnected] = useState(false);
  const [socketEvents, setSocketEvents] = useState([]);

  const pushEvent = useCallback((event) => {
    setSocketEvents((prev) => {
      const next = [...prev, event];
      // keep last 50 events to avoid memory leak
      return next.length > 50 ? next.slice(-50) : next;
    });
  }, []);

  useEffect(() => {
    // disconnect when no longer needed
    if (!active || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // avoid duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth:                { token },
      transports:          ['websocket', 'polling'],
      reconnection:        true,
      reconnectionAttempts: 5,
      reconnectionDelay:   1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
      setConnected(false);
    });

    // ── OTP / verification notifications ────────────────────
    socket.on('notification:new', (data) => {
      console.log('📨 notification:new received', data);
      pushEvent({
        ...data,
        id: data.id || `sock-${Date.now()}-${Math.random()}`,
      });
    });

    // ── Live class started notification ─────────────────────
    socket.on('live_class:started', (data) => {
      console.log('📡 live_class:started received', data);
      pushEvent({
        ...data,
        id: `live-${Date.now()}`,
        type: 'live_class_started',
      });
    });

    return () => {
      socket.off('notification:new');
      socket.off('live_class:started');
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [active, token, pushEvent]);

  /** Emit an event (optional helper for other components) */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { connected, socketEvents, emit };
};

export default useSocket;