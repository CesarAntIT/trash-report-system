import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ReportDetail() {
  const { id } = useParams(); // reportId
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `http://localhost:3000/api/reports/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!data.success) {
          setReport(null);
          return;
        }

        const r = data.reporte;

        // mapear backend → frontend
        setReport({
          id: r.reportId,
          userId: r.usuarioId,
          date: r.fecha,
          address: r.locationName,
          lat: r.ubicacion.latitud,
          lng: r.ubicacion.longitud,
          images: r.evidencias || [],
          status: r.status,
        });

      } catch (err) {
        console.error("Error fetching report:", err);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }

  if (!report) {
    return <p className="p-6 text-red-500">Reporte no encontrado</p>;
  }

  return (
    <div className="bg-gray-100 min-h-screen flex">

      {/* CONTENIDO */}
      <main className="ml-60 flex-1 p-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Detalle del Reporte</h1>
          <p className="text-sm text-gray-500">
            Información completa del reporte seleccionado
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-xl shadow-sm p-6">

          {/* INFO */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <p><b>ID:</b> {report.id}</p>
            <p><b>Usuario:</b> {report.userId}</p>
            <p><b>Fecha:</b> {report.date}</p>
            <p><b>Dirección:</b> {report.address}</p>
            <p><b>Status:</b> {report.status}</p>
          </div>

          {/* MAPA */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Ubicación</h3>
            <div className="h-72 rounded-xl overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${report.lat},${report.lng}&z=15&output=embed`}
              />
            </div>
          </div>

          {/* EVIDENCIAS */}
          <div>
            <h3 className="font-semibold mb-3">Evidencias</h3>

            {report.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {report.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className="h-32 w-full object-cover rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay evidencias</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
