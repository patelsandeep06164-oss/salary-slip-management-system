
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
import departmentService from "../../services/departmentService";
import attendanceService from "../../services/attendantService";
import "./MarkAttendance.css";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEmployeeId(employee) {
  return String(employee?._id || employee?.id || "");
}

function getEmployeeName(employee) {
  const fullName = `${employee?.firstName || ""} ${
    employee?.lastName || ""
  }`.trim();

  return (
    fullName ||
    employee?.name ||
    employee?.fullName ||
    employee?.employeeName ||
    "Unnamed Employee"
  );
}

function getDepartmentId(department) {
  if (department && typeof department === "object") {
    department = department._id || department.id || "";
  }

  return String(department || "").trim();
}

function getDepartmentName(department, departments = []) {
  if (department && typeof department === "object") {
    return (
      department.name ||
      department.departmentName ||
      department.title ||
      department.code ||
      ""
    );
  }

  const value = String(department || "").trim();

  if (!value) return "";

  // If the value is a department ID, resolve it using the department list.
  const matchedDepartment = departments.find(
    (item) =>
      String(item?._id || item?.id || "") === value
  );

  if (matchedDepartment) {
    return (
      matchedDepartment.name ||
      matchedDepartment.departmentName ||
      matchedDepartment.code ||
      ""
    );
  }

  // Do not display an unpopulated MongoDB ID as a department name.
  if (/^[a-f\d]{24}$/i.test(value)) {
    return "";
  }

  // Supports APIs that return the department name directly.
  return value;
}

function getApiError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function extractEmployees(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.data?.employees)) {
    return response.data.employees;
  }
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.employees)) {
    return response.data.data.employees;
  }

  return [];
}

function extractDepartments(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.departments)) {
    return response.departments;
  }
  if (Array.isArray(response?.data?.departments)) {
    return response.data.departments;
  }
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.departments)) {
    return response.data.data.departments;
  }

  return [];
}

const createInitialForm = () => ({
  employeeId: "",
  date: getToday(),
  checkIn: "09:00",
  checkOut: "18:00",
  status: "Present",
  notes: "",
});

const statusMap = {
  Present: "present",
  Late: "late",
  Absent: "absent",
  "Half Day": "half-day",
  Leave: "on-leave",
};

export default function MarkAttendance() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(createInitialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setEmployeesLoading(true);
      setError("");

      // Load both lists. The employee API may already populate department,
      // while the department list lets us resolve an ID if it does not.
      const [employeeResult, departmentResult] = await Promise.allSettled([
        employeeService.getAll(),
        departmentService.getAll(),
      ]);

      if (!active) return;

      if (employeeResult.status === "fulfilled") {
        const list = extractEmployees(employeeResult.value).filter(
          (employee) => getEmployeeId(employee)
        );

        setEmployees(list);

        if (list.length === 0) {
          setError("No employees were returned by the employee API.");
        }
      } else {
        setEmployees([]);
        setError(
          getApiError(
            employeeResult.reason,
            "Unable to load employee records. Please check your login and API."
          )
        );
      }

      if (departmentResult.status === "fulfilled") {
        setDepartments(extractDepartments(departmentResult.value));
      } else {
        // Employee data may still contain populated department details.
        setDepartments([]);
      }

      setEmployeesLoading(false);
    }

    loadData();

    return () => {
      active = false;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const selectedEmployee = useMemo(() => {
    return (
      employees.find(
        (employee) =>
          getEmployeeId(employee) === String(form.employeeId)
      ) || null
    );
  }, [employees, form.employeeId]);

  const selectedDepartmentName = useMemo(() => {
    return getDepartmentName(
      selectedEmployee?.department,
      departments
    );
  }, [selectedEmployee, departments]);

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
    const timeDisabled = ["Absent", "Leave"].includes(status);

    setForm((current) => ({
      ...current,
      status,
      checkIn: timeDisabled ? "" : current.checkIn || "09:00",
      checkOut: timeDisabled ? "" : current.checkOut || "18:00",
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
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

    if (!statusMap[form.status]) {
      setError("Please select a valid attendance status.");
      return;
    }

    if (!isTimeDisabled && !form.checkIn) {
      setError("Check-in time is required.");
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

    const employeeId = getEmployeeId(selectedEmployee);

    if (!employeeId) {
      setError("The selected employee does not have a valid database ID.");
      return;
    }

    setSaving(true);

    try {
      await attendanceService.markAttendance({
        employee: employeeId,
        date: form.date,
        status: statusMap[form.status],
        remarks: form.notes.trim(),
      });

      setSuccess("Attendance saved successfully. Redirecting...");

      timeoutRef.current = setTimeout(() => {
        navigate("/admin/attendance", {
          state: {
            message: "Attendance saved successfully.",
          },
        });
      }, 700);
    } catch (err) {
      setError(
        getApiError(
          err,
          "Unable to save attendance. Please try again."
        )
      );
    } finally {
      setSaving(false);
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
              Employees could not be loaded. Check the employee API
              response and your login permissions.
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

                  {employees.map((employee) => {
                    const id = getEmployeeId(employee);

                    return (
                      <option key={id} value={id}>
                        {getEmployeeName(employee)} (
                        {employee.employeeCode ||
                          employee.employeeId ||
                          employee.code ||
                          "No ID"}
                        )
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
                  value={selectedDepartmentName}
                  placeholder={
                    !selectedEmployee
                      ? "Select an employee first"
                      : selectedDepartmentName
                        ? ""
                        : "Department not assigned or unavailable"
                  }
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
