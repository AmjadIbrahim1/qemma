// frontend/src/components/landing/CoursesSection/CourseCard.jsx
import styles from './CoursesSection.module.css';

import { Button } from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded';
// import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import { motion } from 'framer-motion';

const CourseCard = ({ course, index }) => {
  if (!course) return null;

  const image = course.image || course.thumbnail || '';
  const title = course.title;
  const price = typeof course.price === 'number'
    ? `${course.price} جنيه`
    : course.price || 'مجاني';
  const teacherName = course.teacher?.name || course.teacher || '';
  const stream = course.stream || course.category || '';
  const studentsCount = course.students || course.stats?.enrollments || 0;

  return (
    <motion.article
      dir="rtl"
      className={styles.card}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
    >
      <div className={styles.media}>
        <img
          src={image}
          alt={title}
          className={styles.image}
          loading="lazy"
        />

        <div className={styles.priceBadge}>{price}</div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.courseTitle} title={title}>
          {title}
        </h3>

        <div className={styles.teacherRow}>
          <PersonOutlineRoundedIcon fontSize="small" className={styles.iconMuted} />
          <span className={styles.teacherText}>{teacherName}</span>
        </div>

        <div className={styles.stream}>{stream}</div>

        <div className={styles.metaRow}>
          <Groups2RoundedIcon fontSize="small" className={styles.iconMuted} />
          <span>{studentsCount} طالب</span>

          <span className={styles.dot} />

          <span className={styles.levelPill}>ثانوية عامة</span>
        </div>

        <div className={styles.actions}>
          <Button
            variant="contained"
            fullWidth
            // endIcon={<ArrowBackIosNewRoundedIcon />}
            disableElevation
            sx={{
              fontFamily: 'Cairo, sans-serif',
              fontWeight: 900,
              borderRadius: 2,
              py: 1.15,
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
              },
            }}
          >
             اشترك الآن  
          </Button>
        </div>
      </div>
    </motion.article>
  );
};

export default CourseCard;