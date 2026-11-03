// frontend/src/services/parents.service.js
// API calls for parent operations — fetching children's data

import API from './api';

const parentsService = {
  // ── Get all children linked to this parent ──────────────────
  getChildren: () =>
    API.get('/parents/children'),

  // ── Get a brief summary for a single child ──────────────────
  getChildSummary: (childId) =>
    API.get(`/parents/children/${childId}/summary`),

  // ── Full dashboard data for a specific child ─────────────────
  getChildDashboard: (childId) =>
    API.get(`/parents/children/${childId}/dashboard`),

  // ── Performance report for a specific child ──────────────────
  getChildPerformance: (childId) =>
    API.get(`/parents/children/${childId}/performance`),

  // ── Pending tasks for a specific child ───────────────────────
  getChildTasks: (childId) =>
    API.get(`/parents/children/${childId}/tasks`),

  // ── Exam results for a specific child ────────────────────────
  getChildExamResults: (childId) =>
    API.get(`/parents/children/${childId}/exam-results`),

  // ── Enrolled courses for a specific child ────────────────────
  getChildCourses: (childId) =>
    API.get(`/parents/children/${childId}/courses`),

  // ── Course details for a specific child + course ─────────────
  getChildCourseDetails: (childId, courseId) =>
    API.get(`/parents/children/${childId}/courses/${courseId}`),

  // ── Books purchased by a specific child ─────────────────────
  getChildBooks: (childId) =>
    API.get(`/parents/children/${childId}/books`),

  // ── Notifications for a specific child ──────────────────────
  getChildNotifications: (childId) =>
    API.get(`/parents/children/${childId}/notifications`),

  // ── Export reports as Excel ───────────────────────────────────
  exportReportsExcel: () =>
    API.get('/parents/reports/export', { responseType: 'blob' }),

  // ── Link a new child to the parent (after OTP verification) ─
  linkChild: (studentUsername) =>
    API.post('/parents/link-child', { studentUsername }),
};

export default parentsService;
