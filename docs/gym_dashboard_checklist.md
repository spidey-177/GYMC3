# Gym Dashboard — Checklist de Tareas

## Fase 1: Preparación y definición

- [x] Revisar objetivos y flujos principales del proyecto.
- [x] Documentar los casos de uso clave (recepción, registro, membresías, asistencia, pagos).
- [x] Definir entidades centrales: Clientes, Planes, Membresías, Asistencia, Pagos.
- [x] Especificar reglas de membresía (turnos, duraciones, planes familiares/grupales).
- [x] Preparar el esquema de datos preliminar.
- [x] Definir el contrato frontend/backend (`docs/database.md` V3).

## Fase 1.5: Configuración técnica base

- [x] Inicializar el proyecto con Vite + React.
- [x] Instalar Tailwind CSS (`@tailwindcss/vite`).
- [x] Instalar dependencias base: `react-router-dom`, `lucide-react`, `@supabase/supabase-js`.
- [x] Limpiar boilerplate de Vite.

## Fase 2: Diseño y validación de UI

- [x] Crear pantalla de Recepción / Control de Acceso.
- [x] Crear ficha de cliente (`ClientePerfil`) con estado de membresía.
- [x] Crear formulario de alta de cliente (`NuevoCliente`) con flujo multi-paso.
- [x] Crear listado de clientes (`Clientes`) con búsqueda y filtros.
- [x] Crear catálogo de planes (`Planes`) y formulario de nuevo plan (`NuevoPlan`).
- [x] Crear historial de asistencias (`Asistencia`).
- [x] Crear Dashboard con tarjetas de estadísticas.
- [x] Implementar `MainLayout` con sidebar de navegación.
- [x] Crear librería de componentes UI reutilizables (`src/ui/`, `src/components/`).
- [x] Añadir modales: Renovar Membresía, Cambiar Plan (con soporte plan familiar), Editar Perfil.
- [x] Añadir botón Suspender / Reactivar cliente.
- [x] Corregir bug: estado financiero "pendiente" en tarjeta de Recepción.

## Fase 3: Backend — Supabase

- [x] Crear proyecto en Supabase y configurar `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- [x] Ejecutar schema SQL en Supabase SQL Editor (6 tablas: `clientes`, `planes`, `membresias`, `beneficiarios_membresia`, `asistencias`, `pagos`).
- [x] Configurar RLS: habilitar en las 6 tablas y crear políticas para rol `authenticated`.
- [x] Crear usuario administrador en Supabase Auth y desactivar sign-ups públicos.
- [x] Crear cliente Supabase (`src/lib/supabase.js`).
- [x] Crear capa de servicios (`src/services/`): `clientes.js`, `planes.js`, `membresias.js`, `asistencias.js`, `pagos.js`.
- [x] Crear hook `useAuth` y componente `ProtectedRoute`.
- [x] Crear página de Login conectada a Supabase Auth.
- [x] Proteger todas las rutas con `ProtectedRoute` en `App.jsx`.
- [x] Añadir botón "Cerrar sesión" en `MainLayout`.

## Fase 4: Conexión frontend ↔ Supabase (reemplazar mocks)

- [x] **Recepción:** reemplazar `simularRespuesta()` con `processAccess()` del servicio.
- [x] **Clientes:** reemplazar `MOCK_CLIENTES` con `getClientesConPlan()`.
- [x] **NuevoCliente:** conectar submit a `createCliente()` + `createMembresia()` + `registrarPago()`.
- [x] **ClientePerfil:** conectar con `getClienteById()`, `getMembresiaByTitular()`, `getBeneficiariosByMembresia()`, `getAsistenciasByCliente()`.
- [x] **ClientePerfil — Editar Perfil:** conectar `ModalEditarPerfil` a `updateCliente()`.
- [x] **ClientePerfil — Suspender/Reactivar:** conectar a `updateEstadoCuenta()`.
- [x] **ClientePerfil — Renovar Membresía:** conectar a `renovarMembresia()` + `registrarPago()`.
- [x] **ClientePerfil — Cambiar Plan:** conectar a `cambiarPlan()`.
- [x] **Planes:** reemplazar `MOCK_PLANES` con `getPlanes()`. Botón Eliminar conectado a `deletePlan()`.
- [x] **NuevoPlan:** conectar submit a `createPlan()`.
- [x] **Asistencia:** reemplazar `MOCK_ASISTENCIAS` con `getAsistencias()` con filtros reales de fecha.
- [x] **Dashboard:** conectar tarjetas de estadísticas con `getDashboardStats()` (`src/services/dashboard.js`).

## Fase 5: Refinamiento y reglas de negocio

- [x] Validar que `NuevoCliente` verifique `capacidad_minima` antes de crear membresía familiar.
- [x] Implementar generación automática de `codigo_unico` al registrar cliente.
- [x] Validar que un cliente no tenga dos membresías activas simultáneas.
- [x] Implementar paginación real en Clientes y Asistencia (actualmente hardcodeada).
- [x] Implementar filtros reales por fecha en Asistencia.
- [x] Implementar filtro por plan en listado de Clientes.
- [x] Reemplazar `processAccess` por un RPC de Supabase para que sea atómico.

## Fase 6: Pruebas y despliegue

- [ ] Probar flujo completo de recepción con clientes reales.
- [ ] Probar registro de cliente individual y plan familiar.
- [ ] Probar renovación y cambio de plan.
- [ ] Probar suspensión y reactivación de cuenta.
- [ ] Revisar consistencia de datos en Supabase (Table Editor).
- [ ] Preparar despliegue MVP (Vercel o similar).
