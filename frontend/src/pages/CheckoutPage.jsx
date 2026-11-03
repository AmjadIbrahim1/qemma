// frontend/src/pages/CheckoutPage.jsx

import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
  Avatar,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  CreditCardRounded,
  LockRounded,
  CheckCircleRounded,
  LocalOfferRounded,
  SchoolRounded,
  MenuBookRounded,
  ShoppingCartRounded,
  PersonRounded,
  SupervisorAccount,
  FamilyRestroom,
} from "@mui/icons-material";
import ThemeContext from "../contexts/ThemeContext";
import { useAuth } from "../hooks/useAuth";
import paymentService from "../services/payment.service";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const GRADIENTS = {
  main:   "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue:   "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  green:  "linear-gradient(135deg, #059669 0%, #047857 100%)",
  assistant: "linear-gradient(135deg, #059669 0%, #10b981 55%, #047857 100%)",
  parent: "linear-gradient(135deg, #db2777 0%, #be185d 55%, #9d174d 100%)",
};

const isActivationItem = (itemType) =>
  itemType === 'assistant_activation' || itemType === 'parent_activation';

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const CheckoutPage = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { darkMode } = useContext(ThemeContext);
  const { user, loading: authLoading } = useAuth();

  // البيانات القادمة من الصفحة السابقة
  const { item, itemType } = location.state || {};

  // States
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [promoCode,     setPromoCode]     = useState("");
  const [promoApplied,  setPromoApplied]  = useState(false);
  const [promoLoading,  setPromoLoading]  = useState(false);
  const [discount,      setDiscount]      = useState(0);

  // Form Data — يُملأ تلقائياً من بيانات المستخدم المسجّل
  const [formData, setFormData] = useState({
    fullName:   "",
    email:      "",
    phone:      "",
    cardNumber: "",
    expiryDate: "",
    cvv:        "",
  });

  // ─────────────────────────────────────────────────────────────
  // توجيه غير المسجلين لصفحة التسجيل / الدخول
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!item || !itemType) {
      navigate("/");
      return;
    }

    if (!authLoading && !user) {
      // حفظ الوجهة حتى بعد تسجيل الدخول نرجع هنا
      navigate("/register", {
        state: {
          redirectTo: "/checkout",
          redirectState: { item, itemType },
          message: "يجب إنشاء حساب أولاً لإتمام عملية الشراء",
        },
      });
    }
  }, [authLoading, user, item, itemType, navigate]);

  // ملء البيانات الشخصية من حساب المستخدم
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name  || "",
        email:    user.email || "",
        phone:    user.phone || "",
      }));
    }
  }, [user]);

  // ─────────────────────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!item || !itemType || !user) return null;

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    if (name === "expiryDate") {
      const formatted = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .slice(0, 5);
      setFormData({ ...formData, [name]: formatted });
      return;
    }
    if (name === "cvv") {
      const formatted = value.replace(/\D/g, "").slice(0, 3);
      setFormData({ ...formData, [name]: formatted });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // التحقق من كود الخصم عبر الـ Backend
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setError("");

    try {
      const res = await paymentService.validatePromoCode(promoCode.trim());
      const { discount: disc } = res.data.data;
      setPromoApplied(true);
      setDiscount(disc);
    } catch (err) {
      setError(err.response?.data?.message || "كود الخصم غير صحيح");
      setPromoApplied(false);
      setDiscount(0);
    } finally {
      setPromoLoading(false);
    }
  };

  const calculateTotal = () => {
    const basePrice     = item.price || 0;
    const discountAmount = (basePrice * discount) / 100;
    return Math.max(0, basePrice - discountAmount);
  };

  // ─────────────────────────────────────────────────────────────
  // Submit — يُرسل للـ Backend
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError("برجاء إدخال جميع البيانات الشخصية");
      setLoading(false);
      return;
    }

    if (paymentMethod === "card") {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
        setError("برجاء إدخال جميع بيانات البطاقة");
        setLoading(false);
        return;
      }
      if (formData.cardNumber.replace(/\s/g, "").length !== 16) {
        setError("رقم البطاقة يجب أن يكون 16 رقم");
        setLoading(false);
        return;
      }
      if (formData.cvv.length !== 3) {
        setError("CVV يجب أن يكون 3 أرقام");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await paymentService.processPayment({
        itemId:        item.id,
        itemType,
        paymentMethod,
        promoCode:     promoApplied ? promoCode.trim() : null,
        totalAmount:   calculateTotal(),
      });

      const { orderId, redirectPath } = res.data.data;

      setSuccess(true);

      setTimeout(() => {
        navigate("/payment-success", {
          state: {
            item,
            itemType,
            total:       calculateTotal(),
            orderId,
            redirectPath,
          },
        });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "حدث خطأ في عملية الدفع. برجاء المحاولة مرة أخرى.";
      setError(msg);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────
  const getItemIcon = () => {
    if (itemType === "course") return <SchoolRounded sx={{ fontSize: 40, color: "white" }} />;
    if (itemType === "book") return <MenuBookRounded sx={{ fontSize: 40, color: "white" }} />;
    if (itemType === "assistant_activation") return <SupervisorAccount sx={{ fontSize: 40, color: "white" }} />;
    if (itemType === "parent_activation") return <FamilyRestroom sx={{ fontSize: 40, color: "white" }} />;
    return <SchoolRounded sx={{ fontSize: 40, color: "white" }} />;
  };

  const getItemGradient = () => {
    if (itemType === "assistant_activation") return GRADIENTS.assistant;
    if (itemType === "parent_activation") return GRADIENTS.parent;
    return item.gradient || GRADIENTS.blue;
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: GRADIENTS.main,
          color: "white",
          pt: 3,
          pb: 6,
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", mb: 3, "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
          >
            <ArrowForwardRounded />
          </IconButton>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>
              إتمام الشراء
            </Typography>
            <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9 }}>
              أنت على بعد خطوة واحدة من بدء رحلتك التعليمية
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: -3, position: "relative", zIndex: 2 }}>
        <Grid container spacing={3}>
          {/* ── Payment Form ── */}
          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <Card
                  elevation={0}
                  sx={{
                    mb: 3,
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 50, height: 50, borderRadius: 2,
                          background: GRADIENTS.blue,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <PersonRounded sx={{ fontSize: 28, color: "white" }} />
                      </Box>
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                        البيانات الشخصية
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField fullWidth required label="الاسم الكامل" name="fullName"
                          value={formData.fullName} onChange={handleInputChange}
                          sx={inputSx(darkMode)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required type="email" label="البريد الإلكتروني" name="email"
                          value={formData.email} onChange={handleInputChange}
                          sx={inputSx(darkMode)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label="رقم الهاتف" name="phone"
                          value={formData.phone} onChange={handleInputChange}
                          sx={inputSx(darkMode)} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card
                  elevation={0}
                  sx={{
                    mb: 3,
                    border: "1px solid",
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    bgcolor: darkMode ? "#1e293b" : "white",
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 50, height: 50, borderRadius: 2,
                          background: GRADIENTS.purple,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <CreditCardRounded sx={{ fontSize: 28, color: "white" }} />
                      </Box>
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                        طريقة الدفع
                      </Typography>
                    </Box>

                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {/* Card option */}
                          <PaymentOption
                            value="card"
                            selected={paymentMethod === "card"}
                            darkMode={darkMode}
                            onClick={() => setPaymentMethod("card")}
                            label={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CreditCardRounded sx={{ fontSize: 20 }} />
                                <Typography fontFamily="Cairo, sans-serif" fontWeight={600}>
                                  بطاقة ائتمان / خصم
                                </Typography>
                              </Box>
                            }
                          />
                          {/* Fawry option - مخفي لتفعيل المدرسين المساعدين وأولياء الأمور */}
                          {!isActivationItem(itemType) && (
                            <PaymentOption
                              value="fawry"
                              selected={paymentMethod === "fawry"}
                              darkMode={darkMode}
                              onClick={() => setPaymentMethod("fawry")}
                              label={
                                <Typography fontFamily="Cairo, sans-serif" fontWeight={600}>
                                  الدفع عند الاستلام (فوري / محافظ إلكترونية)
                                </Typography>
                              }
                            />
                          )}
                        </Box>
                      </RadioGroup>
                    </FormControl>

                    {/* Card Details */}
                    {paymentMethod === "card" && (
                      <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField fullWidth required label="رقم البطاقة" name="cardNumber"
                              value={formData.cardNumber} onChange={handleInputChange}
                              placeholder="1234 5678 9012 3456"
                              sx={inputSx(darkMode)} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField fullWidth required label="تاريخ الانتهاء" name="expiryDate"
                              value={formData.expiryDate} onChange={handleInputChange}
                              placeholder="MM/YY"
                              sx={inputSx(darkMode)} />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField fullWidth required label="CVV" name="cvv"
                              value={formData.cvv} onChange={handleInputChange}
                              placeholder="123" type="password"
                              sx={inputSx(darkMode)} />
                          </Grid>
                        </Grid>
                        <Box
                          sx={{
                            mt: 2, p: 2, borderRadius: 2,
                            bgcolor: darkMode ? "#0f172a" : "#f0f9ff",
                            display: "flex", alignItems: "center", gap: 1,
                          }}
                        >
                          <LockRounded sx={{ fontSize: 18, color: darkMode ? "#94a3b8" : "#0284c7" }} />
                          <Typography variant="caption" fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "#0284c7" }}>
                            جميع المعاملات مشفرة وآمنة بنسبة 100%
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Alerts */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3, fontFamily: "Cairo, sans-serif" }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 3, fontFamily: "Cairo, sans-serif" }}>
                    تمت عملية الشراء بنجاح! جاري التحويل...
                  </Alert>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || success}
                  startIcon={
                    loading
                      ? <CircularProgress size={20} color="inherit" />
                      : <ShoppingCartRounded />
                  }
                  sx={{
                    background: GRADIENTS.main,
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 900,
                    fontSize: "1.1rem",
                    py: 2,
                    borderRadius: 3,
                    boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)",
                    "&:hover": { boxShadow: "0 15px 40px rgba(37, 99, 235, 0.4)" },
                    "&.Mui-disabled": {
                      background: darkMode ? "#334155" : "#e5e7eb",
                      color: darkMode ? "#64748b" : "#94a3b8",
                    },
                  }}
                >
                  {loading
                    ? "جاري المعالجة..."
                    : success
                    ? "تم الشراء بنجاح"
                    : `ادفع الآن ${calculateTotal()} جنيه`}
                </Button>
              </form>
            </motion.div>
          </Grid>

          {/* ── Order Summary ── */}
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              {/* Item Card */}
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ background: getItemGradient(), p: 3, textAlign: "center" }}>
                  <Box
                    sx={{
                      width: 80, height: 80, borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      mx: "auto", mb: 2,
                    }}
                  >
                    {getItemIcon()}
                  </Box>
                  <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif"
                    sx={{ color: "white", mb: 1 }}>
                    {item.title}
                  </Typography>
                  {item.subject && (
                    <Chip label={item.subject} size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif" }} />
                  )}
                </Box>

                <CardContent sx={{ p: 3 }}>
                  {item.teacher && (
                    <Box
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        p: 1.5, borderRadius: 2,
                        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                        mb: 3,
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40, bgcolor: item.color }}>
                        {item.teacher.avatar
                          ? <img src={item.teacher.avatar} alt={item.teacher.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                          : <PersonRounded />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                          {item.teacher.name}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Price Breakdown */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <PriceLine darkMode={darkMode} label="السعر الأساسي" value={`${item.price} جنيه`} />
                    {item.oldPrice && (
                      <PriceLine darkMode={darkMode} label="الخصم" value={`-${item.oldPrice - item.price} جنيه`} valueColor="#059669" />
                    )}
                    {promoApplied && (
                      <PriceLine darkMode={darkMode} label={`كود الخصم (${discount}%)`}
                        value={`-${((item.price * discount) / 100).toFixed(0)} جنيه`} valueColor="#059669" />
                    )}
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                        الإجمالي
                      </Typography>
                      <Typography variant="h5" fontWeight={900} fontFamily="Cairo, sans-serif"
                        sx={{ color: item.color || "#2563eb" }}>
                        {calculateTotal()} جنيه
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Promo Code */}
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <LocalOfferRounded sx={{ fontSize: 20, color: darkMode ? "#94a3b8" : "#64748b" }} />
                    <Typography variant="body1" fontWeight={700} fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                      هل لديك كود خصم؟
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth size="small" placeholder="أدخل الكود"
                      value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                          borderRadius: 2, fontFamily: "Cairo, sans-serif",
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleApplyPromo}
                      disabled={promoApplied || !promoCode || promoLoading}
                      sx={{
                        borderColor: "#2563eb", color: "#2563eb",
                        fontFamily: "Cairo, sans-serif", fontWeight: 700, minWidth: 80,
                        "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                      }}
                    >
                      {promoLoading
                        ? <CircularProgress size={16} />
                        : promoApplied
                        ? <CheckCircleRounded />
                        : "تطبيق"}
                    </Button>
                  </Box>
                  {promoApplied && (
                    <Alert severity="success" sx={{ mt: 2, fontFamily: "Cairo, sans-serif", fontSize: "0.85rem" }}>
                      تم تطبيق كود الخصم بنجاح! خصم {discount}%
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Security Badge */}
              <Card
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ background: GRADIENTS.green, p: 3, textAlign: "center" }}>
                  <LockRounded sx={{ fontSize: 40, color: "white", mb: 1 }} />
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif"
                    sx={{ color: "white", mb: 0.5 }}>
                    دفع آمن 100%
                  </Typography>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif"
                    sx={{ color: "rgba(255,255,255,0.9)" }}>
                    جميع المعاملات مشفرة بالكامل
                  </Typography>
                </Box>
                <CardContent sx={{ p: 2, textAlign: "center" }}>
                  <Typography variant="caption" fontFamily="Cairo, sans-serif"
                    sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    جميع معلومات الدفع محمية ومشفرة
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const inputSx = (darkMode) => ({
  "& .MuiOutlinedInput-root": {
    bgcolor: darkMode ? "#0f172a" : "#f8fafc",
    borderRadius: 2,
    fontFamily: "Cairo, sans-serif",
  },
  "& .MuiInputLabel-root": { fontFamily: "Cairo, sans-serif" },
});

const PaymentOption = ({ value, selected, darkMode, onClick, label }) => (
  <Box
    onClick={onClick}
    sx={{
      p: 2,
      border: "2px solid",
      borderColor: selected ? "#2563eb" : darkMode ? "#334155" : "#e5e7eb",
      borderRadius: 2,
      bgcolor: selected
        ? darkMode ? "rgba(37, 99, 235, 0.1)" : "#eff6ff"
        : "transparent",
      cursor: "pointer",
      transition: "all 0.2s ease",
    }}
  >
    <FormControlLabel
      value={value}
      control={<Radio checked={selected} onChange={() => {}} />}
      label={label}
      sx={{ "& .MuiFormControlLabel-label": { fontFamily: "Cairo, sans-serif" } }}
    />
  </Box>
);

const PriceLine = ({ darkMode, label, value, valueColor }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="body2" fontFamily="Cairo, sans-serif"
      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
      {label}
    </Typography>
    <Typography variant="body1" fontWeight={600} fontFamily="Cairo, sans-serif"
      sx={{ color: valueColor || (darkMode ? "#f1f5f9" : "#1e293b") }}>
      {value}
    </Typography>
  </Box>
);

export default CheckoutPage;