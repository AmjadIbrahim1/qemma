// frontend/src/components/landing/ChatBot/ChatBotSection.jsx
import { Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LockIcon from '@mui/icons-material/Lock';
import { motion } from 'framer-motion';
import styles from './chatBot.module.css';

const ChatBotSection = () => {
  return (
    <section className={styles.section} dir="rtl" id="chat">
      <div className={styles.bgPattern} />
      <div className={styles.topFade} />

      <div className={styles.container}>
        {/* LEFT CONTENT */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className={styles.title}>الشات بوت الذكي</h2>

          <p className={styles.desc}>
            اسأل عن أي درس، فكرة، مسألة،
            أو امتحان في أي وقت.
            الشات مبني مخصوص علشان
            يساعدك تفهم مش تحفظ.
          </p>

          <p className={styles.note}>🔒 متاح بعد تسجيل الدخول</p>

          <Button
            variant="contained"
            size="large"
            disableElevation
            sx={{
              width: 'fit-content',
              px: 5,
              borderRadius: '999px',
              fontWeight: 900,
              fontFamily: 'Cairo, sans-serif',
              background:
                'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
              '&:hover': {
                background:
                  'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
              },
            }}
          >
            أنشئ حسابك الآن
          </Button>
        </motion.div>

        {/* RIGHT CHAT PREVIEW */}
        <motion.div
          className={styles.chatWrapper}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <div className={styles.chatBox}>
            {/* HEADER */}
            <div className={styles.chatHeader}>
              <SmartToyIcon fontSize="small" />
              شات قِمّة
            </div>

            {/* BODY */}
            <div className={styles.chatBody}>
              <div className={`${styles.message} ${styles.bot}`}>
                👋 أهلاً! محتاج مساعدة في أي مادة؟
              </div>

              <div className={styles.message}>عايز أفهم قوانين الفيزياء</div>

              <div className={`${styles.message} ${styles.bot}`}>
                تمام 👌 خلينا نبدأ واحدة واحدة
              </div>

              {/* INPUT */}
              <div className={styles.inputWrapper}>
                <div className={styles.overlay}>
                  <LockIcon fontSize="small" />
                  سجّل الدخول لاستخدام الشات
                </div>

                <input
                  disabled
                  placeholder="اكتب سؤالك هنا..."
                  className={styles.input}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ChatBotSection;