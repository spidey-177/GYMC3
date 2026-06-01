# Gym Dashboard — Contexto del Proyecto

## Resumen del Proyecto

Gym Dashboard es un sistema de gestión administrativa basado en la web diseñado para las operaciones de un gimnasio.

El sistema se enfoca en:

- registro de clientes
- gestión de membresías
- control de asistencia/acceso
- seguimiento de pagos
- flujo de trabajo rápido en recepción

El proyecto se desarrollará inicialmente como un MVP (Producto Mínimo Viable), priorizando:

- simplicidad operacional
- flujo de interacción rápido
- usabilidad en recepción
- mantenibilidad
- uso diario estable

El sistema está destinado a un negocio de gimnasio que opera en Bolivia.

---

## Objetivos del Proyecto

El sistema debe permitir al personal del gimnasio:

- registrar clientes
- asignar planes de membresía
- gestionar membresías
- verificar el estado del cliente
- registrar la asistencia
- realizar seguimiento de los pagos
- visualizar la información de la membresía rápidamente

El principal objetivo operativo es optimizar el flujo de trabajo de recepción y el control de membresías.

---

## Flujo de Acceso Principal

```text
Cliente llega al gimnasio
↓
Cliente ingresa código personal único
↓
Sistema busca al cliente
↓
Sistema muestra:
- nombre del cliente
- tipo de membresía
- fecha de inicio de la membresía
- fecha de vencimiento de la membresía
- estado de la membresía
↓
Recepción valida la información
↓
Se registra la asistencia
```

---

# Flujo Administrativo

```text
Administrador / Recepción registra un cliente
↓
Se selecciona un plan de membresía
↓
El sistema asigna:
- tipo de membresía
- fecha de inicio
- fecha de vencimiento
↓
El cliente se vuelve activo
```

---

# Tipo de Aplicación

Dashboard web administrativo.

El alcance actual no incluye:

- aplicaciones móviles nativas
- integraciones de pago automáticas
- sistemas biométricos
- sistemas de acceso físico automatizados
- funcionalidades basadas en IA

---

# Stack Tecnológico Definido

## Frontend

- React
- Tailwind CSS

## Backend / Base de Datos / Autenticación

- Supabase
- PostgreSQL

## Hosting

- Vercel

---

# Alcance del Sistema

## Recepción (Acceso Rápido)

El sistema debe soportar un flujo de validación simplificado y veloz:

- ingreso de código único por parte del cliente al llegar
- confirmación instantánea en pantalla de si el código es correcto
- visualización de datos personales del cliente
- visualización de detalles de la membresía (tipo de plan, fechas de inicio y vencimiento, estado del pago)

## Gestión de Clientes

El sistema debe soportar:

- creación de clientes
- gestión de la información del cliente
- asignación de código de cliente único
- asociación de membresía

---

## Gestión de Membresías

El sistema debe soportar:

- múltiples planes de membresía
- validación de membresía
- visualización del estado de la membresía
- fechas de inicio y vencimiento

---

## Sistema de Asistencia

El sistema debe soportar:

- registro de asistencia
- acceso a través de código de cliente único
- verificación rápida de membresía
- flujo de trabajo orientado a la recepción

---

## Gestión de Pagos

El sistema debe soportar:

- registro de pagos
- seguimiento de pagos de membresía
- flujo de trabajo de renovación de membresía
- almacenamiento del historial de pagos

---

# Tipos de Membresía Identificados

PLas siguientes categorías de membresía se identificaron basándose en la lista oficial de precios:

- General Asistencia todo el mes (Turno Mañana: 6am-1pm) - 1 Persona - Precio: 100 bs
- General Asistencia todo el mes (Turno Tarde: 2pm-6pm) - 1 Persona - Precio: 100 bs
- General Asistencia todo el mes (Turno Noche: 7pm-12pm) - 1 Persona - Precio: 120 bs
- Familiar Asistencia todo el mes (Turno libre) - 3 Personas o más - Precio: 90 bs
- Sesión por Día (Turno libre) - 1 Persona - Precio: 10 bs
- Plata 2 Meses (Turno libre) - 1 Persona - Precio: 190 bs

---

# Observaciones Funcionales

## Lógica de Membresía

Las membresías no son homogéneas y se basan en una combinación de duraciones, horarios y capacidad de personas.

El sistema debe soportar:

- **Membresías con restricción de turno:** El sistema debe validar el acceso de acuerdo al turno contratado (mañana, tarde o noche), teniendo en cuenta que el precio puede variar (ej. el turno noche tiene un precio diferente).
- **Acceso Multiturno (Turno Libre):** Membresías que permiten el acceso en la mañana, tarde o noche sin restricción de turno fijo (como la Familiar, Plata o la Sesión por día).
- **Duraciones variables:** Planes de 1 día (Sesión), mensuales (General, Familiar) y extendidos (Plata 2 meses).
- **Membresías grupales / familiares:** Soporte para planes que requieren la asociación de múltiples perfiles de clientes bajo una misma cuenta, validando un mínimo de participantes (ej. 3 personas o más).

Por lo tanto, el manejo de las membresías debe ser dinámico, permitiendo configurar restricciones de horario, vigencias y reglas de agrupación de personas.

---

# Entidades Centrales Identificadas

## Clientes

Almacena la información del cliente.

## Planes

Almacena las definiciones de los planes de membresía.

## Membresías

Almacena las relaciones entre clientes y planes.

## Asistencia

Almacena los registros de entrada al gimnasio.

## Pagos

Almacena los registros de pago de membresías.

---

# Consideraciones Operativas

## Dependencia de Internet

El sistema operará inicialmente como una aplicación web en línea.

Los mecanismos de sincronización y caché sin conexión no forman parte del alcance inicial.

---

## Flujo de Trabajo de Recepción

El flujo de trabajo de recepción debe permanecer:

- rápido
- simple
- de baja fricción
- optimizado para el uso diario repetitivo

---

# Etapa Actual de Desarrollo

El proyecto se encuentra actualmente en:

- análisis de requerimientos
- definición de flujo de trabajo
- descubrimiento de procesos de negocio
- planificación de la estructura del proyecto

Las siguientes etapas aún no han comenzado:

- implementación del esquema de la base de datos
- implementación del backend
- implementación del frontend
- definición de la API
- diseño de la interfaz de usuario (wireframing)
- despliegue

---

# Definición del MVP

El MVP inicial debe incluir:

- autenticación de administrador
- registro de clientes
- asignación de membresía
- registro de asistencia
- búsqueda de clientes por código único
- validación de membresía
- registro de pagos
- panel de control administrativo

---

# Principios de Desarrollo

El proyecto priorizará:

- arquitectura clara
- código mantenible
- estructura modular
- diseño de base de datos escalable
- usabilidad operacional
- desarrollo incremental

Las características complejas fuera del alcance del MVP se evaluarán en iteraciones posteriores.
