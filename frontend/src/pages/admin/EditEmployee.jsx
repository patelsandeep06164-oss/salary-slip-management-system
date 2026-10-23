import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaUserEdit,
  FaBuilding,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

import employeeService from "../../services/employeeService";

const styles = `
.edit-employee-page {
  width: 100%;
  min-width: 0;
  font-family: Arial, sans-serif;
  color: var(--text-primary, #1e293b);
}

.edit-employee-page *,
.edit-employee-page *::before,
.edit-employee-page *::after {
  box-sizing: border-box;
}

.edit-employee-page button,
.edit-employee-page input,
.edit-employee-page select {
  font: inherit;
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
  transition: .2s ease;
}

.ee-back:hover {
  background: #e0f7fc;
  transform: translateX(-2px);
}

.ee-header h1 {
  margin: 0 0 7px;
  font-size: clamp(23px, 3vw, 29px);
  font-weight: 800;
  letter-spacing: -.6px;
}

.ee-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.6;
}

.ee-card {
  width: 100%;
  min-width: 0;
  padding: 25px;
  border: 1px solid var(--border-color, #e5edf5);
  border-radius: 17px;
  background: var(--surface, #fff);
  box-shadow: 0 6px 24px #0f172a08;
}

.ee-section-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin: 0 0 7px;
  font-size: 17px;
  font-weight: 800;
}

.ee-section-icon {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #0891b2;
  background: #e0f7fc;
}

.ee-section-description {
  margin: 0 0 23px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.7;
}

.ee-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.ee-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.ee-field label {
  color: var(--text-primary, #334155);
  font-size: 12px;
  font-weight: 750;
}

.ee-required {
  color: #dc2626;
}

.ee-field input,
.ee-field select {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 11px 13px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: var(--text-primary, #1e293b);
  outline: none;
  font-size: 13px;
  transition: border-color .2s ease, box-shadow .2s ease;
}

.ee-field input:focus,
.ee-field select:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px #06b6d41c;
}

.ee-field input:disabled,
.ee-field select:disabled {
  opacity: .65;
  cursor: not-allowed;
}

.ee-field small {
  color: var(--text-secondary, #64748b);
  font-size: 11px;
  line-height: 1.5;
}

.ee-divider {
  margin: 25px 0 21px;
  border: 0;
  border-top: 1px solid var(--border-color, #edf2f7);
}

.ee-message {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.ee-message.error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.ee-message.info {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.ee-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 27px;
  padding-top: 21px;
  border-top: 1px solid var(--border-color, #edf2f7);
}

.ee-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 43px;
  padding: 11px 17px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: var(--text-primary, #334155);
  text-decoration: none;
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
  transition: .2s ease;
}

.ee-btn:hover {
  background: var(--table-header, #f1f5f9);
}

.ee-btn.primary {
  border-color: transparent;
  background: linear-gradient(135deg, #06b6d4, #2563eb);
  color: #fff;
  box-shadow: 0 5px 14px #0891b233;
}

.ee-btn.primary:hover {
  box-shadow: 0 8px 18px #0891b244;
  transform: translateY(-1px);
}

.ee-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
}

.ee-state-card {
  padding: 28px;
  border: 1px solid var(--border-color, #e5edf5);
  border-radius: 16px;
  background: var(--surface, #fff);
}

.ee-state-card h2 {
  margin: 0 0 9px;
  font-size: 19px;
}

.ee-state-card p {
  margin: 0 0 18px;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}

.ee-spinner {
  display: inline-block;
  animation: ee-spin 1s linear infinite;
}

@keyframes ee-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 650px) {
  .ee-card {
    padding: 17px;
    border-radius: 14px;
  }

  .ee-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .ee-header {
    align-items: flex-start;
    gap: 11px;
  }

  .ee-back {
    width: 39px;
    height: 39px;
    flex-basis: 39px;
  }

  .ee-actions {
    flex-direction: column-reverse;
  }

  .ee-btn {
    width: 100%;
  }

  .ee-state-card {
    padding: 20px;
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
  status: "Active",
};

function readDepartments() {
  try {
    const saved = localStorage.getItem("department_records");
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeDepartment(value) {
  if (value && typeof value === "object") {
    return String(value.name || value.departmentName || "");
  }

  return String(value || "");
}

function normalizeDate(value) {
  if (!value) return "";

  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) return match[1];

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSalary(employee) {
  const salary =
    employee.salary ??
    employee.basicSalary ??
    employee.basic_salary ??
    "";

  return salary === "" || salary == null ? "" : String(salary);
}

function normalizeEmployee(employee) {
  return {
    ...emptyForm,
    ...employee,
    name: employee.name || employee.fullName || "",
    email: employee.email || "",
    phone: employee.phone || "",
    employeeId: employee.employeeId || "",
    department: normalizeDepartment(employee.department),
    designation: employee.designation || "",
    joiningDate: normalizeDate(employee.joiningDate),
    salary: getSalary(employee),
    status: employee.status || "Active",
  };
}

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [departments, setDepartments] = useState(readDepartments);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const loadEmployee = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const employee = await employeeService.getById(id);

      setForm(normalizeEmployee(employee));
      setDepartments(readDepartments());
    } catch (loadError) {
      setNotFound(true);
      setError(
        loadError?.message || "Employee record could not be loaded."
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
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const employeeId = form.employeeId.trim();
    const phone = form.phone.trim();
    const salaryText = String(form.salary).trim();

    if (!name || !email || !employeeId) {
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

    const normalizedId = String(id);

    setSaving(true);

    try {
      // Read the same employee collection used by Add Employee and Dashboard.
      const employees = await employeeService.getAll();

      const duplicate = employees.some((employee) => {
        if (String(employee.id) === normalizedId) return false;

        const existingEmployeeId = String(employee.employeeId || "")
          .trim()
          .toLowerCase();

        const existingEmail = String(employee.email || "")
          .trim()
          .toLowerCase();

        return (
          existingEmployeeId === employeeId.toLowerCase() ||
          existingEmail === email
        );
      });

      if (duplicate) {
        setError("Another employee already uses this ID or email.");
        return;
      }

      const existingEmployee = await employeeService.getById(id);

      const updates = {
        name,
        email,
        phone,
        employeeId,
        department: form.department.trim(),
        designation: form.designation.trim(),
        joiningDate: form.joiningDate,
        salary: salaryText === "" ? "" : Number(salaryText),
        status: form.status,
      };

      // Preserve fields not editable on this form, such as allowances,
      // deductions, address, role, and other existing employee information.
      await employeeService.update(id, {
        ...existingEmployee,
        ...updates,
      });

      navigate("/admin/employees", {
        state: { message: "Employee updated successfully." },
      });
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Unable to update employee. Please try again."
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
          </span>{" "}
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
          <div className="ee-message error">
            <FaExclamationCircle />
            <span>
              {error ||
                "Employee not found. The record may have been deleted."}
            </span>
          </div>

          <Link className="ee-btn" to="/admin/employees">
            <FaArrowLeft /> Back to Employees
          </Link>
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

      <form className="ee-card" onSubmit={handleSubmit}>
        {error && (
          <div className="ee-message error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>
          </div>
        )}

        <h2 className="ee-section-heading">
          <span className="ee-section-icon">
            <FaUserEdit />
          </span>
          Employee Information
        </h2>

        <p className="ee-section-description">
          Update the details below and save your changes. Fields marked with
          an asterisk are required.
        </p>

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
              maxLength={100}
              autoComplete="name"
              required
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
              placeholder="employee@company.com"
              maxLength={254}
              autoComplete="email"
              required
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
              maxLength={20}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-employee-id">
              Employee ID <span className="ee-required">*</span>
            </label>
            <input
              id="ee-employee-id"
              name="employeeId"
              value={form.employeeId}
              onChange={updateField}
              placeholder="e.g. EMP001"
              maxLength={50}
              required
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-department">Department</label>
            <select
              id="ee-department"
              name="department"
              value={form.department}
              onChange={updateField}
            >
              <option value="">Select department</option>

              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}

              {form.department &&
                !departments.some(
                  (department) =>
                    String(department.name || "").toLowerCase() ===
                    form.department.toLowerCase()
                ) && (
                  <option value={form.department}>
                    {form.department} (current)
                  </option>
                )}
            </select>
            <small>
              Departments are managed from the Departments page.
            </small>
          </div>

          <div className="ee-field">
            <label htmlFor="ee-designation">Designation</label>
            <input
              id="ee-designation"
              name="designation"
              value={form.designation}
              onChange={updateField}
              placeholder="e.g. Software Developer"
              maxLength={100}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-joining-date">Joining Date</label>
            <input
              id="ee-joining-date"
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={updateField}
            />
          </div>

          <div className="ee-field">
            <label htmlFor="ee-salary">Monthly Salary (₹)</label>
            <input
              id="ee-salary"
              name="salary"
              type="number"
              min="0"
              step="0.01"
              value={form.salary}
              onChange={updateField}
              placeholder="Enter monthly salary"
              inputMode="decimal"
            />
            <small>
              Enter the monthly salary amount in Indian rupees.
            </small>
          </div>

          <div className="ee-field">
            <label htmlFor="ee-status">Employment Status</label>
            <select
              id="ee-status"
              name="status"
              value={form.status}
              onChange={updateField}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <hr className="ee-divider" />

        <div className="ee-actions">
          <Link
            className="ee-btn"
            to="/admin/employees"
            onClick={(event) => {
              if (saving) event.preventDefault();
            }}
            aria-disabled={saving}
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
                Saving Changes...
              </>
            ) : (
              <>
                <FaSave /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
