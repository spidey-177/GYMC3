import { supabase } from "../lib/supabase";

// Devuelve el historial de asistencias con datos del cliente y su plan actual.
// El plan se extrae de la membresía más reciente del cliente como beneficiario.
// ordenAsc: false = más recientes primero (default), true = más antiguos primero.
export async function getAsistencias({ desde, hasta, search, ordenAsc = false } = {}) {
  let query = supabase
    .from("asistencias")
    .select(`
      *,
      cliente:clientes(
        id, nombre, apellidos, codigo_unico,
        beneficiarios:beneficiarios_membresia(
          membresia:membresias(
            fecha_fin,
            plan:planes(nombre)
          )
        )
      )
    `)
    .order("fecha_hora", { ascending: ordenAsc });

  if (desde) query = query.gte("fecha_hora", desde);
  if (hasta) query = query.lte("fecha_hora", hasta);

  const { data, error } = await query;
  if (error) throw error;

  // Extraer el nombre del plan de la membresía más reciente del cliente
  const enriched = data.map((r) => {
    const benefs = r.cliente?.beneficiarios ?? [];
    const ultimaMembresia = benefs
      .map((b) => b.membresia)
      .filter(Boolean)
      .sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin))[0];
    return {
      ...r,
      cliente: {
        ...r.cliente,
        plan_nombre: ultimaMembresia?.plan?.nombre ?? null,
      },
    };
  });

  if (search) {
    const term = search.toLowerCase();
    return enriched.filter(
      (r) =>
        r.cliente.nombre.toLowerCase().includes(term) ||
        r.cliente.apellidos.toLowerCase().includes(term) ||
        r.cliente.codigo_unico.toLowerCase().includes(term)
    );
  }

  return enriched;
}

// Lógica central de recepción.
// Evalúa el acceso de un cliente por su código único en este orden:
//   1. Cliente inexistente o eliminado → null (UI muestra "no encontrado")
//   2. estado_cuenta = 'suspendido'   → denegado_suspendido
//   3. Sin membresía o fecha_fin < hoy → denegado_vencido
//   4. Turno no libre y hora fuera de rango → denegado_turno
//   5. Todo OK → permitido
// Registra el resultado en asistencias (excepto cliente no encontrado).
//
// Delega toda la lógica de acceso a la función PL/pgSQL process_access().
// Al correr en el backend es atómica: la lectura de membresía y el INSERT
// en asistencias ocurren en la misma transacción, eliminando condiciones de carrera.
export async function processAccess(codigoUnico) {
  const { data, error } = await supabase.rpc("process_access", { p_codigo: codigoUnico });
  if (error) throw error;
  // El RPC devuelve un objeto con motivo='no_encontrado' cuando el cliente no existe;
  // los llamadores esperan null en ese caso para mostrar la UI de "no encontrado".
  if (data?.motivo === "no_encontrado") return null;
  return data;
}

// Devuelve las últimas asistencias de un cliente específico.
// Usado en ClientePerfil para el historial individual.
export async function getAsistenciasByCliente(clienteId, limit = 15) {
  const { data, error } = await supabase
    .from("asistencias")
    .select("id, fecha_hora, estado_acceso")
    .eq("cliente_id", clienteId)
    .order("fecha_hora", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// Inserta un registro de asistencia en la tabla
export async function registrarAsistencia(clienteId, estadoAcceso) {
  const { error } = await supabase
    .from("asistencias")
    .insert({ cliente_id: clienteId, estado_acceso: estadoAcceso });
  if (error) throw error;
}
