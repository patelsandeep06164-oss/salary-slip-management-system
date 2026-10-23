
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaUsers,
  FaUserCheck,
  FaMoneyBillWave,
  FaChartLine,
  FaSearch,
  FaFilter,
  FaDownload,
  FaSyncAlt,
  FaEye,
  FaTimes,
  FaExclamationCircle,
  FaCheckCircle,
  FaFileAlt,
} from "react-icons/fa";
import "./EmployeeReports.css";

const EMPLOYEE_API = "/api/employees";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getEmployeeId = (employee) =>
  String(
    employee?.employeeId ??
      employee?.empId ??
      employee?.staffId ??
      employee?._id ??
      employee?.id ??
      ""
  );

const getEmployeeName = (employee) =>
  employee?.name ||
  employee?.fullName ||
  [employee?.firstName, employee?.lastName].filter(Boolean).join(" ") ||
  "Unnamed Employee";

const getDepartment = (employee) =>
  employee?.department?.name ||
  employee?.department ||
  employee?.departmentName ||
  "Unassigned";

const getDesignation = (employee) =>
  employee?.designation ||
  employee?.position ||
  employee?.jobTitle ||
  "—";

const getSalary = (employee) =>
  Number(
    employee?.salary ??
      employee?.basicSalary ??
      employee?.monthlySalary ??
      employee?.salaryDetails?.basicSalary ??
      0
  ) || 0;

const getEmployeeStatus = (employee) => {
  const rawStatus = String(
    employee?.employmentStatus || employee?.status || "Active"
  ).toLowerCase();

  if (["inactive", "disabled", "terminated", "resigned"].includes(rawStatus)) {
    return "Inactive";
  }

  if (["on leave", "on-leave", "leave"].includes(rawStatus)) {
    return "On Leave";
  }

  if (["pending", "probation"].includes(rawStatus)) {
    return "Pending";
  }

  return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
};

const extractEmployees = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.employees)) {
    return response.data.employees;
  }
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

