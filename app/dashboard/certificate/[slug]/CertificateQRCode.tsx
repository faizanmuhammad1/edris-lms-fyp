"use client";

import { QRCodeSVG } from "qrcode.react";
import { verificationPortalUrl } from "@/lib/verification-portal-url";

const FG = "#1B4332";

/** Encodes the public verification portal (IPFS by default); not tied to per-cert DB `qrData`. */
export function CertificateQRCode({ size = 100 }: { size?: number }) {
  return (
    <QRCodeSVG
      value={verificationPortalUrl()}
      size={size}
      level="M"
      fgColor={FG}
      bgColor="#ffffff"
      includeMargin={false}
    />
  );
}
