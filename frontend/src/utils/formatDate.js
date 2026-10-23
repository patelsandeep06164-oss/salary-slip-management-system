const DEFAULT_LOCALE = "en-IN";

function toValidDate(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  let date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    // Numeric values are treated as Unix timestamps in milliseconds.
    date = new Date(value);
  } else if (typeof value === "string") {
    // Parse date-only strings as local calendar dates.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      date = new Date(year, month - 1, day);

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
      ) {
        return null;
      }
    } else {
      date = new Date(value);
    }
  } else {
    return null;
  }

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value, options = {}) {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    dateStyle = "medium",
    ...otherOptions
  } = options;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      ...otherOptions,
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatTime(value, options = {}) {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    ...otherOptions
  } = options;

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      ...otherOptions,
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatDateTime(value, options = {}) {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  const {
    locale = DEFAULT_LOCALE,
    ...otherOptions
  } = options;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      ...otherOptions,
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatMonthYear(
  value,
  locale = DEFAULT_LOCALE
) {
  const date = toValidDate(value);

  if (!date) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

export function formatDateForInput(value) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDate() {
  return formatDateForInput(new Date());
}

export function getMonthStartDate(value = new Date()) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

export function getMonthEndDate(value = new Date()) {
  const date = toValidDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const month = String(monthIndex + 1).padStart(2, "0");

  return `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
}

export function getDateDifferenceInDays(startDate, endDate) {
  const start = toValidDate(startDate);
  const end = toValidDate(endDate);

  if (!start || !end) {
    return null;
  }

  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endUtc = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.round((endUtc - startUtc) / 86400000);
}

export function isValidDate(value) {
  return toValidDate(value) !== null;
}

export default formatDate;