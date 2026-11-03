// frontend/src/utils/usernameGenerator.js
// Username generation happens on the BACKEND.
// This file only provides UI helpers used by ProfilePage and other components.

/**
 * Returns true for roles that receive a backend-generated username.
 * All four platform roles are included.
 */
export const shouldGenerateUsername = (role) => {
  return ['student', 'teacher', 'assistant_teacher', 'parent'].includes(role);
};

/**
 * Returns a human-readable label for the username field based on role.
 */
export const getUsernameLabel = (role) => {
  const labels = {
    student:           'اسم المستخدم (طالب)',
    teacher:           'اسم المستخدم (مدرس)',
    assistant_teacher: 'اسم المستخدم (مدرس مساعد)',
    parent:            'اسم المستخدم (ولي أمر)',
  };
  return labels[role] || 'اسم المستخدم';
};

/**
 * Returns the role prefix shown in the username (informational only).
 */
export const getRolePrefix = (role) => {
  const prefixes = {
    student:           'std',
    teacher:           'tch',
    assistant_teacher: 'ast',
    parent:            'par',
  };
  return prefixes[role] || 'usr';
};