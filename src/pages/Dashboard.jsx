import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  DoorOpen,
  ClockAlert,
  CalendarOff,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { StatCard } from "../components/StatCard";
import { AccesoEstadoBadge } from "../components/AccesoEstadoBadge";
import { getDashboardStats } from "../services/dashboard";

function getInitials(nombre) {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatHora(ts) {
  return new Date(ts).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function diasRestantes(fechaFin) {
  const [y, m, d] = fechaFin.split("-").map(Number);
  const fin = new Date(y, m - 1, d);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fin - inicioHoy) / 86400000);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [accesos, setAccesos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(({ stats, accesos_recientes, alertas }) => {
        setStats(stats);
        setAccesos(accesos_recientes);
        setAlertas(alertas);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Panel principal</h1>
        <p className="text-gray-500 mt-1">Resumen operativo del gimnasio al día de hoy.</p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl font-medium text-sm">
          Error al cargar el dashboard: {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Clientes activos"
          value={loading ? "—" : stats?.clientes_activos}
          sub="socios registrados"
          icon={Users}
          colorClass="bg-green-50 text-green-700"
          barColor="bg-green-500"
          barWidth={0}
        />
        <StatCard
          label="Asistencias hoy"
          value={loading ? "—" : stats?.asistencias_hoy}
          sub="ingresos del día"
          icon={DoorOpen}
          colorClass="bg-blue-50 text-blue-700"
          barColor="bg-blue-500"
          barWidth={0}
        />
        <StatCard
          label="Por vencer"
          value={loading ? "—" : stats?.por_vencer}
          sub="en los próximos 5 días"
          icon={ClockAlert}
          colorClass="bg-amber-50 text-amber-700"
          barColor="bg-amber-500"
          barWidth={0}
        />
        <StatCard
          label="Vencidas"
          value={loading ? "—" : stats?.vencidas}
          sub="membresías expiradas"
          icon={CalendarOff}
          colorClass="bg-red-50 text-red-700"
          barColor="bg-red-500"
          barWidth={0}
        />
      </div>

      {/* Paneles inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel: Alertas de vencimiento */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Alertas de vencimiento</h2>
            <button
              onClick={() => navigate("/clientes?filtro=vencimiento")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1a6b32] transition-colors font-medium"
            >
              Ver clientes <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading && <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p>}
            {!loading && alertas.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Sin alertas pendientes.</p>
            )}
            {alertas.map((alerta) => {
              const dias = diasRestantes(alerta.fecha_fin);
              const vencida = dias < 0;
              const titular = alerta.titular;
              const nombreCompleto = titular ? `${titular.nombre} ${titular.apellidos}` : "—";
              return (
                <div
                  key={alerta.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => titular && navigate(`/clientes/${titular.id}`)}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {getInitials(nombreCompleto)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{nombreCompleto}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {alerta.plan?.nombre ?? "—"} · {titular?.codigo_unico ?? ""}
                    </p>
                  </div>
                  {vencida ? (
                    <Badge variant="red">Vencida</Badge>
                  ) : (
                    <Badge variant="amber">
                      {dias === 1 ? "1 día" : `${dias} días`}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <Button variant="outline" className="w-full text-sm" onClick={() => navigate("/clientes?filtro=vencimiento")}>
              Ver todos los próximos a vencer
            </Button>
          </div>
        </div>

        {/* Panel: Últimos accesos del día */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Últimos accesos hoy</h2>
            <button
              onClick={() => navigate("/asistencia")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1a6b32] transition-colors font-medium"
            >
              Ver historial <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading && <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p>}
            {!loading && accesos.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Sin accesos registrados hoy.</p>
            )}
            {accesos.map((acceso) => {
              const nombre = acceso.cliente
                ? `${acceso.cliente.nombre} ${acceso.cliente.apellidos}`
                : "—";
              return (
                <div key={acceso.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="shrink-0">
                    {acceso.estado_acceso === "permitido" ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-400" />
                    )}
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{
                      background: acceso.estado_acceso === "permitido" ? "#edf7f0" : "#fef2f2",
                      color: acceso.estado_acceso === "permitido" ? "#1a6b32" : "#991b1b",
                    }}
                  >
                    {getInitials(nombre)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{nombre}</p>
                    <p className="text-xs text-gray-400">Cód. {acceso.cliente?.codigo_unico ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{formatHora(acceso.fecha_hora)}</span>
                    <AccesoEstadoBadge estado={acceso.estado_acceso} showIcon={false} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
            <Button variant="outline" className="w-full text-sm" onClick={() => navigate("/asistencia")}>
              Ver historial completo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
