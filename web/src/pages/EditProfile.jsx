import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API = "http://localhost:3000/api";

export default function EditProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phone,       setPhone]       = useState('');
  const [email,       setEmail]       = useState('');
  const [addrText,    setAddrText]    = useState('');
  const [lat,         setLat]         = useState('');
  const [lng,         setLng]         = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    fetch(`${API}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const u = data.usuario;
          setPhone(u.numero_telefono || '');
          setEmail(u.correo_electronico || '');
          setAddrText(u.direccion_personal || '');
          if (u.ubicacion) {
            setLat(String(u.ubicacion.latitud));
            setLng(String(u.ubicacion.longitud));
          }
        }
      });
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem("token") || "";
      const body = {};
      if (phone.trim()) body.phone = phone.trim();
      if (email.trim()) body.email = email.trim();
      if (addrText.trim() || lat || lng) {
        body.address = {};
        if (addrText.trim()) body.address.text = addrText.trim();
        if (lat) body.address.latitude  = parseFloat(lat);
        if (lng) body.address.longitude = parseFloat(lng);
      }

      const res = await fetch(`${API}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar');
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => navigate(`/userinfo/${id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen flex">
      <main className="flex-1 p-8 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-4 block">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Perfil</h1>

        {error   && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <p className="text-xs text-gray-400">Los campos en blanco no modifican el dato actual.</p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm" placeholder="Número de teléfono" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Correo Electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm" placeholder="correo@ejemplo.com" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección Personal (texto)</label>
            <input type="text" value={addrText} onChange={e => setAddrText(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm" placeholder="Ej: Calle 5 #123, Colonia Centro" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Latitud</label>
              <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm" placeholder="20.9674" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Longitud</label>
              <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm" placeholder="-89.6237" />
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </main>
    </div>
  );
}
