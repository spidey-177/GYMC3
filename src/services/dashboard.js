import { supabase } from "../lib/supabase";

function toDateStr(date) {
  const d = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${d(date.getMonth() + 1)}-${d(date.getDate())}`;
}

export async function getDashboardStats() {
  const hoy = new Date();
  const hoyStr = toDateStr(hoy);
  const en5 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 5);
  const en5Str = toDateStr(en5);
  const hace7 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
  const hace7Str = toDateStr(hace7);
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();

  const [r1, r2, r3, r4, r5, r6] = await Promise.all([
    // clientes activos
    supabase
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .eq("estado_cuenta", "activo")
      .is("deleted_at", null),

    // asistencias hoy
    supabase
      .from("asistencias")
      .select("*", { count: "exact", head: true })
      .gte("fecha_hora", inicioDia),

    // membresías por vencer (hoy → hoy+5)
    supabase
      .from("membresias")
      .select("*", { count: "exact", head: true })
      .gte("fecha_fin", hoyStr)
      .lte("fecha_fin", en5Str)
      .eq("estado_acceso", true),

    // membresías vencidas (fecha_fin < hoy, aún con estado_acceso=true)
    supabase
      .from("membresias")
      .select("*", { count: "exact", head: true })
      .lt("fecha_fin", hoyStr)
      .eq("estado_acceso", true),

    // últimos 5 accesos del día con datos del cliente
    supabase
      .from("asistencias")
      .select("id, fecha_hora, estado_acceso, cliente:clientes(id, nombre, apellidos, codigo_unico)")
      .gte("fecha_hora", inicioDia)
      .order("fecha_hora", { ascending: false })
      .limit(5),

    // alertas: membresías vencidas o próximas a vencer (ventana de -7 a +5 días)
    supabase
      .from("membresias")
      .select(
        "id, fecha_fin, titular:clientes!membresias_titular_id_fkey(id, nombre, apellidos, codigo_unico), plan:planes(nombre)"
      )
      .gte("fecha_fin", hace7Str)
      .lte("fecha_fin", en5Str)
      .order("fecha_fin", { ascending: true })
      .limit(10),
  ]);

  for (const r of [r1, r2, r3, r4, r5, r6]) {
    if (r.error) throw r.error;
  }

  return {
    stats: {
      clientes_activos: r1.count ?? 0,
      asistencias_hoy: r2.count ?? 0,
      por_vencer: r3.count ?? 0,
      vencidas: r4.count ?? 0,
    },
    accesos_recientes: r5.data ?? [],
    alertas: r6.data ?? [],
  };
}
