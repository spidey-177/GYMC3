import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  CheckCircle2, XCircle, AlertTriangle, ShieldOff,
  Maximize2, Minimize2, SwitchCamera, RefreshCw, Volume2, Sparkles, Home
} from "lucide-react";
import { Link } from "react-router-dom";
import { processAccess } from "../services/asistencias";
import { playSuccessSound, playErrorSound } from "../utils/audio";

const CONFIG_MOTIVOS = {
  denegado_vencido: {
    titulo: "Acceso Denegado — Membresía Vencida",
    subtitulo: "Tu plan de membresía ha expirado.",
    instruccion: "Por favor dirígete a recepción para renovar tu suscripción.",
    icono: XCircle,
    colorBg: "bg-red-600",
    colorCard: "border-red-500 bg-red-950/80 text-white",
  },
  denegado_turno: {
    titulo: "Acceso Denegado — Fuera de Turno",
    subtitulo: "Tu plan no permite el ingreso a esta hora.",
    instruccion: "Verifica los horarios de tu plan contratado en recepción.",
    icono: AlertTriangle,
    colorBg: "bg-amber-600",
    colorCard: "border-amber-500 bg-amber-950/80 text-white",
  },
  denegado_suspendido: {
    titulo: "Acceso Denegado — Cuenta Suspendida",
    subtitulo: "Tu cuenta se encuentra inactiva o suspendida.",
    instruccion: "Por favor acércate a la barra de recepción para más detalles.",
    icono: ShieldOff,
    colorBg: "bg-slate-800",
    colorCard: "border-slate-600 bg-slate-900 text-white",
  },
  ya_registrado: {
    titulo: "Entrada Ya Registrada",
    subtitulo: "Ya registraste tu ingreso hace un momento.",
    instruccion: "Si tienes inconvenientes, consulta al personal de recepción.",
    icono: AlertTriangle,
    colorBg: "bg-amber-600",
    colorCard: "border-amber-500 bg-amber-950/80 text-white",
  },
  no_encontrado: {
    titulo: "Código No Encontrado",
    subtitulo: "El código QR escaneado no pertenece a ningún socio registrado.",
    instruccion: "Verifica tu carnet digital e inténtalo de nuevo.",
    icono: XCircle,
    colorBg: "bg-red-700",
    colorCard: "border-red-500 bg-red-950/80 text-white",
  },
};

