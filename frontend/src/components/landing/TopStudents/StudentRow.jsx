// frontend/src/components/landing/TopStudents/StudentRow.jsx
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import styles from './topStudents.module.css';

const StudentRow = ({ student, rank }) => {
  const rankClass =
    rank === 1 ? styles.rankTop1 : rank === 2 ? styles.rankTop2 : rank === 3 ? styles.rankTop3 : '';

  const avatarSrc =
    student?.avatar ||
    'https://ui-avatars.com/api/?background=2563eb&color=fff&name=' +
      encodeURIComponent(student?.name || 'Student');

  return (
    <div className={styles.row} dir="rtl">
      <div className={styles.left}>
        <div className={`${styles.rank} ${rankClass}`}>
          {rank <= 3 ? <EmojiEventsRoundedIcon fontSize="small" /> : rank}
        </div>

        <img src={avatarSrc} alt={student.name} className={styles.avatar} />

        <div className={styles.nameWrap}>
          <div className={styles.name}>{student.name}</div>
          {student.stream && <div className={styles.stream}>{student.stream}</div>}
        </div>
      </div>

      <div className={styles.scorePill}>{student.score}%</div>
    </div>
  );
};

export default StudentRow;