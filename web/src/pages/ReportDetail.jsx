import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {

    // aqui ira el fetch cuando exista GET /reports/:id
    // ejemplo futuro:
    /*
    const fetchReport = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:3000/api/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setReport(data);
    };

    fetchReport();
    */
   
  }, [id]);

  if (!report) return <p className="p-6">Cargando...</p>;

  return (
    <div className="bg-gray-100 min-h-screen flex">

      {/* sidebar */}
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

      {/* contenido */}
      <main className="ml-60 flex-1 p-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Detalle del Reporte</h1>
          <p className="text-sm text-gray-500 mt-1">
            Información completa del reporte seleccionado
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p>No hay datos disponibles todavía.</p>
        </div>

      </main>
    </div>
  );
}

export default ReportDetail;