export default function Kiosk() {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment"); // "user" or "environment"
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scannerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const timerRef = useRef(null);

  // Solicitar Wake Lock para que la pantalla del dispositivo nunca se apague
  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch (err) {
        console.warn("Wake Lock no disponible o denegado:", err);
      }
    }
    requestWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Función encargada de validar el código escaneado
  const handleCodeScanned = useCallback(async (code) => {
    if (processing) return;
    setProcessing(true);

    try {
      // Detener temporalmente el lector de cámara
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.pause(true);
      }

      const res = await processAccess(code.trim());

      if (res?.acceso_concedido) {
        playSuccessSound();
        setResultado({ tipo: "permitido", datos: res });
      } else if (res) {
        playErrorSound();
        setResultado({ tipo: "denegado", motivo: res.motivo, datos: res });
      } else {
        playErrorSound();
        setResultado({ tipo: "denegado", motivo: "no_encontrado", datos: null });
      }

      // Reiniciar escáner después de 3.5 segundos
      timerRef.current = setTimeout(() => {
        setResultado(null);
        setProcessing(false);
        if (scannerRef.current) {
          try {
            scannerRef.current.resume();
          } catch (e) {
            console.warn("Error al reanudar cámara:", e);
          }
        }
      }, 3500);
    } catch (err) {
      console.error("Error al procesar acceso:", err);
      playErrorSound();
      setResultado({ tipo: "denegado", motivo: "no_encontrado", datos: null });
      timerRef.current = setTimeout(() => {
        setResultado(null);
        setProcessing(false);
        if (scannerRef.current) {
          try { scannerRef.current.resume(); } catch (e) {}
        }
      }, 3000);
    }
  }, [processing]);

  // Inicializar o reiniciar la cámara de html5-qrcode
  useEffect(() => {
    let html5QrcodeScanner = null;

    async function startScanner() {
      try {
        const qrCodeId = "reader";
        html5QrcodeScanner = new Html5Qrcode(qrCodeId);
        scannerRef.current = html5QrcodeScanner;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await html5QrcodeScanner.start(
          { facingMode: cameraFacingMode },
          config,
          (decodedText) => {
            handleCodeScanned(decodedText);
          },
          () => {} // Ignorar errores de frame parcial
        );

        setScanning(true);
      } catch (err) {
        console.error("Error iniciando cámara Kiosco:", err);
        setScanning(false);
      }
    }

    startScanner();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        }
      }
    };
  }, [cameraFacingMode, handleCodeScanned]);

  // Alternar entre cámara frontal y trasera
  const toggleCamera = () => {
    setCameraFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Alternar modo pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const cliente = resultado?.datos?.datos_cliente;
  const membresia = resultado?.datos?.membresia;
  const nombreCompleto = cliente ? `${cliente.nombre} ${cliente.apellidos}` : "";
  const planNombre = membresia?.plan?.nombre || "Membresía Activa";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Barra Superior con Controles */}
      <header className="p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#1a6b32] p-2 rounded-xl text-[#39FF14] shadow-md shadow-green-950">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-wider text-[#39FF14]">GYMC3</h1>
            <p className="text-xs text-slate-400 font-medium">Modo Autoservicio Kiosco</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-200 transition-all border border-slate-700 flex items-center gap-1.5 text-xs font-semibold"
            title="Cambiar Cámara"
          >
            <SwitchCamera size={18} />
            <span className="hidden sm:inline">Cámara</span>
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-slate-200 transition-all border border-slate-700"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <Link
            to="/recepcion"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all border border-slate-700"
            title="Volver a Recepción"
          >
            <Home size={18} />
          </Link>
        </div>
      </header>

      {/* Contenido Principal: Visor de Cámara o Pantalla de Resultado */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
        {/* PANTALLA RESULTADO: PERMITIDO (VERDE GIGANTE) */}
        {resultado?.tipo === "permitido" && (
          <div className="fixed inset-0 bg-green-600 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-white/20 p-6 rounded-full mb-6 text-white shadow-2xl animate-bounce">
              <CheckCircle2 size={120} />
            </div>

            <div className="max-w-xl space-y-4">
              <span className="bg-green-950/40 text-green-200 text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-green-400/30">
                ¡Acceso Permitido!
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {nombreCompleto}
              </h2>

              <div className="bg-green-950/50 backdrop-blur-md p-6 rounded-3xl border border-green-400/30 space-y-2 text-green-100 shadow-xl">
                <p className="text-xl font-bold text-white">{planNombre}</p>
                {membresia?.fecha_fin && (
                  <p className="text-sm text-green-200">
                    Vigente hasta: <strong>{membresia.fecha_fin}</strong>
                  </p>
                )}
                {membresia?.estado_financiero === "pendiente" && (
                  <div className="mt-2 bg-amber-500/20 border border-amber-300/40 text-amber-200 text-xs px-3 py-1.5 rounded-xl font-semibold">
                    ⚠️ Pago pendiente — Pasar a caja
                  </div>
                )}
              </div>
            </div>

            {/* Contador de regreso */}
            <div className="absolute bottom-8 flex items-center gap-2 text-xs font-semibold text-green-200 bg-green-950/40 px-4 py-2 rounded-full border border-green-400/20">
              <RefreshCw size={14} className="animate-spin" />
              <span>Volviendo al escáner...</span>
            </div>
          </div>
        )}

        {/* PANTALLA RESULTADO: DENEGADO (ROJO GIGANTE) */}
        {resultado?.tipo === "denegado" && (() => {
          const config = CONFIG_MOTIVOS[resultado.motivo] || CONFIG_MOTIVOS.no_encontrado;
          const Icono = config.icono;
          return (
            <div className={`fixed inset-0 ${config.colorBg} z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300`}>
              <div className="bg-white/20 p-6 rounded-full mb-6 text-white shadow-2xl animate-pulse">
                <Icono size={120} />
              </div>

              <div className="max-w-xl space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                  {config.titulo}
                </h2>
                {nombreCompleto && (
                  <p className="text-2xl font-bold text-white/90">{nombreCompleto}</p>
                )}

                <div className="bg-black/30 backdrop-blur-md p-6 rounded-3xl border border-white/20 space-y-2 text-white/90 shadow-xl">
                  <p className="text-lg font-semibold">{config.subtitulo}</p>
                  <p className="text-sm opacity-80">{config.instruccion}</p>
                </div>
              </div>

              {/* Contador de regreso */}
              <div className="absolute bottom-8 flex items-center gap-2 text-xs font-semibold text-white/80 bg-black/40 px-4 py-2 rounded-full border border-white/20">
                <RefreshCw size={14} className="animate-spin" />
                <span>Volviendo al escáner...</span>
              </div>
            </div>
          );
        })()}

        {/* VISOR DE CÁMARA NORMAL */}
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Acerque su Código QR</h2>
            <p className="text-xs text-slate-400">
              Posicione el carnet digital frente a la cámara para ingresar.
            </p>
          </div>

          {/* Recuadro de Video Html5Qrcode */}
          <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-2xl border-4 border-[#39FF14]/40 bg-black flex items-center justify-center shadow-inner">
            <div id="reader" className="w-full h-full object-cover"></div>

            {processing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[#39FF14] font-semibold gap-2 backdrop-blur-sm z-30">
                <RefreshCw size={36} className="animate-spin" />
                <span className="text-sm">Verificando acceso...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-700/50">
            <Volume2 size={16} className="text-[#39FF14]" />
            <span>Verificación con señal auditiva activa</span>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-900 bg-slate-950">
        GYMC3 &copy; {new Date().getFullYear()} — Control de Asistencia Automático
      </footer>
    </div>
  );
}
