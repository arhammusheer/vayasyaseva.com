import { ImageResponse } from "next/og";
export const alt = "Vayasya Seva. Workforce. With care.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "80px",
          background: "#0F172A",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: 4,
            color: "#EBB74A",
            marginBottom: 55,
          }}
        >
          PEOPLE AT THE HEART OF WORK
        </div>
        <div style={{ fontSize: 90, letterSpacing: -4 }}>Vayasya Seva</div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#E2E8F0" }}>
          Workforce. With care.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 21,
            marginTop: 70,
            borderTop: "1px solid #475569",
            paddingTop: 25,
            justifyContent: "space-between",
          }}
        >
          <span>Contract labour & industrial services</span>
          <span>vayasyaseva.com</span>
        </div>
      </div>
    ),
    size,
  );
}
