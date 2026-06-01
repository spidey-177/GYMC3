# Contrato Frontend / Backend (Acciones de Supabase)

Este documento define las consultas (queries) y mutaciones principales que el Frontend (React) solicitará a la base de datos (Supabase) para hacer funcionar cada página del sistema.

## 1. Dashboard

- **`getDashboardStats()`**:
  - **Descripción**: Obtiene métricas generales.
  - **Datos devueltos**:
    - Conteo de clientes con `estado_cuenta = 'activo'` y `deleted_at IS NULL`.
    - Conteo de membresías donde `fecha_fin` está en los próximos 5 días y `estado_acceso = true`.
    - Conteo de membresías donde `fecha_fin < hoy` y `estado_acceso = true`.
    - Conteo de asistencias del día actual (`fecha_hora::date = hoy`).

## 2. Recepción (Acceso Rápido)

- **`processAccess(codigo_unico)`** _(Función RPC en Supabase)_:
  - **Descripción**: Endpoint seguro. El frontend envía únicamente el código. El backend de Supabase busca al cliente, evalúa la vigencia de la membresía y valida matemáticamente el turno usando **la hora del servidor**. El backend es quien inserta automáticamente el registro en la tabla `asistencias` con el estado final.
  - **Datos enviados**: `codigo_unico`.
  - **Datos devueltos**: Objeto de resolución infalible (ej. `{ acceso_concedido: true/false, motivo: 'permitido' | 'denegado_vencido' | 'denegado_turno' | 'denegado_suspendido', datos_cliente: {...}, membresia: {...} }`). El frontend solo recibe esto y pinta la pantalla de verde o rojo.

## 3. Clientes (Directorio)

- **`getClients(filtros)`**:
  - **Descripción**: Lista todos los clientes activos en el sistema.
  - **Filtros disponibles**: Búsqueda por texto (nombre/apellidos/código), estado de cuenta (`'activo'` | `'suspendido'`).
  - **Nota**: Siempre filtrar `deleted_at IS NULL` para excluir clientes eliminados.
- **`createClient(datos_cliente)`**:
  - **Descripción**: Da de alta un nuevo registro en la tabla `clientes`.
  - **Datos enviados**: `nombre`, `apellidos`, `telefono`, `email` (opcional), `codigo_unico`.

## 4. Perfil de Cliente

- **`getClientDetails(cliente_id)`**:
  - **Descripción**: Trae el expediente completo.
  - **Datos devueltos**: Información del cliente, historial de la tabla `membresias` (con el plan asociado vía JOIN a `planes`), historial de `asistencias` y `pagos`.
- **`updateClient(cliente_id, datos_cliente)`**:
  - **Descripción**: Actualiza nombre, apellidos, teléfono, email, etc.
- **`deleteClient(cliente_id)`**:
  - **Descripción**: Borrado lógico. Actualiza `deleted_at = NOW()` en la tabla `clientes`. El cliente desaparece de todos los listados del sistema pero se preserva la integridad del historial de `pagos` y `asistencias`.
- **`renewMembership(datos_renovacion)`**:
  - **Descripción**: Crea una nueva fila en `membresias`, registra la transacción en `pagos` e inserta los registros correspondientes en `beneficiarios_membresia`.
  - **Datos enviados**:
    - `titular_id`: UUID del cliente responsable del pago.
    - `plan_id`: UUID del plan seleccionado.
    - `beneficiarios`: Array de UUIDs de clientes (`[cliente_id_1, cliente_id_2, ...]`). Para planes individuales, el array contiene únicamente el `titular_id`.
    - `monto`: Decimal.
    - `metodo_pago`: `'efectivo'` | `'qr'` | `'transferencia'`.
- **`changePlan(cliente_id, nuevo_plan_id)`**:
  - **Descripción**: Marca la membresía actual como `estado_acceso = false` y crea una nueva membresía conectada al nuevo plan. Si el nuevo plan es familiar, se deben pasar también los beneficiarios (ver `renewMembership`).

## 5. Planes de Membresía

- **`getPlans()`**:
  - **Descripción**: Obtiene todos los planes disponibles del catálogo.
- **`createPlan(datos_plan)`** / **`updatePlan(plan_id, datos_plan)`**:
  - **Descripción**: Administra el catálogo en la tabla `planes`.
  - **Datos del plan**: `nombre`, `duracion_dias`, `turno` (`'mañana'` | `'tarde'` | `'noche'` | `'libre'`), `hora_inicio`, `hora_fin`, `capacidad`, `precio`.

## 6. Historial de Asistencia

- **`getAttendances(filtros)`**:
  - **Descripción**: Lista las asistencias con paginación.
  - **Filtros disponibles**: `fecha_inicio`, `fecha_fin`, `cliente_id` (opcional para filtrar por cliente específico).
  - **Datos devueltos**: Filas de la tabla `asistencias` con JOIN a `clientes` para mostrar nombre, apellidos y código único.

---

## Notas de Implementación (Supabase)

- El frontend utilizará la librería `@supabase/supabase-js`.
- **Seguridad de Reglas de Negocio:** Toda la lógica de fechas, vencimientos y turnos (horarios) se centralizará en el **backend** usando funciones almacenadas (Postgres RPC) o Edge Functions. Nunca se confiará en la hora local del dispositivo del cliente (frontend) ni se delegará la decisión de acceso al navegador.
- **Clientes eliminados:** Todas las queries del frontend deben incluir el filtro `deleted_at IS NULL` por defecto, excepto en reportes históricos donde se requiera el registro completo.
