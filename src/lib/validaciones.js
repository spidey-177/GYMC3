// ── SANITIZADORES ──────────────────────────────────────────────────────────
// Se usan en onChange para impedir que el usuario escriba caracteres inválidos.
// Devuelven el valor limpiado para asignarlo directamente al estado.

/** Letras (con acentos y ñ), espacios y guiones. Nombres y apellidos. */
export function sanitizarTexto(v) {
  return v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s-]/g, "");
}

/** Solo dígitos. Teléfonos y campos puramente numéricos. */
export function sanitizarNumero(v) {
  return v.replace(/\D/g, "");
}

/**
 * Dígitos y un único punto decimal. Precios.
 * Elimina caracteres inválidos y no permite más de un punto.
 */
export function sanitizarDecimal(v) {
  const limpio = v.replace(/[^0-9.]/g, "");
  const partes = limpio.split(".");
  return partes.length > 2 ? partes[0] + "." + partes.slice(1).join("") : limpio;
}

/**
 * Alfanumérico para CI boliviano.
 * Permite letras y números (ej. "7654321", "7654321 LP").
 * Convierte a mayúsculas por convención.
 */
export function sanitizarCi(v) {
  return v.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase();
}

/**
 * Letras, números, espacios, guiones y paréntesis.
 * Nombres de plan: "General Mañana", "Familiar (Tarde)", etc.
 */
export function sanitizarNombrePlan(v) {
  return v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s\-()/]/g, "");
}

// ── VALIDADORES ────────────────────────────────────────────────────────────
// Se usan en submit (o antes del modal de confirmación).
// Devuelven null si el valor es válido, o un string con el mensaje de error.

/** Nombre de persona (nombre(s) o apellidos). */
export function validarNombre(valor, etiqueta = "Este campo") {
  const v = valor.trim();
  if (!v) return `${etiqueta} es obligatorio.`;
  if (v.length < 2) return `${etiqueta} debe tener al menos 2 caracteres.`;
  if (v.length > 60) return `${etiqueta} no puede superar los 60 caracteres.`;
  return null;
}

/** Teléfono boliviano: 7-8 dígitos numéricos. */
export function validarTelefono(valor) {
  const v = valor.replace(/\D/g, "");
  if (!v) return "El teléfono es obligatorio.";
  if (v.length < 7) return "El teléfono debe tener al menos 7 dígitos.";
  if (v.length > 8) return "El teléfono no puede tener más de 8 dígitos.";
  return null;
}

/** Email: opcional. Si se rellena, debe tener formato válido. */
export function validarEmail(valor) {
  if (!valor || !valor.trim()) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) {
    return "El correo electrónico no tiene un formato válido.";
  }
  return null;
}

/**
 * CI boliviano: 5-15 caracteres alfanuméricos.
 * @param {boolean} obligatorio — true en NuevoCliente, false al editar
 */
export function validarCi(valor, obligatorio = false) {
  const v = valor.trim();
  if (!v) return obligatorio ? "El CI es obligatorio." : null;
  if (v.length < 5) return "El CI debe tener al menos 5 caracteres.";
  if (v.length > 15) return "El CI no puede superar los 15 caracteres.";
  return null;
}

/** Nombre de plan: 3-60 caracteres, no vacío. */
export function validarNombrePlan(valor) {
  const v = valor.trim();
  if (!v) return "El nombre del plan es obligatorio.";
  if (v.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (v.length > 60) return "El nombre no puede superar los 60 caracteres.";
  return null;
}

/** Duración en días: entero entre 1 y 365. */
export function validarDuracion(valor) {
  const n = parseInt(valor, 10);
  if (!valor && valor !== 0) return "La duración es obligatoria.";
  if (isNaN(n) || n < 1) return "La duración mínima es 1 día.";
  if (n > 365) return "La duración máxima es 365 días.";
  return null;
}

/** Capacidades de un plan: mínima ≥ 1, máxima ≥ mínima, máximo 20 personas. */
export function validarCapacidad(minima, maxima) {
  const min = parseInt(minima, 10);
  const max = parseInt(maxima, 10);
  if (isNaN(min) || min < 1) return "La capacidad mínima debe ser al menos 1.";
  if (isNaN(max) || max < 1) return "La capacidad máxima debe ser al menos 1.";
  if (max < min) return "La capacidad máxima no puede ser menor a la mínima.";
  if (max > 20) return "La capacidad máxima no puede superar 20 personas.";
  return null;
}

/** Precio en bolivianos: número positivo, hasta 99.999 Bs. */
export function validarPrecio(valor) {
  const n = parseFloat(valor);
  if (valor === "" || valor === undefined || valor === null) return "El precio es obligatorio.";
  if (isNaN(n) || n <= 0) return "El precio debe ser un número mayor a 0.";
  if (n > 99999) return "El precio no puede superar 99.999 Bs.";
  return null;
}
