// frontend/src/services/enrollments.service.js

import API from './api';

const enrollmentsService = {
  getMyEnrollments: () =>
    API.get('/enrollments/my'),

  getCourseDetail: (courseId) =>
    API.get(`/enrollments/my/${courseId}`),

  updateProgress: (courseId, progress) =>
    API.patch(`/enrollments/my/${courseId}/progress`, { progress }),
};

export default enrollmentsService;