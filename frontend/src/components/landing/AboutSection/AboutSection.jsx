// frontend/src/components/landing/AboutSection/AboutSection.jsx
import styles from './AboutSection.module.css';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
const AboutSection = () => {
  return (
    <section className={styles.section} dir="rtl" id="about">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.title}>من نحن؟</h2>

          <p className={styles.text}>
            قِمّة هي منصة تعليمية مبتكرة لطلاب الثانوية العامة في مصر. نقدم تجربة تعلم فريدة
            تجمع بين الشرح العميق والتدريب الفعّال. مع قِمّة، يستطيع الطلاب فهم المواد بشكل
            أفضل، وتنمية مهاراتهم استعدادًا للامتحانات.
          </p>
        </div>

        {/* CTA */}
        <div className={styles.ctaWrap}>
          <p className={styles.ctaText}>جرب منصتنا الآن وابدأ رحلتك نحو النجاح.</p>

          <Button
          component={Link}
                      to="/start-journey"
            variant="contained"
            size="large"
            disableElevation
            sx={{
              borderRadius: '999px',
              padding: '12px 36px',
              fontWeight: 900,
              fontSize: '1.05rem',
              fontFamily: 'Cairo, sans-serif',
              background:
                'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
              '&:hover': {
                background:
                  'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
              },
            }}
          >
            ابدأ الآن
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;