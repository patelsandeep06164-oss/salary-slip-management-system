
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaCalendarCheck,
  FaUmbrellaBeach,
  FaWallet,
  FaArrowRight,
  FaClock,
  FaCheckCircle,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaRegBell,
  FaUserCircle,
  FaShieldAlt,
} from "react-icons/fa";
import "./EmployeeDashboard.css";

function readStorage(key, fallback = []) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecordDate(record) {
  return String(
    record?.date || record?.attendanceDate || record?.createdAt || ""
  ).slice(0, 10);
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not available";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function EmployeeDashboard() {
  const employee = useMemo(() => {
    const current = readStorage("current_employee", null);

    if (current && typeof current === "object") {
      return current;
    }

    return null;
  }, []);

  const attendanceRecords = useMemo(
    () => readStorage("attendance_records", []),
    []
  );

  const leaveRecords = useMemo(
    () => readStorage("leave_requests", []),
    []
  );

  const payrollRecords = useMemo(
    () => readStorage("payroll_records", []),
    []
  );

  const employeeId = employee?.employeeId || employee?.id || "";
  const employeeEmail = String(employee?.email || "").toLowerCase();

  const employeeName =
    employee?.name ||
    employee?.fullName ||
    employee?.firstName ||
    "Employee";

  const myAttendance = attendanceRecords.filter((record) => {
    const sameId =
      employeeId &&
      String(
        record.employeeId || record.employeeCode || record.id || ""
      ) === String(employeeId);

    const sameEmail =
      employeeEmail &&
      String(record.email || "").toLowerCase() === employeeEmail;

    return Boolean(sameId || sameEmail);
  });

  const myLeaves = leaveRecords.filter((record) => {
    const sameId =
      employeeId &&
      String(record.employeeId || record.employeeCode || "") ===
        String(employeeId);

    const sameEmail =
      employeeEmail &&
      String(record.email || "").toLowerCase() === employeeEmail;

    return Boolean(sameId || sameEmail);
  });

  const myPayroll = payrollRecords.filter((record) => {
    const sameId =
      employeeId &&
      String(record.employeeId || record.employeeCode || "") ===
        String(employeeId);

    const sameEmail =
      employeeEmail &&
      String(record.email || "").toLowerCase() === employeeEmail;

    return Boolean(sameId || sameEmail);
  });

  const today = getDateKey();

  const todayAttendance = myAttendance.filter(
    (record) => getRecordDate(record) === today
  );

  const presentDays = myAttendance.filter((record) =>
    ["present", "late", "half day", "half-day"].includes(
      String(record.status || "").toLowerCase()
    )
  ).length;

  const pendingLeaves = myLeaves.filter((record) =>
    ["pending", "awaiting approval"].includes(
      String(record.status || "").toLowerCase()
    )
  ).length;

  const latestPayroll = [...myPayroll].sort((a, b) =>
    String(b.month || b.createdAt || "").localeCompare(
      String(a.month || a.createdAt || "")
    )
  )[0];

  const salaryValue =
    latestPayroll?.netSalary ??
    latestPayroll?.netPay ??
    latestPayroll?.salary ??
    latestPayroll?.amount;

  const latestAttendance = [...myAttendance]
    .sort((a, b) =>
      getRecordDate(b).localeCompare(getRecordDate(a))
    )
    .slice(0, 5);

  const todayStatus = todayAttendance[0]?.status || "Not marked";

  const statCards = [
    {
      label: "Attendance Records",
      value: myAttendance.length,
      note: "Available records",
      icon: <FaCalendarCheck />,
      tone: "blue",
    },
    {
      label: "Present Days",
      value: presentDays,
      note: "Based on saved records",
      icon: <FaCheckCircle />,
      tone: "green",
    },
    {
      label: "Pending Leaves",
      value: pendingLeaves,
      note: "Awaiting review",
      icon: <FaUmbrellaBeach />,
      tone: "orange",
    },
    {
      label: "Latest Net Salary",
      value: salaryValue != null ? formatCurrency(salaryValue) : "—",
      note: latestPayroll?.month || "No payroll record",
      icon: <FaWallet />,
      tone: "purple",
    },
  ];

  return (
    <main className="employee-dashboard">
      {/* Welcome Banner */}
      <section className="employee-dashboard-welcome">
        <div className="employee-dashboard-welcome-content">
          <span className="employee-dashboard-eyebrow">
            EMPLOYEE WORKSPACE
          </span>

          <h1>
            Welcome back, {employeeName.split(" ")[0]}!
          </h1>

          <p>
            Here is your personal overview of attendance, leave requests
            and payroll information.
          </p>

          <div className="employee-dashboard-welcome-actions">
            <Link
              to="/employee/profile"
              className="employee-dashboard-primary-link"
            >
              <FaUserCircle />
              View My Profile
            </Link>

            <Link
              to="/employee/leaves/apply"
              className="employee-dashboard-secondary-link"
            >
              Apply for Leave <FaArrowRight />
            </Link>
          </div>
        </div>

        <div className="employee-dashboard-welcome-art">
          <div className="employee-dashboard-art-circle">
            <FaUsers />
          </div>

          <span className="employee-dashboard-art-dot dot-one" />
          <span className="employee-dashboard-art-dot dot-two" />
          <span className="employee-dashboard-art-dot dot-three" />
        </div>
      </section>

      {/* Quick Summary */}
      <section className="employee-dashboard-quick-row">
        <div className="employee-dashboard-date">
          <span className="employee-dashboard-quick-icon">
            <FaCalendarAlt />
          </span>

          <div>
            <small>Today</small>
            <strong>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </strong>
          </div>
        </div>

        <div className="employee-dashboard-today-status">
          <span className="employee-dashboard-quick-icon status-icon">
            <FaClock />
          </span>

          <div>
            <small>Today's attendance</small>
            <strong>{todayStatus}</strong>
          </div>
        </div>

        <div className="employee-dashboard-quick-link">
          <FaRegBell />
          <span>
            <strong>{pendingLeaves}</strong> leave request
            {pendingLeaves === 1 ? "" : "s"} pending
          </span>
        </div>
      </section>

      {/* Statistics */}
      <section className="employee-dashboard-section">
        <div className="employee-dashboard-section-heading">
          <div>
            <h2>Your overview</h2>
            <p>Summary from records available on this device.</p>
          </div>

          <Link to="/employee/profile">
            My Profile <FaArrowRight />
          </Link>
        </div>

        <div className="employee-dashboard-stat-grid">
          {statCards.map((card) => (
            <article
              className="employee-dashboard-stat-card"
              key={card.label}
            >
              <div className={`employee-dashboard-stat-icon ${card.tone}`}>
                {card.icon}
              </div>

              <span className="employee-dashboard-stat-label">
                {card.label}
              </span>

              <strong className="employee-dashboard-stat-value">
                {card.value}
              </strong>

              <small>{card.note}</small>
            </article>
          ))}
        </div>
      </section>

      {/* Attendance and Quick Actions */}
      <section className="employee-dashboard-bottom-grid">
        <div className="employee-dashboard-panel">
          <div className="employee-dashboard-panel-heading">
            <div>
              <h2>Recent attendance</h2>
              <p>Your latest saved attendance entries.</p>
            </div>

            <Link to="/employee/attendance">
              View all <FaArrowRight />
            </Link>
          </div>

          {latestAttendance.length > 0 ? (
            <div className="employee-dashboard-attendance-list">
              {latestAttendance.map((record, index) => (
                <div
                  className="employee-dashboard-attendance-row"
                  key={record.id || `${getRecordDate(record)}-${index}`}
                >
                  <span className="employee-dashboard-attendance-icon">
                    <FaCalendarCheck />
                  </span>

                  <div className="employee-dashboard-attendance-info">
                    <strong>
                      {getRecordDate(record) || "Date unavailable"}
                    </strong>

                    <small>
                      {record.checkIn ||
                        record.inTime ||
                        "Check-in not recorded"}
                      {" — "}
                      {record.checkOut ||
                        record.outTime ||
                        "Check-out not recorded"}
                    </small>
                  </div>

                  <span
                    className={`employee-dashboard-status status-${String(
                      record.status || "unknown"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {record.status || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="employee-dashboard-empty">
              <span>
                <FaCalendarCheck />
              </span>

              <strong>No attendance records found</strong>

              <p>
                Attendance entries will appear here when they are available
                for your employee account.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="employee-dashboard-panel employee-dashboard-shortcuts">
          <div className="employee-dashboard-panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Frequently used employee pages.</p>
            </div>
          </div>

          <Link
            to="/employee/profile"
            className="employee-dashboard-shortcut"
          >
            <span className="shortcut-blue">
              <FaUserCircle />
            </span>

            <span>
              <strong>My Profile</strong>
              <small>View your personal details</small>
            </span>

            <FaArrowRight />
          </Link>

          <Link
            to="/employee/leaves/apply"
            className="employee-dashboard-shortcut"
          >
            <span className="shortcut-orange">
              <FaUmbrellaBeach />
            </span>

            <span>
              <strong>Apply for Leave</strong>
              <small>Submit a leave request</small>
            </span>

            <FaArrowRight />
          </Link>

          <Link
            to="/employee/salary-slips"
            className="employee-dashboard-shortcut"
          >
            <span className="shortcut-purple">
              <FaFileInvoiceDollar />
            </span>

            <span>
              <strong>Salary Slips</strong>
              <small>View available salary records</small>
            </span>

            <FaArrowRight />
          </Link>

          <Link
            to="/employee/change-password"
            className="employee-dashboard-shortcut"
          >
            <span className="shortcut-green">
              <FaShieldAlt />
            </span>

            <span>
              <strong>Account Security</strong>
              <small>Manage your password</small>
            </span>

            <FaArrowRight />
          </Link>
        </div>
      </section>

      {!employee && (
        <div className="employee-dashboard-data-note">
          <FaShieldAlt />
          <span>
            No current employee profile was found in local storage. Some
            personal information may remain unavailable until employee
            authentication and the backend are connected.
          </span>
        </div>
      )}
    </main>
  );
}

export default EmployeeDashboard;
