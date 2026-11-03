// frontend/src/data/contestData.js - Contest System Data

// Contest Difficulty Levels
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// Contest Schedule Configuration
export const CONTEST_SCHEDULE = {
  HARD: [1, 5, 18, 21],      // Days for hard contests
  MEDIUM: [7, 10, 24, 28],   // Days for medium contests
  EASY: [15, 20]             // Days for easy contests (AI-generated)
};

// Student Levels - Grade 3 Only
export const STUDENT_LEVELS = {
  GRADE_3: 'الصف الثالث الثانوي'
};

// Grade 3 Specializations
export const GRADE_3_SPECIALIZATIONS = {
  SCIENCE_MATH: 'علمي رياضة',
  SCIENCE_SCIENCE: 'علمي علوم',
  LITERARY: 'أدبي'
};

// Generate contest schedule for current month
const generateMonthlyContests = () => {
  const contests = [];
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Helper to create contest date
  const createContestDate = (day) => {
    return new Date(year, month, day, 18, 0, 0); // 6 PM
  };
  
  // Hard contests - Grade 3
  CONTEST_SCHEDULE.HARD.forEach((day, index) => {
    contests.push({
      id: `hard-${day}`,
      title: `تحدي صعب #${index + 1}`,
      difficulty: DIFFICULTY_LEVELS.HARD,
      date: createContestDate(day),
      duration: 180, // minutes
      level: STUDENT_LEVELS.GRADE_3,
      questionCount: 5,
      participants: Math.floor(Math.random() * 100) + 50,
      status: createContestDate(day) < new Date() ? 'completed' : 'upcoming'
    });
  });
  
  // Medium contests - Grade 3
  CONTEST_SCHEDULE.MEDIUM.forEach((day, index) => {
    contests.push({
      id: `medium-${day}`,
      title: `تحدي متوسط #${index + 1}`,
      difficulty: DIFFICULTY_LEVELS.MEDIUM,
      date: createContestDate(day),
      duration: 120,
      level: STUDENT_LEVELS.GRADE_3,
      questionCount: 4,
      participants: Math.floor(Math.random() * 150) + 80,
      status: createContestDate(day) < new Date() ? 'completed' : 'upcoming'
    });
  });
  
  // Easy contests (AI-generated) - Grade 3
  CONTEST_SCHEDULE.EASY.forEach((day, index) => {
    contests.push({
      id: `easy-${day}`,
      title: `تحدي سهل #${index + 1}`,
      difficulty: DIFFICULTY_LEVELS.EASY,
      date: createContestDate(day),
      duration: 90,
      level: STUDENT_LEVELS.GRADE_3,
      questionCount: 3,
      participants: Math.floor(Math.random() * 200) + 100,
      status: createContestDate(day) < new Date() ? 'completed' : 'upcoming',
      aiGenerated: true
    });
  });
  
  return contests.sort((a, b) => a.date - b.date);
};

// All contests
export const contestsData = generateMonthlyContests();

// Student contest history (dummy data)
export const studentContestHistory = [
  {
    id: 1,
    contestId: 'hard-1',
    contestName: 'تحدي صعب #1',
    date: '2025-01-01',
    difficulty: DIFFICULTY_LEVELS.HARD,
    rank: 15,
    totalParticipants: 120,
    score: 85,
    ratingChange: +45,
    newRating: 1545,
    solvedProblems: 4,
    totalProblems: 5,
    duration: '2:45:30'
  },
  {
    id: 2,
    contestId: 'hard-5',
    contestName: 'تحدي صعب #2',
    date: '2025-01-05',
    difficulty: DIFFICULTY_LEVELS.HARD,
    rank: 8,
    totalParticipants: 135,
    score: 92,
    ratingChange: +62,
    newRating: 1607,
    solvedProblems: 5,
    totalProblems: 5,
    duration: '2:15:20'
  },
  {
    id: 3,
    contestId: 'medium-7',
    contestName: 'تحدي متوسط #1',
    date: '2025-01-07',
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    rank: 23,
    totalParticipants: 180,
    score: 78,
    ratingChange: -18,
    newRating: 1589,
    solvedProblems: 3,
    totalProblems: 4,
    duration: '1:55:45'
  },
  {
    id: 4,
    contestId: 'medium-10',
    contestName: 'تحدي متوسط #2',
    date: '2025-01-10',
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    rank: 12,
    totalParticipants: 165,
    score: 88,
    ratingChange: +38,
    newRating: 1627,
    solvedProblems: 4,
    totalProblems: 4,
    duration: '1:42:10'
  },
  {
    id: 5,
    contestId: 'easy-15',
    contestName: 'تحدي سهل #1',
    date: '2025-01-15',
    difficulty: DIFFICULTY_LEVELS.EASY,
    rank: 5,
    totalParticipants: 250,
    score: 95,
    ratingChange: +28,
    newRating: 1655,
    solvedProblems: 3,
    totalProblems: 3,
    duration: '1:20:30'
  }
];

