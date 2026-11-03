// data/studentData.js

// ==================== بيانات الطالب ====================
export const studentData = {
  id: 1,
  name: 'أحمد محمد علي',
  firstName: 'أحمد',
  lastName: 'علي',
  email: 'ahmed@student.com',
  phone: '01012345678',
  avatar: 'https://i.pravatar.cc/150?img=11',
  level: 'الصف الثاني الثانوي - علمي رياضة',
  school: 'مدرسة المتفوقين الثانوية',
  joinDate: '15 سبتمبر 2024',
  overallProgress: 72,
  semesterProgress: 68,
  stats: {
    homeworkComplete: 85,
    liveAttendance: 92,
    avgGrade: 88,
    weeklyStudyHours: 14,
    totalStudyHours: 156,
    completedCourses: 2,
    activeCourses: 6,
    totalPoints: 2450,
  },
};

// ==================== الشارات ====================
export const badgesData = [
  { id: 1, label: '⭐ طالب متفوق', earnedDate: '1 ديسمبر 2024' },
  { id: 2, label: '🏆 Top 10%', earnedDate: '15 نوفمبر 2024' },
  { id: 3, label: '🔥 5 أسابيع متتالية', earnedDate: '10 ديسمبر 2024' },
  { id: 4, label: '📚 قارئ نهم', earnedDate: '5 ديسمبر 2024' },
];

// ==================== KPIs ====================
export const kpisData = [
  {
    id: 1,
    type: 'homework',
    value: '85%',
    label: 'إنجاز الواجبات',
    trend: 'up',
    trendValue: '+5%',
  },
  {
    id: 2,
    type: 'attendance',
    value: '92%',
    label: 'حضور الحصص',
    trend: 'up',
    trendValue: '+3%',
  },
  {
    id: 3,
    type: 'grade',
    value: '88',
    label: 'متوسط الدرجات',
    trend: 'up',
    trendValue: '+2',
  },
  {
    id: 4,
    type: 'studyTime',
    value: '14h',
    label: 'ساعات الدراسة',
    trend: 'up',
    trendValue: '+4h',
  },
];

// ==================== التنبيهات العاجلة ====================
export const urgentAlertsData = [
  {
    id: 1,
    type: 'exam',
    title: 'امتحان الرياضيات',
    message: 'يبدأ بعد 45 دقيقة',
    actionLabel: 'ابدأ الآن',
    link: '/exam/1',
    courseId: 1,
  },
  {
    id: 2,
    type: 'assignment',
    title: 'واجب الفيزياء',
    message: 'متأخر بيومين!',
    actionLabel: 'سلّم الآن',
    link: '/assignment/3',
    courseId: 2,
  },
  {
    id: 3,
    type: 'live',
    title: 'حصة الكيمياء المباشرة',
    message: 'تبدأ الآن - 45 طالب منضم',
    actionLabel: 'انضم',
    link: '/live/5',
    courseId: 3,
  },
];

// ==================== المهام القادمة ====================
export const upcomingTasksData = [
  {
    id: 1,
    title: 'حل تمارين الباب الثالث',
    courseId: 1,
    courseName: 'الرياضيات',
    dueDate: 'غداً، 11:59 م',
    dueTimestamp: '2024-12-20T23:59:00',
    completed: false,
    priority: 'high',
  },
  {
    id: 2,
    title: 'تقرير تجربة الكهرباء',
    courseId: 2,
    courseName: 'الفيزياء',
    dueDate: 'بعد يومين',
    dueTimestamp: '2024-12-21T23:59:00',
    completed: false,
    priority: 'medium',
  },
  {
    id: 3,
    title: 'مراجعة المركبات العضوية',
    courseId: 3,
    courseName: 'الكيمياء',
    dueDate: 'الأحد الماضي',
    dueTimestamp: '2024-12-22T23:59:00',
    completed: true,
    priority: 'low',
  },
  {
    id: 4,
    title: 'كتابة Essay عن التكنولوجيا',
    courseId: 4,
    courseName: 'اللغة الإنجليزية',
    dueDate: 'بعد 3 أيام',
    dueTimestamp: '2024-12-22T23:59:00',
    completed: false,
    priority: 'high',
  },
  {
    id: 5,
    title: 'بحث عن الوراثة المندلية',
    courseId: 5,
    courseName: 'الأحياء',
    dueDate: 'الخميس',
    dueTimestamp: '2024-12-26T23:59:00',
    completed: false,
    priority: 'medium',
  },
];

