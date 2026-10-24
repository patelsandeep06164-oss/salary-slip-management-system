import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaBuilding,
  FaTimes,
  FaSave,
  FaUsers,
  FaExclamationTriangle,
  FaSyncAlt,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

import departmentService from "../../services/departmentService";
import employeeService from "../../services/employeeService";

const blankForm = {
  name: "",
  code: "",
  description: "",
};

const styles = `
.dept-page {
  width: 100%;
  min-width: 0;
  color: var(--text-primary, #1e293b);
  font-family: Arial, sans-serif;
}
.dept-page *,
.dept-page *::before,
.dept-page *::after {
  box-sizing: border-box;
}
.dept-page button,
.dept-page input,
.dept-page textarea {
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
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 5px 14px #0891b233;
}
.dept-primary:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.dept-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}
.dept-stat {
  display: flex;
  align-items: center;
  gap: 15px;
  min-width: 0;
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
.dept-stat small {
  display: block;
  color: var(--text-secondary, #64748b);
  font-size: 12px;
}
.dept-stat strong {
  display: block;
  margin-top: 6px;
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
  min-width: 180px;
  max-width: 400px;
  padding: 0 13px;
  border: 1px solid var(--border-color, #dbe5f1);
  border-radius: 11px;
  color: #0891b2;
  background: var(--surface, #fff);
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
}
.dept-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border-color, #edf2f7);
  border-radius: 12px;
}
.dept-table {
  width: 100%;
  min-width: 680px;
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
  letter-spacing: .5px;
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
}
.dept-badge {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 8px;
  background: #e0f7fc;
  color: #087b99;
  font-weight: 800;
}
.dept-status {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 750;
}
.dept-status.active {
  background: #dcfce7;
  color: #166534;
}
.dept-status.inactive {
  background: #fee2e2;
  color: #991b1b;
}
.dept-employee-count {
  display: inline-flex;
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
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 9px;
  background: var(--surface, #fff);
  color: #0891b2;
  cursor: pointer;
}
.dept-icon-btn:hover {
  background: #e0f7fc;
}
.dept-icon-btn.toggle {
  color: #15803d;
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
  cursor: pointer;
}
.dept-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 17px;
}
.dept-field label {
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
  overflow-wrap: anywhere;
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
  padding: 24px 12px;
  text-align: center;
  color: var(--text-secondary, #64748b);
  font-size: 13px;
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
`;

function getApiMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

function getDepartmentId(department) {
  return String(department?._id || department?.id || "");
}

function getEmployeeDepartmentId(employee) {
  const department = employee?.department;

  if (department && typeof department === "object") {
    return String(department._id || department.id || "");
  }

  return String(department || "");
}

