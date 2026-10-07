/** Formatting helpers shared by teacher pages (safe on server and client). */

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Course.price is stored as whole US dollars. */
export function formatCoursePrice(price: number | null | undefined): string {
  if (!price) return "Free";
  return currency.format(price);
}

/** Amount in dollars (e.g. enrollment amount already converted from cents). */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}

// Fixed locale + time zone so server-rendered and hydrated text always match.
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

export function formatDate(value: Date | string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: Date | string): string {
  return dateTimeFormatter.format(new Date(value));
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
