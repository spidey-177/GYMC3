# Gym Dashboard — Checklist de Tareas

## Fase 1: Preparación y definición (pre-UI)

- [x] Revisar objetivos y flujos principales del proyecto.
- [x] Documentar los casos de uso clave (recepción, registro, membresías, asistencia, pagos).
- [x] Definir entidades centrales: Clientes, Planes, Membresías, Asistencia, Pagos.
- [x] Especificar reglas de membresía (turnos, duraciones, planes familiares/grupales).
- [x] Preparar el esquema de datos preliminar.
- [x] Definir el contrato frontend/backend.
- [x] Configurar el entorno inicial de Supabase.

## Fase 1.5: Configuración Técnica Base (Setup Frontend)

- [x] Inicializar el proyecto con Vite y React.
- [x] Instalar Tailwind CSS usando el plugin de Vite (`@tailwindcss/vite`).
- [x] Añadir la directiva de Tailwind al archivo CSS global (`@import "tailwindcss";` en `index.css`).
- [x] Limpiar el código boilerplate generado por Vite (eliminar logos, limpiar `App.jsx` y `App.css`).
- [ ] Instalar dependencias base adicionales (ej. `react-router-dom` para rutas, `lucide-react` para iconos).

## Fase 2: Diseño de UI y validación con Gemini CLI

- [ ] Generar prototipos con Gemini CLI y skill de diseño.
- [ ] Crear la pantalla de búsqueda/consulta de cliente.
- [ ] Crear la ficha de cliente con estado de membresía.
- [ ] Crear el formulario de registro de asistencia.
- [ ] Crear el formulario de alta de cliente.
- [ ] Crear selección/asignación de plan.
- [ ] Crear registro de pago e historial.
- [ ] Validar la experiencia de recepción antes de codificar lógica.
- [ ] Ajustar la UI según feedback.
- [ ] Confirmar que la UI cubre todos los flujos clave.

## Fase 3: Diseño de backend y datos (antes de implementar lógica)

- [ ] Definir tablas y campos en Supabase.
- [ ] Establecer relaciones entre clientes, membresías, planes, asistencia y pagos.
- [ ] Añadir validaciones de integridad de datos.
- [ ] Definir los endpoints y consultas necesarios.
- [ ] Verificar que el modelo soporte los tipos de membresía identificados.

## Fase 4: Implementación frontend basado en UI validada

- [ ] Crear la estructura de páginas y rutas en React.
- [ ] Implementar componentes visuales con Tailwind.
- [ ] Implementar la vista de cliente y fichas de membresía.
- [ ] Implementar la vista de registro de asistencia.
- [ ] Implementar la vista de pagos y renovaciones.
- [ ] Integrar navegación y estados visuales.
- [ ] Verificar que la UI refleje la experiencia validada.

## Fase 5: Lógica de negocio y conexión con backend (post-UI)

- [ ] Implementar validación de acceso según turno.
- [ ] Implementar estado activo/inactivo de membresías.
- [ ] Implementar validación de vigencia y fechas.
- [ ] Conectar el frontend con Supabase y la API.
- [ ] Implementar registro real de asistencia.
- [ ] Implementar registro y seguimiento de pagos.
- [ ] Implementar gestión de renovación y cambio de plan.
- [ ] Implementar reglas para planes familiares/grupales.

## Fase 6: Pruebas y ajuste final

- [ ] Probar el flujo de acceso rápido en recepción.
- [ ] Probar el registro de cliente y asignación de plan.
- [ ] Probar pagos y renovaciones.
- [ ] Revisar la consistencia de datos en Supabase.
- [ ] Ajustar UI/UX según resultados.
- [ ] Preparar el despliegue MVP.

## Módulos principales

- [ ] Recepción / Acceso rápido
- [ ] Gestión de clientes
- [ ] Gestión de membresías y planes
- [ ] Registro de asistencia
- [ ] Historial de pagos
- [ ] Configuración de turnos y vigencias

## Antes de la interfaz

- [ ] Definir flujos y casos de uso.
- [ ] Crear modelo de datos y reglas.
- [ ] Preparar el contrato frontend/backend.
- [ ] Configurar Supabase.

## Después de validar la interfaz

- [ ] Implementar UI en React/Tailwind.
- [ ] Conectar con Supabase/backend.
- [ ] Añadir lógica de negocio.
- [ ] Probar flujos completos.
