import { useMemo } from "react";

export default function PurchasedProducts({ onReturnHome }) {

  // ===== MOCK DATABASE =====
  const purchasedProducts = [
    {
      id: 1,
      name: "Visual Studio Pro",
      description: "IDE phát triển phần mềm chuyên nghiệp",
      price: 199,
      licenseKey: "VS-PRO-8F3D-92KD-1LA0",
      image: "https://cdn-icons-png.flaticon.com/512/6132/6132222.png"
    },
    {
      id: 2,
      name: "JetBrains IntelliJ Ultimate",
      description: "IDE Java mạnh mẽ cho enterprise",
      price: 249,
      licenseKey: "IJ-ULT-77AK-LL29-90QP",
      image: "https://resources.jetbrains.com/storage/products/intellij-idea/img/meta/intellij-idea_logo_300x300.png"
    },
    {
      id: 3,
      name: "Adobe Photoshop License",
      description: "Công cụ chỉnh sửa ảnh chuyên nghiệp",
      price: 120,
      licenseKey: "PS-2026-XXP9-AK33",
      image: "https://cdn-icons-png.flaticon.com/512/5968/5968520.png"
    }
  ];

  // ===== CALCULATE TOTAL =====
  const totalPrice = useMemo(() => {
    return purchasedProducts.reduce((sum, p) => sum + p.price, 0);
  }, []);

  // ===== STYLE (same system as revenue dashboard) =====
  const s = {
    card: {
      background: "#0f172a",
      border: "1px solid #1e293b",
      borderRadius: "12px",
      padding: "20px"
    },
    btnPrimary: {
      background: "#3b82f6",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600"
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#020617",
      color: "#f8fafc",
      padding: "40px 20px",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Phần mềm đã mua</h1>
          <p style={{ color: "#94a3b8" }}>Danh sách license thuộc tài khoản của bạn</p>
        </div>

        {/* TABLE */}
        <div style={s.card}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>
                <th style={{ padding: 12, textAlign: "left" }}>Ảnh</th>
                <th style={{ padding: 12, textAlign: "left" }}>Tên phần mềm</th>
                <th style={{ padding: 12, textAlign: "left" }}>Mô tả</th>
                <th style={{ padding: 12, textAlign: "left" }}>License Key</th>
                <th style={{ padding: 12, textAlign: "right" }}>Giá</th>
              </tr>
            </thead>

            <tbody>
              {purchasedProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  
                  <td style={{ padding: 12 }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: 40, height: 40, objectFit: "contain" }}
                    />
                  </td>

                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {product.name}
                  </td>

                  <td style={{ padding: 12, color: "#94a3b8" }}>
                    {product.description}
                  </td>

                  <td style={{
                    padding: 12,
                    fontFamily: "monospace",
                    color: "#10b981"
                  }}>
                    {product.licenseKey}
                  </td>

                  <td style={{
                    padding: 12,
                    textAlign: "right",
                    fontWeight: 600
                  }}>
                    ${product.price.toLocaleString()}
                  </td>

                </tr>
              ))}

              {/* TOTAL ROW */}
              <tr>
                <td colSpan={4} style={{
                  padding: 16,
                  textAlign: "right",
                  fontWeight: 700
                }}>
                  Tổng giá trị
                </td>

                <td style={{
                  padding: 16,
                  textAlign: "right",
                  fontWeight: 700,
                  color: "#10b981",
                  fontSize: 18
                }}>
                  ${totalPrice.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* RETURN BUTTON */}
        <div style={{ marginTop: 24 }}>
          <button style={s.btnPrimary} onClick={onReturnHome}>
            ← Return to Home
          </button>
        </div>

      </div>
    </div>
  );
}