
import React, { useEffect, useState } from "react";
import {
  FaBuilding,
  FaSave,
  FaUndo,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaImage,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import "./CompanySettings.css";

const STORAGE_KEY = "company_settings";

const defaultSettings = {
  companyName: "ITteck Solution",
  email: "admin@company.com",
  phone: "",
  website: "",
  logoUrl: "",
  address: "",
  country: "India",
  state: "Madhya Pradesh",
  city: "Indore",
  postalCode: "",
  financialYearStart: "04-01",
  dateFormat: "DD/MM/YYYY",
  currency: "INR",
  taxId: "",
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
      return { ...defaultSettings };
    }

    return { ...defaultSettings, ...saved };
  } catch (error) {
    console.error("Unable to read company settings:", error);
    return { ...defaultSettings };
  }
}

function CompanySettings() {
  const [form, setForm] = useState(readSettings);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    document.title = "Company Settings | Payroll";

    // Keep settings synchronized when changed in another browser tab.
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY) {
        const updatedSettings = readSettings();
        setForm(updatedSettings);
        setLogoError(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (name === "logoUrl") {
      setLogoError(false);
    }

    setMessage("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.companyName.trim()) {
      nextErrors.companyName = "Company name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Company email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (
      form.phone.trim() &&
      !/^[+\d()\-\s]{7,20}$/.test(form.phone.trim())
    ) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (form.website.trim()) {
      try {
        const url = new URL(form.website.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          nextErrors.website =
            "Website URL must start with HTTP or HTTPS.";
        }
      } catch {
        nextErrors.website = "Enter a valid website URL.";
      }
    }

    if (
      form.logoUrl.trim()
    ) {
      try {
        const url = new URL(form.logoUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          nextErrors.logoUrl =
            "Logo URL must start with HTTP or HTTPS.";
        }
      } catch {
        nextErrors.logoUrl = "Enter a valid logo image URL.";
      }
    }

    if (
      form.postalCode.trim() &&
      !/^[a-zA-Z0-9\s-]{3,10}$/.test(form.postalCode.trim())
    ) {
      nextErrors.postalCode = "Enter a valid postal code.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = (event) => {
    event.preventDefault();
    setMessage("");

    if (!validate()) {
      setMessageType("error");
      setMessage("Please correct the highlighted fields.");
      return;
    }

    try {
      const updatedSettings = {
        ...form,
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        logoUrl: form.logoUrl.trim(),
        address: form.address.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        taxId: form.taxId.trim(),
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedSettings)
      );

      setForm(updatedSettings);
      setErrors({});
      setLogoError(false);

      // Notify other components in this tab that settings have changed.
      window.dispatchEvent(
        new CustomEvent("companySettingsUpdated", {
          detail: updatedSettings,
        })
      );

      setMessageType("success");
      setMessage("Company settings saved successfully.");
    } catch (error) {
      console.error("Unable to save company settings:", error);
      setMessageType("error");
      setMessage(
        "Settings could not be saved. Check browser storage availability."
      );
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      "Discard unsaved changes and reload the last saved company settings?"
    );

    if (!confirmed) return;

    const saved = readSettings();

    setForm(saved);
    setErrors({});
    setLogoError(false);
    setMessageType("success");
    setMessage("Last saved settings have been restored.");
  };

  const handleRestoreDefaults = () => {
    const confirmed = window.confirm(
      "Restore default company settings? Click Save Changes to apply them."
    );

    if (!confirmed) return;

    setForm({ ...defaultSettings });
    setErrors({});
    setLogoError(false);
    setMessageType("success");
    setMessage(
      "Default settings loaded. Click Save Changes to save them."
    );
  };

  const field = (
    name,
    label,
    placeholder,
    type = "text",
    required = false
  ) => (
    <div className="cs-field" key={name}>
      <label htmlFor={name}>
        {label}
        {required && <span className="cs-required"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={form[name] ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />

      {errors[name] && (
        <small className="cs-error" id={`${name}-error`}>
          {errors[name]}
        </small>
      )}
    </div>
  );

  return (
    <main className="company-settings-page">
      <header className="cs-header">
        <div className="cs-heading-icon">
          <FaBuilding />
        </div>

        <div className="cs-heading-text">
          <span className="cs-eyebrow">CONFIGURATION</span>
          <h1>Company Settings</h1>
          <p>
            Manage your company profile, address and payroll preferences.
          </p>
        </div>
      </header>

      {message && (
        <div
          className={`cs-message ${messageType}`}
          role="status"
          aria-live="polite"
        >
          {messageType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSave} noValidate>
        {/* Company profile */}
        <section className="cs-card">
          <div className="cs-card-title">
            <div>
              <h2>
                <FaBuilding /> Company Profile
              </h2>
              <p>
                These details identify your company throughout the payroll
                application.
              </p>
            </div>
          </div>

          <div className="cs-form-grid">
            {field(
              "companyName",
              "Company Name",
              "Enter company name",
              "text",
              true
            )}

            {field(
              "email",
              "Company Email",
              "admin@company.com",
              "email",
              true
            )}

            {field(
              "phone",
              "Contact Number",
              "+91 9876543210",
              "tel"
            )}

            {field(
              "website",
              "Website URL",
              "https://example.com",
              "url"
            )}

            {field(
              "taxId",
              "Tax ID / GSTIN",
              "Enter tax registration number"
            )}

            {field(
              "logoUrl",
              "Company Logo URL",
              "https://example.com/logo.png",
              "url"
            )}
          </div>

          <div className="cs-logo-preview">
            <div className="cs-logo-box">
              {form.logoUrl.trim() && !logoError ? (
                <img
                  src={form.logoUrl.trim()}
                  alt="Company logo preview"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <FaImage />
              )}
            </div>

            <div>
              <strong>Logo Preview</strong>
              <p>
                Enter a publicly accessible image URL to preview your
                company logo.
              </p>

              {logoError && form.logoUrl.trim() && (
                <small className="cs-error">
                  Unable to load this logo. Check the image URL.
                </small>
              )}
            </div>
          </div>

          {errors.logoUrl && (
            <small className="cs-error">{errors.logoUrl}</small>
          )}
        </section>

        {/* Company address */}
        <section className="cs-card">
          <div className="cs-card-title">
            <div>
              <h2>
                <FaMapMarkerAlt /> Company Address
              </h2>
              <p>
                Maintain your official company address for payroll documents.
              </p>
            </div>
          </div>

          <div className="cs-form-grid">
            <div className="cs-field cs-full-width">
              <label htmlFor="address">Street Address</label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Building, street and area"
                rows={3}
              />
            </div>

            {field("country", "Country", "Enter country")}
            {field("state", "State", "Enter state")}
            {field("city", "City", "Enter city")}

            {field(
              "postalCode",
              "Postal Code",
              "Enter postal code"
            )}
          </div>
        </section>

        {/* Regional preferences */}
        <section className="cs-card">
          <div className="cs-card-title">
            <div>
              <h2>
                <FaCalendarAlt /> Regional Preferences
              </h2>
              <p>
                Choose the default currency, financial year and date format.
              </p>
            </div>
          </div>

          <div className="cs-form-grid">
            <div className="cs-field">
              <label htmlFor="currency">Default Currency</label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>

            <div className="cs-field">
              <label htmlFor="financialYearStart">
                Financial Year Starts
              </label>
              <select
                id="financialYearStart"
                name="financialYearStart"
                value={form.financialYearStart}
                onChange={handleChange}
              >
                <option value="01-01">January</option>
                <option value="04-01">April (India)</option>
                <option value="07-01">July</option>
                <option value="10-01">October</option>
              </select>
            </div>

            <div className="cs-field">
              <label htmlFor="dateFormat">Date Format</label>
              <select
                id="dateFormat"
                name="dateFormat"
                value={form.dateFormat}
                onChange={handleChange}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </section>

        {/* Form actions */}
        <div className="cs-actions">
          <button
            type="button"
            className="cs-btn cs-outline"
            onClick={handleReset}
          >
            <FaUndo /> Discard Changes
          </button>

          <button
            type="button"
            className="cs-btn cs-secondary"
            onClick={handleRestoreDefaults}
          >
            Restore Defaults
          </button>

          <button type="submit" className="cs-btn cs-save">
            <FaSave /> Save Changes
          </button>
        </div>
      </form>

      <p className="cs-storage-note">
        Company settings are currently stored in this browser. Backend
        integration is required to share settings securely across users and
        devices.
      </p>
    </main>
  );
}

export default CompanySettings;
