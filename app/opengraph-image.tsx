import { ImageResponse } from "next/og";

export const alt = "Edris LMS — online courses with AI tutoring and verified certificates";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share card for pages without their own image. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f1311 0%, #1c2a22 55%, #2f4a3a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#5d866c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>Edris LMS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 980 }}>
            Master new skills with an AI tutor by your side
          </div>
          <div style={{ fontSize: 30, color: "#c9d8cf", maxWidth: 960 }}>
            Expert-led video courses · quizzes &amp; assignments · blockchain-verified certificates
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#8fb89a" }}>edrislms.com</div>
      </div>
    ),
    size
  );
}
