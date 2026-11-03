// frontend/src/components/layouts/AppLayout/AppLayout.jsx
// ✅ الكود الأصلي محافظ عليه بالكامل
// ✅ تمت إضافة Socket.IO + OTPPopupContainer فقط

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from '../../landing/Navbar/LandingNavbar';
import { useAuth } from '../../../hooks/useAuth';
import useSocket from '../../../hooks/useSocket';
import OTPPopupContainer from '../../OTPPopup';
import AiAssistant from '../../AiAssistant/AiAssistant';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  // ── الأصلي: صفحات بدون Navbar ──────────────────────────────
  const noNavbarPaths = ['/login', '/register', '/auth/clerk-callback'];
  const shouldShowNavbar = !noNavbarPaths.includes(location.pathname);

  // ── جديد: Socket للـ OTP popup ─────────────────────────────
  const token = useMemo(() => localStorage.getItem('token'), [user]);
  const shouldConnect =
    !!(user && token) &&
    (user.role === 'teacher' || user.role === 'student');

  const { socketEvents } = useSocket(
    shouldConnect ? token : null,
    shouldConnect,
  );

  return (
    <>
      {shouldShowNavbar && <LandingNavbar />}
      <main>{children}</main>

      {/* OTP popup — يظهر فوق كل حاجة على أي صفحة */}
      {shouldConnect && (
        <OTPPopupContainer socketEvents={socketEvents} />
      )}

      {/* AI Assistant — يظهر فوق كل حاجة على أي صفحة */}
      <AiAssistant />
    </>
  );
};
export default AppLayout;