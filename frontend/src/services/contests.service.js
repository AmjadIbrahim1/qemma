// frontend/src/services/contests.service.js
// ✅ NEW (contests feature): Contest API methods. Mirrors exams.service.js shape (per-resource service object).
// Teacher endpoints (add questions) + student endpoints (participation).

import API from './api';

const contestsService = {
  // ── PUBLIC — landing page ─────────────────────────────────────

  // ✅ NEW: Get the next upcoming/active contest (public, no auth required)
  getNextContest: () =>
    API.get('/contests/next'),

  // ── TEACHER — question management ──────────────────────────────

  // List upcoming contests the teacher is authorized to add questions to
  getTeacherContests: () =>
    API.get('/contests/teacher'),

  // ✅ NEW: List ended contests the teacher is authorized to see (history)
  getTeacherPastContests: () =>
    API.get('/contests/teacher/history'),

  // Get one contest (with questions + correct options)
  getContest: (contestId) =>
    API.get(`/contests/${contestId}`),

  // List questions for a contest (teacher view, with isCorrect)
  getContestQuestions: (contestId) =>
    API.get(`/contests/${contestId}/questions`),

  // Add one MCQ question { text, pointValue, options:[{text,isCorrect}] }
  addContestQuestion: (contestId, data) =>
    API.post(`/contests/${contestId}/questions`, data),

  // Delete a question (before contest starts)
  deleteContestQuestion: (contestId, questionId) =>
    API.delete(`/contests/${contestId}/questions/${questionId}`),

  // ── STUDENT — participation ────────────────────────────────────

  // List available contests (stream + 3rd-year + active window)
  getAvailableContests: () =>
    API.get('/contests/available'),

  // ✅ NEW: Student contest dashboard aggregates (stats + rating history + per-contest rows)
  getDashboard: () =>
    API.get('/contests/dashboard'),

  // ✅ NEW: List contests the student participated in that have ended (history)
  getMyHistory: () =>
    API.get('/contests/my-history'),

  // Start / resume a participation → returns questions (no isCorrect) + answeredQuestionIds
  startContest: (contestId) =>
    API.post(`/contests/${contestId}/start`),

  // Per-question submit { selectedOptionId } → records answer (no feedback)
  submitQuestionAnswer: (contestId, questionId, selectedOptionId) =>
    API.post(`/contests/${contestId}/questions/${questionId}/submit`, { selectedOptionId }),

  // Final whole-contest submission
  submitContest: (contestId) =>
    API.post(`/contests/${contestId}/submit`),

  // Get current participation (for resume)
  getMyParticipation: (contestId) =>
    API.get(`/contests/${contestId}/participation`),
};

export default contestsService;
