import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "Vayasya Seva Private Limited — Compliance-First Workforce Operations";
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
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0F172A",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "4px",
              backgroundColor: "#DAA236",
              borderRadius: "2px",
            }}
          />
          <div
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "#FFFFFF",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            Vayasya Seva Private Limited
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#EBB74A",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Compliance-First Workforce Operations
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 400,
              color: "#CBD5E1",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: "800px",
              marginTop: "8px",
            }}
          >
            Structured workforce deployment for warehouses, factories, and
            facilities — with supervision, attendance integrity, and audit-ready
            documentation.
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {["ESIC", "EPF", "GST", "MSME"].map((reg) => (
              <div
                key={reg}
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#EBB74A",
                  border: "1px solid #DAA23666",
                  borderRadius: "6px",
                  padding: "6px 14px",
                }}
              >
                {reg} Registered
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
