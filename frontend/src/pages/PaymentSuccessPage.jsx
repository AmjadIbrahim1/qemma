// frontend/src/pages/PaymentSuccessPage.jsx

import { useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  CheckCircleRounded,
  SchoolRounded,
  MenuBookRounded,
  ArrowForwardRounded,
  HomeRounded,
  SupervisorAccount,
  FamilyRestroom,
} from "@mui/icons-material";
import ThemeContext from "../contexts/ThemeContext";

const GRADIENTS = {
  main:  "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  green: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  blue:  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
};

const PaymentSuccessPage = () => {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { darkMode } = useContext(ThemeContext);

  const { item, itemType, total, orderId, redirectPath } = location.state || {};

  // لو وصل للصفحة بدون بيانات — رجّعه للرئيسية
  useEffect(() => {
    if (!orderId) {
      navigate("/");
    }
  }, [orderId, navigate]);

  if (!orderId) return null;

  const isBook = itemType === "book";
  const isAssistantActivation = itemType === "assistant_activation";
  const isParentActivation = itemType === "parent_activation";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        >
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 4,
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            {/* Header gradient */}
            <Box sx={{ background: GRADIENTS.green, p: 5 }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    bgcolor: "rgba(255,255,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircleRounded sx={{ fontSize: 56, color: "white" }} />
                </Box>
              </motion.div>

              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
                sx={{ color: "white", mb: 1 }}
              >
                تمت عملية الشراء بنجاح! 🎉
              </Typography>
              <Typography
                variant="body1"
                fontFamily="Cairo, sans-serif"
                sx={{ color: "rgba(255,255,255,0.9)" }}
              >
                {isAssistantActivation
                  ? "تم تفعيل المدرس المساعد بنجاح 🎉"
                  : isParentActivation
                  ? "تم تفعيل ولي الأمر بنجاح 🎉"
                  : `يمكنك الآن الوصول إلى ${isBook ? "الكتاب" : "الكورس"} فوراً`}
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Order Details */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                  mb: 3,
                  textAlign: "right",
                }}
              >
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  fontWeight={700}
                  sx={{ color: darkMode ? "#94a3b8" : "#64748b", mb: 2 }}
                >
                  تفاصيل الطلب
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {/* Item */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {isBook
                        ? <MenuBookRounded sx={{ fontSize: 18, color: "#7c3aed" }} />
                        : <SchoolRounded   sx={{ fontSize: 18, color: "#2563eb" }} />}
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", fontWeight: 600 }}
                      >
                        {item?.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={isBook ? "كتاب" : "كورس"}
                      size="small"
                      sx={{
                        bgcolor: isBook ? "#7c3aed15" : "#2563eb15",
                        color:   isBook ? "#7c3aed"   : "#2563eb",
                        fontFamily: "Cairo, sans-serif",
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Divider />

                  {/* Order ID */}
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                    >
                      رقم الطلب
                    </Typography>
                    <Typography
                      variant="caption"
                      fontFamily="Cairo, sans-serif"
                      fontWeight={700}
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      {orderId}
                    </Typography>
                  </Box>

                  {/* Amount */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                    >
                      المبلغ المدفوع
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: "#059669" }}
                    >
                      {total} جنيه
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={isBook ? <MenuBookRounded /> : isAssistantActivation ? <SupervisorAccount /> : <SchoolRounded />}
                  onClick={() => navigate(redirectPath || (isBook ? "/student/books" : isAssistantActivation ? "/teacher/assistant-teachers" : "/student/courses"))}
                  sx={{
                    background: GRADIENTS.main,
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 900,
                    fontSize: "1rem",
                    py: 1.8,
                    borderRadius: 3,
                    boxShadow: "0 10px 30px rgba(37, 99, 235, 0.3)",
                    "&:hover": { boxShadow: "0 15px 40px rgba(37, 99, 235, 0.4)" },
                  }}
                >
                  {isBook ? "اذهب للكتاب الآن" : isAssistantActivation ? "العودة للمدرسين المساعدين" : "ابدأ الكورس الآن"}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HomeRounded />}
                  onClick={() => navigate(isAssistantActivation ? "/teacher/dashboard" : "/student/dashboard")}
                  sx={{
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                    color: darkMode ? "#94a3b8" : "#64748b",
                    fontFamily: "Cairo, sans-serif",
                    fontWeight: 700,
                    borderRadius: 3,
                    "&:hover": {
                      borderColor: "#2563eb",
                      color: "#2563eb",
                    },
                  }}
                >
                  الذهاب للوحة التحكم
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
};

export default PaymentSuccessPage;