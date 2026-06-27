import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Dumbbell, Calendar, Clock, Users, DollarSign } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { PageHeader } from "../components/PageHeader";
import { FormSection } from "../components/FormSection";
import { createPlan } from "../services/planes";
import {
  sanitizarNombrePlan, sanitizarNumero, sanitizarDecimal,
  validarNombrePlan, validarDuracion, validarCapacidad, validarPrecio,
} from "../lib/validaciones";

export default function NuevoPlan() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    duracion_dias: "",
    turno: "libre",
    hora_inicio: "06:00",
    hora_fin: "23:59",
    capacidad_minima: 1,
    capacidad_maxima: 1,
    precio: "",
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "nombre") v = sanitizarNombrePlan(value);
    else if (name === "duracion_dias" || name === "capacidad_minima" || name === "capacidad_maxima") v = sanitizarNumero(value);
    else if (name === "precio") v = sanitizarDecimal(value);
    setFormData({ ...formData, [name]: v });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const errCampos =
      validarNombrePlan(formData.nombre) ||
      validarDuracion(formData.duracion_dias) ||
      validarCapacidad(formData.capacidad_minima, formData.capacidad_maxima) ||
      validarPrecio(formData.precio);
    if (errCampos) { setError(errCampos); setGuardando(false); return; }

    const esLibre = formData.turno === "libre";
    const payload = {
      nombre: formData.nombre,
      duracion_dias: parseInt(formData.duracion_dias, 10),
      turno: formData.turno,
      hora_inicio: esLibre ? null : formData.hora_inicio,
      hora_fin: esLibre ? null : formData.hora_fin,
      capacidad_minima: parseInt(formData.capacidad_minima, 10),
      capacidad_maxima: parseInt(formData.capacidad_maxima, 10),
      precio: parseFloat(formData.precio),
    };

    try {
      await createPlan(payload);
      navigate("/planes");
    } catch (err) {
      setError(err.message ?? "Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader
        backTo="/planes"
        title="Nuevo Plan"
        subtitle="Crea un nuevo paquete de membresía para el gimnasio."
      />

      {error && (
        <div className="bg-red-50 border-2 border-red-400 text-red-800 px-6 py-4 rounded-xl font-medium text-sm">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── SECCIÓN 1: Información General ── */}
        <FormSection title="Información General">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Nombre del Plan *</label>
              <Input
                icon={Dumbbell}
                name="nombre"
                required
                maxLength={60}
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. General Mañana, Familiar Libre..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Duración (Días) *</label>
              <Input
                icon={Calendar}
                name="duracion_dias"
                inputMode="numeric"
                maxLength={3}
                required
                value={formData.duracion_dias}
                onChange={handleChange}
                placeholder="Ej. 30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mínimo de Personas *</label>
              <Input
                icon={Users}
                name="capacidad_minima"
                inputMode="numeric"
                maxLength={2}
                required
                value={formData.capacidad_minima}
                onChange={handleChange}
                placeholder="Ej. 1"
              />
              <p className="text-xs text-gray-400">Requerido para activar el plan. Plan familiar: 3.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Máximo de Personas *</label>
              <Input
                icon={Users}
                name="capacidad_maxima"
                inputMode="numeric"
                maxLength={2}
                required
                value={formData.capacidad_maxima}
                onChange={handleChange}
                placeholder="Ej. 1"
              />
              <p className="text-xs text-gray-400">Límite de beneficiarios por membresía.</p>
            </div>
          </div>
        </FormSection>

        {/* ── SECCIÓN 2: Reglas de Acceso ── */}
        <FormSection
          title="Reglas de Acceso"
          headerRight={
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium border border-amber-200">
              El sistema validará estos horarios al entrar
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Tipo de Turno *</label>
              <Select icon={Clock} name="turno" required value={formData.turno} onChange={handleChange}>
                <option value="libre">Turno Libre (Todo el día)</option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </Select>
            </div>

            {formData.turno !== "libre" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Hora de Inicio Permitida *</label>
                  <Input icon={Clock} name="hora_inicio" type="time" required value={formData.hora_inicio} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Hora Límite de Ingreso *</label>
                  <Input icon={Clock} name="hora_fin" type="time" required value={formData.hora_fin} onChange={handleChange} />
                </div>
              </>
            )}

            {formData.turno === "libre" && (
              <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 md:col-span-2">
                El turno libre permite el ingreso a cualquier hora del día. No se aplican restricciones horarias.
              </p>
            )}
          </div>
        </FormSection>

        {/* ── SECCIÓN 3: Precio ── */}
        <FormSection title="Costo del Paquete">
          <div className="max-w-xs space-y-2">
            <label className="text-sm font-semibold text-gray-700">Precio (Bs) *</label>
            <Input
              icon={DollarSign}
              name="precio"
              inputMode="decimal"
              maxLength={8}
              required
              value={formData.precio}
              onChange={handleChange}
              placeholder="Ej. 100.00"
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate("/planes")} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={guardando}>
            {guardando ? (
              "Guardando..."
            ) : (
              <>
                <Save size={20} />
                Guardar Plan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
