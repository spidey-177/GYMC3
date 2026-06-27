# Esquema de Base de Datos Corregido (Supabase / PostgreSQL) - V3

Este documento redefine el modelo de datos para el MVP del Gym Dashboard, subsanando los errores críticos de lógica de negocio, desacoplando los estados financieros de las restricciones temporales, resolviendo la gestión de planes familiares (grupales) y asegurando la integridad del historial mediante un borrado lógico correcto.

## Autenticación

La autenticación de administrador se delega completamente a **Supabase Auth**. No se define una tabla de usuarios propia en este esquema. Un único administrador operará el sistema; no se contemplan roles múltiples en el MVP.

---

## 1. Tabla: `clientes`

Almacena la información personal y el estado operativo de los socios. Se implementa un mecanismo de "Soft Delete" (borrado lógico) y separación de estados.

| Campo           | Tipo      | Restricciones / Notas                                                                               |
| :-------------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| `id`            | UUID      | Primary Key (Generado automáticamente)                                                              |
| `codigo_unico`  | VARCHAR   | UNIQUE. Código usado para el acceso rápido en recepción.                                            |
| `nombre`        | VARCHAR   | NOT NULL                                                                                            |
| `apellidos`     | VARCHAR   | NOT NULL                                                                                            |
| `telefono`      | VARCHAR   | NOT NULL                                                                                            |
| `email`         | VARCHAR   | Opcional                                                                                            |
| `fecha_alta`    | TIMESTAMP | DEFAULT NOW()                                                                                       |
| `estado_cuenta` | VARCHAR   | NOT NULL DEFAULT 'activo' (Enum: 'activo', 'suspendido')                                            |
| `deleted_at`    | TIMESTAMP | DEFAULT NULL. Almacena la fecha de eliminación. Si es `NULL`, el cliente está activo en el sistema. |

---

## 2. Tabla: `planes`

Catálogo de los paquetes de membresía ofrecidos por el gimnasio. Los horarios de los turnos se centralizan aquí de forma dinámica para simplificar el MVP.

| Campo           | Tipo    | Restricciones / Notas                                                          |
| :-------------- | :------ | :----------------------------------------------------------------------------- |
| `id`            | UUID    | Primary Key                                                                    |
| `nombre`        | VARCHAR | NOT NULL (Ej. "General Mañana", "Familiar")                                    |
| `duracion_dias` | INTEGER | NOT NULL (Ej. 1, 30, 60 para definir vigencia)                                 |
| `turno`            | VARCHAR   | NOT NULL (Enum: 'mañana', 'tarde', 'noche', 'libre')                                                                     |
| `hora_inicio`      | TIME      | NULL. Hora en la que se permite el ingreso (Ej. 06:00:00). `NULL` cuando `turno = 'libre'`: el backend interpreta NULL como sin restricción horaria. |
| `hora_fin`         | TIME      | NULL. Hora límite permitida para el ingreso (Ej. 13:00:00). `NULL` cuando `turno = 'libre'`.                             |
| `capacidad_minima` | INTEGER   | NOT NULL DEFAULT 1. Mínimo de personas requeridas para activar el plan (Ej. 3 para el plan Familiar).                    |
| `capacidad_maxima` | INTEGER   | NOT NULL DEFAULT 1. Máximo de beneficiarios permitidos bajo una misma membresía.                                         |
| `precio`           | DECIMAL   | NOT NULL                                                                                                                 |
| `deleted_at`       | TIMESTAMP | DEFAULT NULL. Borrado lógico. Si no es NULL, el plan no aparece en la UI ni puede asignarse a nuevas membresías.         |

---

## 3. Tabla: `membresias`

Representa el contrato administrativo y financiero de un plan adquirido. Define la vigencia cronológica y quién se hace responsable de la deuda.

| Campo               | Tipo    | Restricciones / Notas                                                              |
| :------------------ | :------ | :--------------------------------------------------------------------------------- |
| `id`                | UUID    | Primary Key                                                                        |
| `plan_id`           | UUID    | Foreign Key -> `planes(id)`                                                        |
| `titular_id`        | UUID    | Foreign Key -> `clientes(id)`. El cliente responsable del pago del contrato.       |
| `fecha_inicio`      | DATE    | NOT NULL. Inicio de la vigencia del acceso.                                        |
| `fecha_fin`         | DATE    | NOT NULL. Fin de la vigencia del acceso.                                           |
| `estado_financiero` | VARCHAR | NOT NULL (Enum: 'pagado', 'pendiente'). Controla exclusivamente el dinero.         |
| `estado_acceso`     | BOOLEAN | DEFAULT TRUE. Permite inhabilitar manualmente el contrato (por baneo o reembolso). |

