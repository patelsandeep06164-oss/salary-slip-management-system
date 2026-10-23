
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdBadge,
  FaBuilding,
  FaBriefcase,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";

const DEFAULT_DEPARTMENTS = [
  "IT & Software Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "Mobile App Development",
  "UI/UX Design",
  "QA & Testing",
  "DevOps & Cloud",
  "Cybersecurity",
  "Database Administration",
  "Data Science & Analytics",
  "AI/ML",
  "HR & Recruitment",
  "Finance & Accounts",
  "Sales & Marketing",
  "Business Development",
  "Project Management",
  "Customer Support",
  "Administration",
];

const styles = `
.employee-form-page,
.employee-form-page * {
  box-sizing: border-box;
}

.employee-form-page {
  width: 100%;
  min-width: 0;
  color: #1e293b;
  font-family: Arial, Helvetica, sans-serif;
}

.ef-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}

.ef-back {
  width: 43px;
  height: 43px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0284c7;
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s ease;
}

.ef-back:hover {
  color: #ffffff;
  background: #0284c7;
  border-color: #0284c7;
  transform: translateX(-2px);
}

.ef-header h1 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.7px;
}

.ef-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.ef-card {
  width: 100%;
  padding: 27px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #e2edf7;
  border-radius: 17px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.045);
}

.ef-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 22px;
  padding-bottom: 16px;
  color: #0f172a;
  border-bottom: 1px solid #edf2f7;
  font-size: 16px;
  font-weight: 750;
}

.ef-section-icon {
  width: 35px;
  height: 35px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0284c7;
  background: #e0f7ff;
  border-radius: 10px;
}

.ef-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 22px;
}

.ef-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.ef-field label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.ef-field-icon {
  margin-right: 3px;
  color: #0284c7;
  font-size: 12px;
}

.ef-field input,
.ef-field select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 11px 13px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #dbe5f1;
  border-radius: 10px;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ef-field input::placeholder {
  color: #94a3b8;
}

.ef-field input:focus,
.ef-field select:focus {
  border-color: #06a5d8;
  box-shadow: 0 0 0 3px rgba(6, 165, 216, 0.12);
}

.ef-field input:disabled,
.ef-field select:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  background: #f8fafc;
}

.ef-required {
  color: #dc2626;
}

.ef-hint {
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.5;
}

.ef-notice {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 20px;
  padding: 13px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.ef-notice svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.ef-error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.ef-success {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.ef-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid #edf2f7;
}

.ef-btn {
  min-height: 43px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 11px 18px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #dbe5f1;
  border-radius: 10px;
  text-decoration: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ef-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}

.ef-btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #0891b2, #2563eb);
  border-color: transparent;
  box-shadow: 0 5px 13px rgba(37, 99, 235, 0.17);
}

.ef-btn.primary:hover:not(:disabled) {
  box-shadow: 0 7px 18px rgba(37, 99, 235, 0.25);
  transform: translateY(-1px);
}

.ef-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.ef-btn:focus-visible,
.ef-back:focus-visible {
  outline: 3px solid rgba(14, 165, 233, 0.35);
  outline-offset: 3px;
}

.ef-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: ef-spin 0.7s linear infinite;
}

@keyframes ef-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .ef-card {
    padding: 20px;
  }

  .ef-grid {
    gap: 17px;
  }
}

@media (max-width: 520px) {
  .ef-header {
    gap: 11px;
    margin-bottom: 18px;
  }

  .ef-back {
    width: 39px;
    height: 39px;
  }

  .ef-header h1 {
    font-size: 22px;
  }

  .ef-header p {
    font-size: 12px;
  }

  .ef-card {
    padding: 16px;
    border-radius: 13px;
  }

  .ef-section-title {
    align-items: flex-start;
    font-size: 14px;
    line-height: 1.5;
  }

  .ef-section-icon {
    width: 31px;
    height: 31px;
  }

  .ef-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .ef-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }

  .ef-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .employee-form-page *,
  .employee-form-page *::before,
  .employee-form-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  employeeId: "",
  department: "",
  designation: "",
  joiningDate: "",
  salary: "",
  status: "Active",
};

function readDepartments() {
  try {
    const stored = localStorage.getItem("department_records");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDepartmentName(department) {
  if (typeof department === "string") return department;

  if (department && typeof department === "object") {
    return department.name || department.departmentName || "";
  }

  return "";
}

function normalizeDepartments(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.departments)) return response.departments;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.departments)) {
    return response.data.departments;
  }

  return [];
}

function getErrorMessage(error) {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to save employee. Please try again."
  );
}

export default function AddEmployee() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadDepartments() {
      try {
        const response = await departmentService.getAll();
        const records = normalizeDepartments(response);

        const names = records
          .map(getDepartmentName)
          .map((name) => name.trim())
          .filter(Boolean);

        if (isMounted) {
          setDepartments(
            names.length > 0
              ? [...new Set(names)]
              : DEFAULT_DEPARTMENTS
          );
        }
      } catch {
        const savedDepartments = readDepartments();

        const savedNames = savedDepartments
          .map(getDepartmentName)
          .map((name) => name.trim())
          .filter(Boolean);

        if (isMounted) {
          setDepartments(
            savedNames.length > 0
              ? [...new Set(savedNames)]
              : DEFAULT_DEPARTMENTS
          );
        }
      }
    }

    loadDepartments();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const employeeId = form.employeeId.trim();

    if (!name || !email || !employeeId) {
      setError("Please fill in employee name, email and employee ID.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (
      form.phone.trim() &&
      !/^[+\d\s()-]{7,20}$/.test(form.phone.trim())
    ) {
      setError("Please enter a valid phone number.");
      return;
    }

    const salary = form.salary === "" ? 0 : Number(form.salary);

    if (!Number.isFinite(salary) || salary < 0) {
      setError("Monthly salary must be a valid non-negative amount.");
      return;
    }

    const normalizedEmployeeId = employeeId.toLowerCase();

    setSaving(true);

    try {
      const existingResult = await employeeService.getAll();

      const existingEmployees = Array.isArray(existingResult)
        ? existingResult
        : Array.isArray(existingResult?.data)
        ? existingResult.data
        : Array.isArray(existingResult?.employees)
        ? existingResult.employees
        : Array.isArray(existingResult?.data?.employees)
        ? existingResult.data.employees
        : [];

      const duplicate = existingEmployees.some((employee) => {
        const existingId = String(employee.employeeId || "")
          .trim()
          .toLowerCase();

        const existingEmail = String(employee.email || "")
          .trim()
          .toLowerCase();

        return (
          existingId === normalizedEmployeeId ||
          existingEmail === email
        );
      });

      if (duplicate) {
        setError("Employee ID or email already exists.");
        return;
      }

      const newEmployee = {
        ...form,
        name,
        email,
        employeeId,
        phone: form.phone.trim(),
        department: form.department.trim(),
        designation: form.designation.trim(),
        joiningDate: form.joiningDate || "",
        salary,
        status: form.status,
        createdAt: new Date().toISOString(),
      };

      await employeeService.create(newEmployee);

      navigate("/admin/employees", {
        replace: true,
        state: { message: "Employee added successfully." },
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="employee-form-page">
      <style>{styles}</style>

      <header className="ef-header">
        <Link
          to="/admin/employees"
          className="ef-back"
          aria-label="Back to employees"
        >
          <FaArrowLeft />
        </Link>

        <div>
          <h1>Add Employee</h1>
          <p>Create a new employee profile.</p>
        </div>
      </header>

      <form className="ef-card" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="ef-notice ef-error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        <h2 className="ef-section-title">
          <span className="ef-section-icon">
            <FaUserPlus />
          </span>
          Personal and Employment Details
        </h2>

        <div className="ef-grid">
          <div className="ef-field">
            <label htmlFor="employee-name">
              <FaUser className="ef-field-icon" />
              Full Name <span className="ef-required">*</span>
            </label>
            <input
              id="employee-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter full name"
              maxLength={100}
              required
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-email">
              <FaEnvelope className="ef-field-icon" />
              Email Address <span className="ef-required">*</span>
            </label>
            <input
              id="employee-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              placeholder="employee@company.com"
              maxLength={254}
              required
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-phone">
              <FaPhone className="ef-field-icon" />
              Phone Number
            </label>
            <input
              id="employee-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="Enter phone number"
              maxLength={20}
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-id">
              <FaIdBadge className="ef-field-icon" />
              Employee ID <span className="ef-required">*</span>
            </label>
            <input
              id="employee-id"
              name="employeeId"
              type="text"
              value={form.employeeId}
              onChange={updateField}
              placeholder="e.g. EMP-001"
              maxLength={50}
              required
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-department">
              <FaBuilding className="ef-field-icon" />
              Department
            </label>
            <select
              id="employee-department"
              name="department"
              value={form.department}
              onChange={updateField}
              disabled={saving}
            >
              <option value="">Select department</option>
              {departments.map((department, index) => {
                const departmentName = getDepartmentName(department);

                if (!departmentName) return null;

                return (
                  <option
                    key={`${departmentName}-${index}`}
                    value={departmentName}
                  >
                    {departmentName}
                  </option>
                );
              })}
            </select>
            <span className="ef-hint">
              Select the employee's department.
            </span>
          </div>

          <div className="ef-field">
            <label htmlFor="employee-designation">
              <FaBriefcase className="ef-field-icon" />
              Designation
            </label>
            <input
              id="employee-designation"
              name="designation"
              type="text"
              value={form.designation}
              onChange={updateField}
              placeholder="e.g. Frontend Developer"
              maxLength={100}
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-joining-date">
              <FaCalendarAlt className="ef-field-icon" />
              Joining Date
            </label>
            <input
              id="employee-joining-date"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={updateField}
              disabled={saving}
            />
          </div>

          <div className="ef-field">
            <label htmlFor="employee-salary">
              <FaMoneyBillWave className="ef-field-icon" />
              Monthly Salary (₹)
            </label>
            <input
              id="employee-salary"
              name="salary"
              type="number"
              min="0"
              step="0.01"
              value={form.salary}
              onChange={updateField}
              placeholder="Enter monthly salary"
              inputMode="decimal"
              disabled={saving}
            />
            <span className="ef-hint">
              Enter 0 or leave blank if salary has not been set.
            </span>
          </div>

          <div className="ef-field">
            <label htmlFor="employee-status">
              <FaCheckCircle className="ef-field-icon" />
              Employment Status
            </label>
            <select
              id="employee-status"
              name="status"
              value={form.status}
              onChange={updateField}
              disabled={saving}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="ef-actions">
          <Link
            className="ef-btn"
            to="/admin/employees"
            aria-disabled={saving}
            onClick={(event) => {
              if (saving) event.preventDefault();
            }}
          >
            Cancel
          </Link>

          <button className="ef-btn primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="ef-spinner" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save Employee
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
