import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fakeReport = {
      id,
      userId: "123",
      date: "2026-04-17",
      address: "Santo Domingo",
      lat: 18.4861,
      lng: -69.9312,
      images: [
        "https://picsum.photos/300",
        "https://picsum.photos/301",
        "https://picsum.photos/302"
      ]
    };

    setReport(fakeReport);
  }, [id]);

  if (!report) return <p className="p-6">Cargando...</p>;

  return (
    <div className="bg-gray-100 min-h-screen flex">

      {/* ── SIDEBAR (igual al dashboard) ── */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm fixed">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗑️</span>
            <span className="text-lg font-bold text-gray-800">TrashReport</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Detalle del reporte</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
            🏠 Dashboard
          </a>
        </nav>
      </aside>

      {/* ── CONTENIDO ── */}
      <main className="ml-60 flex-1 p-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Detalle del Reporte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Información completa del reporte seleccionado
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {/* Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <p><span className="font-semibold text-gray-700">ID:</span> {report.id}</p>
            <p><span className="font-semibold text-gray-700">Usuario:</span> {report.userId}</p>
            <p><span className="font-semibold text-gray-700">Fecha:</span> {report.date}</p>
            <p><span className="font-semibold text-gray-700">Dirección:</span> {report.address}</p>
          </div>

          {/* Mapa */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Ubicación</h3>
            <div className="h-72 rounded-xl overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${report.lat},${report.lng}&z=15&output=embed`}
              ></iframe>
            </div>
          </div>

          {/* Evidencias */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Evidencias</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {report.images.map((img, i) => (
                <div key={i} className="w-full h-32 overflow-hidden rounded-lg">
                  <img
                    src={img}
                    alt="evidencia"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

export default ReportDetail;