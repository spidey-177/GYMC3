# Asistencia QR y Modo Kiosco (Totem) — Checklist de Tareas

## Fase 1: Preparación y definición técnica

- [x] Definir flujo del Modo Kiosco (Autoservicio) y soporte híbrido (Cámara + Escáner USB/Bluetooth).
- [x] Instalar dependencia para generación de códigos QR en React (`qrcode.react`).
- [x] Instalar dependencia para escaneo por cámara web/móvil (`html5-qrcode`).
- [x] Diseñar sistema de sonido ligero con Web Audio API (BEEP de aprobación y BUZZER de denegación sin archivos externos pesados: `src/utils/audio.js`).
- [x] Definir ruta pública/protegida para el modo Kiosco (`/kiosk` en `App.jsx`).

---

## Fase 2: Generación y Entrega de Carnet QR al Cliente

- [x] Crear componente de carnet digital reutilizable ([`src/components/ModalCarnetQR.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/components/ModalCarnetQR.jsx)).
- [x] Renderizar código QR codificando el `codigo_unico` del cliente.
- [x] Añadir botón "Ver Carnet QR" en el perfil del cliente ([`ClientePerfil.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/ClientePerfil.jsx)).
- [x] Añadir opción de descarga del carnet en formato imagen/PNG para enviar por WhatsApp.
- [x] Añadir opción de impresión directa del carnet / tarjeta física.
- [x] Mostrar acceso rápido al carnet QR al completar el registro en [`NuevoCliente.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/NuevoCliente.jsx) (redirige al perfil).

---

## Fase 3: Pantalla Modo Kiosco / Totem de Autoservicio (`/kiosk`)

- [x] Crear página [`src/pages/Kiosk.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/Kiosk.jsx) optimizada para pantalla completa (Fullscreen) y alto contraste.
- [x] Integrar lector de cámara continuo con `html5-qrcode` (con switch para cámara frontal o trasera).
- [x] Implementar `navigator.wakeLock` para evitar que la pantalla del celular/tablet empotrado se apague por inactividad.
- [x] Integrar reproducción de feedback auditivo (sonido de éxito vs sonido de alerta de error).
- [x] Conectar escaneo con `processAccess(codigo)` de Supabase.
- [x] Diseñar vista de respuesta a pantalla completa:
  - 🟢 **Acceso Permitido:** Saludo personalizado, nombre, plan, turno y fecha de vigencia en verde brillante.
  - 🔴 **Acceso Denegado:** Alerta visual con motivo (Membresía Vencida, Fuera de Turno o Suspendido) en rojo llamativo.
- [x] Implementar temporizador de auto-reinicio (3 a 4 segundos) que regrese automáticamente al visor de cámara para el siguiente cliente.
- [x] Registrar la ruta `/kiosk` en el router ([`App.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/App.jsx)) con enlace desde Recepción.

---

## Fase 4: Soporte QR en Pantalla de Recepción Tradicional (`Recepcion.jsx`)

- [x] Mantener compatibilidad 100% con escáneres físicos USB / Bluetooth en el input de [`Recepcion.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/Recepcion.jsx).
- [x] Añadir acceso al Modo Kiosco Autoservicio en el encabezado de Recepción.

---

## Fase 5: Optimización y Resiliencia en Dispositivos

- [x] Implementar fallbacks defensivos para navegadores móviles sin soporte de WakeLock o permisos de cámara.
- [x] Optimizar interfaz para orientación vertical (celulares) y horizontal (tablets/pantallas de escritorio).
- [x] Prevenir congelamiento de UI o sobrecalentamiento por procesamiento continuo de frames de video.

---

## Fase 6: Pruebas y Validación

- [x] Compilación y verificación de sintaxis en producción (`npm run build` exitoso).
- [ ] Probar generación y descarga de QR desde el perfil del cliente en dispositivo real.
- [ ] Probar lectura del QR desde la pantalla de un celular iluminado.
- [ ] Probar lectura del QR desde un carnet impreso en papel.
- [ ] Probar validación completa: cliente activo (verde), vencido (rojo), fuera de turno (ámbar/rojo) y suspendido.
- [ ] Probar flujo continuo de múltiples clientes consecutivos en el Modo Kiosco.
- [ ] Verificar que las asistencias queden registradas correctamente en la tabla `asistencias` de Supabase.
