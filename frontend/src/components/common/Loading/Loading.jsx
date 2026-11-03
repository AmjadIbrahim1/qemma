// frontend/src/components/common/Loading/Loading.jsx
export const Loading = ({ fullScreen = false, size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const spinnerClass = `animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`;

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className={spinnerClass}></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className={spinnerClass}></div>
    </div>
  );
};