// ==================== نتائج الاختبارات الأخيرة ====================
export const recentExamsData = [
  {
    id: 1,
    title: 'امتحان التفاضل - الباب الأول',
    courseId: 1,
    courseName: 'الرياضيات',
    date: '15 ديسمبر 2024',
    questionsCount: 25,
    duration: '60 دقيقة',
    grade: 92,
    maxGrade: 100,
    rank: 5,
    totalStudents: 156,
  },
  {
    id: 2,
    title: 'اختبار الميكانيكا',
    courseId: 2,
    courseName: 'الفيزياء',
    date: '12 ديسمبر 2024',
    questionsCount: 20,
    duration: '45 دقيقة',
    grade: 85,
    maxGrade: 100,
    rank: 12,
    totalStudents: 134,
  },
  {
    id: 3,
    title: 'امتحان الكيمياء العضوية',
    courseId: 3,
    courseName: 'الكيمياء',
    date: '10 ديسمبر 2024',
    questionsCount: 30,
    duration: '75 دقيقة',
    grade: 78,
    maxGrade: 100,
    rank: 25,
    totalStudents: 98,
  },
  {
    id: 4,
    title: 'اختبار القراءة والفهم',
    courseId: 4,
    courseName: 'اللغة الإنجليزية',
    date: '8 ديسمبر 2024',
    questionsCount: 15,
    duration: '30 دقيقة',
    grade: 88,
    maxGrade: 100,
    rank: 8,
    totalStudents: 178,
  },
];

// ==================== الحصص المباشرة ====================
export const liveSessionsData = [
  {
    id: 1,
    title: 'حل مسائل التفاضل والتكامل',
    teacher: 'أ. محمد أحمد',
    teacherAvatar: null,
    courseId: 1,
    courseName: 'الرياضيات',
    isLive: true,
    participants: 45,
    maxParticipants: 100,
    time: 'الآن',
    startTime: '2024-12-19T18:00:00',
    duration: '90 دقيقة',
  },
  {
    id: 2,
    title: 'مراجعة قوانين نيوتن',
    teacher: 'أ. سارة محمود',
    teacherAvatar: null,
    courseId: 2,
    courseName: 'الفيزياء',
    isLive: false,
    time: 'بعد 30 دقيقة',
    startTime: '2024-12-19T18:30:00',
    duration: '60 دقيقة',
  },
  {
    id: 3,
    title: 'شرح المركبات الأروماتية',
    teacher: 'أ. أحمد سمير',
    teacherAvatar: null,
    courseId: 3,
    courseName: 'الكيمياء',
    isLive: false,
    time: 'غداً، 4:00 م',
    startTime: '2024-12-20T16:00:00',
    duration: '75 دقيقة',
  },
];

// ==================== الإشعارات ====================
export const notificationsData = [
  { id: 1, title: '📢 تم رفع درجات امتحان الرياضيات', time: 'منذ 5 دقائق', unread: true, type: 'grade', link: '/grades' },
  { id: 2, title: '📝 واجب جديد في الفيزياء', time: 'منذ ساعة', unread: true, type: 'assignment', link: '/submit-assignment' },
  { id: 3, title: '🎥 تذكير: حصة الكيمياء بعد ساعتين', time: 'منذ ساعتين', unread: true, type: 'live', link: '/live/3' },
  { id: 4, title: '✅ تم تسليم واجب اللغة الإنجليزية بنجاح', time: 'منذ 3 ساعات', unread: false, type: 'success', link: '/course/4/assignments' },
  { id: 5, title: '🏆 مبروك! حصلت على شارة طالب متفوق', time: 'أمس', unread: false, type: 'badge', link: '/profile/badges' },
  { id: 6, title: '📅 تم تحديث جدول الامتحانات', time: 'أمس', unread: false, type: 'schedule', link: '/schedule' },
  { id: 7, title: '💬 رد جديد على سؤالك في منتدى الرياضيات', time: 'منذ يومين', unread: false, type: 'discussion', link: '/course/1/discussions' },
  { id: 8, title: '📚 تم إضافة مورد جديد في الكيمياء', time: 'منذ 3 أيام', unread: false, type: 'resource', link: '/course/3/resources' },
];

