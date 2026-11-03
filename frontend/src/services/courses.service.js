// frontend/src/services/courses.service.js
import API from './api';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const coursesService = {
  createCourse: async (formData) => {
    let thumbnailBase64 = null;
    if (formData.thumbnail instanceof File) {
      thumbnailBase64 = await fileToBase64(formData.thumbnail);
    }
    const payload = {
      title:         formData.title?.trim(),
      description:   formData.description?.trim(),
      category:      formData.category,
      level:         formData.level,
      price:         parseFloat(formData.price) || 0,
      duration:      parseInt(formData.duration) || null,
      maxStudents:   formData.maxStudents ? parseInt(formData.maxStudents) : null,
      startDate:     formData.startDate || null,
      endDate:       formData.endDate || null,
      prerequisites: JSON.stringify(formData.prerequisites || []),
      isPublished:   formData.isPublished || false,
      thumbnailBase64,
    };
    return API.post('/courses', payload);
  },

  updateCourse: async (courseId, formData) => {
    let thumbnailBase64 = undefined;
    if (formData.thumbnail instanceof File) {
      thumbnailBase64 = await fileToBase64(formData.thumbnail);
    }
    const payload = {
      title:         formData.title?.trim(),
      description:   formData.description?.trim(),
      category:      formData.category,
      level:         formData.level,
      price:         parseFloat(formData.price) || 0,
      duration:      parseInt(formData.duration) || null,
      maxStudents:   formData.maxStudents ? parseInt(formData.maxStudents) : null,
      startDate:     formData.startDate || null,
      endDate:       formData.endDate || null,
      prerequisites: JSON.stringify(formData.prerequisites || []),
      isPublished:   formData.isPublished,
    };
    if (thumbnailBase64 !== undefined) payload.thumbnailBase64 = thumbnailBase64;
    return API.put(`/courses/${courseId}`, payload);
  },

  getMyCourses: async () => API.get('/courses/my'),

  getPublishedCourses: async (params = {}) => API.get('/courses/public', { params }),

  getCourse: async (courseId) => API.get(`/courses/${courseId}`),

  deleteCourse: async (courseId) => API.delete(`/courses/${courseId}`),

  togglePublish: async (courseId) => API.patch(`/courses/${courseId}/publish`),

  getTeacherProfile: async (teacherId) => API.get(`/courses/teacher/${teacherId}`),

  getTeacherProfileByUserId: async (userId) => API.get(`/courses/teacher-by-user/${userId}`),
};

export default coursesService;