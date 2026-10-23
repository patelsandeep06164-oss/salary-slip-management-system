
const cron = require("node-cron");
const salarySlipService = require("../services/salarySlipService");

const monthlySalarySlipEmailJob = cron.schedule(
  "0 9 1 * *",
  async () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
    }).formatToParts(new Date());

    const getPart = (type) =>
      Number(parts.find((item) => item.type === type)?.value);

    const currentMonth = getPart("month");
    const currentYear = getPart("year");

    // First day of the month: process the previous month's slips.
    const month = currentMonth === 1 ? 12 : currentMonth - 1;
    const year = currentMonth === 1 ? currentYear - 1 : currentYear;

    console.log(
      `[Monthly Salary Slip Email] Started for ${month}/${year}`
    );

    try {
      if (
        typeof salarySlipService
          .generateAndEmailMonthlySalarySlips !== "function"
      ) {
        throw new Error(
          "generateAndEmailMonthlySalarySlips is missing from salarySlipService.js."
        );
      }

      const result =
        await salarySlipService.generateAndEmailMonthlySalarySlips(
          month,
          year
        );

      console.log(
        `[Monthly Salary Slip Email] Completed for ${month}/${year}`,
        result
      );
    } catch (error) {
      console.error(
        `[Monthly Salary Slip Email] Failed for ${month}/${year}:`,
        error.message
      );
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);

module.exports = monthlySalarySlipEmailJob;
