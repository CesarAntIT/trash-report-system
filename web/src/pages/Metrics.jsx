import { useEffect, useState, useCallback } from "react";

const API = "http://localhost:3000/api";

const STATUS_COLORS = {
  Recibido:  { bg: "bg-blue-100",   text: "text-blue-700",   bar: "#3B82F6" },
  Pendiente: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "#F59E0B" },
  Completado:{ bg: "bg-green-100",  text: "text-green-700",  bar: "#10B981" },
  Cancelado: { bg: "bg-red-100",    text: "text-red-700",    bar: "#EF4444" },
};

export default function Metrics() {
  const [resumen,       setResumen]       = useState(null);
  const [distribucion,  setDistribucion]  = useState([]);
  const [topDirs,       setTopDirs]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [lastRefresh,   setLastRefresh]   = useState(null);

  const token = localStorage.getItem("token") || "";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/reports/metricas/resumen`,       { headers }),
        fetch(`${API}/reports/metricas/distribucion`,  { headers }),
        fetch(`${API}/reports/metricas/top-direcciones`, { headers }),
      ]);

      if (r1.status === 403) { setError('Acceso denegado. Solo administradores.'); setLoading(false); return; }

      const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);

      if (d1.success) setResumen(d1);
      if (d2.success) setDistribucion(d2.distribucion || []);
      if (d3.success) setTopDirs(d3.top_direcciones || []);
      setLastRefresh(new Date().toLocaleTimeString('es-MX'));
    } catch (e) {
      setError("Error al cargar métricas: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const maxBar = Math.max(...distribucion.map(d => d.cantidad), 1);

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm fixed">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗑️</span>
            <span className="text-lg font-bold text-gray-800">TrashReport</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Panel Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">🏠 Dashboard</a>
          <a href="/metrics"   className="block px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold">📊 Métricas</a>
        </nav>
      </aside>

      <main className="ml-60 flex-1 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Métricas de Reportes</h1>
            {lastRefresh && <p className="text-xs text-gray-400 mt-1">Última actualización: {lastRefresh}</p>}
          </div>
          {/* BUG-19: Botón Refrescar */}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm disabled:opacity-50"
          >
            {loading ? "⏳ Cargando..." : "🔄 Refrescar"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {loading && !resumen ? (
          <div className="flex justify-center py-20 text-gray-400">Cargando métricas...</div>
        ) : resumen ? (
          <>
            {/* Tarjetas de resumen numérico */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <SummaryCard label="Total del Mes" value={resumen.resumen.total} color="bg-gray-800" textColor="text-white" />
              <SummaryCard label="Pendientes"    value={resumen.resumen.Pendiente}  color="bg-yellow-400" textColor="text-white" />
              <SummaryCard label="Recibidos"     value={resumen.resumen.Recibido}   color="bg-blue-500"   textColor="text-white" />
              <SummaryCard label="Completados"   value={resumen.resumen.Completado} color="bg-green-500"  textColor="text-white" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Gráfico de barras */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-bold text-gray-800 mb-4">Distribución por Estado</h2>
                <div className="space-y-4">
                  {distribucion.length === 0 && (
                    <p className="text-gray-400 text-sm">Sin datos este mes</p>
                  )}
                  {distribucion.map((d) => {
                    const colors = STATUS_COLORS[d.estado] || { bar: "#6B7280" };
                    const pct = Math.round((d.cantidad / maxBar) * 100);
                    return (
                      <div key={d.estado}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{d.estado}</span>
                          <span className="text-gray-500">{d.cantidad} ({d.porcentaje}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: colors.bar }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top de direcciones */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-bold text-gray-800 mb-4">Top Direcciones con más Reportes</h2>
                {topDirs.length === 0 && <p className="text-gray-400 text-sm">Sin datos</p>}
                <ol className="space-y-3">
                  {topDirs.map((d, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{d.direccion}</p>
                        <p className="text-xs text-gray-400">{d.total_reportes} reporte{d.total_reportes !== 1 ? 's' : ''}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, color, textColor }) {
  return (
    <div className={`${color} ${textColor} rounded-xl p-5 shadow-sm`}>
      <p className="text-3xl font-black">{value ?? 0}</p>
      <p className="text-sm font-medium opacity-90 mt-1">{label}</p>
    </div>
  );
}
