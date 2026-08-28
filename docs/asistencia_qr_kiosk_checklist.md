# Asistencia QR y Modo Kiosco (Totem) — Checklist de Tareas

## Fase 1: Preparación y definición técnica

- [ ] Definir flujo del Modo Kiosco (Autoservicio) y soporte híbrido (Cámara + Escáner USB/Bluetooth).
- [ ] Instalar dependencia para generación de códigos QR en React (`qrcode.react`).
- [ ] Instalar dependencia para escaneo por cámara web/móvil (`html5-qrcode`).
- [ ] Diseñar sistema de sonido ligero con Web Audio API (BEEP de aprobación y BUZZER de denegación sin archivos externos pesados).
- [ ] Definir ruta pública/protegida para el modo Kiosco (`/kiosk` o `/totem`).

---

## Fase 2: Generación y Entrega de Carnet QR al Cliente

- [ ] Crear componente de carnet digital reutilizable (`ModalCarnetQR.jsx`).
- [ ] Renderizar código QR codificando el `codigo_unico` del cliente.
- [ ] Añadir botón "Carnet / Código QR" en el perfil del cliente ([`ClientePerfil.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/ClientePerfil.jsx)).
- [ ] Añadir opción de descarga del carnet en formato imagen/PNG para enviar por WhatsApp.
- [ ] Añadir opción de impresión directa del carnet / tarjeta física.
- [ ] Mostrar acceso rápido al carnet QR al completar el registro en [`NuevoCliente.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/NuevoCliente.jsx).

---

## Fase 3: Pantalla Modo Kiosco / Totem de Autoservicio (`/kiosk`)

- [ ] Crear página [`src/pages/Kiosk.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/Kiosk.jsx) optimizada para pantalla completa (Fullscreen) y alto contraste.
- [ ] Integrar lector de cámara continuo con `html5-qrcode` (con switch para cámara frontal o trasera).
- [ ] Implementar `navigator.wakeLock` para evitar que la pantalla del celular/tablet empotrado se apague por inactividad.
- [ ] Integrar reproducción de feedback auditivo (sonido de éxito vs sonido de alerta de error).
- [ ] Conectar escaneo con `processAccess(codigo)` de Supabase.
- [ ] Diseñar vista de respuesta a pantalla completa:
  - 🟢 **Acceso Permitido:** Saludo personalizado, nombre, plan, turno y fecha de vigencia en verde brillante.
  - 🔴 **Acceso Denegado:** Alerta visual con motivo (Membresía Vencida, Fuera de Turno o Suspendido) en rojo llamativo.
- [ ] Implementar temporizador de auto-reinicio (3 a 4 segundos) que regrese automáticamente al visor de cámara para el siguiente cliente.
- [ ] Registrar la ruta `/kiosk` en el router ([`App.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/App.jsx)) con acceso directo para dispositivos de entrada.

---

## Fase 4: Soporte QR en Pantalla de Recepción Tradicional (`Recepcion.jsx`)

- [ ] Mantener compatibilidad 100% con escáneres físicos USB / Bluetooth en el input de [`Recepcion.jsx`](file:///c:/Users/ferna/Desktop/Mis-practicas/gymC3/src/pages/Recepcion.jsx).
- [ ] Añadir botón opcional "📷 Activar Cámara" en la recepción para leer QR desde la webcam de la PC o tablet cuando no haya escáner físico.

---

## Fase 5: Optimización y Resiliencia en Dispositivos

- [ ] Implementar fallbacks defensivos para navegadores móviles sin soporte de WakeLock o permisos de cámara.
- [ ] Optimizar interfaz para orientación vertical (celulares) y horizontal (tablets/pantallas de escritorio).
- [ ] Prevenir congelamiento de UI o sobrecalentamiento por procesamiento continuo de frames de video.

---

## Fase 6: Pruebas y Validación

- [ ] Probar generación y descarga de QR desde el perfil del cliente.
- [ ] Probar lectura del QR desde la pantalla de un celular iluminado.
- [ ] Probar lectura del QR desde un carnet impreso en papel.
- [ ] Probar validación completa: cliente activo (verde), vencido (rojo), fuera de turno (ámbar/rojo) y suspendido.
- [ ] Probar flujo continuo de múltiples clientes consecutivos en el Modo Kiosco.
- [ ] Verificar que las asistencias queden registradas correctamente en la tabla `asistencias` de Supabase.
