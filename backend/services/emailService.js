
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const {
  transporter,
  isMailerConfigured,
  getEmailFrom,
} = require("../config/mailer");

const EmailLog = require("../models/EmailLog");
const SalarySlip = require("../models/SalarySlip");
const Employee = require("../models/Employee");
const CompanySettings = require("../models/CompanySettings");

const MAX_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 5 * 60 * 1000;
const EMAIL_LOCK_DURATION_MS = 30 * 60 * 1000;

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

const getRetryDate = (attempts) => {
  const delay = Math.min(
    BASE_RETRY_DELAY_MS *
      Math.pow(2, Math.max(0, attempts - 1)),
    24 * 60 * 60 * 1000
  );

  return new Date(Date.now() + delay);
};

// Atomically claim one EmailLog.
// Only one process can successfully claim the same log.
const claimEmailLog = async (emailLogId) => {
  const now = new Date();
  const lockToken = crypto.randomUUID();

  const emailLog = await EmailLog.findOneAndUpdate(
    {
      _id: emailLogId,
      status: { $in: ["queued", "failed"] },
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        { lockExpiresAt: null },
        { lockExpiresAt: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "queued",
        lockToken,
        lockedAt: now,
        lockExpiresAt: new Date(
          now.getTime() + EMAIL_LOCK_DURATION_MS
        ),
        lastAttemptAt: now,
        nextRetryAt: null,
      },
      $inc: {
        attempts: 1,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("+lockToken");

  if (!emailLog) {
    const existing = await EmailLog.findById(emailLogId);

    if (!existing) {
      throw createError("Email log was not found.", 404);
    }

    if (existing.status === "sent") {
      return {
        alreadySent: true,
        emailLog: existing,
      };
    }

    if (existing.attempts >= MAX_ATTEMPTS) {
      throw createError(
        "Maximum email retry attempts reached.",
        400
      );
    }

    throw createError(
      "This email is already being processed. Try again later.",
      409
    );
  }

  return {
    emailLog,
    lockToken,
    alreadySent: false,
  };
};

// Release a claimed log after a confirmed pre-send failure.
const markEmailLogFailed = async ({
  emailLog,
  lockToken,
  error,
}) => {
  const attempts = emailLog.attempts || 0;

  return EmailLog.updateOne(
    {
      _id: emailLog._id,
      lockToken,
      status: "queued",
    },
    {
      $set: {
        status: "failed",
        errorMessage: String(
          error.message || "Email sending failed."
        ).slice(0, 2000),
        nextRetryAt:
          attempts >= MAX_ATTEMPTS
            ? null
            : getRetryDate(attempts),
      },
      $unset: {
        lockToken: 1,
        lockedAt: 1,
        lockExpiresAt: 1,
      },
    }
  );
};

// Update SalarySlip status without changing PDF generation status.
const updateSalarySlipEmailStatus = async (
  salarySlipId,
  success,
  errorMessage = ""
) => {
  const update = success
    ? {
        $set: {
          emailStatus: "sent",
          status: "emailed",
          emailSentAt: new Date(),
          lastEmailError: "",
        },
        $inc: {
          emailAttempts: 1,
        },
      }
    : {
        $set: {
          emailStatus: "failed",
          lastEmailError: String(
            errorMessage || "Email sending failed."
          ).slice(0, 2000),
        },
        $inc: {
          emailAttempts: 1,
        },
      };

  try {
    await SalarySlip.updateOne(
      { _id: salarySlipId },
      update
    );
  } catch (error) {
    console.error(
      "[EmailService] SalarySlip email status update failed:",
      error.message
    );
  }
};

// Reconcile an already-sent EmailLog with its SalarySlip.
// This does not increment emailAttempts again.
const reconcileSentSalarySlip = async (salarySlipId) => {
  try {
    await SalarySlip.updateOne(
      { _id: salarySlipId },
      {
        $set: {
          emailStatus: "sent",
          status: "emailed",
          lastEmailError: "",
        },
      }
    );
  } catch (error) {
    console.error(
      "[EmailService] Sent email reconciliation failed:",
      error.message
    );
  }
};

// Send an email using an already claimed EmailLog.
const sendLoggedEmail = async ({
  emailLog,
  lockToken,
  employee,
  salarySlip,
  pdfPath,
  companyName = "Your Company",
}) => {
  let smtpAccepted = false;

  try {
    if (!employee?.email) {
      throw createError(
        "Employee email address is missing.",
        400
      );
    }

    if (!salarySlip?._id) {
      throw createError(
        "Salary slip record is missing.",
        400
      );
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw createError(
        "Salary slip PDF file was not found.",
        404
      );
    }

    if (!isMailerConfigured || !transporter) {
      throw createError(
        "SMTP is not configured. Email cannot be sent.",
        503
      );
    }

    const recipient = employee.email.trim().toLowerCase();

    const fullName = [
      employee.firstName,
      employee.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const subject =
      `Your Salary Slip - ${salarySlip.month}/${salarySlip.year}`;

    // Verify that this process still owns the lock.
    const lockCheck = await EmailLog.findOne({
      _id: emailLog._id,
      lockToken,
      status: "queued",
    }).select("_id");

    if (!lockCheck) {
      throw createError(
        "Email processing lock was lost.",
        409
      );
    }

    const result = await transporter.sendMail({
      from: getEmailFrom(),
      to: recipient,
      subject,

      text:
        `Hello ${fullName || "Employee"},\n\n` +
        `Please find your salary slip for ` +
        `${salarySlip.month}/${salarySlip.year} attached.\n\n` +
        `Regards,\n${companyName}`,

      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#243047">
          <h2>${escapeHtml(companyName)}</h2>
          <p>Hello ${escapeHtml(fullName || "Employee")},</p>
          <p>
            Your salary slip for
            <strong>${escapeHtml(
              `${salarySlip.month}/${salarySlip.year}`
            )}</strong>
            is attached to this email.
          </p>
          <p>Please keep the attached PDF for your records.</p>
          <p>Regards,<br>${escapeHtml(companyName)}</p>
        </div>
      `,

      attachments: [
        {
          filename: path.basename(pdfPath),
          path: pdfPath,
          contentType: "application/pdf",
        },
      ],
    });

    const acceptedRecipients = Array.isArray(result.accepted)
      ? result.accepted.map((email) =>
          String(email).toLowerCase()
        )
      : [];

    const rejectedRecipients = Array.isArray(result.rejected)
      ? result.rejected.map((email) =>
          String(email).toLowerCase()
        )
      : [];

    if (
      !acceptedRecipients.includes(recipient) ||
      rejectedRecipients.includes(recipient)
    ) {
      throw createError(
        "SMTP did not accept the salary slip recipient.",
        502
      );
    }

    smtpAccepted = true;

    console.log("========== SMTP EMAIL RESULT ==========");
    console.log("Email Log ID:", String(emailLog._id));
    console.log("Recipient:", recipient);
    console.log("SMTP messageId:", result.messageId);
    console.log("SMTP accepted:", result.accepted);
    console.log("SMTP rejected:", result.rejected);
    console.log("SMTP response:", result.response);
    console.log("=======================================");

    // Mark sent only if this process still owns the lock.
    const updateResult = await EmailLog.updateOne(
      {
        _id: emailLog._id,
        lockToken,
        status: "queued",
      },
      {
        $set: {
          status: "sent",
          recipient,
          subject,
          sentAt: new Date(),
          errorMessage: "",
          nextRetryAt: null,
        },
        $unset: {
          lockToken: 1,
          lockedAt: 1,
          lockExpiresAt: 1,
        },
      }
    );

    if (updateResult.modifiedCount !== 1) {
      // SMTP already accepted the message.
      // Do not mark this log failed or immediately retry it.
      console.error(
        "[EmailService] SMTP accepted email, but sent status could not be confirmed.",
        String(emailLog._id)
      );

      return {
        success: true,
        statusUnconfirmed: true,
        message:
          "SMTP accepted the email. Database confirmation is pending; do not send it again automatically.",
        messageId: result.messageId,
        emailLogId: emailLog._id,
      };
    }

    return {
      success: true,
      message: "Salary slip email sent successfully.",
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
      emailLogId: emailLog._id,
    };
  } catch (error) {
    // If SMTP accepted the message, do not mark it failed.
    // Keep the lock until expiry for manual investigation.
    if (smtpAccepted) {
      error.smtpAcceptedBySmtp = true;

      console.error(
        "[EmailService] SMTP accepted email but final confirmation failed:",
        error.message
      );

      throw error;
    }

    try {
      await markEmailLogFailed({
        emailLog,
        lockToken,
        error,
      });
    } catch (saveError) {
      console.error(
        "[EmailService] Failed to save email failure status:",
        saveError.message
      );
    }

    console.error("Salary slip email failed:", {
      emailLogId: String(emailLog._id),
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });

    throw error;
  }
};

// Send a salary slip email.
// Reuse the unique existing EmailLog.
// Send a salary slip email.
// Reuse the unique existing EmailLog.
const sendSalarySlipEmail = async ({
  employee,
  salarySlip,
  pdfPath,
  companyName = "Your Company",
}) => {
  if (!employee?.email) {
    throw createError("Employee email address is missing.", 400);
  }

  if (!salarySlip?._id) {
    throw createError("Salary slip record is required.", 400);
  }

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    throw createError("Salary slip PDF file was not found.", 404);
  }

  const recipient = employee.email.trim().toLowerCase();

  const subject =
    `Your Salary Slip - ${salarySlip.month}/${salarySlip.year}`;

  let emailLog = await EmailLog.findOne({
    salarySlip: salarySlip._id,
    emailType: "salary-slip",
  }).sort({ createdAt: -1 });

  if (emailLog?.status === "sent") {
    await reconcileSentSalarySlip(salarySlip._id);

    return {
      success: true,
      message: "This salary slip has already been emailed.",
      emailLogId: emailLog._id,
    };
  }

  if (emailLog && emailLog.attempts >= MAX_ATTEMPTS) {
    throw createError("Maximum email retry attempts reached.", 400);
  }

  if (!emailLog) {
    try {
      emailLog = await EmailLog.create({
        employee: employee._id,
        salarySlip: salarySlip._id,
        recipient,
        subject,
        emailType: "salary-slip",
        status: "queued",
        attempts: 0,
      });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      emailLog = await EmailLog.findOne({
        salarySlip: salarySlip._id,
        emailType: "salary-slip",
      });

      if (!emailLog) {
        throw error;
      }
    }
  }

  if (emailLog.status === "sent") {
    await reconcileSentSalarySlip(salarySlip._id);

    return {
      success: true,
      message: "This salary slip has already been emailed.",
      emailLogId: emailLog._id,
    };
  }

  const claim = await claimEmailLog(emailLog._id);

  if (claim.alreadySent) {
    await reconcileSentSalarySlip(salarySlip._id);

    return {
      success: true,
      message: "This salary slip has already been emailed.",
      emailLogId: emailLog._id,
    };
  }

  claim.emailLog.employee = employee._id;
  claim.emailLog.recipient = recipient;
  claim.emailLog.subject = subject;

  try {
    const result = await sendLoggedEmail({
      emailLog: claim.emailLog,
      lockToken: claim.lockToken,
      employee,
      salarySlip,
      pdfPath,
      companyName,
    });

    // SMTP accepted the email but EmailLog confirmation is pending.
    if (result?.statusUnconfirmed) {
      await SalarySlip.updateOne(
        { _id: salarySlip._id },
        {
          $inc: { emailAttempts: 1 },
          $set: {
            emailStatus: "pending",
            lastEmailError:
              "SMTP accepted the email, but database confirmation is pending.",
          },
        }
      );

      return result;
    }

    // Confirmed successful email: increment exactly once.
    await updateSalarySlipEmailStatus(salarySlip._id, true);

    return result;
  } catch (error) {
    if (error.smtpAcceptedBySmtp) {
      // SMTP accepted the message. Do not mark it failed.
      try {
        await SalarySlip.updateOne(
          { _id: salarySlip._id },
          {
            $inc: { emailAttempts: 1 },
            $set: {
              emailStatus: "pending",
              lastEmailError: String(error.message).slice(0, 2000),
            },
          }
        );
      } catch (saveError) {
        console.error(
          "[EmailService] Could not record uncertain email attempt:",
          saveError.message
        );
      }

      throw error;
    }

    // Normal delivery failure: increment exactly once.
    await updateSalarySlipEmailStatus(
      salarySlip._id,
      false,
      error.message
    );

    throw error;
  }
};

// Retry an existing failed or stale queued salary slip email.
const retryEmailLog = async (emailLogId) => {
  const existingLog = await EmailLog.findById(emailLogId);

  if (!existingLog) {
    throw createError("Email log was not found.", 404);
  }

  if (
    existingLog.emailType !== "salary-slip" ||
    !existingLog.salarySlip
  ) {
    throw createError(
      "This email log cannot be retried.",
      400
    );
  }

  if (existingLog.status === "sent") {
    await reconcileSentSalarySlip(existingLog.salarySlip);

    return {
      success: true,
      message: "This email has already been sent.",
      emailLogId: existingLog._id,
    };
  }

  // Do not automatically resend stale queued emails.
// SMTP may already have accepted the previous message.
if (existingLog.status === "queued") {
  throw createError(
    "This email is queued with an uncertain delivery status. Manual verification is required before retrying.",
    409
  );
}

if (existingLog.status !== "failed") {
  throw createError(
    "Only failed salary slip emails can be retried.",
    400
  );
}

  const claim = await claimEmailLog(emailLogId);

  if (claim.alreadySent) {
    await reconcileSentSalarySlip(existingLog.salarySlip);

    return {
      success: true,
      message: "This email has already been sent.",
      emailLogId: existingLog._id,
    };
  }

  const emailLog = claim.emailLog;
  const lockToken = claim.lockToken;

  let salarySlip = null;

  try {
    salarySlip = await SalarySlip.findById(
      emailLog.salarySlip
    ).select("+pdfPath");

    if (!salarySlip) {
      throw createError(
        "Salary slip record was not found.",
        404
      );
    }

    const employee = await Employee.findById(
      salarySlip.employee
    );

    if (!employee) {
      throw createError(
        "Employee record was not found.",
        404
      );
    }

    const settings = await CompanySettings.findOne();
    const companyName =
      settings?.companyName || "Your Company";

    const result = await sendLoggedEmail({
      emailLog,
      lockToken,
      employee,
      salarySlip,
      pdfPath: salarySlip.pdfPath,
      companyName,
    });

    // SMTP accepted the email. Update SalarySlip independently.
    await updateSalarySlipEmailStatus(
      salarySlip._id,
      true
    );

    return result;
  } catch (error) {
    if (salarySlip) {
      if (error.smtpAcceptedBySmtp) {
        // Delivery may have succeeded. Do not mark failed.
        try {
          await SalarySlip.updateOne(
            { _id: salarySlip._id },
            {
              $inc: { emailAttempts: 1 },
              $set: {
                lastEmailError: String(error.message).slice(
                  0,
                  2000
                ),
              },
            }
          );
        } catch (saveError) {
          console.error(
            "[EmailService] Could not record uncertain email attempt:",
            saveError.message
          );
        }
      } else {
        await updateSalarySlipEmailStatus(
          salarySlip._id,
          false,
          error.message
        );
      }
    } else {
      // Failure occurred before SalarySlip was loaded.
      try {
        await markEmailLogFailed({
          emailLog,
          lockToken,
          error,
        });
      } catch (saveError) {
        console.error(
          "[EmailService] Could not release failed email lock:",
          saveError.message
        );
      }
    }

    throw error;
  }
};

// Retry failed salary slip emails whose retry time has arrived.
const retryFailedEmails = async () => {
  const now = new Date();

  const failedLogs = await EmailLog.find({
    status: "failed",
    emailType: "salary-slip",
    salarySlip: { $ne: null },
    attempts: { $lt: MAX_ATTEMPTS },
    nextRetryAt: { $lte: now },
  })
    .sort({ nextRetryAt: 1, createdAt: 1 })
    .limit(50);

  const summary = {
    checked: failedLogs.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const log of failedLogs) {
    try {
      const result = await retryEmailLog(log._id);

      if (result?.success) {
        summary.sent += 1;
      } else {
        summary.skipped += 1;
      }
    } catch (error) {
      if (error.statusCode === 409) {
        summary.skipped += 1;
      } else {
        summary.failed += 1;
      }

      console.error(
        `Email retry failed for log ${log._id}:`,
        error.message
      );
    }
  }

  console.log("Failed email retry summary:", summary);

  return summary;
};

module.exports = {
  sendSalarySlipEmail,
  retryEmailLog,
  retryFailedEmails,
};
