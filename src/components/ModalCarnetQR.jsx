import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, QrCode } from "lucide-react";
import { Modal } from "./Modal";

export function ModalCarnetQR({ cliente, membresia, onClose }) {
  const qrContainerRef = useRef(null);

  if (!cliente) return null;

  const nombreCompleto = `${cliente.nombre} ${cliente.apellidos}`;
  const codigo = cliente.codigo_unico || "SIN-CODIGO";
  const planNombre = membresia?.plan?.nombre || "Sin Plan";
  const fechaFin = membresia?.fecha_fin || "—";

  // Función para descargar el QR como archivo SVG / PNG
  const handleDownload = () => {
    // Seleccionar específicamente el SVG dentro del contenedor del código QR
    const svgElement = qrContainerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 400, 400);
      context.drawImage(image, 20, 20, 360, 360);

      const png = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = png;
      downloadLink.download = `Carnet-QR-${cliente.nombre.replace(/\s+/g, "_")}-${codigo}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal title="Carnet Digital de Acceso" onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-6 text-center">
        {/* Tarjeta Visual del Carnet */}
        <div
          className="bg-gradient-to-br from-[#1a6b32] to-[#0f441f] text-white p-6 rounded-2xl shadow-lg space-y-4 relative overflow-hidden"
        >
          {/* Marca de agua / Encabezado */}
          <div className="flex items-center justify-between border-b border-green-700/50 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="text-[#39FF14]" size={24} />
              <span className="font-extrabold tracking-wider text-lg text-[#39FF14]">
                GYMC3
              </span>
            </div>
            <span className="text-xs uppercase bg-green-900/60 px-2.5 py-1 rounded-full text-green-200 font-semibold border border-green-600/40">
              Socio Activo
            </span>
          </div>

          {/* Código QR Generado (Contenedor con ref dedicada) */}
          <div ref={qrContainerRef} className="bg-white p-4 rounded-xl inline-block shadow-md">
            <QRCodeSVG
              value={codigo}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Información del Cliente */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-wide">{nombreCompleto}</h3>
            <p className="text-xs text-green-200 font-mono tracking-widest bg-green-950/40 py-1 px-3 rounded-md inline-block">
              {codigo}
            </p>
          </div>

          {/* Plan y Vigencia */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-green-900/40 p-2.5 rounded-xl border border-green-700/30 text-left">
            <div>
              <p className="text-green-300">Plan actual:</p>
              <p className="font-semibold text-white truncate">{planNombre}</p>
            </div>
            <div>
              <p className="text-green-300">Válido hasta:</p>
              <p className="font-semibold text-white">{fechaFin}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-xl font-medium text-sm transition-all shadow-sm"
          >
            <Download size={16} />
            Descargar Imagen
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium text-sm transition-all"
          >
            <Printer size={16} />
            Imprimir Carnet
          </button>
        </div>
      </div>
    </Modal>
  );
}
