// frontend/src/components/common/ErrorBoundary/ErrorBoundaryFallback.jsx
export const ErrorBoundaryFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message || 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={resetErrorBoundary}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              حاول مرة أخرى
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              العودة للرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};