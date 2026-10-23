import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaWallet,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";
import "./ResetPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => {
    const password = formData.password;

    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [formData.password]);

  const strengthScore = Object.values(passwordChecks).filter(Boolean).length;

  const strengthLabel = (() => {
    if (!formData.password) return "Not entered";
    if (strengthScore <= 2) return "Weak";
    if (strengthScore <= 4) return "Good";
    return "Strong";
  })();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError(
        "Reset token is missing. Please open the password-reset link from your email."
      );
      return;
    }

    if (
      !passwordChecks.length ||
      !passwordChecks.uppercase ||
      !passwordChecks.lowercase ||
      !passwordChecks.number
    ) {
      setError(
        "Use at least 8 characters, including uppercase, lowercase and a number."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("The new password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      // Backend password-reset API is not connected yet.
      // Never change a password or report success without server confirmation.
      setError(
        "Password reset is not available yet because the backend API is not connected."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page reset-page">
      <div className="reset-decoration reset-decoration-one" />
      <div className="reset-decoration reset-decoration-two" />
      <div className="reset-grid-pattern" />

      <section className="reset-card">
        <Link to="/" className="reset-brand">
          <span className="reset-brand-icon">
            <FaWallet />
          </span>

          <span className="reset-brand-text">
            <strong>Salary Slip</strong>
            <small>HR &amp; Payroll Management</small>
          </span>
        </Link>

        <div className="reset-icon-area">
          <div className="reset-lock-circle">
            <FaLock />
          </div>

          <span className="reset-verified-icon">
            <FaShieldAlt />
          </span>
        </div>

        <div className="reset-heading">
          <span className="reset-kicker">ACCOUNT SECURITY</span>
          <h1>Create a new password</h1>
          <p>
            Choose a strong password to keep your Salary Slip account secure.
          </p>
        </div>

        {error && (
          <div className="reset-alert reset-alert-error" role="alert">
            <FaShieldAlt />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="reset-alert reset-alert-success" role="status">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="reset-field">
            <label htmlFor="reset-password">New password</label>

            <div className="reset-input-wrap">
              <FaLock className="reset-input-icon" />

              <input
                id="reset-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter a new password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="reset-strength">
            <div className="reset-strength-top">
              <span>Password strength</span>
              <strong
                className={`reset-strength-label strength-${strengthLabel
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {strengthLabel}
              </strong>
            </div>

            <div
              className="reset-strength-bars"
              role="progressbar"
              aria-label="Password strength"
              aria-valuemin={0}
              aria-valuemax={5}
              aria-valuenow={strengthScore}
            >
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={bar <= strengthScore ? "active" : ""}
                />
              ))}
            </div>
          </div>

          <div className="reset-password-rules">
            <span className={passwordChecks.length ? "rule-met" : ""}>
              <FaCheckCircle />
              At least 8 characters
            </span>

            <span className={passwordChecks.uppercase ? "rule-met" : ""}>
              <FaCheckCircle />
              One uppercase letter
            </span>

            <span className={passwordChecks.lowercase ? "rule-met" : ""}>
              <FaCheckCircle />
              One lowercase letter
            </span>

            <span className={passwordChecks.number ? "rule-met" : ""}>
              <FaCheckCircle />
              One number
            </span>

            <span className={passwordChecks.special ? "rule-met" : ""}>
              <FaCheckCircle />
              One special character (recommended)
            </span>
          </div>

          <div className="reset-field">
            <label htmlFor="reset-confirm-password">
              Confirm new password
            </label>

            <div className="reset-input-wrap">
              <FaLock className="reset-input-icon" />

              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <span className="reset-mismatch-message">
                  Passwords do not match.
                </span>
              )}

            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <span className="reset-match-message">
                  <FaCheckCircle />
                  Passwords match.
                </span>
              )}
          </div>

          <button
            type="submit"
            className="reset-submit-button"
            disabled={loading}
          >
            <span>{loading ? "Please wait..." : "Reset Password"}</span>
            {!loading && <FaArrowRight />}
          </button>
        </form>

        <div className="reset-security-note">
          <FaShieldAlt />
          <span>Never share your password or reset link with anyone.</span>
        </div>

        <Link to="/login" className="reset-back-link">
          <FaArrowLeft />
          Back to Sign In
        </Link>

        <footer className="reset-footer">
          © {new Date().getFullYear()} Salary Slip. All rights reserved.
        </footer>
      </section>
    </main>
  );
}

export default ResetPassword;
