
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUmbrellaBeach,
  FaCalendarAlt,
  FaArrowLeft,
  FaArrowRight,
  FaPaperPlane,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaClock,
  FaRegCalendarCheck,
} from "react-icons/fa";
import "./ApplyLeave.css";

const initialForm = {
  leaveType: "Casual Leave",
  startDate: "",
  endDate: "",
  reason: "",
};

function readEmployee() {
  try {
    return JSON.parse(localStorage.getItem("current_employee") || "null");
  } catch {
    return null;
  }
}

function readLeaves() {
  try {
    const value = JSON.parse(
      localStorage.getItem("leave_requests") || "[]"
    );
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function getEmployeeName(employee) {
  return (
    employee?.name ||
    employee?.fullName ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
    "Employee"
  );
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  return Math.round((end - start) / 86400000) + 1;
}

function formatDate(dateString) {
  if (!dateString) return "Not selected";

  const date = new Date(`${dateString}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function ApplyLeave() {
  const navigate = useNavigate();
  const employee = readEmployee();

  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const today = getDateKey(new Date());
  const totalDays = calculateDays(
    formData.startDate,
    formData.endDate
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "startDate" &&
      previous.endDate &&
      value > previous.endDate
        ? { endDate: value }
        : {}),
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (loading) return;

    if (!employee) {
      setError(
        "Employee profile not found. Please sign in with your employee account before applying for leave."
      );
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select both the start date and end date.");
      return;
    }

    if (formData.startDate < today) {
      setError("Leave start date cannot be in the past.");
      return;
    }

    if (formData.endDate < formData.startDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }

    if (formData.reason.trim().length < 10) {
      setError("Please provide a reason of at least 10 characters.");
      return;
    }

    const employeeId =
      employee.employeeId || employee.employeeCode || employee.id || "";

    const employeeEmail = employee.email || "";
    const leaves = readLeaves();

    const overlappingLeave = leaves.some((leave) => {
      const sameEmployee =
        (employeeId &&
          String(leave.employeeId || leave.employeeCode || "") ===
            String(employeeId)) ||
        (employeeEmail &&
          String(leave.email || "").toLowerCase() ===
            employeeEmail.toLowerCase());

      const status = String(leave.status || "").toLowerCase();
      const activeRequest = ![
        "rejected",
        "cancelled",
        "canceled",
      ].includes(status);

      const existingStart = String(leave.startDate || "");
      const existingEnd = String(leave.endDate || "");

      return (
        sameEmployee &&
        activeRequest &&
        existingStart &&
        existingEnd &&
        formData.startDate <= existingEnd &&
        formData.endDate >= existingStart
      );
    });

    if (overlappingLeave) {
      setError(
        "You already have a pending or approved leave request overlapping these dates."
      );
      return;
    }

    setLoading(true);

    try {
      const newLeave = {
        id:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `leave-${Date.now()}`,
        employeeId,
        employeeName: getEmployeeName(employee),
        email: employeeEmail,
        department: employee.department || "",
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays,
        reason: formData.reason.trim(),
        status: "Pending",
        appliedOn: today,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "leave_requests",
        JSON.stringify([newLeave, ...leaves])
      );

      setSuccess("Your leave request has been saved successfully.");
      setFormData(initialForm);

      navigate("/employee/leaves", { replace: false });
    } catch {
      setError(
        "Unable to save the leave request. Please check your browser storage and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="apply-leave-page">
      <div className="apply-leave-top-line" />

      <header className="apply-leave-header">
        <div className="apply-leave-header-content">
          <span className="apply-leave-eyebrow">
            <span className="apply-leave-eyebrow-dot" />
            EMPLOYEE SELF SERVICE
          </span>

          <h1>Apply for Leave</h1>

          <p>
            Plan your time off and submit your leave request for
            administrator approval.
          </p>
        </div>

        <div className="apply-leave-header-icon">
          <FaUmbrellaBeach />
        </div>
      </header>

      <div className="apply-leave-breadcrumb">
        <Link to="/employee/dashboard">Dashboard</Link>
        <FaArrowRight />
        <span>Apply for Leave</span>
      </div>

      <div className="apply-leave-layout">
        <section className="apply-leave-card">
          <div className="apply-leave-card-heading">
            <span className="apply-leave-heading-icon">
              <FaFileAlt />
            </span>

            <div>
              <h2>Leave application form</h2>
              <p>
                Enter your leave details carefully before submitting.
              </p>
            </div>
          </div>

          {error && (
            <div className="apply-leave-alert error" role="alert">
              <FaTimesCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="apply-leave-alert success" role="status">
              <FaCheckCircle />
              <span>{success}</span>
            </div>
          )}

          <form
            className="apply-leave-form"
            onSubmit={handleSubmit}
          >
            <div className="apply-leave-field">
              <label htmlFor="leaveType">Leave category</label>

              <select
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                <option value="Earned Leave">Earned Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="apply-leave-section-label">
              <FaCalendarAlt />
              <span>Leave schedule</span>
            </div>

            <div className="apply-leave-date-grid">
              <div className="apply-leave-field">
                <label htmlFor="startDate">Start date</label>

                <div className="apply-leave-input-wrap">
                  <FaCalendarAlt />

                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    min={today}
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="apply-leave-field">
                <label htmlFor="endDate">End date</label>

                <div className="apply-leave-input-wrap">
                  <FaCalendarAlt />

                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="apply-leave-duration">
              <div className="apply-leave-duration-icon">
                <FaRegCalendarCheck />
              </div>

              <div className="apply-leave-duration-copy">
                <span>Total requested duration</span>
                <strong>
                  {totalDays} {totalDays === 1 ? "day" : "days"}
                </strong>
                <small>
                  {formData.startDate && formData.endDate
                    ? `${formatDate(formData.startDate)} – ${formatDate(
                        formData.endDate
                      )}`
                    : "Select your dates to calculate duration"}
                </small>
              </div>

              <FaClock className="apply-leave-duration-clock" />
            </div>

            <div className="apply-leave-field">
              <label htmlFor="reason">Reason for leave</label>

              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Please explain the reason for your leave..."
                rows={5}
                maxLength={500}
                minLength={10}
                required
              />

              <div className="apply-leave-character-count">
                <span>Minimum 10 characters</span>
                <span>{formData.reason.length}/500</span>
              </div>
            </div>

            <div className="apply-leave-notice">
              <FaInfoCircle />

              <p>
                Your request will remain pending until an administrator
                reviews it. Submission does not guarantee approval.
              </p>
            </div>

            <div className="apply-leave-actions">
              <Link
                to="/employee/leaves"
                className="apply-leave-cancel-button"
              >
                <FaArrowLeft />
                Cancel
              </Link>

              <button
                type="submit"
                className="apply-leave-submit-button"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
                {!loading && <FaPaperPlane />}
              </button>
            </div>
          </form>
        </section>

        <aside className="apply-leave-sidebar">
          <div className="apply-leave-sidebar-art">
            <div className="apply-leave-art-circle circle-one" />
            <div className="apply-leave-art-circle circle-two" />
            <FaUmbrellaBeach />
          </div>

          <span className="apply-leave-sidebar-label">
            LEAVE GUIDELINES
          </span>

          <h2>Before you submit</h2>

          <p className="apply-leave-sidebar-description">
            A few simple checks can help your leave request go smoothly.
          </p>

          <ul className="apply-leave-check-list">
            <li>
              <FaCheckCircle />
              <span>Select the correct leave category.</span>
            </li>
            <li>
              <FaCheckCircle />
              <span>Verify your start and end dates.</span>
            </li>
            <li>
              <FaCheckCircle />
              <span>Provide a clear reason for your request.</span>
            </li>
            <li>
              <FaCheckCircle />
              <span>Check your request status after submission.</span>
            </li>
          </ul>

          <div className="apply-leave-sidebar-tip">
            <span className="apply-leave-tip-icon">
              <FaInfoCircle />
            </span>

            <div>
              <strong>Already applied?</strong>
              <p>Review your previous leave requests.</p>

              <Link to="/employee/leaves">
                View My Leaves <FaArrowRight />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default ApplyLeave;