// Rating history for graph (Codeforces-style)
export const ratingHistory = [
  { date: '2024-12-01', rating: 1400, contestName: 'مسابقة ديسمبر #1' },
  { date: '2024-12-08', rating: 1435, contestName: 'مسابقة ديسمبر #2' },
  { date: '2024-12-15', rating: 1412, contestName: 'مسابقة ديسمبر #3' },
  { date: '2024-12-22', rating: 1468, contestName: 'مسابقة ديسمبر #4' },
  { date: '2024-12-29', rating: 1500, contestName: 'مسابقة ديسمبر #5' },
  { date: '2025-01-01', rating: 1545, contestName: 'تحدي صعب #1' },
  { date: '2025-01-05', rating: 1607, contestName: 'تحدي صعب #2' },
  { date: '2025-01-07', rating: 1589, contestName: 'تحدي متوسط #1' },
  { date: '2025-01-10', rating: 1627, contestName: 'تحدي متوسط #2' },
  { date: '2025-01-15', rating: 1655, contestName: 'تحدي سهل #1' }
];

// Top 10 students by specialization (Grade 3)
export const topStudentsBySpecialization = {
  [GRADE_3_SPECIALIZATIONS.SCIENCE_MATH]: [
    { id: 1, name: 'عبدالرحمن طه', rating: 2050, avatar: '🥇', school: 'مدرسة النخبة', contestsParticipated: 65, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 2, name: 'مصطفى جمال', rating: 2020, avatar: '🥈', school: 'مدرسة الأوائل', contestsParticipated: 62, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 3, name: 'أدهم نبيل', rating: 1995, avatar: '🥉', school: 'مدرسة الاجتهاد', contestsParticipated: 60, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 4, name: 'حازم فوزي', rating: 1970, avatar: '👨‍🎓', school: 'مدرسة البطولة', contestsParticipated: 58, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 5, name: 'شريف ماجد', rating: 1950, avatar: '👨‍🎓', school: 'مدرسة الطموح', contestsParticipated: 56, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 6, name: 'كريم محمود', rating: 1935, avatar: '👨‍🎓', school: 'مدرسة الأمل', contestsParticipated: 54, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 7, name: 'يوسف إبراهيم', rating: 1920, avatar: '👨‍🎓', school: 'مدرسة السلام', contestsParticipated: 52, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 8, name: 'أحمد صلاح', rating: 1905, avatar: '👨‍🎓', school: 'مدرسة النهضة', contestsParticipated: 51, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 9, name: 'محمد أحمد', rating: 1890, avatar: '👨‍🎓', school: 'مدرسة النيل', contestsParticipated: 49, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH },
    { id: 10, name: 'عمر خالد', rating: 1875, avatar: '👨‍🎓', school: 'مدرسة المستقبل', contestsParticipated: 48, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH }
  ],
  [GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE]: [
    { id: 11, name: 'إسراء حامد', rating: 2030, avatar: '🥇', school: 'مدرسة المتفوقين', contestsParticipated: 64, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 12, name: 'آية رضا', rating: 2000, avatar: '🥈', school: 'مدرسة التقدم', contestsParticipated: 61, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 13, name: 'منة الله', rating: 1980, avatar: '🥉', school: 'مدرسة النجوم', contestsParticipated: 59, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 14, name: 'ندى ياسر', rating: 1960, avatar: '👩‍🎓', school: 'مدرسة الإنجاز', contestsParticipated: 57, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 15, name: 'هبة صبري', rating: 1940, avatar: '👩‍🎓', school: 'مدرسة السباق', contestsParticipated: 55, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 16, name: 'فاطمة حسن', rating: 1925, avatar: '👩‍🎓', school: 'مدرسة الأندلس', contestsParticipated: 53, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 17, name: 'ليلى سعيد', rating: 1910, avatar: '👩‍🎓', school: 'مدرسة الفجر', contestsParticipated: 51, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 18, name: 'سارة علي', rating: 1895, avatar: '👩‍🎓', school: 'مدرسة الحرية', contestsParticipated: 50, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 19, name: 'مريم عبدالله', rating: 1880, avatar: '👩‍🎓', school: 'مدرسة الوحدة', contestsParticipated: 48, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE },
    { id: 20, name: 'هدى أحمد', rating: 1865, avatar: '👩‍🎓', school: 'مدرسة العلوم', contestsParticipated: 47, specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_SCIENCE }
  ],
  [GRADE_3_SPECIALIZATIONS.LITERARY]: [
    { id: 21, name: 'نور الدين', rating: 1990, avatar: '🥇', school: 'مدرسة النصر', contestsParticipated: 63, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 22, name: 'ياسمين فهمي', rating: 1970, avatar: '🥈', school: 'مدرسة الإبداع', contestsParticipated: 60, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 23, name: 'حسام الدين', rating: 1950, avatar: '🥉', school: 'مدرسة التميز', contestsParticipated: 58, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 24, name: 'رنا محمود', rating: 1930, avatar: '👩‍🎓', school: 'مدرسة القمة', contestsParticipated: 56, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 25, name: 'زياد عادل', rating: 1915, avatar: '👨‍🎓', school: 'مدرسة النجاح', contestsParticipated: 54, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 26, name: 'دينا سمير', rating: 1900, avatar: '👩‍🎓', school: 'مدرسة الفائزين', contestsParticipated: 52, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 27, name: 'معاذ كمال', rating: 1885, avatar: '👨‍🎓', school: 'مدرسة الرواد', contestsParticipated: 51, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 28, name: 'شيماء وليد', rating: 1870, avatar: '👩‍🎓', school: 'مدرسة المبدعين', contestsParticipated: 49, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 29, name: 'علي محمد', rating: 1855, avatar: '👨‍🎓', school: 'مدرسة التفوق', contestsParticipated: 48, specialization: GRADE_3_SPECIALIZATIONS.LITERARY },
    { id: 30, name: 'طارق سالم', rating: 1840, avatar: '👨‍🎓', school: 'مدرسة الرياضيات', contestsParticipated: 46, specialization: GRADE_3_SPECIALIZATIONS.LITERARY }
  ]
};

