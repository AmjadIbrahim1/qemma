// frontend/src/services/assignments.service.js

import API from './api';

const assignmentsService = {
  // ── Teacher ────────────────────────────────────────────────────

  /** Get teacher's courses for dropdown */
  getTeacherCourses: () =>
    API.get('/assignments/teacher/courses'),

  /** Get lessons for a specific course */
  getCourseLessons: (courseId) =>
    API.get(`/assignments/teacher/courses/${courseId}/lessons`),

  /** Create a new assignment */
  createAssignment: (data) =>
    API.post('/assignments', data),

  /** Get all assignments for a teacher (optionally filtered by courseId) */
  getTeacherAssignments: (courseId) =>
    API.get('/assignments/teacher', { params: { courseId } }),

  /** Get single assignment with all student submissions */
  getAssignmentDetail: (assignmentId) =>
    API.get(`/assignments/teacher/${assignmentId}`),

  /** Grade a student submission */
  gradeSubmission: (submissionId, data) =>
    API.patch(`/assignments/submissions/${submissionId}/grade`, data),

  // ── Student ────────────────────────────────────────────────────

  /** Get all assignments for the logged-in student */
  getStudentAssignments: () =>
    API.get('/assignments/student'),

  /** Submit an assignment with file upload */
  submitAssignment: (assignmentId, formData, onProgress) =>
    API.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
};

export default assignmentsService;
