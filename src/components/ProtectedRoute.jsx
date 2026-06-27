import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