function getEmployeeRows(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.employees)) return result.employees;
  if (Array.isArray(result?.data?.employees)) {
    return result.data.employees;
  }
  return [];
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [departmentResult, employeeResult] = await Promise.all([
        departmentService.getAll(),
        employeeService.getAll(),
      ]);

      const departmentRows = Array.isArray(departmentResult)
        ? departmentResult
        : departmentResult?.departments ||
          departmentResult?.data?.departments ||
          [];

      setDepartments(
        departmentRows.map((department) => ({
          ...department,
          id: getDepartmentId(department),
        }))
      );

      setEmployees(getEmployeeRows(employeeResult));
    } catch (loadError) {
      setError(
        getApiMessage(
          loadError,
          "Unable to load departments. Check the backend connection."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeCounts = useMemo(() => {
    const counts = new Map();

    employees.forEach((employee) => {
      const departmentId = getEmployeeDepartmentId(employee);
      if (!departmentId) return;

      counts.set(
        departmentId,
        (counts.get(departmentId) || 0) + 1
      );
    });

    return counts;
  }, [employees]);

  const assignedEmployees = useMemo(
    () =>
      employees.filter(
        (employee) => getEmployeeDepartmentId(employee)
      ).length,
    [employees]
  );

  const activeDepartments = useMemo(
    () => departments.filter((department) => department.isActive !== false),
    [departments]
  );

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departments
      .filter((department) =>
        showInactive
          ? department.isActive === false
          : department.isActive !== false
      )
      .filter((department) =>
        [
          department.name,
          department.code,
          department.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
      .sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
  }, [departments, search, showInactive]);

  function openAdd() {
    setEditingId(null);
    setForm(blankForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEdit(department) {
    setEditingId(getDepartmentId(department));
    setForm({
      name: department.name || "",
      code: department.code || "",
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
  }

  async function saveDepartment(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const description = form.description.trim();

    if (!name || !code) {
      setError("Department name and code are required.");
      return;
    }

    if (name.length > 100 || code.length > 30) {
      setError("Department name or code exceeds the allowed length.");
      return;
    }

    const duplicate = departments.some(
      (department) =>
        getDepartmentId(department) !== String(editingId || "") &&
        (
          String(department.name || "").trim().toLowerCase() ===
            name.toLowerCase() ||
          String(department.code || "").trim().toUpperCase() === code
        )
    );

    if (duplicate) {
      setError("A department with this name or code already exists.");
      return;
    }

    setSaving(true);

    try {
      const payload = { name, code, description };

      if (editingId) {
        await departmentService.update(editingId, payload);
        setSuccess("Department updated successfully.");
      } else {
        await departmentService.create(payload);
        setSuccess("Department created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(blankForm);
      await loadData();
    } catch (saveError) {
      setError(
        getApiMessage(
          saveError,
          "Unable to save department. Please check the backend."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleDepartment(department) {
    const id = getDepartmentId(department);
    if (!id) {
      setError("Department ID is missing. Please refresh the page.");
      return;
    }

    const isActive = department.isActive !== false;
    const action = isActive ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${department.name}"?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      if (isActive) {
        await departmentService.deactivate(id);
        setSuccess(`"${department.name}" deactivated successfully.`);
      } else {
        await departmentService.reactivate(id);
        setSuccess(`"${department.name}" reactivated successfully.`);
      }

      await loadData();
    } catch (toggleError) {
      setError(
        getApiMessage(
          toggleError,
          "Unable to change department status."
        )
      );
    }
  }

  return (
    <div className="dept-page">
      <style>{styles}</style>

      <header className="dept-header">
        <div>
          <h1>Departments</h1>
          <p>
            Manage company departments and employee assignments.
          </p>
        </div>

        <button
          type="button"
          className="dept-primary"
          onClick={openAdd}
          disabled={loading}
        >
          <FaPlus /> Add Department
        </button>
      </header>

      {error && (
        <div className="dept-error" role="alert">
          <FaExclamationTriangle style={{ marginRight: 7 }} />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="dept-success" role="status">
          {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success"
            style={{
              float: "right",
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
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
            <small>Active Departments</small>
            <strong>{activeDepartments.length}</strong>
          </div>
        </div>

        <div className="dept-stat">
          <div className="dept-stat-icon">
            <FaUsers />
          </div>
          <div>
            <small>Employees Assigned</small>
            <strong>{loading ? "…" : assignedEmployees}</strong>
          </div>
        </div>
      </section>

      <section className="dept-card">
        <h2 className="dept-card-title">Department Directory</h2>
        <p className="dept-card-subtitle">
          Manage department names, codes, descriptions and employee counts.
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
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            )}
          </label>

          <button
            type="button"
            className="dept-secondary"
            onClick={() => setShowInactive((value) => !value)}
          >
            {showInactive ? "Show Active" : "Show Inactive"}
          </button>

          <span className="dept-count">
            Showing {filteredDepartments.length} department(s)
          </span>
        </div>

        <div className="dept-table-wrap">
          <table className="dept-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Description</th>
                <th>Employees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredDepartments.map((department) => {
                  const id = getDepartmentId(department);
                  const count = employeeCounts.get(id) || 0;
                  const isActive = department.isActive !== false;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="dept-name">
                          <span className="dept-name-icon">
                            <FaBuilding />
                          </span>
                          <span>{department.name}</span>
                        </div>
                      </td>

                      <td>
                        <span className="dept-badge">
                          {department.code}
                        </span>
                      </td>

                      <td>
                        {department.description || "No description"}
                      </td>

                      <td>
                        <span className="dept-employee-count">
                          {count}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`dept-status ${
                            isActive ? "active" : "inactive"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
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
                            disabled={!isActive}
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="dept-icon-btn toggle"
                            title={isActive ? "Deactivate" : "Reactivate"}
                            aria-label={
                              isActive
                                ? `Deactivate ${department.name}`
                                : `Reactivate ${department.name}`
                            }
                            onClick={() => toggleDepartment(department)}
                          >
                            {isActive ? (
                              <FaToggleOn />
                            ) : (
                              <FaToggleOff />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {loading && (
            <div className="dept-loading">
              <FaSyncAlt /> Loading departments from server...
            </div>
          )}

          {!loading && filteredDepartments.length === 0 && (
            <div className="dept-empty">
              <div className="dept-empty-icon">
                <FaBuilding />
              </div>
              <strong>
                {search
                  ? "No matching departments"
                  : showInactive
                  ? "No inactive departments"
                  : "No departments found"}
              </strong>
              <div>
                {search
                  ? "Try a different search term."
                  : showInactive
                  ? "There are no deactivated departments."
                  : "Add a department to get started."}
              </div>
              {!search && !showInactive && (
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
                  {editingId ? "Edit Department" : "Add Department"}
                </h2>
                <p>
                  Enter the department details below.
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
              <label htmlFor="department-name">
                Department Name *
              </label>
              <input
                id="department-name"
                autoFocus
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Software Development"
                required
              />
            </div>

            <div className="dept-field">
              <label htmlFor="department-code">
                Department Code *
              </label>
              <input
                id="department-code"
                maxLength={30}
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. DEV"
                required
              />
            </div>

            <div className="dept-field">
              <label htmlFor="department-description">
                Description
              </label>
              <textarea
                id="department-description"
                rows={4}
                maxLength={1000}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe the department"
              />
              <small style={{ textAlign: "right", color: "#64748b" }}>
                {form.description.length}/1000 characters
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
                    {editingId ? "Update Department" : "Save Department"}
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