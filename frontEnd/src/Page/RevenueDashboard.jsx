import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function RevenueDashboard() {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-02-28");

  const vendorId = 1;

    const loadRevenue = () => {
    axios
      .get("http://localhost:8081/api/vendor/revenue/daily", {
        params: {
          vendorId,
          startDate,
          endDate
        }
      })
      .then(res => setData(res.data))
      .catch(err => console.error("API error:", err));
  };
  const downloadCSV = () => {
  axios.get("http://localhost:8081/api/vendor/revenue/export", {
    params: {
      vendorId,
      startDate,
      endDate
    },
    responseType: "blob"
  }).then(res => {
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "revenue.csv");

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  }).catch(err => {
    console.error("Download CSV error:", err);
  });
};


  useEffect(() => {
    loadRevenue();
  }, []);

  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "Revenue",
        data: data.map(d => d.revenue),
        borderColor: "#3b82f6",
        backgroundColor: "transparent",
        tension: 0.25,
        pointRadius: 2
      }
    ]
  };

  /** ❌ TẮT TOÀN BỘ HIỆU ỨNG */
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    resizeDelay: 0,
    plugins: {
      legend: {
        labels: { color: "#e5e7eb" }
      }
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#1f2937" }
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "#1f2937" }
      }
    }
  };

  const totalRevenue = data.reduce(
    (sum, d) => sum + Number(d.revenue),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617, #020617)",
        color: "#e5e7eb",
        padding: 24
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 16 }}>Revenue Analytics</h2>

        {/* FILTER */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button onClick={loadRevenue}>Apply</button>
          <button onClick={downloadCSV}>CSV</button>
        </div>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "3fr 1fr",
            gap: 16
          }}
        >
          {/* CHART */}
          <div
            style={{
              background: "#020617",
              border: "1px solid #1f2937",
              borderRadius: 8,
              padding: 12,
              height: 320
            }}
          >
            <Line data={chartData} options={chartOptions} />
          </div>

          {/* SUMMARY */}
          <div
            style={{
              background: "#020617",
              border: "1px solid #1f2937",
              borderRadius: 8,
              padding: 12
            }}
          >
            <strong>Summary</strong>
            <p>Total days: {data.length}</p>
            <p>Total revenue: {totalRevenue}</p>
          </div>
        </div>

        {/* TABLE */}
        <div
          style={{
            marginTop: 20,
            background: "#020617",
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 12,
            overflowX: "auto"
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Date</th>
                <th style={{ textAlign: "right", padding: 8 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: 8 }}>{row.date}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    {row.revenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
