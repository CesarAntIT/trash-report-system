import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ReportDetail from "./pages/ReportDetail";
import UserInfo from "./pages/UserInfo";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Redirigir raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Detalle de reporte */}
        <Route path="/report/:id" element={<ReportDetail />} />

        {/* Info del usuario */}
        <Route path="/userinfo/:id" element={<UserInfo />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;