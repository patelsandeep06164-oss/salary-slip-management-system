
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowRight,
  FaKey,
  FaArrowLeft,
} from "react-icons/fa";
import "./ChangePassword.css";

function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRules = useMemo(() => {
    const password = formData.newPassword;

    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [formData.newPassword]);

  const strength = Object.values(passwordRules).filter(Boolean).length;

  const strengthLabel = (() => {
    if (!formData.newPassword) return "Not entered";
    if (strength <= 2) return "Weak";
    if (strength <= 4) return "Good";
    return "Strong";
  })();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setNotice("");
  };

  const toggleVisibility = (field) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const clearForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setVisiblePasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });

    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (
      !formData.currentPassword ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all password fields.");
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError(
        "Your new password must be different from the current password."
      );
      return;
    }

    if (
      !passwordRules.length ||
      !passwordRules.uppercase ||
      !passwordRules.lowercase ||
      !passwordRules.number
    ) {
      setError(
        "Use at least 8 characters, including uppercase, lowercase and a number."
      );
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend API abhi connect nahi hai.
       * Current password verify aur new password hash
       * backend par hi hona chahiye.
       */
      setNotice(
        "Validation passed, but the password API is not connected yet. Your password has not been changed."
      );
    } catch (submitError) {
      setError("Unable to process your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="employee-password-page">
      <div className="employee-password-header">
        <div>
          <span className="employee-password-eyebrow">
            ACCOUNT SECURITY
          </span>

          <h1>Change Password</h1>

          <p>
            Update your password to help keep your account secure.
          </p>
        </div>

        <div className="employee-password-header-icon">
          <FaShieldAlt />
        </div>
      </div>

      <div className="employee-password-layout">
        <section className="employee-password-card">
          <div className="employee-password-card-heading">
            <span className="employee-password-icon">
              <FaKey />
            </span>

            <div>
              <h2>Update your password</h2>
              <p>
                Enter your current password and choose a new one.
              </p>
            </div>
          </div>

          {error && (
            <div
              className="employee-password-alert error"
              role="alert"
            >
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div
              className="employee-password-alert info"
              role="status"
            >
              <FaCheckCircle />
              <span>{notice}</span>
            </div>
          )}

          <form
            className="employee-password-form"
            onSubmit={handleSubmit}
          >
            <div className="employee-password-field">
              <label htmlFor="currentPassword">
                Current password
              </label>

              <div className="employee-password-input-wrap">
                <FaLock className="employee-password-input-icon" />

                <input
                  id="currentPassword"
                  type={
                    visiblePasswords.currentPassword
                      ? "text"
                      : "password"
                  }
                  name="currentPassword"
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="employee-password-eye"
                  onClick={() =>
                    toggleVisibility("currentPassword")
                  }
                  aria-label={
                    visiblePasswords.currentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {visiblePasswords.currentPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>
            </div>

            <div className="employee-password-field">
              <label htmlFor="newPassword">
                New password
              </label>

              <div className="employee-password-input-wrap">
                <FaLock className="employee-password-input-icon" />

                <input
                  id="newPassword"
                  type={
                    visiblePasswords.newPassword
                      ? "text"
                      : "password"
                  }
                  name="newPassword"
                  placeholder="Create a new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="employee-password-eye"
                  onClick={() => toggleVisibility("newPassword")}
                  aria-label={
                    visiblePasswords.newPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {visiblePasswords.newPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              <div className="employee-password-strength">
                <div className="employee-password-strength-top">
                  <span>Password strength</span>

                  <strong
                    className={`strength-${strengthLabel
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {strengthLabel}
                  </strong>
                </div>

                <div className="employee-password-strength-bars">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span
                      key={bar}
                      className={bar <= strength ? "active" : ""}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="employee-password-rules">
              <span className={passwordRules.length ? "met" : ""}>
                <FaCheckCircle />
                At least 8 characters
              </span>

              <span className={passwordRules.uppercase ? "met" : ""}>
                <FaCheckCircle />
                One uppercase letter
              </span>

              <span className={passwordRules.lowercase ? "met" : ""}>
                <FaCheckCircle />
                One lowercase letter
              </span>

              <span className={passwordRules.number ? "met" : ""}>
                <FaCheckCircle />
                One number
              </span>

              <span className={passwordRules.special ? "met" : ""}>
                <FaCheckCircle />
                One special character recommended
              </span>
            </div>

            <div className="employee-password-field">
              <label htmlFor="confirmPassword">
                Confirm new password
              </label>

              <div className="employee-password-input-wrap">
                <FaLock className="employee-password-input-icon" />

                <input
                  id="confirmPassword"
                  type={
                    visiblePasswords.confirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm your new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="employee-password-eye"
                  onClick={() =>
                    toggleVisibility("confirmPassword")
                  }
                  aria-label={
                    visiblePasswords.confirmPassword
                      ? "Hide confirmation password"
                      : "Show confirmation password"
                  }
                >
                  {visiblePasswords.confirmPassword ? (
                    <FaEyeSlash />
                  ) : (
                    <FaEye />
                  )}
                </button>
              </div>

              {formData.confirmPassword && (
                <span
                  className={
                    formData.newPassword ===
                    formData.confirmPassword
                      ? "employee-password-match"
                      : "employee-password-mismatch"
                  }
                >
                  {formData.newPassword ===
                  formData.confirmPassword
                    ? "Passwords match."
                    : "Passwords do not match."}
                </span>
              )}
            </div>

            <div className="employee-password-actions">
              <button
                type="submit"
                className="employee-password-submit"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Update Password"}

                {!loading && <FaArrowRight />}
              </button>

              <button
                type="button"
                className="employee-password-cancel"
                onClick={clearForm}
                disabled={loading}
              >
                Clear Form
              </button>
            </div>
          </form>
        </section>

        <aside className="employee-password-sidebar">
          <div className="employee-password-security-art">
            <span>
              <FaShieldAlt />
            </span>
          </div>

          <h2>Keep your account safe</h2>

          <p>
            Follow these security practices when creating a password.
          </p>

          <ul>
            <li>Use a unique password for your work account.</li>
            <li>Avoid sharing your password with anyone.</li>
            <li>Never reuse an old or compromised password.</li>
            <li>Sign out when using a shared computer.</li>
          </ul>

          <div className="employee-password-sidebar-note">
            <FaLock />

            <span>
              Your password should be verified and updated securely
              by the authentication server.
            </span>
          </div>

          <Link
            to="/employee/profile"
            className="employee-password-back"
          >
            <FaArrowLeft />
            Back to My Profile
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default ChangePassword;
