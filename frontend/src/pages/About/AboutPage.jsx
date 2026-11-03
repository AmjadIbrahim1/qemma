// frontend/src/pages/About/AboutPage.jsx
import { motion } from 'framer-motion';
import { Typography, Container, Box } from '@mui/material';
import { 
  School, 
  Groups, 
  EmojiEvents, 
  Verified,
  Assessment,
  Quiz,
  Email,
  WhatsApp,
  Telegram,
  Science,
  MenuBook,
  Language,
  WorkspacePremium,
  LocalFireDepartment,
  Star,
  GpsFixed,
  AutoStories,
  RocketLaunch,
  Schedule,
  QuestionAnswer,
  TrendingUp,
  Security,
  Gavel,
  Person,
  Payment,
  HistoryEdu,
  SupportAgent,
  CheckCircle
} from '@mui/icons-material';
import styles from './AboutPage.module.css';
import useScrollToHash from '../../hooks/useScrollToHash';

const AboutPage = () => {
  useScrollToHash();

  return (
    <div className={styles.page} dir="rtl">
      {/* ========================================
          Hero + About Us Combined Section
          ======================================== */}
      <section id="about-us" className={styles.heroSection}>
        <div className={styles.bgPattern} />
        <div className={styles.floatingOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={styles.heroContent}
          >
            <div className={styles.heroIconWrapper}>
              <School className={styles.heroIcon} />
            </div>
            <Typography
              variant="h2"
              className={styles.heroTitle}
              sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 900 }}
            >
              عن <span className={styles.brand}>قِمّة</span>
            </Typography>
            <Typography
              className={styles.heroDesc}
              sx={{ fontFamily: 'Cairo, sans-serif' }}
            >
              منصة تعليمية متكاملة صُممت خصيصاً لطلاب الثانوية العامة في مصر
            </Typography>
          </motion.div>

          {/* About Content inside Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={styles.aboutContent}
          >
            <div className={styles.aboutCard}>
              <p className={styles.paragraph}>
                قِمّة هي منصة تعليمية مصرية متخصصة في تقديم محتوى تعليمي عالي الجودة 
                لطلاب الثانوية العامة. نؤمن بأن كل طالب يستحق فرصة متساوية للتعلم 
                والتفوق، ولذلك نسعى لتقديم تجربة تعليمية فريدة تجمع بين التكنولوجيا 
                الحديثة وأفضل المعلمين.
              </p>
              
              <p className={styles.paragraph}>
                تأسست قِمّة بهدف واحد: مساعدة الطلاب على تحقيق أحلامهم والوصول 
                لأعلى الدرجات. نقدم شروحات تفصيلية، تدريبات عملية، ومتابعة مستمرة 
                لضمان فهم كل طالب للمادة العلمية.
              </p>
            </div>

            <div className={styles.statsGrid}>
              <motion.div 
                className={styles.statCard}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.statIconWrapper}>
                  <AutoStories className={styles.statIcon} />
                </div>
                <span className={styles.statNumber}>50+</span>
                <span className={styles.statLabel}>كورس متاح</span>
              </motion.div>
              <motion.div 
                className={styles.statCard}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.statIconWrapper}>
                  <Groups className={styles.statIcon} />
                </div>
                <span className={styles.statNumber}>10,000+</span>
                <span className={styles.statLabel}>طالب مسجل</span>
              </motion.div>
              <motion.div 
                className={styles.statCard}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.statIconWrapper}>
                  <TrendingUp className={styles.statIcon} />
                </div>
                <span className={styles.statNumber}>95%</span>
                <span className={styles.statLabel}>نسبة النجاح</span>
              </motion.div>
              <motion.div 
                className={styles.statCard}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className={styles.statIconWrapper}>
                  <Verified className={styles.statIcon} />
                </div>
                <span className={styles.statNumber}>30+</span>
                <span className={styles.statLabel}>معلم متميز</span>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ========================================
          Courses Section
          ======================================== */}
      <section id="courses" className={styles.section}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <MenuBook className={styles.sectionIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                الكورسات
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  نقدم مجموعة شاملة من الكورسات التي تغطي جميع مواد الثانوية العامة 
                  بنظاميها العلمي والأدبي. كل كورس مصمم بعناية ليناسب مستوى الطالب 
                  ويساعده على التقدم خطوة بخطوة.
                </p>
              </div>

              <div className={styles.coursesList}>
                <motion.div 
                  className={`${styles.courseCategory} ${styles.scienceCategory}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.categoryIconWrapper}>
                    <Science className={styles.categoryIcon} />
                  </div>
                  <h4>المواد العلمية</h4>
                  <ul>
                    <li><CheckCircle className={styles.listIcon} /> الرياضيات البحتة والتطبيقية</li>
                    <li><CheckCircle className={styles.listIcon} /> الفيزياء</li>
                    <li><CheckCircle className={styles.listIcon} /> الكيمياء</li>
                    <li><CheckCircle className={styles.listIcon} /> الأحياء</li>
                  </ul>
                </motion.div>
                
                <motion.div 
                  className={`${styles.courseCategory} ${styles.literaryCategory}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.categoryIconWrapper}>
                    <HistoryEdu className={styles.categoryIcon} />
                  </div>
                  <h4>المواد الأدبية</h4>
                  <ul>
                    <li><CheckCircle className={styles.listIcon} /> اللغة العربية</li>
                    <li><CheckCircle className={styles.listIcon} /> اللغة الإنجليزية</li>
                    <li><CheckCircle className={styles.listIcon} /> التاريخ</li>
                    <li><CheckCircle className={styles.listIcon} /> الجغرافيا</li>
                  </ul>
                </motion.div>
                
                <motion.div 
                  className={`${styles.courseCategory} ${styles.commonCategory}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.categoryIconWrapper}>
                    <Language className={styles.categoryIcon} />
                  </div>
                  <h4>مواد مشتركة</h4>
                  <ul>
                    <li><CheckCircle className={styles.listIcon} /> اللغة الفرنسية</li>
                    <li><CheckCircle className={styles.listIcon} /> اللغة الألمانية</li>
                    <li><CheckCircle className={styles.listIcon} /> الفلسفة والمنطق</li>
                    <li><CheckCircle className={styles.listIcon} /> علم النفس والاجتماع</li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ========================================
          Teachers Section
          ======================================== */}
      <section id="teachers" className={`${styles.section} ${styles.altBg}`}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <School className={styles.sectionIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                المدرسين
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  نفخر بفريق من أفضل المعلمين في مصر، كل معلم لديه خبرة طويلة في 
                  تدريس الثانوية العامة وسجل حافل بالنجاحات. معلمونا ليسوا فقط 
                  خبراء في موادهم، بل هم أيضاً ماهرون في إيصال المعلومة بأبسط طريقة.
                </p>
              </div>

              <div className={styles.featuresGrid}>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <WorkspacePremium className={styles.featureIcon} />
                  </div>
                  <h4>خبرة عالية</h4>
                  <p>جميع معلمينا لديهم خبرة لا تقل عن 10 سنوات في تدريس الثانوية العامة</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <AutoStories className={styles.featureIcon} />
                  </div>
                  <h4>منهج متكامل</h4>
                  <p>شرح كامل للمنهج مع التركيز على الأسئلة المهمة والمتوقعة في الامتحانات</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <SupportAgent className={styles.featureIcon} />
                  </div>
                  <h4>تواصل مستمر</h4>
                  <p>إمكانية التواصل مع المعلم للرد على جميع الاستفسارات في أي وقت</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>


         {/* ========================================
          نظام التقييم والمتابعة
          ======================================== */}
      <section id="tracking" className={`${styles.section} ${styles.altBg}`}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.featureHeader}>
              <div className={styles.featureIconLarge}>
                <Assessment className={styles.featureMainIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                نظام التقييم والمتابعة
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  نظام متكامل لمتابعة مستوى الطالب وتقدمه في كل مادة. نقدم تقارير 
                  تفصيلية عن نقاط القوة والضعف، مع توصيات مخصصة لتحسين الأداء.
                  كل ده عشان تعرف فين أنت بالظبط وإيه اللي محتاج تركز عليه.
                </p>
                <p className={styles.paragraph}>
                  المدرس يقدر يتابع أداء كل طالب بشكل فردي، ويشوف مين محتاج مساعدة أكتر.
                  كمان المساعد (Assistant) بيساعد في تصحيح الواجبات والرد على استفسارات الطلاب،
                  عشان المدرس يركز على الشرح والتوجيه.
                </p>
              </div>

              <div className={styles.featuresGrid}>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <TrendingUp className={styles.featureIcon} />
                  </div>
                  <h4>تتبع التقدم</h4>
                  <p>شوف تقدمك في كل مادة بشكل مرئي وواضح مع رسوم بيانية تفاعلية توضح مستواك</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <Groups className={styles.featureIcon} />
                  </div>
                  <h4>متابعة المدرس والمساعد</h4>
                  <p>المدرس بيتابع أداءك والمساعد بيصحح واجباتك ويرد على أسئلتك بسرعة</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <Assessment className={styles.featureIcon} />
                  </div>
                  <h4>تقارير الاختبارات</h4>
                  <p>بعد كل اختبار تقرير مفصل بنقاط ضعفك واقتراحات دروس تراجعها</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ========================================
          نظام Gamification
          ======================================== */}
      <section id="gamification" className={styles.section}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.featureHeader}>
              <div className={styles.featureIconLarge}>
                <EmojiEvents className={styles.featureMainIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                نظام Gamification
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  التعلم مش لازم يكون ممل! نظام الـ Gamification بتاعنا بيحول 
                  رحلتك التعليمية لمغامرة ممتعة. اجمع نقاط، اكسب شارات، ونافس 
                  زملاءك على المراكز الأولى. كل إنجاز بتحققه بيقربك أكتر من هدفك!
                </p>
              </div>

              <div className={styles.featuresGrid}>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <EmojiEvents className={styles.featureIcon} />
                  </div>
                  <h4>منافسة عامة</h4>
                  <p>نافس جميع طلاب مصر في تحديات أسبوعية وشهرية واكسب جوائز قيمة ومنح دراسية</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <GpsFixed className={styles.featureIcon} />
                  </div>
                  <h4>مسابقات أسبوعية</h4>
                  <p>نافس على جوائز قيمة كل أسبوع واحصل على مكافآت حقيقية ومميزات إضافية</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <TrendingUp className={styles.featureIcon} />
                  </div>
                  <h4>قائمة المتصدرين</h4>
                  <p>شوف ترتيبك بين الطلاب واطلع في الرتب من مبتدئ لخبير واحصل على شارات</p>
                </motion.div>
              </div>

              <div className={styles.badgesShowcase}>
                <h4>الشارات والإنجازات</h4>
                <div className={styles.badgesList}>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <WorkspacePremium className={styles.badgeIcon} />
                    </div>
                    <p>المتفوق</p>
                  </motion.div>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <LocalFireDepartment className={styles.badgeIcon} />
                    </div>
                    <p>7 أيام متتالية</p>
                  </motion.div>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <Star className={styles.badgeIcon} />
                    </div>
                    <p>100 سؤال</p>
                  </motion.div>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <GpsFixed className={styles.badgeIcon} />
                    </div>
                    <p>دقة عالية</p>
                  </motion.div>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <AutoStories className={styles.badgeIcon} />
                    </div>
                    <p>5 كورسات</p>
                  </motion.div>
                  <motion.div 
                    className={styles.badgeItem}
                    whileHover={{ scale: 1.1, y: -5 }}
                  >
                    <div className={styles.badgeIconWrapper}>
                      <RocketLaunch className={styles.badgeIcon} />
                    </div>
                    <p>البداية القوية</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ========================================
          الاختبارات الشهرية
          ======================================== */}
      <section id="monthly-tests" className={`${styles.section} ${styles.altBg}`}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.featureHeader}>
              <div className={styles.featureIconLarge}>
                <Quiz className={styles.featureMainIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                الاختبارات الشهرية
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  اختبارات شهرية شاملة تحاكي امتحانات الثانوية العامة الفعلية. 
                  تدرب على ضغط الوقت، واكتسب خبرة حقيقية قبل يوم الامتحان.
                  كل اختبار مصمم بعناية من أفضل المعلمين عشان يغطي كل أجزاء المنهج.
                </p>
              </div>

              <div className={styles.featuresGrid}>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <Quiz className={styles.featureIcon} />
                  </div>
                  <h4>أسئلة متنوعة</h4>
                  <p>اختيار من متعدد، صح وخطأ، ومقالي - زي الامتحان بالظبط عشان تتعود</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <Assessment className={styles.featureIcon} />
                  </div>
                  <h4>تقرير تفصيلي</h4>
                  <p>تحليل شامل لإجاباتك ونقاط التحسين مع الإجابات النموذجية وشرح لكل سؤال</p>
                </motion.div>
                <motion.div 
                  className={styles.featureItem}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.featureIconWrapper}>
                    <EmojiEvents className={styles.featureIcon} />
                  </div>
                  <h4>مقارنة بالآخرين</h4>
                  <p>شوف ترتيبك بين الطلاب واعرف مستواك الحقيقي مقارنة بزملاءك</p>
                </motion.div>
              </div>

              <div className={styles.testSchedule}>
                <h4>جدول الاختبارات</h4>
                <div className={styles.scheduleList}>
                  <motion.div 
                    className={styles.scheduleItem}
                    whileHover={{ x: -5 }}
                  >
                    <div className={styles.scheduleIconWrapper}>
                      <Science className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <h5>اختبار الرياضيات</h5>
                      <p>كل شهر - الأسبوع الأول</p>
                    </div>
                    <div className={styles.scheduleDetails}>
                      <span><Schedule sx={{ fontSize: 14 }} /> 120 دقيقة</span>
                      <span><Quiz sx={{ fontSize: 14 }} /> 50 سؤال</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className={styles.scheduleItem}
                    whileHover={{ x: -5 }}
                  >
                    <div className={styles.scheduleIconWrapper}>
                      <Science className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <h5>اختبار الفيزياء</h5>
                      <p>كل شهر - الأسبوع الثاني</p>
                    </div>
                    <div className={styles.scheduleDetails}>
                      <span><Schedule sx={{ fontSize: 14 }} /> 90 دقيقة</span>
                      <span><Quiz sx={{ fontSize: 14 }} /> 40 سؤال</span>
                    </div>
                  </motion.div>
                  <motion.div 
                    className={styles.scheduleItem}
                    whileHover={{ x: -5 }}
                  >
                    <div className={styles.scheduleIconWrapper}>
                      <Science className={styles.scheduleIcon} />
                    </div>
                    <div className={styles.scheduleInfo}>
                      <h5>اختبار الكيمياء</h5>
                      <p>كل شهر - الأسبوع الثالث</p>
                    </div>
                    <div className={styles.scheduleDetails}>
                      <span><Schedule sx={{ fontSize: 14 }} /> 90 دقيقة</span>
                      <span><Quiz sx={{ fontSize: 14 }} /> 45 سؤال</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>


      
      {/* ========================================
          Privacy Policy Section
          ======================================== */}
      <section id="privacy-policy" className={`${styles.section} ${styles.altBg}`}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <Security className={styles.sectionIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                سياسة الخصوصية
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.policyContent}>
                <motion.div 
                  className={styles.policySection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <div className={styles.policyIcon}>
                    <Person />
                  </div>
                  <div className={styles.policyText}>
                    <h4>جمع المعلومات</h4>
                    <p>
                      نجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حساب، مثل 
                      الاسم والبريد الإلكتروني ورقم الهاتف. كما نجمع معلومات عن 
                      استخدامك للمنصة لتحسين تجربتك التعليمية.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.policySection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className={styles.policyIcon}>
                    <Assessment />
                  </div>
                  <div className={styles.policyText}>
                    <h4>استخدام المعلومات</h4>
                    <p>
                      نستخدم معلوماتك لتقديم خدماتنا وتحسينها، والتواصل معك بخصوص 
                      حسابك والكورسات، وإرسال إشعارات مهمة عن المنصة والتحديثات.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.policySection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className={styles.policyIcon}>
                    <Security />
                  </div>
                  <div className={styles.policyText}>
                    <h4>حماية المعلومات</h4>
                    <p>
                      نتخذ إجراءات أمنية مشددة لحماية معلوماتك الشخصية. لا نشارك 
                      معلوماتك مع أي طرف ثالث إلا بموافقتك أو عند الضرورة القانونية.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* ========================================
          Terms Section
          ======================================== */}
      <section id="terms" className={styles.section}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <Gavel className={styles.sectionIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                الشروط والأحكام
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.termsContent}>
                <motion.div 
                  className={styles.termSection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <span className={styles.termNumber}>1</span>
                  <div className={styles.termText}>
                    <h4>قبول الشروط</h4>
                    <p>
                      باستخدامك لمنصة قِمّة، فإنك توافق على الالتزام بهذه الشروط 
                      والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم 
                      استخدام المنصة.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.termSection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <span className={styles.termNumber}>2</span>
                  <div className={styles.termText}>
                    <h4>حساب المستخدم</h4>
                    <p>
                      أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور. 
                      يجب أن تكون جميع المعلومات المقدمة صحيحة ودقيقة.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.termSection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <span className={styles.termNumber}>3</span>
                  <div className={styles.termText}>
                    <h4>المحتوى التعليمي</h4>
                    <p>
                      جميع المحتويات التعليمية على المنصة محمية بحقوق الملكية 
                      الفكرية. يُحظر نسخ أو توزيع أي محتوى بدون إذن كتابي مسبق.
                    </p>
                  </div>
                </motion.div>

                <motion.div 
                  className={styles.termSection}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <span className={styles.termNumber}>4</span>
                  <div className={styles.termText}>
                    <h4>الاشتراكات والمدفوعات</h4>
                    <p>
                      أسعار الكورسات قابلة للتغيير. جميع المدفوعات نهائية ولا 
                      يمكن استردادها إلا في الحالات المحددة في سياسة الاسترداد.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

     {/* ========================================
          Contact Section
          ======================================== */}
      <section id="contact-us" className={styles.section}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <QuestionAnswer className={styles.sectionIcon} />
              </div>
              <Typography
                variant="h3"
                className={styles.sectionTitle}
                sx={{ fontFamily: 'Cairo, sans-serif', fontWeight: 800 }}
              >
                تواصل معنا
              </Typography>
            </div>
            
            <div className={styles.contentWrapper}>
              <div className={styles.mainCard}>
                <p className={styles.paragraph}>
                  نحن هنا لمساعدتك! إذا كان لديك أي استفسار أو مشكلة، لا تتردد في 
                  التواصل معنا عبر أي من القنوات التالية. فريق الدعم متاح على مدار الساعة.
                </p>
              </div>

              <div className={styles.contactGrid}>
                <motion.div 
                  className={`${styles.contactCard} ${styles.emailCard}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.contactIconWrapper}>
                    <Email className={styles.contactIcon} />
                  </div>
                  <h4>البريد الإلكتروني</h4>
                  <a href="mailto:support@qemma.com">support@qemma.com</a>
                </motion.div>
                <motion.div 
                  className={`${styles.contactCard} ${styles.whatsappCard}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.contactIconWrapper}>
                    <WhatsApp className={styles.contactIcon} />
                  </div>
                  <h4>واتساب</h4>
                  <a href="https://wa.me/201234567890">+20 123 456 7890</a>
                </motion.div>
                <motion.div 
                  className={`${styles.contactCard} ${styles.telegramCard}`}
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className={styles.contactIconWrapper}>
                    <Telegram className={styles.contactIcon} />
                  </div>
                  <h4>تيليجرام</h4>
                  <a href="https://t.me/qemma_support">@qemma_support</a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Container>
      </section>

    </div>
  );
};

export default AboutPage;