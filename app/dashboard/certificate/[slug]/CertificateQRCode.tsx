"use client";

import { QRCodeSVG } from "qrcode.react";

const FG = "#1B4332";

export function CertificateQRCode({
  url,
  size = 100,
}: {
  url: string;
  size?: number;
}) {
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level="M"
      fgColor={FG}
      bgColor="#ffffff"
      includeMargin={false}
    />
  );
}