// ==================== نقاط القوة والضعف ====================
export const strengthsData = [
  { id: 1, subject: 'الرياضيات', score: 95, trend: 'up', change: '+3%' },
  { id: 2, subject: 'اللغة العربية', score: 92, trend: 'up', change: '+2%' },
  { id: 3, subject: 'الكيمياء', score: 88, trend: 'stable', change: '0%' },
];

export const weaknessesData = [
  { id: 1, subject: 'اللغة الإنجليزية', score: 72, trend: 'up', change: '+5%', suggestion: 'ننصح بممارسة القراءة يومياً' },
  { id: 2, subject: 'الفيزياء', score: 68, trend: 'down', change: '-2%', suggestion: 'راجع قوانين نيوتن' },
];

// ==================== الإجراءات السريعة ====================
export const quickActionsData = [
  { id: 1, type: 'practice', label: 'ابدأ التمرين', link: '/practice' },
  { id: 2, type: 'submit', label: 'سلّم الواجب', link: '/submit' },
  { id: 3, type: 'live', label: 'انضم للحصة', link: '/live' },
  { id: 4, type: 'assistant', label: 'اسأل المساعد', link: '/assistant' },
  { id: 5, type: 'library', label: 'مكتبة المواد', link: '/library' },
  { id: 6, type: 'report', label: 'تقرير الأداء', link: '/report' },
];

// ==================== بيانات التقويم ====================
export const calendarEventsData = [
  { id: 1, date: '2024-12-20', title: 'امتحان الرياضيات', type: 'exam' },
  { id: 2, date: '2024-12-21', title: 'تسليم واجب الفيزياء', type: 'assignment' },
  { id: 3, date: '2024-12-22', title: 'حصة مباشرة - كيمياء', type: 'live' },
  { id: 4, date: '2024-12-25', title: 'امتحان نهاية الفصل', type: 'exam' },
  { id: 5, date: '2024-12-28', title: 'مشروع الأحياء', type: 'project' },
];

// ==================== بيانات الرسم البياني ====================
export const progressChartData = {
  labels: ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4', 'أسبوع 5', 'أسبوع 6'],
  grades: [75, 80, 78, 85, 82, 88],
  studyHours: [8, 10, 9, 12, 11, 14],
  attendance: [90, 85, 95, 88, 92, 95],
};

// ══════════════════════════════════════════════════════════════════════
// ✅ بيانات صفحة تقرير الأداء (Performance Report Page)
// ══════════════════════════════════════════════════════════════════════

// إحصائيات الأداء الرئيسية
export const performanceStatsData = [
  { id: 1, type: 'avgGrade', label: 'متوسط الدرجات', value: '88%', change: '+5%' },
  { id: 2, type: 'homework', label: 'إنجاز الواجبات', value: '92%', change: '+3%' },
  { id: 3, type: 'attendance', label: 'حضور الحصص', value: '95%', change: '+2%' },
  { id: 4, type: 'studyTime', label: 'ساعات الدراسة', value: '156h', change: '+12h' },
];

// بيانات الترتيب والتصنيف
export const rankingData = {
  classRank: 5,
  totalStudents: 156,
  gradeRank: 23,
  totalGradeStudents: 892,
  percentile: 97,
  previousRank: 8,
};

// أداء المواد الدراسية
export const subjectsPerformanceData = [
  { id: 1, name: 'الرياضيات', grade: 92, classAvg: 75, trend: 'up', trendValue: '+8%', color: '#2563eb' },
  { id: 2, name: 'الفيزياء', grade: 85, classAvg: 72, trend: 'up', trendValue: '+5%', color: '#7c3aed' },
  { id: 3, name: 'الكيمياء', grade: 78, classAvg: 70, trend: 'down', trendValue: '-2%', color: '#059669' },
  { id: 4, name: 'اللغة الإنجليزية', grade: 88, classAvg: 78, trend: 'up', trendValue: '+3%', color: '#f59e0b' },
  { id: 5, name: 'اللغة العربية', grade: 95, classAvg: 80, trend: 'up', trendValue: '+4%', color: '#db2777' },
];

// تقدم الكورسات
export const courseProgressStatsData = {
  completed: 45,
  inProgress: 40,
  notStarted: 15,
};

