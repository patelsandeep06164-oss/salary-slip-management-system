
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUsers,
  FaEye,
  FaSyncAlt,
  FaExclamationCircle,
} from "react-icons/fa";

import employeeService from "../../services/employeeService";

const styles = `
.emp-page {
  font-family: Arial, sans-serif;
  color: #1e293b;
  width: 100%;
  min-width: 0;
}
.emp-page * { box-sizing: border-box; }

.emp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 23px;
}
.emp-header h1 { font-size: 27px; margin: 0 0 7px; }
.emp-header p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; }

.emp-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #0891b2);
  color: #fff;
  text-decoration: none;
  border: 0;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
}
.emp-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px #2563eb30;
}
.emp-primary:focus-visible,
.emp-icon-btn:focus-visible,
.emp-search input:focus-visible,
.emp-select:focus-visible {
  outline: 3px solid #93c5fd;
  outline-offset: 3px;
}

.emp-summary {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 19px 20px;
  background: linear-gradient(135deg, #fff, #f0f9ff);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  margin-bottom: 20px;
  box-shadow: 0 5px 20px #0f172a06;
}
.emp-summary-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: linear-gradient(135deg, #dbeafe, #cffafe);
  color: #2563eb;
  font-size: 20px;
  flex-shrink: 0;
}
.emp-summary small { display: block; color: #64748b; font-size: 13px; }
.emp-summary strong { display: block; font-size: 25px; margin-top: 5px; }

.emp-card {
  background: #fff;
  border: 1px solid #e5edf5;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 5px 20px #0f172a08;
}
.emp-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.emp-search {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 220px;
  flex: 1;
  max-width: 420px;
  border: 1px solid #dbe5f1;
  padding: 0 12px;
  border-radius: 10px;
  color: #64748b;
  background: #fff;
}
.emp-search input {
  width: 100%;
  min-width: 0;
  padding: 12px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1e293b;
  font-size: 13px;
}
.emp-select {
  padding: 12px;
  border: 1px solid #dbe5f1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  min-width: 150px;
  font-size: 13px;
}
.emp-table-wrap { width: 100%; overflow-x: auto; }
.emp-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}
.emp-table th {
  text-align: left;
  background: #f8fafc;
  padding: 14px 12px;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .4px;
  white-space: nowrap;
}
.emp-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #eef2f7;
  font-size: 13px;
  vertical-align: middle;
}
.emp-table tbody tr:hover { background: #f8fbff; }
.emp-table tr:last-child td { border-bottom: 0; }

.emp-person { display: flex; align-items: center; gap: 10px; min-width: 190px; }
.emp-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #dbeafe, #cffafe);
  color: #1d4ed8;
  font-weight: 700;
  flex-shrink: 0;
}
.emp-person strong { display: block; font-size: 13px; overflow-wrap: anywhere; }
.emp-person small { display: block; color: #64748b; margin-top: 4px; font-size: 11px; overflow-wrap: anywhere; }

.emp-status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.emp-status.active { background: #dcfce7; color: #15803d; }
.emp-status.inactive { background: #fee2e2; color: #b91c1c; }
.emp-status.other { background: #e0f2fe; color: #0369a1; }

.emp-actions { display: flex; gap: 7px; }
.emp-icon-btn {
  width: 33px;
  height: 33px;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #475569;
  display: grid;
  place-items: center;
  cursor: pointer;
  text-decoration: none;
  transition: background .2s, color .2s, border-color .2s;
}
.emp-icon-btn:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
.emp-icon-btn.delete:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

.emp-empty { text-align: center; padding: 38px 12px; color: #64748b; font-size: 14px; }
.emp-empty svg { margin-bottom: 12px; font-size: 25px; color: #94a3b8; }
.emp-notice {
  padding: 12px 14px;
  margin-bottom: 15px;
  border-radius: 9px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  font-size: 13px;
  line-height: 1.5;
}
.emp-notice.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}
.emp-loading { text-align: center; padding: 38px 12px; color: #64748b; font-size: 14px; }
.emp-loading svg { margin-right: 8px; }
.emp-refresh {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border: 1px solid #dbe5f1;
  border-radius: 9px;
  background: white;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.emp-refresh:disabled { opacity: .6; cursor: not-allowed; }

@media (max-width: 600px) {
  .emp-header h1 { font-size: 23px; }
  .emp-card { padding: 13px; }
  .emp-toolbar { flex-direction: column; align-items: stretch; }
  .emp-search { max-width: none; width: 100%; min-width: 0; }
  .emp-select { width: 100%; }
  .emp-summary { padding: 15px; }
  .emp-primary { width: 100%; }
}
`;

function getDepartmentName(department) {
  if (typeof department === "string") return department;
  if (department && typeof department === "object") {
    return department.name || department.departmentName || "";
  }
  return "";
}

