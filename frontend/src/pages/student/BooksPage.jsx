// pages/student/BooksPage.jsx
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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  ArrowForwardRounded,
  SearchRounded,
  MenuBookRounded,
  BookmarkRounded,
  BookmarkBorderRounded,
  SchoolRounded,
  ScienceRounded,
  CalculateRounded,
  HistoryEduRounded,
  TranslateRounded,
  PsychologyRounded,
  PublicRounded,
  BiotechRounded,
  FunctionsRounded,
  AutoStoriesRounded,
  PersonRounded,
  ArrowBackRounded,
} from "@mui/icons-material";
import ThemeContext from "../../contexts/ThemeContext";
import { studentData } from "../../data/studentData";
import API from "../../services/api";

const SUBJECT_VISUALS = {
  "الرياضيات": { icon: CalculateRounded, color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" },
  "الفيزياء": { icon: ScienceRounded, color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
  "الكيمياء": { icon: BiotechRounded, color: "#db2777", gradient: "linear-gradient(135deg, #db2777 0%, #be185d 100%)" },
  "اللغة العربية": { icon: AutoStoriesRounded, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
  "اللغة الإنجليزية": { icon: TranslateRounded, color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)" },
  "الأحياء": { icon: BiotechRounded, color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
  "الجيولوجيا": { icon: PublicRounded, color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" },
  "التاريخ": { icon: HistoryEduRounded, color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" },
  "الجغرافيا": { icon: PublicRounded, color: "#059669", gradient: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
  "الفلسفة والمنطق": { icon: PsychologyRounded, color: "#2563eb", gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)" },
  "علم النفس والاجتماع": { icon: PsychologyRounded, color: "#0891b2", gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)" },
};

const GRADIENTS = {
  main: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)",
};

const getBookVisuals = (subject) =>
  SUBJECT_VISUALS[subject] || { icon: MenuBookRounded, color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" };

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

const BooksPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("الكل");
  const [books, setBooks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    API.get("/books")
      .then((res) => {
        if (!cancelled) {
          const raw = res.data.data?.books || [];
          setBooks(
            raw.map((b) => ({
              ...b,
              ...getBookVisuals(b.subject),
              teacher: b.teacherName,
              subtitle: b.grade || "",
              isFavorite: false,
            }))
          );
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // الحصول على قائمة المواد
  const subjects = useMemo(() => {
    const uniqueSubjects = [
      ...new Set(books.map((book) => book.subject)),
    ];
    return ["الكل", ...uniqueSubjects];
  }, [books]);

  // Filter books
  const filteredBooks = useMemo(() => {
    let filtered = [...books];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.includes(searchQuery) ||
          book.subtitle.includes(searchQuery) ||
          book.teacher.includes(searchQuery) ||
          book.subject.includes(searchQuery)
      );
    }

    // Subject filter
    if (selectedSubject !== "الكل") {
      filtered = filtered.filter((book) => book.subject === selectedSubject);
    }

    return filtered;
  }, [books, searchQuery, selectedSubject]);

  // Toggle favorite
  const toggleFavorite = (bookId) => {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === bookId ? { ...book, isFavorite: !book.isFavorite } : book
      )
    );
  };

  // Stats
  const stats = useMemo(() => {
    const totalBooks = books.length;
    const favoriteBooks = books.filter((b) => b.isFavorite).length;
    return { totalBooks, favoriteBooks };
  }, [books]);

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
        sx={{
          background: GRADIENTS.main,
          color: "white",
          pt: 3,
          pb: 4,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="xl">
          {/* Back Button & Title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <IconButton
              onClick={() => navigate("/student/dashboard")}
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
                📚 الكتب الدراسية
              </Typography>
              <Typography
                variant="body2"
                fontFamily="Cairo, sans-serif"
                sx={{ opacity: 0.9 }}
              >
                {studentData.level}
              </Typography>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2}>
            {[
              {
                label: "إجمالي الكتب",
                value: stats.totalBooks,
                icon: "📖",
              },
              {
                label: "المفضلة",
                value: stats.favoriteBooks,
                icon: "⭐",
              },
            ].map((stat, index) => (
              <Grid item xs={6} key={index}>
                <Box
                  sx={{
                    bgcolor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h5" sx={{ mb: 0.5 }}>
                    {stat.icon}
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={900}
                    fontFamily="Cairo, sans-serif"
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontFamily="Cairo, sans-serif"
                    sx={{ opacity: 0.9 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl">
        {/* Search & Filter */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          {/* Search */}
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
              flex: 2,
              "& .MuiOutlinedInput-root": {
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 2,
                fontFamily: "Cairo, sans-serif",
                "& fieldset": {
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                },
              },
              "& input": {
                color: darkMode ? "#f1f5f9" : "#1e293b",
              },
            }}
          />

          {/* Subject Filter */}
          <FormControl
            sx={{
              flex: 1,
              minWidth: 200,
            }}
          >
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
                bgcolor: darkMode ? "#1e293b" : "white",
                borderRadius: 2,
                fontFamily: "Cairo, sans-serif",
                color: darkMode ? "#f1f5f9" : "#1e293b",
                "& fieldset": {
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                },
                "& .MuiSvgIcon-root": {
                  color: darkMode ? "#94a3b8" : "#64748b",
                },
              }}
            >
              {subjects.map((subject) => (
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
        </Box>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: darkMode ? "#1e293b" : "white",
              borderRadius: 3,
              border: "1px solid",
              borderColor: darkMode ? "#334155" : "#e5e7eb",
            }}
          >
            <Typography
              variant="h1"
              sx={{ fontSize: 64, mb: 2, opacity: 0.5 }}
            >
              📚
            </Typography>
            <Typography
              variant="h6"
              fontFamily="Cairo, sans-serif"
              sx={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              لا توجد كتب تطابق البحث
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredBooks.map((book) => {
              const BookIcon = book.icon;
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                  <Card
                    elevation={0}
                    onClick={() => navigate(`/student/books/${book.id}`)}
                    sx={{
                      height: "100%",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#e5e7eb",
                      bgcolor: darkMode ? "#1e293b" : "white",
                      borderRadius: 3,
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-8px)",
                        boxShadow: darkMode
                          ? "0 20px 40px rgba(0,0,0,0.3)"
                          : "0 20px 40px rgba(0,0,0,0.1)",
                        borderColor: book.color,
                      },
                    }}
                  >
                    {/* Book Header */}
                    <Box
                      sx={{
                        background: book.gradient,
                        p: 3,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Decorative circles */}
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
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: -30,
                          left: -30,
                          width: 100,
                          height: 100,
                          borderRadius: "50%",
                          bgcolor: "rgba(255,255,255,0.08)",
                        }}
                      />

                      {/* Favorite Button */}
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(book.id);
                        }}
                        sx={{
                          position: "absolute",
                          top: 8,
                          left: 8,
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "white",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                        }}
                      >
                        {book.isFavorite ? (
                          <BookmarkRounded />
                        ) : (
                          <BookmarkBorderRounded />
                        )}
                      </IconButton>

                      {/* Book Icon */}
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 2,
                        }}
                      >
                        <BookIcon sx={{ fontSize: 40, color: "white" }} />
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={800}
                        fontFamily="Cairo, sans-serif"
                        textAlign="center"
                        sx={{ color: "white", mb: 0.5 }}
                      >
                        {book.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontFamily="Cairo, sans-serif"
                        textAlign="center"
                        sx={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        {book.subtitle}
                      </Typography>
                    </Box>

                    <CardContent sx={{ p: 2.5 }}>
                      {/* Teacher */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: darkMode ? "#334155" : `${book.color}10`,
                        }}
                      >
                        <PersonRounded
                          sx={{ fontSize: 20, color: book.color }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontFamily="Cairo, sans-serif"
                          sx={{ color: darkMode ? "#f1f5f9" : "#1e293b" }}
                        >
                          {book.teacher}
                        </Typography>
                      </Box>



                      {/* Subject Tag */}
                      <Chip
                        size="small"
                        label={book.subject}
                        sx={{
                          mb: 2,
                          bgcolor: darkMode ? "#475569" : "#e2e8f0",
                          color: darkMode ? "#e2e8f0" : "#475569",
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 600,
                          width: "100%",
                        }}
                      />

                      {/* Book type badge */}
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                        <Chip
                          size="small"
                          label={book.bookType === 'pdf' ? 'PDF' : '📖 مطبوع'}
                          sx={{
                            bgcolor: book.bookType === 'pdf'
                              ? (darkMode ? 'rgba(234,179,8,0.2)' : '#fefce8')
                              : (darkMode ? 'rgba(37,99,235,0.2)' : '#eff6ff'),
                            color: book.bookType === 'pdf' ? '#b45309' : '#2563eb',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>

                      {/* Open Button */}
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={<ArrowBackRounded />}
                        onClick={() => navigate(`/student/books/${book.id}`)}
                        sx={{
                          background: book.gradient,
                          fontFamily: "Cairo, sans-serif",
                          fontWeight: 700,
                          borderRadius: 2,
                          py: 1.5,
                          boxShadow: "none",
                          "&:hover": {
                            boxShadow: `0 8px 20px ${book.color}40`,
                          },
                        }}
                      >
                        فتح الكتاب
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default BooksPage;