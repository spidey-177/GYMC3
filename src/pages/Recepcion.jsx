import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldOff,
  User,
  Calendar,
  Clock,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { processAccess } from "../services/asistencias";

// Configuración visual de cada motivo de denegación
const MOTIVOS = {
  denegado_vencido: {
    titulo: "Acceso Denegado — Membresía Vencida",
    descripcion: (datos) =>
      `El plan de ${datos.nombre} venció el ${datos.fecha_fin}. Es necesario renovar para continuar.`,
    icono: XCircle,
    colorBorde: "border-red-500",
    colorFondo: "bg-red-50",
    colorIcono: "bg-red-500",
    colorTitulo: "text-red-800",
    accion: { label: "Ir a Renovar Membresía", ruta: (id) => `/clientes/${id}` },
  },
  denegado_turno: {
    titulo: "Acceso Denegado — Fuera de Turno",
    descripcion: (datos) =>
      `${datos.nombre} tiene contratado el turno ${datos.turno}. El ingreso no está permitido a esta hora.`,
    icono: AlertTriangle,
    colorBorde: "border-amber-500",
    colorFondo: "bg-amber-50",
    colorIcono: "bg-amber-500",
    colorTitulo: "text-amber-800",
    accion: null,
  },
  denegado_suspendido: {
    titulo: "Acceso Denegado — Cuenta Suspendida",
    descripcion: (datos) =>
      `La cuenta de ${datos.nombre} está suspendida. Contacta al administrador para más información.`,
    icono: ShieldOff,
    colorBorde: "border-gray-500",
    colorFondo: "bg-gray-50",
    colorIcono: "bg-gray-600",
    colorTitulo: "text-gray-800",
    accion: { label: "Ver Perfil del Cliente", ruta: (id) => `/clientes/${id}` },
  },
  ya_registrado: {
    titulo: "Entrada Ya Registrada",
    descripcion: (datos) => {
      const hora = datos.ultima_entrada
        ? new Date(datos.ultima_entrada).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : "hace un momento";
      return `${datos.nombre} ya registró su entrada a las ${hora}. Probablemente es un doble escaneo — no se registra de nuevo.`;
    },
    icono: AlertTriangle,
    colorBorde: "border-amber-400",
    colorFondo: "bg-amber-50",
    colorIcono: "bg-amber-400",
    colorTitulo: "text-amber-800",
    accion: null,
  },
};

// "2026-11-15" → "15 nov. 2026"
function formatFecha(fecha) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// Convierte hora_inicio/hora_fin de la DB en texto legible
// "06:00:00" + "13:00:00" → "06:00 - 13:00" | turno libre → "Libre"
function formatTurno(plan) {
  if (!plan) return "—";
  if (plan.turno === "libre") return "Libre";
  if (plan.hora_inicio && plan.hora_fin) {
    return `${plan.hora_inicio.slice(0, 5)} - ${plan.hora_fin.slice(0, 5)}`;
  }
  return plan.turno;
}

export default function Recepcion() {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || buscando) return;

    setBuscando(true);
    setResultado(null);
    setNoEncontrado(false);

    const res = await processAccess(codigo.trim());

    setNoEncontrado(!res);
    setResultado(res ?? null);
    setCodigo("");
    setBuscando(false);
  };

  // Helpers para leer datos del resultado sin repetir lógica en el JSX
  const cliente = resultado?.datos_cliente;
  const membresia = resultado?.membresia;
  const nombreCompleto = cliente ? `${cliente.nombre} ${cliente.apellidos}` : "";
  const planNombre = membresia?.plan?.nombre ?? "—";
  const turnoFormato = formatTurno(membresia?.plan);
  const fechaFin = formatFecha(membresia?.fecha_fin);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Encabezado e Input Principal */}
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1a6b32]">Control de Acceso</h1>
          <p className="text-gray-500 mt-1">Escanea o ingresa el código del cliente.</p>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => navigate("/kiosk")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md border border-slate-700"
            >
              <Sparkles size={16} className="text-[#39FF14]" />
              Abrir Modo Kiosco Autoservicio (Totem Entrada)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-gray-400" size={24} />
            <input
              type="text"
              autoFocus
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder={buscando ? "Verificando..." : "Escanea o ingresa el código..."}
              disabled={buscando}
              className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-200 rounded-2xl focus:border-[#39FF14] focus:ring-4 focus:ring-green-100 outline-none transition-all shadow-sm disabled:opacity-50"
            />
          </div>
        </form>
      </div>

      {/* Código no encontrado */}
      {noEncontrado && (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-3xl p-6 text-center space-y-2">
          <p className="text-xl font-bold text-gray-700">Código no encontrado</p>
          <p className="text-gray-500 text-sm">Verifica el código e inténtalo de nuevo.</p>
        </div>
      )}

      {/* Tarjeta PERMITIDO */}
      {resultado?.acceso_concedido && (
        <div className="bg-green-50 border-2 border-green-500 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-lg">
          <div className="bg-green-500 p-4 rounded-full text-white shrink-0">
            <CheckCircle2 size={48} />
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-green-800">¡Acceso Permitido!</h2>
              <p className="text-green-600 text-xl font-medium">{nombreCompleto}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/60 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <User size={16} className="text-gray-500" />
                <span>Plan: <strong>{planNombre}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Clock size={16} className="text-gray-500" />
                <span>Turno: <strong>{turnoFormato}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Calendar size={16} className="text-gray-500" />
                <span>Vence: <strong>{fechaFin}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard size={16} className="text-gray-500" />
                {membresia?.estado_financiero === "pendiente" ? (
                  <span className="text-amber-700 font-medium">
                    Pago: <strong>Pendiente ⚠️</strong>
                  </span>
                ) : (
                  <span className="text-gray-700">
                    Pago: <strong className="text-green-600">Al día</strong>
                  </span>
                )}
              </div>
            </div>
            {membresia?.estado_financiero === "pendiente" && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
                ⚠️ El cliente tiene el pago <strong>pendiente</strong>. Acceso habilitado, pero debe regularizar su pago.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tarjeta DENEGADO — renderiza según el motivo */}
      {resultado && !resultado.acceso_concedido && (() => {
        const config = MOTIVOS[resultado.motivo];
        if (!config) return null;
        const Icono = config.icono;
        const descripcion = config.descripcion({
          nombre: nombreCompleto,
          turno: turnoFormato,
          fecha_fin: fechaFin,
          ultima_entrada: resultado?.ultima_entrada,
        });

        return (
          <div className={`${config.colorFondo} border-2 ${config.colorBorde} rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-lg`}>
            <div className={`${config.colorIcono} p-4 rounded-full text-white shrink-0`}>
              <Icono size={48} />
            </div>
            <div className="flex-1 space-y-4 w-full text-center md:text-left">
              <div>
                <h2 className={`text-2xl font-bold ${config.colorTitulo}`}>{config.titulo}</h2>
                <p className="text-gray-600 mt-1 text-sm">{descripcion}</p>
              </div>
              <div className="bg-white/60 p-4 rounded-xl text-sm text-gray-600 space-y-1">
                <p><strong>{nombreCompleto}</strong></p>
                {membresia && (
                  <p>Plan: {planNombre} · Turno: {turnoFormato}</p>
                )}
              </div>
              {config.accion && (
                <button
                  onClick={() => navigate(config.accion.ruta(cliente.id))}
                  className={`mt-2 px-6 py-2 rounded-lg font-medium transition-colors text-sm w-full md:w-auto ${
                    resultado.motivo === "denegado_vencido"
                      ? "bg-red-100 hover:bg-red-200 text-red-700"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
                >
                  {config.accion.label}
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
