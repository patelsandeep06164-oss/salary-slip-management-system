const cron = require("node-cron");
const emailService = require("../services/emailService");
const Notification = require("../models/Notification");

const retryFailedEmailsJob = cron.schedule(
  "*/15 * * * *",
  async () => {
    console.log("[Retry Failed Emails] Started");

    try {
      if (typeof emailService.retryFailedEmails !== "function") {
        throw new Error(
          "emailService.retryFailedEmails is not exported. Check emailService.js."
        );
      }

      const result = await emailService.retryFailedEmails();

      const checked = Number(result?.checked || 0);
      const sent = Number(result?.sent || 0);
      const failed = Number(result?.failed || 0);

      console.log(
        `[Retry Failed Emails] Completed. Checked: ${checked}, Sent: ${sent}, Failed: ${failed}`
      );

      // Avoid creating notifications when there was nothing to retry.
      if (checked > 0) {
        const now = new Date();
        const batchKey =
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-` +
          `${String(now.getDate()).padStart(2, "0")}-` +
          `${String(now.getHours()).padStart(2, "0")}-` +
          `${String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, "0")}`;

        let type = "success";
        let title = "Email Retry Completed";

        if (failed > 0 && sent > 0) {
          type = "warning";
          title = "Some Emails Still Failed";
        } else if (failed > 0 && sent === 0) {
          type = "error";
          title = "Email Retry Failed";
        }

        await Notification.findOneAndUpdate(
          { dedupeKey: `email-retry:${batchKey}` },
          {
            $set: {
              title,
              message:
                `Email retry batch completed. Checked: ${checked}, ` +
                `sent successfully: ${sent}, still failed: ${failed}.`,
              type,
              category: "email",
              isRead: false,
              readAt: null,
              metadata: {
                checked,
                sent,
                failed,
                batchKey,
              },
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      }
    } catch (error) {
      console.error("[Retry Failed Emails] Failed:", error.message);

      try {
        const now = new Date();
        const batchKey =
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-` +
          `${String(now.getDate()).padStart(2, "0")}-` +
          `${String(now.getHours()).padStart(2, "0")}-` +
          `${String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, "0")}`;

        await Notification.findOneAndUpdate(
          { dedupeKey: `email-retry-job-error:${batchKey}` },
          {
            $set: {
              title: "Email Retry Job Failed",
              message:
                "The scheduled email retry job could not complete. Check backend logs for details.",
              type: "error",
              category: "email",
              isRead: false,
              readAt: null,
              metadata: {
                batchKey,
                error: String(error.message || "Unknown error").slice(0, 500),
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
          "[Retry Failed Emails] Could not save failure notification:",
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

module.exports = retryFailedEmailsJob;
