/** Currency display helper — default NGN until business config is finalized. */
export type Currency = string;

export function formatMoney(amount: string | number, currency = "NGN") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} —`;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency === "NGN" ? "NGN" : currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
