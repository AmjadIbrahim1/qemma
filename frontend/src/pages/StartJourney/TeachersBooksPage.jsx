// pages/TeachersBooksPage.jsx
import { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Skeleton,
} from "@mui/material";
import { motion } from "framer-motion";
import {
  ArrowForwardRounded,
  SearchRounded,
  MenuBookRounded,
  PersonRounded,
  DownloadRounded,
  StarRounded,
  DescriptionRounded,
  ArrowBackRounded,
  ChevronLeftRounded,
  ShoppingCartRounded,
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

const SUBJECTS = [
  "الكل",
  "الرياضيات",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "التاريخ",
  "الجغرافيا",
  "الفلسفة",
];

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

const formatBook = (b) => {
  const style = getSubjectStyle(b.subject);
  return {
    id:            b.id,
    title:         b.title,
    subject:       b.subject || '',
    description:   b.description || '',
    price:         b.price || 0,
    oldPrice:      0,
    pages:         0,
    downloads:     b.purchases || 0,
    rating:        0,
    color:         style.color,
    gradient:      style.gradient,
    coverImage:    b.coverImage || null,
    grade:         b.grade || '',
    createdAt:     b.createdAt || null,
    tags:          [],
    teacher: {
      id:      b.teacherId,
      name:    b.teacherName || 'مدرس',
      avatar:  b.teacherAvatar || null,
      rating:  0,
      pdfFileRef:  b.pdfFileRef  || null,
      bookType:    b.bookType    || 'physical',
    },
  };
};

const BACKEND_ORIGIN = (() => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return base.replace(/\/api\/?$/, '');
})();

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const TeachersBooksPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("الكل");

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const res = await API.get('/books');
        const raw = res.data?.data?.books || [];
        const formatted = raw.map(formatBook);
        setBooks(formatted);
        // Fetch real teacher ratings in background
        const uniqueTeachers = [...new Map(formatted.map(b => [b.teacher.id, b.teacher])).values()].filter(t => t.id);
        if (uniqueTeachers.length) {
          Promise.allSettled(
            uniqueTeachers.map(t => API.get(`/students/rate/teacher/${t.id}`))
          ).then(results => {
            const ratingMap = {};
            uniqueTeachers.forEach((t, i) => {
              const r = results[i];
              if (r.status === 'fulfilled' && r.value.data?.data) {
                ratingMap[t.id] = r.value.data.data.averageRating;
              }
            });
            setBooks(prev => prev.map(b => ({
              ...b,
              teacher: { ...b.teacher, rating: ratingMap[b.teacher.id] ?? b.teacher.rating }
            })));
          });
        }
      } catch (err) {
        console.error('Failed to fetch books:', err);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    let filtered = [...books];

    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.includes(searchQuery) ||
          book.teacher.name.includes(searchQuery) ||
          book.subject.includes(searchQuery) ||
          book.description.includes(searchQuery),
      );
    }

    if (selectedSubject !== "الكل") {
      filtered = filtered.filter((book) => book.subject === selectedSubject);
    }

    return filtered;
  }, [searchQuery, selectedSubject, books]);

  const handleBuy = (e, book) => {
  e.stopPropagation();
  navigate("/checkout", {
    state: {
      item: book,
      itemType: "book",
    },
  });
};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: darkMode ? "#0f172a" : "#f8fafc",
        pb: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{ background: GRADIENTS.main, color: "white", pt: 3, pb: 4, px: 2 }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/start-journey")}
              sx={{
                bgcolor: "rgba(255,255,255,0.15)",
                color: "white",
                "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}
            >
              <ArrowForwardRounded />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                fontFamily="Cairo, sans-serif"
              >
                📚 كتب المدرسين
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.9 }}
              >
                ملخصات ومذكرات من أفضل مدرسي الثانوية العامة
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {/* Filters */}
        <Card
          elevation={0}
          sx={{
            mb: 3,
            p: 3,
            border: "1px solid",
            borderColor: darkMode ? "#334155" : "#e5e7eb",
            bgcolor: darkMode ? "#1e293b" : "white",
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                placeholder="ابحث عن كتاب أو مدرس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRounded
                        sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: darkMode ? "#334155" : "#f8fafc",
                    borderRadius: 2,
                    fontFamily: "Cairo, sans-serif",
                    "& fieldset": {
                      borderColor: darkMode ? "#475569" : "#e5e7eb",
                    },
                  },
                  "& input": { color: darkMode ? "#f1f5f9" : "#1e293b" },
                }}
              />
            </Grid>

            <Grid item xs={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel
                  sx={{
                    fontFamily: "Cairo, sans-serif",
                    color: darkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  المادة
                </InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="المادة"
                  sx={{
                    bgcolor: darkMode ? "#334155" : "#f8fafc",
                    borderRadius: 2,
                    fontFamily: "Cairo, sans-serif",
                    color: darkMode ? "#f1f5f9" : "#1e293b",
                  }}
                >
                  {SUBJECTS.map((subject) => (
                    <MenuItem
                      key={subject}
                      value={subject}
                      sx={{ fontFamily: "Cairo, sans-serif" }}
                    >
                      {subject}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>


          </Grid>
        </Card>

        {/* Results Count */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="body2"
            fontFamily="Cairo, sans-serif"
            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
          >
            عرض {filteredBooks.length} كتاب
          </Typography>
        </Box>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 8,
              textAlign: "center",
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
            }}
          >
            <Typography variant="h1" sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}>
              📚
            </Typography>
            <Typography
              variant="h6"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              لا توجد كتب تطابق البحث
            </Typography>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredBooks.map((book, index) => (
              <Grid item xs={12} sm={6} lg={4} key={book.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 3,
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: book.color,
                        transform: "translateY(-8px)",
                        boxShadow: darkMode
                          ? `0 20px 40px rgba(0,0,0,0.5)`
                          : `0 20px 40px ${book.color}20`,
                        bgcolor: darkMode ? "#253449" : "white",
                      },
                    }}
                  >
                    {/* Book Header */}
                    <Box
                      sx={{
                        background: book.coverImage ? `url(${book.coverImage}) center/cover no-repeat` : book.gradient,
                        p: 3,
                        position: "relative",
                        overflow: "hidden",
                        minHeight: 180,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Dark overlay for cover image readability */}
                      {book.coverImage && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)",
                          }}
                        />
                      )}

                      <Box
                        sx={{
                          position: "absolute",
                          top: -20,
                          right: -20,
                          width: 80,
                          height: 80,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.1)",
                        }}
                      />

                      {/* Price Badge */}
                      <Chip
                        label={book.price > 0 ? `${book.price} جنيه` : 'مجاني'}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: book.price > 0 ? "rgba(255,255,255,0.95)" : '#059669',
                          color: book.price > 0 ? book.color : 'white',
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 800,
                          fontSize: 13,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        }}
                      />

                      {/* Subject Badge */}
                      <Chip
                        label={book.subject}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                        }}
                      />

                      {/* Book Icon or Cover Image */}
                      {!book.coverImage && (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2,
                            mt: 3,
                            position: "relative",
                            zIndex: 1,
                          }}
                        >
                          <MenuBookRounded
                            sx={{ fontSize: 32, color: "white" }}
                          />
                        </Box>
                      )}

                      <Typography
                        variant="h6"
                        fontWeight={700}
                        fontFamily="Cairo, sans-serif"
                        sx={{ color: "white", position: "relative", zIndex: 1 }}
                      >
                        {book.title}
                      </Typography>

                      {/* Grade Badge */}
                      {book.grade && (
                        <Chip
                          label={book.grade}
                          size="small"
                          sx={{
                            mt: 1,
                            alignSelf: "flex-start",
                            bgcolor: "rgba(255,255,255,0.15)",
                            color: "white",
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 600,
                            fontSize: 11,
                            position: "relative",
                            zIndex: 1,
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      {/* Teacher - Clickable */}
                      <Box
                        onClick={() => navigate(`/teacher/${book.teacher.id}`)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: darkMode ? "#334155" : `${book.color}08`,
                          mb: 2,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            bgcolor: darkMode ? "#475569" : `${book.color}15`,
                            transform: "translateX(-5px)",
                          },
                        }}
                      >
                        <Avatar
                          sx={{ width: 40, height: 40, bgcolor: book.color }}
                        >
                          <PersonRounded />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                          >
                            {book.teacher.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <StarRounded
                              sx={{ fontSize: 14, color: "#fbbf24" }}
                            />
                            <Typography
                              variant="caption"
                              fontFamily="Cairo, sans-serif"
                              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                            >
                              {book.teacher.rating}
                            </Typography>
                          </Box>
                        </Box>
                        <ChevronLeftRounded
                          sx={{ color: darkMode ? "#64748b" : "#94a3b8" }}
                        />
                      </Box>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        sx={{
                          color: darkMode ? "#94a3b8" : "#64748b",
                          mb: 2,
                          lineHeight: 1.6,
                          height: 48,
                          overflow: "hidden",
                        }}
                      >
                        {book.description}
                      </Typography>

                      {/* Stats */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <DescriptionRounded
                            sx={{
                              fontSize: 16,
                              color: darkMode ? "#64748b" : "#94a3b8",
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                          >
                            {book.pages} صفحة
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <DownloadRounded
                            sx={{
                              fontSize: 16,
                              color: darkMode ? "#64748b" : "#94a3b8",
                            }}
                          />
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                          >
                            {(book.downloads / 1000).toFixed(1)}K
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <StarRounded
                            sx={{ fontSize: 16, color: "#fbbf24" }}
                          />
                          <Typography
                            variant="caption"
                            fontFamily="Cairo, sans-serif"
                            sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                          >
                            {book.rating}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Tags */}
                      {book.tags.length > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mb: 2,
                          }}
                        >
                          {book.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: 10,
                                bgcolor: darkMode ? "#334155" : "#f1f5f9",
                                color: darkMode ? "#94a3b8" : "#64748b",
                                fontFamily: "Cairo, sans-serif",
                              }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="outlined"
                          endIcon={<ArrowBackRounded />}
                          onClick={() => navigate(`/teachers-books/${book.id}`)}
                          sx={{
                            flex: 1,
                            borderColor: book.color,
                            color: book.color,
                            fontFamily: "Cairo, sans-serif",
                            fontWeight: 700,
                            borderRadius: 2,
                            "&:hover": {
                              borderColor: book.color,
                              bgcolor: `${book.color}10`,
                            },
                          }}
                        >
                          التفاصيل
                        </Button>

                        {book.price > 0 ? (
                          <Button variant="contained" startIcon={<ShoppingCartRounded />}
                            onClick={(e) => handleBuy(e, book)}
                            sx={{
                              flex: 1, background: book.gradient,
                              fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
                              boxShadow: "none", "&:hover": { boxShadow: `0 8px 20px ${book.color}40` },
                            }}>
                            اشتري
                          </Button>
                        ) : book.pdfFileRef ? (
                          <Button variant="contained" startIcon={<DownloadRounded />}
                            component="a" href={`${BACKEND_ORIGIN}${book.pdfFileRef}`} download
                            sx={{
                              flex: 1, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                              fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
                              boxShadow: "none", "&:hover": { boxShadow: "0 8px 20px rgba(5,150,105,0.4)" },
                            }}>
                            تحميل مجاني
                          </Button>
                        ) : (
                          <Button variant="outlined" disabled
                            sx={{
                              flex: 1, fontFamily: "Cairo, sans-serif", fontWeight: 700, borderRadius: 2,
                              borderColor: darkMode ? '#475569' : '#cbd5e1',
                              color: darkMode ? '#64748b' : '#94a3b8',
                            }}>
                            غير متاح
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default TeachersBooksPage;
