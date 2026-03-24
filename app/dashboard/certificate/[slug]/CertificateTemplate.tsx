import { CertificateQRCode } from "./CertificateQRCode";
import type { ReactNode } from "react";
import Image from "next/image";

type Props = {
  userName: string;
  courseTitle: string;
  courseHours: number;
  instructorName: string;
  verificationUrl: string;
  certDisplayId: string;
  day: string;
  month: string;
  year: number;
  networkLabel: string;
  blockchainStatus: string;
  txUrl: string | null;
  txHash: string | null;
  nameSlot?: ReactNode;
};

const CORNER_SVG = (
  <svg viewBox="0 0 140 140" fill="none" aria-hidden>
    <line x1="12" y1="12" x2="90" y2="12" stroke="#2d6a4f" strokeWidth="1.8" />
    <line x1="12" y1="12" x2="12" y2="90" stroke="#2d6a4f" strokeWidth="1.8" />
    <line x1="12" y1="12" x2="75" y2="75" stroke="#b5995a" strokeWidth="0.9" />
    <line x1="12" y1="12" x2="85" y2="46" stroke="#b5995a" strokeWidth="0.6" />
    <line x1="12" y1="12" x2="46" y2="85" stroke="#b5995a" strokeWidth="0.6" />
    <line x1="12" y1="12" x2="100" y2="30" stroke="#b5995a" strokeWidth="0.4" opacity="0.6" />
    <line x1="12" y1="12" x2="30" y2="100" stroke="#b5995a" strokeWidth="0.4" opacity="0.6" />
    <path d="M12 48 Q12 12 48 12" stroke="#2d6a4f" strokeWidth="1.1" fill="none" />
    <path d="M12 64 Q12 12 64 12" stroke="#2d6a4f" strokeWidth="0.7" fill="none" opacity="0.6" />
    <path d="M12 80 Q12 12 80 12" stroke="#b5995a" strokeWidth="0.6" fill="none" opacity="0.5" />
    <polyline points="12,42 12,12 42,12" stroke="#2d6a4f" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="20,34 20,20 34,20" stroke="#b5995a" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill="#b5995a" />
    <circle cx="42" cy="12" r="1.3" fill="#2d6a4f" opacity="0.6" />
    <circle cx="12" cy="42" r="1.3" fill="#2d6a4f" opacity="0.6" />
  </svg>
);

