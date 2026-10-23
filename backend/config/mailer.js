
require("dotenv").config();

const nodemailer = require("nodemailer");

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const isMailerConfigured = Boolean(
  smtpHost &&
  smtpUser &&
  smtpPass &&
  Number.isInteger(smtpPort) &&
  smtpPort > 0 &&
  smtpPort <= 65535
);

let transporter = null;

if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure:
      String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
} else {
  console.warn(
    "SMTP is not configured. Email sending is disabled until SMTP settings are added."
  );
}

const verifyMailer = async () => {
  if (!transporter) {
    throw new Error(
      "Email service is not configured. Please check SMTP settings in .env."
    );
  }

  try {
    await transporter.verify();
    console.log("SMTP mailer connection verified successfully.");
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error.message);
    throw error;
  }
};

const getEmailFrom = () => {
  const emailFrom = process.env.EMAIL_FROM || smtpUser;

  if (!emailFrom) {
    throw new Error("EMAIL_FROM or SMTP_USER must be configured.");
  }

  return emailFrom;
};

module.exports = {
  transporter,
  verifyMailer,
  isMailerConfigured,
  getEmailFrom,
};
