import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, MoreVertical, ChevronLeft, ChevronRight, UserX, RotateCcw, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { PageHeader } from "../components/PageHeader";
import { FilterBar } from "../components/FilterBar";
import { getClientesConPlan, getClientesEliminados, reactivarCliente } from "../services/clientes";
import { getPlanes } from "../services/planes";

const PAGINA_SIZE = 15;

function diasRestantes(fechaFin) {
  if (!fechaFin) return null;
  const [y, m, d] = fechaFin.split("-").map(Number);
  const fin = new Date(y, m - 1, d);
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((fin - inicioHoy) / 86400000);
}

export default function Clientes() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPlan, setFiltroPlan] = useState("");
  const [filtroVencimiento, setFiltroVencimiento] = useState(
    () => searchParams.get("filtro") === "vencimiento"
  );
  const [pagina, setPagina] = useState(1);
  const [verEliminados, setVerEliminados] = useState(false);
  const [eliminados, setEliminados] = useState([]);
  const [reactivando, setReactivando] = useState(null);

  const limpiarFiltroVencimiento = () => {
    setFiltroVencimiento(false);
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    Promise.all([getClientesConPlan(), getPlanes()])
      .then(([cs, ps]) => { setClientes(cs); setPlanes(ps); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Carga la lista de eliminados solo cuando se abre el panel por primera vez
  useEffect(() => {
    if (!verEliminados || eliminados.length > 0) return;
    getClientesEliminados().then(setEliminados).catch((err) => setError(err.message));
  }, [verEliminados, eliminados.length]);

  const handleReactivar = async (id) => {
    setReactivando(id);
    try {
      await reactivarCliente(id);
      // Quitar de la lista de eliminados y recargar activos
      setEliminados((prev) => prev.filter((c) => c.id !== id));
      const cs = await getClientesConPlan();
      setClientes(cs);
    } catch (err) {
      setError(err.message);
    } finally {
      setReactivando(null);
    }
  };

  const clientesFiltrados = clientes.filter((c) => {
    const term = busqueda.toLowerCase();
    const coincideBusqueda =
      !term ||
      c.nombre.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      (c.codigo_unico ?? "").toLowerCase().includes(term) ||
      (c.dni ?? "").toLowerCase().includes(term);
    const coincideEstado = !filtroEstado || c.estado_cuenta === filtroEstado;
    const coincidePlan = !filtroPlan || c.membresia_actual?.plan_id === filtroPlan;
    const coincideVencimiento = !filtroVencimiento || (() => {
      const dias = diasRestantes(c.membresia_actual?.fecha_fin);
      return dias !== null && dias <= 5;
    })();
    return coincideBusqueda && coincideEstado && coincidePlan && coincideVencimiento;
  });

  // Slice del array filtrado para la página actual
  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / PAGINA_SIZE));
  const clientesPagina = clientesFiltrados.slice(
    (pagina - 1) * PAGINA_SIZE,
    pagina * PAGINA_SIZE
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Directorio de Clientes"
        subtitle="Gestiona los perfiles y accesos de los socios."
        actions={
          <>
            <Button
              variant={verEliminados ? "secondary" : "outline"}
              onClick={() => setVerEliminados((v) => !v)}
            >
              <UserX size={18} />
              {verEliminados ? "Ver activos" : "Dados de baja"}
            </Button>
            <Button variant="primary" onClick={() => navigate("/clientes/nuevo")}>
              <Plus size={20} />
              Nuevo Cliente
            </Button>
          </>
        }
      />

      <FilterBar>
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Buscar por nombre, apellido, código o CI..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#39FF14] outline-none bg-white text-gray-700 font-medium"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
          <select
            value={filtroPlan}
            onChange={(e) => { setFiltroPlan(e.target.value); setPagina(1); }}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-[#39FF14] outline-none bg-white text-gray-700 font-medium"
          >
            <option value="">Todos los planes</option>
            {planes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </FilterBar>

      {filtroVencimiento && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 font-medium">
          <span>Mostrando solo clientes con membresía próxima a vencer o vencida (≤ 5 días)</span>
          <button
            onClick={limpiarFiltroVencimiento}
            className="ml-auto flex items-center gap-1 text-amber-600 hover:text-amber-900 transition-colors"
          >
            <X size={15} /> Quitar filtro
          </button>
        </div>
      )}

      {/* ── PANEL DADOS DE BAJA ── */}
      {verEliminados && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
            <UserX size={18} className="text-gray-400" />
            <span className="font-semibold text-gray-700">Clientes dados de baja</span>
            <span className="text-sm text-gray-400">({eliminados.length})</span>
          </div>
          {eliminados.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hay clientes dados de baja.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="px-6 py-3 font-semibold">Código</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Último plan</th>
                  <th className="px-6 py-3 font-semibold">Fecha de baja</th>
                  <th className="px-6 py-3 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {eliminados.map((c) => (
                  <tr key={c.id} className="opacity-60 hover:opacity-100 transition-opacity">
                    <td className="px-6 py-4 font-mono text-gray-500 text-sm">{c.codigo_unico}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-700">{c.nombre} {c.apellidos}</p>
                      {c.dni && <p className="text-xs text-gray-400 mt-0.5">CI: {c.dni}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {c.membresia_actual?.plan?.nombre ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.deleted_at).toLocaleDateString("es-ES", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="outline"
                        className="px-3 py-1.5 text-sm"
                        onClick={() => handleReactivar(c.id)}
                        disabled={reactivando === c.id}
                      >
                        <RotateCcw size={15} />
                        {reactivando === c.id ? "Reactivando..." : "Reactivar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── PANEL CLIENTES ACTIVOS ── */}
      {!verEliminados && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading && <p className="text-center text-gray-500 py-16">Cargando clientes...</p>}
          {error && <p className="text-center text-red-500 py-16">Error: {error}</p>}

          {!loading && !error && (
            <>
              {/* Vista Móvil (Tarjetas independientes, sin scroll horizontal) */}
              <div className="block md:hidden p-4 space-y-3">
                {clientesPagina.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No se encontraron clientes.</p>
                ) : (
                  clientesPagina.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="p-4 bg-gray-50/60 border border-gray-200 rounded-2xl space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-gray-700 font-bold">
                          {cliente.codigo_unico}
                        </span>
                        <Badge variant={cliente.estado_cuenta === "activo" ? "green" : "red"}>
                          {cliente.estado_cuenta.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {cliente.nombre} {cliente.apellidos}
                        </h3>
                        {cliente.dni && (
                          <p className="text-xs text-gray-400">CI: {cliente.dni}</p>
                        )}
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>Plan: <strong className="text-gray-900">{cliente.membresia_actual?.plan?.nombre ?? "Sin plan registrado"}</strong></p>
                          <p>Teléfono: <strong className="text-gray-900">{cliente.telefono}</strong></p>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                        className="w-full justify-center text-sm py-2 mt-1"
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Vista Desktop (Tabla tradicional) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">Código</th>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Contacto</th>
                      <th className="px-6 py-4 font-semibold">Plan Actual</th>
                      <th className="px-6 py-4 font-semibold">Estado</th>
                      <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientesPagina.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-gray-400 py-16">
                          No se encontraron clientes.
                        </td>
                      </tr>
                    ) : (
                      clientesPagina.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-gray-600">
                            {cliente.codigo_unico}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-800">
                              {cliente.nombre} {cliente.apellidos}
                            </p>
                            {cliente.dni && (
                              <p className="text-xs text-gray-400 mt-0.5">CI: {cliente.dni}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <p>{cliente.telefono}</p>
                            <p className="text-gray-400">{cliente.email ?? "—"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-700 font-medium">
                              {cliente.membresia_actual?.plan?.nombre ?? "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={cliente.estado_cuenta === "activo" ? "green" : "red"}>
                              {cliente.estado_cuenta.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="secondary"
                                onClick={() => navigate(`/clientes/${cliente.id}`)}
                                className="px-3 py-1.5 text-sm"
                              >
                                Ver Perfil
                              </Button>
                              <Button variant="ghost" className="px-2 py-2">
                                <MoreVertical size={18} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? "s" : ""}
                  {clientesFiltrados.length !== clientes.length && ` (de ${clientes.length})`}
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
      )}
    </div>
  );
}
