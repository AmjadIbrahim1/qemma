// frontend/src/services/assistant.service.js
// API service for assistant teacher features

import API from './api';

const assistantService = {
  /**
   * Get assistant's own info + linked teacher info
   */
  getInfo: () => API.get('/assistant/info'),

  /**
   * Get all students enrolled in the linked teacher's courses
   */
  getStudents: () => API.get('/assistant/students'),

  /**
   * Get detailed info about a single student
   */
  getStudentDetail: (studentId) => API.get(`/assistant/students/${studentId}`),

  // ── Exam / Attempts ───────────────────────────────────────────────

  /**
   * Get pending exam attempts (with essay questions) that need grading
   */
  getPendingAttempts: (params = {}) =>
    API.get('/attempts', { params: { ...params, status: 'pending', limit: params.limit || 50 } }),

  /**
   * Get a single attempt with full details (exam + questions + student)
   */
  getAttemptDetail: (attemptId) =>
    API.get(`/attempts/${attemptId}`),

  /**
   * Submit essay scores for an attempt (assistant teacher grading)
   */
  gradeEssays: (attemptId, essayScores) =>
    API.post(`/attempts/${attemptId}/assistant-grade`, { essayScores }),
};

export default assistantService;