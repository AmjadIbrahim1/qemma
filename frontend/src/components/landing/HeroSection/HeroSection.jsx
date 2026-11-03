// frontend/src/components/landing/HeroSection/HeroSection.jsx
import { Button, Typography, Box } from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "./HeroSection.module.css";
import { useAuth } from "../../../hooks/useAuth";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className={styles.section} dir="rtl">
      <div className={styles.bgPattern} />
      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Typography
            variant="h2"
            fontWeight={900}
            className={styles.title}
            sx={{ mt: 0, mb: 4, fontFamily: "Cairo, sans-serif" }}
          >
            <Box sx={{ display: "inline" }}>
              تعلّم بذكاء…
              <br />
              وحقق أعلى نتيجة مع <span className={styles.brand}>قِمّة</span>
            </Box>
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Typography
            className={styles.desc}
            sx={{ mt: 0, mb: 6, fontFamily: "Cairo, sans-serif" }}
          >
            منصة تعليمية ذكية لطلاب الثانوية العامة بتجمع بين الشرح العميق،
            التدريب الحقيقي، والمتابعة المستمرة لحد يوم النتيجة.
          </Typography>
        </motion.div>

        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            component={Link}
            to="/start-journey"
            variant="contained"
            size="large"
            disableElevation
            className={styles.cta}
            sx={{
              fontFamily: "Cairo, sans-serif",
              fontWeight: 900,
              borderRadius: "999px",
              px: { xs: 5, md: 7 },
              py: 1.6,
              fontSize: "1rem",
              color: "#fff",
              background:
                "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
              boxShadow: "0 10px 30px -8px rgba(124, 58, 237, 0.55)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)",
                transform: "translateY(-2px)",
                boxShadow: "0 14px 34px -8px rgba(124, 58, 237, 0.65)",
              },
            }}
          >
            {user ? "ابدأ الآن 🚀" : "ابدأ رحلتك التعليمية"}
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;