import { CheckCircle2, XCircle, AlertCircle, ShieldOff } from "lucide-react";
import { Badge } from "../ui/Badge";

const CONFIG = {
  permitido: { variant: "green", label: "Permitido", Icon: CheckCircle2 },
  denegado_vencido: { variant: "red", label: "Membresía Vencida", Icon: XCircle },
  denegado_turno: { variant: "amber", label: "Fuera de Turno", Icon: AlertCircle },
  denegado_suspendido: { variant: "red", label: "Cuenta Suspendida", Icon: ShieldOff },
};

export function AccesoEstadoBadge({ estado, showIcon = true }) {
  const config = CONFIG[estado] || { variant: "gray", label: estado, Icon: null };
  const { variant, label, Icon } = config;
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {showIcon && Icon && <Icon size={14} />}
      {label}
    </Badge>
  );
}
