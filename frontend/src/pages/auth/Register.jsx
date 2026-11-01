
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaWallet,
  FaShieldAlt,
  FaUsers,
  FaCalendarAlt,
  FaChartBar,
  FaEnvelope,
  FaLock,
  FaUser,
  FaIdBadge,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaCheckCircle,
  FaFingerprint,
  FaArrowLeft,
} from "react-icons/fa";

import authService from "../../services/authService";
import { getApiError } from "../../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [screen, setScreen] = useState("select");
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeCode: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [verificationProof, setVerificationProof] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [completed, setCompleted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSelectRole = (selectedRole) => {
    if (loading) return;

    setRole(selectedRole);
    setError("");
  };

  const handleContinue = () => {
    if (!role) {
      setError("Please select Employee or Admin registration.");
      return;
    }

    setError("");
    setScreen("form");
  };

  const handleBackToSelection = () => {
    if (loading || step !== 1) return;

    setScreen("select");
    setRole("");
    setError("");
    setSuccess("");
  };

  const validateDetails = () => {
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (
      !name ||
      !email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (role === "employee" && !formData.employeeCode.trim()) {
      setError("Employee Code is required.");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  // STEP 1: Send registration OTP
  const handleSendOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateDetails()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role,
      };

      if (role === "employee") {
        payload.employeeCode = formData.employeeCode
          .trim()
          .toUpperCase();
      }

      const response = await authService.sendRegistrationOtp(payload);

      setSuccess(
        response.message || "Verification OTP sent to your email."
      );

      setStep(2);
    } catch (requestError) {
      setError(
        getApiError(requestError, "Unable to send verification OTP.")
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyRegistrationOtp({
        email: formData.email.trim().toLowerCase(),
        otp,
        role,
      });

      if (!response.verificationProof) {
        throw new Error("Email verification proof was not received.");
      }

      setVerificationProof(response.verificationProof);
      setSuccess("Email verified successfully.");
      setStep(3);
    } catch (requestError) {
      setError(
        getApiError(requestError, "OTP verification failed.")
      );
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Complete registration
  const handleCompleteRegistration = async () => {
    setError("");
    setSuccess("");

    if (!verificationProof) {
      setError("Please verify your email before completing registration.");
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
        verificationProof,
      };

      if (role === "employee") {
        payload.employeeCode = formData.employeeCode
          .trim()
          .toUpperCase();
      }

      const response = await authService.register(payload);

      setVerificationProof("");
      setCompleted(true);

      setSuccess(
        response.message ||
          (role === "admin"
            ? "Admin registration submitted for approval."
            : "Employee registration completed successfully.")
      );
    } catch (requestError) {
      setError(
        getApiError(requestError, "Registration could not be completed.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDetails = () => {
    setStep(1);
    setOtp("");
    setVerificationProof("");
    setError("");
    setSuccess("");
  };

  const roleLabel = role === "admin" ? "Administrator" : "Employee";

  return (
    <main className="auth-page register-page">
      <div className="register-orb register-orb-one" />
      <div className="register-orb register-orb-two" />

      <div className="register-shell">

        {/* LEFT PANEL */}
        <section className="register-showcase">

          <Link to="/login" className="register-brand">
            <span className="register-brand-icon">
              <FaWallet />
            </span>

            <span>
              <strong>SalarySlip</strong>
              <small>PAYROLL MANAGEMENT</small>
            </span>
          </Link>

          <div className="register-showcase-content">

            <span className="register-eyebrow">
              <FaShieldAlt />
              SMART PAYROLL SOLUTION
            </span>

            <h1>
              Join your workplace
              <span> with confidence.</span>
            </h1>

            <p className="register-showcase-description">
              A smarter, simpler and more secure way to manage
              your payroll workspace.
            </p>

            <div className="register-dashboard-visual">

              <div className="register-floating-card">
                <span className="register-floating-icon">
                  <FaUsers />
                </span>

                <div>
                  <strong>Employee Hub</strong>
                  <small>
                    Your workplace, payroll and account in one place.
                  </small>
                </div>

                <FaCheckCircle />
              </div>

              <div className="register-laptop">

                <div className="register-laptop-screen">

                  <div className="register-laptop-header">
                    <FaWallet />
                    <strong>SalarySlip</strong>
                    <span>Dashboard</span>
                  </div>

                  <div className="register-laptop-body">

                    <div className="register-mini-sidebar">
                      <span><FaChartBar /></span>
                      <span><FaUsers /></span>
                      <span><FaCalendarAlt /></span>
                      <span><FaWallet /></span>
                    </div>

                    <div className="register-mini-content">
                      <small>WELCOME TO SALARYSLIP</small>
                      <strong>Payroll overview</strong>

                      <div className="register-mini-stats">
                        <div>
                          <FaUsers />
                          <small>Total Employees</small>
                          <strong>120</strong>
                        </div>

                        <div>
                          <FaWallet />
                          <small>Monthly Payroll</small>
                          <strong>₹12.5L</strong>
                        </div>
                      </div>

                      <div className="register-mini-chart">
                        <div className="register-chart-bars">
                          {[35, 60, 45, 78, 55, 90, 68].map(
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

                <div className="register-laptop-base" />
              </div>

              <div className="register-account-card">
                <FaShieldAlt />
                <strong>Secure Account</strong>
                <span><FaCheckCircle /> Email Verification</span>
                <span><FaCheckCircle /> Protected Access</span>
                <span><FaCheckCircle /> Payroll Dashboard</span>
              </div>
            </div>

            <div className="register-feature-list">
              <div className="register-feature">
                <span><FaUsers /></span>
                <div>
                  <strong>Employee Access</strong>
                  <small>Personal payroll workspace.</small>
                </div>
              </div>

              <div className="register-feature">
                <span><FaShieldAlt /></span>
                <div>
                  <strong>Admin Security</strong>
                  <small>Protected administrator access.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="register-showcase-footer">
            <span><FaShieldAlt /> Secure Access</span>
            <i />
            <span><FaCheckCircle /> Trusted Workspace</span>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section className="register-form-panel">

          <div className="register-mobile-brand">
            <span className="register-brand-icon">
              <FaWallet />
            </span>

            <div>
              <strong>SalarySlip</strong>
              <small>PAYROLL MANAGEMENT</small>
            </div>
          </div>

          {!completed ? (
            <>

              {/* ROLE SELECTION SCREEN */}
              {screen === "select" && (
                <div className="register-selection-screen">

                  <div className="register-heading">
                    <span className="register-form-eyebrow">
                      CREATE YOUR ACCOUNT
                    </span>

                    <h2>Choose Account Type</h2>

                    <p>
                      Select how you want to access the SalarySlip
                      workspace.
                    </p>
                  </div>

                  <div className="register-role-options">

                    <button
                      type="button"
                      className={`register-role-card ${
                        role === "employee" ? "active" : ""
                      }`}
                      onClick={() => handleSelectRole("employee")}
                      disabled={loading}
                      aria-pressed={role === "employee"}
                    >
                      <span className="register-role-icon employee-icon">
                        <FaUsers />
                      </span>

                      <span className="register-role-content">
                        <strong>Employee Registration</strong>
                        <small>
                          Register using your company email and Employee Code.
                        </small>
                      </span>

                      <span className="register-role-check">
                        {role === "employee" && <FaCheckCircle />}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={`register-role-card ${
                        role === "admin" ? "active" : ""
                      }`}
                      onClick={() => handleSelectRole("admin")}
                      disabled={loading}
                      aria-pressed={role === "admin"}
                    >
                      <span className="register-role-icon admin-icon">
                        <FaShieldAlt />
                      </span>

                      <span className="register-role-content">
                        <strong>Admin Registration</strong>
                        <small>
                          Request administrator access for your company.
                        </small>
                      </span>

                      <span className="register-role-check">
                        {role === "admin" && <FaCheckCircle />}
                      </span>
                    </button>

                  </div>

                  {error && (
                    <div className="register-alert register-alert-error">
                      <FaShieldAlt />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="register-submit-button"
                    onClick={handleContinue}
                    disabled={!role}
                  >
                    Continue
                    <FaArrowRight />
                  </button>

                  <div className="register-selection-note">
                    <FaShieldAlt />
                    <span>
                      Your account type determines your access and
                      permissions.
                    </span>
                  </div>

                </div>
              )}

              {/* REGISTRATION FORM SCREEN */}
              {screen === "form" && (
                <div className="register-form-screen">

                  <button
                    type="button"
                    className="register-back-to-selection"
                    onClick={handleBackToSelection}
                    disabled={loading || step !== 1}
                  >
                    <FaArrowLeft />
                    Change account type
                  </button>

                  <div className="register-heading">
                    <span className="register-form-eyebrow">
                      {role === "admin"
                        ? "ADMIN ACCOUNT REQUEST"
                        : "EMPLOYEE ACCOUNT"}
                    </span>

                    <h2>
                      {role === "admin"
                        ? "Admin Registration"
                        : "Employee Registration"}
                    </h2>

                    <p>
                      Complete the details below to continue.
                    </p>
                  </div>

                  {/* PROGRESS */}
                  <div className="register-progress">
                    {[
                      { number: 1, label: "Details" },
                      { number: 2, label: "Verify Email" },
                      { number: 3, label: "Complete" },
                    ].map((item, index) => (
                      <div
                        className={`register-progress-step ${
                          step >= item.number ? "active" : ""
                        }`}
                        key={item.number}
                      >
                        <span className="register-step-number">
                          {step > item.number
                            ? <FaCheckCircle />
                            : item.number}
                        </span>

                        <small>{item.label}</small>

                        {index !== 2 && <i />}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div
                      className="register-alert register-alert-error"
                      role="alert"
                    >
                      <FaShieldAlt />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div
                      className="register-alert register-alert-success"
                      role="status"
                    >
                      <FaCheckCircle />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* STEP 1 */}
                  {step === 1 && (
                    <form
                      className="register-form"
                      onSubmit={handleSendOtp}
                    >
                      <div className="register-fields-grid">

                        <div className="register-field">
                          <label htmlFor="register-name">
                            Full Name <b>*</b>
                          </label>

                          <div className="register-input-wrap">
                            <FaUser />
                            <input
                              id="register-name"
                              name="name"
                              type="text"
                              placeholder="Enter your full name"
                              value={formData.name}
                              onChange={handleChange}
                              autoComplete="name"
                              maxLength={100}
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>

                        <div className="register-field">
                          <label htmlFor="register-email">
                            Company Email <b>*</b>
                          </label>

                          <div className="register-input-wrap">
                            <FaEnvelope />
                            <input
                              id="register-email"
                              name="email"
                              type="email"
                              placeholder="you@company.com"
                              value={formData.email}
                              onChange={handleChange}
                              autoComplete="email"
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>

                        {role === "employee" && (
                          <div className="register-field register-field-full">
                            <label htmlFor="register-code">
                              Employee Code <b>*</b>
                            </label>

                            <div className="register-input-wrap">
                              <FaIdBadge />
                              <input
                                id="register-code"
                                name="employeeCode"
                                type="text"
                                placeholder="Enter your employee code"
                                value={formData.employeeCode}
                                onChange={handleChange}
                                autoComplete="off"
                                maxLength={50}
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                        )}

                        <div className="register-field">
                          <label htmlFor="register-password">
                            Password <b>*</b>
                          </label>

                          <div className="register-input-wrap">
                            <FaLock />
                            <input
                              id="register-password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
                              value={formData.password}
                              onChange={handleChange}
                              autoComplete="new-password"
                              minLength={8}
                              required
                              disabled={loading}
                            />

                            <button
                              type="button"
                              className="register-password-toggle"
                              onClick={() =>
                                setShowPassword((value) => !value)
                              }
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                        </div>

                        <div className="register-field">
                          <label htmlFor="register-confirm-password">
                            Confirm Password <b>*</b>
                          </label>

                          <div className="register-input-wrap">
                            <FaLock />
                            <input
                              id="register-confirm-password"
                              name="confirmPassword"
                              type={
                                showConfirmPassword ? "text" : "password"
                              }
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              autoComplete="new-password"
                              required
                              disabled={loading}
                            />

                            <button
                              type="button"
                              className="register-password-toggle"
                              onClick={() =>
                                setShowConfirmPassword((value) => !value)
                              }
                              aria-label={
                                showConfirmPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showConfirmPassword
                                ? <FaEyeSlash />
                                : <FaEye />}
                            </button>
                          </div>
                        </div>

                      </div>

                      <div className="register-role-note">
                        <FaShieldAlt />

                        <span>
                          {role === "employee"
                            ? "Your company email and Employee Code must match an active employee record."
                            : "Your Admin account will remain pending until an existing active Admin approves it."}
                        </span>
                      </div>

                      <button
                        className="register-submit-button"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Sending OTP..." : "Send OTP to Email"}
                        {!loading && <FaArrowRight />}
                        {loading && <span className="register-spinner" />}
                      </button>
                    </form>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <form
                      className="register-form register-otp-form"
                      onSubmit={handleVerifyOtp}
                    >
                      <div className="register-otp-icon">
                        <FaFingerprint />
                      </div>

                      <h3>Verify your email address</h3>

                      <p>
                        We have sent a 6-digit verification code to
                        <strong> {formData.email}</strong>.
                      </p>

                      <div className="register-field">
                        <label htmlFor="register-otp">
                          Email Verification OTP
                        </label>

                        <div className="register-input-wrap">
                          <FaLock />
                          <input
                            id="register-otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(event) => {
                              setOtp(
                                event.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6)
                              );
                              setError("");
                            }}
                            autoComplete="one-time-code"
                            maxLength={6}
                            required
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <button
                        className="register-submit-button"
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? "Verifying..." : "Verify Email OTP"}
                        {!loading && <FaArrowRight />}
                        {loading && <span className="register-spinner" />}
                      </button>

                      <button
                        type="button"
                        className="register-back-button"
                        onClick={handleBackToDetails}
                        disabled={loading}
                      >
                        Back to Account Details
                      </button>
                    </form>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="register-complete-step">

                      <div className="register-verified-icon">
                        <FaCheckCircle />
                      </div>

                      <h3>Email verified successfully!</h3>

                      <p>
                        Your email address has been verified.
                        Complete your registration to continue.
                      </p>

                      <div className="register-summary">
                        <span>Account Type</span>
                        <strong>{roleLabel}</strong>

                        <span>Registered Email</span>
                        <strong>{formData.email}</strong>
                      </div>

                      <button
                        type="button"
                        className="register-submit-button"
                        onClick={handleCompleteRegistration}
                        disabled={loading}
                      >
                        {loading
                          ? "Creating Account..."
                          : "Complete Registration"}
                        {!loading && <FaArrowRight />}
                        {loading && <span className="register-spinner" />}
                      </button>

                      <button
                        type="button"
                        className="register-back-button"
                        onClick={handleBackToDetails}
                        disabled={loading}
                      >
                        Back to Account Details
                      </button>
                    </div>
                  )}

                </div>
              )}

              <div className="register-bottom">
                <span />
                <p>
                  Already have an account?{" "}
                  <Link to="/login">Sign In</Link>
                </p>
                <span />
              </div>

            </>
          ) : (

            <div className="register-success-panel">

              <div className="register-success-icon">
                <FaCheckCircle />
              </div>

              <h2>
                {role === "admin"
                  ? "Request Submitted!"
                  : "Registration Successful!"}
              </h2>

              <p>{success}</p>

              {role === "admin" && (
                <div className="register-pending-note">
                  <FaShieldAlt />
                  <span>
                    Your account is pending approval from an existing
                    Admin. You can log in after approval.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="register-submit-button"
                onClick={() => navigate("/login", { replace: true })}
              >
                Go to Login <FaArrowRight />
              </button>
            </div>

          )}

        </section>
      </div>
    </main>
  );
}

export default Register;
