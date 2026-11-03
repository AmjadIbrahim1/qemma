// frontend/src/components/landing/WhyQemma/WhyQemmaSection.jsx
import { motion } from 'framer-motion';
import styles from './whyQemmaSection.module.css';
import { FEATURES } from '../../../data/landingData.jsx';

const WhyQemmaSection = () => {
  return (
    <section className={styles.section} dir="rtl" id="features">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        {/* HEADER */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={styles.title}>ليه تختار قِمّة؟</h2>
          <p className={styles.subtitle}>
            لأننا مش مجرد منصة تعليمية
            <br />
            إحنا شريكك لحد يوم النتيجة
          </p>
        </motion.div>

        {/* FEATURES */}
        <div className={styles.grid}>
          {FEATURES.map((item, index) => (
            <motion.div
              key={index}
              className={styles.card}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className={styles.icon}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDesc}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyQemmaSection;