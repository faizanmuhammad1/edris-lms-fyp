/** Default IPFS-hosted certificate verification UI linked from marketing pages and QR payloads. */
export const DEFAULT_VERIFICATION_PORTAL_URL =
  "https://ipfs.io/ipfs/bafkreigeh2wbbvlow7srl54mna2ehqgcg4vkqf6gpsl6sh3a4nxenc2uay";

export function verificationPortalUrl(): string {
  return process.env.NEXT_PUBLIC_IPFS_VERIFY_URL ?? DEFAULT_VERIFICATION_PORTAL_URL;
}

export function verificationPortalLinkProps(href: string) {
  return href.startsWith("http")
    ? ({ target: "_blank" as const, rel: "noopener noreferrer" as const })
    : {};
}
