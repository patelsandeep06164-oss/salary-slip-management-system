const formatDate = (date, options = {}) => {
  if (date === null || date === undefined || date === "") {
    return "";
  }

  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new TypeError("Invalid date provided to formatDate.");
  }

  const {
    locale = "en-IN",
    timeZone = "Asia/Kolkata",
    includeTime = false,
  } = options;

  const formatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  };

  if (includeTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";
    formatOptions.hour12 = true;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(parsedDate);
};

module.exports = formatDate;
