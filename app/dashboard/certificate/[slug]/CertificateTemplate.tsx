import { CertificateQRCode } from "./CertificateQRCode";

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
};

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
}: Props) {
  return (
    <>
      <div className="certificate-print-root mx-auto max-w-[1100px]">
        <div className="certificate-card cert">
          <div className="border-outer" />
          <div className="border-inner" />

          <div className="content">
            <div className="top-header">
              <svg className="logo-shield" viewBox="0 0 200 220" fill="none" aria-hidden>
                <path d="M100 5 L190 40 L190 120 Q190 175 100 215 Q10 175 10 120 L10 40 Z" stroke="#2d6a4f" strokeWidth="8" />
                <path d="M100 22 L173 52 L173 118 Q173 163 100 198 Q27 163 27 118 L27 52 Z" stroke="#2d6a4f" strokeWidth="4" />
              </svg>
              <div className="org-name">Edris LMS - Academy of Excellence</div>
            </div>

            <div className="cert-title">Certificate</div>
            <div className="gold-badge"><span>of Achievement</span></div>

            <div className="divider">
              <div className="divider-line" />
              <div className="divider-diamond" />
              <div className="divider-line" />
            </div>

            <div className="presented-to">This certificate is proudly presented to</div>
            <div className="recipient">{userName}</div>
            <div className="name-rule" />

            <div className="completing">for successfully completing the course</div>
            <div className="course-name">{courseTitle}</div>
            <div className="duration">Duration: <b>{courseHours} hours</b></div>

            <div className="description">
              {userName} has demonstrated commitment and professional consistency throughout this
              program, earning distinction on the Edris LMS platform.
            </div>

            <div className="footer">
              <div className="date-col">
                <div className="date-rule" />
                <div className="date-val">{day} / {month} / {year}</div>
                <div className="date-lbl">Date of Issue</div>
                <div className="blockchain-lbl">Blockchain Verified - {networkLabel}</div>
              </div>

              <div className="qr-col">
                <div className="qr-frame">
                  <CertificateQRCode url={verificationUrl} size={68} />
                </div>
                <div className="qr-title">Scan to Verify</div>
                <div className="qr-sub">Blockchain Verified - Polygon Amoy<br />Network</div>
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
              <span className="info-sep">•</span>
              <div className="info-txt">{networkLabel}</div>
              {blockchainStatus === "ISSUED" && txUrl && txHash && (
                <>
                  <span className="info-sep">•</span>
                  <a href={txUrl} target="_blank" rel="noreferrer" className="info-txt">
                    tx: {txHash.slice(0, 12)}...
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cert{width:860px;min-height:1020px;background:#f5f2e8;position:relative;display:flex;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 25px 80px rgba(0,0,0,.35);overflow:hidden}
        .border-outer{position:absolute;inset:14px;border:2px solid #2d6a4f;pointer-events:none;z-index:3}
        .border-inner{position:absolute;inset:20px;border:.5px solid #b5995a;pointer-events:none;z-index:3}
        .content{position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;padding:44px 70px 36px}
        .top-header{display:flex;align-items:center;gap:12px;margin-bottom:18px}
        .logo-shield{width:46px;height:46px}
        .org-name{font-family:var(--font-montserrat),sans-serif;font-size:11px;font-weight:700;letter-spacing:.32em;color:#2d6a4f;text-transform:uppercase}
        .cert-title{font-family:var(--font-cinzel),serif;font-size:72px;font-weight:700;color:#1b4332;letter-spacing:.08em;line-height:1}
        .gold-badge{background:linear-gradient(135deg,#c9a84c,#b5995a,#d4b86a,#b5995a);padding:7px 40px;margin-top:10px}
        .gold-badge span{font-family:var(--font-montserrat),sans-serif;font-size:11px;font-weight:700;letter-spacing:.42em;color:#fff;text-transform:uppercase}
        .divider{width:100%;display:flex;align-items:center;gap:12px;margin:22px 0 18px}
        .divider-line{flex:1;height:1px;background:linear-gradient(90deg,transparent,#2d6a4f 30%,#2d6a4f 70%,transparent)}
        .divider-diamond{width:8px;height:8px;background:#b5995a;transform:rotate(45deg)}
        .presented-to{font-family:var(--font-garamond),serif;font-size:16px;font-style:italic;color:#b5995a;letter-spacing:.05em;margin-bottom:6px}
        .recipient{font-family:var(--font-great-vibes),cursive;font-size:86px;color:#1b4332;line-height:1.05;text-align:center}
        .name-rule{width:580px;height:1px;background:linear-gradient(90deg,transparent,#2d6a4f 20%,#2d6a4f 80%,transparent);margin:8px 0 20px}
        .completing{font-family:var(--font-garamond),serif;font-size:15.5px;font-style:italic;color:#4a5e52;letter-spacing:.04em;text-align:center;margin-bottom:6px}
        .course-name{font-family:var(--font-cinzel),serif;font-size:19px;font-weight:700;color:#1b4332;letter-spacing:.1em;text-align:center;text-transform:uppercase;margin-bottom:6px}
        .duration{font-family:var(--font-montserrat),sans-serif;font-size:12px;color:#4a5e52;letter-spacing:.05em;margin-bottom:18px}.duration b{font-weight:700;color:#2d6a4f}
        .description{font-family:var(--font-montserrat),sans-serif;font-size:10.5px;color:#3a4e44;line-height:1.85;text-align:center;max-width:620px;margin-bottom:30px}
        .footer{width:100%;display:flex;align-items:flex-start;justify-content:space-between;margin-top:4px}
        .date-col{display:flex;flex-direction:column;align-items:flex-start;width:200px}
        .date-rule,.sig-rule{width:160px;height:1px;background:#2d6a4f;margin-bottom:6px}
        .date-val{font-family:var(--font-cinzel),serif;font-size:15px;font-weight:600;color:#1b4332;letter-spacing:.1em}
        .date-lbl{font-family:var(--font-montserrat),sans-serif;font-size:9px;letter-spacing:.15em;color:#4a5e52;margin-top:4px}
        .blockchain-lbl{font-family:var(--font-montserrat),sans-serif;font-size:8px;color:#7a9a85;letter-spacing:.1em;font-style:italic;margin-top:16px}
        .qr-col{display:flex;flex-direction:column;align-items:center;gap:6px}
        .qr-frame{width:80px;height:80px;border:2px solid #1b4332;padding:4px;background:white;display:flex;align-items:center;justify-content:center}
        .qr-title{font-family:var(--font-montserrat),sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;color:#1b4332;text-align:center}
        .qr-sub{font-family:var(--font-montserrat),sans-serif;font-size:8px;color:#4a5e52;text-align:center;line-height:1.5;letter-spacing:.04em}
        .qr-id{font-family:var(--font-montserrat),sans-serif;font-size:8px;font-weight:600;color:#2d6a4f;letter-spacing:.08em}
        .sig-col{display:flex;flex-direction:column;align-items:center;width:200px}
        .sig-script{font-family:var(--font-great-vibes),cursive;font-size:44px;color:#1b4332;line-height:1.1;text-align:center}
        .sig-name{font-family:var(--font-montserrat),sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;color:#1b4332;text-align:center;text-transform:uppercase}
        .sig-role{font-family:var(--font-montserrat),sans-serif;font-size:9px;letter-spacing:.08em;color:#4a5e52;text-align:center}
        .bottom-bar{width:100%;display:flex;align-items:center;justify-content:center;gap:18px;margin-top:28px;padding-top:14px;border-top:.5px solid #b5995a}
        .info-txt{font-family:var(--font-montserrat),sans-serif;font-size:8.5px;font-weight:600;letter-spacing:.12em;color:#2d6a4f;text-transform:uppercase}
        .info-sep{color:#b5995a;font-size:10px}
        @media (max-width:980px){.cert{width:100%;min-height:auto}.recipient{font-size:64px}.name-rule{width:100%}.content{padding:30px 24px}}
      `}</style>
    </>
  );
}

