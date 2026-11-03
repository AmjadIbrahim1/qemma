import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Divider,
  Rating,
  TextField,
} from "@mui/material";
import {
  ArrowForwardRounded,
  MenuBookRounded,
  PersonRounded,
  SchoolRounded,
  AttachMoneyRounded,
  ShoppingCartRounded,
  StarRounded,
  DownloadRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import API from "../../services/api";

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  green: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  orange: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  pink: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
};

const SUBJECT_COLORS = {
  "الرياضيات": "#2563eb",
  "الفيزياء": "#059669",
  "الكيمياء": "#db2777",
  "الأحياء": "#059669",
  "اللغة العربية": "#f59e0b",
  "اللغة الإنجليزية": "#0891b2",
  "التاريخ": "#7c3aed",
  "الجغرافيا": "#059669",
  "الفلسفة": "#2563eb",
  "الجيولوجيا": "#2563eb",
};

const getSubjectColor = (subject) => SUBJECT_COLORS[subject] || "#7c3aed";

const BACKEND_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return base.replace(/\/api\/?$/, '');
})();

const BookDetailsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookRatingData, setBookRatingData] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/books/${bookId}`);
      setBook(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تحميل بيانات الكتاب");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookRating = async () => {
    try {
      const res = await API.get(`/students/rate/book/${bookId}`);
      const data = res.data?.data;
      if (data) {
        setBookRatingData(data);
        if (data?.myRating) setUserRating(data.myRating.rating);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchBook();
    fetchBookRating();
  }, [bookId]);

  const handleBuy = () => {
    navigate("/checkout", {
      state: {
        item: {
          ...book,
          gradient: book.gradient || "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
          color: book.color || "#2563eb",
          teacher: {
            name: book.teacherName,
            avatar: book.teacherAvatar,
          },
        },
        itemType: "book",
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !book) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: darkMode ? "#0f172a" : "#f8fafc" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h1" sx={{ fontSize: 80, mb: 2 }}>📚</Typography>
          <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
            {error || "الكتاب غير موجود"}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/student/books")} sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}>
            العودة للكتب
          </Button>
        </Box>
      </Box>
    );
  }

  const subjectColor = getSubjectColor(book.subject);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", pb: 4 }}>
      {/* Header */}
      <Box sx={{ background: GRADIENTS.main, color: "white", pt: 3, pb: 6, px: 2, position: "relative", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)" }} />
        <Box sx={{ position: "absolute", bottom: -80, left: -80, width: 250, height: 250, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />

        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <IconButton onClick={() => navigate("/student/books")} sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
              <ArrowForwardRounded />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
            {/* Cover Image */}
            <Box sx={{ width: 160, height: 220, borderRadius: 3, overflow: "hidden", flexShrink: 0, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {book.coverImage ? (
                <Box component="img" src={book.coverImage} alt={book.title} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <MenuBookRounded sx={{ fontSize: 64, color: "rgba(255,255,255,0.5)" }} />
              )}
            </Box>

            {/* Book Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>{book.title}</Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                <Chip icon={<SchoolRounded sx={{ fontSize: 18 }} />} label={book.subject} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif", fontWeight: 600 }} />
                <Chip icon={<MenuBookRounded sx={{ fontSize: 18 }} />} label={book.grade} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif", fontWeight: 600 }} />
                <Chip icon={<AttachMoneyRounded sx={{ fontSize: 18 }} />} label={book.price > 0 ? `${book.price} جنيه` : "مجاني"} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif", fontWeight: 600 }} />
                <Chip label={book.bookType === 'pdf' ? 'PDF' : '📖 كتاب مطبوع'} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif", fontWeight: 600 }} />
              </Box>

              {/* Teacher */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: 2, bgcolor: "rgba(255,255,255,0.15)", width: "fit-content" }}>
                <Avatar src={book.teacherAvatar || undefined} sx={{ width: 40, height: 40, bgcolor: "rgba(255,255,255,0.3)" }}>
                  {!book.teacherAvatar && <PersonRounded />}
                </Avatar>
                <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif">{book.teacherName || "مدرس"}</Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: -3 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Description */}
            <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>📖 عن الكتاب</Typography>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {book.description || "لا يوجد وصف لهذا الكتاب"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} lg={4}>
            {/* Teacher Card */}
            <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>👨‍🏫 المدرس</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar src={book.teacherAvatar || undefined} sx={{ width: 60, height: 60, bgcolor: subjectColor }}>
                    {!book.teacherAvatar && <PersonRounded sx={{ fontSize: 30 }} />}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{book.teacherName || "غير محدد"}</Typography>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: subjectColor }}>{book.subject}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Book Info Card */}
            <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>📋 معلومات الكتاب</Typography>
                {[
                  { label: "المادة", value: book.subject },
                  { label: "الصف الدراسي", value: book.grade },
                  { label: "السعر", value: book.price > 0 ? `${book.price} جنيه` : "مجاني" },
                  { label: "النوع", value: book.bookType === 'pdf' ? 'PDF' : 'كتاب مطبوع' },
                  { label: "عدد المشتريات", value: `${book.purchases || 0} طالب` },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: index < 4 ? `1px solid ${darkMode ? "#334155" : "#e5e7eb"}` : "none" }}>
                    <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>{item.label}</Typography>
                    <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{item.value}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Buy / Download Button */}
            {book.price === 0 ? (
              book.pdfFileRef ? (
                <Button
                  fullWidth variant="contained" size="large"
                  component="a"
                  href={`${BACKEND_ORIGIN}${book.pdfFileRef}`}
                  download
                  startIcon={<DownloadRounded />}
                  sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 8px 25px rgba(5,150,105,0.4)" } }}
                >
                  تحميل الكتاب مجاناً
                </Button>
              ) : (
                <Box sx={{ p: 2.5, textAlign: 'center', border: '1px dashed', borderColor: darkMode ? '#334155' : '#e5e7eb', borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
                  <MenuBookRounded sx={{ fontSize: 32, color: darkMode ? '#475569' : '#cbd5e1', mb: 1 }} />
                  <Typography fontFamily="Cairo, sans-serif" fontSize={14} fontWeight={600}
                    sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    الملف الرقمي غير متاح للتحميل بعد
                  </Typography>
                  <Typography fontFamily="Cairo, sans-serif" fontSize={12}
                    sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 0.5 }}>
                    {book.bookType === 'pdf' ? 'يرجى العودة لاحقاً' : 'هذا الكتاب متاح بنسخة مطبوعة فقط'}
                  </Typography>
                </Box>
              )
            ) : book.bookType === 'pdf' && book.price > 0 && book.hasPurchased ? (
              <Button
                fullWidth variant="contained" size="large"
                component="a"
                href={`${BACKEND_ORIGIN}${book.pdfFileRef}`}
                download
                startIcon={<DownloadRounded />}
                sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 8px 25px rgba(5,150,105,0.4)" } }}
              >
                تحميل الكتاب
              </Button>
            ) : book.bookType === 'pdf' && book.price > 0 && !book.hasPurchased ? (
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleBuy}
                startIcon={<ShoppingCartRounded />}
                sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 8px 25px rgba(37,99,235,0.4)" } }}
              >
                {`شراء الكتاب - ${book.price} جنيه`}
              </Button>
            ) : (
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleBuy}
                startIcon={<ShoppingCartRounded />}
                sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 8px 25px rgba(37,99,235,0.4)" } }}
              >
                {`اشتري الآن (توصيل للمنزل) - ${book.price} جنيه`}
              </Button>
            )}

            {/* Book Rating */}
            <Card elevation={0} sx={{ mt: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
                  ⭐ تقييم الكتاب
                </Typography>

                {/* Average Rating */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <Typography variant="h4" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                    {bookRatingData?.averageRating?.toFixed(1) || 0}
                  </Typography>
                  <Rating value={bookRatingData?.averageRating || 0} precision={0.5} readOnly size="medium" sx={{ color: "#fbbf24" }} />
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    ({bookRatingData?.totalRatings || 0} تقييم)
                  </Typography>
                </Box>

                {/* Submit Rating */}
                <Divider sx={{ mb: 2, borderColor: darkMode ? "#334155" : "#e5e7eb" }} />
                <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 1 }}>
                  {userRating > 0 ? "تعديل تقييمك" : "قم بتقييم هذا الكتاب"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Rating
                    name="book-rating"
                    value={userRating}
                    onChange={(_, value) => setUserRating(value || 0)}
                    sx={{ color: "#fbbf24" }}
                  />
                  {userRating > 0 && (
                    <Typography variant="caption" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                      {userRating} / 5
                    </Typography>
                  )}
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="أكتب تعليقاً (اختياري)..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  sx={{ mb: 2, "& .MuiOutlinedInput-root": { fontFamily: "Cairo, sans-serif", bgcolor: darkMode ? "#0f172a" : "#f8fafc" } }}
                  InputProps={{ sx: { fontFamily: "Cairo, sans-serif" } }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  disabled={userRating === 0 || submittingRating}
                  onClick={async () => {
                    setSubmittingRating(true);
                    try {
                      await API.post(`/students/rate/book/${bookId}`, { rating: userRating, comment: ratingComment });
                      await fetchBookRating();
                      setUserRating(0);
                      setRatingComment("");
                    } catch (_) {}
                    setSubmittingRating(false);
                  }}
                  sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}
                >
                  {submittingRating ? <CircularProgress size={20} color="inherit" /> : "إرسال التقييم"}
                </Button>

                {/* Reviews List */}
                <Divider sx={{ my: 2, borderColor: darkMode ? "#334155" : "#e5e7eb" }} />
                <Typography variant="subtitle2" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
                  تقييمات الطلاب ({bookRatingData?.reviews?.length || 0})
                </Typography>
                {!bookRatingData?.reviews?.length ? (
                  <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#64748b" : "#94a3b8", textAlign: "center", py: 2 }}>
                    لا توجد تقييمات بعد
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {bookRatingData.reviews.map((review, index) => (
                      <Box
                        key={review.id || index}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: 14, bgcolor: darkMode ? "#334155" : "#cbd5e1" }}>
                            {review.student?.name?.[0] || "ط"}
                          </Avatar>
                          <Typography variant="caption" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>
                            {review.student?.name || "طالب"}
                          </Typography>
                          <Rating value={review.rating} readOnly size="small" sx={{ color: "#fbbf24" }} />
                        </Box>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                          {review.comment || ""}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BookDetailsPage;
