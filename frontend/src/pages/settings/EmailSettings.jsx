
import React, { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaSave,
  FaUndo,
  FaServer,
  FaShieldAlt,
  FaBell,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import api from "../../services/api";
import "./EmailSettings.css";

const STORAGE_KEY = "email_settings";

const defaultSettings = {
  provider: "smtp",
  smtpHost: "",
  smtpPort: "587",
  encryption: "tls",
  senderName: "ITteck Solution HR",
  senderEmail: "",
  replyTo: "",
  username: "",
  sendPayslips: true,
  sendLeaveUpdates: true,
  sendPayrollAlerts: true,
  sendWelcomeEmail: true,
  sendPasswordReset: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved
      ? { ...defaultSettings, ...saved }
      : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

function EmailSettings() {
  const [form, setForm] = useState(loadSettings);
  const [savedForm, setSavedForm] = useState(loadSettings);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the automatic salary-slip email setting from the backend.
  useEffect(() => {
    let active = true;

    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings");
        const backendSettings = response.data?.settings || response.data;

        if (!active) return;

        const localSettings = loadSettings();
        const mergedSettings = {
          ...localSettings,
          sendPayslips:
            typeof backendSettings?.emailSalarySlipsAutomatically ===
            "boolean"
              ? backendSettings.emailSalarySlipsAutomatically
              : localSettings.sendPayslips,
        };

        setForm(mergedSettings);
        setSavedForm(mergedSettings);
      } catch (error) {
        if (!active) return;

        setMessageType("error");
        setMessage(
          error.response?.data?.message ||
            "Could not load settings from the backend. Check your login and backend server."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSettings();

    return () => {
      active = false;
    };
  }, []);

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  };

  const validate = () => {
    const next = {};

    if (!form.senderName.trim()) {
      next.senderName = "Sender name is required.";
    }

    if (!emailPattern.test(form.senderEmail.trim())) {
      next.senderEmail = "Enter a valid sender email.";
    }

    if (form.replyTo && !emailPattern.test(form.replyTo.trim())) {
      next.replyTo = "Enter a valid reply-to email.";
    }

    if (form.provider === "smtp") {
      if (!form.smtpHost.trim()) {
        next.smtpHost = "SMTP host is required.";
      }

      const port = Number(form.smtpPort);

      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        next.smtpPort = "Enter a valid port between 1 and 65535.";
      }

      if (!form.username.trim()) {
        next.username = "SMTP username is required.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveSettings = async (event) => {
    event.preventDefault();

    if (!validate()) {
      setMessageType("error");
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      // Backend currently supports this automatic-email setting.
      await api.put("/settings", {
        emailSalarySlipsAutomatically: form.sendPayslips,
      });

      // Other UI preferences are stored locally only.
      // Never save SMTP passwords or private API keys here.
      const safeSettings = { ...form };
      delete safeSettings.smtpPassword;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSettings));

      setSavedForm({ ...form });
      setSmtpPassword("");
      setMessageType("success");
      setMessage(
        "Settings saved. Automatic salary-slip email preference was updated on the backend. Other mail preferences are saved in this browser only."
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          "Unable to save settings to the backend. Check your permissions and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (
      !window.confirm(
        "Discard unsaved changes and reload saved email settings?"
      )
    ) {
      return;
    }

    setLoading(true);
    setErrors({});
    setMessage("");

    try {
      const response = await api.get("/settings");
      const backendSettings = response.data?.settings || response.data;
      const localSettings = loadSettings();

      const restored = {
        ...localSettings,
        sendPayslips:
          typeof backendSettings?.emailSalarySlipsAutomatically === "boolean"
            ? backendSettings.emailSalarySlipsAutomatically
            : localSettings.sendPayslips,
      };

      setForm(restored);
      setSavedForm(restored);
      setSmtpPassword("");
      setShowPassword(false);
      setMessageType("success");
      setMessage("Saved settings restored.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.response?.data?.message ||
          "Could not reload saved settings from the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const sendTestEmail = (event) => {
    event.preventDefault();
    setMessage("");

    if (!testRecipient.trim() || !emailPattern.test(testRecipient.trim())) {
      setErrors((current) => ({
        ...current,
        testRecipient: "Enter a valid recipient email address.",
      }));
      setMessageType("error");
      setMessage("Enter a valid recipient email before testing.");
      return;
    }

    setErrors((current) => ({ ...current, testRecipient: "" }));

    if (!validate()) {
      setMessageType("error");
      setMessage("Complete the required sender and SMTP fields first.");
      return;
    }

    if (form.provider === "smtp" && !smtpPassword.trim()) {
      setMessageType("warning");
      setMessage(
        "Enter the SMTP password for this session. Actual delivery still requires a backend test-email endpoint."
      );
      return;
    }

    setMessageType("warning");
    setMessage(
      `Configuration validated for ${testRecipient}. No email was sent because a backend test-email endpoint is not connected yet.`
    );
  };

  const field = (name, label, placeholder, type = "text", required = false) => (
    <div className="es-field" key={name}>
      <label htmlFor={name}>
        {label}
        {required && <span className="es-required"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={changeField}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(errors[name])}
      />

      {errors[name] && <small className="es-error">{errors[name]}</small>}
    </div>
  );

  const notificationItems = [
    [
      "sendPayslips",
      "Salary Slip Emails",
      "Enable or disable automatic salary-slip email processing.",
    ],
    [
      "sendLeaveUpdates",
      "Leave Updates",
      "Notify employees about leave approval or rejection.",
    ],
    [
      "sendPayrollAlerts",
      "Payroll Alerts",
      "Send payroll processing and payment status notifications.",
    ],
    [
      "sendWelcomeEmail",
      "Welcome Emails",
      "Send onboarding instructions to new employees.",
    ],
    [
      "sendPasswordReset",
      "Password Reset Emails",
      "Allow password-reset notifications through email.",
    ],
  ];

  return (
    <main className="email-settings-page">
      <header className="es-header">
        <div className="es-header-icon">
          <FaEnvelope />
        </div>

        <div className="es-header-copy">
          <span className="es-eyebrow">COMMUNICATION</span>
          <h1>Email Settings</h1>
          <p>
            Configure sender details, mail preferences and delivery
            requirements.
          </p>
        </div>
      </header>

      {message && (
        <div className={`es-message ${messageType}`} role="status">
          {messageType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationTriangle />
          )}

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {loading && <p className="es-storage-note">Loading saved settings...</p>}

      <form onSubmit={saveSettings}>
        <section className="es-card">
          <div className="es-section-heading">
            <div className="es-section-icon">
              <FaServer />
            </div>
            <div>
              <h2>Mail Server Configuration</h2>
              <p>Choose the mail transport used by your backend.</p>
            </div>
          </div>

          <div className="es-provider-options">
            <label className={form.provider === "smtp" ? "selected" : ""}>
              <input
                type="radio"
                name="provider"
                value="smtp"
                checked={form.provider === "smtp"}
                onChange={changeField}
              />
              <span>
                <strong>SMTP Server</strong>
                <small>Use a configured SMTP provider.</small>
              </span>
            </label>

            <label className={form.provider === "api" ? "selected" : ""}>
              <input
                type="radio"
                name="provider"
                value="api"
                checked={form.provider === "api"}
                onChange={changeField}
              />
              <span>
                <strong>Email API</strong>
                <small>Use a server-side email provider API.</small>
              </span>
            </label>
          </div>

          {form.provider === "smtp" ? (
            <div className="es-form-grid">
              {field("smtpHost", "SMTP Host", "smtp.example.com", "text", true)}
              {field("smtpPort", "SMTP Port", "587", "number", true)}

              <div className="es-field">
                <label htmlFor="encryption">Encryption</label>
                <select
                  id="encryption"
                  name="encryption"
                  value={form.encryption}
                  onChange={changeField}
                >
                  <option value="tls">STARTTLS / TLS (commonly port 587)</option>
                  <option value="ssl">SSL (commonly port 465)</option>
                  <option value="none">None (not recommended)</option>
                </select>
              </div>

              {field(
                "username",
                "SMTP Username",
                "Usually your sender email",
                "text",
                true
              )}

              <div className="es-field">
                <label htmlFor="smtpPassword">
                  SMTP Password / App Password
                </label>

                <div className="es-password-wrap">
                  <input
                    id="smtpPassword"
                    type={showPassword ? "text" : "password"}
                    value={smtpPassword}
                    onChange={(event) => setSmtpPassword(event.target.value)}
                    placeholder="Enter only when testing"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <small className="es-help">
                  Not stored in this browser. Configure SMTP credentials
                  securely on the backend.
                </small>
              </div>
            </div>
          ) : (
            <div className="es-api-info">
              <FaShieldAlt />
              <div>
                <strong>Backend API required</strong>
                <p>
                  Store provider API keys securely in server environment
                  variables. Never put private API keys in React code.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="es-card">
          <div className="es-section-heading">
            <div className="es-section-icon">
              <FaEnvelope />
            </div>
            <div>
              <h2>Sender Information</h2>
              <p>These details appear in outgoing email messages.</p>
            </div>
          </div>

          <div className="es-form-grid">
            {field(
              "senderName",
              "Sender Display Name",
              "ITteck Solution HR",
              "text",
              true
            )}
            {field(
              "senderEmail",
              "Sender Email",
              "hr@example.com",
              "email",
              true
            )}
            {field("replyTo", "Reply-To Email", "support@example.com", "email")}
          </div>
        </section>

        <section className="es-card">
          <div className="es-section-heading">
            <div className="es-section-icon">
              <FaBell />
            </div>
            <div>
              <h2>Email Notifications</h2>
              <p>
                Select preferences. Only automatic salary-slip email is
                currently connected to the backend setting.
              </p>
            </div>
          </div>

          <div className="es-notification-list">
            {notificationItems.map(([name, title, description]) => (
              <label className="es-notification-row" key={name}>
                <div>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>

                <input
                  type="checkbox"
                  name={name}
                  checked={Boolean(form[name])}
                  onChange={changeField}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="es-card es-test-card">
          <div className="es-section-heading">
            <div className="es-section-icon">
              <FaPaperPlane />
            </div>
            <div>
              <h2>Test Email Configuration</h2>
              <p>Validate fields before connecting the backend delivery API.</p>
            </div>
          </div>

          <div className="es-test-row">
            <div className="es-field">
              <label htmlFor="testRecipient">Test Recipient Email</label>
              <input
                id="testRecipient"
                type="email"
                value={testRecipient}
                onChange={(event) => {
                  setTestRecipient(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    testRecipient: "",
                  }));
                }}
                placeholder="your-email@example.com"
                aria-invalid={Boolean(errors.testRecipient)}
              />

              {errors.testRecipient && (
                <small className="es-error">{errors.testRecipient}</small>
              )}
            </div>

            <button
              type="button"
              className="es-test-button"
              onClick={sendTestEmail}
            >
              <FaPaperPlane /> Validate Test
            </button>
          </div>

          <p className="es-security-note">
            <FaShieldAlt /> This page does not send an actual test email.
            Delivery requires a backend email endpoint.
          </p>
        </section>

        <div className="es-actions">
          <button
            type="button"
            className="es-button es-reset"
            onClick={resetSettings}
            disabled={loading || saving}
          >
            <FaUndo /> Discard Changes
          </button>

          <button
            type="submit"
            className="es-button es-save"
            disabled={loading || saving}
          >
            <FaSave /> {saving ? "Saving..." : "Save Email Settings"}
          </button>
        </div>
      </form>

      <p className="es-storage-note">
        Current sender preference:{" "}
        {savedForm.senderEmail || "Sender email not configured"}. SMTP
        passwords and private API keys are not saved in this browser.
      </p>
    </main>
  );
}

export default EmailSettings;
