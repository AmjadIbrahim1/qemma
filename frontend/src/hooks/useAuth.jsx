// frontend/src/hooks/useAuth.js
// Username is generated exclusively on the backend and returned in the user object.
// This hook just passes the backend response through — no frontend username generation.

import { useState, useEffect, createContext, useContext } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const response = await authService.getCurrentUser();
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      setUser(null);
      if (clerkSignOut) {
        try { await clerkSignOut(); } catch (_) {}
      }
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  };

  // ── LOCAL LOGIN ─────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      await clearAuthData();
      const response = await authService.login(email, password);
      const savedToken = localStorage.getItem('token');
      if (!savedToken) throw new Error('Token was not saved correctly');
      setUser(response.data.data.user);
      toast.success('تم تسجيل الدخول بنجاح');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل تسجيل الدخول';
      toast.error(errorMessage);
      throw error;
    }
  };

  // ── LOCAL REGISTER ──────────────────────────────────────────
  // Returns the full response so callers can read response.data.data.user.username
  const register = async (userData) => {
    try {
      await clearAuthData();
      const response = await authService.register(userData);
      const savedToken = localStorage.getItem('token');
      if (!savedToken) throw new Error('Token was not saved correctly');
      setUser(response.data.data.user);
      toast.success('تم إنشاء الحساب بنجاح');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل إنشاء الحساب';
      toast.error(errorMessage);
      throw error;
    }
  };

  // ── CLERK LOGIN ─────────────────────────────────────────────
  // Username is now generated exclusively on the backend.
  const loginWithClerk = async (
    clerkUserId,
    role           = 'student',
    division       = null,
    subject        = null,
    teacherName    = null,
    studentUsername = null,
    year           = null,
    stream         = null,
    phone          = null,
  ) => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const response = await authService.loginWithClerk(
        clerkUserId, role, division, subject, teacherName, studentUsername, year, stream, phone,
      );

      const savedToken = localStorage.getItem('token');
      if (!savedToken) throw new Error('Authentication failed: Token not saved');

      const savedUser = localStorage.getItem('user');
      if (!savedUser) throw new Error('Authentication failed: User data not saved');

      setUser(response.data.data.user);
      toast.success('تم تسجيل الدخول بنجاح');
      return response;
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const errorMessage = error.response?.data?.message || error.message || 'فشل تسجيل الدخول';
      toast.error(errorMessage);
      throw error;
    }
  };

  // ── UPDATE PROFILE ──────────────────────────────────────────
  const updateProfile = async (data) => {
    try {
      const response = await authService.updateProfile(data);
      setUser(response.data.data);
      toast.success('تم تحديث الملف الشخصي بنجاح');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل تحديث الملف الشخصي';
      toast.error(errorMessage);
      throw error;
    }
  };

  // ── ADD PASSWORD ────────────────────────────────────────────
  const addPassword = async (password) => {
    try {
      const response = await authService.addPassword(password);
      const updatedUser = { ...user, hasPassword: true, authProvider: 'hybrid' };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('تمت إضافة كلمة المرور بنجاح');
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'فشل إضافة كلمة المرور';
      toast.error(errorMessage);
      throw error;
    }
  };

  // ── LOGOUT ──────────────────────────────────────────────────
  const logout = async () => {
    try {
      if (clerkSignOut) {
        try { await clerkSignOut({ redirectUrl: '/' }); } catch (_) {
          try { await clerkSignOut(); } catch (__) {}
        }
      }
      try { await authService.logout(); } catch (_) {}

      localStorage.clear();
      sessionStorage.clear();

      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }

      if (window.indexedDB) {
        try {
          const dbs = await window.indexedDB.databases();
          dbs.forEach((db) => window.indexedDB.deleteDatabase(db.name));
        } catch (_) {}
      }

      setUser(null);
      toast.success('تم تسجيل الخروج بنجاح');

      setTimeout(() => {
        window.location.href = '/';
        setTimeout(() => window.location.reload(true), 100);
      }, 500);
    } catch (error) {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithClerk, updateProfile, addPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};