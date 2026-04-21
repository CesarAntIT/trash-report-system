import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReportDetail from "./pages/ReportDetail";
import UserInfo from "./pages/UserInfo";
import EditProfile from "./pages/EditProfile";
import Metrics from "./pages/Metrics";
import Dashboard from "./pages/Dashboard";
import CrearReporte from "./pages/CrearReporte";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirigir raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Crear reporte */}
        <Route path="/crear-reporte" element={<CrearReporte />} />

        {/* Detalle de reporte */}
        <Route path="/report/:id" element={<ReportDetail />} />

        {/* Info del usuario */}
        <Route path="/userinfo/:id" element={<UserInfo />} />

        {/* Editar perfil */}
        <Route path="/edit-profile/:id" element={<EditProfile />} />

        {/* Métricas admin */}
        <Route path="/metrics" element={<Metrics />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;