// تطور الأداء عبر الأسابيع
export const weeklyProgressData = {
  labels: ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4', 'أسبوع 5', 'أسبوع 6', 'أسبوع 7', 'أسبوع 8'],
  studentGrades: [75, 80, 78, 85, 82, 88, 86, 92],
  classAverage: [70, 72, 71, 73, 72, 74, 73, 75],
};

// تحليل نقاط القوة (للأداء التفصيلي)
export const performanceStrengthsData = [
  { id: 1, subject: 'التفاضل والتكامل', topic: 'الرياضيات', score: 94, trend: 'up', trendValue: '+8%' },
  { id: 2, subject: 'الميكانيكا', topic: 'الفيزياء', score: 89, trend: 'up', trendValue: '+5%' },
  { id: 3, subject: 'المعادلات الكيميائية', topic: 'الكيمياء', score: 86, trend: 'up', trendValue: '+2%' },
];

// تحليل نقاط الضعف (للأداء التفصيلي)
export const performanceWeaknessesData = [
  { id: 1, subject: 'الهندسة الفراغية', topic: 'الرياضيات', score: 58, trend: 'up', trendValue: '+12%' },
  { id: 2, subject: 'الكهرومغناطيسية', topic: 'الفيزياء', score: 52, trend: 'down', trendValue: '-2%' },
  { id: 3, subject: 'الكيمياء العضوية', topic: 'الكيمياء', score: 61, trend: 'up', trendValue: '+3%' },
];

// ══════════════════════════════════════════════════════════════════════
// ✅ بيانات إضافية للإحصائيات المتقدمة
// ══════════════════════════════════════════════════════════════════════

// ملخص الأداء الشهري
export const monthlyPerformanceData = {
  currentMonth: {
    avgGrade: 88,
    totalStudyHours: 56,
    completedAssignments: 12,
    attendedSessions: 8,
    quizzesTaken: 5,
  },
  previousMonth: {
    avgGrade: 83,
    totalStudyHours: 48,
    completedAssignments: 10,
    attendedSessions: 7,
    quizzesTaken: 4,
  },
  improvement: {
    grade: '+5%',
    studyHours: '+16.7%',
    assignments: '+20%',
    attendance: '+14.3%',
    quizzes: '+25%',
  },
};

// أهداف الطالب
export const studentGoalsData = [
  { id: 1, title: 'الحصول على 90% في الرياضيات', progress: 92, completed: true, deadline: '2024-12-15' },
  { id: 2, title: 'إكمال 10 ساعات دراسة أسبوعياً', progress: 80, completed: false, deadline: '2024-12-31' },
  { id: 3, title: 'حضور جميع الحصص المباشرة', progress: 95, completed: false, deadline: '2024-12-31' },
  { id: 4, title: 'تحسين درجة الفيزياء بـ 10%', progress: 60, completed: false, deadline: '2025-01-15' },
];

// سجل الإنجازات
export const achievementsData = [
  { id: 1, title: 'أول 100% في اختبار', icon: '🎯', date: '2024-11-20', description: 'حصلت على الدرجة الكاملة في اختبار الجبر' },
  { id: 2, title: 'أسبوع بدون غياب', icon: '📅', date: '2024-12-01', description: 'حضرت جميع الحصص لمدة أسبوع كامل' },
  { id: 3, title: 'Top 5 في الفصل', icon: '🏆', date: '2024-12-10', description: 'وصلت للمركز الخامس على مستوى الفصل' },
  { id: 4, title: '50 ساعة دراسة', icon: '⏱️', date: '2024-12-15', description: 'أكملت 50 ساعة دراسة هذا الشهر' },
];

// توصيات المساعد الذكي
export const aiRecommendationsData = [
  { id: 1, type: 'study', title: 'ركز على الهندسة الفراغية', description: 'تحتاج لمزيد من التمرين في هذا الموضوع', priority: 'high' },
  { id: 2, type: 'schedule', title: 'أفضل وقت للدراسة', description: 'أداؤك أفضل في الفترة المسائية (4-8 م)', priority: 'medium' },
  { id: 3, type: 'resource', title: 'فيديو موصى به', description: 'شاهد شرح الكهرومغناطيسية لتحسين درجتك', priority: 'high' },
  { id: 4, type: 'practice', title: 'تمرين يومي', description: 'حل 5 مسائل رياضيات يومياً للحفاظ على مستواك', priority: 'low' },
];