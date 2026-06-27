import { supabase } from "../lib/supabase";

// Devuelve todos los pagos de una membresía ordenados por fecha descendente
export async function getPagosByMembresia(membresiaId) {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("membresia_id", membresiaId)
    .order("fecha_pago", { ascending: false });
  if (error) throw error;
  return data;
}

// Registra un pago y devuelve el registro insertado.
// Se espera: { membresia_id, monto, metodo_pago }
export async function registrarPago(pagoData) {
  const { data, error } = await supabase
    .from("pagos")
    .insert(pagoData)
    .select()
    .single();
  if (error) throw error;
  return data;
}
