
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaWallet,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaShieldAlt,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFingerprint,
  FaCalendarCheck,
  FaFileInvoiceDollar,
  FaBell,
} from "react-icons/fa";

import { useAuth } from "../../hooks/useAuth";
import authService from "../../services/authService";
import { getApiError } from "../../services/api";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle all form inputs
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  // Validate and submit login form
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    // Correct email validation regex
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({
        email,
        password,
      });

      // Support common backend response structures
      const data = response?.data || response;

      const user =
        data?.user ||
        data?.data?.user ||
        authService.getStoredUser();

      const token =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        localStorage.getItem("token");

      // Verify successful authentication
      if (!user || !token) {
        authService.logout();

        throw new Error(
          "Login response is missing the user or authentication token. Please check the backend API response."
        );
      }

      const role = String(user.role || "")
        .trim()
        .toLowerCase();

      // Only supported roles can access the application
      if (!["admin", "employee"].includes(role)) {
        authService.logout();

        throw new Error(
          "Your account role is not supported. Please contact the administrator."
        );
      }

      // Save Remember me preference
      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // Update the global authentication context
      login(user, token);

      // Redirect based on the authenticated user's role
      navigate(
        role === "admin"
          ? "/admin/dashboard"
          : "/employee/dashboard",
        { replace: true }
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          "Unable to sign in. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <div className="login-grid-pattern" />

      <div className="auth-shell">
        {/* LEFT PROMOTIONAL PANEL */}
        <section className="login-showcase">
          <Link to="/login" className="auth-brand">
            <span className="auth-brand-icon">
              <FaWallet />
            </span>

            <span className="auth-brand-text">
              <strong>SalarySlip</strong>
              <small>Payroll Management</small>
            </span>
          </Link>

          <div className="login-showcase-content">
            <span className="auth-eyebrow">
              <FaShieldAlt />
              SMART HR &amp; PAYROLL
            </span>

            <h1>
              Simplify your
              <span> payroll journey.</span>
            </h1>

            <p className="login-showcase-description">
              Manage your workforce, track attendance and process
              payroll with a smarter, simpler and more secure
              workspace.
            </p>

            {/* CSS-BASED DASHBOARD ILLUSTRATION */}
            <div className="payroll-visual">
              <div className="visual-glow" />

              <div className="floating-stat floating-stat-top">
                <span className="floating-icon">
                  <FaUsers />
                </span>

                <span>
                  <small>Team members</small>
                  <strong>Employee Hub</strong>
                </span>

                <FaCheckCircle className="floating-check" />
              </div>

              <div className="dashboard-laptop">
                <div className="laptop-screen">
                  <div className="laptop-toolbar">
                    <div className="mini-brand">
                      <FaWallet />
                      <span>SalarySlip</span>
                    </div>

                    <FaBell />
                  </div>

                  <div className="mini-dashboard">
                    <div className="mini-sidebar">
                      <span className="mini-nav active">
                        <FaChartLine />
                      </span>

                      <span className="mini-nav">
                        <FaUsers />
                      </span>

                      <span className="mini-nav">
                        <FaCalendarCheck />
                      </span>

                      <span className="mini-nav">
                        <FaFileInvoiceDollar />
                      </span>
                    </div>

                    <div className="mini-content">
                      <small className="mini-welcome">
                        YOUR WORKSPACE
                      </small>

                      <strong className="mini-title">
                        Payroll overview
                      </strong>

                      <div className="mini-stats">
                        <div className="mini-stat-card">
                          <FaUsers />
                          <small>Employees</small>
                          <strong>Team</strong>
                          <span className="mini-line line-one" />
                        </div>

                        <div className="mini-stat-card">
                          <FaWallet />
                          <small>Payroll</small>
                          <strong>Monthly</strong>
                          <span className="mini-line line-two" />
                        </div>
                      </div>

                      <div className="mini-chart">
                        <div className="chart-heading">
                          <span>Payroll activity</span>
                          <span>Overview</span>
                        </div>

                        <div className="chart-bars">
                          {[34, 54, 42, 72, 49, 88, 64, 95].map(
                            (height, index) => (
                              <span
                                key={index}
                                style={{ height: `${height}%` }}
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="laptop-base" />
              </div>

              <div className="floating-slip">
                <div className="slip-heading">
                  <span className="slip-logo">
                    <FaWallet />
                  </span>

                  <span>
                    <strong>SALARY SLIP</strong>
                    <small>PAYROLL STATEMENT</small>
                  </span>

                  <FaCheckCircle className="slip-verified" />
                </div>

                <div className="slip-divider" />

                <div className="slip-info">
                  <span>Employee</span>
                  <strong>Monthly Payroll</strong>
                </div>

                <div className="slip-info">
                  <span>Payment status</span>

                  <strong className="slip-paid">
                    <FaCheckCircle />
                    Processed
                  </strong>
                </div>

                <div className="slip-divider" />

                <div className="slip-footer">
                  <span>Salary statement</span>
                  <FaFileInvoiceDollar />
                </div>
              </div>

              <div className="floating-secure">
                <FaShieldAlt />
                <span>Secure workspace</span>
              </div>
            </div>

            <div className="login-feature-list">
              <div className="login-feature">
                <span className="login-feature-icon">
                  <FaUsers />
                </span>

                <div className="login-feature-copy">
                  <strong>Employee Management</strong>
                  <small>Keep your employee records organized.</small>
                </div>

                <FaCheckCircle className="login-feature-check" />
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <FaCalendarCheck />
                </span>

                <div className="login-feature-copy">
                  <strong>Attendance Tracking</strong>
                  <small>Monitor attendance and daily work.</small>
                </div>

                <FaCheckCircle className="login-feature-check" />
              </div>

              <div className="login-feature">
                <span className="login-feature-icon">
                  <FaFileInvoiceDollar />
                </span>

                <div className="login-feature-copy">
                  <strong>Smart Payroll Processing</strong>
                  <small>Organize payroll and salary statements.</small>
                </div>

                <FaCheckCircle className="login-feature-check" />
              </div>
            </div>
          </div>

          <div className="login-showcase-footer">
            <span>
              <FaShieldAlt />
              Secure access
            </span>

            <span className="login-footer-dot" />

            <span>
              <FaClock />
              Simplified workflows
            </span>
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="auth-form-panel login-form-panel">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon">
              <FaWallet />
            </span>

            <div>
              <strong>SalarySlip</strong>
              <small>Payroll Management</small>
            </div>
          </div>

          <div className="login-form-top">
            <span className="login-online-dot" />
            <span>YOUR WORKSPACE IS READY</span>
          </div>

          <div className="auth-form-heading">
            <span className="auth-form-label">
              WELCOME BACK!
            </span>

            <h2>Sign in to your account</h2>

            <p>
              Enter your credentials to access your payroll dashboard.
            </p>
          </div>

          {error && (
            <div
              className="auth-alert auth-alert-error"
              role="alert"
              aria-live="polite"
            >
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="auth-field">
              <label htmlFor="login-email">
                Email address
              </label>

              <div className="auth-input-wrap">
                <FaEnvelope className="auth-input-icon" />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-input-wrap">
                <FaLock className="auth-input-icon" />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="auth-form-options">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={loading}
                />

                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="auth-text-link"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              <span>
                {loading ? "Signing you in..." : "Sign In"}
              </span>

              {!loading && <FaArrowRight />}

              {loading && <span className="login-spinner" />}
            </button>
          </form>

          <div className="auth-security-note">
            <span className="security-note-icon">
              <FaFingerprint />
            </span>

            <span>
              <strong>Your security matters</strong>

              <small>
                Secure sign-in for authorized employees and administrators.
              </small>
            </span>

            <FaShieldAlt className="security-note-shield" />
          </div>

          <div className="login-bottom-divider">
            <span />
            <small>HR MANAGEMENT WORKSPACE</small>
            <span />
          </div>

          <div className="login-contact-card">
            <div className="login-contact-icon">
              <FaUsers />
            </div>

            <div>
              <strong>Need access to your account?</strong>
              <p>
                Contact your company administrator for assistance.
              </p>
            </div>
          </div>

          <p className="auth-bottom-text">
            Employee access is available only to authorized users.
          </p>

          <p className="login-copyright">
            © {new Date().getFullYear()} SalarySlip. All rights reserved.
          </p>
        </section>
      </div>
    </main>
  );
}

export default Login;
