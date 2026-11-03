// frontend/src/services/liveClasses.service.js

import API from './api';

const liveClassesService = {

  // ── إنشاء غرفة جديدة ─────────────────────────────────────────────────
  createRoom: (data) => API.post('/live-classes', {
    courseId:          data.courseId          || null,
    title:             data.title,
    description:       data.description       || '',
    maxCapacity:       data.maxCapacity       || 100,
    scheduledTime:     data.scheduledTime     || null,
    enableChat:        data.enableChat        ?? true,
    enableScreenShare: data.enableScreenShare ?? true,
    recordSession:     data.recordSession     ?? false,
    waitingRoom:       data.waitingRoom       ?? false,
  }),

  // ── بدء غرفة (تنشيط) ───────────────────────────────────────────────────
  startRoom: (roomId) => API.patch(`/live-classes/${roomId}/start`),

  // ── إنهاء غرفة ────────────────────────────────────────────────────────
  endRoom: (roomId, data = {}) => API.patch(`/live-classes/${roomId}/end`, data),

  // ── الغرفة النشطة ─────────────────────────────────────────────────────
  getActiveRoom: () => API.get('/live-classes/active'),

  // ── كل غرف المدرس ────────────────────────────────────────────────────
  getTeacherRooms: (page = 1, limit = 10) =>
    API.get('/live-classes', { params: { page, limit } }),

  // ── إحصائيات الغرف ───────────────────────────────────────────────────
  getRoomStats: () => API.get('/live-classes/stats'),

  // ── كورسات المدرس (للاختيار عند إنشاء غرفة) ─────────────────────────
  getTeacherCourses: () => API.get('/live-classes/courses'),

  // ── إحصائيات الـ Dashboard ────────────────────────────────────────────
  getDashboardStats: () => API.get('/live-classes/dashboard-stats'),

  // ── انضمام طالب عبر كود ──────────────────────────────────────────────
  joinByCode: (code) => API.get(`/live-classes/join/${code}`),

  // ── جلب غرفة بالاسم ──────────────────────────────────────────────────
  getRoomByName: (roomName) => API.get(`/live-classes/room/${roomName}`),

  // ── إلغاء غرفة مجدولة ────────────────────────────────────────────────
  cancelRoom: (roomId) => API.delete(`/live-classes/${roomId}`),
};

export default liveClassesService;