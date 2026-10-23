const formatCurrency = (
  amount,
  currency = "INR",
  locale = "en-IN"
) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    throw new TypeError("Amount must be a valid number.");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

module.exports = formatCurrency;
