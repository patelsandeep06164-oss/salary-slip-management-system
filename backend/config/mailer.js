
require("dotenv").config();

const nodemailer = require("nodemailer");

// ========================================
// SMTP ENVIRONMENT VARIABLES
// ========================================

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();

const smtpSecure =
  String(process.env.SMTP_SECURE).toLowerCase() === "true";

const emailFrom = process.env.EMAIL_FROM?.trim() || smtpUser;

// ========================================
// SMTP CONFIGURATION VALIDATION
// ========================================

const isMailerConfigured = Boolean(
  smtpHost &&
  smtpUser &&
  smtpPass &&
  Number.isInteger(smtpPort) &&
  smtpPort > 0 &&
  smtpPort <= 65535
);

// Safe diagnostic: never print credentials
console.log("SMTP CONFIGURATION CHECK:", {
  hostConfigured: Boolean(smtpHost),
  portConfigured:
    Number.isInteger(smtpPort) &&
    smtpPort > 0 &&
    smtpPort <= 65535,
  userConfigured: Boolean(smtpUser),
  passwordConfigured: Boolean(smtpPass),
  emailFromConfigured: Boolean(emailFrom),
  smtpPort,
  smtpSecure,
});

// ========================================
// CREATE SMTP TRANSPORTER
// ========================================

let transporter = null;

if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,

    auth: {
      user: smtpUser,
      pass: smtpPass,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,

    tls: {
      minVersion: "TLSv1.2",
    },
  });

  console.log("SMTP transporter initialized successfully.");
} else {
  console.error(
    "SMTP is not configured. Please check SMTP environment variables."
  );
}

// ========================================
// VERIFY SMTP CONNECTION
// ========================================

const verifyMailer = async () => {
  if (!isMailerConfigured || !transporter) {
    throw new Error(
      "Email service is not configured. Please check SMTP settings."
    );
  }

  try {
    await transporter.verify();

    console.log("SMTP mailer connection verified successfully.");

    return true;
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      error.message
    );

    throw error;
  }
};

// ========================================
// GET EMAIL SENDER
// ========================================

const getEmailFrom = () => {
  if (!emailFrom) {
    throw new Error(
      "EMAIL_FROM or SMTP_USER must be configured."
    );
  }

  return emailFrom;
};

// ========================================
// SEND EMAIL HELPER
// ========================================

const sendEmail = async (mailOptions) => {
  if (!isMailerConfigured || !transporter) {
    throw new Error(
      "Email service is not configured. Please contact the administrator."
    );
  }

  if (
    !mailOptions ||
    typeof mailOptions !== "object" ||
    !mailOptions.to
  ) {
    throw new Error("Recipient email address is required.");
  }

  try {
    const result = await transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from || getEmailFrom(),
    });

    console.log("Email sent successfully:", {
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  transporter,
  verifyMailer,
  isMailerConfigured,
  getEmailFrom,
  sendEmail,
};
