// frontend/src/pages/teacher/CreateCourse.jsx
// التصنيف = المادة التي اختارها المدرس عند التسجيل (من useAuth)
// لا يوجد dropdown للتصنيف — يُعرض فقط كـ badge

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import coursesService from '../../services/courses.service';
import toast from 'react-hot-toast';

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();

  // ── المادة من بيانات المستخدم ─────────────────────────────────
  // specialties[0] أو expertise أو subject المخزّن في teacher profile
  const teacherSubject =
    user?.teacher?.specialties?.[0] ||
    user?.teacher?.expertise        ||
    user?.subject                   ||
    '';

  const [loading,  setLoading]  = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Form State ────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title:         '',
    description:   '',
    level:         '',
    price:         '',
    duration:      '',
    maxStudents:   '',
    startDate:     '',
    endDate:       '',
    prerequisites: [],
    thumbnail:     null,
    isPublished:   false,
  });

  const [prerequisite,     setPrerequisite]     = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [errors,           setErrors]           = useState({});

  // ── Static Data ───────────────────────────────────────────────
  const levels = [
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي',
  ];

  // ── Handlers ──────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSnackbar('يرجى اختيار صورة فقط', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
      return;
    }
    setFormData(prev => ({ ...prev, thumbnail: file }));
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAddPrerequisite = () => {
    if (prerequisite.trim()) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisite.trim()],
      }));
      setPrerequisite('');
    }
  };

  const handleRemovePrerequisite = (index) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnail: null }));
    const input = document.getElementById('thumbnail-upload');
    if (input) input.value = '';
  };

  // ── Validation ────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim())       newErrors.title       = 'عنوان الكورس مطلوب';
    if (!formData.description.trim()) newErrors.description = 'وصف الكورس مطلوب';
    if (!formData.level)              newErrors.level       = 'المستوى مطلوب';
    if (!formData.price)              newErrors.price       = 'السعر مطلوب';
    if (formData.price && isNaN(formData.price))
                                      newErrors.price       = 'السعر يجب أن يكون رقماً';

    if (!formData.startDate)          newErrors.startDate   = 'تاريخ البداية مطلوب';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!validateForm()) {
      showSnackbar('يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }
    setLoading(true);
    try {
      // نرسل المادة كـ category تلقائياً
      await coursesService.createCourse({
        ...formData,
        category: teacherSubject,
      });
      toast.success('تم إنشاء الكورس بنجاح! 🎉');
      showSnackbar('تم إنشاء الكورس بنجاح! 🎉', 'success');
      setTimeout(() => navigate('/teacher/my-courses'), 1200);
    } catch (error) {
      console.error('❌ Error creating course:', error);
      const msg = error?.response?.data?.message || 'حدث خطأ أثناء إنشاء الكورس';
      toast.error(msg);
      showSnackbar(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
  };

  const inputStyle = (hasError = false) => ({
    width: '100%', padding: '12px', borderRadius: '8px',
    border: hasError ? '2px solid #ef4444' : '1px solid #475569',
    background: '#0f172a', color: '#f1f5f9',
    fontFamily: 'Cairo, sans-serif', fontSize: '16px',
    boxSizing: 'border-box', outline: 'none',
  });

  const labelStyle = {
    display: 'block', marginBottom: '8px',
    fontFamily: 'Cairo, sans-serif', color: '#f1f5f9', fontWeight: 600,
  };

  const errorStyle = {
    color: '#ef4444', fontSize: '14px',
    margin: '5px 0 0', fontFamily: 'Cairo, sans-serif',
  };

  const cardStyle = {
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: '12px', padding: '30px', marginBottom: '20px',
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #db2777 100%)',
        color: 'white', padding: '30px 20px', borderRadius: '12px', marginBottom: '30px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
              padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '18px',
            }}
          >←</button>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'Cairo, sans-serif', fontSize: '28px', fontWeight: 900 }}>
              إنشاء كورس جديد
            </h1>
            <p style={{ margin: '5px 0 0', opacity: 0.9, fontFamily: 'Cairo, sans-serif' }}>
              أضف كورساً جديداً لطلابك
            </p>
          </div>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px',
      }}>

        {/* ════ Main Form ════ */}
        <div>

          {/* ── Basic Info Card ── */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 25px', fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: 900, color: '#f1f5f9' }}>
              المعلومات الأساسية
            </h2>

            {/* Title */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>عنوان الكورس *</label>
              <input
                type="text" name="title" value={formData.title}
                onChange={handleChange} placeholder="مثال: دورة الفيزياء الشاملة"
                style={inputStyle(!!errors.title)}
              />
              {errors.title && <p style={errorStyle}>{errors.title}</p>}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>وصف الكورس *</label>
              <textarea
                name="description" value={formData.description}
                onChange={handleChange} rows={4}
                placeholder="اكتب وصفاً تفصيلياً للكورس..."
                style={{ ...inputStyle(!!errors.description), resize: 'vertical' }}
              />
              {errors.description && <p style={errorStyle}>{errors.description}</p>}
            </div>

            {/* ── التصنيف تلقائي من المادة ── */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>التصنيف (مادتك الدراسية)</label>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                borderRadius: '30px', color: 'white',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '15px',
              }}>
                <span>📚</span>
                <span>{teacherSubject || 'لم يتم تحديد المادة'}</span>
              </div>
              {!teacherSubject && (
                <p style={{ ...errorStyle, marginTop: '8px' }}>
                  ⚠️ لم يتم تحديد مادتك الدراسية في ملفك الشخصي
                </p>
              )}
            </div>

            {/* Level */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>المستوى *</label>
              <select
                name="level" value={formData.level} onChange={handleChange}
                style={{ ...inputStyle(!!errors.level), cursor: 'pointer' }}
              >
                <option value="">اختر المستوى</option>
                {levels.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
              {errors.level && <p style={errorStyle}>{errors.level}</p>}
            </div>

            {/* Prerequisites */}
            <div>
              <label style={labelStyle}>المتطلبات السابقة (اختياري)</label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text" value={prerequisite}
                  onChange={e => setPrerequisite(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrerequisite(); } }}
                  placeholder="أضف متطلب..."
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px',
                    border: '1px solid #475569', background: '#0f172a',
                    color: '#f1f5f9', fontFamily: 'Cairo, sans-serif', outline: 'none',
                  }}
                />
                <button
                  type="button" onClick={handleAddPrerequisite}
                  style={{
                    padding: '10px 20px', background: '#2563eb', border: 'none',
                    borderRadius: '8px', color: 'white',
                    fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: 'pointer',
                  }}
                >إضافة</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.prerequisites.map((prereq, index) => (
                  <span key={index} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 15px', background: '#334155', color: '#f1f5f9',
                    borderRadius: '20px', fontFamily: 'Cairo, sans-serif', fontSize: '14px',
                  }}>
                    {prereq}
                    <button
                      type="button" onClick={() => handleRemovePrerequisite(index)}
                      style={{
                        background: 'transparent', border: 'none', color: '#f87171',
                        cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1,
                      }}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Course Details Card ── */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 25px', fontFamily: 'Cairo, sans-serif', fontSize: '22px', fontWeight: 900, color: '#f1f5f9' }}>
              تفاصيل الكورس
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>

              {/* Price */}
              <div>
                <label style={labelStyle}>السعر (جنيه) *</label>
                <input
                  type="number" name="price" value={formData.price}
                  onChange={handleChange} placeholder="مثال: 500" min="0"
                  style={inputStyle(!!errors.price)}
                />
                {errors.price && <p style={errorStyle}>{errors.price}</p>}
                {formData.price && !isNaN(formData.price) && (
                  <div style={{
                    marginTop: '8px', padding: '12px', borderRadius: '8px',
                    background: 'rgba(37, 99, 235, 0.1)', border: '1px solid #2563eb',
                    fontFamily: 'Cairo, sans-serif', fontSize: '14px', color: '#93c5fd',
                  }}>
                    <strong>تنبيه:</strong> المنصة تأخذ 20% من كل اشتراك. ستحصل على{' '}
                    <strong>{(parseFloat(formData.price) * 0.8).toFixed(2)}</strong> جنيه لكل طالب.
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label style={labelStyle}>المدة (بالأسابيع) (اختياري)</label>
                <input
                  type="number" name="duration" value={formData.duration}
                  onChange={handleChange} placeholder="مثال: 8" min="1"
                  style={inputStyle(!!errors.duration)}
                />
                {errors.duration && <p style={errorStyle}>{errors.duration}</p>}
              </div>

              {/* Max Students */}
              <div>
                <label style={labelStyle}>الحد الأقصى للطلاب (اختياري)</label>
                <input
                  type="number" name="maxStudents" value={formData.maxStudents}
                  onChange={handleChange} placeholder="مثال: 30" min="1"
                  style={inputStyle(false)}
                />
              </div>

              {/* Start Date */}
              <div>
                <label style={labelStyle}>تاريخ البداية *</label>
                <input
                  type="date" name="startDate" value={formData.startDate}
                  onChange={handleChange}
                  style={inputStyle(!!errors.startDate)}
                />
                {errors.startDate && <p style={errorStyle}>{errors.startDate}</p>}
              </div>

              {/* End Date */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>تاريخ النهاية (اختياري)</label>
                <input
                  type="date" name="endDate" value={formData.endDate}
                  onChange={handleChange}
                  style={inputStyle(false)}
                />
              </div>
            </div>
          </div>

          {/* ── Publish Option Card ── */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'Cairo, sans-serif', fontSize: '18px', fontWeight: 900, color: '#f1f5f9' }}>
                  نشر الكورس
                </h3>
                <p style={{ margin: 0, fontFamily: 'Cairo, sans-serif', fontSize: '14px', color: '#94a3b8' }}>
                  {formData.isPublished
                    ? 'الكورس سيكون مرئياً للطلاب فور الإنشاء'
                    : 'الكورس سيُحفظ كمسودة غير منشورة'}
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', cursor: 'pointer' }}>
                <input
                  type="checkbox" name="isPublished"
                  checked={formData.isPublished} onChange={handleChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: formData.isPublished ? '#2563eb' : '#475569',
                  borderRadius: '28px', transition: '0.3s',
                }} />
                <span style={{
                  position: 'absolute', top: '3px',
                  left: formData.isPublished ? '27px' : '3px',
                  width: '22px', height: '22px', background: 'white',
                  borderRadius: '50%', transition: '0.3s',
                }} />
              </label>
            </div>
          </div>
        </div>

        {/* ════ Sidebar ════ */}
        <div>

          {/* ── Thumbnail Card ── */}
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontFamily: 'Cairo, sans-serif', fontSize: '20px', fontWeight: 900, color: '#f1f5f9' }}>
              صورة الكورس
            </h3>
            {thumbnailPreview ? (
              <div style={{ position: 'relative', marginBottom: '15px' }}>
                <img src={thumbnailPreview} alt="Preview"
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                <button type="button" onClick={handleRemoveThumbnail}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white',
                    width: '30px', height: '30px', borderRadius: '50%',
                    cursor: 'pointer', fontSize: '20px', lineHeight: 1,
                  }}
                >×</button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('thumbnail-upload').click()}
                style={{
                  padding: '40px 20px', marginBottom: '15px', textAlign: 'center',
                  border: '2px dashed #475569', borderRadius: '8px',
                  background: '#0f172a', cursor: 'pointer', transition: 'border-color 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#475569'}
              >
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🖼️</div>
                <p style={{ color: '#94a3b8', fontFamily: 'Cairo, sans-serif', margin: 0 }}>اضغط لرفع صورة</p>
              </div>
            )}
            <input id="thumbnail-upload" type="file" accept="image/*"
              onChange={handleThumbnailChange} style={{ display: 'none' }} />
            <button type="button"
              onClick={() => document.getElementById('thumbnail-upload').click()}
              style={{
                width: '100%', padding: '12px', background: 'transparent',
                border: '1px solid #475569', borderRadius: '8px', color: '#f1f5f9',
                fontFamily: 'Cairo, sans-serif', fontWeight: 700, cursor: 'pointer',
                marginBottom: '10px',
              }}
            >📤 اختر صورة</button>
            <p style={{ fontSize: '12px', textAlign: 'center', color: '#64748b', fontFamily: 'Cairo, sans-serif', margin: 0 }}>
              الحد الأقصى: 5 ميجابايت — JPG, PNG, WEBP
            </p>
          </div>

          {/* ── Summary Card ── */}
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px', fontFamily: 'Cairo, sans-serif', fontSize: '18px', fontWeight: 900, color: '#f1f5f9' }}>
              ملخص الكورس
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'العنوان',       value: formData.title     || '—' },
                { label: 'التصنيف',       value: teacherSubject     || '—' },
                { label: 'المستوى',       value: formData.level     || '—' },
                { label: 'السعر',         value: formData.price     ? `${formData.price} جنيه` : '—' },
                { label: 'المدة',         value: formData.duration  ? `${formData.duration} أسابيع` : '—' },
                { label: 'تاريخ البداية', value: formData.startDate || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: '13px', color: '#94a3b8' }}>{label}:</span>
                  <span style={{
                    fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: 700,
                    color: '#f1f5f9', maxWidth: '160px', textAlign: 'left',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Submit Button ── */}
          <button
            type="button" onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', padding: '18px',
              background: loading
                ? '#475569'
                : 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              border: 'none', borderRadius: '12px', color: 'white',
              fontFamily: 'Cairo, sans-serif', fontWeight: 900, fontSize: '18px',
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(37,99,235,0.4)',
            }}
          >
            {loading ? '⏳ جاري الإنشاء...' : '✨ إنشاء الكورس'}
          </button>

          <button
            type="button" onClick={() => navigate('/teacher/dashboard')} disabled={loading}
            style={{
              width: '100%', padding: '12px', marginTop: '10px',
              background: 'transparent', border: '1px solid #475569',
              borderRadius: '12px', color: '#94a3b8',
              fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >إلغاء</button>
        </div>
      </div>

      {/* ── Snackbar ── */}
      {snackbar.open && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          padding: '15px 25px',
          background: snackbar.severity === 'success' ? '#10b981' : '#ef4444',
          color: 'white', borderRadius: '8px',
          fontFamily: 'Cairo, sans-serif', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span>{snackbar.message}</span>
          <button
            onClick={() => setSnackbar(prev => ({ ...prev, open: false }))}
            style={{
              background: 'transparent', border: 'none', color: 'white',
              fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1,
            }}
          >×</button>
        </div>
      )}
    </div>
  );
};

export default CreateCourse;