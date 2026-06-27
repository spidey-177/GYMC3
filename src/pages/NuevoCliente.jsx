import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, Hash, Save, Dumbbell, Plus, Trash2, ChevronRight, CreditCard } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PageHeader } from "../components/PageHeader";
import { FormSection } from "../components/FormSection";
import { getPlanes } from "../services/planes";
import { createCliente, getClienteByDni } from "../services/clientes";
import { createMembresia } from "../services/membresias";
import { registrarPago } from "../services/pagos";
import {
  sanitizarTexto, sanitizarNumero, sanitizarCi,
  validarNombre, validarTelefono, validarEmail, validarCi,
} from "../lib/validaciones";

// El trigger fn_set_codigo_unico() genera GYM-XXXXXX automáticamente; no se envía desde el frontend.
const MIEMBRO_VACIO = () => ({ nombre: "", apellidos: "", telefono: "", dni: "" });

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Aviso reutilizable que muestra cuando un DNI ya pertenece a otro cliente
function DniDuplicadoAviso({ cliente }) {
  if (!cliente) return null;
  return (
    <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 mt-1">
      ⚠️ Este DNI ya pertenece a{" "}
      <strong>{cliente.nombre} {cliente.apellidos}</strong>{" "}
      ({cliente.codigo_unico}). Verifica antes de continuar.
    </p>
  );
}

