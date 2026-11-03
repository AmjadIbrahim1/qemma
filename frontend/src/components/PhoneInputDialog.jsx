import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Box, CircularProgress,
} from '@mui/material';
import { Smartphone } from '@mui/icons-material';
import API from '../services/api';

const PHONE_REGEX = /^01[0-2,5]{1}[0-9]{8}$/;

const PhoneInputDialog = ({ open, onComplete, onSkip, disableSkip }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = phone.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      setError('يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await API.patch('/auth/phone', { phone: trimmed });
      const updatedUser = res.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل حفظ رقم الهاتف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(val);
    if (error) setError('');
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ textAlign: 'center', fontFamily: 'Cairo, sans-serif', fontWeight: 900, pb: 0 }}>
        <Box sx={{ fontSize: 48, mb: 1 }}>📱</Box>
        أدخل رقم هاتفك
      </DialogTitle>
      <DialogContent sx={{ px: 3, pb: 1 }}>
        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: 'text.secondary', mb: 3, textAlign: 'center' }}>
          يجب إدخال رقم هاتف صحيح لإتمام عملية التسجيل
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="رقم الهاتف"
          placeholder="01012345678"
          value={phone}
          onChange={handleChange}
          error={!!error}
          helperText={error || ' '}
          dir="ltr"
          disabled={submitting}
          InputProps={{
            startAdornment: <Smartphone sx={{ ml: 1, color: 'action.active' }} />,
            sx: { fontFamily: 'Cairo, sans-serif', direction: 'ltr' },
          }}
          InputLabelProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
          FormHelperTextProps={{ sx: { fontFamily: 'Cairo, sans-serif' } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 1 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting || phone.length < 11}
          sx={{
            fontFamily: 'Cairo, sans-serif', fontWeight: 900, py: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'تأكيد'}
        </Button>
        {!disableSkip && (
          <Button
            fullWidth
            variant="text"
            onClick={onSkip}
            disabled={submitting}
            sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700, color: 'text.secondary' }}
          >
            تخطي مؤقتاً
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PhoneInputDialog;