function EmployeeReports() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [joiningFrom, setJoiningFrom] = useState("");
  const [joiningTo, setJoiningTo] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setNotice("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(EMPLOYEE_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Unable to load employee reports."
        );
      }

      setEmployees(extractEmployees(data));
    } catch (error) {
      setNoticeType("error");
      setNotice(
        error.message || "Unable to connect to the employee server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = useMemo(() => {
    return [
      ...new Set(
        employees
          .map(getDepartment)
          .filter((department) => department !== "Unassigned")
      ),
    ].sort((a, b) => String(a).localeCompare(String(b)));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return employees
      .filter((employee) => {
        const name = getEmployeeName(employee).toLowerCase();
        const id = getEmployeeId(employee).toLowerCase();
        const department = String(getDepartment(employee)).toLowerCase();
        const designation = getDesignation(employee).toLowerCase();
        const email = String(employee.email || "").toLowerCase();

        const matchesSearch =
          !query ||
          name.includes(query) ||
          id.includes(query) ||
          department.includes(query) ||
          designation.includes(query) ||
          email.includes(query);

        const matchesDepartment =
          departmentFilter === "All" ||
          getDepartment(employee) === departmentFilter;

        const matchesStatus =
          statusFilter === "All" ||
          getEmployeeStatus(employee).toLowerCase() ===
            statusFilter.toLowerCase();

        const joiningDate = employee.joiningDate || employee.dateOfJoining;
        const parsedDate = joiningDate ? new Date(joiningDate) : null;

        const validJoiningDate =
          parsedDate && !Number.isNaN(parsedDate.getTime());

        const matchesFrom =
          !joiningFrom ||
          (validJoiningDate &&
            parsedDate >= new Date(`${joiningFrom}T00:00:00`));

        const matchesTo =
          !joiningTo ||
          (validJoiningDate &&
            parsedDate <= new Date(`${joiningTo}T23:59:59.999`));

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesStatus &&
          matchesFrom &&
          matchesTo
        );
      })
      .sort((a, b) =>
        getEmployeeName(a).localeCompare(getEmployeeName(b))
      );
  }, [
    employees,
    searchTerm,
    departmentFilter,
    statusFilter,
    joiningFrom,
    joiningTo,
  ]);

  const totalEmployees = filteredEmployees.length;

  const activeEmployees = filteredEmployees.filter(
    (employee) => getEmployeeStatus(employee) === "Active"
  ).length;

  const totalMonthlySalary = filteredEmployees.reduce(
    (sum, employee) => sum + getSalary(employee),
    0
  );

  const averageSalary = totalEmployees
    ? totalMonthlySalary / totalEmployees
    : 0;

  const exportCsv = () => {
    if (filteredEmployees.length === 0) {
      setNoticeType("error");
      setNotice("There are no employee records to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Employment Status",
      "Monthly Salary",
      "Joining Date",
    ];

    const rows = filteredEmployees.map((employee) => [
      getEmployeeId(employee),
      getEmployeeName(employee),
      employee.email || "",
      employee.phone || employee.mobile || "",
      getDepartment(employee),
      getDesignation(employee),
      getEmployeeStatus(employee),
      getSalary(employee),
      formatDate(employee.joiningDate || employee.dateOfJoining),
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "employee-report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setNoticeType("success");
    setNotice("Employee report exported successfully.");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("All");
    setStatusFilter("All");
    setJoiningFrom("");
    setJoiningTo("");
    setNotice("");
  };

  const getStatusClass = (status) =>
    String(status || "Active")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="employee-reports-page">
      <header className="employee-reports-header">
        <div className="employee-reports-heading">
          <span className="employee-reports-eyebrow">
            REPORTS & ANALYTICS
          </span>

          <h1>Employee Reports</h1>

          <p>
            Review employee information, department distribution, and salary
            summaries in one place.
          </p>
        </div>

        <div className="employee-reports-header-actions">
          <button
            type="button"
            className="employee-reports-refresh-btn"
            onClick={loadEmployees}
            disabled={loading}
            aria-label="Refresh employee reports"
            title="Refresh report"
          >
            <FaSyncAlt
              className={loading ? "employee-reports-spin" : ""}
            />
          </button>

          <button
            type="button"
            className="employee-reports-export-btn"
            onClick={exportCsv}
            disabled={loading || filteredEmployees.length === 0}
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </header>

      {notice && (
        <div
          className={`employee-reports-notice ${noticeType}`}
          role="status"
        >
          {noticeType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}

          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="employee-reports-stats">
        <article className="employee-reports-stat-card">
          <div className="employee-reports-stat-icon blue">
            <FaUsers />
          </div>

          <div className="employee-reports-stat-info">
            <span>Total Employees</span>
            <h3>{loading ? "—" : totalEmployees}</h3>
            <small>Matching current filters</small>
          </div>
        </article>

        <article className="employee-reports-stat-card">
          <div className="employee-reports-stat-icon green">
            <FaUserCheck />
          </div>

          <div className="employee-reports-stat-info">
            <span>Active Employees</span>
            <h3>{loading ? "—" : activeEmployees}</h3>
            <small>Currently marked active</small>
          </div>
        </article>

        <article className="employee-reports-stat-card">
          <div className="employee-reports-stat-icon purple">
            <FaMoneyBillWave />
          </div>

          <div className="employee-reports-stat-info">
            <span>Monthly Salary Total</span>
            <h3>
              {loading ? "—" : formatCurrency(totalMonthlySalary)}
            </h3>
            <small>Based on available salary fields</small>
          </div>
        </article>

        <article className="employee-reports-stat-card">
          <div className="employee-reports-stat-icon orange">
            <FaChartLine />
          </div>

          <div className="employee-reports-stat-info">
            <span>Average Salary</span>
            <h3>{loading ? "—" : formatCurrency(averageSalary)}</h3>
            <small>Per employee in this report</small>
          </div>
        </article>
      </section>

      <section className="employee-reports-content">
        <div className="employee-reports-toolbar">
          <div>
            <h2>Employee Directory Report</h2>
            <p>Filter employee records and inspect individual profiles.</p>
          </div>

          <span className="employee-reports-record-count">
            <FaFileAlt />
            {loading ? "Loading..." : `${filteredEmployees.length} records`}
          </span>
        </div>

        <div className="employee-reports-filters">
          <div className="employee-reports-search">
            <FaSearch />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, ID, email..."
              aria-label="Search employee report"
            />
          </div>

          <div className="employee-reports-filter-control">
            <FaFilter />

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter by department"
            >
              <option value="All">All Departments</option>

              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="employee-reports-filter-control">
            <FaUserCheck />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by employment status"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <label className="employee-reports-date-filter">
            <span>Joined from</span>
            <input
              type="date"
              value={joiningFrom}
              max={joiningTo || undefined}
              onChange={(event) => setJoiningFrom(event.target.value)}
              aria-label="Joining date from"
            />
          </label>

          <label className="employee-reports-date-filter">
            <span>Joined to</span>
            <input
              type="date"
              value={joiningTo}
              min={joiningFrom || undefined}
              onChange={(event) => setJoiningTo(event.target.value)}
              aria-label="Joining date to"
            />
          </label>

          <button
            type="button"
            className="employee-reports-clear-btn"
            onClick={clearFilters}
          >
            <FaTimes />
            Clear Filters
          </button>
        </div>

        <div className="employee-reports-table-wrap">
          <table className="employee-reports-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Monthly Salary</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="7">
                    <div className="employee-reports-empty">
                      <span className="employee-reports-loader" />
                      <p>Loading employee report...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredEmployees.map((employee, index) => {
                  const status = getEmployeeStatus(employee);
                  const employeeId = getEmployeeId(employee);
                  const name = getEmployeeName(employee);

                  return (
                    <tr key={employeeId || `${name}-${index}`}>
                      <td>
                        <div className="employee-reports-employee">
                          <div className="employee-reports-avatar">
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div className="employee-reports-employee-info">
                            <strong>{name}</strong>
                            <span>ID: {employeeId || "—"}</span>
                            <small>{employee.email || "No email"}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="employee-reports-department">
                          {getDepartment(employee)}
                        </span>
                      </td>

                      <td>{getDesignation(employee)}</td>

                      <td className="employee-reports-salary">
                        {formatCurrency(getSalary(employee))}
                      </td>

                      <td>
                        {formatDate(
                          employee.joiningDate || employee.dateOfJoining
                        )}
                      </td>

                      <td>
                        <span
                          className={`employee-reports-status ${getStatusClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="employee-reports-view-btn"
                          onClick={() => setSelectedEmployee(employee)}
                          aria-label={`View ${name}`}
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan="7">
                    <div className="employee-reports-empty">
                      <div className="employee-reports-empty-icon">
                        <FaUsers />
                      </div>

                      <h3>No employee records found</h3>

                      <p>
                        Try adjusting your filters or check whether the
                        employee API contains records.
                      </p>

                      <button
                        type="button"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="employee-reports-footer">
          <span>
            Showing <strong>{loading ? "—" : filteredEmployees.length}</strong>
            {" "}of{" "}
            <strong>{loading ? "—" : employees.length}</strong> employees
          </span>

          <span>Salary currency: INR (₹)</span>
        </footer>
      </section>

      {selectedEmployee && (
        <div
          className="employee-reports-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedEmployee(null);
            }
          }}
        >
          <section
            className="employee-reports-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="employeeReportsModalTitle"
          >
            <header className="employee-reports-modal-header">
              <div>
                <span>EMPLOYEE REPORT</span>
                <h2 id="employeeReportsModalTitle">Employee Details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close employee details"
              >
                <FaTimes />
              </button>
            </header>

            <div className="employee-reports-modal-body">
              <div className="employee-reports-profile">
                <div className="employee-reports-profile-avatar">
                  {getEmployeeName(selectedEmployee)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>{getEmployeeName(selectedEmployee)}</h3>
                  <p>
                    {getDesignation(selectedEmployee)} ·{" "}
                    {getDepartment(selectedEmployee)}
                  </p>
                  <span
                    className={`employee-reports-status ${getStatusClass(
                      getEmployeeStatus(selectedEmployee)
                    )}`}
                  >
                    {getEmployeeStatus(selectedEmployee)}
                  </span>
                </div>
              </div>

              <h3 className="employee-reports-section-title">
                Personal Information
              </h3>

              <div className="employee-reports-detail-grid">
                <div>
                  <span>Employee ID</span>
                  <strong>{getEmployeeId(selectedEmployee) || "—"}</strong>
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{selectedEmployee.email || "—"}</strong>
                </div>

                <div>
                  <span>Phone Number</span>
                  <strong>
                    {selectedEmployee.phone ||
                      selectedEmployee.mobile ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Department</span>
                  <strong>{getDepartment(selectedEmployee)}</strong>
                </div>

                <div>
                  <span>Designation</span>
                  <strong>{getDesignation(selectedEmployee)}</strong>
                </div>

                <div>
                  <span>Joining Date</span>
                  <strong>
                    {formatDate(
                      selectedEmployee.joiningDate ||
                        selectedEmployee.dateOfJoining
                    )}
                  </strong>
                </div>

                <div>
                  <span>Employment Type</span>
                  <strong>
                    {selectedEmployee.employmentType ||
                      selectedEmployee.employeeType ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Manager</span>
                  <strong>
                    {selectedEmployee.manager?.name ||
                      selectedEmployee.managerName ||
                      "—"}
                  </strong>
                </div>
              </div>

              <h3 className="employee-reports-section-title">
                Salary Information
              </h3>

              <div className="employee-reports-salary-panel">
                <span>Monthly Salary</span>
                <strong>
                  {formatCurrency(getSalary(selectedEmployee))}
                </strong>
                <small>
                  Annualized estimate:{" "}
                  {formatCurrency(getSalary(selectedEmployee) * 12)}
                </small>
              </div>

              {selectedEmployee.address && (
                <div className="employee-reports-address">
                  <span>Address</span>
                  <p>
                    {typeof selectedEmployee.address === "string"
                      ? selectedEmployee.address
                      : [
                          selectedEmployee.address.street,
                          selectedEmployee.address.city,
                          selectedEmployee.address.state,
                          selectedEmployee.address.postalCode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                  </p>
                </div>
              )}
            </div>

            <footer className="employee-reports-modal-footer">
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
              >
                Close Details
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default EmployeeReports;