// Keep old format for backward compatibility
export const topStudentsByLevel = {
  [STUDENT_LEVELS.GRADE_3]: topStudentsBySpecialization[GRADE_3_SPECIALIZATIONS.SCIENCE_MATH]
};

// Teacher's assigned contests
export const teacherAssignedContests = [
  {
    id: 'hard-18',
    title: 'تحدي صعب #3',
    difficulty: DIFFICULTY_LEVELS.HARD,
    date: new Date(2025, 0, 18, 18, 0, 0),
    level: STUDENT_LEVELS.GRADE_3,
    status: 'assigned',
    questionsSubmitted: 2,
    questionsRequired: 5,
    canEdit: true
  },
  {
    id: 'medium-24',
    title: 'تحدي متوسط #3',
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    date: new Date(2025, 0, 24, 18, 0, 0),
    level: STUDENT_LEVELS.GRADE_3,
    status: 'assigned',
    questionsSubmitted: 0,
    questionsRequired: 4,
    canEdit: true
  }
];

// Teacher's past contests
export const teacherPastContests = [
  {
    id: 'hard-1',
    title: 'تحدي صعب #1',
    difficulty: DIFFICULTY_LEVELS.HARD,
    date: new Date(2025, 0, 1, 18, 0, 0),
    level: STUDENT_LEVELS.GRADE_3,
    status: 'completed',
    participants: 120,
    questionsContributed: 3,
    averageScore: 72
  },
  {
    id: 'hard-5',
    title: 'تحدي صعب #2',
    difficulty: DIFFICULTY_LEVELS.HARD,
    date: new Date(2025, 0, 5, 18, 0, 0),
    level: STUDENT_LEVELS.GRADE_3,
    status: 'completed',
    participants: 135,
    questionsContributed: 2,
    averageScore: 68
  }
];

