import "server-only";

import { P12Signer } from "@signpdf/signer-p12";
import signpdf from "@signpdf/signpdf";
import { pdflibAddPlaceholder } from "@signpdf/placeholder-pdf-lib";
import { PDFDocument } from "pdf-lib";
import {
  SUBFILTER_ETSI_CADES_DETACHED,
  DEFAULT_SIGNATURE_LENGTH,
} from "@signpdf/utils";

import { env } from "@/lib/env";

function getSigningMaterials() {
  const p12Base64 = env.SIGNING_CERT_P12_BASE64;
  if (!p12Base64) {
    throw new Error(
      "PDF signing not configured: set SIGNING_CERT_P12_BASE64 in server env."
    );
  }

  const p12Password = env.SIGNING_CERT_P12_PASSWORD;
  const p12Buffer = Buffer.from(p12Base64, "base64");

  return {
    p12Buffer,
    p12Password,
    signerName: env.SIGNING_SIGNER_NAME,
    signerLocation: env.SIGNING_SIGNER_LOCATION,
    signerContact: env.SIGNING_SIGNER_CONTACT,
  };
}

export async function signPdfBytes(pdfBytes: Buffer): Promise<Buffer> {
  const {
    p12Buffer,
    p12Password,
    signerName,
    signerLocation,
    signerContact,
  } = getSigningMaterials();

  // 1) Add a signature placeholder to make the PDF signable.
  const pdfDoc = await PDFDocument.load(pdfBytes);
  // IMPORTANT:
  // Placeholder length must accommodate the final CMS signature bytes.
  // Using the P12 bundle size is incorrect and often too small.
  // Use a safe fixed value (>= DEFAULT_SIGNATURE_LENGTH).
  const signatureLength = Math.max(DEFAULT_SIGNATURE_LENGTH, 16384);

  pdflibAddPlaceholder({
    pdfDoc,
    reason: "Edris LMS certificate of completion",
    contactInfo: signerContact,
    name: signerName,
    location: signerLocation,
    signingTime: new Date(),
    signatureLength,
    subFilter: SUBFILTER_ETSI_CADES_DETACHED,
  });

  const pdfWithPlaceholder = await pdfDoc.save();

  // 2) Sign using the P12 signer.
  const signerOptions = {
    asn1StrictParsing: true,
    ...(p12Password ? { passphrase: p12Password } : {}),
  };

  let signer: P12Signer;
  try {
    signer = new P12Signer(p12Buffer, signerOptions);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(
      message.includes("MAC could not be verified")
        ? "Invalid P12 password. Check SIGNING_CERT_P12_PASSWORD (or remove it if your P12 has no password)."
        : `Failed to initialize PDF signer: ${message}`
    );
  }

  // signpdf returns signed PDF bytes.
  return await signpdf.sign(pdfWithPlaceholder, signer, new Date());
}

