const DEFAULT_CURRENCY = "INR";
const DEFAULT_LOCALE = "en-IN";

export function formatCurrency(
  amount,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
) {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}

export function formatCompactCurrency(
  amount,
  currency = DEFAULT_CURRENCY,
  locale = DEFAULT_LOCALE
) {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(numericAmount);
  } catch {
    return formatCurrency(numericAmount, currency, locale);
  }
}

export function formatNumber(
  value,
  locale = DEFAULT_LOCALE,
  maximumFractionDigits = 2
) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits,
    }).format(numericValue);
  } catch {
    return String(numericValue);
  }
}

export function parseCurrency(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const cleanedValue = value
    .replace(/[,\s₹$€£]/g, "")
    .replace(/^\((.*)\)$/, "-$1");

  const numericValue = Number(cleanedValue);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export default formatCurrency;