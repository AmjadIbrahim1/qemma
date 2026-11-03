// frontend/src/components/landing/TopStudents/TopStudentsSection.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StudentRow from './StudentRow';
import styles from './topStudents.module.css';
import studentsService from '../../../services/students.service';

const STREAMS = ['علمي رياضة', 'علمي علوم', 'أدبي'];

const TopStudentsSection = () => {
  const [topStudents, setTopStudents] = useState({});

  useEffect(() => {
    studentsService.getTopAchievers()
      .then((res) => setTopStudents(res.data?.data ?? {}))
      .catch(() => setTopStudents({}));
  }, []);

  return (
    <section className={styles.section} id="top-students" dir="rtl">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>أوائل قِمّة</h2>
          <p className={styles.subtitle}>طلاب أثبتوا تميزهم وحققوا أعلى النتائج معنا.</p>
        </motion.div>

        <div className={styles.grid}>
          {STREAMS.map((stream, si) => (
            <motion.div
              key={stream}
              className={styles.group}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 + si * 0.07 }}
            >
              <div className={styles.groupHeader}>
                <div>
                  <h3 className={styles.streamTitle}>{stream}</h3>
                  <div className={styles.streamMeta}>أفضل 10 طلاب</div>
                </div>
              </div>

              <div className={styles.list}>
                {(topStudents[stream] || []).slice(0, 10).map((student, index) => (
                  <StudentRow key={student.id || `${student.name}-${index}`} student={student} rank={student.rank || index + 1} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopStudentsSection;