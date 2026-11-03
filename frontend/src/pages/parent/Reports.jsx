// frontend/src/pages/parent/Reports.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import parentsService from "../../services/parents.service";
import { normalizeChild, extractPayload, safePercentage, safeProgressValue, safeNumber } from "../../utils/normalizeApiResponse";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowBack,
  Download,
  TrendingUp,
  TrendingDown,
  CompareArrows,
  Assessment,
  School,
  Assignment,
  EmojiEvents,
} from "@mui/icons-material";

const Reports = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [reportType, setReportType] = useState("overall");
  const [selectedChild, setSelectedChild] = useState("all");
  const [timeRange, setTimeRange] = useState("month");
  const [children, setChildren] = useState([]);
  const [performances, setPerformances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch real children data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await parentsService.getChildren();
        const raw = res.data.data || res.data || [];
        const childrenData = Array.isArray(raw) ? raw.map(normalizeChild) : [];
        setChildren(childrenData);

        // Fetch performance for each child
        const perfMap = {};
        await Promise.all(
          childrenData.map(async (child) => {
            try {
              const perfRes = await parentsService.getChildPerformance(child.id);
              perfMap[child.id] = extractPayload(perfRes);
            } catch (e) {
              console.warn('Failed to fetch performance for child:', child.id);
            }
          })
        );
        setPerformances(perfMap);
      } catch (err) {
        if (err.response?.status === 403) {
          setChildren([]);
        } else {
          console.error('Failed to fetch children data:', err);
          setError('فشل تحميل بيانات التقارير');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter children based on selection
  const filteredChildren =
    selectedChild === "all"
      ? children
      : children.filter((child) => child.id === selectedChild);

  // ── Derived stats from real data (now normalised via normalizeChild) ──
  // Helper to find a KPI by type with fallback alternatives
  const findKpiValue = (child, ...types) => {
    const kpis = Array.isArray(child.kpis) ? child.kpis : [];
    for (const type of types) {
      const found = kpis.find(k => k.type === type);
      if (found) return safeNumber(found.value);
    }
    return 0;
  };

  const statsData = {
    totalCourses: filteredChildren.reduce((sum, child) => sum + safeNumber(child.totalCourses), 0),
    avgGrade:
      filteredChildren.length > 0
        ? Math.round(
            filteredChildren.reduce((sum, child) => sum + findKpiValue(child, 'avgGrade', 'averageGrade'), 0) / filteredChildren.length,
          )
        : 0,
    avgAttendance:
      filteredChildren.length > 0
        ? Math.round(
            filteredChildren.reduce((sum, child) => sum + findKpiValue(child, 'attendance'), 0) / filteredChildren.length,
          )
        : 0,
    totalAssignments: filteredChildren.reduce(
      (sum, child) => sum + safeNumber(child.stats?.completedAssignments || 0),
      0,
    ),
  };

  // ── Performance comparison data from real subjectsPerformance ──
  const performanceData = [];
  // Get all subjects that appear across all children performances
  const allSubjects = new Set();
  filteredChildren.forEach(child => {
    const perf = performances[child.id];
    if (perf?.subjectsPerformance) {
      perf.subjectsPerformance.forEach(s => allSubjects.add(s.name));
    }
  });
  allSubjects.forEach(subject => {
    const row = { subject };
    filteredChildren.forEach(child => {
      const perf = performances[child.id];
      const subjData = perf?.subjectsPerformance?.find(s => s.name === subject);
      row[child.id] = subjData?.grade || null;
    });
    performanceData.push(row);
  });

  const handleExportExcel = async () => {
    try {
      const res = await parentsService.exportReportsExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'parent-reports.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getChildColor = (index) => {
    const colors = ["#2563eb", "#7c3aed", "#059669", "#f59e0b", "#dc2626"];
    return colors[index % colors.length];
  };

  // ── Build childRows for table from real data ────────────────
  const childRows = filteredChildren.map((child, idx) => {
    const perf = performances[child.id];
    const ranking = perf?.ranking || {};
    const avgGrade = safeNumber(child.averageGrade) || findKpiValue(child, 'avgGrade', 'averageGrade');
    const attendance = safeNumber(child.attendance) || findKpiValue(child, 'attendance');
    const trend = perf?.strengths && perf.weaknesses
      ? (perf.strengths.length >= perf.weaknesses.length ? 'up' : 'down')
      : 'up';
    return {
      id: child.id,
      name: child.name,
      avatar: child.avatar || (child.name || '?').charAt(0),
      averageGrade: avgGrade,
      attendance,
      completedAssignments: safeNumber(child.stats?.completedAssignments || 0),
      totalAssignments: safeNumber(child.stats?.totalAssignments || 0),
      rank: ranking.classRank || '-',
      trend,
    };
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: darkMode ? '#0f172a' : '#f9fafb' }}>
        <Alert severity="error" sx={{ fontFamily: 'Cairo, sans-serif' }}>{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
      {/* Header */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)",
          color: "white",
          py: 3,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                sx={{ color: "white" }}
                onClick={() => navigate("/parent/dashboard")}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography
                  variant="h5"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                >
                  التقارير والإحصائيات
                </Typography>
                <Typography
                  variant="body2"
                  fontFamily="Cairo, sans-serif"
                  sx={{ opacity: 0.9 }}
                >
                  تقارير شاملة عن أداء الأبناء
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportExcel}
              sx={{
                bgcolor: "white",
                color: "#2563eb",
                fontFamily: "Cairo, sans-serif",
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "#f1f5f9",
                },
              }}
            >
              تصدير Excel
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                نوع التقرير
              </InputLabel>
              <Select
                value={reportType}
                label="نوع التقرير"
                onChange={(e) => setReportType(e.target.value)}
                sx={{ fontFamily: "Cairo, sans-serif" }}
              >
                <MenuItem
                  value="overall"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  شامل
                </MenuItem>
                <MenuItem
                  value="academic"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  أكاديمي
                </MenuItem>
                <MenuItem
                  value="attendance"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  الحضور
                </MenuItem>
                <MenuItem
                  value="comparison"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  مقارنة
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                الطالب
              </InputLabel>
              <Select
                value={selectedChild}
                label="الطالب"
                onChange={(e) => setSelectedChild(e.target.value)}
                sx={{ fontFamily: "Cairo, sans-serif" }}
              >
                <MenuItem value="all" sx={{ fontFamily: "Cairo, sans-serif" }}>
                  الكل
                </MenuItem>
                {children.map((child) => (
                  <MenuItem
                    key={child.id}
                    value={child.id}
                    sx={{ fontFamily: "Cairo, sans-serif" }}
                  >
                    {child.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: "Cairo, sans-serif" }}>
                الفترة الزمنية
              </InputLabel>
              <Select
                value={timeRange}
                label="الفترة الزمنية"
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ fontFamily: "Cairo, sans-serif" }}
              >
                <MenuItem value="week" sx={{ fontFamily: "Cairo, sans-serif" }}>
                  هذا الأسبوع
                </MenuItem>
                <MenuItem
                  value="month"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  هذا الشهر
                </MenuItem>
                <MenuItem
                  value="semester"
                  sx={{ fontFamily: "Cairo, sans-serif" }}
                >
                  الفصل الدراسي
                </MenuItem>
                <MenuItem value="year" sx={{ fontFamily: "Cairo, sans-serif" }}>
                  السنة الدراسية
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <School sx={{ fontSize: 40, color: "#7c3aed", mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  {statsData.totalCourses}
                </Typography>
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  إجمالي الكورسات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Assessment sx={{ fontSize: 40, color: "#2563eb", mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  {safePercentage(statsData.avgGrade)}
                </Typography>
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  متوسط الدرجات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <TrendingUp sx={{ fontSize: 40, color: "#059669", mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  {safePercentage(statsData.avgAttendance)}
                </Typography>
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  متوسط الحضور
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent sx={{ textAlign: "center" }}>
                <Assignment sx={{ fontSize: 40, color: "#f59e0b", mb: 1 }} />
                <Typography
                  variant="h4"
                  fontWeight={900}
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                >
                  {statsData.totalAssignments}
                </Typography>
                <Typography
                  variant="caption"
                  fontFamily="Cairo, sans-serif"
                  sx={{ color: darkMode ? "#94a3b8" : "text.secondary" }}
                >
                  واجبات مكتملة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {children.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              border: '1px solid',
              borderColor: darkMode ? '#334155' : '#e5e7eb',
              bgcolor: darkMode ? '#1e293b' : 'white',
              borderRadius: 3,
            }}
          >
            <Assessment sx={{ fontSize: 64, color: darkMode ? '#475569' : '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
              No reports available yet.
            </Typography>
          </Card>
        ) : (
          <>
            {/* Children Comparison */}
            {filteredChildren.length > 0 ? (
              <Card
                elevation={0}
                sx={{
                  mb: 4,
                  border: "1px solid",
                  borderColor: darkMode ? "#334155" : "#e5e7eb",
                  bgcolor: darkMode ? "#1e293b" : "white",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                    <CompareArrows sx={{ color: "#2563eb" }} />
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      fontFamily="Cairo, sans-serif"
                      sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}
                    >
                      {selectedChild === "all"
                        ? "مقارنة بين الأبناء"
                        : `تقارير ${filteredChildren[0]?.name || 'الطالب'}`}
                    </Typography>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>الطالب</TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>المتوسط</TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>الحضور</TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>الواجبات</TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>الترتيب</TableCell>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>الاتجاه</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {childRows.map((child, index) => (
                          <TableRow key={child.id}>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Avatar sx={{ bgcolor: getChildColor(index), fontFamily: "Cairo, sans-serif", fontWeight: 900 }}>{child.avatar}</Avatar>
                                <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>{child.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={700} sx={{ mb: 0.5, color: darkMode ? "#f1f5f9" : "inherit" }}>{safePercentage(child.averageGrade)}</Typography>
                                <LinearProgress variant="determinate" value={safeProgressValue(child.averageGrade)} sx={{ height: 6, borderRadius: 3, bgcolor: darkMode ? "#334155" : "#e5e7eb", "& .MuiLinearProgress-bar": { bgcolor: safeNumber(child.averageGrade) >= 80 ? "#059669" : "#f59e0b", borderRadius: 3 } }} />
                              </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2" fontFamily="Cairo, sans-serif" fontWeight={600} sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>{safePercentage(child.attendance)}</Typography></TableCell>
                            <TableCell><Typography variant="body2" fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>{child.completedAssignments}/{child.totalAssignments || '-'}</Typography></TableCell>
                            <TableCell>
                              <Chip icon={<EmojiEvents />} label={typeof child.rank === 'number' ? `#${child.rank}` : child.rank} size="small" sx={{ bgcolor: child.rank === 1 ? "#fef3c7" : "#f3f4f6", color: child.rank === 1 ? "#f59e0b" : "#6b7280", fontFamily: "Cairo, sans-serif", fontWeight: 700 }} />
                            </TableCell>
                            <TableCell>{child.trend === "up" ? <TrendingUp sx={{ color: "#059669" }} /> : <TrendingDown sx={{ color: "#dc2626" }} />}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : null}

            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: darkMode ? "#334155" : "#e5e7eb",
                bgcolor: darkMode ? "#1e293b" : "white",
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                  <Assessment sx={{ color: "#7c3aed" }} />
                  <Typography variant="h6" fontWeight={900} fontFamily="Cairo, sans-serif" sx={{ color: darkMode ? "#f1f5f9" : "inherit" }}>الأداء حسب المادة</Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: darkMode ? "#0f172a" : "#f9fafb" }}>
                        <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>المادة</TableCell>
                        {filteredChildren.map((child, idx) => (
                          <TableCell key={child.id} sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, color: darkMode ? "#f1f5f9" : "inherit" }}>{child.name}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceData.map((subject, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontFamily: "Cairo, sans-serif", fontWeight: 600, color: darkMode ? "#f1f5f9" : "inherit" }}>{subject.subject}</TableCell>
                          {filteredChildren.map((child) => (
                            <TableCell key={child.id}>
                              <Chip label={safePercentage(subject[child.id], '-')} size="small" sx={{ bgcolor: safeNumber(subject[child.id]) >= 80 ? "#f0fdf4" : subject[child.id] != null ? "#fffbeb" : "#f3f4f6", color: safeNumber(subject[child.id]) >= 80 ? "#059669" : subject[child.id] != null ? "#f59e0b" : "#94a3b8", fontFamily: "Cairo, sans-serif", fontWeight: 700 }} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Reports;
