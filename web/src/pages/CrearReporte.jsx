import { useState } from "react";

const API = "http://localhost:3000";

export default function CrearReporte() {
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [evidencias, setEvidencias] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const fecha = new Date().toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setEvidencias(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const canSubmit = locationName.trim() !== "" && evidencias.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("locationName", locationName);
      formData.append("lat", lat);
      formData.append("lng", lng);
      evidencias.forEach((f) => formData.append("evidencias", f));

      const res = await fetch(`${API}/api/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("✅ Reporte enviado exitosamente al servidor");
        setLocationName("");
        setLat(""); setLng("");
        setEvidencias([]); setPreviews([]);
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(data.message || "Error al enviar el reporte");
      }
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-gray-400 mt-1">Crear Reporte</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a href="/dashboard" className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">🏠 Dashboard</a>
          <a href="/crear-reporte" className="block px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold">📝 Crear Reporte</a>
        </nav>
      </aside>

      {/* Main */}
      <main className="ml-60 flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reportar Acumulación de Basura</h1>
          <p className="text-gray-500 text-sm mt-1">Completa el formulario para notificar al ayuntamiento</p>
        </div>

        {/* Notificación éxito */}
        {success && (
          <div
            id="notificacion-exito"
            onClick={() => setSuccess(null)}
            className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg shadow-sm text-sm font-medium cursor-pointer"
          >
            {success} <span className="text-green-400 ml-2">(toca para cerrar)</span>
          </div>
        )}

        {/* Notificación error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">

          {/* Nombre de Ubicación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nombre de Ubicación <span className="text-red-500">*</span>
            </label>
            <input
              id="input-nombre-ubicacion"
              type="text"
              placeholder="Ej: Parque Central, Calle 5 y Av. Norte"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {/* Coordenadas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ubicación (Latitud / Longitud)
            </label>
            <div className="flex gap-3">
              <input
                id="input-latitud"
                type="number"
                placeholder="Latitud (Ej: 20.967)"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <input
                id="input-longitud"
                type="number"
                placeholder="Longitud (Ej: -89.623)"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            {lat && lng && (
              <div className="mt-3 h-48 rounded-xl overflow-hidden border border-gray-200">
                <iframe
                  title="mapa-ubicacion"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                />
              </div>
            )}
          </div>

          {/* Fecha automática */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Fecha (automática)
            </label>
            <input
              id="input-fecha"
              type="text"
              value={fecha}
              disabled
              className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Evidencias */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Evidencias (Fotos) <span className="text-red-500">*</span>
            </label>
            <input
              id="input-evidencias"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            <p className="text-xs text-gray-400 mt-1">Mínimo 1 evidencia requerida</p>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={src} alt={`evidencia-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón enviar */}
          <button
            id="btn-reportar"
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-semibold transition text-sm"
          >
            {loading ? "Enviando reporte..." : "Reportar"}
          </button>

          {!canSubmit && (
            <p className="text-xs text-amber-500 text-center">
              ⚠️ Completa el nombre de ubicación y agrega al menos 1 evidencia para enviar
            </p>
          )}

        </form>
      </main>
    </div>
  );
}