// Sample contest questions (for teacher to add)
export const contestQuestions = [
  {
    id: 1,
    contestId: 'hard-18',
    title: 'المجموعات المتتالية',
    description: 'أوجد عدد المجموعات الجزئية المتتالية من المصفوفة التي مجموعها يساوي عدد معطى',
    difficulty: DIFFICULTY_LEVELS.HARD,
    points: 100,
    testCases: 10,
    timeLimit: 2000, // ms
    memoryLimit: 256, // MB
    submittedBy: 'أستاذ محمد',
    submittedAt: '2025-01-16',
    specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH
  },
  {
    id: 2,
    contestId: 'hard-18',
    title: 'أقصر مسار في شجرة',
    description: 'أوجد أقصر مسار بين عقدتين في شجرة موزونة',
    difficulty: DIFFICULTY_LEVELS.HARD,
    points: 150,
    testCases: 15,
    timeLimit: 3000,
    memoryLimit: 512,
    submittedBy: 'أستاذ أحمد',
    submittedAt: '2025-01-17',
    specialization: GRADE_3_SPECIALIZATIONS.SCIENCE_MATH
  }
];

// Current active/upcoming contest for landing page
export const getCurrentContest = () => {
  const now = new Date();
  const upcoming = contestsData.filter(c => c.date > now).sort((a, b) => a.date - b.date);
  return upcoming.length > 0 ? upcoming[0] : null;
};

// Get difficulty color
export const getDifficultyColor = (difficulty) => {
  const colors = {
    [DIFFICULTY_LEVELS.EASY]: {
      bg: '#dcfce7',
      text: '#166534',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      border: '#86efac'
    },
    [DIFFICULTY_LEVELS.MEDIUM]: {
      bg: '#fef3c7',
      text: '#92400e',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      border: '#fde68a'
    },
    [DIFFICULTY_LEVELS.HARD]: {
      bg: '#fee2e2',
      text: '#991b1b',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      border: '#fca5a5'
    }
  };
  return colors[difficulty] || colors[DIFFICULTY_LEVELS.EASY];
};

// Get difficulty label in Arabic
export const getDifficultyLabel = (difficulty) => {
  const labels = {
    [DIFFICULTY_LEVELS.EASY]: 'سهل',
    [DIFFICULTY_LEVELS.MEDIUM]: 'متوسط',
    [DIFFICULTY_LEVELS.HARD]: 'صعب'
  };
  return labels[difficulty] || 'غير محدد';
};

// Get rating color (Codeforces-style)
export const getRatingColor = (rating) => {
  if (rating >= 2000) return { color: '#ff0000', title: 'أحمر', rank: 'خبير دولي' };
  if (rating >= 1800) return { color: '#ff8c00', title: 'برتقالي', rank: 'خبير' };
  if (rating >= 1600) return { color: '#aa00aa', title: 'بنفسجي', rank: 'متقدم' };
  if (rating >= 1400) return { color: '#0000ff', title: 'أزرق', rank: 'متمكن' };
  if (rating >= 1200) return { color: '#03a89e', title: 'سماوي', rank: 'مبتدئ متقدم' };
  return { color: '#808080', title: 'رمادي', rank: 'مبتدئ' };
};

export default {
  DIFFICULTY_LEVELS,
  CONTEST_SCHEDULE,
  STUDENT_LEVELS,
  GRADE_3_SPECIALIZATIONS,
  contestsData,
  studentContestHistory,
  ratingHistory,
  topStudentsByLevel,
  topStudentsBySpecialization,
  teacherAssignedContests,
  teacherPastContests,
  contestQuestions,
  getCurrentContest,
  getDifficultyColor,
  getDifficultyLabel,
  getRatingColor
};