/** Small display helpers shared by server and client components. */

export function formatPricePerHour(cents: number): string {
  const dollars = cents / 100;
  return `$${Number.isInteger(dollars) ? dollars.toFixed(0) : dollars.toFixed(2)}/hr`;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export function formatSlotRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  return `${dateTimeFmt.format(start)} – ${timeFmt.format(end)}`;
}

/** Total price in cents for a time range at an hourly rate. */
export function totalCentsForRange(
  pricePerHourCents: number,
  startsAt: string,
  endsAt: string,
): number {
  const hours =
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3_600_000;
  return Math.round(pricePerHourCents * hours);
}
