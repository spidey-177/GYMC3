import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Guard de rutas: si no hay sesión activa redirige al login.
// Mientras Supabase verifica la sesión (loading) no renderiza nada
// para evitar el parpadeo login → app en el primer render.
export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
