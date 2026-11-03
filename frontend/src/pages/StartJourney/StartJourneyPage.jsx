// pages/StartJourneyPage.jsx
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  SchoolRounded,
  MenuBookRounded,
  QuizRounded,
  ArrowBackRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  pink: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
};

const JOURNEY_OPTIONS = [
  {
    id: 1,
    title: "الكورسات التعليمية",
    description: "دروس مشروحة بالفيديو مع أفضل المدرسين في كل المواد",
    icon: SchoolRounded,
    gradient: GRADIENTS.blue,
    color: "#2563eb",
    path: "/courses",
    features: ["فيديوهات عالية الجودة", "شرح تفصيلي", "متابعة التقدم"],
  },
  {
    id: 2,
    title: "كتب المدرسين",
    description: "ملخصات ومذكرات من أفضل مدرسي الثانوية العامة",
    icon: MenuBookRounded,
    gradient: GRADIENTS.purple,
    color: "#7c3aed",
    path: "/teachers-books",
    features: ["ملخصات شاملة", "مذكرات PDF", "مراجعات نهائية"],
  },
  {
    id: 3,
    title: "الاختبارات والتدريبات",
    description: "اختبارات تفاعلية على نمط امتحانات الثانوية العامة",
    icon: QuizRounded,
    gradient: GRADIENTS.pink,
    color: "#db2777",
    path: "/exams",
    features: ["اختبارات شهرية", "نماذج امتحانات", "تصحيح فوري"],
  },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const StartJourneyPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: darkMode
          ? "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)"
          : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        py: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: darkMode
            ? "radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)"
            : "radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: "center", mb: 8 }}>
            <Typography
              variant="h2"
              fontWeight={900}
              fontFamily="Cairo, sans-serif"
              sx={{
                background: GRADIENTS.main,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              اختر رحلتك التعليمية
            </Typography>
            <Typography
              variant="h6"
              fontFamily="Cairo, sans-serif"
              sx={{
                color: darkMode ? "#94a3b8" : "#64748b",
                maxWidth: 600,
                mx: "auto",
              }}
            >
              منصة قِمّة بتوفرلك كل اللي محتاجه عشان تتفوق في الثانوية العامة
            </Typography>
          </Box>
        </motion.div>

        {/* Options Grid */}
        <Grid container spacing={4} justifyContent="center">
          {JOURNEY_OPTIONS.map((option, index) => {
            const Icon = option.icon;
            return (
              <Grid item xs={12} md={4} key={option.id}>
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    onClick={() => navigate(option.path)}
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 4,
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: option.color,
                        boxShadow: `0 20px 60px ${option.color}30`,
                        transform: "translateY(-5px)",
                      },
                    }}
                  >
                    {/* Gradient Header */}
                    <Box
                      sx={{
                        background: option.gradient,
                        p: 4,
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Decorative Circles */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -30,
                          right: -30,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.1)",
                        }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -40,
                          left: -40,
                          width: 120,
                          height: 120,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.08)",
                        }}
                      />

                      {/* Icon */}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 2,
                          position: "relative",
                          zIndex: 1,
                        }}
                      >
                        <Icon sx={{ fontSize: 44, color: "white" }} />
                      </Box>

                      <Typography
                        variant="h5"
                        fontWeight={800}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: "white", position: "relative", zIndex: 1 }}
                      >
                        {option.title}
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="body1"
                        fontFamily="Cairo, sans-serif"
                        sx={{
                          color: darkMode ? "#94a3b8" : "#64748b",
                          textAlign: "center",
                          mb: 3,
                          lineHeight: 1.8,
                        }}
                      >
                        {option.description}
                      </Typography>

                      {/* Features */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1.5,
                        }}
                      >
                        {option.features.map((feature, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: darkMode
                                ? "#334155"
                                : `${option.color}08`,
                            }}
                          >
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: option.color,
                              }}
                            />
                            <Typography
                              variant="body2"
                              fontFamily="Cairo, sans-serif"
                              fontWeight={600}
                              sx={{ color: darkMode ? "#e2e8f0" : "#475569" }}
                            >
                              {feature}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* CTA Button */}
                      <Box
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: 2,
                          background: option.gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: "scale(1.02)",
                          },
                        }}
                      >
                        <Typography
                          variant="body1"
                          fontWeight={700}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: "white" }}
                        >
                          استكشف الآن
                        </Typography>
                        <ArrowBackRounded sx={{ color: "white" }} />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography
              variant="body1"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
            >
              🎓 انضم لآلاف الطلاب اللي حققوا أحلامهم مع قِمّة
            </Typography>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default StartJourneyPage;
