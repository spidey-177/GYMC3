import { supabase } from "../lib/supabase";

// Devuelve todos los planes activos (excluye soft-deletes)
// Ordenados por precio para mostrarlos coherentemente en la UI
export async function getPlanes() {
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .is("deleted_at", null)
    .order("precio", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getPlanById(id) {
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createPlan(planData) {
  const { data, error } = await supabase
    .from("planes")
    .insert(planData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlan(id, updates) {
  const { data, error } = await supabase
    .from("planes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Soft delete: el plan deja de asignarse a nuevas membresías
// pero el historial de membresías anteriores se mantiene intacto
export async function deletePlan(id) {
  const { error } = await supabase
    .from("planes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
