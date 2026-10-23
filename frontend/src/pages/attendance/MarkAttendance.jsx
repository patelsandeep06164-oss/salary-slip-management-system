
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaSave,
  FaClock,
  FaUser,
  FaBuilding,
} from "react-icons/fa";
import employeeService from "../../services/employeeService";
import "./MarkAttendance.css";

function readAttendance() {
  try {
    const data = JSON.parse(
      localStorage.getItem("attendance_records") || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getEmployeeId(employee) {
  return employee?.id ?? employee?._id ?? "";
}

function getDepartmentName(department) {
  if (typeof department === "string") return department;

  if (department && typeof department === "object") {
    return department.name ?? department.departmentName ?? "";
  }

  return "";
}

const createInitialForm = () => ({
  employeeId: "",
  date: getToday(),
  checkIn: "09:00",
  checkOut: "18:00",
  status: "Present",
  notes: "",
});

export default function MarkAttendance() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEmployees() {
      setEmployeesLoading(true);

      try {
        const result = await employeeService.getAll();
        const list = Array.isArray(result)
          ? result
          : result?.employees ?? result?.data ?? [];

        if (active) {
          setEmployees(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (active) {
          setError(err?.message || "Unable to load employee records.");
          setEmployees([]);
        }
      } finally {
        if (active) {
          setEmployeesLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      active = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          String(getEmployeeId(employee)) === String(form.employeeId)
      ),
    [employees, form.employeeId]
  );

  const isTimeDisabled = ["Absent", "Leave"].includes(form.status);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleStatusChange(event) {
    const status = event.target.value;

    setForm((current) => ({
      ...current,
      status,
      checkIn: ["Absent", "Leave"].includes(status)
        ? ""
        : current.checkIn || "09:00",
      checkOut: ["Absent", "Leave"].includes(status)
        ? ""
        : current.checkOut || "18:00",
    }));

    setError("");
    setSuccess("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    if (!selectedEmployee || !form.date || !form.status) {
      setError(
        "Please select a valid employee, date and attendance status."
      );
      return;
    }

    if (form.date > getToday()) {
      setError("Attendance date cannot be in the future.");
      return;
    }

    if (!isTimeDisabled && !form.checkIn) {
      setError("Check-in time is required for this attendance status.");
      return;
    }

    if (
      !isTimeDisabled &&
      form.checkIn &&
      form.checkOut &&
      form.checkOut <= form.checkIn
    ) {
      setError("Check-out time must be later than check-in time.");
      return;
    }

    try {
      const attendance = readAttendance();
      const employeeId = String(getEmployeeId(selectedEmployee));

      const duplicate = attendance.some(
        (record) =>
          String(record.employeeId) === employeeId &&
          record.date === form.date
      );

      if (duplicate) {
        setError(
          "Attendance for this employee and date is already recorded."
        );
        return;
      }

      // Fixed: use window instead of globalThis.
      const recordId =
        typeof window !== "undefined" &&
        typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `attendance_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}`;

      const record = {
        id: recordId,
        employeeId,
        employeeName: selectedEmployee.name || "Unknown Employee",
        employeeCode:
          selectedEmployee.employeeId || selectedEmployee.code || "",
        department: getDepartmentName(selectedEmployee.department),
        date: form.date,
        checkIn: isTimeDisabled ? "" : form.checkIn,
        checkOut: isTimeDisabled ? "" : form.checkOut,
        status: form.status,
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "attendance_records",
        JSON.stringify([...attendance, record])
      );

      setSaving(true);
      setSuccess("Attendance saved successfully. Redirecting...");

      timeoutRef.current = setTimeout(() => {
        navigate("/admin/attendance", {
          state: {
            message: "Attendance saved successfully.",
          },
        });
      }, 700);
    } catch {
      setError(
        "Unable to save attendance. Please check browser storage and try again."
      );
    }
  }

  return (
    <div className="mark-attendance-page">
      <header className="attendance-page-header">
        <Link
          to="/admin/attendance"
          className="attendance-back-button"
          aria-label="Back to attendance list"
        >
          <FaArrowLeft />
        </Link>

        <div className="attendance-page-heading">
          <span className="attendance-page-eyebrow">
            EMPLOYEE MANAGEMENT
          </span>
          <h1>Mark Attendance</h1>
          <p>Record employee attendance and working hours.</p>
        </div>
      </header>

      <section className="attendance-form-card">
        <div className="attendance-form-title">
          <div className="attendance-title-icon">
            <FaCalendarCheck />
          </div>

          <div>
            <h2>Attendance Details</h2>
            <p>Enter the employee's attendance information below.</p>
          </div>
        </div>

        {error && (
          <div
            className="attendance-message attendance-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="attendance-message attendance-message-success"
            role="status"
          >
            {success}
          </div>
        )}

        {employeesLoading ? (
          <div className="attendance-empty-state" role="status">
            <span className="attendance-loading-spinner" />
            <p>Loading employee records...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="attendance-message attendance-message-info">
            <strong>No employee records found.</strong>
            <p>
              Add an employee before marking attendance. The dropdown uses
              your saved employee records and does not contain demo entries.
            </p>

            <Link
              to="/admin/employees/add"
              className="attendance-inline-link"
            >
              Add Employee
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="attendance-form-section-label">
              <FaUser />
              <span>Employee Information</span>
            </div>

            <div className="attendance-form-grid">
              <div className="attendance-field">
                <label htmlFor="employeeId">Employee *</label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={updateField}
                  required
                  disabled={saving}
                >
                  <option value="">Select employee</option>

                  {employees.map((employee, index) => {
                    const id = getEmployeeId(employee);

                    return (
                      <option
                        key={String(id || employee.email || index)}
                        value={id}
                        disabled={!id}
                      >
                        {employee.name || "Unnamed Employee"} (
                        {employee.employeeId || employee.code || "No ID"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="attendance-field">
                <label htmlFor="employeeDepartment">
                  <FaBuilding /> Department
                </label>

                <input
                  id="employeeDepartment"
                  value={getDepartmentName(selectedEmployee?.department)}
                  placeholder="Select an employee first"
                  readOnly
                />
              </div>
            </div>

            <div className="attendance-form-section-label attendance-section-spaced">
              <FaClock />
              <span>Attendance & Working Hours</span>
            </div>

            <div className="attendance-form-grid">
              <div className="attendance-field">
                <label htmlFor="date">Attendance Date *</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  max={getToday()}
                  onChange={updateField}
                  required
                  disabled={saving}
                />
              </div>

              <div className="attendance-field">
                <label htmlFor="status">Attendance Status *</label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleStatusChange}
                  required
                  disabled={saving}
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="attendance-field">
                <label htmlFor="checkIn">
                  <FaClock /> Check-in Time
                </label>
                <input
                  id="checkIn"
                  name="checkIn"
                  type="time"
                  value={form.checkIn}
                  onChange={updateField}
                  disabled={isTimeDisabled || saving}
                  required={!isTimeDisabled}
                />
              </div>

              <div className="attendance-field">
                <label htmlFor="checkOut">
                  <FaClock /> Check-out Time
                </label>
                <input
                  id="checkOut"
                  name="checkOut"
                  type="time"
                  value={form.checkOut}
                  onChange={updateField}
                  disabled={isTimeDisabled || saving}
                />
              </div>

              <div className="attendance-field attendance-field-full">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Add a note about this attendance record..."
                  rows={4}
                  maxLength={500}
                  disabled={saving}
                />

                <span className="attendance-character-count">
                  {form.notes.length}/500 characters
                </span>
              </div>
            </div>

            <div className="attendance-form-actions">
              <Link
                to="/admin/attendance"
                className="attendance-secondary-button"
                onClick={(event) => {
                  if (saving) event.preventDefault();
                }}
                aria-disabled={saving}
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="attendance-primary-button"
                disabled={saving || employeesLoading}
              >
                <FaSave />
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
