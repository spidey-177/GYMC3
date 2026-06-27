import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Clock, Users, Calendar, DollarSign } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { PageHeader } from "../components/PageHeader";
import { getPlanes, deletePlan } from "../services/planes";

function formatTurno(plan) {
  if (plan.turno === "libre") return "Libre";
  if (plan.hora_inicio && plan.hora_fin) {
    return `${plan.hora_inicio.slice(0, 5)} - ${plan.hora_fin.slice(0, 5)}`;
  }
  return plan.turno;
}

export default function Planes() {
  const navigate = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  useEffect(() => {
    getPlanes()
      .then(setPlanes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleEliminar = async (plan) => {
    if (!window.confirm(`¿Eliminar el plan "${plan.nombre}"? No se podrá asignar a nuevas membresías.`)) return;
    setEliminando(plan.id);
    try {
      await deletePlan(plan.id);
      setPlanes((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setEliminando(null);
    }
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
      {error && <p className="text-center text-red-500 py-16">Error: {error}</p>}

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
                <Button variant="outline" className="flex-1 text-sm py-1.5" disabled>
                  <Edit size={16} /> Editar
                </Button>
                <Button
                  variant="danger"
                  className="px-3 py-1.5"
                  onClick={() => handleEliminar(plan)}
                  disabled={eliminando === plan.id}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
