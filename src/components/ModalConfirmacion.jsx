import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "../ui/Button";

const ESPERA = 3;

// Contenido reutilizable: mensaje + botones con countdown.
// Extraído para poder incrustarlo dentro de otro modal (sinEnvoltorio)
// sin crear un segundo backdrop/z-50 encima del primero.
function Contenido({ mensaje, textoConfirmar, variante, onConfirmar, onCancelar }) {
  const [cuenta, setCuenta] = useState(ESPERA);

  useEffect(() => {
    if (cuenta === 0) return;
    const t = setTimeout(() => setCuenta((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cuenta]);

  return (
    <>
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={20} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">{mensaje}</p>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="ghost" onClick={onCancelar}>Cancelar</Button>
        <Button variant={variante} onClick={onConfirmar} disabled={cuenta > 0}>
          {cuenta > 0 ? `Espera ${cuenta}s…` : textoConfirmar}
        </Button>
      </div>
    </>
  );
}

/**
 * Modal de confirmación con countdown de 3 segundos.
 *
 * Props:
 *   titulo          — título del modal (ignorado en modo sinEnvoltorio)
 *   mensaje         — texto de advertencia mostrado al usuario
 *   textoConfirmar  — etiqueta del botón de confirmación (default "Confirmar")
 *   variante        — variante del botón: "danger" | "primary" | "outline" (default "danger")
 *   onConfirmar     — callback cuando el usuario confirma
 *   onCancelar      — callback cuando cancela o cierra
 *   sinEnvoltorio   — si true, renderiza solo el contenido sin Modal wrapper.
 *                     Útil cuando se incrusta dentro de otro modal abierto.
 */
export function ModalConfirmacion({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  variante = "danger",
  onConfirmar,
  onCancelar,
  sinEnvoltorio = false,
}) {
  const contenido = (
    <Contenido
      mensaje={mensaje}
      textoConfirmar={textoConfirmar}
      variante={variante}
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
    />
  );

  if (sinEnvoltorio) return contenido;

  return (
    <Modal title={titulo} onClose={onCancelar}>
      {contenido}
    </Modal>
  );
}