---

## 4. Tabla: `beneficiarios_membresia` (NUEVA)

Tabla intermedia indispensable para resolver los planes familiares/grupales. Vincula la membresía (contrato pagado) con los clientes físicos que tienen derecho a ingresar.

| Campo          | Tipo | Restricciones / Notas                             |
| :------------- | :--- | :------------------------------------------------ |
| `id`           | UUID | Primary Key                                       |
| `membresia_id` | UUID | Foreign Key -> `membresias(id)` ON DELETE CASCADE |
| `cliente_id`   | UUID | Foreign Key -> `clientes(id)` ON DELETE CASCADE   |

_Nota: Para planes individuales, existirá un único registro donde el `cliente_id` es igual al `titular_id`. Para planes familiares, habrá múltiples registros apuntando a la misma `membresia_id`. La inserción del titular como primer beneficiario debe ser responsabilidad de la capa de aplicación (no hay constraint de BD que lo fuerce)._

---

## 5. Tabla: `asistencias`

Registro histórico e inmutable de los accesos diarios. La validación se calcula en el Backend, registrando el resultado definitivo.

| Campo           | Tipo      | Restricciones / Notas                                                                     |
| :-------------- | :-------- | :---------------------------------------------------------------------------------------- |
| `id`            | UUID      | Primary Key                                                                               |
| `cliente_id`    | UUID      | Foreign Key -> `clientes(id)`                                                             |
| `fecha_hora`    | TIMESTAMP | DEFAULT NOW()                                                                             |
| `estado_acceso` | VARCHAR   | NOT NULL (Enum: 'permitido', 'denegado_vencido', 'denegado_turno', 'denegado_suspendido') |

---

## 6. Tabla: `pagos`

Historial transaccional de los montos ingresados a la caja. Se amarra a la membresía (el contrato), no al cliente individual, lo que permite pagos grupales unificados.

| Campo          | Tipo      | Restricciones / Notas                              |
| :------------- | :-------- | :------------------------------------------------- |
| `id`           | UUID      | Primary Key                                        |
| `membresia_id` | UUID      | Foreign Key -> `membresias(id)`                    |
| `monto`        | DECIMAL   | NOT NULL                                           |
| `fecha_pago`   | TIMESTAMP | DEFAULT NOW()                                      |
| `metodo_pago`  | VARCHAR   | NOT NULL (Enum: 'efectivo', 'qr', 'transferencia') |

---

## Resumen de Reglas de Integridad Aplicadas

1. **Gestión de Grupos/Familias:** Cuando un titular paga un plan familiar, se genera una fila en `membresias` y un registro en `pagos`. Los accesos se habilitan a todos los miembros listados en `beneficiarios_membresia`. La capa de aplicación debe validar que la cantidad de beneficiarios cumpla con `capacidad_minima` antes de activar la membresía.
2. **Independencia Financiera/Temporal:** El vencimiento del tiempo no altera el historial contable. Una membresía del mes pasado mantendrá su `estado_financiero = 'pagado'`, pero el acceso será denegado dinámicamente en recepción si `fecha_actual > fecha_fin`.
3. **Control de Turnos Dinámico:** Las columnas `hora_inicio` y `hora_fin` en `planes` son `NULL` cuando `turno = 'libre'`. El backend evalúa: si ambas son `NULL`, el acceso es libre de horario; si tienen valor, valida que la hora actual esté dentro del rango. Nunca se delega esta lógica al frontend.
4. **Orden de validación en Recepción:** El backend evalúa en este orden para determinar `estado_acceso` en `asistencias`:
   - `clientes.deleted_at IS NOT NULL` → acceso denegado (cliente eliminado, no se registra asistencia).
   - `clientes.estado_cuenta = 'suspendido'` → `'denegado_suspendido'`.
   - `fecha_actual > membresias.fecha_fin` → `'denegado_vencido'`.
   - Hora actual fuera de `hora_inicio`/`hora_fin` (cuando no es libre) → `'denegado_turno'`.
   - Todas las validaciones pasan → `'permitido'`.
   - _Nota: `estado_financiero = 'pendiente'` no deniega el acceso. Es visible en la tarjeta de recepción como alerta ámbar para que el personal gestione el cobro por fuera del flujo de acceso._
5. **Preservación de Datos (Soft Delete):** Aplica tanto a `clientes` como a `planes`. Al "eliminar" cualquiera de los dos, se setea `deleted_at`. Las consultas ordinarias filtran `WHERE deleted_at IS NULL`. Los planes con `deleted_at` no son asignables a nuevas membresías, pero los registros históricos que los referencian se mantienen intactos.
