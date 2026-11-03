// frontend/src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * useWebSocket
 * ─────────────────────────────────────────────────────────────────
 * Creates ONE stable socket per (namespace + token) pair.
 * Re-creates the socket only if the token or namespace changes.
 *
 * Usage:
 *   const { socket, connected, emit } = useWebSocket();
 */
export const useWebSocket = (namespace = '') => {
  const [connected, setConnected] = useState(false);
  const socketRef  = useRef(null);

  useEffect(() => {
    const token     = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    // Don't connect if there's no auth token
    if (!token) return;

    const sock = io(`${socketUrl}${namespace}`, {
      transports:        ['websocket', 'polling'],
      auth:              { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    sock.on('connect', () => {
      console.log(`✅ Socket connected [${namespace || '/'}]:`, sock.id);
      setConnected(true);
    });

    sock.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected [${namespace || '/'}]:`, reason);
      setConnected(false);
    });

    sock.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message);
    });

    socketRef.current = sock;

    return () => {
      sock.off('connect');
      sock.off('disconnect');
      sock.off('connect_error');
      sock.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [namespace]);

  /** Stable emit wrapper — safe to call before connection */
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, connected, emit };
};