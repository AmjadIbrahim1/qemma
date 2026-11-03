// frontend/src/components/landing/CoursesSection/CoursesSection.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CoursesSection.module.css';
import CourseCard from './CourseCard';
import coursesService from '../../../services/courses.service';

const CoursesSection = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    coursesService.getPublishedCourses({ limit: 6, sort: 'rating' })
      .then((res) => {
        const data = res.data?.data?.courses ?? [];
        setCourses(data);
      })
      .catch(() => setCourses([]));
  }, []);

  const handleViewAllCourses = () => {
    navigate('/courses');
  };

  return (
    <section className={styles.section} id="courses" dir="rtl">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.coursesContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>المواد الدراسية</h2>

          <button 
            onClick={handleViewAllCourses}
            className={styles.link}
            style={{ cursor: 'pointer' }}
          >
            عرض كل الكورسات <span aria-hidden>←</span>
          </button>
        </div>

        <div className={styles.grid}>
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;