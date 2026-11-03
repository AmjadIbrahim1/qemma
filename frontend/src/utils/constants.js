// frontend/src/utils/constants.js
export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ADMIN: 'admin'
};

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed'
};

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const EXAM_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded'
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  STUDENT_DASHBOARD: '/student/dashboard',
  TEACHER_DASHBOARD: '/teacher/dashboard',
  PARENT_DASHBOARD: '/parent/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard'
};

// ✅ NEW: Student academic year options (matches backend StudentYear enum: first/second/third).
// Used in the student registration form. 'third' = 3rd-year (eligible for contest reminders per notification-system.md).
export const YEAR_OPTIONS = [
  { value: 'first',  label: 'الصف الأول الثانوي' },
  { value: 'second', label: 'الصف الثاني الثانوي' },
  { value: 'third',  label: 'الصف الثالث الثانوي' },
];

// ✅ NEW: Arabic display labels for stream values (students: 3; teachers: 5).
export const STREAM_LABELS = {
  'Literary':         'أدبي',
  'Science-Maths':    'علمي رياضة',
  'Science-Biology':  'علمي علوم',
  'general':          'عام',
  'science':          'علوم',
};

// ✅ NEW: subject → stream mapping for TEACHERS only (students pick their stream manually).
// Mirrors backend/src/modules/auth/subject-stream.map.js — keep in sync.
// Teachers do NOT choose a stream; it is derived from the selected subject.
export const SUBJECT_TO_STREAM = {
  'اللغة العربية':   'general',
  'اللغة الإنجليزية': 'general',
  'الجغرافيا':        'Literary',
  'التاريخ':          'Literary',
  'الرياضيات':        'Science-Maths',
  'الإحصاء':          'Science-Maths',
  'الأحياء':          'Science-Biology',
  'الفيزياء':         'science',
  'الكيمياء':         'science',
};

// ✅ NEW: derive a teacher's stream from their selected subject (frontend helper).
// Accepts a single subject string OR array (uses the first mappable subject). Returns '' if none maps.
export const getStreamFromSubject = (subject) => {
  if (!subject) return '';
  const subjects = Array.isArray(subject) ? subject : [subject];
  for (const s of subjects) {
    if (s && SUBJECT_TO_STREAM[s]) return SUBJECT_TO_STREAM[s];
  }
  return '';
};

// ✅ NEW (contests feature): contest streams (3) per planning_prompts.
export const CONTEST_STREAMS = ['Literary', 'Science-Maths', 'Science-Biology'];

// ✅ NEW (contests feature): teacher stream → allowed contest streams mapping.
// Mirrors backend subject-stream.map.js TEACHER_STREAM_TO_CONTEST_STREAMS — keep in sync.
//   - general  → ALL contest streams
//   - science  → Science-Maths + Science-Biology
//   - the other 3 teacher streams map 1-to-1 to their same-named contest stream.
export const TEACHER_STREAM_TO_CONTEST_STREAMS = {
  'general':         ['Literary', 'Science-Maths', 'Science-Biology'],
  'science':         ['Science-Maths', 'Science-Biology'],
  'Literary':        ['Literary'],
  'Science-Maths':   ['Science-Maths'],
  'Science-Biology': ['Science-Biology'],
};

// ✅ NEW: contest difficulty labels (per scoring-system.md: Easy/Medium/Hard, multiplier 1.0/1.5/2.0).
export const CONTEST_DIFFICULTY = {
  Easy:   { label: 'سهل',   multiplier: 1.0, color: '#059669' },
  Medium: { label: 'متوسط', multiplier: 1.5, color: '#f59e0b' },
  Hard:   { label: 'صعب',   multiplier: 2.0, color: '#ef4444' },
};

// ✅ NEW: returns the list of contest streams a teacher with the given stream is allowed to add questions to.
export const getAllowedContestStreams = (teacherStream) => {
  if (!teacherStream) return [];
  return TEACHER_STREAM_TO_CONTEST_STREAMS[teacherStream] || [];
};