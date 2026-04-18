import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function ReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fakeReport = {
      id,
      userId: "123",
      date: "2026-04-17",
      address: "Santo Domingo",
      lat: 18.4861,
      lng: -69.9312,
      images: [
        "https://picsum.photos/300",
        "https://picsum.photos/301"
      ]
    };

    setReport(fakeReport);
  }, [id]);

  if (!report) return <p>Cargando...</p>;

  // 👇 ESTE return DEBE ESTAR DENTRO DE LA FUNCIÓN
  return (
    <div style={{
      fontFamily: "Arial, sans-serif",
      background: "#f5f5f5",
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "#fff",
        borderRadius: "10px",
        padding: "20px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: "20px" }}>Detalle del Reporte</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px"
        }}>
          <p><strong>ID:</strong> {report.id}</p>
          <p><strong>Usuario:</strong> {report.userId}</p>
          <p><strong>Fecha:</strong> {report.date}</p>
          <p><strong>Dirección:</strong> {report.address}</p>
        </div>

        <div style={{
          height: "300px",
          borderRadius: "10px",
          overflow: "hidden",
          marginBottom: "20px"
        }}>
          <iframe
            width="100%"
            height="100%"
            style={{ border: "0" }}
            src={`https://maps.google.com/maps?q=${report.lat},${report.lng}&z=15&output=embed`}
          ></iframe>
        </div>

        <h3 style={{ marginBottom: "10px" }}>Evidencias</h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "10px"
        }}>
          {report.images.map((img, i) => (
            <div key={i} style={{
              width: "100%",
              height: "120px",
              overflow: "hidden",
              borderRadius: "8px"
            }}>
              <img
                src={img}
                alt="evidencia"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportDetail;