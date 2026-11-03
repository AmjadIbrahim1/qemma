// frontend/src/services/chat.service.js

import API from './api';

export const ChatService = {
  // ── Sessions ──────────────────────────────────────────────────
  getSessions: () => API.get('/chat/sessions'),

  // Student creates/opens a session for a specific course
  // courseId is REQUIRED — enforces per-course chat separation
  createSession: ({ teacherUserId, courseId, sessionType = 'teacher_support' }) =>
    API.post('/chat/sessions', { teacherUserId, courseId, sessionType }),

  // ── Teacher/Assistant: open chat with a student in a specific course ──
  openSessionWithStudent: (studentUserId, courseId) =>
    API.post('/chat/teacher/open-session', { studentUserId, courseId }),

  // ── Messages ──────────────────────────────────────────────────
  getMessages: (sessionId) => API.get(`/chat/sessions/${sessionId}/messages`),

  sendMessage: (sessionId, message) =>
    API.post(`/chat/sessions/${sessionId}/messages`, { message }),

  // ── Teacher Chat Management ───────────────────────────────────
  getTeacherStudents: () => API.get('/chat/teacher/students'),

  getTeacherCourses: () => API.get('/chat/teacher/courses'),

  getStudentsByCourse: (courseId) =>
    API.get(`/chat/teacher/courses/${courseId}/students`),
};

export default ChatService;