// frontend/src/services/payment.service.js

import API from './api';

const paymentService = {
  /**
   * جلب بيانات المنتج قبل الدفع
   * @param {string} itemId
   * @param {'course'|'book'} itemType
   */
  getItemDetails: (itemId, itemType) =>
    API.get(`/payments/item/${itemType}/${itemId}`),

  /**
   * التحقق من كود الخصم
   * @param {string} code
   */
  validatePromoCode: (code) =>
    API.post('/payments/validate-promo', { code }),

  /**
   * تنفيذ عملية الشراء
   * @param {{ itemId, itemType, paymentMethod, promoCode, totalAmount }} data
   */
  processPayment: (data) =>
    API.post('/payments/process', data),
};

export default paymentService;