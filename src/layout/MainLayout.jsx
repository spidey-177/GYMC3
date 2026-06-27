import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Dumbbell,
  ClockAlert,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function MainLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };
  const navItems = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
    { to: "/recepcion", icon: <ScanLine size={20} />, label: "Recepción" },
    { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
    { to: "/planes", icon: <Dumbbell size={20} />, label: "Planes" },
    { to: "/asistencia", icon: <ClockAlert size={20} />, label: "Asistencia" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar / Menú Lateral */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 center flex flex-col items-center">
          <img src="../../public/favicon.png" alt="Favicon" />
          <h1 className="text-2xl font-bold text-[#1a6b32] tracking-tight">
            GymC3
          </h1>
          <p className="text-xs text-gray-500 mt-1">Control y Recepción</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#edf7f0] text-[#1a6b32] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Cerrar sesión */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Área de contenido principal (Aquí se renderizan las páginas) */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
