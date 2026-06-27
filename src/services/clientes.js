import { supabase } from "../lib/supabase";

// Devuelve todos los clientes activos (excluye soft-deletes)
export async function getClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .is("deleted_at", null)
    .order("fecha_alta", { ascending: false });
  if (error) throw error;
  return data;
}

// Devuelve un cliente por su ID (excluye soft-deletes)
export async function getClienteById(id) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return data;
}

// Busca un cliente por su código único — incluye eliminados para que
// Recepción pueda mostrar "no encontrado" en vez de acceso denegado
export async function getClienteByCodigoUnico(codigo) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("codigo_unico", codigo)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Crea un nuevo cliente y devuelve el registro insertado
export async function createCliente(clienteData) {
  const { data, error } = await supabase
    .from("clientes")
    .insert(clienteData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Actualiza campos del perfil de un cliente
export async function updateCliente(id, updates) {
  const { data, error } = await supabase
    .from("clientes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Cambia el estado de cuenta entre 'activo' y 'suspendido'
export async function updateEstadoCuenta(id, estado) {
  return updateCliente(id, { estado_cuenta: estado });
}

// Devuelve clientes con su membresía más reciente (como titular) y el nombre del plan.
// Usado en el listado de Clientes para mostrar el plan actual en la tabla.
// Si el cliente solo es beneficiario (no titular), membresia_actual queda en null.
export async function getClientesConPlan() {
  const { data, error } = await supabase
    .from("clientes")
    .select(`
      *,
      membresias!membresias_titular_id_fkey (
        id,
        plan_id,
        fecha_fin,
        estado_financiero,
        plan:planes ( nombre )
      )
    `)
    .is("deleted_at", null)
    .order("fecha_alta", { ascending: false });
  if (error) throw error;

  return data.map((cliente) => {
    const membresiaActual = (cliente.membresias ?? [])
      .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin))[0] ?? null;
    const { membresias: _, ...resto } = cliente;
    return { ...resto, membresia_actual: membresiaActual };
  });
}

// Busca un cliente por DNI para detectar duplicados antes de crear o editar.
// Excluye clientes con soft-delete porque un DNI "liberado" por un cliente eliminado
// podría pertenecer legítimamente a una nueva persona.
export async function getClienteByDni(dni) {
  if (!dni) return null;
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, apellidos, codigo_unico")
    .eq("dni", dni)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Soft delete: marca deleted_at con la fecha actual en vez de borrar la fila
export async function deleteCliente(id) {
  const { error } = await supabase
    .from("clientes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// Devuelve clientes con soft-delete activo (dados de baja), con su último plan.
// Usado en el listado de Clientes para el panel "Dados de baja".
export async function getClientesEliminados() {
  const { data, error } = await supabase
    .from("clientes")
    .select(`
      *,
      membresias!membresias_titular_id_fkey (
        id,
        plan_id,
        fecha_fin,
        plan:planes ( nombre )
      )
    `)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;

  return data.map((cliente) => {
    const ultimaMembresia = (cliente.membresias ?? [])
      .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin))[0] ?? null;
    const { membresias: _, ...resto } = cliente;
    return { ...resto, membresia_actual: ultimaMembresia };
  });
}

// Reactiva un cliente dado de baja: borra deleted_at para que vuelva a aparecer
// en los listados activos. Sus datos, código único e historial se conservan intactos.
export async function reactivarCliente(id) {
  const { error } = await supabase
    .from("clientes")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}
