import { useEffect, useState } from "react";

const API = "http://localhost:3000";

export default function Dashboard() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isAdmin = role === "admin";

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  useEffect(() => {
    const endpoint = isAdmin
      ? `${API}/api/reports`
      : `${API}/api/reports/mine`;

    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const lista = data.reportes || [];
          // Filtrar cancelados en vista admin, ordenar por fecha desc
          // Admin: backend ya filtra cancelados. Usuario: muestra historial completo.
          const filtered = lista;
          filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          setReportes(filtered);
        } else {
          setError("No se pudieron cargar los reportes.");
        }
      })
      .catch(() => setError("Error de conexión con el servidor."))
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  const handleRecibir = async (id) => {
    const res = await fetch(`${API}/api/reports/${id}/receive`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setReportes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: "Recibido" } : r))
      );
      showSuccess("✅ Reporte marcado como Recibido");
    }
  };

  const confirmarCancelacion = (id) => setConfirmId(id);

  const handleCancelar = async () => {
    const id = confirmId;
    setConfirmId(null);
    const res = await fetch(`${API}/api/reports/${id}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setReportes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, estado: "Cancelado" } : r))
      );
      showSuccess("✅ Reporte cancelado correctamente");
    }
  };

  const estadoBadge = (estado) => {
    const colors = {
      Pendiente: "bg-yellow-100 text-yellow-700",
      Recibido: "bg-blue-100 text-blue-700",
      Cancelado: "bg-gray-100 text-gray-500",
    };
    return `inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colors[estado] || "bg-gray-100 text-gray-500"}`;
  };

  return (
    <div className="bg-gray-100 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm fixed">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗑️</span>
            <span className="text-lg font-bold text-gray-800">TrashReport</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {isAdmin ? "Panel Admin" : "Mi Panel"}
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold">🏠 Dashboard</a>
          <a href="/crear-reporte" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">📝 Crear Reporte</a>
          {isAdmin && <a href="/metrics" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">📊 Métricas</a>}
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        {/* Mensaje de éxito */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm text-sm font-medium">
            {success}
          </div>
        )}

        {/* Modal confirmación cancelar */}
        {confirmId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-80">
              <h2 className="font-bold text-gray-800 text-lg mb-2">¿Cancelar reporte?</h2>
              <p className="text-gray-500 text-sm mb-5">Esta acción cambiará el estado del reporte a "Cancelado".</p>
              <div className="flex gap-3">
                <button onClick={handleCancelar} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition">
                  Sí, cancelar
                </button>
                <button onClick={() => setConfirmId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold transition">
                  Volver atrás
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAdmin ? "Todos los Reportes" : "Historial de Mis Reportes"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isAdmin ? "Lista de reportes activos del sistema" : "Solo tus reportes generados"}
            </p>
          </div>
          {!isAdmin && (
            <a href="/crear-reporte" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
              + Nuevo Reporte
            </a>
          )}
        </div>

        {loading && <p className="text-gray-400">Cargando reportes...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && reportes.length === 0 && (
          <p className="text-gray-400 italic">No hay reportes para mostrar.</p>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {reportes.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-mono text-gray-400">ID: {r.id}</p>
                  <p className="text-gray-800 font-semibold">{r.direccion}</p>
                  <div className="flex items-center gap-3">
                    <span className={estadoBadge(r.estado)}>{r.estado}</span>
                    <span className="text-xs text-gray-400">{r.fecha}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleRecibir(r.id)}
                      disabled={r.estado !== "Pendiente"}
                      className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg font-medium transition"
                    >
                      Recibir
                    </button>
                  )}
                  {!isAdmin && (
                    <button
                      onClick={() => confirmarCancelacion(r.id)}
                      disabled={r.estado !== "Pendiente"}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed text-red-700 text-sm rounded-lg font-medium transition"
                    >
                      Cancelar
                    </button>
                  )}
                  <a
                    href={`/report/${r.id}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium transition"
                  >
                    Información
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
