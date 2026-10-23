
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaWallet,
  FaEnvelope,
  FaArrowLeft,
  FaPaperPlane,
  FaShieldAlt,
  FaCheckCircle,
  FaLock,
} from "react-icons/fa";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      /*
       * Backend password-reset API is not connected yet.
       * No reset email is sent by this frontend form.
       *
       * Later, connect your backend endpoint here, for example:
       * await authService.forgotPassword(normalizedEmail);
       */

      setMessage(
        "The password-reset service is not connected yet. Please contact your administrator for account recovery."
      );
    } catch {
      setError(
        "Unable to process your request right now. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
    setMessage("");
  };

  return (
    <main className="auth-page forgot-page">
      <div
        className="forgot-decoration forgot-decoration-one"
        aria-hidden="true"
      />
      <div
        className="forgot-decoration forgot-decoration-two"
        aria-hidden="true"
      />
      <div
        className="forgot-grid-pattern"
        aria-hidden="true"
      />

      <section className="forgot-card">
        <Link to="/login" className="forgot-brand">
          <span className="forgot-brand-icon">
            <FaWallet />
          </span>

          <span className="forgot-brand-text">
            <strong>SalarySlip</strong>
            <small>Payroll Management</small>
          </span>
        </Link>

        <div className="forgot-illustration" aria-hidden="true">
          <div className="forgot-illustration-orbit forgot-orbit-one" />
          <div className="forgot-illustration-orbit forgot-orbit-two" />

          <div className="forgot-illustration-ring">
            <div className="forgot-illustration-icon">
              <FaLock />
            </div>

            <span className="forgot-floating-envelope">
              <FaEnvelope />
            </span>

            <span className="forgot-floating-check">
              <FaCheckCircle />
            </span>
          </div>
        </div>

        <div className="forgot-heading">
          <span className="forgot-kicker">
            <FaShieldAlt />
            ACCOUNT RECOVERY
          </span>

          <h1>Forgot your password?</h1>

          <p>
            It happens. Enter your registered email address to begin
            the account recovery process.
          </p>
        </div>

        {error && (
          <div
            className="forgot-message forgot-message-error"
            role="alert"
          >
            <FaShieldAlt />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            className="forgot-message forgot-message-info"
            role="status"
          >
            <FaCheckCircle />
            <span>{message}</span>
          </div>
        )}

        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="forgot-field">
            <label htmlFor="forgot-email">
              Registered email address
            </label>

            <div className="forgot-input-wrap">
              <FaEnvelope className="forgot-input-icon" />

              <input
                id="forgot-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={loading}
              />
            </div>

            <small className="forgot-field-hint">
              Use the email address associated with your account.
            </small>
          </div>

          <button
            type="submit"
            className="forgot-submit-button"
            disabled={loading}
          >
            <span>
              {loading ? "Please wait..." : "Send Reset Instructions"}
            </span>

            {!loading && <FaPaperPlane />}

            {loading && <span className="forgot-spinner" />}
          </button>
        </form>

        <div className="forgot-security-note">
          <span className="forgot-security-icon">
            <FaShieldAlt />
          </span>

          <div>
            <strong>Secure account recovery</strong>
            <p>
              A real reset flow should use a time-limited, single-use
              token and verify it on the server.
            </p>
          </div>
        </div>

        <Link to="/login" className="forgot-back-link">
          <FaArrowLeft />
          <span>Back to Sign In</span>
        </Link>

        <footer className="forgot-footer">
          <span className="forgot-footer-line" />
          <p>
            © {new Date().getFullYear()} SalarySlip. All rights reserved.
          </p>
          <span className="forgot-footer-caption">
            HR &amp; PAYROLL MANAGEMENT
          </span>
        </footer>
      </section>
    </main>
  );
}

export default ForgotPassword;
