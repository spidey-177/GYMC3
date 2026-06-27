import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Dumbbell,
  ClockAlert,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function MainLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { to: "/recepcion", icon: <ScanLine size={20} />, label: "Recepción" },
    { to: "/clientes", icon: <Users size={20} />, label: "Clientes" },
    { to: "/planes", icon: <Dumbbell size={20} />, label: "Planes" },
    { to: "/asistencia", icon: <ClockAlert size={20} />, label: "Asistencia" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">

      {/* ── OVERLAY (móvil) ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo + botón cerrar (solo móvil) */}
        <div className="p-6 flex flex-col items-center relative">
          <button
            className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
          <img src="/favicon.png" alt="GymC3" className="w-12 h-12 object-contain" />
          <h1 className="text-2xl font-bold text-[#1a6b32] tracking-tight mt-1">GymC3</h1>
          <p className="text-xs text-gray-500 mt-1">Control y Recepción</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
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

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar móvil */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={22} />
          </button>
          <img src="/favicon.png" alt="GymC3" className="w-7 h-7 object-contain" />
          <span className="font-bold text-[#1a6b32] text-lg">GymC3</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
