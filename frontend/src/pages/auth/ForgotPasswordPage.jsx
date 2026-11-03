// frontend/src/pages/auth/ForgotPasswordPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import API from "../../services/api";
import {
  Container, Box, Typography, TextField, Button, Card, CardContent,
  Alert, CircularProgress, InputAdornment,
} from "@mui/material";
import {
  ArrowBack, Email, AccountCircle, Phone, Lock, LockReset,
} from "@mui/icons-material";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [form, setForm] = useState({ email: "", username: "", phone: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.username || !form.phone || !form.newPassword) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await API.post("/auth/forgot-password", form);
      setMessage("تم إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "البيانات المدخلة غير صحيحة. تأكد من جميع الحقول.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
      <Container maxWidth="sm">
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/login")}
          sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "#1e293b" }}>
          العودة لتسجيل الدخول
        </Button>

        <Card sx={{ borderRadius: 3, boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.08)", bgcolor: darkMode ? "#1e293b" : "white", border: darkMode ? "1px solid #334155" : "none" }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                <LockReset sx={{ fontSize: 32, color: "white" }} />
              </Box>
              <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                إعادة تعيين كلمة المرور
              </Typography>
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", mt: 1 }}>
                أدخل البيانات التالية لإعادة تعيين كلمة المرور
              </Typography>
            </Box>

            {message && <Alert severity="success" sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}>{message}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField fullWidth name="email" label="البريد الإلكتروني" type="email" value={form.email} onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: darkMode ? "#94a3b8" : "#64748b" }} /></InputAdornment> }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }} />

              <TextField fullWidth name="username" label="اسم المستخدم" value={form.username} onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircle sx={{ color: darkMode ? "#94a3b8" : "#64748b" }} /></InputAdornment> }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }} />

              <TextField fullWidth name="phone" label="رقم الهاتف" value={form.phone} onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: darkMode ? "#94a3b8" : "#64748b" }} /></InputAdornment> }}
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }} />

              <TextField fullWidth name="newPassword" label="كلمة المرور الجديدة" type="password" value={form.newPassword} onChange={handleChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: darkMode ? "#94a3b8" : "#64748b" }} /></InputAdornment> }}
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiInputBase-input": { fontFamily: "Cairo, sans-serif" } }}
                InputLabelProps={{ sx: { fontFamily: "Cairo, sans-serif" } }} />

              <Button fullWidth type="submit" variant="contained" disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockReset />}
                sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 900, borderRadius: 2, py: 1.5, background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                {loading ? "جارٍ إعادة التعيين..." : "إعادة تعيين كلمة المرور"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;
