import { CertificateQRCode } from "./CertificateQRCode";
import type { ReactNode } from "react";
import Image from "next/image";

type Props = {
  userName: string;
  courseTitle: string;
  courseHours: number;
  instructorName: string;
  certDisplayId: string;
  uniqueId: string;
  issuedAt: Date;
  contractAddress: string | null;
  day: string;
  month: string;
  year: number;
  networkLabel: string;
  blockchainStatus: string;
  txUrl: string | null;
  txHash: string | null;
  nameSlot?: ReactNode;
};

export function CertificateTemplate({
  userName,
  courseTitle,
  courseHours,
  instructorName,
  certDisplayId,
  uniqueId,
  issuedAt,
  contractAddress,
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
          {/* Clean double border */}
          <div className="border-outer" />
          <div className="border-inner" />

          {/* Corner accents — simple geometric L-shapes */}
          <div className="corner tl" />
          <div className="corner tr" />
          <div className="corner bl" />
          <div className="corner br" />

          {/* Center Watermark — actual Edris logo */}
          <div className="watermark-logo">
            <Image
              src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
              alt=""
              width={640}
              height={640}
              className="watermark-img"
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="content">
            {/* Header */}
            <div className="header-group">
              <div className="top-header">
                <Image
                  className="logo-image"
                  src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                  alt="Edris LMS logo"
                  width={36}
                  height={36}
                />
                <div className="org-name">Edris LMS — Academy of Excellence</div>
              </div>

              <div className="cert-title">Certificate</div>

              <div className="badge">
                <span>of Achievement</span>
              </div>
            </div>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            {/* Body */}
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

            {/* Footer — 3 columns */}
            <div className="footer">
              <div className="date-col">
                <div className="f-rule" />
                <div className="date-val">{day} / {month} / {year}</div>
                <div className="date-lbl">Date of Issue</div>
              </div>

              <div className="qr-col">
                <div className="qr-frame">
                  <CertificateQRCode size={52} />
                </div>
                <div className="qr-title">Scan to Verify</div>
                <div className="qr-id">ID: {certDisplayId}</div>
              </div>

              <div className="sig-col">
                <div className="sig-rule" />
                <div className="sig-name">{instructorName}</div>
                <div className="sig-role">Course Instructor</div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bottom-bar">
              <div className="info-txt">www.edrislms.com</div>
              <span className="info-sep">&bull;</span>
              <Image
                src="/bc413ab4-3838-4b3d-ae28-e8f3cd721b33.png"
                alt="Edris LMS logo"
                className="bottom-logo"
                width={13}
                height={13}
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

            <div className="meta-footer" aria-label="Certificate metadata">
              <div className="meta-item">
                <div className="meta-label">Certificate ID</div>
                <div className="meta-value mono">{uniqueId}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Issued At (UTC)</div>
                <div className="meta-value mono">{issuedAt.toISOString()}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Blockchain</div>
                <div className="meta-value">Polygon Amoy</div>
              </div>
              {contractAddress && <div className="meta-contract">{contractAddress}</div>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* ── Brand tokens ── */
        .cert {
          --brand: #4a6d56;
          --brand-light: #5d866c;
          --brand-dark: #0a140f;
          --brand-muted: #15291e;
          --text-subtle: #3a4d42;
          --rule: #4a6d56;
        }

        /* ── Base ── */
        .cert {
          container-type: inline-size; /* CRITICAL: Enables mathematical scaling */
          width: 100%;
          /* Protects the aspect ratio from being cropped on short screens by dynamically shrinking width */
          max-width: min(1000px, calc((100vh - 100px) * 1.414));
          aspect-ratio: 1.414 / 1; /* ISO A4 Landscape proportion */
          background: #ffffff;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 25px 80px rgba(0,0,0,.25);
          overflow: hidden;
          flex-shrink: 0;
          margin: 0 auto;
        }

        /* ── Borders ── */
        .border-outer { position: absolute; inset: 2cqw; border: 0.2cqw solid var(--brand); pointer-events: none; z-index: 3; }
        .border-inner { position: absolute; inset: 2.8cqw; border: 0.1cqw solid var(--brand-light); pointer-events: none; z-index: 3; }

        /* ── Corner accents ── */
        .corner { position: absolute; width: 2.8cqw; height: 2.8cqw; z-index: 4; pointer-events: none; }
        .corner::before, .corner::after { content: ''; position: absolute; background: var(--brand); }
        .corner::before { width: 100%; height: 0.2cqw; top: 0; left: 0; }
        .corner::after { width: 0.2cqw; height: 100%; top: 0; left: 0; }
        .corner.tl { top: 2cqw; left: 2cqw; }
        .corner.tr { top: 2cqw; right: 2cqw; transform: scaleX(-1); }
        .corner.bl { bottom: 2cqw; left: 2cqw; transform: scaleY(-1); }
        .corner.br { bottom: 2cqw; right: 2cqw; transform: scale(-1,-1); }

        /* ── Logo Watermark ── */
        .watermark-logo {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 65cqw; height: 65cqw;
          opacity: 0.035;
          pointer-events: none; z-index: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .watermark-img {
          width: 100% !important; height: 100% !important;
          object-fit: contain;
        }

        /* ── Content layout ── */
        .content {
          position: relative; z-index: 2;
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: space-between;
          padding: 4.5cqw 10cqw 3cqw;
        }

        /* ── Header group ── */
        .header-group {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.8cqw;
        }

        .top-header { display: flex; align-items: center; gap: 0.8cqw; }
        .logo-image { width: 3.6cqw; height: 3.6cqw; object-fit: contain; flex-shrink: 0; }
        .org-name {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 1.1cqw; font-weight: 700;
          letter-spacing: .35em; color: var(--brand);
          text-transform: uppercase;
        }

        .cert-title {
          font-family: var(--font-cinzel), serif;
          font-size: 5.2cqw; font-weight: 700;
          color: var(--brand-dark); letter-spacing: .08em;
          line-height: 1.1; text-align: center;
          margin: 0.2cqw 0;
        }

        .badge {
          background: var(--brand);
          padding: 0.4cqw 3cqw; display: inline-block;
          border-radius: 0.2cqw;
        }
        .badge span {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.9cqw; font-weight: 700;
          letter-spacing: .4em; color: #ffffff;
          text-transform: uppercase;
        }

        /* ── Divider ── */
        .divider { width: 100%; display: flex; align-items: center; gap: 1.2cqw; margin: 0.5cqw 0; }
        .divider-line { flex: 1; height: 0.1cqw; background: linear-gradient(90deg, transparent, var(--brand-light) 30%, var(--brand-light) 70%, transparent); }
        .divider-diamond { width: 0.6cqw; height: 0.6cqw; background: var(--brand); transform: rotate(45deg); flex-shrink: 0; }

        /* ── Body ── */
        .body-section { display: flex; flex-direction: column; align-items: center; width: 100%; }
        
        .presented-to {
          font-family: var(--font-garamond), Georgia, serif;
          font-size: 1.6cqw; font-style: italic; color: var(--brand-dark); letter-spacing: .05em;
          margin-bottom: 0.5cqw;
        }
        
        .recipient {
          font-family: var(--font-great-vibes), cursive;
          font-size: 6.2cqw;
          color: var(--brand-dark);
          line-height: 1.3;
          text-align: center;
          padding: 0.4cqw 0;
        }
        
        .name-rule {
          width: 40cqw; max-width: 90%; height: 0.1cqw;
          background: linear-gradient(90deg, transparent, var(--brand), transparent);
          margin-top: 0.3cqw;
          margin-bottom: 1.4cqw;
        }
        
        .completing {
          font-family: var(--font-garamond), Georgia, serif;
          font-size: 1.4cqw; font-style: italic;
          color: var(--text-subtle); letter-spacing: .04em; text-align: center;
          margin-bottom: 0.5cqw;
        }
        
        .course-name {
          font-family: var(--font-cinzel), serif;
          font-size: 2cqw; font-weight: 700; color: var(--brand-dark);
          letter-spacing: .18em; text-align: center; text-transform: uppercase;
          margin-bottom: 0.6cqw;
        }
        
        .duration {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 1.1cqw; color: var(--brand-dark);
          letter-spacing: .05em; text-align: center;
          margin-bottom: 0.8cqw;
        }
        .duration b { font-weight: 700; color: var(--brand); }
        
        .description {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 1cqw; color: var(--brand-muted);
          line-height: 1.5; text-align: center; max-width: 65cqw;
        }

        /* ── Footer 3-col (CSS Grid) ── */
        .footer {
          width: calc(100% + 4cqw);
          margin-left: -2cqw; margin-right: -2cqw;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: end; /* Align items to bottom */
          gap: 1.5cqw;
        }

        .date-col { display: flex; flex-direction: column; align-items: flex-start; justify-self: start; padding-bottom: 0.8cqw; }
        .f-rule { width: 12cqw; height: 0.1cqw; background: var(--brand); margin-bottom: 0.5cqw; }
        .date-val {
          font-family: var(--font-cinzel), serif;
          font-size: 1.2cqw; font-weight: 700; letter-spacing: .1em; color: var(--brand-dark);
        }
        .date-lbl {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.9cqw; letter-spacing: 0.12em; color: var(--text-subtle); margin-top: 0.3cqw; text-transform: uppercase; font-weight: 500;
        }

        .qr-col { display: flex; flex-direction: column; align-items: center; gap: 0.3cqw; justify-self: center; }
        .qr-frame {
          width: 5.6cqw; height: 5.6cqw;
          border: 0.1cqw solid var(--brand);
          padding: 0.3cqw; background: white;
          display: flex; align-items: center; justify-content: center;
        }
        .qr-title {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.8cqw; font-weight: 800; letter-spacing: .08em; color: var(--brand-dark); text-transform: uppercase;
        }
        .qr-id {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.7cqw; font-weight: 700; color: var(--brand); letter-spacing: .06em;
        }

        .sig-col { display: flex; flex-direction: column; align-items: flex-end; justify-self: end; padding-bottom: 0.8cqw; }
        .sig-script {
          font-family: var(--font-great-vibes), cursive;
          font-size: 4cqw; color: var(--brand-dark); line-height: 1; text-align: right; margin-bottom: 0.3cqw;
        }
        .sig-rule { width: 15cqw; height: 0.1cqw; background: var(--brand); margin-bottom: 0.5cqw; }
        .sig-name {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 1cqw; font-weight: 700; letter-spacing: .1em;
          color: var(--brand-dark); text-transform: uppercase; text-align: right;
        }
        .sig-role {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.9cqw; letter-spacing: .08em; color: var(--text-subtle); text-align: right; margin-top: 0.3cqw; text-transform: uppercase; font-weight: 500;
        }

        /* ── Bottom bar ── */
        .bottom-bar {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 1.2cqw; padding-top: 1cqw; padding-bottom: 0.4cqw;
          border-top: 0.1cqw solid var(--brand-light);
        }
        .bottom-logo { width: 1cqw; height: 1cqw; object-fit: contain; flex-shrink: 0; }
        .info-txt {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 0.9cqw; font-weight: 700; letter-spacing: .2em;
          color: var(--brand); text-transform: uppercase; text-decoration: none;
        }
        .info-sep { color: var(--brand-light); font-size: 0.8cqw; }

        .meta-footer {
          width: 100%;
          margin-top: 0.8cqw;
          padding-top: 0.8cqw;
          border-top: 0.08cqw solid rgba(0, 0, 0, 0.18);
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.2cqw;
          align-items: start;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.15cqw;
          min-width: 0;
        }

        .meta-label,
        .meta-value {
          font-family: var(--font-montserrat), system-ui, sans-serif;
          font-size: 10px;
          color: #666;
          line-height: 1.2;
          letter-spacing: 0.03em;
          word-break: break-word;
        }

        .meta-value.mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .meta-contract {
          display: none;
        }
      `}</style>
    </>
  );
}
