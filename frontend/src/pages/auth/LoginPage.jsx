// frontend/src/pages/auth/LoginPage.jsx
// ✅ CHANGE: Added redirect support after login (for checkout flow)
// Everything else unchanged.

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SignIn, useClerk } from "@clerk/clerk-react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ArrowBack,
} from "@mui/icons-material";
import toast from "react-hot-toast";

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();  // ✅ NEW
  const { login } = useAuth();
  const { signOut } = useClerk();

  // ✅ NEW: Read redirect state passed from CheckoutPage
  const redirectTo    = location.state?.redirectTo    || null;
  const redirectState = location.state?.redirectState || null;
  const redirectMsg   = location.state?.message       || null;

  const [step, setStep] = useState("choice");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showClerkModal, setShowClerkModal] = useState(false);

  useEffect(() => {
    const clearSessions = async () => {
      try {
        console.log('🧹 Clearing any stale sessions...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        try { await signOut(); } catch (e) { console.log('ℹ️ No Clerk session to clear'); }
        console.log('✅ Sessions cleared');
      } catch (error) {
        console.log('ℹ️ Session cleanup:', error.message);
      }
    };
    clearSessions();
  }, [signOut]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    if (!formData.password) newErrors.password = "كلمة المرور مطلوبة";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ CHANGED: After login, redirect to checkout if redirectTo is set
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      const user = response.data.data.user;

      // ✅ NEW: If coming from checkout, go back there
      if (redirectTo && redirectState) {
        navigate(redirectTo, { state: redirectState, replace: true });
        return;
      }

      const dashboardRoute =
        user.role === "student"           ? "/student/dashboard"
        : user.role === "teacher"         ? "/teacher/dashboard"
        : user.role === "assistant_teacher" ? "/teacher/dashboard"
        : user.role === "parent"          ? "/parent/dashboard"
        : "/student/dashboard";

      navigate(dashboardRoute);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "فشل تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClerkModal = async () => {
    try {
      console.log('🧹 Preparing Clerk login...');
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.indexedDB) {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name.includes('clerk')) {
            await window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('✅ Ready for Clerk login');
      setShowClerkModal(true);
    } catch (error) {
      console.log('ℹ️ Session cleanup:', error.message);
      setShowClerkModal(true);
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: Choice Screen
  // ════════════════════════════════════════════════════════════
  if (step === "choice") {
    return (
      <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Box sx={{ width: "100%", py: 4 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate("/")}
            sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
            العودة للرئيسية
          </Button>

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
              sx={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              قِمّة
            </Typography>
            <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mt: 1 }}>
              تسجيل الدخول
            </Typography>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">
              اختر طريقة تسجيل الدخول المناسبة لك
            </Typography>
          </Box>

          {/* ✅ NEW: Show message if redirected from checkout */}
          {redirectMsg && (
            <Box
              sx={{
                mb: 3, p: 2, borderRadius: 2,
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
                display: "flex", alignItems: "center", gap: 1,
              }}
            >
              <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: "#1d4ed8", fontWeight: 600 }}>
                🛒 {redirectMsg}
              </Typography>
            </Box>
          )}

          <Button fullWidth variant="outlined" size="large" onClick={handleOpenClerkModal}
            sx={{
              mb: 2, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5,
              borderColor: "#E5E7EB", color: "text.primary",
              "&:hover": { borderColor: "#D1D5DB", bgcolor: "rgba(0,0,0,0.02)" },
            }}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            }>
            الدخول بواسطة Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">أو</Typography>
          </Divider>

          <Button fullWidth variant="contained" size="large" onClick={() => setStep("local")} disableElevation
            sx={{
              fontFamily: "Cairo, sans-serif", fontWeight: 900, borderRadius: 2, py: 1.5,
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
              "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)" },
            }}>
            الدخول بالبريد الإلكتروني
          </Button>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              ليس لديك حساب؟{" "}
              {/* ✅ NEW: Pass redirect state to register page */}
              <Link
                to="/register"
                state={redirectTo ? { redirectTo, redirectState, message: redirectMsg } : undefined}
                style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}
              >
                سجل الآن
              </Link>
            </Typography>
          </Box>

          {showClerkModal && (
            <Box
              sx={{
                position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setShowClerkModal(false)}
            >
              <Box onClick={(e) => e.stopPropagation()}>
                <SignIn
                  routing="virtual"
                  afterSignInUrl="/auth/clerk-login-callback"
                  appearance={{ elements: { rootBox: "mx-auto", card: "shadow-xl" } }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Local Login Form
  // ════════════════════════════════════════════════════════════
  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => setStep("choice")}
          sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}>
          العودة
        </Button>

        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif"
            sx={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            قِمّة
          </Typography>
          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ mt: 1 }}>
            تسجيل الدخول
          </Typography>
          <Typography variant="body2" color="text.secondary" fontFamily="Cairo, sans-serif">
            أدخل بياناتك للدخول إلى حسابك
          </Typography>
        </Box>

        {/* ✅ NEW: Show message if redirected from checkout */}
        {redirectMsg && (
          <Box
            sx={{
              mb: 3, p: 2, borderRadius: 2,
              bgcolor: "#eff6ff", border: "1px solid #bfdbfe",
            }}
          >
            <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: "#1d4ed8", fontWeight: 600 }}>
              🛒 {redirectMsg}
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField fullWidth name="email" label="البريد الإلكتروني" type="email"
            value={formData.email} onChange={handleChange}
            error={!!errors.email} helperText={errors.email}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
            sx={{ mb: 2 }} />

          <TextField fullWidth name="password" label="كلمة المرور"
            type={showPassword ? "text" : "password"}
            value={formData.password} onChange={handleChange}
            error={!!errors.password} helperText={errors.password}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }} />

          <Button fullWidth type="submit" variant="contained" size="large"
            disabled={loading} disableElevation
            sx={{
              fontFamily: "Cairo, sans-serif", fontWeight: 900, borderRadius: 2, py: 1.5,
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
              "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)" },
            }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : "تسجيل الدخول"}
          </Button>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Link to="/forgot-password" style={{ color: "#7c3aed", fontWeight: 700, fontFamily: "Cairo, sans-serif", textDecoration: "none", fontSize: "0.9rem" }}>
              نسيت كلمة المرور؟
            </Link>
          </Box>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" fontFamily="Cairo, sans-serif">
            ليس لديك حساب؟{" "}
            {/* ✅ NEW: Pass redirect state to register page */}
            <Link
              to="/register"
              state={redirectTo ? { redirectTo, redirectState, message: redirectMsg } : undefined}
              style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none" }}
            >
              سجل الآن
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;