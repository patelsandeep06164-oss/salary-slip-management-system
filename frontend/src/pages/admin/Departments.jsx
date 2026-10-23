
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaTimes,
  FaSave,
  FaUsers,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";

import employeeService from "../../services/employeeService";

const DEPARTMENT_STORAGE_KEY = "department_records";

const blankForm = {
  name: "",
  description: "",
};

const styles = `
.dept-page {
  width: 100%;
  min-width: 0;
  color: var(--text-primary, #1e293b);
  font-family: Arial, sans-serif;
}
.dept-page *, .dept-page *::before, .dept-page *::after {
  box-sizing: border-box;
}
.dept-page button, .dept-page input, .dept-page textarea {
  font: inherit;
}
.dept-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.dept-header h1 {
  margin: 0 0 8px;
  font-size: clamp(23px, 3vw, 30px);
  font-weight: 800;
  letter-spacing: -0.7px;
}
.dept-header p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 14px;
  line-height: 1.6;
}
.dept-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 43px;
  padding: 11px 16px;
  border: 0;
  border-radius: 11px;
  background: linear-gradient(135deg, #06b6d4, #2563eb);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 5px 14px #0891b233;
  transition: transform .2s ease, box-shadow .2s ease;
}
.dept-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px #0891b244;
}
.dept-primary:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
}
.dept-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}
.dept-stat {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 21px;
  border: 1px solid var(--border-color, #e5edf5);
  border-radius: 16px;
  background: var(--surface, #fff);
  box-shadow: 0 5px 20px #0f172a08;
}
.dept-stat-icon {
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #e0f7fc;
  color: #0891b2;
  font-size: 20px;
}
.dept-stat:nth-child(2) .dept-stat-icon {
  background: #e8efff;
  color: #4f46e5;
}
.dept-stat small {
  display: block;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.5;
}
.dept-stat strong {
  display: block;
  margin-top: 5px;
  color: var(--text-primary, #1e293b);
  font-size: 25px;
  font-weight: 800;
}
.dept-card {
  min-width: 0;
  padding: 21px;
  border: 1px solid var(--border-color, #e5edf5);
  border-radius: 16px;
  background: var(--surface, #fff);
  box-shadow: 0 5px 22px #0f172a08;
}
.dept-card-title {
  margin: 0 0 5px;
  font-size: 17px;
  font-weight: 800;
}
.dept-card-subtitle {
  margin: 0 0 20px;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.6;
}
.dept-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.dept-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  padding: 0 13px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 11px;
  color: #0891b2;
  background: var(--surface, #fff);
}
.dept-search:focus-within {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px #06b6d41c;
}
.dept-search input {
  width: 100%;
  min-width: 0;
  padding: 12px 0;
  border: 0;
  outline: 0;
  color: var(--text-primary, #1e293b);
  background: transparent;
  font-size: 13px;
}
.dept-count {
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  white-space: nowrap;
}
.dept-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color, #edf2f7);
  border-radius: 12px;
}
.dept-table {
  width: 100%;
  min-width: 610px;
  border-collapse: collapse;
  text-align: left;
}
.dept-table th {
  padding: 14px 13px;
  background: var(--table-header, #f1f8fc);
  color: var(--text-secondary, #64748b);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .6px;
  white-space: nowrap;
}
.dept-table td {
  padding: 14px 13px;
  border-bottom: 1px solid var(--border-color, #edf2f7);
  color: var(--text-primary, #334155);
  font-size: 12px;
  line-height: 1.6;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
.dept-table tbody tr:last-child td {
  border-bottom: 0;
}
.dept-table tbody tr:hover {
  background: var(--table-hover, #f8fcff);
}
.dept-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
  font-weight: 750;
}
.dept-name-icon {
  flex: 0 0 37px;
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #e0f7fc;
  color: #0891b2;
  font-size: 15px;
}
.dept-description {
  max-width: 250px;
  color: var(--text-secondary, #64748b) !important;
}
.dept-employee-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 33px;
  padding: 5px 10px;
  border-radius: 8px;
  background: #e8efff;
  color: #4338ca;
  font-weight: 800;
}
.dept-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}
.dept-icon-btn {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  background: var(--surface, #fff);
  color: #0891b2;
  cursor: pointer;
  transition: background .2s ease;
}
.dept-icon-btn:hover {
  background: #e0f7fc;
}
.dept-icon-btn.delete {
  color: #dc2626;
}
.dept-icon-btn.delete:hover {
  background: #fef2f2;
}
.dept-icon-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.dept-empty {
  padding: 38px 15px;
  text-align: center;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
  line-height: 1.7;
}
.dept-empty-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  border-radius: 14px;
  background: #e0f7fc;
  color: #0891b2;
  font-size: 21px;
}
.dept-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: #0f172a99;
  backdrop-filter: blur(4px);
  overflow-y: auto;
}
.dept-modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  padding: 25px;
  border: 1px solid var(--border-color, #e5edf5);
  border-radius: 18px;
  background: var(--surface, #fff);
  color: var(--text-primary, #1e293b);
  box-shadow: 0 24px 80px #0003;
}
.dept-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 22px;
}
.dept-modal-head h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
}
.dept-modal-head p {
  margin: 0;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
  line-height: 1.6;
}
.dept-close {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: var(--table-header, #f1f5f9);
  color: var(--text-secondary, #475569);
  cursor: pointer;
}
.dept-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 17px;
}
.dept-field label {
  color: var(--text-primary, #334155);
  font-size: 12px;
  font-weight: 750;
}
.dept-field input,
.dept-field textarea {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 10px;
  outline: none;
  background: var(--surface, #fff);
  color: var(--text-primary, #1e293b);
  font-size: 13px;
  resize: vertical;
}
.dept-field input:focus,
.dept-field textarea:focus {
  border-color: #06b6d4;
  box-shadow: 0 0 0 3px #06b6d41c;
}
.dept-error,
.dept-success {
  padding: 11px 12px;
  margin-bottom: 15px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
}
.dept-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
.dept-success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.dept-modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}
.dept-secondary {
  min-height: 42px;
  padding: 10px 15px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 10px;
  background: var(--surface, #fff);
  color: var(--text-primary, #334155);
  font-size: 12px;
  font-weight: 750;
  cursor: pointer;
}
.dept-secondary:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.dept-loading {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 20px 0;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
}
.dept-page button:focus-visible {
  outline: 3px solid #06b6d466;
  outline-offset: 2px;
}
@media (max-width: 650px) {
  .dept-header {
    align-items: stretch;
  }
  .dept-header > div {
    width: 100%;
  }
  .dept-header .dept-primary {
    width: 100%;
  }
  .dept-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .dept-stat {
    padding: 17px;
  }
  .dept-card {
    padding: 14px;
  }
  .dept-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .dept-search {
    max-width: none;
    min-width: 0;
  }
  .dept-count {
    white-space: normal;
  }
  .dept-modal {
    padding: 19px;
  }
  .dept-modal-actions {
    flex-direction: column-reverse;
  }
  .dept-modal-actions button {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dept-page *,
  .dept-page *::before,
  .dept-page *::after {
    transition: none !important;
  }
}
`;

