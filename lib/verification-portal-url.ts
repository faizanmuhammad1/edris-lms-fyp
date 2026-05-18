/** Default IPFS-hosted certificate verification UI linked from marketing pages and QR payloads. */
export const DEFAULT_VERIFICATION_PORTAL_URL =
  "https://bafkreiegsvuyuuln66japghhis5m5st3mqv667ncot3q53hpd6wiq3qezi.ipfs.inbrowser.link/";

export function verificationPortalUrl(): string {
  return process.env.NEXT_PUBLIC_IPFS_VERIFY_URL ?? DEFAULT_VERIFICATION_PORTAL_URL;
}

export function verificationPortalLinkProps(href: string) {
  return href.startsWith("http")
    ? ({ target: "_blank" as const, rel: "noopener noreferrer" as const })
    : {};
}
