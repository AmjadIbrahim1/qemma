// frontend/src/services/lessons.service.js

import API from './api';

const lessonsService = {
  /**
   * رفع درس جديد
   * @param {object}    data       - { courseId, title, content, summary, order, isPublished }
   * @param {File|null} videoFile
   * @param {File|null} pdfFile
   * @param {function}  onProgress - (percent: number) => void
   */
  createLesson: (data, videoFile, pdfFile, onProgress) => {
    const formData = new FormData();

    // ── fields ──────────────────────────────────────────────────
    if (data.courseId)                 formData.append('courseId',    data.courseId);
    if (data.title)                    formData.append('title',       data.title.trim());
    if (data.content)                  formData.append('content',     data.content);
    if (data.summary)                  formData.append('summary',     data.summary);
    if (data.order !== undefined)      formData.append('order',       String(data.order));
    formData.append('isPublished',     String(data.isPublished ?? false));

    // ── files ────────────────────────────────────────────────────
    if (videoFile) formData.append('video', videoFile);
    if (pdfFile)   formData.append('pdf',   pdfFile);

    return API.post('/lessons', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * تعديل درس
   * @param {string}    lessonId
   * @param {object}    data
   * @param {File|null} videoFile
   * @param {File|null} pdfFile
   * @param {function}  onProgress
   */
  updateLesson: (lessonId, data, videoFile, pdfFile, onProgress) => {
    const formData = new FormData();

    if (data.courseId)                    formData.append('courseId',    data.courseId);
    if (data.title)                       formData.append('title',       data.title.trim());
    if (data.content  !== undefined)      formData.append('content',     data.content);
    if (data.summary  !== undefined)      formData.append('summary',     data.summary);
    if (data.order    !== undefined)      formData.append('order',       String(data.order));
    if (data.isPublished !== undefined)   formData.append('isPublished', String(data.isPublished));

    if (videoFile) formData.append('video', videoFile);
    if (pdfFile)   formData.append('pdf',   pdfFile);

    return API.put(`/lessons/${lessonId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * جلب دروس كورس معين
   */
  getCourseLessons: (courseId) =>
    API.get(`/lessons/course/${courseId}`),

  /**
   * جلب درس بـ ID
   */
  getLesson: (lessonId) =>
    API.get(`/lessons/${lessonId}`),

  /**
   * حذف درس
   */
  deleteLesson: (lessonId) =>
    API.delete(`/lessons/${lessonId}`),
};

export default lessonsService;