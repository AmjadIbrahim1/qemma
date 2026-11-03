// frontend/src/utils/validators.js
export const validators = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) || 'البريد الإلكتروني غير صالح';
  },

  password: (password) => {
    if (password.length < 8) {
      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على حرف صغير';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على حرف كبير';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'كلمة المرور يجب أن تحتوي على رقم';
    }
    return true;
  },

  phone: (phone) => {
    const re = /^01[0-2,5]{1}[0-9]{8}$/;
    return re.test(phone) || 'رقم الهاتف غير صالح';
  },

  required: (value) => {
    return !!value || 'هذا الحقل مطلوب';
  },

  minLength: (min) => (value) => {
    return value.length >= min || `يجب أن يكون على الأقل ${min} أحرف`;
  },

  maxLength: (max) => (value) => {
    return value.length <= max || `يجب ألا يزيد عن ${max} حرف`;
  },

  numeric: (value) => {
    return !isNaN(value) || 'يجب أن يكون رقمًا';
  },

  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return 'الرابط غير صالح';
    }
  }
};