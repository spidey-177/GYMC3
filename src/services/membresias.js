import { supabase } from "../lib/supabase";

// Helper local: Date → "YYYY-MM-DD" sin desfase de zona horaria
function toDateStr(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// Devuelve la membresía más reciente de un titular, con su plan incluido.
// Usado en ClientePerfil para mostrar el estado actual de la membresía.
export async function getMembresiaByTitular(titularId) {
  const { data, error } = await supabase
    .from("membresias")
    .select("*, plan:planes(*)")
    .eq("titular_id", titularId)
    .order("fecha_fin", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Devuelve la membresía activa de un cliente (ya sea como titular o beneficiario).
// Incluye el plan para poder verificar turno y horarios en Recepción.
export async function getMembresiaActivaByCliente(clienteId) {
  const { data, error } = await supabase
    .from("beneficiarios_membresia")
    .select(`
      membresia:membresias (
        id,
        fecha_inicio,
        fecha_fin,
        estado_financiero,
        estado_acceso,
        titular_id,
        plan:planes (
          id,
          nombre,
          turno,
          hora_inicio,
          hora_fin
        )
      )
    `)
    .eq("cliente_id", clienteId)
    .maybeSingle();
  if (error) throw error;
  return data?.membresia ?? null;
}

// Devuelve todos los beneficiarios de una membresía con sus datos de cliente
export async function getBeneficiariosByMembresia(membresiaId) {
  const { data, error } = await supabase
    .from("beneficiarios_membresia")
    .select("*, cliente:clientes(*)")
    .eq("membresia_id", membresiaId);
  if (error) throw error;
  return data;
}

// Crea una membresía completa:
// 1. Verifica que el titular no tenga ya una membresía vigente
// 2. Inserta la fila en membresias
// 3. Inserta al titular como primer beneficiario
// 4. Inserta los beneficiarios adicionales (planes familiares)
// Los pasos 2-4 se hacen en secuencia; si alguno falla el error se propaga.
export async function createMembresia({ plan_id, titular_id, fecha_inicio, fecha_fin, estado_financiero, beneficiariosIds = [] }) {
  // Guard: evitar dos membresías activas para el mismo titular.
  // "Activa" = fecha_fin >= hoy, independientemente del estado_acceso (incluso si
  // está suspendida, la membresía sigue vigente en tiempo y no debe duplicarse).
  const hoy = toDateStr(new Date());
  const { data: existente, error: errDup } = await supabase
    .from("membresias")
    .select("id, fecha_fin")
    .eq("titular_id", titular_id)
    .gte("fecha_fin", hoy)
    .maybeSingle();
  if (errDup) throw errDup;
  if (existente) {
    throw new Error(
      `Este cliente ya tiene una membresía vigente hasta el ${existente.fecha_fin}. Usa "Renovar" en su perfil en lugar de crear una nueva.`
    );
  }

  const { data: membresia, error: errM } = await supabase
    .from("membresias")
    .insert({ plan_id, titular_id, fecha_inicio, fecha_fin, estado_financiero })
    .select()
    .single();
  if (errM) throw errM;

  const todosBeneficiarios = [titular_id, ...beneficiariosIds].map((cliente_id) => ({
    membresia_id: membresia.id,
    cliente_id,
  }));

  const { error: errB } = await supabase
    .from("beneficiarios_membresia")
    .insert(todosBeneficiarios);
  if (errB) throw errB;

  return membresia;
}

// Renueva la fecha de fin de una membresía y opcionalmente actualiza
// el estado financiero (ej: 'pendiente' → 'pagado' al renovar con pago)
export async function renovarMembresia(id, { fecha_fin, estado_financiero }) {
  const { data, error } = await supabase
    .from("membresias")
    .update({ fecha_fin, estado_financiero })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Cambia el plan asignado a una membresía
export async function cambiarPlan(membresiaId, planId) {
  const { data, error } = await supabase
    .from("membresias")
    .update({ plan_id: planId })
    .eq("id", membresiaId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Actualiza solo el estado financiero ('pagado' | 'pendiente')
export async function updateEstadoFinanciero(id, estado) {
  const { data, error } = await supabase
    .from("membresias")
    .update({ estado_financiero: estado })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
