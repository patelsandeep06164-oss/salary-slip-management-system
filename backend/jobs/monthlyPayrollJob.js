
const cron = require("node-cron");
const payrollService = require("../services/payrollService");
const Notification = require("../models/Notification");

const monthlyPayrollJob = cron.schedule(
  "0 1 1 * *",
  async () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());

    const part = (type) =>
      Number(parts.find((item) => item.type === type)?.value);

    const currentMonth = part("month");
    const currentYear = part("year");

    const month = currentMonth === 1 ? 12 : currentMonth - 1;
    const year = currentMonth === 1 ? currentYear - 1 : currentYear;

    const period = `${month}/${year}`;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    console.log(`[Monthly Payroll] Started for ${period}`);

    try {
      if (
        typeof payrollService.generateMonthlyPayroll !== "function"
      ) {
        throw new Error(
          "generateMonthlyPayroll is missing from payrollService.js."
        );
      }

      const result = await payrollService.generateMonthlyPayroll({
        month,
        year,
      });

      const successful = Number(result?.successful || 0);
      const skipped = Number(result?.skipped || 0);
      const failed = Number(result?.failed || 0);
      const total = Number(result?.total || 0);

      let type = "success";
      let title = "Monthly Payroll Generated";

      let message =
        `Payroll generation for ${period} completed. ` +
        `Generated: ${successful}, skipped: ${skipped}, failed: ${failed}.`;

      if (failed > 0 && successful > 0) {
        type = "warning";
        title = "Monthly Payroll Partially Completed";
      } else if (failed > 0 && successful === 0) {
        type = "error";
        title = "Monthly Payroll Failed";
      } else if (total === 0 || successful === 0) {
        type = "info";
        title = "Monthly Payroll Update";

        message =
          `Payroll generation for ${period} completed. ` +
          `No new payroll records were generated. ` +
          `Skipped: ${skipped}, failed: ${failed}.`;
      }

      await Notification.create({
        title,
        message,
        type,
        category: "payroll",
        dedupeKey: `monthly-payroll:${monthKey}`,
        metadata: {
          month,
          year,
          total,
          successful,
          skipped,
          failed,
        },
      });

      console.log(
        `[Monthly Payroll] Completed for ${period}. ` +
        `Generated: ${successful}, skipped: ${skipped}, failed: ${failed}`
      );
    } catch (error) {
      console.error("[Monthly Payroll] Failed:", error.message);

      try {
        await Notification.findOneAndUpdate(
          {
            dedupeKey: `monthly-payroll-job-failure:${monthKey}`,
          },
          {
            $set: {
              title: "Monthly Payroll Job Failed",
              message:
                `Payroll generation for ${period} could not complete. ` +
                "Check the backend logs for details.",
              type: "error",
              category: "payroll",
              isRead: false,
              readAt: null,
              metadata: {
                month,
                year,
                error: String(
                  error.message || "Unknown error"
                ).slice(0, 500),
              },
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      } catch (notificationError) {
        console.error(
          "[Monthly Payroll] Could not save failure notification:",
          notificationError.message
        );
      }
    }
  },
  {
    scheduled: false,
    timezone: "Asia/Kolkata",
  }
);

module.exports = monthlyPayrollJob;
