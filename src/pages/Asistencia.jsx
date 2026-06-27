import { useState, useEffect } from "react";
import { Search, Calendar, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PageHeader } from "../components/PageHeader";
import { FilterBar } from "../components/FilterBar";
import { AccesoEstadoBadge } from "../components/AccesoEstadoBadge";
import { getAsistencias } from "../services/asistencias";

const ESTADO_OPCIONES = [
  { value: "", label: "Todos los estados" },
  { value: "permitido", label: "Permitido" },
  { value: "denegado_vencido", label: "Membresía vencida" },
  { value: "denegado_turno", label: "Fuera de turno" },
  { value: "denegado_suspendido", label: "Cuenta suspendida" },
];

function getRango(filtro) {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const ayer = new Date(hoy.getTime() - 86400000);
  switch (filtro) {
    case "hoy":
      return { desde: hoy.toISOString(), hasta: new Date(hoy.getTime() + 86400000).toISOString() };
    case "ayer":
      return { desde: ayer.toISOString(), hasta: hoy.toISOString() };
    case "semana":
      return { desde: new Date(hoy.getTime() - 7 * 86400000).toISOString(), hasta: ahora.toISOString() };
    case "mes":
      return {
        desde: new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString(),
        hasta: ahora.toISOString(),
      };
    default:
      return {};
  }
}

function formatFechaHora(ts) {
  const d = new Date(ts);
  return {
    fecha: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
    hora: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  };
}

const PAGINA_SIZE = 20;

export default function Asistencia() {
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("hoy");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ordenAsc, setOrdenAsc] = useState(false);
  const [pagina, setPagina] = useState(1);

  // Refetch cuando cambia el período o el orden (ambos afectan la query a Supabase)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const { desde, hasta } = getRango(filtroFecha);
    getAsistencias({ desde, hasta, ordenAsc })
      .then((data) => { if (!cancelled) setAsistencias(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [filtroFecha, ordenAsc]);

  // Volver a página 1 cuando cambia cualquier filtro
  useEffect(() => { setPagina(1); }, [filtroFecha, searchTerm, filtroEstado, ordenAsc]);

  // Filtros client-side: búsqueda por texto + estado de acceso
  const registrosFiltrados = asistencias.filter((r) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const coincide =
        r.cliente?.nombre.toLowerCase().includes(term) ||
        r.cliente?.apellidos.toLowerCase().includes(term) ||
        r.cliente?.codigo_unico.toLowerCase().includes(term);
      if (!coincide) return false;
    }
    if (filtroEstado && r.estado_acceso !== filtroEstado) return false;
    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / PAGINA_SIZE));
  const registrosPagina = registrosFiltrados.slice(
    (pagina - 1) * PAGINA_SIZE,
    pagina * PAGINA_SIZE
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Historial de Asistencias"
        subtitle="Consulta el registro de entradas e intentos de acceso al gimnasio."
      />

      <FilterBar>
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-44">
          <Select icon={Calendar} value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)}>
            <option value="hoy">Hoy</option>
            <option value="ayer">Ayer</option>
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Este Mes</option>
          </Select>
        </div>
        <div className="w-full md:w-52">
          <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            {ESTADO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        <Button
          variant={ordenAsc ? "secondary" : "outline"}
          onClick={() => setOrdenAsc((v) => !v)}
          title={ordenAsc ? "Mostrando más antiguos primero" : "Mostrando más recientes primero"}
          className="shrink-0"
        >
          <ArrowUpDown size={18} />
          {ordenAsc ? "Más antiguos" : "Más recientes"}
        </Button>
      </FilterBar>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && <p className="text-center text-gray-500 py-16">Cargando asistencias...</p>}
        {error && <p className="text-center text-red-500 py-16">Error: {error}</p>}

        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Fecha y Hora</th>
                    <th className="px-6 py-4">Cliente</th>
                    <th className="px-6 py-4">Plan</th>
                    <th className="px-6 py-4">Estado del Ingreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosPagina.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-gray-400 py-16">
                        No hay registros para este período.
                      </td>
                    </tr>
                  ) : (
                    registrosPagina.map((registro) => {
                      const { fecha, hora } = formatFechaHora(registro.fecha_hora);
                      return (
                        <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{fecha}</div>
                            <div className="text-xs text-gray-500">{hora}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800">
                              {registro.cliente?.nombre} {registro.cliente?.apellidos}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {registro.cliente?.codigo_unico}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {registro.cliente?.plan_nombre ?? (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <AccesoEstadoBadge estado={registro.estado_acceso} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
              <span>
                {registrosFiltrados.length} registro{registrosFiltrados.length !== 1 ? "s" : ""}
                {registrosFiltrados.length !== asistencias.length && ` (de ${asistencias.length})`}
                {totalPaginas > 1 && ` · página ${pagina} de ${totalPaginas}`}
              </span>
              {totalPaginas > 1 && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => setPagina((p) => p - 1)}
                    disabled={pagina === 1}
                    className="px-2 py-1.5"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPagina((p) => p + 1)}
                    disabled={pagina >= totalPaginas}
                    className="px-2 py-1.5"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
