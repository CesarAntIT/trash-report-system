import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReportDetail from "./pages/ReportDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/reports/:id" element={<ReportDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;