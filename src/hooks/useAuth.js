import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Hook centralizado de autenticación.
// Devuelve la sesión activa y un flag de carga para evitar
// que la UI decida "no hay sesión" antes de que Supabase responda.
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = todavía cargando

  useEffect(() => {
    // Consulta la sesión existente al montar (ej: al refrescar la página)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
    });

    // Escucha cambios en tiempo real: login, logout, token expirado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    loading: session === undefined,
  };
}
