// frontend/src/utils/normalizeApiResponse.js
// Centralised mapping logic for backend API response fields → frontend-friendly structures.

/**
 * Safely extract the payload from an API response, supporting both
 * `res.data.data` and `res.data` response shapes.
 *
 * @param {object} response - Axios response object (res)
 * @param {object} fallback - Fallback value if payload is null/undefined
 * @returns {object|array}
 */
export const extractPayload = (response, fallback = {}) =>
  response?.data?.data ?? response?.data ?? fallback;

/**
 * Normalise a single child object from the `getChildren` endpoint.
 *
 * @param {object} child - Raw child from API
 * @returns {object}
 */
export const normalizeChild = (child) => {
  if (!child) return {};
  return {
    id: child._id || child.id,
    name: child.name || '',
    avatar: child.avatar || child.profileImage || (child.name ? child.name.charAt(0) : ''),
    grade: child.grade || child.gradeLevel || child.stream || '',
    averageGrade:
      Number(child.averageGrade) ||
      child.dashboard?.averageGrade ||
      child.kpis?.find(k => k.type === 'avgGrade' || k.type === 'averageGrade')?.value ||
      0,
    attendance:
      Number(child.attendance) ||
      child.dashboard?.attendance ||
      child.kpis?.find(k => k.type === 'attendance')?.value ||
      0,
    totalCourses:
      Number(child.totalCourses) ||
      child.dashboard?.totalCourses ||
      child.enrolledCourses?.length ||
      child.stats?.totalEnrolled ||
      0,
    pendingAssignments:
      Number(child.pendingAssignments) ||
      child.dashboard?.pendingAssignments ||
      child.tasks?.pendingAssignments?.length ||
      (Array.isArray(child.tasks) ? child.tasks.filter(t => t.type === 'assignment' && !t.completed).length : 0) ||
      0,
    behaviorAlerts:
      Number(child.behaviorAlerts) ||
      child.dashboard?.behaviorAlerts ||
      child.alerts?.length ||
      (child.alerts ? child.alerts.filter(a => a.urgency === 'high').length : 0) ||
      0,
    tasks: Array.isArray(child.tasks) ? child.tasks : child.tasks?.pendingAssignments || [],
    kpis: Array.isArray(child.kpis) ? child.kpis : [],
    alerts: Array.isArray(child.alerts) ? child.alerts : [],
    notifications: Array.isArray(child.notifications) ? child.notifications : [],
    enrolledCourses: Array.isArray(child.enrolledCourses) ? child.enrolledCourses : [],
    stats: child.stats || {},
    dashboard: child.dashboard || {},
  };
};

/**
 * Normalise a single task object.
 *
 * @param {object} task - Raw task from API
 * @returns {object}
 */
export const normalizeTask = (task) => {
  if (!task) return {};
  return {
    id: task._id || task.id,
    title: task.title || task.name || 'Untitled Task',
    status: task.status || 'pending',
    dueDate: task.dueDate || task.deadline || null,
    score: task.score || 0,
    type: task.type || 'assignment',
    completed: task.completed || false,
    course: task.courseName || task.course || '',
    maxScore: task.maxScore || 100,
    submission: task.submission || null,
  };
};

/**
 * Normalise an array of tasks.
 *
 * @param {array} tasks
 * @returns {array}
 */
export const normalizeTasks = (tasks) =>
  (Array.isArray(tasks) ? tasks : []).map(normalizeTask);

/**
 * Normalise a single KPI object.
 *
 * @param {object} kpi - Raw KPI from API
 * @returns {object}
 */
export const normalizeKpi = (kpi) => {
  if (!kpi) return {};
  return {
    type: kpi.type || kpi.key || kpi.metric || '',
    value: Number(kpi.value) || Number(kpi.score) || 0,
    label: kpi.label || kpi.name || '',
  };
};

/**
 * Normalise an array of KPIs.
 *
 * @param {array} kpis
 * @returns {array}
 */
export const normalizeKpis = (kpis) =>
  (Array.isArray(kpis) ? kpis : []).map(normalizeKpi);

/**
 * Normalise a single notification object.
 *
 * @param {object} notification - Raw notification from API
 * @returns {object}
 */
export const normalizeNotification = (notification) => {
  if (!notification) return {};
  return {
    id: notification._id || notification.id,
    title: notification.title || '',
    body: notification.body || '',
    type: notification.type || 'general',
    isRead: notification.isRead || notification.read || false,
    time: notification.createdAt || notification.time || null,
    createdAt: notification.createdAt || notification.time || null,
    data: notification.data || {},
  };
};

/**
 * Normalise an array of notifications.
 *
 * @param {array} notifications
 * @returns {array}
 */
export const normalizeNotifications = (notifications) =>
  (Array.isArray(notifications) ? notifications : []).map(normalizeNotification);

/**
 * Safe number parsing helper.
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Safely format a numeric value as a percentage string.
 * Returns a user-friendly fallback text instead of 'NaN%' or 'undefined%'.
 *
 * @param {any} value - Raw value to format
 * @param {string} fallback - Fallback text when value is invalid (Arabic)
 * @returns {string}
 */
export const safePercentage = (value, fallback = 'غير متاح') => {
  const num = Number(value);
  return Number.isFinite(num) ? `${Math.round(num)}%` : fallback;
};

/**
 * Safely produce a numeric progress value (0-100) for MUI LinearProgress.
 * Ensures NaN, Infinity, or negative values never reach the progress bar.
 *
 * @param {any} value
 * @returns {number} 0..100
 */
export const safeProgressValue = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, num));
};

// ── Arabic fallback constants for percentages ──
export const FALLBACKS = {
  noData: 'غير متاح',
  notCalculated: 'لم يحسب بعد',
  noScore: 'لا توجد درجة',
  pending: 'معلق',
};
