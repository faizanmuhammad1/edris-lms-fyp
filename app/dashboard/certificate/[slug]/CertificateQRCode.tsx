"use client";

import { QRCodeSVG } from "qrcode.react";

const FG = "#1B4332";

export function CertificateQRCode({
  qrData,
  fallbackUrl,
  size = 100,
}: {
  qrData?: string | null;
  fallbackUrl: string;
  size?: number;
}) {
  return (
    <QRCodeSVG
      value={qrData ?? fallbackUrl}
      size={size}
      level="M"
      fgColor={FG}
      bgColor="#ffffff"
      includeMargin={false}
    />
  );
}
