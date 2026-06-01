# Esquema de Base de Datos Corregido (Supabase / PostgreSQL) - V2

Este documento redefine el modelo de datos para el MVP del Gym Dashboard, subsanando los errores críticos de lógica de negocio, desacoplando los estados financieros de las restricciones temporales, resolviendo la gestión de planes familiares (grupales) y asegurando la integridad del historial mediante un borrado lógico correcto.

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
| `turno`         | VARCHAR | NOT NULL (Enum: 'mañana', 'tarde', 'noche', 'libre')                           |
| `hora_inicio`   | TIME    | NOT NULL. Hora en la que se permite el ingreso (Ej. 06:00:00)                  |
| `hora_fin`      | TIME    | NOT NULL. Hora límite permitida para el ingreso (Ej. 13:00:00)                 |
| `capacidad`     | INTEGER | DEFAULT 1. Número de personas permitidas (1 para individual, 3+ para familiar) |
| `precio`        | DECIMAL | NOT NULL                                                                       |

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

_Nota: Para planes individuales, existirá un único registro donde el `cliente_id` es igual al `titular_id`. Para planes familiares, habrá múltiples registros apuntando a la misma `membresia_id`._

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

1. **Gestión de Grupos/Familias:** Cuando un titular paga un plan familiar, se genera una fila en `membresias` y un registro en `pagos`. Los accesos se habilitan automáticamente a todos los miembros listados en `beneficiarios_membresia`.
2. **Independencia Financiera/Temporal:** El vencimiento del tiempo no altera el historial contable. Una membresía del mes pasado mantendrá su `estado_financiero = 'pagado'`, pero el acceso será denegado dinámicamente en recepción si `fecha_actual > fecha_fin`.
3. **Control de Turnos Dinámico:** Eliminamos la complejidad de una tabla de configuración global. Las columnas `hora_inicio` y `hora_fin` en `planes` permiten al backend validar de forma matemática y segura si el cliente está dentro de su horario, sin delegar esta responsabilidad al frontend.
4. **Preservación de Datos (Soft Delete):** Al "eliminar" un cliente, se actualiza su campo `deleted_at` con el timestamp actual. Las consultas ordinarias del frontend filtrarán omitiendo registros donde `deleted_at IS NOT NULL`, logrando que desaparezca de la UI, pero manteniendo las llaves foráneas de `pagos` y `asistencias` completamente intactas.
