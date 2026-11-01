
const { Resend } = require("resend");

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// Resend API configuration
const resendApiKey = process.env.RESEND_API_KEY?.trim();

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

const emailFrom =
  process.env.RESEND_FROM_EMAIL?.trim() ||
  "onboarding@resend.dev";

// OTP email templates
const emailTemplates = {
  "employee-registration": {
    subject: "ITteck Solution - Employee Email Verification",
    heading: "Employee Email Verification",
    description:
      "Use the verification code below to verify your employee email address.",
  },

  "admin-registration": {
    subject: "ITteck Solution - Admin Email Verification",
    heading: "Admin Email Verification",
    description:
      "Use the verification code below to verify your administrator email address.",
  },

  "employee-login": {
    subject: "ITteck Solution - Employee Login Verification",
    heading: "Employee Login Verification",
    description:
      "Use this verification code to securely sign in to your employee account.",
  },

  "admin-login": {
    subject: "ITteck Solution - Admin Login Verification",
    heading: "Admin Login Verification",
    description:
      "Use this verification code to securely sign in to your administrator account.",
  },

  "password-reset": {
    subject: "ITteck Solution - Password Reset Verification",
    heading: "Password Reset Verification",
    description:
      "Use this verification code to verify your identity and reset your password.",
  },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

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
    throw createError(
      "Please provide a valid email address.",
      400
    );
  }

  if (!/^\d{6}$/.test(String(otp))) {
    throw createError("Invalid OTP format.", 400);
  }

  if (
    !Number.isInteger(expiresInMinutes) ||
    expiresInMinutes < 1 ||
    expiresInMinutes > 10
  ) {
    throw createError(
      "Invalid OTP expiry duration.",
      400
    );
  }

  const template = emailTemplates[purpose];

  if (!template) {
    throw createError(
      "Invalid email verification purpose.",
      400
    );
  }

  if (!resend || !resendApiKey) {
    console.error(
      "Resend email service is not configured."
    );

    throw createError(
      "Email service is not configured. Please contact the administrator."
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const safeOtp = escapeHtml(otp);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(template.heading)}</title>
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
          ITteck Solution
        </h2>

        <h3 style="
          color: #203c55;
          text-align: center;
        ">
          ${escapeHtml(template.heading)}
        </h3>

        <p style="
          color: #5d7185;
          font-size: 15px;
          line-height: 1.7;
        ">
          ${escapeHtml(template.description)}
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
          This is an automated security email from ITteck Solution.
          Please do not reply.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
ITteck Solution
${template.heading}

${template.description}

Your verification code: ${safeOtp}

This OTP expires in ${expiresInMinutes} minutes.

Never share this code with anyone.
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [normalizedEmail],
      subject: template.subject,
      html,
      text,
    });

    if (error) {
      console.error("RESEND API DELIVERY ERROR:", {
        name: error.name || null,
        message: error.message || "Unknown Resend error",
        statusCode: error.statusCode || null,
      });

      throw new Error(
        error.message || "Resend email delivery failed."
      );
    }

    if (!data?.id) {
      throw new Error(
        "Resend did not return an email ID."
      );
    }

    console.info("AUTH OTP EMAIL ACCEPTED BY RESEND:", {
      purpose,
      messageId: data.id,
    });

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error(
      "Authentication OTP email failed:",
      error.message
    );

    throw createError(
      "Unable to send verification email. Please try again later.",
      502
    );
  }
};

module.exports = {
  sendAuthOtpEmail,
};
