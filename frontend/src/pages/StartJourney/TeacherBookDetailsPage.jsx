// pages/TeacherBookDetailsPage.jsx
import { useState, useContext, useEffect } from "react";
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
  Skeleton,
} from "@mui/material";
import {
  ArrowForwardRounded,
  MenuBookRounded,
  PersonRounded,
  ChevronLeftRounded,
  ShoppingCartRounded,
  CheckCircleRounded,
  AccessTimeRounded,
  UpdateRounded,
  FolderRounded,
  PictureAsPdfRounded,
  LockRounded,
  VisibilityRounded,
  DownloadRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import API from "../../services/api";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const COLORS = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  accent: "#db2777",
  success: "#059669",
  warning: "#f59e0b",
  error: "#ef4444",
};

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
  blue: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  purple: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
  green: "linear-gradient(135deg, #059669 0%, #047857 100%)",
  orange: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  pink: "linear-gradient(135deg, #db2777 0%, #be185d 100%)",
};

const SUBJECT_COLORS = {
  "الرياضيات":       { color: "#2563eb", gradient: GRADIENTS.blue },
  "الفيزياء":        { color: "#059669", gradient: GRADIENTS.green },
  "الكيمياء":        { color: "#db2777", gradient: GRADIENTS.pink },
  "الأحياء":         { color: "#059669", gradient: GRADIENTS.green },
  "اللغة العربية":   { color: "#f59e0b", gradient: GRADIENTS.orange },
  "اللغة الإنجليزية": { color: "#2563eb", gradient: GRADIENTS.blue },
  "التاريخ":         { color: "#7c3aed", gradient: GRADIENTS.purple },
  "الجغرافيا":       { color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)" },
  "الفلسفة":         { color: "#7c3aed", gradient: GRADIENTS.purple },
};

const getSubjectStyle = (subject) =>
  SUBJECT_COLORS[subject] || { color: "#2563eb", gradient: GRADIENTS.blue };

