# Gym Dashboard - Especificación de Páginas (MVP)

Este documento detalla la estructura visual y funcional de las páginas que conformarán el MVP del sistema, unificando los requerimientos originales de diseño con el contexto operativo específico del gimnasio.

## 1. Dashboard (Panel Principal)

**Objetivo:** Mostrar información relevante del gimnasio de forma rápida y visual para la toma de decisiones.

**Componentes principales:**

- Tarjetas de estadísticas (Stats Cards).
- Gráfico de actividad (tendencia de asistencias recientes).
- Alertas de vencimiento de membresías.

**Métricas y Listados:**

- Total de clientes activos.
- Clientes con membresía próxima a vencer.
- Clientes con membresía recién vencida.
- Total de asistencias registradas durante el día.

## 2. Recepción (Acceso Rápido)

**Objetivo:** Interfaz principal de uso diario, optimizada para un flujo veloz y sin fricciones.

**Funcionalidades:**

- Input principal para escanear/ingresar el código único del cliente.
- Alerta visual e instantánea sobre el estado de acceso (Verde: Correcto, Rojo: Vencido/Turno incorrecto).
- Tarjeta resumen con: Nombre, código, plan actual, turno asignado, vigencia y estado de pago.
- Registro de asistencia automático si el acceso es válido.

## 3. Clientes (Directorio)

**Objetivo:** Gestionar toda la información base de los clientes del gimnasio.

**Funcionalidades:**

- Crear nuevo cliente.
- Listar todos los clientes en formato de tabla.
- Buscar cliente (por nombre, apellido o código).
- Filtrar clientes (activos, inactivos, por tipo de plan).

**Datos mínimos a solicitar:**

- Nombre(s) y Apellidos.
- Teléfono de contacto.
- Correo electrónico (Opcional).
- Código de acceso único.
- Fecha de alta en el sistema.
- Estado de la cuenta (Activa / Inactiva).

## 4. Perfil de Cliente

**Objetivo:** Visualizar y administrar el expediente completo de un cliente individual.

**Información mostrada:**

- Datos personales completos.
- Membresía actual (Plan, fechas de inicio y vencimiento).
- Estado del pago.
- Historial de asistencias y visitas previas.

**Acciones:**

- Editar información personal.
- Renovar membresía (registrar un nuevo periodo de pago).
- **Cambiar plan de membresía:** Permite actualizar el paquete del usuario (ej. cambiar de un "Plan Mensual Mañana" a un "Plan Plata 2 meses") reajustando sus reglas de acceso.
- Cambiar estado del cliente (suspender/dar de baja).
- **Eliminar cliente:** Borrado del registro del cliente en el sistema (idealmente borrado lógico para mantener la integridad del historial).

## 5. Planes de Membresía

**Objetivo:** Configurar los paquetes que el gimnasio ofrece.

**Funcionalidades:**

- Listar, crear, editar y eliminar planes.

**Datos del Plan (Adaptado a las reglas del gimnasio):**

- Nombre del plan.
- Duración (Ej. 1 día, Mensual, 2 Meses).
- Turno de acceso (Mañana, Tarde, Noche, Libre).
- Capacidad (1 persona, Familiar 3+ personas).
- Precio referencial.

## 6. Historial de Asistencia

**Objetivo:** Consultar el registro detallado de todas las entradas.

**Funcionalidades:**

- Consultar el historial completo paginado.
- Buscar ingresos por cliente específico.
- Filtrar por rangos de fechas (Día, Semana, Mes).
