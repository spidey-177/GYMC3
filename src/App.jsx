import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Recepcion from "./pages/Recepcion";
import Clientes from "./pages/Clientes";
import NuevoCliente from "./pages/NuevoCliente";
import ClientePerfil from "./pages/ClientePerfil";
import Planes from "./pages/Planes";
import NuevoPlan from "./pages/NuevoPlan";
import Asistencia from "./pages/Asistencia";
import Kiosk from "./pages/Kiosk";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: login sin layout */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas: ProtectedRoute verifica sesión antes de renderizar */}
        <Route element={<ProtectedRoute />}>
          {/* Modo Kiosco independiente a pantalla completa */}
          <Route path="/kiosk" element={<Kiosk />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/recepcion" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="recepcion" element={<Recepcion />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/nuevo" element={<NuevoCliente />} />
            <Route path="clientes/:id" element={<ClientePerfil />} />
            <Route path="planes" element={<Planes />} />
            <Route path="planes/nuevo" element={<NuevoPlan />} />
            <Route path="asistencia" element={<Asistencia />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
