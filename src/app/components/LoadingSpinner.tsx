export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 border-8 border-blue-200 rounded-full"></div>
          <div className="absolute inset-0 border-8 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Cargando...</h2>
        <p className="text-gray-600">Preparando tu imperio financiero</p>
      </div>
    </div>
  );
}