function formatSalary(employee) {
  const salary = Number(
    employee?.salary ?? employee?.basicSalary ?? employee?.basic_salary
  );

  if (!Number.isFinite(salary) || salary < 0) return "—";

  return salary.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function getStatus(employee) {
  const value = String(employee?.status || "Active").trim();
  return value || "Active";
}

function normalizeEmployeeResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.employees)) return response.data.employees;
  return [];
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const response = await employeeService.getAll();
      setEmployees(normalizeEmployeeResponse(response));
    } catch (error) {
      setEmployees([]);
      setNotice(error?.message || "Employees load nahi ho paaye.");
      setNoticeType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const department = getDepartmentName(employee.department);

      const matchesSearch = [
        employee.name,
        employee.email,
        employee.employeeId,
        department,
        employee.designation,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      const employeeStatus = getStatus(employee);
      const matchesStatus =
        status === "All" ||
        employeeStatus.toLowerCase() === status.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [employees, search, status]);

  async function deleteEmployee(employee) {
    const confirmed = window.confirm(
      `Kya aap "${employee.name || "this employee"}" ko delete karna chahte hain?`
    );

    if (!confirmed) return;

    setDeletingId(employee.id);

    try {
      await employeeService.delete(employee.id);

      setEmployees((current) =>
        current.filter((item) => String(item.id) !== String(employee.id))
      );

      setNotice(`${employee.name || "Employee"} successfully delete ho gaya.`);
      setNoticeType("success");
    } catch (error) {
      setNotice(error?.message || "Employee delete nahi ho paaya.");
      setNoticeType("error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="emp-page">
      <style>{styles}</style>

      <header className="emp-header">
        <div>
          <h1>Employees</h1>
          <p>Manage employee profiles, departments and employment status.</p>
        </div>

        <Link className="emp-primary" to="/admin/employees/add">
          <FaPlus /> Add Employee
        </Link>
      </header>

      <div className="emp-summary">
        <div className="emp-summary-icon">
          <FaUsers />
        </div>
        <div>
          <small>Total employees in saved records</small>
          <strong>{loading ? "…" : employees.length}</strong>
        </div>
      </div>

      {notice && (
        <div
          className={`emp-notice ${noticeType === "error" ? "error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
      )}

      <section className="emp-card">
        <div className="emp-toolbar">
          <label className="emp-search">
            <FaSearch />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, ID, department..."
              aria-label="Search employees"
            />
          </label>

          <select
            className="emp-select"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter employees by status"
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="emp-refresh"
            onClick={loadEmployees}
            disabled={loading}
          >
            <FaSyncAlt /> {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Monthly Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredEmployees.map((employee, index) => {
                  const employeeId = employee.id ?? employee._id ?? employee.employeeId ?? index;
                  const employeeStatus = getStatus(employee);
                  const normalizedStatus = employeeStatus.toLowerCase();
                  const statusClass =
                    normalizedStatus === "active"
                      ? "active"
                      : normalizedStatus === "inactive"
                      ? "inactive"
                      : "other";

                  return (
                    <tr key={employeeId}>
                      <td>
                        <div className="emp-person">
                          <div className="emp-avatar">
                            {(employee.name || "E").trim().charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{employee.name || "Unnamed"}</strong>
                            <small>{employee.email || "No email added"}</small>
                          </div>
                        </div>
                      </td>

                      <td>{employee.employeeId || "—"}</td>
                      <td>{getDepartmentName(employee.department) || "—"}</td>
                      <td>{employee.designation || "—"}</td>
                      <td>{formatSalary(employee)}</td>

                      <td>
                        <span className={`emp-status ${statusClass}`}>
                          {employeeStatus}
                        </span>
                      </td>

                      <td>
                        <div className="emp-actions">
                          <button
                            type="button"
                            className="emp-icon-btn"
                            title="View employee"
                            aria-label={`View ${employee.name || "employee"}`}
                            onClick={() =>
                              navigate(`/admin/employees/edit/${employee.id ?? employee._id}`)
                            }
                          >
                            <FaEye />
                          </button>

                          <button
                            type="button"
                            className="emp-icon-btn"
                            title="Edit employee"
                            aria-label={`Edit ${employee.name || "employee"}`}
                            onClick={() =>
                              navigate(`/admin/employees/edit/${employee.id ?? employee._id}`)
                            }
                          >
                            <FaEdit />
                          </button>

                          <button
                            type="button"
                            className="emp-icon-btn delete"
                            title="Delete employee"
                            aria-label={`Delete ${employee.name || "employee"}`}
                            disabled={deletingId === employee.id}
                            onClick={() => deleteEmployee(employee)}
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

          {loading ? (
            <div className="emp-loading" role="status">
              <FaSyncAlt /> Loading employee records...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="emp-empty">
              <FaExclamationCircle />
              <div>
                {employees.length === 0
                  ? "No employee records found. Add an employee to get started."
                  : "No matching employees found. Try another search or status filter."}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
