import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function UserInfo() {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`http://localhost:3000/api/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success) {
          setUserData(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, [id]);

  if (!userData) return <p className="p-6">Cargando...</p>;

  const user = userData.usuario;

  return (
    <div className="bg-gray-100 min-h-screen flex">

      {/* sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm fixed">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗑️</span>
            <span className="text-lg font-bold text-gray-800">TrashReport</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Perfil de usuario</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Información del Usuario</h1>
          <p className="text-sm text-gray-500 mt-1">
            Datos del perfil
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {/* info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <p><span className="font-semibold">ID:</span> {user.id}</p>
            <p><span className="font-semibold">Nombre:</span> {user.nombre_completo}</p>
            <p><span className="font-semibold">Email:</span> {user.correo_electronico}</p>
            <p><span className="font-semibold">Teléfono:</span> {user.numero_telefono}</p>
            <p><span className="font-semibold">Dirección:</span> {user.direccion_personal}</p>
          </div>

          {/* mapa */}
          {user.ubicacion?.latitud && user.ubicacion?.longitud && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Ubicación</h3>
              <div className="h-72 rounded-xl overflow-hidden border">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${user.ubicacion.latitud},${user.ubicacion.longitud}&z=15&output=embed`}
                ></iframe>
              </div>
            </div>
          )}

          {/* boton editar */}
          {userData.esPropietario && (
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg">
              Editar Perfil
            </button>
          )}

        </div>

      </main>
    </div>
  );
}

export default UserInfo;