export function CertificateTemplate({
  userName,
  courseTitle,
  courseHours,
  instructorName,
  verificationUrl,
  certDisplayId,
  day,
  month,
  year,
  networkLabel,
  blockchainStatus,
  txUrl,
  txHash,
  nameSlot,
}: Props) {
  return (
    <>
      <div className="certificate-print-root">
        <div className="cert">
          <div className="border-outer" />
          <div className="border-inner" />

          {/* Corner ornaments */}
          <div className="corner-ornament tl">{CORNER_SVG}</div>
          <div className="corner-ornament tr">{CORNER_SVG}</div>
          <div className="corner-ornament bl">{CORNER_SVG}</div>
          <div className="corner-ornament br">{CORNER_SVG}</div>

          {/* Side dots */}
          <svg className="dot-pattern left" viewBox="0 0 30 300" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id="dl" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1.3" fill="#2d6a4f" />
              </pattern>
            </defs>
            <rect width="30" height="300" fill="url(#dl)" />
          </svg>
          <svg className="dot-pattern right" viewBox="0 0 30 300" preserveAspectRatio="none" aria-hidden>
            <defs>
              <pattern id="dr" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1.3" fill="#2d6a4f" />
              </pattern>
            </defs>
            <rect width="30" height="300" fill="url(#dr)" />
          </svg>

          {/* Watermark */}
          <svg className="watermark" viewBox="0 0 200 230" fill="none" aria-hidden>
            <path d="M100 5 L192 42 L192 125 Q192 182 100 225 Q8 182 8 125 L8 42 Z" stroke="#2d6a4f" strokeWidth="5" fill="none" />
            <path d="M100 20 L178 54 L178 122 Q178 170 100 208 Q22 170 22 122 L22 54 Z" stroke="#2d6a4f" strokeWidth="2" fill="none" />
            <rect x="68" y="72" width="64" height="64" rx="4" stroke="#2d6a4f" strokeWidth="5" fill="none" transform="rotate(45 100 104)" />
            <circle cx="100" cy="72" r="9" fill="#2d6a4f" />
            <circle cx="72" cy="104" r="9" fill="#2d6a4f" />
            <circle cx="128" cy="104" r="9" fill="#2d6a4f" />
            <circle cx="100" cy="150" r="9" fill="#2d6a4f" />
            <line x1="100" y1="72" x2="72" y2="104" stroke="#2d6a4f" strokeWidth="4" />
            <line x1="100" y1="72" x2="128" y2="104" stroke="#2d6a4f" strokeWidth="4" />
            <line x1="72" y1="104" x2="100" y2="150" stroke="#2d6a4f" strokeWidth="4" />
            <line x1="128" y1="104" x2="100" y2="150" stroke="#2d6a4f" strokeWidth="4" />
            <line x1="72" y1="104" x2="128" y2="104" stroke="#2d6a4f" strokeWidth="4" />
            <path d="M76 162 Q100 178 124 162" stroke="#2d6a4f" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>

          {/* Content */}
          <div className="content">
            {/* Header */}
            <div className="top-header">
              <Image
                className="logo-image"
                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                alt="Edris LMS logo"
                width={42}
                height={42}
              />
              <div className="org-name">Edris LMS – Academy of Excellence</div>
            </div>

            <div className="cert-title">Certificate</div>
            <div className="gold-badge"><span>of Achievement</span></div>

            <div className="divider">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            <div className="body-section">
              <div className="presented-to">This certificate is proudly presented to</div>
              {nameSlot ?? <div className="recipient">{userName}</div>}
              <div className="name-rule" />
              <div className="completing">for successfully completing the course</div>
              <div className="course-name">{courseTitle}</div>
              <div className="duration">Duration: <b>{courseHours} hours</b></div>
              <div className="description">
                {userName} has demonstrated remarkable expertise and dedication throughout this
                comprehensive program, earning distinction on the Edris LMS platform.
              </div>
            </div>

            <div className="footer">
              <div className="date-col">
                <div className="f-rule" />
                <div className="date-val">{day} / {month} / {year}</div>
                <div className="date-lbl">Date of Issue</div>
                {/* <div className="blockchain-lbl">
                  {blockchainStatus === "ISSUED" ? "Blockchain Verified" : "Blockchain Pending"} – {networkLabel}
                </div> */}
              </div>

              <div className="qr-col">
                <div className="qr-frame">
                  <CertificateQRCode url={verificationUrl} size={56} />
                </div>
                <div className="qr-title">Scan to Verify</div>
                {/* <div className="qr-sub">Blockchain Verified - Polygon Amoy<br />Network</div> */}
                <div className="qr-id">ID: {certDisplayId}</div>
              </div>

              <div className="sig-col">
                <div className="sig-script">{instructorName}</div>
                <div className="sig-rule" />
                <div className="sig-name">{instructorName}</div>
                <div className="sig-role">Course Instructor</div>
              </div>
            </div>

            <div className="bottom-bar">
              <div className="info-txt">www.edrislms.com</div>
              <span className="info-sep">&bull;</span>
              <Image
                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                alt="Edris LMS logo"
                className="bottom-logo"
                width={14}
                height={16}
              />
              <span className="info-sep">&bull;</span>
              <div className="info-txt">{networkLabel}</div>
              {blockchainStatus === "ISSUED" && txUrl && txHash && (
                <>
                  <span className="info-sep">&bull;</span>
                  <a href={txUrl} target="_blank" rel="noreferrer" className="info-txt">
                    tx: {txHash.slice(0, 12)}…
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cert{width:96vw;max-width:900px;height:96vh;max-height:640px;background:#f5f2e8;position:relative;display:flex;flex-direction:column;align-items:center;box-shadow:0 20px 70px rgba(0,0,0,.4);overflow:hidden;flex-shrink:0;margin:0 auto}

        .border-outer{position:absolute;inset:12px;border:2px solid #2d6a4f;pointer-events:none;z-index:3}
        .border-inner{position:absolute;inset:18px;border:.5px solid #b5995a;pointer-events:none;z-index:3}

        .corner-ornament{position:absolute;width:140px;height:140px;z-index:4;pointer-events:none}
        .corner-ornament svg{width:100%;height:100%}
        .corner-ornament.tl{top:0;left:0}
        .corner-ornament.tr{top:0;right:0;transform:scaleX(-1)}
        .corner-ornament.bl{bottom:0;left:0;transform:scaleY(-1)}
        .corner-ornament.br{bottom:0;right:0;transform:scale(-1,-1)}

        .dot-pattern{position:absolute;z-index:1;pointer-events:none;opacity:.22;width:30px;top:160px;bottom:160px}
        .dot-pattern.left{left:28px}
        .dot-pattern.right{right:28px}

        .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-46%);width:310px;height:310px;opacity:.05;pointer-events:none;z-index:0}

        .content{position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:22px 72px 16px}

        .top-header{display:flex;align-items:center;gap:10px}
        .logo-image{width:42px;height:42px;object-fit:contain;flex-shrink:0}
        .org-name{font-family:var(--font-montserrat),sans-serif;font-size:9.5px;font-weight:700;letter-spacing:.3em;color:#2d6a4f;text-transform:uppercase}

        .cert-title{font-family:var(--font-cinzel),serif;font-size:clamp(42px,6vw,62px);font-weight:700;color:#1b4332;letter-spacing:.08em;line-height:1;text-align:center}

        .gold-badge{background:linear-gradient(135deg,#c9a84c,#b5995a,#d4b86a,#b5995a);padding:5px 34px;display:inline-block}
        .gold-badge span{font-family:var(--font-montserrat),sans-serif;font-size:9px;font-weight:700;letter-spacing:.42em;color:#fff;text-transform:uppercase}

        .divider{width:100%;display:flex;align-items:center;gap:10px}
        .divider-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#2d6a4f 30%,#2d6a4f 70%,transparent)}
        .divider-diamond{width:7px;height:7px;background:#b5995a;transform:rotate(45deg);flex-shrink:0}

        .body-section{display:flex;flex-direction:column;align-items:center;gap:3px;width:100%}
        .presented-to{font-family:var(--font-garamond),serif;font-size:13px;font-style:italic;color:#b5995a;letter-spacing:.05em}
        .recipient{font-family:var(--font-great-vibes),cursive;font-size:clamp(54px,7vw,72px);color:#1b4332;line-height:1.05;text-align:center}
        .name-rule{width:520px;max-width:100%;height:1px;background:linear-gradient(90deg,transparent,#2d6a4f,transparent);margin-top:2px}
        .completing{font-family:var(--font-garamond),serif;font-size:13px;font-style:italic;color:#4a5e52;letter-spacing:.04em;text-align:center}
        .course-name{font-family:var(--font-cinzel),serif;font-size:15px;font-weight:700;color:#1b4332;letter-spacing:.18em;text-align:center;text-transform:uppercase}
        .duration{font-family:var(--font-montserrat),sans-serif;font-size:10px;color:#4a5e52;letter-spacing:.05em;text-align:center}
        .duration b{font-weight:700;color:#2d6a4f}
        .description{font-family:var(--font-montserrat),sans-serif;font-size:9px;color:#3a4e44;line-height:1.7;text-align:center;max-width:600px}

        .footer{width:100%;display:flex;align-items:flex-start;justify-content:space-between}
        .date-col{display:flex;flex-direction:column;align-items:flex-start;width:180px}
        .f-rule{width:150px;height:1px;background:#2d6a4f;margin-bottom:5px}
        .date-val{font-family:var(--font-cinzel),serif;font-size:13px;font-weight:600;letter-spacing:.1em;color:#1b4332}
        .date-lbl{font-family:var(--font-montserrat),sans-serif;font-size:8px;letter-spacing:.15em;color:#4a5e52;margin-top:3px}
        .blockchain-lbl{font-family:var(--font-montserrat),sans-serif;font-size:7px;color:#7a9a85;letter-spacing:.08em;font-style:italic;margin-top:10px}

        .qr-col{display:flex;flex-direction:column;align-items:center;gap:4px}
        .qr-frame{width:68px;height:68px;border:2px solid #1b4332;padding:4px;background:white;display:flex;align-items:center;justify-content:center}
        .qr-title{font-family:var(--font-montserrat),sans-serif;font-size:10px;font-weight:700;letter-spacing:.08em;color:#1b4332}
        .qr-sub{font-family:var(--font-montserrat),sans-serif;font-size:7px;color:#4a5e52;text-align:center;line-height:1.5}
        .qr-id{font-family:var(--font-montserrat),sans-serif;font-size:7px;font-weight:600;color:#2d6a4f;letter-spacing:.06em}

        .sig-col{display:flex;flex-direction:column;align-items:center;width:180px}
        .sig-script{font-family:var(--font-great-vibes),cursive;font-size:36px;color:#1b4332;line-height:1.1;text-align:center}
        .sig-rule{width:150px;height:1px;background:#2d6a4f;margin:3px 0 4px}
        .sig-name{font-family:var(--font-montserrat),sans-serif;font-size:10px;font-weight:700;letter-spacing:.1em;color:#1b4332;text-transform:uppercase;text-align:center}
        .sig-role{font-family:var(--font-montserrat),sans-serif;font-size:8px;letter-spacing:.08em;color:#4a5e52;text-align:center}

        .bottom-bar{width:100%;display:flex;align-items:center;justify-content:center;gap:14px;padding-top:10px;padding-bottom:8px;border-top:.5px solid #b5995a}
        .bottom-logo{width:14px;height:16px;object-fit:contain;flex-shrink:0}
        .info-txt{font-family:var(--font-montserrat),sans-serif;font-size:8px;font-weight:600;letter-spacing:.22em;color:#2d6a4f;text-transform:uppercase;text-decoration:none}
        .info-sep{color:#b5995a;font-size:9px}
      `}</style>
    </>
  );
}