export default function NuevoCliente() {
  const navigate = useNavigate();

  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);

  useEffect(() => {
    getPlanes()
      .then(setPlanes)
      .finally(() => setCargandoPlanes(false));
  }, []);

  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [planIdRaw, setPlanIdRaw] = useState("");
  const [titular, setTitular] = useState({ nombre: "", apellidos: "", telefono: "", email: "", dni: "" });
  const [miembrosAdicionales, setMiembrosAdicionales] = useState([MIEMBRO_VACIO(), MIEMBRO_VACIO()]);
  const [pagoAlDia, setPagoAlDia] = useState(true);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Resultados de la verificación de DNI duplicado (se llenan en onBlur, no en submit)
  const [dniDupTitular, setDniDupTitular] = useState(null);
  // Mapa de index → cliente duplicado para miembros adicionales
  const [dniDupMiembros, setDniDupMiembros] = useState({});

  const esFamiliar = (planSeleccionado?.capacidad_maxima ?? 1) > 1;

  const handlePlanChange = (e) => {
    const id = e.target.value;
    setPlanIdRaw(id);
    const plan = planes.find((p) => p.id === id) ?? null;
    setPlanSeleccionado(plan);
    const minAdicionales = Math.max(1, (plan?.capacidad_minima ?? 1) - 1);
    setMiembrosAdicionales(Array.from({ length: minAdicionales }, MIEMBRO_VACIO));
    // Resetear advertencias de DNI al cambiar de plan (los miembros cambian)
    setDniDupMiembros({});
  };

  const handleTitularChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "nombre" || name === "apellidos") v = sanitizarTexto(value);
    else if (name === "telefono") v = sanitizarNumero(value);
    else if (name === "dni") { v = sanitizarCi(value); setDniDupTitular(null); }
    setTitular({ ...titular, [name]: v });
  };

  const handleMiembroChange = (index, e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "nombre" || name === "apellidos") v = sanitizarTexto(value);
    else if (name === "telefono") v = sanitizarNumero(value);
    else if (name === "dni") { v = sanitizarCi(value); setDniDupMiembros((prev) => ({ ...prev, [index]: null })); }
    const nuevos = [...miembrosAdicionales];
    nuevos[index] = { ...nuevos[index], [name]: v };
    setMiembrosAdicionales(nuevos);
  };

  // Verifica si el DNI del titular ya existe en BD al salir del campo
  const handleTitularDniBlur = async () => {
    if (!titular.dni) return;
    const existente = await getClienteByDni(titular.dni).catch(() => null);
    setDniDupTitular(existente ?? null);
  };

  // Verifica si el DNI de un miembro adicional ya existe en BD al salir del campo
  const handleMiembroDniBlur = async (index) => {
    const dni = miembrosAdicionales[index].dni;
    if (!dni) return;
    const existente = await getClienteByDni(dni).catch(() => null);
    setDniDupMiembros((prev) => ({ ...prev, [index]: existente ?? null }));
  };

  const agregarMiembro = () => {
    const total = 1 + miembrosAdicionales.length;
    if (total >= (planSeleccionado?.capacidad_maxima ?? 1)) return;
    setMiembrosAdicionales([...miembrosAdicionales, MIEMBRO_VACIO()]);
  };

  const eliminarMiembro = (index) => {
    const minAdicionales = (planSeleccionado?.capacidad_minima ?? 1) - 1;
    if (miembrosAdicionales.length <= minAdicionales) return;
    setMiembrosAdicionales(miembrosAdicionales.filter((_, i) => i !== index));
    setDniDupMiembros((prev) => {
      const nuevo = { ...prev };
      delete nuevo[index];
      return nuevo;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    // ── Validar campos del titular ──
    const errTitular =
      validarNombre(titular.nombre, "El nombre") ||
      validarNombre(titular.apellidos, "Los apellidos") ||
      validarTelefono(titular.telefono) ||
      validarEmail(titular.email) ||
      validarCi(titular.dni, true);
    if (errTitular) { setError(errTitular); setGuardando(false); return; }

    // ── Validar campos de miembros adicionales ──
    if (esFamiliar) {
      for (let i = 0; i < miembrosAdicionales.length; i++) {
        const m = miembrosAdicionales[i];
        const label = `Miembro ${i + 2}`;
        const errM =
          validarNombre(m.nombre, `${label}: nombre`) ||
          validarNombre(m.apellidos, `${label}: apellidos`) ||
          validarTelefono(m.telefono) ||
          validarCi(m.dni, true);
        if (errM) { setError(errM); setGuardando(false); return; }
      }
    }

    // ── Validar capacidad del plan ──
    if (esFamiliar) {
      const total = 1 + miembrosAdicionales.length;
      const { capacidad_minima, capacidad_maxima } = planSeleccionado;
      if (total < capacidad_minima) {
        setError(`Este plan requiere mínimo ${capacidad_minima} personas. Actualmente hay ${total}.`);
        setGuardando(false);
        return;
      }
      if (total > capacidad_maxima) {
        setError(`Este plan permite máximo ${capacidad_maxima} personas. Actualmente hay ${total}.`);
        setGuardando(false);
        return;
      }
    }

    // ── Validar DNI duplicados en el momento del submit ──
    // Se vuelve a consultar la BD (no solo el estado de onBlur) para cubrir el caso
    // en que el usuario pegó el DNI sin disparar el evento blur.
    try {
      if (titular.dni) {
        const dup = await getClienteByDni(titular.dni);
        if (dup) {
          setError(`El DNI del titular ya pertenece a ${dup.nombre} ${dup.apellidos} (${dup.codigo_unico}).`);
          setGuardando(false);
          return;
        }
      }
      if (esFamiliar) {
        for (let i = 0; i < miembrosAdicionales.length; i++) {
          const { dni } = miembrosAdicionales[i];
          if (!dni) continue;
          const dup = await getClienteByDni(dni);
          if (dup) {
            setError(`El DNI del miembro ${i + 2} ya pertenece a ${dup.nombre} ${dup.apellidos} (${dup.codigo_unico}).`);
            setGuardando(false);
            return;
          }
        }
      }
    } catch {
      // Si la consulta de duplicados falla por red, dejamos pasar:
      // el índice único de la BD bloqueará el INSERT si hay duplicado real.
    }

    try {
      // ① Crear cliente titular (codigo_unico lo genera el trigger; dni puede ser null si no se ingresó)
      const titularCreado = await createCliente({
        nombre: titular.nombre,
        apellidos: titular.apellidos,
        telefono: titular.telefono,
        email: titular.email || null,
        dni: titular.dni || null,
      });

      // ② Crear clientes adicionales para plan familiar
      let beneficiariosIds = [];
      if (esFamiliar) {
        const miembrosCreados = await Promise.all(
          miembrosAdicionales.map((m) =>
            createCliente({
              nombre: m.nombre,
              apellidos: m.apellidos,
              telefono: m.telefono,
              dni: m.dni || null,
            })
          )
        );
        beneficiariosIds = miembrosCreados.map((m) => m.id);
      }

      // ③ Crear membresía
      const hoy = new Date();
      const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + planSeleccionado.duracion_dias);

      const membresia = await createMembresia({
        plan_id: planSeleccionado.id,
        titular_id: titularCreado.id,
        fecha_inicio: toISODate(hoy),
        fecha_fin: toISODate(fechaFin),
        estado_financiero: pagoAlDia ? "pagado" : "pendiente",
        beneficiariosIds,
      });

      // ④ Registrar pago si se hizo en el momento
      if (pagoAlDia) {
        await registrarPago({
          membresia_id: membresia.id,
          monto: planSeleccionado.precio,
          metodo_pago: metodoPago,
        });
      }

      navigate("/clientes");
    } catch (err) {
      setError(err.message ?? "Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const totalPersonas = 1 + miembrosAdicionales.length;
  const puedeAgregarMas = esFamiliar && totalPersonas < (planSeleccionado?.capacidad_maxima ?? 1);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader
        backTo="/clientes"
        title="Nuevo Cliente"
        subtitle="Registra un nuevo socio en el sistema."
      />

      {error && (
        <div className="bg-red-50 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl font-medium text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── PASO 1: Selección de plan ── */}
        <FormSection step={1} title="Plan de Membresía">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Selecciona el paquete *</label>
            <Select icon={Dumbbell} name="plan_id" required value={planIdRaw} onChange={handlePlanChange} disabled={cargandoPlanes}>
              <option value="" disabled>
                {cargandoPlanes ? "Cargando planes..." : "Elige un plan para continuar..."}
              </option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.precio} Bs
                </option>
              ))}
            </Select>
          </div>

          {planSeleccionado && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
              <Dumbbell size={16} className="text-[#2ea84a]" />
              <span>
                <strong className="text-gray-800">{planSeleccionado.nombre}</strong>
                {" · "}
                {esFamiliar
                  ? `Plan grupal · ${planSeleccionado.capacidad_minima}–${planSeleccionado.capacidad_maxima} personas`
                  : "Plan individual"}
                {" · "}
                <strong className="text-[#1a6b32]">{planSeleccionado.precio} Bs</strong>
                {" · "}
                {planSeleccionado.duracion_dias} días
              </span>
            </div>
          )}
        </FormSection>

        {/* ── PASO 2: Datos del titular ── */}
        {planSeleccionado && (
          <FormSection
            step={2}
            title={esFamiliar ? "Titular del contrato" : "Datos del cliente"}
            headerRight={esFamiliar && <span className="text-xs text-gray-400 font-normal">Responsable del pago</span>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Nombre(s) *</label>
                <Input icon={User} name="nombre" required maxLength={60} value={titular.nombre} onChange={handleTitularChange} placeholder="Ej. Juan Carlos" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Apellidos *</label>
                <Input icon={User} name="apellidos" required maxLength={60} value={titular.apellidos} onChange={handleTitularChange} placeholder="Ej. Pérez Gómez" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Teléfono *</label>
                <Input icon={Phone} name="telefono" required maxLength={8} value={titular.telefono} onChange={handleTitularChange} placeholder="Ej. 71234567" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Correo electrónico</label>
                <Input icon={Mail} name="email" type="email" value={titular.email} onChange={handleTitularChange} placeholder="Opcional" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Carnet de Identidad (CI) *
                </label>
                <Input
                  icon={Hash}
                  name="dni"
                  required
                  value={titular.dni}
                  onChange={handleTitularChange}
                  onBlur={handleTitularDniBlur}
                  placeholder="Ej. 12345678"
                />
                {/* Aviso inline si el DNI ya existe — no bloquea el campo, bloquea el submit */}
                <DniDuplicadoAviso cliente={dniDupTitular} />
              </div>
            </div>
          </FormSection>
        )}

        {/* ── PASO 3: Miembros adicionales (plan familiar) ── */}
        {esFamiliar && (
          <FormSection
            step={3}
            title="Miembros adicionales"
            headerRight={
              <span className="text-xs text-gray-400">
                {totalPersonas}/{planSeleccionado.capacidad_maxima} personas · mínimo {planSeleccionado.capacidad_minima}
              </span>
            }
          >
            {miembrosAdicionales.map((miembro, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ChevronRight size={14} className="text-[#2ea84a]" />
                    Miembro {index + 2}
                  </span>
                  {miembrosAdicionales.length > (planSeleccionado.capacidad_minima - 1) && (
                    <button type="button" onClick={() => eliminarMiembro(index)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-100">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Nombre(s) *</label>
                    <Input icon={User} name="nombre" required maxLength={60} value={miembro.nombre} onChange={(e) => handleMiembroChange(index, e)} placeholder="Ej. Ana" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Apellidos *</label>
                    <Input icon={User} name="apellidos" required maxLength={60} value={miembro.apellidos} onChange={(e) => handleMiembroChange(index, e)} placeholder="Ej. Pérez" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Teléfono *</label>
                    <Input icon={Phone} name="telefono" required maxLength={8} value={miembro.telefono} onChange={(e) => handleMiembroChange(index, e)} placeholder="Ej. 79876543" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">CI *</label>
                    <Input
                      icon={Hash}
                      name="dni"
                      required
                      value={miembro.dni}
                      onChange={(e) => handleMiembroChange(index, e)}
                      onBlur={() => handleMiembroDniBlur(index)}
                      placeholder="Ej. 87654321"
                    />
                    <DniDuplicadoAviso cliente={dniDupMiembros[index] ?? null} />
                  </div>
                </div>
              </div>
            ))}

            {puedeAgregarMas && (
              <button type="button" onClick={agregarMiembro} className="flex items-center gap-2 text-sm text-[#1a6b32] hover:text-[#2ea84a] font-medium transition-colors pt-1">
                <Plus size={16} /> Añadir otro miembro
              </button>
            )}
          </FormSection>
        )}

        {/* ── PASO FINAL: Pago ── */}
        {planSeleccionado && (
          <FormSection step={esFamiliar ? 4 : 3} title="Pago">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={pagoAlDia}
                onChange={(e) => setPagoAlDia(e.target.checked)}
                className="w-5 h-5 accent-[#1a6b32] rounded cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-800">
                El cliente pagó la membresía al momento del registro
              </span>
            </label>

            {pagoAlDia && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Método de pago *</label>
                <Select icon={CreditCard} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} required>
                  <option value="efectivo">Efectivo</option>
                  <option value="qr">QR</option>
                  <option value="transferencia">Transferencia</option>
                </Select>
              </div>
            )}

            {!pagoAlDia && (
              <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                ⚠️ La membresía quedará como <strong>pendiente de pago</strong>.
              </p>
            )}

            <p className="text-xs text-red-600 font-bold">
              ⚠️ Verifica el pago correctamente antes de guardar.
            </p>

            <div className="flex justify-end gap-4 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => navigate("/clientes")} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? "Guardando..." : (
                  <><Save size={20} /> Guardar {esFamiliar ? `(${totalPersonas} personas)` : "Cliente"}</>
                )}
              </Button>
            </div>
          </FormSection>
        )}
      </form>
    </div>
  );
}
