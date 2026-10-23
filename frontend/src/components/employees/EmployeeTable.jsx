import React, { useMemo, useState } from "react";
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaTimes,
} from "react-icons/fa";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function getEmployeeName(employee) {
  return employee?.name || employee?.fullName || "Unnamed Employee";
}

function getDepartmentName(employee) {
  const department = employee?.department;

  if (typeof department === "string") {
    return department || "Not assigned";
  }

  return department?.name || department?.departmentName || "Not assigned";
}

function getEmployeeSalary(employee) {
  return (
    Number(
      employee?.basicSalary ??
        employee?.salary ??
        employee?.basic_salary
    ) || 0
  );
}

function getStatus(employee) {
  return String(employee?.status || "Active").trim();
}

function EmployeeTable({
  employees = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAdd,
  emptyMessage = "No employee records found.",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const safeEmployees = Array.isArray(employees)
    ? employees.filter(
        (employee) =>
          employee && typeof employee === "object"
      )
    : [];

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return safeEmployees.filter((employee) => {
      const name = getEmployeeName(employee).toLowerCase();
      const employeeId = String(employee.employeeId || employee.employeeCode || "").toLowerCase();
      const email = String(employee.email || "").toLowerCase();
      const department = getDepartmentName(employee).toLowerCase();
      const designation = String(employee.designation || "").toLowerCase();
      const status = getStatus(employee).toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        employeeId.includes(query) ||
        email.includes(query) ||
        department.includes(query) ||
        designation.includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [safeEmployees, searchTerm, statusFilter]);

  const statusClass = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "active") return "employee-table-status-active";
    if (normalized === "inactive") return "employee-table-status-inactive";
    if (normalized === "on leave") return "employee-table-status-leave";

    return "employee-table-status-default";
  };

  const getEmployeeKey = (employee, index) =>
    employee._id || employee.id || employee.employeeId || index;

  return (
    <>
      <style>{`
        .employee-table-card,
        .employee-table-card * {
          box-sizing: border-box;
        }

        .employee-table-card {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          border: 1px solid #e2eaf2;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 7px 24px rgba(15, 42, 70, 0.045);
          font-family: Inter, Arial, sans-serif;
          color: #17233e;
        }

        .employee-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          padding: 19px;
          border-bottom: 1px solid #e8eef5;
        }

        .employee-table-toolbar-title {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .employee-table-toolbar-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #d8faf5, #dbeafe);
          color: #087f8c;
          font-size: 17px;
        }

        .employee-table-toolbar-title h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 750;
        }

        .employee-table-toolbar-title p {
          margin: 5px 0 0;
          color: #718198;
          font-size: 11px;
        }

        .employee-table-toolbar-controls {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 9px;
        }

        .employee-table-search {
          position: relative;
          width: 235px;
          max-width: 100%;
        }

        .employee-table-search-icon {
          position: absolute;
          top: 50%;
          left: 12px;
          transform: translateY(-50%);
          color: #8494a8;
          font-size: 12px;
          pointer-events: none;
        }

        .employee-table-search input {
          width: 100%;
          min-height: 39px;
          padding: 9px 34px 9px 34px;
          border: 1px solid #dce6ef;
          border-radius: 9px;
          outline: none;
          color: #17233e;
          background: #fff;
          font-family: inherit;
          font-size: 12px;
        }

        .employee-table-search input:focus,
        .employee-table-filter:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }

        .employee-table-clear {
          position: absolute;
          top: 50%;
          right: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          transform: translateY(-50%);
          border: none;
          border-radius: 5px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }

        .employee-table-filter {
          min-height: 39px;
          max-width: 100%;
          padding: 8px 10px;
          border: 1px solid #dce6ef;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #334155;
          font-family: inherit;
          font-size: 12px;
          cursor: pointer;
        }

        .employee-table-add-button {
          min-height: 39px;
          padding: 9px 13px;
          border: none;
          border-radius: 9px;
          background: linear-gradient(135deg, #0d9488, #2563eb);
          color: #fff;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .employee-table-add-button:hover {
          transform: translateY(-1px);
        }

        .employee-table-count {
          padding: 12px 19px;
          color: #64748b;
          font-size: 11px;
          border-bottom: 1px solid #eef2f7;
        }

        .employee-table-count strong {
          color: #087f8c;
        }

        .employee-table-scroll {
          width: 100%;
          overflow-x: auto;
          overscroll-behavior-x: contain;
        }

        .employee-table {
          width: 100%;
          min-width: 850px;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .employee-table th {
          padding: 13px 15px;
          border-bottom: 1px solid #e8eef5;
          background: #f7fafc;
          color: #64748b;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 0.35px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .employee-table td {
          padding: 14px 15px;
          border-bottom: 1px solid #eef2f7;
          color: #334155;
          font-size: 12px;
          vertical-align: middle;
        }

        .employee-table tbody tr:last-child td {
          border-bottom: none;
        }

        .employee-table tbody tr:hover td {
          background: #f8fcff;
        }

        .employee-table-employee {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 170px;
        }

        .employee-table-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 37px;
          height: 37px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 11px;
          background: linear-gradient(135deg, #d9faf5, #dbeafe);
          color: #087f8c;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .employee-table-name {
          display: block;
          max-width: 190px;
          overflow: hidden;
          color: #17233e;
          font-size: 12px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .employee-table-id {
          display: block;
          margin-top: 4px;
          color: #8293a8;
          font-size: 10px;
        }

        .employee-table-contact {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 3px 0;
          color: #64748b;
          overflow-wrap: anywhere;
        }

        .employee-table-contact svg {
          flex-shrink: 0;
          color: #0d9488;
          font-size: 10px;
        }

        .employee-table-status {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .employee-table-status-active {
          background: #dcfce7;
          color: #166534;
        }

        .employee-table-status-inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .employee-table-status-leave {
          background: #fef3c7;
          color: #92400e;
        }

        .employee-table-status-default {
          background: #e2e8f0;
          color: #475569;
        }

        .employee-table-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .employee-table-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
          border: 1px solid #e2eaf2;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .employee-table-action:hover {
          transform: translateY(-1px);
        }

        .employee-table-action-view {
          color: #2563eb;
        }

        .employee-table-action-view:hover {
          background: #eff6ff;
        }

        .employee-table-action-edit {
          color: #087f8c;
        }

        .employee-table-action-edit:hover {
          background: #e9fbf8;
        }

        .employee-table-action-delete {
          color: #dc2626;
        }

        .employee-table-action-delete:hover {
          background: #fef2f2;
        }

        .employee-table-empty {
          padding: 45px 20px;
          color: #718198;
          text-align: center;
        }

        .employee-table-empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 54px;
          height: 54px;
          margin: 0 auto 12px;
          border-radius: 16px;
          background: #e9fbf8;
          color: #087f8c;
          font-size: 22px;
        }

        .employee-table-empty p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        .employee-table-loading {
          padding: 42px 20px;
          color: #718198;
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 700px) {
          .employee-table-toolbar {
            align-items: stretch;
            padding: 15px;
          }

          .employee-table-toolbar-controls {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
          }

          .employee-table-search {
            grid-column: 1 / -1;
            width: 100%;
          }

          .employee-table-filter {
            width: 100%;
          }

          .employee-table-count {
            padding: 11px 15px;
          }
        }

        @media (max-width: 360px) {
          .employee-table-toolbar-title h3 {
            font-size: 14px;
          }

          .employee-table-toolbar-controls {
            grid-template-columns: 1fr;
          }

          .employee-table-search {
            grid-column: auto;
          }
        }
      `}</style>

      <section className="employee-table-card">
        <div className="employee-table-toolbar">
          <div className="employee-table-toolbar-title">
            <div className="employee-table-toolbar-icon">
              <FaUsers />
            </div>

            <div>
              <h3>Employee Directory</h3>
              <p>Manage employee information</p>
            </div>
          </div>

          <div className="employee-table-toolbar-controls">
            <div className="employee-table-search">
              <FaSearch className="employee-table-search-icon" />

              <input
                type="search"
                aria-label="Search employees"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {searchTerm && (
                <button
                  type="button"
                  className="employee-table-clear"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                >
                  <FaTimes />
                </button>
              )}
            </div>

            <select
              className="employee-table-filter"
              aria-label="Filter employees by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
            </select>

            {typeof onAdd === "function" && (
              <button
                type="button"
                className="employee-table-add-button"
                onClick={onAdd}
              >
                + Add Employee
              </button>
            )}
          </div>
        </div>

        <div className="employee-table-count">
          Showing <strong>{filteredEmployees.length}</strong> of{" "}
          <strong>{safeEmployees.length}</strong> employee records
        </div>

        {loading ? (
          <div className="employee-table-loading" role="status">
            Loading employee records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="employee-table-empty">
            <div className="employee-table-empty-icon">
              <FaUsers />
            </div>

            <p>
              {searchTerm || statusFilter !== "All"
                ? "No employees match your search or filter."
                : emptyMessage}
            </p>
          </div>
        ) : (
          <div className="employee-table-scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Contact</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee, index) => {
                  const employeeKey = getEmployeeKey(employee, index);
                  const name = getEmployeeName(employee);
                  const employeeId =
                    employee.employeeId ||
                    employee.employeeCode ||
                    employee._id ||
                    "ID not assigned";
                  const status = getStatus(employee);
                  const initials = name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("");

                  return (
                    <tr key={employeeKey}>
                      <td>
                        <div className="employee-table-employee">
                          <div className="employee-table-avatar">
                            {initials || <FaUsers />}
                          </div>

                          <div>
                            <span className="employee-table-name">
                              {name}
                            </span>

                            <span className="employee-table-id">
                              {employeeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="employee-table-contact">
                          <FaEnvelope />
                          <span>
                            {employee.email || "Not provided"}
                          </span>
                        </div>

                        <div className="employee-table-contact">
                          <FaPhone />
                          <span>
                            {employee.phone || "Not provided"}
                          </span>
                        </div>
                      </td>

                      <td>{getDepartmentName(employee)}</td>

                      <td>{employee.designation || "Not assigned"}</td>

                      <td>
                        <strong>
                          {formatCurrency(getEmployeeSalary(employee))}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`employee-table-status ${statusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <div className="employee-table-actions">
                          {typeof onView === "function" && (
                            <button
                              type="button"
                              className="employee-table-action employee-table-action-view"
                              title="View employee"
                              aria-label={`View ${name}`}
                              onClick={() => onView(employee)}
                            >
                              <FaEye />
                            </button>
                          )}

                          {typeof onEdit === "function" && (
                            <button
                              type="button"
                              className="employee-table-action employee-table-action-edit"
                              title="Edit employee"
                              aria-label={`Edit ${name}`}
                              onClick={() => onEdit(employee)}
                            >
                              <FaEdit />
                            </button>
                          )}

                          {typeof onDelete === "function" && (
                            <button
                              type="button"
                              className="employee-table-action employee-table-action-delete"
                              title="Delete employee"
                              aria-label={`Delete ${name}`}
                              onClick={() => onDelete(employee)}
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default EmployeeTable;
