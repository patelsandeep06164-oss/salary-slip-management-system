
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaUserEdit,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";

const styles = `
.edit-employee-page {
  width: 100%;
  min-width: 0;
  color: var(--text-primary, #1e293b);
  font-family: Arial, sans-serif;
}
.edit-employee-page *,
.edit-employee-page *::before,
.edit-employee-page *::after {
  box-sizing: border-box;
}
.ee-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.ee-back {
  flex: 0 0 43px;
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 12px;
  color: #0891b2;
  background: var(--surface, #fff);
  text-decoration: none;
}
.ee-header h1 {
  margin: 0 0 6px;
  font-size: clamp(22px, 3vw, 29px);
  font-weight: 750;
}
.ee-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  line-height: 1.5;
}
.ee-card,
.ee-state-card {
  width: 100%;
  padding: clamp(16px, 3vw, 28px);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 18px;
  background: var(--surface, #fff);
  box-shadow: 0 8px 30px rgba(15, 23, 42, .05);
}
.ee-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 17px;
}
.ee-section-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 11px;
  background: #cffafe;
  color: #0891b2;
}
.ee-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.ee-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ee-field label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #334155);
}
.ee-required {
  color: #dc2626;
}
.ee-field input,
.ee-field select {
  width: 100%;
  min-width: 0;
  min-height: 45px;
  padding: 11px 13px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: var(--text-primary, #1e293b);
  outline: none;
  font: inherit;
  font-size: 14px;
  transition: border-color .2s, box-shadow .2s;
}
.ee-field input:focus,
.ee-field select:focus {
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, .12);
}
.ee-field input:disabled,
.ee-field select:disabled {
  opacity: .65;
  cursor: not-allowed;
}
.ee-hint {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}
.ee-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 15px;
  margin-bottom: 20px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.ee-message.error {
  color: #991b1b;
  background: #fee2e2;
  border: 1px solid #fecaca;
}
.ee-message.success {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}
.ee-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color, #e2e8f0);
}
.ee-btn {
  min-height: 43px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 11px 18px;
  border: 1px solid var(--border-color, #cbd5e1);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: var(--text-primary, #334155);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.ee-btn.primary {
  border-color: #0891b2;
  background: linear-gradient(135deg, #0891b2, #2563eb);
  color: #fff;
}
.ee-btn:disabled {
  opacity: .65;
  cursor: not-allowed;
}
.ee-state-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ee-spinner {
  display: inline-block;
  animation: ee-spin 1s linear infinite;
}
@keyframes ee-spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 650px) {
  .ee-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .ee-header {
    align-items: flex-start;
    gap: 11px;
  }
  .ee-back {
    flex-basis: 39px;
    width: 39px;
    height: 39px;
  }
  .ee-actions {
    flex-direction: column-reverse;
  }
  .ee-btn {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .edit-employee-page *,
  .edit-employee-page *::before,
  .edit-employee-page *::after {
    animation: none !important;
    transition: none !important;
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
  status: "active",
};

function getApiError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function normalizeDepartments(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.departments)) return response.departments;
  if (Array.isArray(response?.data?.departments)) {
    return response.data.departments;
  }
  if (Array.isArray(response?.data?.data?.departments)) {
    return response.data.data.departments;
  }
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function getDepartmentId(department) {
  if (department && typeof department === "object") {
    department = department._id || department.id || "";
  }

  const value = String(department || "").trim();
  return /^[a-f\d]{24}$/i.test(value) ? value : "";
}

function normalizeDate(value) {
  if (!value) return "";

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getSalary(employee) {
  const salary = employee?.salary;

  if (salary && typeof salary === "object") {
    const value =
      salary.basic ??
      salary.basicSalary ??
      employee.basicSalary ??
      "";

    return value === "" || value == null ? "" : String(value);
  }

  const value =
    salary ?? employee?.basicSalary ?? employee?.basic_salary ?? "";

  return value === "" || value == null ? "" : String(value);
}

function getFullName(employee) {
  return (
    employee?.name ||
    employee?.fullName ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ")
  );
}

function normalizeEmployee(employee, departments) {
  const rawDepartment = employee?.department;
  let departmentId = getDepartmentId(rawDepartment);

  // If a department name was returned instead of its ID, match it
  // against the saved department records.
  if (!departmentId && typeof rawDepartment === "string") {
    const target = rawDepartment.trim().toLowerCase();

    if (target && !/^[a-f\d]{24}$/i.test(target)) {
      const matchingDepartment = departments.find((department) => {
        const name = String(department?.name || "")
          .trim()
          .toLowerCase();
        const code = String(department?.code || "")
          .trim()
          .toLowerCase();

        return name === target || code === target;
      });

      departmentId = String(
        matchingDepartment?._id || matchingDepartment?.id || ""
      );
    }
  }

  return {
    ...emptyForm,
    name: getFullName(employee),
    email: employee?.email || "",
    phone: employee?.phone || "",
    employeeId:
      employee?.employeeCode || employee?.employeeId || "",
    department: departmentId,
    designation: employee?.designation || "",
    joiningDate: normalizeDate(employee?.joiningDate),
    salary: getSalary(employee),
    status: String(employee?.status || "active").toLowerCase(),
  };
}

function extractEmployee(response) {
  return (
    response?.employee ||
    response?.data?.employee ||
    response?.data ||
    response
  );
}

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadEmployee = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);
    setSuccess("");

    try {
      const [departmentResult, employeeResult] = await Promise.all([
        departmentService.getAll().catch(() => []),
        employeeService.getById(id),
      ]);

      const departmentList = normalizeDepartments(departmentResult).filter(
        (department) =>
          department &&
          (department._id || department.id) &&
          department.isActive !== false
      );

      const employee = extractEmployee(employeeResult);

      if (
        !employee ||
        (!employee._id &&
          !employee.id &&
          !employee.employeeCode &&
          !employee.employeeId)
      ) {
        throw new Error("Employee record was not returned by the server.");
      }

      setDepartments(departmentList);
      setForm(normalizeEmployee(employee, departmentList));
    } catch (loadError) {
      setNotFound(true);
      setError(
        getApiError(loadError, "Employee record could not be loaded.")
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const employeeCode = form.employeeId.trim();
    const phone = form.phone.trim();
    const salaryText = String(form.salary).trim();

    if (!name || !email || !employeeCode) {
      setError("Name, email and employee ID are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (salaryText !== "" && !Number.isFinite(Number(salaryText))) {
      setError("Please enter a valid salary amount.");
      return;
    }

    if (salaryText !== "" && Number(salaryText) < 0) {
      setError("Salary cannot be negative.");
      return;
    }

    if (phone && !/^[+\d()\s-]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (
      form.department &&
      !/^[a-f\d]{24}$/i.test(form.department)
    ) {
      setError("Please select a valid department from the list.");
      return;
    }

    setSaving(true);

    try {
      // Read the latest saved record so HRA, allowances, deductions,
      // and other salary fields are preserved.
      const existingResult = await employeeService.getById(id);
      const existingEmployee = extractEmployee(existingResult);

      const nameParts = name.split(/\s+/).filter(Boolean);
      const existingSalary =
        existingEmployee?.salary &&
        typeof existingEmployee.salary === "object"
          ? existingEmployee.salary
          : {};

      const updates = {
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" "),
        email,
        phone,
        employeeCode,
        department: form.department || null,
        designation: form.designation.trim(),
        joiningDate: form.joiningDate,
        status: form.status.toLowerCase(),
      };

      // Only send salary when the user entered a value. Keep basic and
      // basicSalary consistent to prevent a stale value taking precedence.
      if (salaryText !== "") {
        const salaryNumber = Number(salaryText);

        updates.basicSalary = salaryNumber;
        updates.salary = {
          ...existingSalary,
          currency: existingSalary.currency || "INR",
          basic: salaryNumber,
          hra: Number(existingSalary.hra ?? 0),
          allowances: Number(existingSalary.allowances ?? 0),
          deductions: Number(existingSalary.deductions ?? 0),
        };
      }

      const savedEmployee = await employeeService.update(id, updates);

      // Verify the persisted value with a fresh GET request.
      const verifyResult = await employeeService.getById(id);
      const verifiedEmployee = extractEmployee(verifyResult);
      const savedSalary = getSalary(verifiedEmployee);

      if (
        salaryText !== "" &&
        savedSalary !== "" &&
        Number(savedSalary) !== Number(salaryText)
      ) {
        setError(
          `The server still returns ₹${savedSalary} after saving. ` +
            "The backend salary update logic or schema needs checking."
        );
        return;
      }

      // If the API returned no employee details, verify using the response
      // before showing the success message.
      if (!verifiedEmployee && !savedEmployee) {
        throw new Error("The server did not confirm the updated employee.");
      }

      setSuccess("Employee updated successfully.");

      setTimeout(() => {
        navigate("/admin/employees", {
          state: { message: "Employee updated successfully." },
        });
      }, 700);
    } catch (saveError) {
      setError(
        getApiError(
          saveError,
          "Unable to update employee. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="edit-employee-page">
        <style>{styles}</style>
        <div className="ee-state-card" role="status">
          <span className="ee-spinner">
            <FaSyncAlt />
          </span>
          Loading employee details...
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="edit-employee-page">
        <style>{styles}</style>
        <div className="ee-state-card">
          <div className="ee-message error" role="alert">
            <FaExclamationCircle />
            <span>{error || "Employee not found."}</span>
          </div>
          <button
            type="button"
            className="ee-btn"
            onClick={() => navigate("/admin/employees")}
          >
            <FaArrowLeft /> Back to Employees
          </button>
          <button
            type="button"
            className="ee-btn"
            onClick={loadEmployee}
          >
            <FaSyncAlt /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-employee-page">
      <style>{styles}</style>

      <header className="ee-header">
        <Link
          to="/admin/employees"
          className="ee-back"
          aria-label="Back to employees"
          title="Back to employees"
        >
          <FaArrowLeft />
        </Link>

        <div>
          <h1>Edit Employee</h1>
          <p>Update the employee profile and employment information.</p>
        </div>
      </header>

      <form className="ee-card" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="ee-message error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="ee-message success" role="status">
            {success}
          </div>
        )}

        <h2 className="ee-section-title">
          <span className="ee-section-icon">
            <FaUserEdit />
          </span>
          Personal and Employment Details
        </h2>

        <div className="ee-grid">
          <div className="ee-field">
            <label htmlFor="ee-name">
              Full Name <span className="ee-required">*</span>
            </label>
            <input
              id="ee-name"
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter full name"
              autoComplete="name"
              required
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-email">
              Email Address <span className="ee-required">*</span>
            </label>
            <input
              id="ee-email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="employee@example.com"
              autoComplete="email"
              required
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-phone">Phone Number</label>
            <input
              id="ee-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="Enter phone number"
              autoComplete="tel"
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-employeeId">
              Employee ID <span className="ee-required">*</span>
            </label>
            <input
              id="ee-employeeId"
              name="employeeId"
              value={form.employeeId}
              onChange={updateField}
              placeholder="Enter employee ID"
              required
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-department">Department</label>
            <select
              id="ee-department"
              name="department"
              value={form.department}
              onChange={updateField}
              disabled={saving}
            >
              <option value="">No department assigned</option>
              {departments.map((department) => {
                const departmentId = String(
                  department._id || department.id
                );

                return (
                  <option key={departmentId} value={departmentId}>
                    {department.name || department.code || "Department"}
                    {department.code ? ` (${department.code})` : ""}
                  </option>
                );
              })}
            </select>
            <span className="ee-hint">
              {departments.length
                ? "Select a department from the saved department records."
                : "No departments were returned by the Department API. Check the saved department records and API response."}
            </span>
          </div>

          <div className="ee-field">
            <label htmlFor="ee-designation">Designation</label>
            <input
              id="ee-designation"
              name="designation"
              value={form.designation}
              onChange={updateField}
              placeholder="Enter designation"
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-joiningDate">Joining Date</label>
            <input
              id="ee-joiningDate"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={updateField}
              disabled={saving}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-salary">Monthly Basic Salary (₹)</label>
            <input
              id="ee-salary"
              name="salary"
              type="number"
              min="0"
              step="0.01"
              value={form.salary}
              onChange={updateField}
              placeholder="Enter monthly basic salary"
              inputMode="decimal"
              disabled={saving}
            />
            <span className="ee-hint">
              Enter the new basic salary. Leave unchanged if you do not
              want to edit it.
            </span>
          </div>

          <div className="ee-field">
            <label htmlFor="ee-status">Employment Status</label>
            <select
              id="ee-status"
              name="status"
              value={form.status}
              onChange={updateField}
              disabled={saving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="ee-actions">
          <Link
            className="ee-btn"
            to="/admin/employees"
            onClick={(event) => {
              if (saving) event.preventDefault();
            }}
          >
            Cancel
          </Link>

          <button
            className="ee-btn primary"
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="ee-spinner">
                  <FaSyncAlt />
                </span>
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