const BACKEND_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return base.replace(/\/api\/?$/, '');
})();

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const TeacherBookDetailsPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch single published book (public endpoint)
        const res = await API.get(`/books/${bookId}`);
        const data = res.data?.data;
        if (!data) {
          setError('الكتاب غير موجود');
          return;
        }
        const style = getSubjectStyle(data.subject);
        setBook({
          id:              data.id,
          title:           data.title,
          subject:         data.subject || '',
          description:     data.description || '',
          fullDescription: data.description || '',
          coverImage:      data.coverImage || null,
          teacher: {
            id:     data.teacherId,
            name:   data.teacherName || 'مدرس',
            avatar: data.teacherAvatar || null,
          },
          pages:         0,
          chapters:      0,
          downloads:     data.purchases || 0,
          rating:        0,
          price:         data.price || 0,
          pdfFileRef:    data.pdfFileRef || null,
          bookType:      data.bookType || 'physical',
          originalPrice: 0,
          oldPrice:      0,
          discount:      0,
          color:         style.color,
          gradient:      style.gradient,
          tags:          [],
          lastUpdated:   data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('ar-EG') : data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-EG') : '',
          fileSize:      '',
          language:      'العربية',
          level:         data.grade || '',
          chaptersData:  [],
          features:      [],
        });
      } catch (err) {
        console.error('Failed to fetch book:', err);
        setError('فشل تحميل بيانات الكتاب');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId]);

  const handlePurchase = () => {
    if (!book) return;
    navigate("/checkout", {
      state: {
        item: book,
        itemType: "book",
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", p: 4 }}>
        <Container maxWidth="xl">
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mb: 3 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
        </Container>
      </Box>
    );
  }

  if (error || !book) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h1" sx={{ fontSize: 80, mb: 2 }}>📚</Typography>
          <Typography variant="h5" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>
            {error || 'الكتاب غير موجود'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/teachers-books")}
            sx={{ background: GRADIENTS.main, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2 }}
          >
            العودة للكتب
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f8fafc", pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          background: book.gradient,
          color: "white",
          pt: 3,
          pb: 8,
          px: 2,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.1)" }} />
        <Box sx={{ position: "absolute", bottom: -80, left: -80, width: 250, height: 250, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.08)" }} />

        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
          {/* Back Button */}
          <Box sx={{ mb: 4 }}>
            <IconButton
              onClick={() => navigate("/teachers-books")}
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "white", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
            >
              <ArrowForwardRounded />
            </IconButton>
          </Box>

          {/* Book Info */}
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
            <Box
              sx={{
                width: 140,
                height: 180,
                borderRadius: 3,
                background: book.coverImage ? `url(${book.coverImage}) center/cover no-repeat` : `${book.color}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              }}
            >
              {!book.coverImage && (
                <MenuBookRounded sx={{ fontSize: 70, color: "white" }} />
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Chip label={book.subject} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontFamily: "Cairo, sans-serif", fontWeight: 600, mb: 1 }} />
              <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ mb: 1 }}>{book.title}</Typography>
              <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ opacity: 0.9, mb: 2, maxWidth: 600 }}>{book.description}</Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ShoppingCartRounded sx={{ fontSize: 20 }} />
                  <Typography fontFamily="Cairo, sans-serif">{book.downloads} عملية شراء</Typography>
                </Box>
              </Box>

              <Box
                onClick={() => navigate(`/teacher/${book.teacher.id}`)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)", transform: "translateX(-5px)" },
                }}
              >
                <Avatar sx={{ width: 40, height: 40, bgcolor: "rgba(255,255,255,0.3)" }}><PersonRounded /></Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} fontFamily="Cairo, sans-serif">{book.teacher.name}</Typography>
                </Box>
                <ChevronLeftRounded sx={{ opacity: 0.7 }} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: -5 }}>
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} lg={8}>
            {/* Price Card - Mobile */}
            <Card
              elevation={0}
              sx={{
                display: { xs: "block", lg: "none" },
                mb: 3,
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <Box sx={{ height: 4, background: book.gradient }} />
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: book.price > 0 ? book.color : '#059669' }}>
                    {book.price > 0 ? `${book.price} جنيه` : 'مجاني'}
                  </Typography>
                  {book.discount > 0 && (
                    <>
                      <Typography variant="h6" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#64748b" : "#94a3b8", textDecoration: "line-through" }}>{book.originalPrice} جنيه</Typography>
                      <Chip label={`خصم ${book.discount}%`} size="small" sx={{ bgcolor: "#dcfce7", color: "#059669", fontFamily: "Cairo, sans-serif", fontWeight: 700 }} />
                    </>
                  )}
                </Box>
                {book.price > 0 ? (
                  <Button fullWidth variant="contained" size="large"
                    startIcon={<ShoppingCartRounded />} onClick={handlePurchase}
                    sx={{ background: book.gradient, fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 18, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: `0 10px 30px ${book.color}40` } }}>
                    اشتري الآن
                  </Button>
                ) : book.pdfFileRef ? (
                  <Button fullWidth variant="contained" size="large"
                    component="a" href={`${BACKEND_ORIGIN}${book.pdfFileRef}`} download
                    startIcon={<DownloadRounded />}
                    sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 18, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 10px 30px rgba(5,150,105,0.4)" } }}>
                    تحميل الكتاب مجاناً
                  </Button>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed', borderColor: darkMode ? '#334155' : '#e5e7eb', borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <Typography fontFamily="Cairo, sans-serif" fontSize={14} fontWeight={600}
                      sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                      الملف الرقمي غير متاح للتحميل
                    </Typography>
                    <Typography fontFamily="Cairo, sans-serif" fontSize={12}
                      sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 0.5 }}>
                      {book.bookType === 'pdf' ? 'يرجى العودة لاحقاً' : 'هذا الكتاب متاح بنسخة مطبوعة فقط'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* About Book */}
            <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>📖 عن الكتاب</Typography>
                <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b", lineHeight: 2 }}>{book.fullDescription || 'لا يوجد وصف متاح'}</Typography>
              </CardContent>
            </Card>

            {/* Features */}
            {book.features.length > 0 && (
              <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>✨ مميزات الكتاب</Typography>
                  <Grid container spacing={2}>
                    {book.features.map((feature, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: darkMode ? "#334155" : `${book.color}08` }}>
                          <CheckCircleRounded sx={{ color: book.color }} />
                          <Typography fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{feature}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right Column - Sticky */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: "sticky", top: 20 }}>
              {/* Price Card - Desktop */}
              <Card
                elevation={0}
                sx={{
                  display: { xs: "none", lg: "block" },
                  mb: 3,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ height: 4, background: book.gradient }} />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
                      {book.price > 0 ? (
                        <>
                          <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: book.color }}>{book.price}</Typography>
                          <Typography variant="h5" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: book.color }}>جنيه</Typography>
                        </>
                      ) : (
                        <Typography variant="h3" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: '#059669' }}>مجاني</Typography>
                      )}
                    </Box>
                    {book.discount > 0 && (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <Typography variant="body1" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#64748b" : "#94a3b8", textDecoration: "line-through" }}>{book.originalPrice} جنيه</Typography>
                        <Chip label={`خصم ${book.discount}%`} size="small" sx={{ bgcolor: "#dcfce7", color: "#059669", fontFamily: "Cairo, sans-serif", fontWeight: 700 }} />
                      </Box>
                    )}
                  </Box>

                  {book.price > 0 ? (
                    <Button fullWidth variant="contained" size="large"
                      startIcon={<ShoppingCartRounded />} onClick={handlePurchase}
                      sx={{ background: book.gradient, fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 18, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: `0 10px 30px ${book.color}40` } }}>
                      اشتري الآن
                    </Button>
                  ) : book.pdfFileRef ? (
                    <Button fullWidth variant="contained" size="large"
                      component="a" href={`${BACKEND_ORIGIN}${book.pdfFileRef}`} download
                      startIcon={<DownloadRounded />}
                      sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontFamily: "Cairo, sans-serif", fontWeight: 800, fontSize: 18, borderRadius: 2, py: 1.5, boxShadow: "none", "&:hover": { boxShadow: "0 10px 30px rgba(5,150,105,0.4)" } }}>
                      تحميل الكتاب مجاناً
                    </Button>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed', borderColor: darkMode ? '#334155' : '#e5e7eb', borderRadius: 2, bgcolor: darkMode ? '#0f172a' : '#f8fafc' }}>
                      <Typography fontFamily="Cairo, sans-serif" fontSize={14} fontWeight={600}
                        sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                        الملف الرقمي غير متاح للتحميل
                      </Typography>
                      <Typography fontFamily="Cairo, sans-serif" fontSize={12}
                        sx={{ color: darkMode ? '#64748b' : '#94a3b8', mt: 0.5 }}>
                        {book.bookType === 'pdf' ? 'يرجى العودة لاحقاً' : 'هذا الكتاب متاح بنسخة مطبوعة فقط'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Book Info Card */}
              <Card elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: darkMode ? "#334155" : "#e5e7eb", bgcolor: darkMode ? "#1e293b" : "white", borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b", mb: 2 }}>📋 معلومات الكتاب</Typography>

                  {[
                    { icon: <FolderRounded />, label: "المادة", value: book.subject },

                    { icon: <MenuBookRounded />, label: "عدد الفصول", value: book.chapters ? `${book.chapters} فصل` : 'غير محدد' },
                    { icon: <PictureAsPdfRounded />, label: "حجم الملف", value: book.fileSize || 'غير محدد' },
                    { icon: <UpdateRounded />, label: "آخر تحديث", value: book.lastUpdated || 'غير محدد' },
                    { icon: <AccessTimeRounded />, label: "المستوى", value: book.level || 'عام' },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, borderBottom: index < 5 ? `1px solid ${darkMode ? "#334155" : "#e5e7eb"}` : "none" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}>{item.icon}</Box>
                        <Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}>{item.label}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{item.value}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Teacher Card */}
              <Card
                elevation={0}
                onClick={() => navigate(`/teacher/${book.teacher.id}`)}
                sx={{
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": { borderColor: book.color, transform: "translateY(-4px)", boxShadow: `0 10px 30px ${book.color}20` },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight={800} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>👨‍🏫 المدرس</Typography>
                    <ChevronLeftRounded sx={{ color: darkMode ? "#64748b" : "#94a3b8" }} />
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 60, height: 60, bgcolor: book.color }}><PersonRounded sx={{ fontSize: 30 }} /></Avatar>
                    <Box>
                      <Typography fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}>{book.teacher.name}</Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ChevronLeftRounded />}
                    sx={{ mt: 2, borderColor: book.color, color: book.color, fontFamily: "Cairo, sans-serif", fontWeight: 600, borderRadius: 2, "&:hover": { borderColor: book.color, bgcolor: `${book.color}10` } }}
                  >
                    عرض صفحة المدرس
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherBookDetailsPage;
