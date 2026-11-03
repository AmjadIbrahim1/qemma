// frontend/src/services/auth.service.js
// All API calls to the auth backend.
// The backend generates usernames — this service just passes responses through.

import API from './api';

export const authService = {
  // ── Register (local) ──────────────────────────────────────────
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user',  JSON.stringify(response.data.data.user));
    }
    return response;
  },

  // ── Login (local) ─────────────────────────────────────────────
  login: async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user',  JSON.stringify(response.data.data.user));
    }
    return response;
  },

  // ── Login (Clerk) ─────────────────────────────────────────────
  loginWithClerk: async (clerkUserId, role = 'student', division = null, subject = null, teacherName = null, studentUsername = null, year = null, stream = null, phone = null) => {
    const response = await API.post('/auth/clerk', {
      clerkUserId,
      role,
      division,
      subject,
      teacherName,
      studentUsername,
      year,
      stream,
      phone,
    });
    if (response.data?.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user',  JSON.stringify(response.data.data.user));
    }
    return response;
  },

  // ── Get current user ──────────────────────────────────────────
  getCurrentUser: async () => {
    return API.get('/auth/me');
  },

  // ── Update profile ────────────────────────────────────────────
  updateProfile: async (data) => {
    return API.put('/auth/profile', data);
  },

  // ── Add password ──────────────────────────────────────────────
  addPassword: async (password) => {
    return API.post('/auth/add-password', { password });
  },

  // ── Change password ───────────────────────────────────────────
  changePassword: async (oldPassword, newPassword) => {
    return API.put('/auth/change-password', { oldPassword, newPassword });
  },

  // ── Logout ────────────────────────────────────────────────────
  logout: async () => {
    return API.post('/auth/logout');
  },

  // ── Helper ────────────────────────────────────────────────────
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};