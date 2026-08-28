import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User, Phone, Mail, Hash, Calendar, Clock, CreditCard,
  Edit, Trash2, Save, DollarSign, Dumbbell, Users,
  ShieldOff, ShieldCheck, QrCode,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { ModalConfirmacion } from "../components/ModalConfirmacion";
import { ModalCarnetQR } from "../components/ModalCarnetQR";
import { getClienteById, updateCliente, updateEstadoCuenta, getClienteByDni, deleteCliente } from "../services/clientes";
import {
  sanitizarTexto, sanitizarNumero, sanitizarCi,
  validarNombre, validarTelefono, validarEmail, validarCi,
} from "../lib/validaciones";
import {
  getMembresiaByTitular,
  getBeneficiariosByMembresia,
  renovarMembresia,
  cambiarPlan,
} from "../services/membresias";
import { getAsistenciasByCliente } from "../services/asistencias";
import { getPlanes } from "../services/planes";
import { registrarPago } from "../services/pagos";

// ── Helpers ──

function formatFecha(fecha) {
  if (!fecha) return "—";
  // fecha_alta puede llegar como DATE ("2026-06-22") o TIMESTAMPTZ ("2026-06-22T15:30:00+00:00")
  // En el segundo caso, tomamos solo la parte de la fecha antes de la "T"
  const soloFecha = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [y, m, d] = soloFecha.split("-");
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatTurno(plan) {
  if (!plan) return "—";
  if (plan.turno === "libre") return "Libre";
  if (plan.hora_inicio && plan.hora_fin) {
    return `${plan.hora_inicio.slice(0, 5)} - ${plan.hora_fin.slice(0, 5)}`;
  }
  return plan.turno ?? "—";
}

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Los timestamps de la DB son UTC; new Date(ts) los convierte a hora local automáticamente
function formatFechaHora(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── MODAL: RENOVAR MEMBRESÍA ──
// Extiende la fecha_fin desde la vigencia actual.
// Permite cambiar de plan en el mismo paso (útil en renovaciones con upgrade).

const ModalRenovar = ({ membresia, onClose, onSuccess }) => {
  const [planes, setPlanes] = useState([]);
  const [planId, setPlanId] = useState(membresia.plan_id);
  const [pagoAlDia, setPagoAlDia] = useState(true);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlanes().then(setPlanes).catch((e) => setError(e.message));
  }, []);

  const planSeleccionado = planes.find((p) => p.id === planId);

  // Calcula la nueva fecha_fin sumando duracion_dias desde el vencimiento actual
  const nuevaFechaFin = planSeleccionado
    ? (() => {
        const [y, m, d] = membresia.fecha_fin.split("-").map(Number);
        return toISODate(new Date(y, m - 1, d + planSeleccionado.duracion_dias));
      })()
    : null;

  const handleConfirmar = async () => {
    if (!planSeleccionado) return;
    setGuardando(true);
    setError(null);
    let success = false;
    try {
      // Si el usuario cambió el plan al renovar, actualizar plan_id primero
      if (planId !== membresia.plan_id) {
        await cambiarPlan(membresia.id, planId);
      }
      await renovarMembresia(membresia.id, {
        fecha_fin: nuevaFechaFin,
        estado_financiero: pagoAlDia ? "pagado" : "pendiente",
      });
      if (pagoAlDia) {
        await registrarPago({
          membresia_id: membresia.id,
          monto: planSeleccionado.precio,
          metodo_pago: metodoPago,
        });
      }
      success = true;
    } catch (err) {
      setError(err.message ?? "Error al renovar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
    if (success) onSuccess();
  };

  return (
    <Modal title="Renovar Membresía" onClose={onClose}>
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">
          ❌ {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Plan</label>
        <Select icon={Dumbbell} value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {planes.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} — {p.precio} Bs</option>
          ))}
        </Select>
      </div>

      {planSeleccionado && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 space-y-1.5">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-[#2ea84a]" />
            <span>Monto: <strong className="text-[#1a6b32]">{planSeleccionado.precio} Bs</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span>
              Nueva vigencia: <strong>{formatFecha(membresia.fecha_fin)}</strong>
              {" → "}
              <strong>{formatFecha(nuevaFechaFin)}</strong>
            </span>
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={pagoAlDia}
          onChange={(e) => setPagoAlDia(e.target.checked)}
          className="w-4 h-4 accent-[#1a6b32] cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-800">El cliente pagó en este momento</span>
      </label>

      {pagoAlDia && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Método de pago</label>
          <Select icon={CreditCard} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="qr">QR</option>
            <option value="transferencia">Transferencia</option>
          </Select>
        </div>
      )}

      {!pagoAlDia && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Quedará registrado como <strong>pendiente de pago</strong>.
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
        <Button
          variant="primary"
          onClick={handleConfirmar}
          disabled={guardando || !planSeleccionado}
        >
          {guardando ? "Guardando..." : <><Save size={16} /> Confirmar Renovación</>}
        </Button>
      </div>
    </Modal>
  );
};

// ── MODAL: CAMBIAR PLAN ──
// Actualiza únicamente el plan_id de la membresía vigente.
// Para plans familiares, los beneficiarios se gestionan desde NuevoCliente (Fase 5: flujo dedicado).

const ModalCambiarPlan = ({ membresia, onClose, onSuccess }) => {
  const [planes, setPlanes] = useState([]);
  const [planId, setPlanId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlanes().then(setPlanes).catch((e) => setError(e.message));
  }, []);

  const planesDisponibles = planes.filter((p) => p.id !== membresia.plan_id);
  const planSeleccionado = planes.find((p) => p.id === planId);

  const handleConfirmar = async () => {
    if (!planId) return;
    setGuardando(true);
    setError(null);
    let success = false;
    try {
      await cambiarPlan(membresia.id, planId);
      success = true;
    } catch (err) {
      setError(err.message ?? "Error al cambiar el plan.");
    } finally {
      setGuardando(false);
    }
    if (success) onSuccess();
  };

  return (
    <Modal title="Cambiar Plan" onClose={onClose}>
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">
          ❌ {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        ⚠️ El nuevo plan se asignará a la membresía actual. El cambio de precio y turno aplica en la próxima renovación.
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Nuevo plan</label>
        <Select icon={Dumbbell} value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="" disabled>Selecciona un plan...</option>
          {planesDisponibles.map((p) => (
            <option key={p.id} value={p.id}>{p.nombre} — {p.precio} Bs</option>
          ))}
        </Select>
      </div>

      {planSeleccionado && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm">
          <DollarSign size={14} className="text-[#2ea84a]" />
          <span className="text-gray-600">
            Precio: <strong className="text-[#1a6b32]">{planSeleccionado.precio} Bs</strong>
            {" · "}
            Turno: <strong>{formatTurno(planSeleccionado)}</strong>
          </span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
        <Button
          variant="primary"
          onClick={handleConfirmar}
          disabled={guardando || !planId}
        >
          {guardando ? "Guardando..." : <><Save size={16} /> Confirmar Cambio</>}
        </Button>
      </div>
    </Modal>
  );
};

// ── MODAL: EDITAR PERFIL ──

const ModalEditarPerfil = ({ cliente, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    nombre: cliente.nombre,
    apellidos: cliente.apellidos,
    telefono: cliente.telefono,
    email: cliente.email || "",
    codigo_unico: cliente.codigo_unico,
    dni: cliente.dni || "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [dniDuplicado, setDniDuplicado] = useState(null);
  // Cuando es true se reemplaza el formulario por la pantalla de confirmación
  const [confirmando, setConfirmando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "nombre" || name === "apellidos") v = sanitizarTexto(value);
    else if (name === "telefono") v = sanitizarNumero(value);
    else if (name === "dni") { v = sanitizarCi(value); setDniDuplicado(null); }
    setForm({ ...form, [name]: v });
  };

  const handleDniBlur = async () => {
    if (!form.dni || form.dni === cliente.dni) { setDniDuplicado(null); return; }
    const existente = await getClienteByDni(form.dni).catch(() => null);
    setDniDuplicado(existente && existente.id !== cliente.id ? existente : null);
  };

  // Paso 1: valida campos y DNI duplicado, luego muestra la confirmación.
  const handlePedirConfirmacion = async () => {
    setError(null);
    const errCampos =
      validarNombre(form.nombre, "El nombre") ||
      validarNombre(form.apellidos, "Los apellidos") ||
      validarTelefono(form.telefono) ||
      validarEmail(form.email) ||
      validarCi(form.dni, false);
    if (errCampos) { setError(errCampos); return; }

    if (form.dni && form.dni !== cliente.dni) {
      const existente = await getClienteByDni(form.dni).catch(() => null);
      if (existente && existente.id !== cliente.id) {
        setError(`Este CI ya pertenece a ${existente.nombre} ${existente.apellidos} (${existente.codigo_unico}).`);
        return;
      }
    }
    setConfirmando(true);
  };

  // Paso 2: llamado por ModalConfirmacion cuando el usuario confirma tras el countdown.
  const ejecutarGuardado = async () => {
    setGuardando(true);
    try {
      const actualizado = await updateCliente(cliente.id, {
        ...form,
        email: form.email || null,
        dni: form.dni || null,
      });
      onSuccess(actualizado);
    } catch (err) {
      setError(err.message ?? "Error al guardar. Intenta de nuevo.");
      setConfirmando(false);
      setGuardando(false);
    }
  };

  return (
    <Modal title="Editar Perfil" onClose={onClose}>
      {/* Pantalla de confirmación: reemplaza el formulario para no anidar dos modales */}
      {confirmando ? (
        <ModalConfirmacion
          sinEnvoltorio
          mensaje="¿Confirmas los cambios en el perfil de este cliente? Revisa los datos antes de guardar."
          textoConfirmar="Guardar Cambios"
          variante="primary"
          onConfirmar={ejecutarGuardado}
          onCancelar={() => setConfirmando(false)}
        />
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-3 rounded-xl">
              ❌ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Nombre(s) *</label>
              <Input icon={User} name="nombre" required maxLength={60} value={form.nombre} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Apellidos *</label>
              <Input icon={User} name="apellidos" required maxLength={60} value={form.apellidos} onChange={handleChange} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Teléfono *</label>
            <Input icon={Phone} name="telefono" required maxLength={8} value={form.telefono} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Correo electrónico</label>
            <Input icon={Mail} name="email" type="email" value={form.email} onChange={handleChange} placeholder="Opcional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Carnet de Identidad (CI)</label>
            <Input
              icon={Hash}
              name="dni"
              value={form.dni}
              onChange={handleChange}
              onBlur={handleDniBlur}
              placeholder="Ej. 12345678"
            />
            {dniDuplicado && (
              <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                ⚠️ Este CI ya pertenece a <strong>{dniDuplicado.nombre} {dniDuplicado.apellidos}</strong> ({dniDuplicado.codigo_unico}).
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Código de acceso único *</label>
            <Input icon={Hash} name="codigo_unico" required value={form.codigo_unico} onChange={handleChange} />
            <p className="text-xs text-gray-400">Cambiar el código afectará el acceso en recepción.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button variant="ghost" onClick={onClose} disabled={guardando}>Cancelar</Button>
            <Button variant="primary" onClick={handlePedirConfirmacion} disabled={guardando || !!dniDuplicado}>
              <Save size={16} /> Guardar Cambios
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

// ── SUB-COMPONENTES ──

const DatosPersonales = ({ cliente }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
    <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Datos Personales</h2>
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-gray-600">
        <Hash size={18} className="text-gray-400" />
        <span>Código: <strong className="text-gray-900">{cliente.codigo_unico}</strong></span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <CreditCard size={18} className="text-gray-400" />
        <span>
          CI:{" "}
          <strong className={cliente.dni ? "text-gray-900" : "text-gray-400"}>
            {cliente.dni ?? "No registrado"}
          </strong>
        </span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Phone size={18} className="text-gray-400" />
        <span>Tel: <strong className="text-gray-900">{cliente.telefono}</strong></span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Mail size={18} className="text-gray-400" />
        <span>Email: <strong className="text-gray-900">{cliente.email || "No registrado"}</strong></span>
      </div>
      <div className="flex items-center gap-3 text-gray-600">
        <Calendar size={18} className="text-gray-400" />
        <span>Registrado: <strong className="text-gray-900">{formatFecha(cliente.fecha_alta)}</strong></span>
      </div>
    </div>
  </div>
);

// "Cambiar Plan" solo se habilita cuando la membresía ya venció (fecha_fin < hoy).
// Cambiar de plan a mitad de mensualidad implicaría gestionar devoluciones parciales,
// lo que no está soportado. El flujo correcto es esperar a "Renovar" al vencimiento
// y seleccionar el nuevo plan en ese mismo modal.
// Cuando es plan familiar se bloquea por la misma razón y además porque el plan_id
// es compartido por todos los miembros de la fila de membresias.
const MembresiaActual = ({ membresia, onRenovar, onCambiarPlan, esFamiliar }) => {
  if (!membresia) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2">Membresía Actual</h2>
        <p className="text-gray-400 text-sm">Este cliente no tiene una membresía registrada como titular.</p>
      </div>
    );
  }

  // Membresía vigente = fecha_fin >= hoy. Mientras esté vigente no se permite
  // cambiar de plan para evitar gestionar devoluciones parciales.
  const membresiaVigente = membresia.fecha_fin >= new Date().toISOString().slice(0, 10);
  const cambiarPlanBloqueado = membresiaVigente || esFamiliar;
  const motivoBloqueo = esFamiliar
    ? "Plan familiar — usa Renovar al vencimiento para cambiar de plan."
    : "La membresía aún está vigente. Usa Renovar al vencimiento para cambiar de plan.";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h2 className="text-lg font-bold text-gray-800">Membresía Actual</h2>
        <Badge variant={membresia.estado_acceso ? "green" : "red"}>
          {membresia.estado_acceso ? "ACCESO ACTIVO" : "ACCESO SUSPENDIDO"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 text-gray-600">
          <Dumbbell size={18} className="text-gray-400" />
          <span>Plan: <strong className="text-gray-900">{membresia.plan?.nombre ?? "—"}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Clock size={18} className="text-gray-400" />
          <span>Turno: <strong className="text-gray-900">{formatTurno(membresia.plan)}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar size={18} className="text-gray-400" />
          <span>Inicio: <strong className="text-gray-900">{formatFecha(membresia.fecha_inicio)}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <Calendar size={18} className="text-gray-400" />
          <span>Vence: <strong className="text-gray-900">{formatFecha(membresia.fecha_fin)}</strong></span>
        </div>
        <div className="flex items-center gap-3 text-gray-600">
          <CreditCard size={18} className="text-gray-400" />
          <span>
            Pago:{" "}
            <strong className={membresia.estado_financiero === "pagado" ? "text-green-600" : "text-amber-600"}>
              {membresia.estado_financiero?.toUpperCase() ?? "—"}
            </strong>
          </span>
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button variant="primary" className="w-full text-sm" onClick={onRenovar}>Renovar</Button>
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={onCambiarPlan}
          disabled={cambiarPlanBloqueado}
        >
          Cambiar Plan
        </Button>
      </div>
      {cambiarPlanBloqueado && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ {motivoBloqueo}
        </p>
      )}
    </div>
  );
};

// Solo se muestra cuando hay más de 1 beneficiario (plan familiar)
const MiembrosDelPlan = ({ beneficiarios, titularId }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
      <Users size={20} className="text-[#2ea84a]" />
      <h2 className="text-lg font-bold text-gray-800">Miembros del Plan Familiar</h2>
      <span className="text-sm text-gray-400 font-normal">({beneficiarios.length} personas)</span>
    </div>
    <div className="space-y-2">
      {beneficiarios.map((b) => (
        <div key={b.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-3">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {b.cliente.nombre} {b.cliente.apellidos}
              </p>
              <p className="text-xs text-gray-400">Código: {b.cliente.codigo_unico}</p>
            </div>
          </div>
          {b.cliente_id === titularId && (
            <Badge variant="green">TITULAR</Badge>
          )}
        </div>
      ))}
    </div>
  </div>
);

const HistorialAsistencias = ({ asistencias }) => (
  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
      <h2 className="text-lg font-bold text-gray-800">Historial de Asistencias</h2>
      <p className="text-xs text-gray-400 mt-0.5">
        {asistencias.length > 0 ? `Últimas ${asistencias.length} entradas registradas` : "Sin asistencias"}
      </p>
    </div>
    {asistencias.length === 0 ? (
      <p className="text-center text-gray-400 py-10 text-sm">Sin asistencias registradas aún.</p>
    ) : (
      <table className="w-full text-left">
        <tbody className="divide-y divide-gray-100">
          {asistencias.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-gray-600 text-sm">{formatFechaHora(a.fecha_hora)}</td>
              <td className="px-6 py-4 text-right">
                <Badge variant={a.estado_acceso === "permitido" ? "green" : "red"}>
                  {a.estado_acceso.replace(/_/g, " ").toUpperCase()}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

// ── COMPONENTE PRINCIPAL ──

export default function ClientePerfil() {
  const { id } = useParams();

  const [cliente, setCliente] = useState(null);
  const [membresia, setMembresia] = useState(null);
  const [beneficiarios, setBeneficiarios] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(null);
  const [toggleError, setToggleError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      setLoading(true);
      setError(null);
      try {
        const [c, m] = await Promise.all([
          getClienteById(id),
          getMembresiaByTitular(id),
        ]);
        const secundarios = await Promise.all([
          getAsistenciasByCliente(id),
          m ? getBeneficiariosByMembresia(m.id) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setCliente(c);
        setMembresia(m);
        setAsistencias(secundarios[0]);
        setBeneficiarios(secundarios[1]);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargar();
    return () => { cancelled = true; };
  }, [id, refreshKey]);

  // Cierra el modal y recarga todos los datos desde Supabase.
  // Usado por los modales de Renovar y Cambiar Plan.
  const cerrarYRecargar = () => {
    setModalAbierto(null);
    setRefreshKey((k) => k + 1);
  };

  const handleToggleEstado = async () => {
    setToggleError(null);
    const nuevo = cliente.estado_cuenta === "activo" ? "suspendido" : "activo";
    try {
      await updateEstadoCuenta(id, nuevo);
      setCliente((prev) => ({ ...prev, estado_cuenta: nuevo }));
    } catch (err) {
      setToggleError(err.message);
    }
  };

  const handleDarDeBaja = async () => {
    try {
      await deleteCliente(id);
      navigate("/clientes");
    } catch (err) {
      setToggleError(err.message);
      setModalAbierto(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
  }

  if (error || !cliente) {
    return (
      <div className="p-8 text-center text-red-500">
        {error ?? "No se encontró el cliente."}
      </div>
    );
  }

  const esFamiliar = beneficiarios.length > 1;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Modales */}
      {modalAbierto === "renovar" && membresia && (
        <ModalRenovar
          membresia={membresia}
          onClose={() => setModalAbierto(null)}
          onSuccess={cerrarYRecargar}
        />
      )}
      {modalAbierto === "cambiarPlan" && membresia && (
        <ModalCambiarPlan
          membresia={membresia}
          onClose={() => setModalAbierto(null)}
          onSuccess={cerrarYRecargar}
        />
      )}
      {modalAbierto === "editarPerfil" && (
        <ModalEditarPerfil
          cliente={cliente}
          onClose={() => setModalAbierto(null)}
          onSuccess={(actualizado) => {
            setCliente(actualizado);
            setModalAbierto(null);
          }}
        />
      )}
      {modalAbierto === "carnetQR" && (
        <ModalCarnetQR
          cliente={cliente}
          membresia={membresia}
          onClose={() => setModalAbierto(null)}
        />
      )}
      {modalAbierto === "confirmarBaja" && (
        <ModalConfirmacion
          titulo="Dar de baja al cliente"
          mensaje={`¿Dar de baja a ${cliente.nombre} ${cliente.apellidos}? El cliente desaparecerá del listado activo pero podrás reactivarlo desde "Dados de baja" en cualquier momento.`}
          textoConfirmar="Dar de baja"
          onConfirmar={handleDarDeBaja}
          onCancelar={() => setModalAbierto(null)}
        />
      )}
      {modalAbierto === "confirmarToggle" && (
        <ModalConfirmacion
          titulo={cliente.estado_cuenta === "activo" ? "Suspender cliente" : "Reactivar cliente"}
          mensaje={
            cliente.estado_cuenta === "activo"
              ? `¿Suspender a ${cliente.nombre} ${cliente.apellidos}? No podrá entrar al gimnasio hasta que se reactive su cuenta.`
              : `¿Reactivar a ${cliente.nombre} ${cliente.apellidos}? Recuperará acceso al gimnasio inmediatamente.`
          }
          textoConfirmar={cliente.estado_cuenta === "activo" ? "Suspender" : "Reactivar"}
          variante={cliente.estado_cuenta === "activo" ? "danger" : "primary"}
          onConfirmar={async () => { await handleToggleEstado(); setModalAbierto(null); }}
          onCancelar={() => setModalAbierto(null)}
        />
      )}

      <PageHeader
        backTo="/clientes"
        title={`${cliente.nombre} ${cliente.apellidos}`}
        subtitle="Expediente del cliente"
        badge={
          <Badge variant={cliente.estado_cuenta === "activo" ? "green" : "red"}>
            {cliente.estado_cuenta.toUpperCase()}
          </Badge>
        }
        actions={
          <>
            {toggleError && (
              <span className="text-xs text-red-500 font-medium mr-2">{toggleError}</span>
            )}
            <Button variant="primary" className="bg-[#1a6b32] hover:bg-[#145327]" onClick={() => setModalAbierto("carnetQR")}>
              <QrCode size={18} /> Ver Carnet QR
            </Button>
            <Button variant="outline" onClick={() => setModalAbierto("editarPerfil")}>
              <Edit size={18} /> Editar Perfil
            </Button>
            <Button
              variant={cliente.estado_cuenta === "activo" ? "outline" : "primary"}
              onClick={() => setModalAbierto("confirmarToggle")}
            >
              {cliente.estado_cuenta === "activo" ? (
                <><ShieldOff size={18} /> Suspender</>
              ) : (
                <><ShieldCheck size={18} /> Reactivar</>
              )}
            </Button>
            <Button
              variant="danger"
              onClick={() => setModalAbierto("confirmarBaja")}
            >
              <Trash2 size={18} />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DatosPersonales cliente={cliente} />
        </div>
        <div className="lg:col-span-2">
          <MembresiaActual
            membresia={membresia}
            onRenovar={() => setModalAbierto("renovar")}
            onCambiarPlan={() => setModalAbierto("cambiarPlan")}
            esFamiliar={esFamiliar}
          />
        </div>
      </div>

      {esFamiliar && (
        <MiembrosDelPlan beneficiarios={beneficiarios} titularId={membresia.titular_id} />
      )}

      <HistorialAsistencias asistencias={asistencias} />
    </div>
  );
}
