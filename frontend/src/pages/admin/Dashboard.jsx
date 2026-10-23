import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaUserCheck,
  FaMoneyBillWave,
  FaCalendarTimes,
  FaArrowRight,
  FaUserPlus,
  FaFileInvoiceDollar,
  FaBuilding,
  FaExclamationCircle,
  FaSyncAlt,
} from "react-icons/fa";

import AttendanceChart from "../../components/dashboard/AttendanceChart";
import PayrollChart from "../../components/dashboard/PayrollChart";
import employeeService from "../../services/employeeService";

const styles = `
.admin-dashboard,
.admin-dashboard * {
  box-sizing: border-box;
}

.admin-dashboard {
  width: 100%;
  min-width: 0;
  color: #1e293b;
  font-family: Arial, Helvetica, sans-serif;
}

.dash-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.dash-heading h1 {
  margin: 0 0 7px;
  color: #0f172a;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.7px;
}

.dash-heading p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.7;
}

.dash-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.dash-btn {
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 15px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #dbe5f1;
  border-radius: 10px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.dash-btn:hover {
  border-color: #7dd3fc;
  background: #f0f9ff;
}

.dash-btn.primary {
  color: #ffffff;
  background: linear-gradient(135deg, #0891b2, #2563eb);
  border-color: transparent;
  box-shadow: 0 5px 14px rgba(37, 99, 235, 0.16);
}

.dash-btn.primary:hover {
  box-shadow: 0 7px 18px rgba(37, 99, 235, 0.23);
  transform: translateY(-1px);
}

.dash-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  padding: 13px 15px;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 11px;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.dash-alert svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 24px;
}

.dash-stat {
  min-width: 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid #e3edf7;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(15, 23, 42, 0.035);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dash-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 24px rgba(15, 23, 42, 0.06);
}

.dash-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.dash-stat-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.dash-stat-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 13px;
  font-size: 17px;
}

.dash-stat-value {
  min-width: 0;
  margin-top: 17px;
  color: #0f172a;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.7px;
  overflow-wrap: anywhere;
}

.dash-stat-value.money {
  font-size: clamp(17px, 1.7vw, 24px);
  letter-spacing: -0.5px;
}

.dash-stat-note {
  margin-top: 7px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.6;
}

.dash-charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 21px;
  margin-bottom: 24px;
}

.dash-chart-slot {
  min-width: 0;
  overflow: hidden;
}

.dash-bottom {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 21px;
}

.dash-panel {
  min-width: 0;
  padding: 21px;
  background: #ffffff;
  border: 1px solid #e3edf7;
  border-radius: 16px;
  box-shadow: 0 5px 20px rgba(15, 23, 42, 0.035);
}

.dash-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
}

.dash-panel-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 750;
}

.dash-panel-head a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  color: #0284c7;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.dash-panel-head a:hover {
  color: #1d4ed8;
}

.dash-activity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 13px 0;
  border-bottom: 1px solid #edf2f7;
}

.dash-activity:last-of-type {
  border-bottom: 0;
}

.dash-activity-icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #0284c7;
  background: linear-gradient(135deg, #e0f7ff, #eff6ff);
  border-radius: 11px;
}

.dash-activity-copy {
  min-width: 0;
  flex: 1;
}

.dash-activity strong {
  display: block;
  color: #334155;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.dash-activity small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.dash-employee-status {
  flex-shrink: 0;
  padding: 5px 8px;
  color: #047857;
  background: #ecfdf5;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.dash-employee-status.inactive {
  color: #64748b;
  background: #f1f5f9;
}

.dash-quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.dash-quick-link {
  min-width: 0;
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px;
  color: #334155;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 650;
  transition: all 0.2s ease;
}

.dash-quick-link:hover {
  color: #0369a1;
  background: #f0f9ff;
  border-color: #bae6fd;
  transform: translateY(-1px);
}

.dash-quick-link svg {
  flex-shrink: 0;
  color: #0284c7;
  font-size: 15px;
}

.dash-empty {
  margin: 0;
  padding: 19px 12px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #dbe5f1;
  border-radius: 11px;
  font-size: 12px;
  line-height: 1.8;
  text-align: center;
}

.dash-empty a {
  color: #0284c7;
  font-weight: 700;
  text-decoration: none;
}

.dash-department-count {
  margin-top: 14px;
  padding-top: 13px;
  color: #64748b;
  border-top: 1px solid #edf2f7;
  font-size: 11px;
}

.dash-loading {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.dash-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #bae6fd;
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: dash-spin 0.75s linear infinite;
}

@keyframes dash-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1200px) {
  .dash-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dash-charts {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .dash-bottom {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .dash-heading {
    align-items: flex-start;
    margin-bottom: 19px;
  }

  .dash-heading h1 {
    font-size: 23px;
  }

  .dash-heading p {
    font-size: 12px;
  }

  .dash-actions {
    width: 100%;
  }

  .dash-btn {
    flex: 1;
    padding: 10px;
    font-size: 11px;
  }

  .dash-stats {
    gap: 11px;
    margin-bottom: 18px;
  }

  .dash-stat {
    padding: 15px;
    border-radius: 13px;
  }

  .dash-stat-icon {
    width: 35px;
    height: 35px;
    font-size: 15px;
  }

  .dash-stat-value {
    margin-top: 13px;
    font-size: 23px;
  }

  .dash-stat-note {
    font-size: 10px;
  }

  .dash-charts,
  .dash-bottom {
    gap: 16px;
    margin-bottom: 17px;
  }

  .dash-panel {
    padding: 16px;
  }

  .dash-quick-links {
    gap: 9px;
  }

  .dash-quick-link {
    padding: 11px 9px;
    font-size: 11px;
  }
}

@media (max-width: 380px) {
  .dash-stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .dash-actions {
    flex-direction: column;
  }

  .dash-btn {
    width: 100%;
    flex: auto;
  }

  .dash-quick-links {
    grid-template-columns: minmax(0, 1fr);
  }

  .dash-stat-value.money {
    font-size: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-dashboard *,
  .admin-dashboard *::before,
  .admin-dashboard *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

function readDepartments() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("department_records") || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeEmployees(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.employees)) return result.employees;
  return [];
}

function money(value) {
  const amount = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await employeeService.getAll();
      setEmployees(normalizeEmployees(result));
      setDepartments(readDepartments());
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load dashboard data. Please try again."
      );
      setEmployees([]);
      setDepartments(readDepartments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          String(employee.status || "Active").toLowerCase() === "active"
      ).length,
    [employees]
  );

  const monthlyPayroll = useMemo(
    () =>
      employees.reduce((total, employee) => {
        const salary = Number(
          employee.salary ?? employee.basicSalary ?? employee.basic_salary ?? 0
        );

        return total + (Number.isFinite(salary) && salary > 0 ? salary : 0);
      }, 0),
    [employees]
  );

  const stats = [
    {
      label: "Total Employees",
      value: loading ? "—" : employees.length,
      note: "Saved employee records",
      icon: <FaUsers />,
      color: "#2563eb",
      bg: "#eff6ff",
    },
    {
      label: "Active Employees",
      value: loading ? "—" : activeEmployees,
      note: "Employees marked active",
      icon: <FaUserCheck />,
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Monthly Payroll",
      value: loading ? "—" : money(monthlyPayroll),
      note: "Sum of saved monthly salaries",
      icon: <FaMoneyBillWave />,
      color: "#7c3aed",
      bg: "#f5f3ff",
      isMoney: true,
    },
    {
      label: "Pending Leaves",
      value: "—",
      note: "Leave request data not connected",
      icon: <FaCalendarTimes />,
      color: "#d97706",
      bg: "#fffbeb",
    },
  ];

  const recentEmployees = useMemo(
    () =>
      [...employees]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.joiningDate || 0).getTime();
          const dateB = new Date(b.createdAt || b.joiningDate || 0).getTime();

          return (Number.isFinite(dateB) ? dateB : 0) -
            (Number.isFinite(dateA) ? dateA : 0);
        })
        .slice(0, 5),
    [employees]
  );

  return (
    <div className="admin-dashboard">
      <style>{styles}</style>

      <header className="dash-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your employee and payroll records.</p>
        </div>

        <div className="dash-actions">
          <Link to="/admin/employees/add" className="dash-btn primary">
            <FaUserPlus /> Add Employee
          </Link>

          <Link to="/admin/payroll/generate" className="dash-btn">
            <FaFileInvoiceDollar /> Generate Payroll
          </Link>
        </div>
      </header>

      {error && (
        <div className="dash-alert" role="alert">
          <FaExclamationCircle />
          <div>
            <strong>Dashboard data could not be loaded.</strong>
            <div>{error}</div>
            <button
              type="button"
              className="dash-btn"
              onClick={loadDashboard}
              style={{ marginTop: 10 }}
            >
              <FaSyncAlt /> Try again
            </button>
          </div>
        </div>
      )}

      <section className="dash-stats" aria-label="Employee statistics">
        {stats.map((stat) => (
          <article className="dash-stat" key={stat.label}>
            <div className="dash-stat-top">
              <span className="dash-stat-label">{stat.label}</span>

              <span
                className="dash-stat-icon"
                style={{ color: stat.color, background: stat.bg }}
                aria-hidden="true"
              >
                {stat.icon}
              </span>
            </div>

            <div
              className={`dash-stat-value${stat.isMoney ? " money" : ""}`}
              aria-live="polite"
            >
              {stat.value}
            </div>

            <div className="dash-stat-note">{stat.note}</div>
          </article>
        ))}
      </section>

      <section className="dash-charts" aria-label="Reports and charts">
        <div className="dash-chart-slot">
          <AttendanceChart
            data={[]}
            loading={loading}
            title="Attendance Overview"
            subtitle="Attendance statistics will appear when attendance data is connected."
          />
        </div>

        <div className="dash-chart-slot">
          <PayrollChart
            data={[]}
            loading={loading}
            title="Payroll Overview"
            subtitle="Monthly payroll history will appear when payroll records are connected."
          />
        </div>
      </section>

      <section className="dash-bottom">
        <article className="dash-panel">
          <div className="dash-panel-head">
            <h2>Recent Employees</h2>

            <Link to="/admin/employees">
              View all <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="dash-loading" role="status">
              <span className="dash-spinner" aria-hidden="true" />
              Loading employees...
            </div>
          ) : recentEmployees.length === 0 ? (
            <p className="dash-empty">
              No employees found.{" "}
              <Link to="/admin/employees/add">Add your first employee</Link>.
            </p>
          ) : (
            recentEmployees.map((employee, index) => {
              const name = employee.name || "Unnamed Employee";
              const department =
                typeof employee.department === "object"
                  ? employee.department?.name ||
                    employee.department?.departmentName ||
                    "Unassigned Department"
                  : employee.department || "Unassigned Department";

              const isActive =
                String(employee.status || "Active").toLowerCase() === "active";

              return (
                <div
                  className="dash-activity"
                  key={
                    employee.id ||
                    employee._id ||
                    employee.employeeId ||
                    employee.email ||
                    `${name}-${index}`
                  }
                >
                  <div className="dash-activity-icon" aria-hidden="true">
                    <FaUsers />
                  </div>

                  <div className="dash-activity-copy">
                    <strong>{name}</strong>
                    <small>
                      {employee.designation || "Employee"} · {department}
                    </small>
                  </div>

                  <span
                    className={`dash-employee-status${
                      isActive ? "" : " inactive"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              );
            })
          )}

          <div className="dash-department-count">
            <FaBuilding style={{ marginRight: 7 }} />
            Saved departments: {departments.length}
          </div>
        </article>

        <article className="dash-panel">
          <div className="dash-panel-head">
            <h2>Quick Actions</h2>
          </div>

          <div className="dash-quick-links">
            <Link className="dash-quick-link" to="/admin/employees/add">
              <FaUserPlus /> Add Employee
            </Link>

            <Link className="dash-quick-link" to="/admin/employees">
              <FaUsers /> Employees
            </Link>

            <Link className="dash-quick-link" to="/admin/attendance">
              <FaUserCheck /> Attendance
            </Link>

            <Link className="dash-quick-link" to="/admin/departments">
              <FaBuilding /> Departments
            </Link>

            <Link className="dash-quick-link" to="/admin/payroll/generate">
              <FaMoneyBillWave /> Payroll
            </Link>

            <Link className="dash-quick-link" to="/admin/reports/payroll">
              <FaFileInvoiceDollar /> Reports
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
