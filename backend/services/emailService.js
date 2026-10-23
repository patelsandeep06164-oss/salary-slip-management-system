
const fs = require("fs");
const path = require("path");

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
    BASE_RETRY_DELAY_MS * Math.pow(2, Math.max(0, attempts - 1)),
    24 * 60 * 60 * 1000
  );

  return new Date(Date.now() + delay);
};

const sendLoggedEmail = async ({
  emailLog,
  employee,
  salarySlip,
  pdfPath,
  companyName = "Your Company",
}) => {
  emailLog.status = "queued";
  emailLog.attempts = (emailLog.attempts || 0) + 1;
  emailLog.lastAttemptAt = new Date();
  await emailLog.save();

  try {
    if (!employee?.email) {
      throw createError("Employee email address is missing.", 400);
    }

    if (!salarySlip?._id) {
      throw createError("Salary slip record is missing.", 400);
    }

    if (!pdfPath || !fs.existsSync(pdfPath)) {
      throw createError("Salary slip PDF file was not found.", 404);
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

    emailLog.recipient = recipient;
    emailLog.subject = subject;
    await emailLog.save();

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
      ? result.accepted
      : [];

    const rejectedRecipients = Array.isArray(result.rejected)
      ? result.rejected.map((email) => email.toLowerCase())
      : [];

    if (
      acceptedRecipients.length === 0 ||
      rejectedRecipients.includes(recipient)
    ) {
      throw createError(
        "SMTP did not accept the salary slip recipient.",
        502
      );
    }

    console.log("========== SMTP EMAIL RESULT ==========");
    console.log("Email Log ID:", String(emailLog._id));
    console.log("Recipient:", recipient);
    console.log("SMTP messageId:", result.messageId);
    console.log("SMTP accepted:", result.accepted);
    console.log("SMTP rejected:", result.rejected);
    console.log("SMTP response:", result.response);
    console.log("=======================================");

    emailLog.status = "sent";
    emailLog.sentAt = new Date();
    emailLog.errorMessage = undefined;
    emailLog.nextRetryAt = undefined;

    await emailLog.save();

    return {
      success: true,
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
      response: result.response,
      emailLogId: emailLog._id,
    };
  } catch (error) {
    emailLog.status = "failed";

    emailLog.errorMessage = String(
      error.message || "Email sending failed."
    ).slice(0, 2000);

    if (emailLog.attempts >= MAX_ATTEMPTS) {
      emailLog.nextRetryAt = undefined;
    } else {
      emailLog.nextRetryAt = getRetryDate(emailLog.attempts);
    }

    await emailLog.save();

    console.error("Salary slip email failed:", {
      emailLogId: String(emailLog._id),
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    });

    throw error;
  }
};

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

  const emailLog = await EmailLog.create({
    employee: employee._id,
    salarySlip: salarySlip._id,
    recipient,
    subject,
    emailType: "salary-slip",
    status: "queued",
    attempts: 0,
  });

  return sendLoggedEmail({
    emailLog,
    employee,
    salarySlip,
    pdfPath,
    companyName,
  });
};

const retryEmailLog = async (emailLogId) => {
  const emailLog = await EmailLog.findById(emailLogId);

  if (!emailLog) {
    throw createError("Email log was not found.", 404);
  }

  if (
    emailLog.emailType !== "salary-slip" ||
    !emailLog.salarySlip
  ) {
    throw createError(
      "This email log cannot be retried.",
      400
    );
  }

  if (emailLog.status === "sent") {
    return {
      success: true,
      message: "This email has already been sent.",
      emailLogId: emailLog._id,
    };
  }

  if (emailLog.attempts >= MAX_ATTEMPTS) {
    throw createError(
      "Maximum email retry attempts reached.",
      400
    );
  }

  const salarySlip = await SalarySlip.findById(
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
    throw createError("Employee record was not found.", 404);
  }

  const settings = await CompanySettings.findOne();
  const companyName = settings?.companyName || "Your Company";

  try {
    const result = await sendLoggedEmail({
      emailLog,
      employee,
      salarySlip,
      pdfPath: salarySlip.pdfPath,
      companyName,
    });

    salarySlip.emailStatus = "sent";
    salarySlip.status = "emailed";
    salarySlip.emailSentAt = new Date();
    salarySlip.emailAttempts =
      (salarySlip.emailAttempts || 0) + 1;
    salarySlip.lastEmailError = undefined;

    await salarySlip.save();

    return result;
  } catch (error) {
    salarySlip.emailStatus = "failed";
    salarySlip.status = "failed";
    salarySlip.emailAttempts =
      (salarySlip.emailAttempts || 0) + 1;
    salarySlip.lastEmailError = String(
      error.message || "Email sending failed."
    ).slice(0, 2000);

    await salarySlip.save();

    throw error;
  }
};

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
  };

  for (const log of failedLogs) {
    try {
      await retryEmailLog(log._id);
      summary.sent += 1;
    } catch (error) {
      summary.failed += 1;

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
