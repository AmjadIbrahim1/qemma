// frontend/src/components/landing/FinalCTA/FinalCTA.jsx
import styles from "./FinalCTA.module.css";
import { Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
const FinalCTA = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getDashboardPath = (role) =>
    ({
      teacher: "/teacher/dashboard",
      assistant_teacher: "/teacher/dashboard",
      student: "/student/dashboard",
      parent: "/parent/dashboard",
    })[role] || "/";
  return (
    <section className={styles.section} dir="rtl" id="final-cta">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        <div className={styles.box}>
          <h2 className={styles.title}>جاهز تبدأ؟</h2>

          <p className={styles.subtitle}>ابدأ دلوقتي وخلي السنة دي مختلفة</p>

          {!user ? (
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              disableElevation
              sx={{
                borderRadius: "999px",
                padding: "12px 36px",
                fontWeight: 900,
                fontSize: "1.05rem",
                fontFamily: "Cairo, sans-serif",
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)",
                },
              }}
            >
              أنشئ حسابك الآن
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              disableElevation
              onClick={() => {
                console.log("User role:", user.role);
                console.log("Path:", getDashboardPath(user.role));
                navigate(getDashboardPath(user.role));
              }}
              sx={{
                borderRadius: "999px",
                padding: "12px 36px",
                fontWeight: 900,
                fontSize: "1.05rem",
                fontFamily: "Cairo, sans-serif",
                background:
                  "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)",
                },
              }}
            >
              الذهاب للوحة التحكم
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
