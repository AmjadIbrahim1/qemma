// frontend/src/components/landing/Navbar/LandingNavbar.jsx - بدون زرار العودة لأعلى
import { useContext, useEffect, useState } from 'react';
import { Button, IconButton, Menu, MenuItem, Avatar, Chip, CircularProgress } from '@mui/material';
import { 
  Brightness4, 
  Brightness7, 
  PersonOutline,
  LogoutOutlined,
  DashboardOutlined,
  ExpandMore
} from '@mui/icons-material';
import ThemeContext from '../../../contexts/ThemeContext';
import { useAuth } from '../../../hooks/useAuth';
import styles from './Navbar.module.css';
import { Link, useNavigate } from 'react-router-dom';

const LandingNavbar = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const NAV_LINKS = [
    { label: 'الرئيسية', href: '#hero', id: 'hero' },
    { label: 'المميزات', href: '#features', id: 'features' },
    { label: 'المواد الدراسية', href: '#courses', id: 'courses' },
    { label: 'اوائل قمه', href: '#top-students', id: 'top-students' },
    { label: 'المسابقات الذهبية', href: '#contest-section', id: 'contest-section' },
    { label: 'من نحن', href: '#about', id: 'about' },
  ];

  const navigateToHome = () => {
    console.log('🏠 Home button clicked');
    
    if (window.location.pathname !== '/') {
      console.log('🔄 Not on landing page, navigating to /');
      navigate('/');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      console.log('✅ Already on landing page, scrolling to top');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavClick = (e, link) => {
    e.preventDefault();
    
    console.log('📍 Nav link clicked:', link.label);
    
    // ✅ NEW: "المسابقات الذهبية" redirects to the contests page based on role (student/teacher).
    if (link.id === 'contest-section' && user) {
      const contestRoute = user.role === 'student' ? '/student/contests'
        : user.role === 'teacher' ? '/teacher/contests'
        : null;
      if (contestRoute) { navigate(contestRoute); return; }
    }
    
    if (window.location.pathname !== '/') {
      console.log('🔄 Not on landing page, navigating to / first');
      navigate('/');
      setTimeout(() => {
        scrollToSection(link.id);
      }, 100);
    } else {
      console.log('✅ On landing page, scrolling to section');
      scrollToSection(link.id);
    }
  };

  const scrollToSection = (id) => {
    console.log('📍 Scrolling to section:', id);
    const element = document.getElementById(id);
    if (element) {
      const navbarHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.warn('⚠️ Section not found:', id);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    setLoggingOut(true);
    
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const handleDashboard = () => {
    handleMenuClose();
    
    let dashboardRoute;
    
    switch(user?.role) {
      case 'student':
        dashboardRoute = '/student/dashboard';
        break;
      case 'teacher':
        dashboardRoute = '/teacher/dashboard';
        break;
      case 'assistant_teacher':
        dashboardRoute = '/assistant-teacher/dashboard';
        break;
      case 'parent':
        dashboardRoute = '/parent/dashboard';
        break;
      default:
        dashboardRoute = '/student/dashboard';
    }
    
    console.log('📊 Navigating to dashboard:', dashboardRoute);
    navigate(dashboardRoute);
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      student: 'طالب',
      teacher: 'مدرس',
      assistant_teacher: 'مدرس مساعد',
      parent: 'ولي أمر',
      admin: 'مسؤول'
    };
    return roleMap[role] || 'مستخدم';
  };

  const getRoleColor = (role) => {
    const colorMap = {
      student: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%)',
      teacher: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.15) 100%)',
      assistant_teacher: 'linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(16,185,129,0.15) 100%)',
      parent: 'linear-gradient(135deg, rgba(219,39,119,0.15) 0%, rgba(236,72,153,0.15) 100%)',
      admin: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(249,115,22,0.15) 100%)',
    };
    return colorMap[role] || 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%)';
  };

  const getRoleBorderColor = (role, isDark) => {
    const colorMap = {
      student: isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.25)',
      teacher: isDark ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.25)',
      assistant_teacher: isDark ? 'rgba(5,150,105,0.3)' : 'rgba(5,150,105,0.25)',
      parent: isDark ? 'rgba(219,39,119,0.3)' : 'rgba(219,39,119,0.25)',
      admin: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.25)',
    };
    return colorMap[role] || (isDark ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.25)');
  };

  const getRoleTextColor = (role, isDark) => {
    const colorMap = {
      student: isDark ? 'rgba(191,219,254,0.95)' : 'rgb(30,64,175)',
      teacher: isDark ? 'rgba(233,213,255,0.95)' : 'rgb(88,28,135)',
      assistant_teacher: isDark ? 'rgba(167,243,208,0.95)' : 'rgb(4,120,87)',
      parent: isDark ? 'rgba(251,207,232,0.95)' : 'rgb(157,23,77)',
      admin: isDark ? 'rgba(254,202,202,0.95)' : 'rgb(153,27,27)',
    };
    return colorMap[role] || (isDark ? 'rgba(191,219,254,0.95)' : 'rgb(30,64,175)');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name[0];
  };

  if (loggingOut) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
        }}>
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <div style={{ fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
            جاري تسجيل الخروج...
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className={styles.header} dir="rtl" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: darkMode 
          ? '0 2px 10px rgba(0, 0, 0, 0.3)' 
          : '0 2px 10px rgba(0, 0, 0, 0.1)',
      }}>
        <div className={styles.container}>
          <button 
            type="button" 
            className={styles.logo} 
            onClick={navigateToHome}
            style={{ cursor: 'pointer' }}
          >
            قِمّة
          </button>

          <nav className={styles.links}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={styles.link}
                onClick={(e) => handleNavClick(e, link)}
                style={{
                  color: link.id === 'contest-section' 
                    ? '#f59e0b' 
                    : 'inherit',
                  fontWeight: link.id === 'contest-section' 
                    ? 800 
                    : 600,
                }}
              >
                {link.id === 'contest-section' && '🏆 '}
                {link.label}
              </a>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className={styles.actions}>
            <span className={styles.toggle}>
              <IconButton onClick={toggleTheme} size="small" aria-label="toggle theme">
                {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
              </IconButton>
            </span>

            {user ? (
              <>
                <Button
                  onClick={handleMenuOpen}
                  sx={{
                    fontFamily: 'Cairo, sans-serif',
                    fontWeight: 700,
                    color: 'inherit',
                    textTransform: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                  }}
                  endIcon={<ExpandMore />}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      fontSize: '0.875rem',
                      background: user.role === 'assistant_teacher' 
                        ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
                    }}
                  >
                    {getInitials(user.name)}
                  </Avatar>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    lineHeight: 1.2 
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 900 }}>
                      {user.name}
                    </span>
                    <Chip 
                      label={getRoleLabel(user.role)}
                      size="small"
                      sx={{
                        height: '18px',
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        fontFamily: 'Cairo, sans-serif',
                        background: getRoleColor(user.role),
                        color: getRoleTextColor(user.role, darkMode),
                        border: '1px solid',
                        borderColor: getRoleBorderColor(user.role, darkMode),
                      }}
                    />
                  </div>
                </Button>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      borderRadius: 2,
                      fontFamily: 'Cairo, sans-serif',
                    }
                  }}
                >
                  <MenuItem 
                    onClick={handleDashboard}
                    sx={{ 
                      fontFamily: 'Cairo, sans-serif', 
                      fontWeight: 700,
                      gap: 1.5,
                    }}
                  >
                    <DashboardOutlined fontSize="small" />
                    لوحة التحكم
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      handleMenuClose();
                      navigate('/profile');
                    }}
                    sx={{ 
                      fontFamily: 'Cairo, sans-serif', 
                      fontWeight: 700,
                      gap: 1.5,
                    }}
                  >
                    <PersonOutline fontSize="small" />
                    الملف الشخصي
                  </MenuItem>
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ 
                      fontFamily: 'Cairo, sans-serif', 
                      fontWeight: 700,
                      color: 'error.main',
                      gap: 1.5,
                    }}
                  >
                    <LogoutOutlined fontSize="small" />
                    تسجيل الخروج
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Link to="/login" className={styles.routerLink}>
                  <Button
                    variant="text"
                    sx={{
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 800,
                      color: 'inherit',
                      px: 1.25,
                    }}
                  >
                    تسجيل الدخول
                  </Button>
                </Link>

                <Link to="/register" className={styles.routerLink}>
                  <Button
                    variant="contained"
                    disableElevation
                    sx={{
                      fontFamily: 'Cairo, sans-serif',
                      fontWeight: 900,
                      borderRadius: 2,
                      px: 2.5,
                      background:
                        'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 55%, #be185d 100%)',
                      },
                    }}
                  >
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div style={{ height: '80px' }} />
    </>
  );
};

export default LandingNavbar;