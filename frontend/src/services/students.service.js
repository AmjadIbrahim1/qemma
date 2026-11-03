// frontend/src/services/students.service.js

import API from './api';

const studentsService = {
  getDashboard: () =>
    API.get('/students/dashboard'),

  getPerformance: () =>
    API.get('/students/performance'),

  getTasks: () =>
    API.get('/students/tasks'),

  getTopAchievers: () =>
    API.get('/students/top-achievers'),

  analyzePerformance: () =>
    API.post('/students/performance/analyze'),
};

export default studentsService;
