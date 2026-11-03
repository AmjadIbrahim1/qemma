// frontend/src/data/landingData.js
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';

// Navigation Links
export const NAV_LINKS = [
  { label: 'الرئيسية', href: '/' },
  { label: 'المميزات', href: '#features' },
  { label: 'المواد الدراسية', href: '#courses' },
  { label: 'أوائل قِمّة', href: '#top-students' },
  { label: 'من نحن', href: '#about' },
];

// Features Section
export const FEATURES = [
  {
    icon: <SchoolRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'شرح بسيط وواضح',
    desc: 'نقدم محتوى تعليمي بسيط وسهل الفهم يساعدك على استيعاب المواد بكل سهولة.',
  },
  {
    icon: <TrendingUpRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'متابعة مستمرة',
    desc: 'نظام متابعة شامل يرصد تقدمك ويعطيك تقارير دورية عن أدائك.',
  },
  {
    icon: <EmojiEventsRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'نظام Gamification',
    desc: 'اكسب نقاط وجوائز مع كل إنجاز، واستمتع بتجربة تعليمية ممتعة.',
  },
  {
    icon: <PsychologyRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'AI لتحديد نقاط الضعف',
    desc: 'الذكاء الاصطناعي يحلل أداءك ويساعدك على تقوية نقاط ضعفك.',
  },
  {
    icon: <GroupsRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'فصول افتراضية تفاعلية',
    desc: 'تفاعل مباشر مع المدرسين وزملائك في بيئة تعليمية حية.',
  },
  {
    icon: <AnalyticsRoundedIcon sx={{ fontSize: 40 }} />,
    title: 'اختبارات شهرية',
    desc: 'تدريبات واختبارات دورية تضمن لك الاستعداد التام للامتحانات.',
  },
];

// How It Works Steps
export const STEPS = [
  {
    icon: '1️⃣',
    title: 'سجل حسابك',
    desc: 'أنشئ حسابك على المنصة في خطوات بسيطة وابدأ رحلتك التعليمية.',
  },
  {
    icon: '2️⃣',
    title: 'اختر موادك',
    desc: 'اختر المواد التي تناسب قسمك الدراسي وابدأ في التعلم فوراً.',
  },
  {
    icon: '3️⃣',
    title: 'تابع دروسك',
    desc: 'شاهد الفيديوهات التعليمية، وحل التمارين، وتفاعل مع المدرسين.',
  },
  {
    icon: '4️⃣',
    title: 'حسّن نتائجك',
    desc: 'راقب تقدمك، واستفد من التحليلات، وحقق أعلى الدرجات.',
  },
];

// Courses Section
export const COURSES = [
  {
    id: 1,
    title: 'الرياضيات - علمي رياضة',
    teacher: 'أ/ محمد أحمد',
    stream: 'علمي رياضة',
    students: 1520,
    price: '499 جنيه',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=250&fit=crop',
  },
  {
    id: 2,
    title: 'الفيزياء - علمي رياضة',
    teacher: 'د/ سارة محمود',
    stream: 'علمي رياضة',
    students: 1340,
    price: '449 جنيه',
    image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&h=250&fit=crop',
  },
  {
    id: 3,
    title: 'الكيمياء - علمي علوم',
    teacher: 'أ/ خالد حسن',
    stream: 'علمي علوم',
    students: 980,
    price: '399 جنيه',
    image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=250&fit=crop',
  },
  {
    id: 4,
    title: 'الأحياء - علمي علوم',
    teacher: 'د/ نورا إبراهيم',
    stream: 'علمي علوم',
    students: 1125,
    price: '449 جنيه',
    image: 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=400&h=250&fit=crop',
  },
  {
    id: 5,
    title: 'التاريخ - أدبي',
    teacher: 'أ/ أحمد علي',
    stream: 'أدبي',
    students: 765,
    price: '349 جنيه',
    image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400&h=250&fit=crop',
  },
  {
    id: 6,
    title: 'الجغرافيا - أدبي',
    teacher: 'أ/ منى حسين',
    stream: 'أدبي',
    students: 690,
    price: '349 جنيه',
    image: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=400&h=250&fit=crop',
  },
];

// Top Students Data
export const TOP_STUDENTS = {
  sciMath: [
    { name: 'أحمد محمد علي', score: 98.5, stream: 'علمي رياضة' },
    { name: 'سارة حسن إبراهيم', score: 97.8, stream: 'علمي رياضة' },
    { name: 'محمود خالد أحمد', score: 96.9, stream: 'علمي رياضة' },
    { name: 'نور الدين عبد الله', score: 96.2, stream: 'علمي رياضة' },
    { name: 'ياسمين محمد', score: 95.7, stream: 'علمي رياضة' },
    { name: 'عمر صلاح', score: 95.3, stream: 'علمي رياضة' },
    { name: 'هدى أحمد', score: 94.8, stream: 'علمي رياضة' },
    { name: 'كريم حسين', score: 94.5, stream: 'علمي رياضة' },
    { name: 'ملك سعيد', score: 94.1, stream: 'علمي رياضة' },
    { name: 'زياد محمود', score: 93.7, stream: 'علمي رياضة' },
  ],
  sciBio: [
    { name: 'مريم أحمد حسن', score: 99.1, stream: 'علمي علوم' },
    { name: 'عبد الرحمن محمد', score: 98.3, stream: 'علمي علوم' },
    { name: 'فاطمة علي', score: 97.6, stream: 'علمي علوم' },
    { name: 'يوسف إبراهيم', score: 96.9, stream: 'علمي علوم' },
    { name: 'دينا خالد', score: 96.4, stream: 'علمي علوم' },
    { name: 'حسام الدين', score: 95.8, stream: 'علمي علوم' },
    { name: 'سلمى محمود', score: 95.2, stream: 'علمي علوم' },
    { name: 'طارق سعيد', score: 94.9, stream: 'علمي علوم' },
    { name: 'نورهان أحمد', score: 94.5, stream: 'علمي علوم' },
    { name: 'عمرو حسن', score: 94.1, stream: 'علمي علوم' },
  ],
  arts: [
    { name: 'ليلى حسين محمد', score: 97.9, stream: 'أدبي' },
    { name: 'خالد عبد الله', score: 96.8, stream: 'أدبي' },
    { name: 'رنا محمد', score: 96.1, stream: 'أدبي' },
    { name: 'أمير صلاح', score: 95.6, stream: 'أدبي' },
    { name: 'هبة أحمد', score: 95.2, stream: 'أدبي' },
    { name: 'معاذ حسن', score: 94.7, stream: 'أدبي' },
    { name: 'شيماء علي', score: 94.3, stream: 'أدبي' },
    { name: 'باسم محمود', score: 93.9, stream: 'أدبي' },
    { name: 'ندى إبراهيم', score: 93.5, stream: 'أدبي' },
    { name: 'حازم خالد', score: 93.1, stream: 'أدبي' },
  ],
};