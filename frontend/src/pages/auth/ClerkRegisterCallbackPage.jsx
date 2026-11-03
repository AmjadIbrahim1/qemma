// frontend/src/pages/auth/ClerkRegisterCallbackPage.jsx
// ✅ FIX: teacherUsername يُمرر لـ loginWithClerk لضمان ربط المدرس المساعد بالمدرس الرئيسي

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUser, useClerk } from '@clerk/clerk-react';
import API from '../../services/api';
import { YEAR_OPTIONS, STREAM_LABELS, getStreamFromSubject } from '../../utils/constants';   // ✅ NEW: year options + subject→stream mapping
import {
  Container, Box, CircularProgress, Typography, Card, CardContent,
  Button, FormControl, InputLabel, Select, MenuItem, FormHelperText,
  TextField, Alert, AlertTitle, Chip, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  School, Person as PersonIcon, FamilyRestroom, SupervisorAccount,
  WarningAmber, Send, CheckCircle, Search, Smartphone,
  Email as EmailIcon, Login as LoginIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const ClerkRegisterCallbackPage = () => {
  const navigate = useNavigate();
  const { loginWithClerk } = useAuth();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [step,              setStep]             = useState('loading');
  const [selectedRole,      setSelectedRole]     = useState(null);
  const [selectedDivision,  setSelectedDivision] = useState('');
  const [selectedYear,      setSelectedYear]     = useState('');   // ✅ NEW: student academic year (StudentYear enum)
  const [selectedSubject,   setSelectedSubject]  = useState('');
  const [divisionError,     setDivisionError]    = useState('');
  const [yearError,         setYearError]        = useState('');
  const [subjectError,      setSubjectError]     = useState('');
  const [error,             setError]            = useState(null);
  const [isProcessing,      setIsProcessing]     = useState(false);
  const [phone,             setPhone]            = useState('');
  const [phoneError,        setPhoneError]       = useState('');
  const [existingAccountDetected, setExistingAccountDetected] = useState(false);
  const [showExistingAccountDialog, setShowExistingAccountDialog] = useState(false);
  const [debugInfo,         setDebugInfo]        = useState('');

  // Assistant teacher verification
  const [teacherUsername,     setTeacherUsername]    = useState('');
  const [teacherInfo,         setTeacherInfo]        = useState(null);
  const [codeSent,            setCodeSent]           = useState(false);
  const [verificationCode,    setVerificationCode]   = useState('');
  const [verifyLoading,       setVerifyLoading]      = useState(false);
  const [lookupLoading,       setLookupLoading]      = useState(false);
  const [verificationError,   setVerificationError]  = useState('');

  // Parent verification
  const [studentUsername,        setStudentUsername]       = useState('');
  const [studentInfo,            setStudentInfo]           = useState(null);
  const [parentCodeSent,         setParentCodeSent]        = useState(false);
  const [parentCode,             setParentCode]            = useState('');
  const [parentVerifyLoading,    setParentVerifyLoading]   = useState(false);
  const [parentLookupLoading,    setParentLookupLoading]   = useState(false);
  const [parentVerificationError,setParentVerificationError] = useState('');

  const availableSubjects = [
    'اللغة العربية','اللغة الإنجليزية','الفيزياء','الكيمياء',
    'الأحياء','الرياضيات','الجغرافيا','التاريخ','الإحصاء',
  ];

  const GRADE_SECTIONS = {
    first: [
      { value: 'Science', label: 'علمي' },
      { value: 'Literary', label: 'أدبي' },
    ],
    second: [
      { value: 'Science-Biology', label: 'علمي علوم 🧬' },
      { value: 'Science-Maths', label: 'علمي رياضة 🔢' },
      { value: 'Literary', label: 'أدبي 📖' },
    ],
    third: [
      { value: 'Science-Biology', label: 'علمي علوم 🧬' },
      { value: 'Science-Maths', label: 'علمي رياضة 🔢' },
      { value: 'Literary', label: 'أدبي 📖' },
    ],
  };

  const getAvailableSections = () => GRADE_SECTIONS[selectedYear] || [];

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        if (!isLoaded) { setDebugInfo('جاري تحميل بيانات Clerk...'); return; }
        if (!clerkUser) throw new Error('No Clerk user found');

        const existingRole = clerkUser.publicMetadata?.role;

        if (existingRole) {
          setExistingAccountDetected(true);
          toast.error('⚠️ هذا الحساب مسجل بالفعل!', { duration: 4000 });
          setTimeout(async () => {
            await handleLogin(
              clerkUser.id, existingRole,
              clerkUser.publicMetadata?.division || null,
              clerkUser.publicMetadata?.subject  || null,
            );
          }, 3000);
          return;
        }

        const accountAge = Date.now() - clerkUser.createdAt;
        if (accountAge < 120000) {
          setStep('role-selection');
        } else {
          try { await handleLogin(clerkUser.id, 'student'); }
          catch (_) { setStep('role-selection'); }
        }
      } catch (err) {
        setError(err.message || 'فشل تسجيل الدخول');
        setStep('error');
      }
    };
    checkUserStatus();
  }, [clerkUser, isLoaded]);

  const getDashboardRoute = (role) => {
    return role === 'student'             ? '/student/dashboard'
         : role === 'teacher'           ? '/teacher/dashboard'
         : role === 'assistant_teacher' ? '/assistant-teacher/dashboard'
         : role === 'parent'            ? '/parent/dashboard'
         : '/student/dashboard';
  };

  const doRedirect = useCallback((role) => {
    navigate(getDashboardRoute(role), { replace: true });
  }, [navigate]);

  const handleLogin = async (clerkUserId, role = 'student', division = null, subject = null, teacherName = null, studentUsername = null, year = null, stream = null, phone = null) => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setStep('processing');

      try {
        const metadata = { role };
        if (division) metadata.division = division;
        if (subject)  metadata.subject  = subject;
        if (year)     metadata.year     = year;
        if (stream)   metadata.stream   = stream;
        await clerkUser.update({ publicMetadata: metadata });
      } catch (_) {}

      await loginWithClerk(clerkUserId, role, division, subject, teacherName, studentUsername, year, stream, phone);
      toast.success('تم إنشاء الحساب بنجاح! 🎉');
      doRedirect(role);
    } catch (err) {
      const isPhoneDuplicate =
        err.response?.status === 400 &&
        (err.response?.data?.message?.includes('رقم الهاتف') ||
         err.response?.data?.message?.includes('phone'));

      if (isPhoneDuplicate) {
        setPhoneError('رقم الهاتف مستخدم بالفعل، يرجى إدخال رقم آخر');
        setIsProcessing(false);
        setStep(
          role === 'student'             ? 'division-selection'
          : role === 'parent'            ? 'verify-parent'
          : role === 'assistant_teacher' ? 'verify-assistant'
          : 'subject-selection'
        );
        return;
      }

      const isExistingAccount =
        err.response?.data?.existingAccount === true ||
        err.response?.status === 409 ||
        err.message?.includes('already exists') ||
        err.message?.includes('موجود');

      if (isExistingAccount && err.response?.data?.existingAccount) {
        setIsProcessing(false);
        setShowExistingAccountDialog(true);
        return;
      }

      if (isExistingAccount) {
        toast.error('⚠️ الحساب مسجل بالفعل! جاري التحويل...', { duration: 4000 });
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          await loginWithClerk(clerkUserId, role, division, subject, teacherName, studentUsername, year, stream, phone);
          navigate('/', { replace: true });
          return;
        } catch (_) {
          toast.error('يرجى تسجيل الدخول', { duration: 3000 });
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }
      }

      setError(err.response?.data?.message || err.message || 'فشل تسجيل الدخول');
      setStep('error');
      setIsProcessing(false);
    }
  };

  const validatePhone = (val) => /^01[0-2,5]{1}[0-9]{8}$/.test(val);

  const handleRoleSelect = (role) => {
    if (isProcessing) return;
    setSelectedRole(role);
    if (role === 'student')                setStep('division-selection');
    else if (role === 'teacher')           setStep('subject-selection');
    else if (role === 'assistant_teacher') setStep('verify-assistant');
    else if (role === 'parent')            setStep('verify-parent');
  };

  const handleDivisionConfirm = () => {
    if (!selectedYear) { setYearError('يرجى اختيار الصف الدراسي'); return; }
    if (!selectedDivision) { setDivisionError('يرجى اختيار القسم الدراسي'); return; }
    if (!validatePhone(phone)) { setPhoneError('يرجى إدخال رقم هاتف مصري صحيح'); return; }
    setDivisionError('');
    setYearError('');
    setPhoneError('');
    handleLogin(clerkUser.id, selectedRole, selectedDivision, null, null, null, selectedYear, null, phone);
  };

  const handleSubjectConfirm = () => {
    if (!selectedSubject) { setSubjectError('يجب اختيار المادة الدراسية'); return; }
    if (!validatePhone(phone)) { setPhoneError('يرجى إدخال رقم هاتف مصري صحيح'); return; }
    setSubjectError('');
    setPhoneError('');
    const derivedStream = getStreamFromSubject(selectedSubject);
    handleLogin(clerkUser.id, selectedRole, null, selectedSubject, null, null, null, derivedStream, phone);
  };

  // Assistant verification
  const handleLookupTeacher = async () => {
    if (!teacherUsername.trim()) { setVerificationError('يرجى إدخال اسم المستخدم للمدرس'); return; }
    setLookupLoading(true); setVerificationError(''); setTeacherInfo(null);
    try {
      const res = await API.get(`/auth/assistant/teacher/${teacherUsername.trim()}`);
      setTeacherInfo(res.data.data);
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'لم يتم العثور على المدرس');
    } finally { setLookupLoading(false); }
  };

  const handleSendCodeToTeacher = async () => {
    setVerifyLoading(true); setVerificationError('');
    try {
      await API.post('/auth/assistant/send-code', {
        teacherUsername: teacherUsername.trim(),
        assistantEmail:  clerkUser?.emailAddresses[0]?.emailAddress,
      });
      setCodeSent(true);
      toast.success('تم إرسال الكود للمدرس في الوقت الفعلي! ⚡');
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'فشل إرسال الكود');
    } finally { setVerifyLoading(false); }
  };

  const handleVerifyTeacherCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setVerificationError('يرجى إدخال الكود المكون من 6 أرقام'); return;
    }
    if (!validatePhone(phone)) { setPhoneError('يرجى إدخال رقم هاتف مصري صحيح'); return; }
    setVerifyLoading(true); setVerificationError(''); setPhoneError('');
    try {
      await API.post('/auth/assistant/verify-code', {
        teacherUsername: teacherUsername.trim(),
        code:            verificationCode.trim(),
      });
      toast.success('تم التحقق بنجاح! ✅');
      handleLogin(clerkUser.id, 'assistant_teacher', null, null, teacherUsername.trim(), null, null, null, phone);
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'الكود غير صحيح أو انتهت صلاحيته');
    } finally { setVerifyLoading(false); }
  };

  // Parent verification
  const handleLookupStudent = async () => {
    if (!studentUsername.trim()) { setParentVerificationError('يرجى إدخال اسم المستخدم للطالب'); return; }
    setParentLookupLoading(true); setParentVerificationError(''); setStudentInfo(null);
    try {
      const res = await API.get(`/auth/parent/student/${studentUsername.trim()}`);
      setStudentInfo(res.data.data);
    } catch (err) {
      setParentVerificationError(err.response?.data?.message || 'لم يتم العثور على الطالب');
    } finally { setParentLookupLoading(false); }
  };

  const handleSendCodeToStudent = async () => {
    setParentVerifyLoading(true); setParentVerificationError('');
    try {
      await API.post('/auth/parent/send-code', {
        studentUsername: studentUsername.trim(),
        parentEmail:     clerkUser?.emailAddresses[0]?.emailAddress,
      });
      setParentCodeSent(true);
      toast.success('تم إرسال الكود للطالب في الوقت الفعلي! ⚡');
    } catch (err) {
      setParentVerificationError(err.response?.data?.message || 'فشل إرسال الكود');
    } finally { setParentVerifyLoading(false); }
  };

  const handleVerifyParentCode = async () => {
    if (!parentCode.trim() || parentCode.length !== 6) {
      setParentVerificationError('يرجى إدخال الكود المكون من 6 أرقام'); return;
    }
    if (!validatePhone(phone)) { setPhoneError('يرجى إدخال رقم هاتف مصري صحيح'); return; }
    setParentVerifyLoading(true); setParentVerificationError(''); setPhoneError('');
    try {
      await API.post('/auth/parent/verify-code', {
        studentUsername: studentUsername.trim(),
        code:            parentCode.trim(),
      });
      toast.success('تم التحقق بنجاح! ✅');
      handleLogin(clerkUser.id, 'parent', null, null, null, studentUsername.trim(), null, null, phone);
    } catch (err) {
      setParentVerificationError(err.response?.data?.message || 'الكود غير صحيح أو انتهت صلاحيته');
    } finally { setParentVerifyLoading(false); }
  };

  const handleCancel = async () => {
    try { await signOut(); localStorage.clear(); sessionStorage.clear(); } catch (_) {}
    navigate('/login', { replace: true });
  };

  const handleBack = () => {
    setDivisionError(''); setSubjectError(''); setYearError('');
    setVerificationError(''); setParentVerificationError('');
    setCodeSent(false); setParentCodeSent(false);
    setTeacherInfo(null); setStudentInfo(null);
    setPhone(''); setPhoneError('');
    setStep('role-selection');
  };

  const getRoleColor = (role) => {
    const map = { student: '#2563eb', teacher: '#7c3aed', assistant_teacher: '#059669', parent: '#db2777' };
    return map[role] || '#6b7280';
  };

  if (existingAccountDetected) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Alert severity="warning" icon={<WarningAmber sx={{ fontSize: 40 }} />}
            sx={{ mb: 3, fontFamily: 'Cairo, sans-serif', '& .MuiAlert-message': { width: '100%' } }}>
            <AlertTitle sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, fontSize: '1.5rem', mb: 2 }}>
              ⚠️ الحساب مسجل بالفعل
            </AlertTitle>
            <Typography sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mb: 2 }}>
              هذا الحساب ({clerkUser?.emailAddresses[0]?.emailAddress}) مسجل بالفعل في المنصة.
            </Typography>
            <Typography sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600, color: 'text.secondary' }}>
              سيتم تحويلك للصفحة الرئيسية تلقائياً بعد 3 ثواني...
            </Typography>
          </Alert>
          <Box sx={{ textAlign: 'center', mb: 3 }}><CircularProgress size={50} sx={{ mb: 2 }} /></Box>
          <Button fullWidth variant="outlined" onClick={() => navigate('/', { replace: true })}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mb: 1 }}>الانتقال للصفحة الرئيسية الآن</Button>
          <Button fullWidth variant="text" onClick={handleCancel} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>إلغاء</Button>
        </Box>
      </Container>
    );
  }

  const goToLogin = () => {
    setShowExistingAccountDialog(false);
    navigate('/login', { replace: true });
  };

  if (step === 'error') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h6" color="error" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>❌ {error}</Typography>
          <Button variant="contained" onClick={handleCancel} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>المحاولة مرة أخرى</Button>
        </Box>
      </Container>
    );
  }

  if (step === 'role-selection') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>مرحباً بك! 👋</Typography>
            <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={700}>اختر نوع حسابك</Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif', fontSize: '0.85rem' }}>
            🎯 سيتم إنشاء اسم مستخدم فريد لك تلقائياً بعد إنشاء الحساب
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {[
              { value: 'student',           label: 'طالب',       icon: <School sx={{ fontSize: 40 }} />,          desc: 'أريد التعلم والتطور' },
              { value: 'teacher',           label: 'مدرس',       icon: <PersonIcon sx={{ fontSize: 40 }} />,       desc: 'أريد تدريس الطلاب' },
              { value: 'assistant_teacher', label: 'مدرس مساعد', icon: <SupervisorAccount sx={{ fontSize: 40 }} />, desc: 'مساعد لمدرس آخر' },
              { value: 'parent',            label: 'ولي أمر',    icon: <FamilyRestroom sx={{ fontSize: 40 }} />,   desc: 'أريد متابعة أبنائي' },
            ].map((r) => (
              <Card key={r.value} onClick={() => handleRoleSelect(r.value)}
                sx={{
                  cursor: isProcessing ? 'not-allowed' : 'pointer', border: '2px solid',
                  borderColor: selectedRole === r.value ? getRoleColor(r.value) : 'transparent',
                  opacity: isProcessing ? 0.6 : 1, transition: 'all 0.2s',
                  '&:hover': { borderColor: getRoleColor(r.value), transform: 'translateY(-2px)', boxShadow: 3 },
                }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                  <Box sx={{ color: getRoleColor(r.value) }}>{r.icon}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontFamily="Cairo, sans-serif" fontWeight={900}>{r.label}</Typography>
                    <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">{r.desc}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Button fullWidth variant="outlined" onClick={handleCancel} disabled={isProcessing}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mt: 2 }}>إلغاء</Button>
        </Box>
      </Container>
    );
  }

  if (step === 'division-selection') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>اختر قسمك الدراسي 📚</Typography>
          </Box>
          {/* Grade select — always first */}
          <FormControl fullWidth error={!!yearError} sx={{ mb: 3 }}>
            <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>الصف الدراسي</InputLabel>
            <Select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setYearError(''); setSelectedDivision(''); }}
              label="الصف الدراسي" sx={{ fontFamily: 'Cairo, sans-serif' }} disabled={isProcessing}>
              {YEAR_OPTIONS.map((y) => (
                <MenuItem key={y.value} value={y.value} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>{y.label}</MenuItem>
              ))}
            </Select>
            {yearError && <FormHelperText sx={{ fontFamily: 'Cairo, sans-serif' }}>{yearError}</FormHelperText>}
          </FormControl>
          {/* Section select — options depend on selected grade */}
          <FormControl fullWidth error={!!divisionError} sx={{ mb: 3 }}>
            <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>القسم الدراسي</InputLabel>
            <Select value={selectedDivision} onChange={(e) => { setSelectedDivision(e.target.value); setDivisionError(''); }}
              label="القسم الدراسي" sx={{ fontFamily: 'Cairo, sans-serif' }} disabled={isProcessing || !selectedYear}>
              {getAvailableSections().map((s) => (
                <MenuItem key={s.value} value={s.value} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>{s.label}</MenuItem>
              ))}
            </Select>
            {divisionError && <FormHelperText sx={{ fontFamily: 'Cairo, sans-serif' }}>{divisionError}</FormHelperText>}
          </FormControl>

          <TextField
            fullWidth
            label="رقم الهاتف *"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            error={!!phoneError}
            helperText={phoneError || 'مثال: 01012345678'}
            inputProps={{ maxLength: 11, dir: 'ltr' }}
            sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}
            disabled={isProcessing}
          />

          <Button fullWidth variant="contained" onClick={handleDivisionConfirm} disabled={isProcessing}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'تأكيد'}
          </Button>
          <Button fullWidth variant="outlined" onClick={handleBack} disabled={isProcessing}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>رجوع</Button>
        </Box>
      </Container>
    );
  }

  if (step === 'subject-selection') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>اختر المادة الدراسية 📚</Typography>
          </Box>
          <FormControl fullWidth error={!!subjectError} sx={{ mb: 3 }}>
            <InputLabel sx={{ fontFamily: 'Cairo, sans-serif' }}>المادة الدراسية *</InputLabel>
            <Select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); setSubjectError(''); }}
              label="المادة الدراسية *" disabled={isProcessing} sx={{ fontFamily: 'Cairo, sans-serif' }}>
              {availableSubjects.map((s, i) => (
                <MenuItem key={`${s}-${i}`} value={s} sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 600 }}>{s}</MenuItem>
              ))}
            </Select>
            {subjectError && <FormHelperText sx={{ fontFamily: 'Cairo, sans-serif' }}>{subjectError}</FormHelperText>}
          </FormControl>
          {/* ✅ NEW: show the stream inferred from the selected subject (read-only — teacher does NOT choose stream) */}
          {selectedSubject && getStreamFromSubject(selectedSubject) && (
            <Alert severity="info" sx={{ mb: 3, fontFamily: 'Cairo, sans-serif', fontSize: '0.85rem' }}>
              القسم المُستنتج من المادة: <strong>{STREAM_LABELS[getStreamFromSubject(selectedSubject)]}</strong>
            </Alert>
          )}

          <TextField
            fullWidth
            label="رقم الهاتف *"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            error={!!phoneError}
            helperText={phoneError || 'مثال: 01012345678'}
            inputProps={{ maxLength: 11, dir: 'ltr' }}
            sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}
            disabled={isProcessing}
          />

          <Button fullWidth variant="contained" onClick={handleSubjectConfirm} disabled={isProcessing}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, mb: 2, py: 1.5, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            {isProcessing ? <CircularProgress size={24} color="inherit" /> : 'تأكيد'}
          </Button>
          <Button fullWidth variant="outlined" onClick={handleBack} disabled={isProcessing}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>رجوع</Button>
        </Box>
      </Container>
    );
  }

  if (step === 'verify-assistant') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>ربط حساب المدرس المساعد 🔗</Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">
              أدخل الاسم المميز الخاص بالمدرس الذي ستساعده
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 1: ابحث عن المدرس</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth placeholder="مثال: tch_SwiftEagle42" value={teacherUsername}
                onChange={(e) => { setTeacherUsername(e.target.value); setVerificationError(''); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                disabled={lookupLoading || !!teacherInfo} dir="ltr" />
              {!teacherInfo && (
                <Button variant="contained" onClick={handleLookupTeacher} disabled={lookupLoading} disableElevation
                  sx={{ minWidth: 80, fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
                  {lookupLoading ? <CircularProgress size={20} color="inherit" /> : 'بحث'}
                </Button>
              )}
            </Box>
          </Box>

          {teacherInfo && (
            <Card elevation={0} sx={{ mb: 3, border: '2px solid #7c3aed', borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon sx={{ color: '#7c3aed', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} fontFamily="Cairo, sans-serif">{teacherInfo.name}</Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="Cairo, sans-serif">@{teacherInfo.username}</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label="مدرس" size="small" sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                  </Box>
                </Box>
                <CheckCircle sx={{ color: '#059669' }} />
              </CardContent>
            </Card>
          )}

          {teacherInfo && !codeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 2: أرسل كود التحقق للمدرس</Typography>
              <Alert severity="info" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>
                سيصل للمدرس <strong>{teacherInfo.name}</strong> كود مكون من 6 أرقام في الوقت الفعلي.
              </Alert>
              <Button fullWidth variant="contained" startIcon={<Send />} onClick={handleSendCodeToTeacher}
                disabled={verifyLoading} disableElevation
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                {verifyLoading ? <CircularProgress size={24} color="inherit" /> : 'إرسال الكود للمدرس ⚡'}
              </Button>
            </Box>
          )}

          {codeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 3: أدخل الكود</Typography>
              <Alert severity="success" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>✅ تم إرسال الكود للمدرس. اطلب منه الكود ثم أدخله هنا.</Alert>
              <TextField fullWidth label="كود التحقق (6 أرقام)" value={verificationCode}
                onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerificationError(''); }}
                placeholder="000000" inputProps={{ maxLength: 6, style: { letterSpacing: '0.5em', fontSize: '1.5rem', textAlign: 'center' } }}
                dir="ltr" sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleVerifyTeacherCode}
                disabled={verifyLoading || verificationCode.length !== 6} disableElevation
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #059669, #047857)' }}>
                {verifyLoading ? <CircularProgress size={24} color="inherit" /> : 'تحقق وأكمل التسجيل ✅'}
              </Button>
              <Button fullWidth variant="text" onClick={() => { setCodeSent(false); setVerificationCode(''); }}
                sx={{ mt: 1, fontFamily: 'Cairo, sans-serif', color: '#64748b' }}>إعادة إرسال الكود</Button>
            </Box>
          )}

          <TextField
            fullWidth
            label="رقم الهاتف *"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            error={!!phoneError}
            helperText={phoneError || 'مثال: 01012345678'}
            inputProps={{ maxLength: 11, dir: 'ltr' }}
            sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}
            disabled={isProcessing}
          />

          {verificationError && <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{verificationError}</Alert>}

          <Button fullWidth variant="outlined" onClick={handleBack} sx={{ mt: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>رجوع</Button>
        </Box>
      </Container>
    );
  }

  if (step === 'verify-parent') {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', py: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>ربط حساب ولي الأمر 👨‍👩‍👦</Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">أدخل الاسم المميز الخاص بابنك/ابنتك</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 1: ابحث عن الطالب</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField fullWidth placeholder="مثال: std_BraveWolf42" value={studentUsername}
                onChange={(e) => { setStudentUsername(e.target.value); setParentVerificationError(''); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                disabled={parentLookupLoading || !!studentInfo} dir="ltr" />
              {!studentInfo && (
                <Button variant="contained" onClick={handleLookupStudent} disabled={parentLookupLoading} disableElevation
                  sx={{ minWidth: 80, fontFamily: 'Cairo, sans-serif', fontWeight: 700, background: 'linear-gradient(135deg, #db2777, #7c3aed)' }}>
                  {parentLookupLoading ? <CircularProgress size={20} color="inherit" /> : 'بحث'}
                </Button>
              )}
            </Box>
          </Box>

          {studentInfo && (
            <Card elevation={0} sx={{ mb: 3, border: '2px solid #db2777', borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <School sx={{ color: '#db2777', fontSize: 40 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} fontFamily="Cairo, sans-serif">{studentInfo.name}</Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="Cairo, sans-serif">@{studentInfo.username}</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip label="طالب" size="small" sx={{ bgcolor: '#fdf2f8', color: '#db2777', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                  </Box>
                </Box>
                <CheckCircle sx={{ color: '#059669' }} />
              </CardContent>
            </Card>
          )}

          {studentInfo && !parentCodeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 2: أرسل كود التحقق للطالب</Typography>
              <Alert severity="info" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>
                سيصل للطالب <strong>{studentInfo.name}</strong> كود مكون من 6 أرقام في الوقت الفعلي.
              </Alert>
              <Button fullWidth variant="contained" startIcon={<Send />} onClick={handleSendCodeToStudent}
                disabled={parentVerifyLoading} disableElevation
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #db2777, #7c3aed)' }}>
                {parentVerifyLoading ? <CircularProgress size={24} color="inherit" /> : 'إرسال الكود للطالب ⚡'}
              </Button>
            </Box>
          )}

          {parentCodeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>الخطوة 3: أدخل الكود</Typography>
              <Alert severity="success" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>✅ تم إرسال الكود للطالب. اطلب منه الكود ثم أدخله هنا.</Alert>
              <TextField fullWidth label="كود التحقق (6 أرقام)" value={parentCode}
                onChange={(e) => { setParentCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setParentVerificationError(''); }}
                placeholder="000000" inputProps={{ maxLength: 6, style: { letterSpacing: '0.5em', fontSize: '1.5rem', textAlign: 'center' } }}
                dir="ltr" sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleVerifyParentCode}
                disabled={parentVerifyLoading || parentCode.length !== 6} disableElevation
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5, background: 'linear-gradient(135deg, #059669, #047857)' }}>
                {parentVerifyLoading ? <CircularProgress size={24} color="inherit" /> : 'تحقق وأكمل التسجيل ✅'}
              </Button>
              <Button fullWidth variant="text" onClick={() => { setParentCodeSent(false); setParentCode(''); }}
                sx={{ mt: 1, fontFamily: 'Cairo, sans-serif', color: '#64748b' }}>إعادة إرسال الكود</Button>
            </Box>
          )}

          <TextField
            fullWidth
            label="رقم الهاتف *"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            error={!!phoneError}
            helperText={phoneError || 'مثال: 01012345678'}
            inputProps={{ maxLength: 11, dir: 'ltr' }}
            sx={{ mb: 3, fontFamily: 'Cairo, sans-serif' }}
            disabled={isProcessing}
          />

          {parentVerificationError && <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{parentVerificationError}</Alert>}

          <Button fullWidth variant="outlined" onClick={handleBack} sx={{ mt: 2, fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>رجوع</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Box sx={{ textAlign: 'center', width: '100%' }}>
        <CircularProgress size={60} sx={{ mb: 3 }} />
        <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ mb: 2 }}>
          {step === 'loading' ? 'جاري التحميل...' : 'جاري المعالجة...'}
        </Typography>
        {debugInfo && <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">Debug: {debugInfo}</Typography>}
      </Box>

      {/* Existing Account Dialog */}
      <Dialog open={showExistingAccountDialog} onClose={() => setShowExistingAccountDialog(false)}
        TransitionProps={{ mountOnEnter: true, unmountOnExit: true }}
        PaperProps={{ sx: { borderRadius: 4, maxWidth: 440, width: '90%', overflow: 'visible' } }}>
        <Box sx={{ textAlign: 'center', pt: 3, position: 'relative' }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 1, boxShadow: '0 8px 24px rgba(220,38,38,0.25)',
          }}>
            <WarningAmber sx={{ fontSize: 36, color: 'white' }} />
          </Box>
        </Box>
        <DialogTitle sx={{
          fontFamily: 'Cairo, sans-serif', fontWeight: 900, textAlign: 'center',
          fontSize: '1.3rem', pt: 1, pb: 0.5, px: 3,
        }}>
          هذا الحساب موجود بالفعل
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 1 }}>
          <DialogContentText sx={{
            fontFamily: 'Cairo, sans-serif', textAlign: 'center',
            fontSize: '0.95rem', lineHeight: 1.7, mb: 1,
          }}>
            يوجد حساب مسجل بالفعل باستخدام البريد الإلكتروني{' '}
            <strong dir="ltr" style={{ direction: 'ltr', display: 'inline-block' }}>
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </strong>.
          </DialogContentText>
          <Box sx={{
            mt: 2, p: 2, borderRadius: 2,
            bgcolor: '#fef3c7', border: '1px solid #fde68a',
          }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif"
              sx={{ color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
              <EmailIcon sx={{ fontSize: 18, verticalAlign: 'middle', ml: 0.5 }} />
              يمكنك تسجيل الدخول باستخدام حسابك الحالي.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button onClick={() => setShowExistingAccountDialog(false)}
            variant="outlined" fullWidth={false}
            sx={{
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2,
              px: 3, py: 1.2, minWidth: 140,
            }}>
            إلغاء
          </Button>
          <Button onClick={goToLogin}
            variant="contained" startIcon={<LoginIcon />} fullWidth={false}
            sx={{
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, borderRadius: 2,
              px: 3, py: 1.2, minWidth: 160,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)' },
            }}>
            تسجيل الدخول
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClerkRegisterCallbackPage;