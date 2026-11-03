// frontend/src/components/parent/AddChildModal.jsx
// Modal component that reuses the existing OTP verification flow from registration
// to allow an already-logged-in parent to link additional children.

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField, Button,
  Card, CardContent, CircularProgress, Alert, Chip, IconButton,
} from '@mui/material';
import {
  Search, Send, CheckCircle, Close, School, Person,
  ArrowBack, FamilyRestroom,
} from '@mui/icons-material';
import API from '../../services/api';
import parentsService from '../../services/parents.service';
import toast from 'react-hot-toast';

const AddChildModal = ({ open, onClose, onChildAdded }) => {
  const [step, setStep] = useState('lookup'); // lookup | code-sent | done

  // Lookup
  const [studentUsername, setStudentUsername] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Code
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Link
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setStep('lookup');
    setStudentUsername('');
    setStudentInfo(null);
    setLookupLoading(false);
    setLookupError('');
    setCode('');
    setCodeSent(false);
    setVerifyLoading(false);
    setSendLoading(false);
    setVerifyError('');
    setLinkLoading(false);
    setLinkError('');
  };

  const parentEmail = JSON.parse(localStorage.getItem('user') || '{}')?.email || '';

  // ── Step 1: Look up student ────────────────────────────────
  const handleLookupStudent = async () => {
    if (!studentUsername.trim()) {
      setLookupError('يرجى إدخال اسم المستخدم للطالب');
      return;
    }
    setLookupLoading(true);
    setLookupError('');
    setStudentInfo(null);
    try {
      const res = await API.get(`/auth/parent/student/${studentUsername.trim()}`);
      setStudentInfo(res.data.data);
    } catch (err) {
      setLookupError(err.response?.data?.message || 'لم يتم العثور على طالب بهذا الاسم المميز');
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Step 2: Send verification code ─────────────────────────
  const handleSendCode = async () => {
    if (!parentEmail) {
      toast.error('لا يوجد بريد إلكتروني مسجل لحسابك');
      return;
    }
    setSendLoading(true);
    setVerifyError('');
    try {
      await API.post('/auth/parent/send-code', {
        studentUsername: studentUsername.trim(),
        parentEmail,
      });
      setCodeSent(true);
      setStep('code-sent');
      toast.success('تم إرسال كود التحقق للطالب! ⚡');
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'فشل إرسال الكود');
    } finally {
      setSendLoading(false);
    }
  };

  // ── Step 3: Verify code & link child ───────────────────────
  const handleVerifyAndLink = async () => {
    if (!code.trim() || code.length !== 6) {
      setVerifyError('يرجى إدخال الكود المكون من 6 أرقام');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      // Verify the OTP code first
      await API.post('/auth/parent/verify-code', {
        studentUsername: studentUsername.trim(),
        code: code.trim(),
      });

      // Code verified — now link the child to this parent
      setLinkLoading(true);
      const res = await parentsService.linkChild(studentUsername.trim());
      const result = res.data.data;

      if (result.alreadyLinked) {
        toast.success('هذا الطالب مرتبط بالفعل بحسابك');
      } else {
        toast.success('تم ربط الطالب بحسابك بنجاح! 🎉');
      }

      setStep('done');
      if (onChildAdded) onChildAdded(result);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'فشل التحقق من الكود');
    } finally {
      setVerifyLoading(false);
      setLinkLoading(false);
    }
  };

  // ── Done: Refresh & close ──────────────────────────────────
  const handleDone = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1 },
      }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            background: 'linear-gradient(135deg, #db2777, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FamilyRestroom sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif">
            إضافة طالب جديد
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent>
        {step === 'lookup' && (
          <Box>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif" sx={{ mb: 3 }}>
              أدخل اسم المستخدم المميز للطالب الذي تريد ربطه بحسابك.
            </Typography>

            {/* Lookup field */}
            <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>
              الخطوة 1: ابحث عن الطالب بالاسم المميز
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField fullWidth placeholder="مثال: std_BraveWolf42"
                value={studentUsername}
                onChange={(e) => { setStudentUsername(e.target.value); setLookupError(''); }}
                InputProps={{
                  startAdornment: <Search sx={{ ml: 1, color: 'action.active' }} />,
                }}
                disabled={lookupLoading || !!studentInfo}
                dir="ltr"
              />
              {!studentInfo && (
                <Button variant="contained" onClick={handleLookupStudent}
                  disabled={lookupLoading}
                  disableElevation
                  sx={{
                    minWidth: 80, fontFamily: 'Cairo, sans-serif', fontWeight: 700,
                    background: 'linear-gradient(135deg, #db2777, #7c3aed)',
                  }}>
                  {lookupLoading ? <CircularProgress size={20} color="inherit" /> : 'بحث'}
                </Button>
              )}
            </Box>

            {/* Student info card */}
            {studentInfo && (
              <Card elevation={0} sx={{ mb: 3, border: '2px solid #db2777', borderRadius: 2 }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <School sx={{ color: '#db2777' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700} fontFamily="Cairo, sans-serif">
                      {studentInfo.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontFamily="Cairo, sans-serif">
                      @{studentInfo.username}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label="طالب" size="small"
                        sx={{ bgcolor: '#fdf2f8', color: '#db2777', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }} />
                    </Box>
                  </Box>
                  <CheckCircle sx={{ color: '#059669' }} />
                </CardContent>
              </Card>
            )}

            {/* Send code button */}
            {studentInfo && !codeSent && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 1 }}>
                  الخطوة 2: أرسل كود التحقق للطالب
                </Typography>
                <Alert severity="info" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>
                  سيصل للطالب <strong>{studentInfo.name}</strong> كود مكون من 6 أرقام في الوقت الفعلي عبر الإشعارات.
                </Alert>
                <Button fullWidth variant="contained" startIcon={<Send />}
                  onClick={handleSendCode} disabled={sendLoading} disableElevation
                  sx={{
                    fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
                    background: 'linear-gradient(135deg, #db2777, #7c3aed)',
                  }}>
                  {sendLoading ? <CircularProgress size={24} color="inherit" /> : 'إرسال الكود للطالب ⚡'}
                </Button>
              </Box>
            )}

            {lookupError && <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{lookupError}</Alert>}
          </Box>
        )}

        {step === 'code-sent' && (
          <Box>
            <Typography variant="subtitle2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 2 }}>
              الخطوة 3: أدخل الكود الذي أرسله لك الطالب
            </Typography>

            {studentInfo && (
              <Alert severity="success" sx={{ mb: 2, fontFamily: 'Cairo, sans-serif' }}>
                ✅ تم إرسال الكود للطالب <strong>{studentInfo.name}</strong>. اطلب منه الكود ثم أدخله هنا.
              </Alert>
            )}

            <TextField fullWidth label="كود التحقق (6 أرقام)"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError(''); }}
              placeholder="000000"
              inputProps={{
                maxLength: 6,
                style: { letterSpacing: '0.5em', fontSize: '1.5rem', textAlign: 'center' },
              }}
              dir="ltr"
              sx={{ mb: 2 }}
            />

            <Button fullWidth variant="contained"
              onClick={handleVerifyAndLink}
              disabled={verifyLoading || linkLoading || code.length !== 6}
              disableElevation
              sx={{
                fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
                background: 'linear-gradient(135deg, #059669, #047857)',
              }}>
              {verifyLoading || linkLoading
                ? <CircularProgress size={24} color="inherit" />
                : 'تحقق وربط الطالب ✅'}
            </Button>

            <Button fullWidth variant="text"
              onClick={() => { setCodeSent(false); setCode(''); setStep('lookup'); }}
              sx={{ mt: 1, fontFamily: 'Cairo, sans-serif', color: '#64748b' }}>
              إعادة إرسال الكود
            </Button>

            {verifyError && (
              <Alert severity="error" sx={{ mt: 2, fontFamily: 'Cairo, sans-serif' }}>{verifyError}</Alert>
            )}
            {linkError && (
              <Alert severity="error" sx={{ mt: 2, fontFamily: 'Cairo, sans-serif' }}>{linkError}</Alert>
            )}
          </Box>
        )}

        {step === 'done' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669, #10b981)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <CheckCircle sx={{ color: 'white', fontSize: 48 }} />
            </Box>
            <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>
              تم الربط بنجاح! 🎉
            </Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif" sx={{ mb: 3 }}>
              أصبح بإمكانك الآن متابعة تقدم الطالب من لوحة التحكم.
            </Typography>
            <Button fullWidth variant="contained" onClick={handleDone} disableElevation
              sx={{
                fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}>
              تم
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddChildModal;
