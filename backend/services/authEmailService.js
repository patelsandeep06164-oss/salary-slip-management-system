
const {
  transporter,
  isMailerConfigured,
  getEmailFrom,
} = require("../config/mailer");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const emailTemplates = {
  "employee-registration": {
    subject: "Your SalaryFlow Verification Code",
    heading: "Email Verification",
    description: "Use the verification code below to verify your email address.",
  },

  "admin-registration": {
    subject: "Your SalaryFlow Verification Code",
    heading: "Email Verification",
    description: "Use the verification code below to verify your email address.",
  },

  "admin-login": {
    subject: "Your SalaryFlow Verification Code",
    heading: "Email Verification",
    description: "Use the verification code below to verify your email address.",
  },

  "password-reset": {
    subject: "Your SalaryFlow Verification Code",
    heading: "Email Verification",
    description: "Use the verification code below to verify your email address.",
  },
};

const sendAuthOtpEmail = async ({
  email,
  otp,
  purpose,
  expiresInMinutes = 5,
}) => {
  if (!email || !otp || !purpose) {
    throw createError(
      "Email, OTP and purpose are required.",
      400
    );
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw createError("Please provide a valid email address.", 400);
  }

  if (!/^\d{6}$/.test(String(otp))) {
    throw createError("Invalid OTP format.", 400);
  }

  if (
    !Number.isInteger(expiresInMinutes) ||
    expiresInMinutes < 1 ||
    expiresInMinutes > 10
  ) {
    throw createError("Invalid OTP expiry duration.", 400);
  }

  const template = emailTemplates[purpose];

  if (!template) {
    throw createError(
      "Invalid email verification purpose.",
      400
    );
  }

  if (!isMailerConfigured || !transporter) {
    throw createError(
      "Email service is not configured. Please contact the administrator."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const safeOtp = String(otp);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${template.heading}</title>
    </head>

    <body style="
      margin: 0;
      padding: 30px 12px;
      background: #f2f7fb;
      font-family: Arial, Helvetica, sans-serif;
    ">
      <div style="
        max-width: 520px;
        margin: 0 auto;
        padding: 32px 24px;
        background: #ffffff;
        border: 1px solid #e1eaf2;
        border-radius: 14px;
      ">
        <h2 style="
          margin: 0 0 12px;
          color: #087f9e;
          text-align: center;
        ">
          SalaryFlow
        </h2>

        <h3 style="
          color: #203c55;
          text-align: center;
        ">
          ${template.heading}
        </h3>

        <p style="
          color: #5d7185;
          font-size: 15px;
          line-height: 1.7;
        ">
          ${template.description}
        </p>

        <div style="
          margin: 28px 0;
          padding: 20px;
          background: #effaff;
          border: 1px dashed #13a8c4;
          border-radius: 10px;
          text-align: center;
        ">
          <div style="
            color: #71869a;
            font-size: 12px;
            margin-bottom: 10px;
          ">
            YOUR VERIFICATION CODE
          </div>

          <strong style="
            color: #087fa5;
            font-size: 32px;
            letter-spacing: 9px;
          ">
            ${safeOtp}
          </strong>
        </div>

        <p style="
          color: #53697d;
          font-size: 14px;
          line-height: 1.6;
        ">
          This OTP expires in
          <strong>${expiresInMinutes} minutes</strong>.
        </p>

        <p style="
          color: #d04b4b;
          font-size: 13px;
          line-height: 1.6;
        ">
          Never share this code with anyone.
          Our team will never ask you to disclose your OTP.
        </p>

        <hr style="
          border: 0;
          border-top: 1px solid #e8eef3;
          margin: 25px 0;
        " />

        <p style="
          color: #91a0ae;
          font-size: 11px;
          text-align: center;
        ">
          This is an automated security email.
          Please do not reply.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
${template.heading}

${template.description}

Your verification code: ${safeOtp}

This OTP expires in ${expiresInMinutes} minutes.

Never share this code with anyone.
`;

  try {
  const result = await transporter.sendMail({
  from: getEmailFrom(),
  to: normalizedEmail,
  subject: template.subject,
  text,
  html,
});

const maskEmail = (value) => {
  if (typeof value !== "string" || !value.includes("@")) {
    return "INVALID_EMAIL";
  }

  const [localPart, domain] = value.split("@");

  return `${localPart.slice(0, 2)}***@${domain}`;
};

console.info("AUTH OTP EMAIL DELIVERY RESULT", {
  purpose,
  recipient: maskEmail(normalizedEmail),
  accepted: (result.accepted || []).map(maskEmail),
  rejected: (result.rejected || []).map(maskEmail),
  messageId: result.messageId || null,
  response: result.response || null,
});

return {
  success: true,
  messageId: result.messageId,
};
  } catch (error) {
    console.error(
      "Authentication OTP email failed:",
      error.message
    );

    throw createError(
      "Unable to send verification email. Please try again later."
    );
  }
};

module.exports = {
  sendAuthOtpEmail,
};
