// frontend/src/components/landing/HowItWorks/HowItWorks.jsx
import { motion } from 'framer-motion';
import styles from './howItWorks.module.css';
import {STEPS} from '../../../data/landingData';


const HowItWorksSection = () => {
  return (
    <section className={styles.section} dir="rtl" id="how-it-works">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={styles.title}>كيف قِمّة بتسهل عليك؟</h2>
          <p className={styles.subtitle}>
            خطواتنا بتساعدك تتعلم بأسرع طريقة ممكنة وتخليك دايمًا في المقدمة.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {STEPS.map((item, index) => (
            <motion.div
              key={index}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className={styles.icon}>{item.icon}</div>
              <h3 className={styles.stepTitle}>{item.title}</h3>
              <p className={styles.stepDesc}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;