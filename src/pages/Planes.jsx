import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Clock, Users, Calendar, DollarSign, Save } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { ModalConfirmacion } from "../components/ModalConfirmacion";
import { getPlanes, deletePlan, updatePlan } from "../services/planes";
import {
  sanitizarNombrePlan, sanitizarNumero, sanitizarDecimal,
  validarNombrePlan, validarDuracion, validarCapacidad, validarPrecio,
} from "../lib/validaciones";

function formatTurno(plan) {
  if (plan.turno === "libre") return "Libre";
  if (plan.hora_inicio && plan.hora_fin) {
    return `${plan.hora_inicio.slice(0, 5)} - ${plan.hora_fin.slice(0, 5)}`;
  }
  return plan.turno;
}

// ── Modal editar plan ────────────────────────────────────────────────────────

function ModalEditarPlan({ plan, onClose, onGuardado }) {
  const [form, setForm] = useState({
    nombre:           plan.nombre,
    duracion_dias:    String(plan.duracion_dias),
    turno:            plan.turno,
    hora_inicio:      plan.hora_inicio ?? "06:00",
    hora_fin:         plan.hora_fin    ?? "23:59",
    capacidad_minima: String(plan.capacidad_minima),
    capacidad_maxima: String(plan.capacidad_maxima),
    precio:           String(plan.precio),
  });
  const [confirmando, setConfirmando] = useState(false);
  const [guardando,   setGuardando]   = useState(false);
  const [error,       setError]       = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "nombre") v = sanitizarNombrePlan(value);
    else if (["duracion_dias", "capacidad_minima", "capacidad_maxima"].includes(name)) v = sanitizarNumero(value);
    else if (name === "precio") v = sanitizarDecimal(value);
    setForm((f) => ({ ...f, [name]: v }));
  };

  const handlePedirConfirmacion = () => {
    setError(null);
    const err =
      validarNombrePlan(form.nombre) ||
      validarDuracion(form.duracion_dias) ||
      validarCapacidad(form.capacidad_minima, form.capacidad_maxima) ||
      validarPrecio(form.precio);
    if (err) { setError(err); return; }
    setConfirmando(true);
  };

  const ejecutarGuardado = async () => {
    setGuardando(true);
    const esLibre = form.turno === "libre";
    try {
      const updated = await updatePlan(plan.id, {
        nombre:           form.nombre,
        duracion_dias:    parseInt(form.duracion_dias, 10),
        turno:            form.turno,
        hora_inicio:      esLibre ? null : form.hora_inicio,
        hora_fin:         esLibre ? null : form.hora_fin,
        capacidad_minima: parseInt(form.capacidad_minima, 10),
        capacidad_maxima: parseInt(form.capacidad_maxima, 10),
        precio:           parseFloat(form.precio),
      });
      onGuardado(updated);
    } catch (err) {
      setError(err.message ?? "Error al guardar. Intenta de nuevo.");
      setConfirmando(false);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal title={`Editar plan: ${plan.nombre}`} onClose={onClose} maxWidth="max-w-lg">
      {confirmando ? (
        <ModalConfirmacion
          sinEnvoltorio
          mensaje="¿Confirmas los cambios en este plan? Las membresías activas que usen este plan verán los nuevos valores inmediatamente."
          textoConfirmar="Guardar cambios"
          variante="primary"
          onConfirmar={ejecutarGuardado}
          onCancelar={() => setConfirmando(false)}
        />
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Nombre del Plan *</label>
            <Input
              name="nombre"
              required
              maxLength={60}
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. General Mañana"
            />
          </div>

          {/* Duración y precio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Duración (días) *</label>
              <Input
                icon={Calendar}
                name="duracion_dias"
                inputMode="numeric"
                maxLength={3}
                required
                value={form.duracion_dias}
                onChange={handleChange}
                placeholder="30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Precio (Bs) *</label>
              <Input
                icon={DollarSign}
                name="precio"
                inputMode="decimal"
                maxLength={8}
                required
                value={form.precio}
                onChange={handleChange}
                placeholder="100.00"
              />
            </div>
          </div>

          {/* Capacidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Mín. personas *</label>
              <Input
                icon={Users}
                name="capacidad_minima"
                inputMode="numeric"
                maxLength={2}
                required
                value={form.capacidad_minima}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Máx. personas *</label>
              <Input
                icon={Users}
                name="capacidad_maxima"
                inputMode="numeric"
                maxLength={2}
                required
                value={form.capacidad_maxima}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Turno */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Tipo de Turno *</label>
            <Select icon={Clock} name="turno" value={form.turno} onChange={handleChange}>
              <option value="libre">Turno Libre (Todo el día)</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </Select>
          </div>

          {form.turno !== "libre" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Hora inicio *</label>
                <Input icon={Clock} name="hora_inicio" type="time" required value={form.hora_inicio} onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Hora límite *</label>
                <Input icon={Clock} name="hora_fin" type="time" required value={form.hora_fin} onChange={handleChange} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button variant="primary" onClick={handlePedirConfirmacion} disabled={guardando}>
              <Save size={16} />
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export default function Planes() {
  const navigate = useNavigate();
  const [planes,       setPlanes]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [planEditando, setPlanEditando] = useState(null);
  const [planAEliminar, setPlanAEliminar] = useState(null);
  const [eliminando,   setEliminando]   = useState(false);

  useEffect(() => {
    getPlanes()
      .then(setPlanes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleEliminar = async () => {
    if (!planAEliminar) return;
    setEliminando(true);
    try {
      await deletePlan(planAEliminar.id);
      setPlanes((prev) => prev.filter((p) => p.id !== planAEliminar.id));
      setPlanAEliminar(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  };

  const handleGuardado = (updated) => {
    setPlanes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setPlanEditando(null);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Planes de Membresía"
        subtitle="Configura los paquetes, horarios y precios del gimnasio."
        actions={
          <Button variant="primary" onClick={() => navigate("/planes/nuevo")}>
            <Plus size={20} />
            Nuevo Plan
          </Button>
        }
      />

      {loading && <p className="text-center text-gray-500 py-16">Cargando planes...</p>}
      {error   && <p className="text-center text-red-500 py-16">Error: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.length === 0 && (
            <p className="col-span-3 text-center text-gray-400 py-16">No hay planes registrados.</p>
          )}

          {planes.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800">{plan.nombre}</h2>
                <Badge variant={plan.turno === "libre" ? "green" : "gray"}>
                  {plan.turno.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3 flex-1 mt-2">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Calendar size={18} className="text-gray-400" />
                  <span>Duración: <strong className="text-gray-800">{plan.duracion_dias} días</strong></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Clock size={18} className="text-gray-400" />
                  <span>Horario: <strong className="text-gray-800">{formatTurno(plan)}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Users size={18} className="text-gray-400" />
                  <span>
                    Capacidad:{" "}
                    <strong className="text-gray-800">
                      {plan.capacidad_minima === plan.capacidad_maxima
                        ? `${plan.capacidad_minima} persona(s)`
                        : `${plan.capacidad_minima}–${plan.capacidad_maxima} personas`}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <DollarSign size={18} className="text-gray-400" />
                  <span>Precio: <strong className="text-[#1a6b32] text-lg">{plan.precio} Bs</strong></span>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="flex-1 text-sm py-1.5"
                  onClick={() => setPlanEditando(plan)}
                >
                  <Edit size={16} /> Editar
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5"
                  onClick={() => setPlanAEliminar(plan)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar */}
      {planEditando && (
        <ModalEditarPlan
          plan={planEditando}
          onClose={() => setPlanEditando(null)}
          onGuardado={handleGuardado}
        />
      )}

      {/* Modal confirmar eliminación */}
      {planAEliminar && (
        <ModalConfirmacion
          titulo={`Eliminar plan: ${planAEliminar.nombre}`}
          mensaje={`El plan "${planAEliminar.nombre}" dejará de estar disponible para nuevas membresías. Las membresías existentes no se verán afectadas.`}
          textoConfirmar={eliminando ? "Eliminando..." : "Sí, eliminar"}
          variante="danger"
          onConfirmar={handleEliminar}
          onCancelar={() => setPlanAEliminar(null)}
        />
      )}
    </div>
  );
}
