// frontend/src/services/schedule.service.js

import API from './api';

const scheduleService = {

  // ── إضافة حصة ────────────────────────────────────────────────────────
  create: (data) =>
    API.post('/schedule', {
      title:       data.title,
      courseId:    data.course      || null,
      date:        data.date,
      startTime:   data.startTime,
      endTime:     data.endTime,
      type:        data.type        || 'online',
      meetingLink: data.meetingLink || null,
      description: data.description || null,
      maxStudents: data.maxStudents  || null,
    }),

  // ── جلب كل حصص المدرس ────────────────────────────────────────────────
  getAll: (upcoming = false) =>
    API.get('/schedule', { params: { upcoming } }),

  // ── الحصص القادمة هذا الأسبوع ────────────────────────────────────────
  getUpcoming: () => API.get('/schedule/upcoming'),

  // ── تعديل حصة ────────────────────────────────────────────────────────
  update: (id, data) => API.put(`/schedule/${id}`, data),

  // ── حذف حصة ──────────────────────────────────────────────────────────
  remove: (id) => API.delete(`/schedule/${id}`),
};

export default scheduleService;