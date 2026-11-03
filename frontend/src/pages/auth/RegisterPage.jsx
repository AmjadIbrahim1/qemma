import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SignUp, useClerk } from "@clerk/clerk-react";
import API from "../../services/api";
import {
  YEAR_OPTIONS,
  STREAM_LABELS,
  getStreamFromSubject,
} from "../../utils/constants";
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
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Phone,
  ArrowBack,
  School,
  Person as PersonIcon,
  FamilyRestroom,
  SupervisorAccount,
  Send,
  CheckCircle,
  Search,
  AlternateEmail,
} from "@mui/icons-material";
import toast from "react-hot-toast";

const DOMAIN = "@qemma.com";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const { signOut } = useClerk();

  const redirectTo = location.state?.redirectTo || null;
  const redirectState = location.state?.redirectState || null;
  const redirectMsg = location.state?.message || null;

  const [step, setStep] = useState("choice");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "student",
    division: "",
    year: "",
    subject: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showClerkModal, setShowClerkModal] = useState(false);

  // Assistant
  const [teacherUsernameInput, setTeacherUsernameInput] = useState("");
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  // Parent
  const [studentUsernameInput, setStudentUsernameInput] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [parentCode, setParentCode] = useState("");
  const [parentCodeSent, setParentCodeSent] = useState(false);
  const [parentVerifyLoading, setParentVerifyLoading] = useState(false);
  const [parentLookupLoading, setParentLookupLoading] = useState(false);
  const [parentVerificationError, setParentVerificationError] = useState("");

  const availableSubjects = [
    "اللغة العربية",
    "اللغة الإنجليزية",
    "الفيزياء",
    "الكيمياء",
    "الأحياء",
    "الرياضيات",
    "الجغرافيا",
    "التاريخ",
    "الإحصاء",
  ];

  useEffect(() => {
    const clearClerkSession = async () => {
      try {
        await signOut();
      } catch (_) {}
    };
    clearClerkSession();
  }, [signOut]);

  const fullEmail = emailPrefix.trim() ? `${emailPrefix.trim()}${DOMAIN}` : "";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEmailPrefixChange = (e) => {
    const val = e.target.value.replace(/@.*/, "");
    setEmailPrefix(val);
    if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
  };

  const getRoleColor = (role) => {
    const map = {
      student: "#2563eb",
      teacher: "#7c3aed",
      assistant_teacher: "#059669",
      parent: "#db2777",
    };
    return map[role] || "#6b7280";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!emailPrefix.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (emailPrefix.includes("@")) {
      newErrors.email = `أدخل الجزء قبل ${DOMAIN} فقط`;
    } else if (emailPrefix.trim().length < 2) {
      newErrors.email = "اسم البريد قصير جداً";
    }
    if (!formData.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمتا المرور غير متطابقتين";
    }
    if (!formData.name || formData.name.length < 2)
      newErrors.name = "الاسم يجب أن يكون حرفين على الأقل";
    if (!formData.phone) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(formData.phone)) {
      newErrors.phone = "رقم الهاتف غير صالح (مثال: 01012345678)";
    }
    if (formData.role === "student" && !formData.year)
      newErrors.year = "يرجى اختيار الصف الدراسي";
    if (formData.role === "student" && !formData.division)
      newErrors.division = "يرجى اختيار القسم الدراسي";
    if (formData.role === "teacher" && !formData.subject)
      newErrors.subject = "يجب اختيار المادة الدراسية";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (
      formData.phone &&
      ["assistant_teacher", "parent"].includes(formData.role)
    ) {
      try {
        await API.post("/auth/check-phone", { phone: formData.phone });
      } catch (err) {
        const msg =
          err.response?.data?.message || err.response?.data?.errors?.[0]?.msg;
        if (msg && msg.includes("رقم الهاتف")) {
          setErrors((prev) => ({ ...prev, phone: msg }));
          return;
        }
      }
    }

    if (formData.role === "assistant_teacher") {
      setStep("verify-assistant");
      return;
    }
    if (formData.role === "parent") {
      setStep("verify-parent");
      return;
    }
    await doRegister();
  };

  const doRegister = async (teacherName = null, studentUsername = null) => {
    setLoading(true);
    try {
      const { confirmPassword, ...rest } = formData;
      const registerData = { ...rest, email: fullEmail };

      if (!registerData.phone) delete registerData.phone;
      if (registerData.role !== "student") delete registerData.division;
      if (!["teacher", "assistant_teacher"].includes(registerData.role))
        delete registerData.subject;
      if (registerData.role !== "student") delete registerData.year;

      if (["teacher", "assistant_teacher"].includes(registerData.role)) {
        const derivedStream = getStreamFromSubject(registerData.subject);
        if (derivedStream) registerData.stream = derivedStream;
        else delete registerData.stream;
      } else {
        delete registerData.stream;
      }

      if (registerData.role === "assistant_teacher") {
        registerData.teacherName = teacherName || null;
      } else {
        delete registerData.teacherName;
      }

      if (registerData.role === "parent" && studentUsername) {
        registerData.studentUsername = studentUsername;
      } else {
        delete registerData.studentUsername;
      }

      await register(registerData);
      toast.success("تم إنشاء الحساب بنجاح! 🎉");

      if (redirectTo && redirectState) {
        navigate(redirectTo, { state: redirectState, replace: true });
        return;
      }

      const dashboardRoute =
        registerData.role === "student"
          ? "/student/dashboard"
          : registerData.role === "teacher"
            ? "/teacher/dashboard"
            : registerData.role === "assistant_teacher"
              ? "/assistant-teacher/dashboard"
              : registerData.role === "parent"
                ? "/parent/dashboard"
                : "/student/dashboard";

      navigate(dashboardRoute);
    } catch (error) {
      const data = error.response?.data || {};
      const message = data.message || "";
      const errors = data.errors || [];

      const phoneError = errors.find(
        (e) => e.param === "phone" || e.path === "phone",
      );

      if (phoneError) {
        setErrors((prev) => ({
          ...prev,
          phone: phoneError.msg,
        }));
        if (["assistant_teacher", "parent"].includes(formData.role)) {
          setStep("local");
        }
      } else if (message.includes("رقم الهاتف")) {
        setErrors((prev) => ({
          ...prev,
          phone: message,
        }));
        if (["assistant_teacher", "parent"].includes(formData.role)) {
          setStep("local");
        }
      } else {
        toast.error(message || "فشل إنشاء الحساب");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Assistant verification ──────────────────────────────────
  const handleLookupTeacher = async () => {
    if (!teacherUsernameInput.trim()) {
      setVerificationError("يرجى إدخال اسم المستخدم للمدرس");
      return;
    }
    setLookupLoading(true);
    setVerificationError("");
    setTeacherInfo(null);
    try {
      const res = await API.get(
        `/auth/assistant/teacher/${teacherUsernameInput.trim()}`,
      );
      setTeacherInfo(res.data.data);
    } catch (err) {
      setVerificationError(
        err.response?.data?.message ||
          "لم يتم العثور على مدرس بهذا الاسم المميز",
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSendCodeToTeacher = async () => {
    setVerifyLoading(true);
    setVerificationError("");
    try {
      await API.post("/auth/assistant/send-code", {
        teacherUsername: teacherUsernameInput.trim(),
        assistantEmail: fullEmail,
      });
      setCodeSent(true);
      toast.success("تم إرسال الكود للمدرس في الوقت الفعلي! ⚡");
    } catch (err) {
      setVerificationError(err.response?.data?.message || "فشل إرسال الكود");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyTeacherCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setVerificationError("يرجى إدخال الكود المكون من 6 أرقام");
      return;
    }
    setVerifyLoading(true);
    setVerificationError("");
    try {
      await API.post("/auth/assistant/verify-code", {
        teacherUsername: teacherUsernameInput.trim(),
        code: verificationCode.trim(),
      });
      toast.success("تم التحقق بنجاح! ✅");
      await doRegister(teacherUsernameInput.trim());
    } catch (err) {
      setVerificationError(
        err.response?.data?.message || "الكود غير صحيح أو انتهت صلاحيته",
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Parent verification ─────────────────────────────────────
  const handleLookupStudent = async () => {
    if (!studentUsernameInput.trim()) {
      setParentVerificationError("يرجى إدخال اسم المستخدم للطالب");
      return;
    }
    setParentLookupLoading(true);
    setParentVerificationError("");
    setStudentInfo(null);
    try {
      const res = await API.get(
        `/auth/parent/student/${studentUsernameInput.trim()}`,
      );
      setStudentInfo(res.data.data);
    } catch (err) {
      setParentVerificationError(
        err.response?.data?.message ||
          "لم يتم العثور على طالب بهذا الاسم المميز",
      );
    } finally {
      setParentLookupLoading(false);
    }
  };

  const handleSendCodeToStudent = async () => {
    setParentVerifyLoading(true);
    setParentVerificationError("");
    try {
      await API.post("/auth/parent/send-code", {
        studentUsername: studentUsernameInput.trim(),
        parentEmail: fullEmail,
      });
      setParentCodeSent(true);
      toast.success("تم إرسال الكود للطالب في الوقت الفعلي! ⚡");
    } catch (err) {
      setParentVerificationError(
        err.response?.data?.message || "فشل إرسال الكود",
      );
    } finally {
      setParentVerifyLoading(false);
    }
  };

  const handleVerifyParentCode = async () => {
    if (!parentCode.trim() || parentCode.length !== 6) {
      setParentVerificationError("يرجى إدخال الكود المكون من 6 أرقام");
      return;
    }
    setParentVerifyLoading(true);
    setParentVerificationError("");
    try {
      await API.post("/auth/parent/verify-code", {
        studentUsername: studentUsernameInput.trim(),
        code: parentCode.trim(),
      });
      toast.success("تم التحقق بنجاح! ✅");
      await doRegister(null, studentUsernameInput.trim());
    } catch (err) {
      setParentVerificationError(
        err.response?.data?.message || "الكود غير صحيح أو انتهت صلاحيته",
      );
    } finally {
      setParentVerifyLoading(false);
    }
  };

  const handleOpenClerkModal = async () => {
    try {
      await signOut();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      await new Promise((r) => setTimeout(r, 300));
      setShowClerkModal(true);
    } catch (_) {
      setShowClerkModal(true);
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER: Choice
  // ════════════════════════════════════════════════════════════
  if (step === "choice") {
    return (
      <Container
        maxWidth="sm"
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      >
        <Box sx={{ width: "100%", py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/")}
            sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
          >
            العودة للرئيسية
          </Button>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
              sx={{
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              قِمّة
            </Typography>
            <Typography
              variant="h5"
              fontWeight={700}
              fontFamily="Cairo, sans-serif"
              sx={{ mt: 1 }}
            >
              إنشاء حساب جديد
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontFamily="Cairo, sans-serif"
            >
              اختر طريقة التسجيل المناسبة لك
            </Typography>
          </Box>

          {redirectMsg && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: "#eff6ff",
                border: "1px solid #bfdbfe",
              }}
            >
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ color: "#1d4ed8", fontWeight: 600 }}
              >
                🛒 {redirectMsg}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="outlined"
            size="large"
            onClick={handleOpenClerkModal}
            sx={{
              mb: 2,
              fontFamily: "Cairo, sans-serif",
              fontWeight: 700,
              borderRadius: 2,
              py: 1.5,
              borderColor: "#E5E7EB",
              color: "text.primary",
            }}
            startIcon={
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
            }
          >
            التسجيل بواسطة Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              fontFamily="Cairo, sans-serif"
            >
              أو
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => setStep("local")}
            disableElevation
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              borderRadius: 2,
              py: 1.5,
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
            }}
          >
            التسجيل بالبريد الإلكتروني
          </Button>

          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" fontFamily="Cairo, sans-serif">
              لديك حساب بالفعل؟{" "}
              <Link
                to="/login"
                state={
                  redirectTo
                    ? { redirectTo, redirectState, message: redirectMsg }
                    : undefined
                }
                style={{
                  color: "#2563eb",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                سجل الدخول
              </Link>
            </Typography>
          </Box>

          {showClerkModal && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setShowClerkModal(false)}
            >
              <Box onClick={(e) => e.stopPropagation()}>
                <SignUp
                  routing="virtual"
                  afterSignUpUrl="/auth/clerk-register-callback"
                />
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: verify-assistant
  // ════════════════════════════════════════════════════════════
  if (step === "verify-assistant") {
    return (
      <Container
        maxWidth="sm"
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      >
        <Box sx={{ width: "100%", py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/")}
            sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
          >
            العودة للرئيسية
          </Button>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
              sx={{ mb: 1 }}
            >
              ربط حساب المدرس المساعد 🔗
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontFamily="Cairo, sans-serif"
            >
              أدخل اسم المستخدم الخاص بالمدرس الذي ستساعده
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              fontFamily="Cairo, sans-serif"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              الخطوة 1: ابحث عن المدرس بالاسم المميز
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="مثال: tch_SwiftEagle42"
                value={teacherUsernameInput}
                onChange={(e) => {
                  setTeacherUsernameInput(e.target.value);
                  setVerificationError("");
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                disabled={lookupLoading || !!teacherInfo}
                dir="ltr"
              />
              {!teacherInfo && (
                <Button
                  variant="contained"
                  onClick={handleLookupTeacher}
                  disabled={lookupLoading}
                  disableElevation
                  sx={{
                    minWidth: 80,
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  }}
                >
                  {lookupLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "بحث"
                  )}
                </Button>
              )}
            </Box>
          </Box>

          {teacherInfo && (
            <Card
              elevation={0}
              sx={{ mb: 3, border: "2px solid #7c3aed", borderRadius: 2 }}
            >
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#f5f3ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PersonIcon sx={{ color: "#7c3aed" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} fontFamily="Cairo, sans-serif">
                    {teacherInfo.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Cairo, sans-serif"
                  >
                    @{teacherInfo.username}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label="مدرس"
                      size="small"
                      sx={{
                        bgcolor: "#f5f3ff",
                        color: "#7c3aed",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>
                <CheckCircle sx={{ color: "#059669" }} />
              </CardContent>
            </Card>
          )}

          {teacherInfo && !codeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                fontFamily="Cairo, sans-serif"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                الخطوة 2: أرسل كود التحقق للمدرس
              </Typography>
              <Alert
                severity="info"
                sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}
              >
                سيصل للمدرس <strong>{teacherInfo.name}</strong> كود مكون من 6
                أرقام في الوقت الفعلي عبر الإشعارات.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendCodeToTeacher}
                disabled={verifyLoading}
                disableElevation
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  py: 1.5,
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                }}
              >
                {verifyLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "إرسال الكود للمدرس ⚡"
                )}
              </Button>
            </Box>
          )}

          {codeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                fontFamily="Cairo, sans-serif"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                الخطوة 3: أدخل الكود الذي أرسله لك المدرس
              </Typography>
              <Alert
                severity="success"
                sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}
              >
                ✅ تم إرسال الكود للمدرس. اطلب منه الكود ثم أدخله هنا.
              </Alert>
              <TextField
                fullWidth
                label="كود التحقق (6 أرقام)"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  );
                  setVerificationError("");
                }}
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  style: {
                    letterSpacing: "0.5em",
                    fontSize: "1.5rem",
                    textAlign: "center",
                  },
                }}
                dir="ltr"
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyTeacherCode}
                disabled={verifyLoading || verificationCode.length !== 6}
                disableElevation
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  py: 1.5,
                  background: "linear-gradient(135deg, #059669, #047857)",
                }}
              >
                {verifyLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "تحقق وأكمل التسجيل ✅"
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode("");
                }}
                sx={{
                  mt: 1,
                  fontFamily: "Cairo, sans-serif",
                  color: "#64748b",
                }}
              >
                إعادة إرسال الكود
              </Button>
            </Box>
          )}

          {verificationError && (
            <Alert severity="error" sx={{ fontFamily: "Cairo, sans-serif" }}>
              {verificationError}
            </Alert>
          )}
        </Box>
      </Container>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: verify-parent
  // ════════════════════════════════════════════════════════════
  if (step === "verify-parent") {
    return (
      <Container
        maxWidth="sm"
        sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      >
        <Box sx={{ width: "100%", py: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/")}
            sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
          >
            العودة للرئيسية
          </Button>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
              sx={{ mb: 1 }}
            >
              ربط حساب ولي الأمر 👨‍👩‍👦
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              fontFamily="Cairo, sans-serif"
            >
              أدخل اسم المستخدم الخاص بابنك/ابنتك
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              fontFamily="Cairo, sans-serif"
              fontWeight={700}
              sx={{ mb: 1 }}
            >
              الخطوة 1: ابحث عن الطالب بالاسم المميز
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                fullWidth
                placeholder="مثال: std_BraveWolf42"
                value={studentUsernameInput}
                onChange={(e) => {
                  setStudentUsernameInput(e.target.value);
                  setParentVerificationError("");
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                disabled={parentLookupLoading || !!studentInfo}
                dir="ltr"
              />
              {!studentInfo && (
                <Button
                  variant="contained"
                  onClick={handleLookupStudent}
                  disabled={parentLookupLoading}
                  disableElevation
                  sx={{
                    minWidth: 80,
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #db2777, #7c3aed)",
                  }}
                >
                  {parentLookupLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "بحث"
                  )}
                </Button>
              )}
            </Box>
          </Box>

          {studentInfo && (
            <Card
              elevation={0}
              sx={{ mb: 3, border: "2px solid #db2777", borderRadius: 2 }}
            >
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: "#fdf2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <School sx={{ color: "#db2777" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} fontFamily="Cairo, sans-serif">
                    {studentInfo.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontFamily="Cairo, sans-serif"
                  >
                    @{studentInfo.username}
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label="طالب"
                      size="small"
                      sx={{
                        bgcolor: "#fdf2f8",
                        color: "#db2777",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>
                <CheckCircle sx={{ color: "#059669" }} />
              </CardContent>
            </Card>
          )}

          {studentInfo && !parentCodeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                fontFamily="Cairo, sans-serif"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                الخطوة 2: أرسل كود التحقق للطالب
              </Typography>
              <Alert
                severity="info"
                sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}
              >
                سيصل للطالب <strong>{studentInfo.name}</strong> كود مكون من 6
                أرقام في الوقت الفعلي عبر الإشعارات.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendCodeToStudent}
                disabled={parentVerifyLoading}
                disableElevation
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  py: 1.5,
                  background: "linear-gradient(135deg, #db2777, #7c3aed)",
                }}
              >
                {parentVerifyLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "إرسال الكود للطالب ⚡"
                )}
              </Button>
            </Box>
          )}

          {parentCodeSent && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="subtitle2"
                fontFamily="Cairo, sans-serif"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                الخطوة 3: أدخل الكود الذي أرسله لك الطالب
              </Typography>
              <Alert
                severity="success"
                sx={{ mb: 2, fontFamily: "Cairo, sans-serif" }}
              >
                ✅ تم إرسال الكود للطالب. اطلب منه الكود ثم أدخله هنا.
              </Alert>
              <TextField
                fullWidth
                label="كود التحقق (6 أرقام)"
                value={parentCode}
                onChange={(e) => {
                  setParentCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setParentVerificationError("");
                }}
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  style: {
                    letterSpacing: "0.5em",
                    fontSize: "1.5rem",
                    textAlign: "center",
                  },
                }}
                dir="ltr"
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyParentCode}
                disabled={parentVerifyLoading || parentCode.length !== 6}
                disableElevation
                sx={{
                  fontFamily: "Cairo, sans-serif",
                  fontWeight: 900,
                  py: 1.5,
                  background: "linear-gradient(135deg, #059669, #047857)",
                }}
              >
                {parentVerifyLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "تحقق وأكمل التسجيل ✅"
                )}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  setParentCodeSent(false);
                  setParentCode("");
                }}
                sx={{
                  mt: 1,
                  fontFamily: "Cairo, sans-serif",
                  color: "#64748b",
                }}
              >
                إعادة إرسال الكود
              </Button>
            </Box>
          )}

          {parentVerificationError && (
            <Alert severity="error" sx={{ fontFamily: "Cairo, sans-serif" }}>
              {parentVerificationError}
            </Alert>
          )}
        </Box>
      </Container>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: local form
  // ════════════════════════════════════════════════════════════
  const isTeacherRole =
    formData.role === "teacher" || formData.role === "assistant_teacher";

  // ✅ Helper: الخيارات المتاحة للقسم حسب الصف المختار
  // ✅ FIXED: use canonical stream values (Literary, Science-Maths, Science-Biology) that match backend validator
  const getDivisionOptions = () => {
    if (formData.year === "first") {
      return [
        { value: "Science-Maths", label: "علمي" },
        { value: "Literary", label: "أدبي" },
      ];
    }
    return [
      { value: "Literary", label: "أدبي" },
      { value: "Science-Biology", label: "علمي علوم" },
      { value: "Science-Maths", label: "علمي رياضة" },
    ];
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Box sx={{ width: "100%", py: 4 }}>          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/")}
            sx={{ mb: 3, fontFamily: "Cairo, sans-serif", fontWeight: 700 }}
          >
            العودة للرئيسية
          </Button>

        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            fontFamily="Cairo, sans-serif"
            sx={{
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            قِمّة
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            fontFamily="Cairo, sans-serif"
            sx={{ mt: 1 }}
          >
            إنشاء حساب جديد
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            fontFamily="Cairo, sans-serif"
          >
            أكمل البيانات التالية للتسجيل
          </Typography>
        </Box>

        {redirectMsg && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Typography
              variant="body2"
              fontFamily="Cairo, sans-serif"
              sx={{ color: "#1d4ed8", fontWeight: 600 }}
            >
              🛒 {redirectMsg}
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* Role selector */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              fontFamily="Cairo, sans-serif"
              fontWeight={700}
              sx={{ mb: 2 }}
            >
              نوع الحساب
            </Typography>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}
            >
              {[
                { value: "student", label: "طالب", icon: <School /> },
                { value: "teacher", label: "مدرس", icon: <PersonIcon /> },
                {
                  value: "assistant_teacher",
                  label: "مدرس مساعد",
                  icon: <SupervisorAccount />,
                },
                { value: "parent", label: "ولي أمر", icon: <FamilyRestroom /> },
              ].map((roleOption) => (
                <Card
                  key={roleOption.value}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      role: roleOption.value,
                      // ✅ Reset division and year when switching roles
                      division: "",
                      year: "",
                    }))
                  }
                  sx={{
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor:
                      formData.role === roleOption.value
                        ? getRoleColor(roleOption.value)
                        : "transparent",
                    bgcolor:
                      formData.role === roleOption.value
                        ? `${getRoleColor(roleOption.value)}10`
                        : "background.paper",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: getRoleColor(roleOption.value),
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Box
                      sx={{ color: getRoleColor(roleOption.value), mb: 0.5 }}
                    >
                      {roleOption.icon}
                    </Box>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={700}
                    >
                      {roleOption.label}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          <Alert
            severity="info"
            sx={{ mb: 2, fontFamily: "Cairo, sans-serif", fontSize: "0.85rem" }}
          >
            🎯 سيتم إنشاء اسم مستخدم فريد لك تلقائياً بعد إنشاء الحساب
          </Alert>

          {/* ✅ الصف الدراسي أولاً */}
          {formData.role === "student" && (
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.year}>
              <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                الصف الدراسي *
              </InputLabel>
              <Select
                name="year"
                value={formData.year}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                    division: "", // ✅ Reset القسم عند تغيير الصف
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    year: "",
                    division: "",
                  }));
                }}
                label="الصف الدراسي *"
                sx={{ fontFamily: "Cairo, sans-serif" }}
              >
                {YEAR_OPTIONS.map((y) => (
                  <MenuItem
                    key={y.value}
                    value={y.value}
                    sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                  >
                    {y.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.year && <FormHelperText>{errors.year}</FormHelperText>}
            </FormControl>
          )}

          {/* ✅ FIX: القسم الدراسي — key={formData.year} يضمن إعادة بناء الـ Select عند تغيير الصف */}
          {formData.role === "student" && (
            <FormControl
              fullWidth
              sx={{ mb: 2 }}
              error={!!errors.division}
              disabled={!formData.year}
            >
              <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                القسم الدراسي *
              </InputLabel>
              <Select
                key={formData.year}             // ✅ THE FIX: remount on year change
                name="division"
                value={formData.division}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData((prev) => ({ ...prev, [name]: value }));
                  setErrors((prev) => ({ ...prev, division: "" }));
                }}
                label="القسم الدراسي *"
                sx={{ fontFamily: "Cairo, sans-serif" }}
              >
                {getDivisionOptions().map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.division && (
                <FormHelperText>{errors.division}</FormHelperText>
              )}
            </FormControl>
          )}

          {/* Subject field — only for Teacher */}
          {formData.role === "teacher" && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.subject}>
                <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                  المادة الدراسية *
                </InputLabel>
                <Select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  label="المادة الدراسية *"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  {availableSubjects.map((s, i) => (
                    <MenuItem
                      key={`${s}-${i}`}
                      value={s}
                      sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 600 }}
                    >
                      {s}
                    </MenuItem>
                  ))}
                </Select>
                {errors.subject ? (
                  <FormHelperText>{errors.subject}</FormHelperText>
                ) : (
                  <FormHelperText sx={{ fontFamily: "Cairo, sans-serif" }}>
                    اختر المادة التي ستقوم بتدريسها
                  </FormHelperText>
                )}
              </FormControl>
              {formData.subject && getStreamFromSubject(formData.subject) && (
                <Alert
                  severity="info"
                  sx={{
                    mb: 2,
                    fontFamily: "Cairo, sans-serif",
                    fontSize: "0.85rem",
                  }}
                >
                  القسم المُستنتج من المادة:{" "}
                  <strong>
                    {STREAM_LABELS[getStreamFromSubject(formData.subject)]}
                  </strong>
                </Alert>
              )}
            </>
          )}

          {formData.role === "assistant_teacher" && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                fontFamily: "Cairo, sans-serif",
                fontSize: "0.85rem",
              }}
            >
              📚 المادة الدراسية ستُورث تلقائياً من المدرس الرئيسي بعد الربط
            </Alert>
          )}

          {formData.role === "assistant_teacher" && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                fontFamily: "Cairo, sans-serif",
                fontSize: "0.85rem",
              }}
            >
              ⚡ بعد ملء البيانات ستحتاج للتحقق من هوية المدرس عبر كود OTP
            </Alert>
          )}
          {formData.role === "parent" && (
            <Alert
              severity="info"
              sx={{
                mb: 2,
                fontFamily: "Cairo, sans-serif",
                fontSize: "0.85rem",
              }}
            >
              ⚡ بعد ملء البيانات ستحتاج للتحقق عبر الطالب عبر كود OTP
            </Alert>
          )}

          <TextField
            fullWidth
            name="name"
            label="الاسم الكامل"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="البريد الإلكتروني"
            value={emailPrefix}
            onChange={handleEmailPrefixChange}
            error={!!errors.email}
            helperText={
              errors.email ||
              (emailPrefix
                ? `سيكون بريدك: ${fullEmail}`
                : `يجب أن ينتهي بـ ${DOMAIN}`)
            }
            placeholder="اسمك"
            dir="ltr"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmail />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      bgcolor: "#f1f5f9",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontFamily: "Cairo, sans-serif",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#475569",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {DOMAIN}
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            name="phone"
            label="رقم الهاتف *"
            placeholder="01012345678"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            name="password"
            label="كلمة المرور"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            disableElevation
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              borderRadius: 2,
              py: 1.5,
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : formData.role === "assistant_teacher" ? (
              "التالي: التحقق من المدرس →"
            ) : formData.role === "parent" ? (
              "التالي: التحقق من الطالب →"
            ) : (
              "إنشاء حساب"
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" fontFamily="Cairo, sans-serif">
            لديك حساب بالفعل؟{" "}
            <Link
              to="/login"
              state={
                redirectTo
                  ? { redirectTo, redirectState, message: redirectMsg }
                  : undefined
              }
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              سجل الدخول
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;