function readDepartments() {
  try {
    const saved = localStorage.getItem(DEPARTMENT_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDepartments(departments) {
  localStorage.setItem(
    DEPARTMENT_STORAGE_KEY,
    JSON.stringify(departments)
  );
}

function getDepartmentName(value) {
  if (value && typeof value === "object") {
    return String(value.name || value.departmentName || "").trim();
  }
  return String(value || "").trim();
}

function getEmployeeDepartment(employee) {
  return getDepartmentName(
    employee?.department ?? employee?.departmentName
  );
}

/* FIXED: globalThis has been replaced with window. */
function createDepartmentId() {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }

  return `dept_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Departments() {
  const [departments, setDepartments] = useState(readDepartments);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState("");

  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true);

    try {
      const result = await employeeService.getAll();
      setEmployees(Array.isArray(result) ? result : []);
      setStorageError("");
    } catch (loadError) {
      setEmployees([]);
      setStorageError(
        loadError?.message || "Unable to load employee records."
      );
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!modalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, saving]);

  const employeeCounts = useMemo(() => {
    const counts = new Map();

    employees.forEach((employee) => {
      const departmentName = getEmployeeDepartment(employee);
      if (!departmentName) return;

      const key = departmentName.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }, [employees]);

  const assignedEmployees = useMemo(
    () =>
      employees.filter((employee) => getEmployeeDepartment(employee)).length,
    [employees]
  );

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments
      .filter((department) =>
        `${department.name || ""} ${department.description || ""}`
          .toLowerCase()
          .includes(query)
      )
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [departments, search]);

  function openAdd() {
    setEditingId(null);
    setForm(blankForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(department) {
    setEditingId(department.id);
    setForm({
      name: department.name || "",
      description: department.description || "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(blankForm);
    setError("");
  }

  async function saveDepartment(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Department name is required.");
      return;
    }

    if (name.length > 80) {
      setError("Department name cannot exceed 80 characters.");
      return;
    }

    if (description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    const duplicate = departments.some(
      (department) =>
        String(department.id) !== String(editingId) &&
        String(department.name || "").trim().toLowerCase() ===
          name.toLowerCase()
    );

    if (duplicate) {
      setError("A department with this name already exists.");
      return;
    }

    setSaving(true);

    try {
      const timestamp = new Date().toISOString();
      let updated;

      if (editingId !== null) {
        updated = departments.map((department) =>
          String(department.id) === String(editingId)
            ? {
                ...department,
                name,
                description,
                updatedAt: timestamp,
              }
            : department
        );
      } else {
        updated = [
          ...departments,
          {
            id: createDepartmentId(),
            name,
            description,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ];
      }

      saveDepartments(updated);
      setDepartments(updated);
      setSuccess(
        editingId !== null
          ? "Department updated successfully."
          : "Department added successfully."
      );
      setModalOpen(false);
      setEditingId(null);
      setForm(blankForm);
    } catch {
      setError(
        "Unable to save the department. Check your browser storage and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteDepartment(department) {
    const departmentName = String(department.name || "").trim();

    const assignedCount =
      employeeCounts.get(departmentName.toLowerCase()) || 0;

    if (assignedCount > 0) {
      window.alert(
        `${assignedCount} employee(s) are assigned to "${departmentName}". Reassign them before deleting this department.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the "${departmentName}" department?`
    );

    if (!confirmed) return;

    try {
      const updated = departments.filter(
        (item) => String(item.id) !== String(department.id)
      );

      saveDepartments(updated);
      setDepartments(updated);
      setSuccess(`"${departmentName}" department deleted successfully.`);
      setStorageError("");
    } catch {
      setStorageError("Unable to delete the department. Please try again.");
    }
  }

  return (
    <div className="dept-page">
      <style>{styles}</style>

      <header className="dept-header">
        <div>
          <h1>Departments</h1>
          <p>
            Create and manage your company departments and employee assignments.
          </p>
        </div>

        <button
          type="button"
          className="dept-primary"
          onClick={openAdd}
        >
          <FaPlus /> Add Department
        </button>
      </header>

      {storageError && (
        <div className="dept-error" role="alert">
          <FaExclamationTriangle style={{ marginRight: 7 }} />
          {storageError}
          <button
            type="button"
            onClick={() => {
              setStorageError("");
              loadEmployees();
            }}
            style={{
              marginLeft: 10,
              border: 0,
              background: "transparent",
              color: "inherit",
              textDecoration: "underline",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            <FaSyncAlt /> Retry
          </button>
        </div>
      )}

      {success && (
        <div className="dept-success" role="status">
          {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="dept-stats">
        <div className="dept-stat">
          <div className="dept-stat-icon">
            <FaBuilding />
          </div>
          <div>
            <small>Total Departments</small>
            <strong>{departments.length}</strong>
          </div>
        </div>

        <div className="dept-stat">
          <div className="dept-stat-icon">
            <FaUsers />
          </div>
          <div>
            <small>Employees Assigned</small>
            <strong>{loadingEmployees ? "…" : assignedEmployees}</strong>
          </div>
        </div>
      </section>

      <section className="dept-card">
        <h2 className="dept-card-title">Department Directory</h2>
        <p className="dept-card-subtitle">
          Manage department names, descriptions, and current employee counts.
        </p>

        <div className="dept-toolbar">
          <label className="dept-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search departments..."
              aria-label="Search departments"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            )}
          </label>

          <span className="dept-count">
            Showing {filteredDepartments.length} of {departments.length} department(s)
          </span>
        </div>

        <div className="dept-table-wrap">
          <table className="dept-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Description</th>
                <th>Employees</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDepartments.map((department) => {
                const count =
                  employeeCounts.get(
                    String(department.name || "").trim().toLowerCase()
                  ) || 0;

                return (
                  <tr key={department.id}>
                    <td>
                      <div className="dept-name">
                        <span className="dept-name-icon">
                          <FaBuilding />
                        </span>
                        <span>{department.name}</span>
                      </div>
                    </td>

                    <td className="dept-description">
                      {department.description || "No description added"}
                    </td>

                    <td>
                      <span
                        className="dept-employee-count"
                        title={`${count} assigned employee(s)`}
                      >
                        {loadingEmployees ? "…" : count}
                      </span>
                    </td>

                    <td>
                      <div className="dept-actions">
                        <button
                          type="button"
                          className="dept-icon-btn"
                          title="Edit department"
                          aria-label={`Edit ${department.name}`}
                          onClick={() => openEdit(department)}
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          className="dept-icon-btn delete"
                          title="Delete department"
                          aria-label={`Delete ${department.name}`}
                          onClick={() => deleteDepartment(department)}
                          disabled={loadingEmployees}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredDepartments.length === 0 && (
            <div className="dept-empty">
              <div className="dept-empty-icon">
                <FaBuilding />
              </div>
              <strong>
                {search ? "No matching departments" : "No departments yet"}
              </strong>
              <div>
                {search
                  ? "Try another search term."
                  : "Add your first department to get started."}
              </div>
              {!search && (
                <button
                  type="button"
                  className="dept-primary"
                  onClick={openAdd}
                  style={{ marginTop: 15 }}
                >
                  <FaPlus /> Add Department
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <div
          className="dept-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <form
            className="dept-modal"
            onSubmit={saveDepartment}
            aria-labelledby="department-modal-title"
          >
            <div className="dept-modal-head">
              <div>
                <h2 id="department-modal-title">
                  {editingId !== null ? "Edit Department" : "Add Department"}
                </h2>
                <p>
                  {editingId !== null
                    ? "Update the department details below."
                    : "Enter the details for your new department."}
                </p>
              </div>

              <button
                type="button"
                className="dept-close"
                onClick={closeModal}
                aria-label="Close dialog"
                disabled={saving}
              >
                <FaTimes />
              </button>
            </div>

            {error && (
              <div className="dept-error" role="alert">
                {error}
              </div>
            )}

            <div className="dept-field">
              <label htmlFor="department-name">Department Name *</label>
              <input
                id="department-name"
                autoFocus
                maxLength={80}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Human Resources"
                autoComplete="organization-title"
                required
              />
            </div>

            <div className="dept-field">
              <label htmlFor="department-description">Description</label>
              <textarea
                id="department-description"
                rows={4}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Briefly describe this department"
              />
              <small
                style={{
                  textAlign: "right",
                  color: "#64748b",
                  fontSize: 11,
                }}
              >
                {form.description.length}/500 characters
              </small>
            </div>

            <div className="dept-modal-actions">
              <button
                type="button"
                className="dept-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="dept-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSyncAlt /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave />{" "}
                    {editingId !== null ? "Update Department" : "Save Department"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
