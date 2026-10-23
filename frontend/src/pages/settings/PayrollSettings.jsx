import React, { useState } from "react";
import {
  FaMoneyBillWave,
  FaSave,
  FaUndo,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./PayrollSettings.css";

const STORAGE_KEY = "payroll_settings";

const defaultSettings = {
  currency: "INR",
  paymentDay: "1",
  workingDaysPerMonth: "26",
  workingHoursPerDay: "8",
  overtimeEnabled: false,
  overtimeMultiplier: "1.5",
  pfEnabled: true,
  pfRate: "12",
  esiEnabled: false,
  esiRate: "0.75",
  professionalTaxEnabled: false,
  professionalTaxAmount: "200",
  incomeTaxEnabled: false,
  payrollApprovalRequired: true,
  payslipPrefix: "SAL",
  payslipStartNumber: "1001",
  preventNegativeSalary: true,
  allowManualAdjustments: true,
};

function loadSettings() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null"
    );

    return saved
      ? { ...defaultSettings, ...saved }
      : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

function PayrollSettings() {
  const [form, setForm] = useState(loadSettings);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

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

    const numericFields = [
      ["paymentDay", "Payment day", 1, 28],
      ["workingDaysPerMonth", "Working days", 1, 31],
      ["workingHoursPerDay", "Working hours", 1, 24],
      ["overtimeMultiplier", "Overtime multiplier", 0.1, 10],
      ["pfRate", "PF rate", 0, 100],
      ["esiRate", "ESI rate", 0, 100],
      ["professionalTaxAmount", "Professional tax amount", 0, 1000000],
      ["payslipStartNumber", "Starting slip number", 1, 999999999],
    ];

    numericFields.forEach(([name, label, min, max]) => {
      const rawValue = form[name];
      const value = Number(rawValue);

      if (
        rawValue === "" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max
      ) {
        next[name] = `${label} must be between ${min} and ${max}.`;
      }
    });

    if (!form.payslipPrefix.trim()) {
      next.payslipPrefix = "Salary slip prefix is required.";
    } else if (!/^[A-Za-z0-9-]{1,12}$/.test(form.payslipPrefix)) {
      next.payslipPrefix = "Use 1–12 letters, numbers or hyphens.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveSettings = (event) => {
    event.preventDefault();

    if (!validate()) {
      setMessageType("error");
      setMessage("Please correct the highlighted fields before saving.");
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setMessageType("success");
      setMessage("Payroll settings saved successfully in this browser.");
    } catch {
      setMessageType("error");
      setMessage("Could not save settings. Please check your browser storage.");
    }
  };

  const discardChanges = () => {
    if (
      !window.confirm(
        "Discard unsaved changes and reload saved payroll settings?"
      )
    ) {
      return;
    }

    const saved = loadSettings();
    setForm(saved);
    setErrors({});
    setMessage("Saved payroll settings restored.");
    setMessageType("success");
  };

  const restoreDefaults = () => {
    if (
      !window.confirm(
        "Restore all default payroll settings? Save changes to apply them."
      )
    ) {
      return;
    }

    setForm({ ...defaultSettings });
    setErrors({});
    setMessage(
      "Default values loaded. Click Save Payroll Settings to store them."
    );
    setMessageType("success");
  };

  const field = (name, label, min, max, step = "1") => (
    <div className="ps-field" key={name}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type="number"
        min={min}
        max={max}
        step={step}
        value={form[name]}
        onChange={changeField}
        aria-invalid={Boolean(errors[name])}
      />
      {errors[name] && (
        <small className="ps-error">{errors[name]}</small>
      )}
    </div>
  );

  const toggle = (name, title, description) => (
    <label className="ps-toggle-row" key={name}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <span className={`ps-switch ${form[name] ? "active" : ""}`}>
        <input
          type="checkbox"
          name={name}
          checked={form[name]}
          onChange={changeField}
          aria-label={title}
        />
        <span className="ps-switch-track" />
      </span>
    </label>
  );

  return (
    <main className="payroll-settings-page">
      <header className="ps-header">
        <div className="ps-header-icon">
          <FaMoneyBillWave />
        </div>

        <div>
          <span className="ps-eyebrow">PAYROLL CONFIGURATION</span>
          <h1>Payroll Settings</h1>
          <p>
            Configure salary rules, payroll schedules and salary slip
            preferences.
          </p>
        </div>
      </header>

      {message && (
        <div className={`ps-message ${messageType}`} role="status">
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

      <form onSubmit={saveSettings}>
        {/* PAYROLL SCHEDULE */}
        <section className="ps-card">
          <div className="ps-section-heading">
            <div className="ps-section-icon">
              <FaCalendarAlt />
            </div>

            <div>
              <h2>Payroll Schedule</h2>
              <p>
                Set the defaults for monthly payroll calculations and
                payment dates.
              </p>
            </div>
          </div>

          <div className="ps-form-grid">
            <div className="ps-field">
              <label htmlFor="currency">Payroll Currency</label>

              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={changeField}
              >
                <option value="INR">INR — Indian Rupee (₹)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="EUR">EUR — Euro (€)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>

            {field("paymentDay", "Salary Payment Day (1–28)", 1, 28)}
            {field(
              "workingDaysPerMonth",
              "Standard Working Days / Month",
              1,
              31
            )}
            {field(
              "workingHoursPerDay",
              "Standard Working Hours / Day",
              1,
              24,
              "0.5"
            )}
          </div>

          <div className="ps-info">
            <FaClock />
            <p>
              Payment day is a default preference. It does not automatically
              transfer salaries or schedule payroll without a connected
              backend job or payment system.
            </p>
          </div>
        </section>

        {/* OVERTIME AND ADJUSTMENTS */}
        <section className="ps-card">
          <div className="ps-section-heading">
            <div className="ps-section-icon">
              <FaMoneyBillWave />
            </div>

            <div>
              <h2>Overtime &amp; Adjustments</h2>
              <p>
                Control optional overtime calculations and manual salary
                adjustments.
              </p>
            </div>
          </div>

          {toggle(
            "overtimeEnabled",
            "Enable Overtime",
            "Allow overtime amounts to be considered when payroll is calculated."
          )}

          {form.overtimeEnabled && (
            <div className="ps-inline-field">
              {field(
                "overtimeMultiplier",
                "Overtime Multiplier",
                0.1,
                10,
                "0.1"
              )}

              <p>
                Example: 1.5 means one overtime hour is calculated at 1.5
                times the hourly rate, if your payroll calculation supports
                it.
              </p>
            </div>
          )}

          {toggle(
            "allowManualAdjustments",
            "Allow Manual Adjustments",
            "Allow authorized payroll staff to add or correct payroll amounts."
          )}

          {toggle(
            "preventNegativeSalary",
            "Prevent Negative Net Salary",
            "Reject payroll calculations that would produce a negative net salary."
          )}
        </section>

        {/* DEDUCTION PREFERENCES */}
        <section className="ps-card">
          <div className="ps-section-heading">
            <div className="ps-section-icon">
              <FaShieldAlt />
            </div>

            <div>
              <h2>Deduction Preferences</h2>
              <p>
                Enable or disable deduction categories used by your payroll
                workflow.
              </p>
            </div>
          </div>

          <div className="ps-deduction-list">
            {toggle(
              "pfEnabled",
              "Provident Fund (PF)",
              "Enable the PF deduction option for payroll records."
            )}

            {form.pfEnabled && (
              <div className="ps-inline-field">
                {field("pfRate", "PF Rate (%)", 0, 100, "0.1")}
                <p>
                  Illustrative rate only. Actual PF calculation depends on
                  applicable rules and the employee's eligible salary
                  components.
                </p>
              </div>
            )}

            {toggle(
              "esiEnabled",
              "Employee State Insurance (ESI)",
              "Enable the ESI deduction option for eligible employees."
            )}

            {form.esiEnabled && (
              <div className="ps-inline-field">
                {field("esiRate", "ESI Rate (%)", 0, 100, "0.01")}
                <p>
                  Illustrative rate only. Confirm current statutory rates
                  and employee eligibility before using this for actual
                  payroll.
                </p>
              </div>
            )}

            {toggle(
              "professionalTaxEnabled",
              "Professional Tax",
              "Enable the professional tax deduction option where applicable."
            )}

            {form.professionalTaxEnabled && (
              <div className="ps-inline-field">
                {field(
                  "professionalTaxAmount",
                  "Default Professional Tax Amount",
                  0,
                  1000000
                )}
                <p>
                  Tax amount varies by applicable state rules, salary and
                  other criteria. This is a default value, not a tax
                  determination.
                </p>
              </div>
            )}

            {toggle(
              "incomeTaxEnabled",
              "Income Tax / TDS",
              "Enable the income-tax deduction option for payroll processing."
            )}
          </div>

          <div className="ps-warning">
            <FaExclamationTriangle />
            <p>
              These options only save preferences. They do not implement
              statutory tax calculations. Verify current Indian payroll
              rules and employee eligibility before calculating actual
              deductions.
            </p>
          </div>
        </section>

        {/* SALARY SLIP AND APPROVAL */}
        <section className="ps-card">
          <div className="ps-section-heading">
            <div className="ps-section-icon">
              <FaFileInvoiceDollar />
            </div>

            <div>
              <h2>Salary Slip &amp; Approval</h2>
              <p>
                Configure slip reference numbering and the approval workflow
                preference.
              </p>
            </div>
          </div>

          <div className="ps-form-grid">
            <div className="ps-field">
              <label htmlFor="payslipPrefix">Salary Slip Prefix</label>

              <input
                id="payslipPrefix"
                name="payslipPrefix"
                value={form.payslipPrefix}
                onChange={changeField}
                placeholder="SAL"
                maxLength={12}
                aria-invalid={Boolean(errors.payslipPrefix)}
              />

              {errors.payslipPrefix && (
                <small className="ps-error">
                  {errors.payslipPrefix}
                </small>
              )}
            </div>

            {field(
              "payslipStartNumber",
              "Starting Slip Number",
              1,
              999999999
            )}
          </div>

          <div className="ps-slip-preview">
            <span>Example Salary Slip Reference</span>
            <strong>
              {form.payslipPrefix || "SAL"}-
              {String(Number(form.payslipStartNumber) || 1).padStart(
                5,
                "0"
              )}
            </strong>
          </div>

          {toggle(
            "payrollApprovalRequired",
            "Require Payroll Approval",
            "Set the preference that payroll should be reviewed before finalization."
          )}
        </section>

        {/* ACTION BUTTONS */}
        <div className="ps-actions">
          <button
            type="button"
            className="ps-button ps-reset"
            onClick={discardChanges}
          >
            <FaUndo />
            Discard Changes
          </button>

          <button
            type="button"
            className="ps-button ps-default"
            onClick={restoreDefaults}
          >
            Restore Defaults
          </button>

          <button type="submit" className="ps-button ps-save">
            <FaSave />
            Save Payroll Settings
          </button>
        </div>
      </form>

      <p className="ps-storage-note">
        Settings are stored in this browser. The payroll generator must read
        these values from the same storage key—or from your backend API—to
        apply them to salary calculations.
      </p>
    </main>
  );
}

export default PayrollSettings;