/**
 * Display formatters shared by the admin area.
 *
 * Units: `Enrollment.amount` is stored in CENTS (Stripe `amount_total`), while
 * `Course.price` is stored in WHOLE currency units. Use the matching helper so
 * amounts are never divided twice.
 */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-US");

/** Formats an amount stored in cents, e.g. 12999 -> "$129.99". */
export function formatCents(cents: number | null | undefined): string {
  return currencyFormatter.format((cents ?? 0) / 100);
}

/** Formats an amount stored in whole currency units, e.g. 129 -> "$129.00". */
export function formatCurrency(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0);
}

/** Short currency for chart axes, from cents, e.g. 1250000 -> "$12.5K". */
export function formatCentsCompact(cents: number | null | undefined): string {
  return compactCurrencyFormatter.format((cents ?? 0) / 100);
}

/** Course price (whole units); 0 means free. */
export function formatPrice(price: number | null | undefined): string {
  return !price ? "Free" : formatCurrency(price);
}

/** Thousands separators, e.g. 12345 -> "12,345". */
export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(value ?? 0);
}

/** "3 courses" / "1 course". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Up to two initials for avatar fallbacks. */
export function getInitials(name: string | null | undefined): string {
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "?";
}
