import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaMoneyBillWave,
  FaUsers,
  FaCalendarAlt,
  FaCalculator,
  FaSave,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowLeft,
  FaSyncAlt,
  FaUserTie,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./GeneratePayroll.css";

const getMonthValue = () => {
  const date = new Date();

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getEmployeeId = (employee) =>
  String(
    employee?._id ??
      employee?.id ??
      employee?.employeeId ??
      ""
  );

const getEmployeeName = (employee) => {
  const combinedName = [
    employee?.firstName,
    employee?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    employee?.name ||
    employee?.fullName ||
    employee?.employeeName ||
    combinedName ||
    "Unnamed Employee"
  );
};

const getEmployeeSalary = (employee) =>
  Number(
    employee?.basicSalary ??
      employee?.salary?.basic ??
      employee?.salary ??
      employee?.monthlySalary ??
      0
  );

const getEmployeeAllowances = (employee) =>
  Number(
    employee?.allowances ??
      employee?.salary?.allowances ??
      0
  );

const getEmployeeDeductions = (employee) =>
  Number(
    employee?.deductions ??
      employee?.salary?.deductions ??
      0
  );

const getPayrollPeriod = (value) => {
  const [yearPart, monthPart] = String(value || "").split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Please select a valid payroll month.");
  }

  return { month, year };
};

const getDepartmentName = (department) =>
  typeof department === "string"
    ? department
    : department?.name || department?.code || "";

const formatCurrency = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `₹${(Number(amount) || 0).toFixed(2)}`;
  }
};

const extractArray = (response, key) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.[key])) {
    return response[key];
  }

  if (Array.isArray(response?.data?.[key])) {
    return response.data[key];
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.records)) {
    return response.records;
  }

  return [];
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getAddressText = (address) => {
  if (!address) return "";

  if (typeof address === "string") {
    return address;
  }

  if (typeof address === "object") {
    return [
      address.street,
      address.city,
      address.state,
      address.postalCode,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

const getCompanyLogoUrl = (logoPath) => {
  if (!logoPath || typeof logoPath !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(logoPath)) {
    return logoPath;
  }

  const baseURL = api.defaults.baseURL || "";
  const origin = baseURL.replace(/\/api\/?$/i, "");

  if (!origin) return logoPath;

  return `${origin}/${logoPath.replace(/^\/+/, "")}`;
};

const getPayrollEmployeeId = (record) =>
  String(
    record?.employee?._id ??
      record?.employee ??
      record?.employeeId?._id ??
      record?.employeeId ??
      record?.employee?.id ??
      ""
  );

const normalizeCompanySettings = (settings = {}) => ({
  companyName: settings.companyName || "Your Company",
  address: getAddressText(settings.address),
  email: settings.email || "",
  phone: settings.phone || "",
  logoUrl: getCompanyLogoUrl(settings.logoPath),
  currency: settings.currency || "INR",
});

function GeneratePayroll() {
  const navigate = useNavigate();

  const [companySettings, setCompanySettings] = useState({
    companyName: "Your Company",
    address: "",
    email: "",
    phone: "",
    logoUrl: "",
    currency: "INR",
  });

  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(getMonthValue());

  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Load employees, payroll records and company settings
  // from authenticated backend APIs.
  const loadPageData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { month, year } = getPayrollPeriod(payrollMonth);

    const results = await Promise.allSettled([
      api.get("/employees", {
        params: { limit: 100 },
      }),

      api.get("/payroll", {
        params: { month, year },
      }),

      api.get("/settings"),
    ]);

    const errors = [];

    // Employees
    if (results[0].status === "fulfilled") {
      const responseData = results[0].value.data;

      setEmployees(extractArray(responseData, "employees"));
    } else {
      setEmployees([]);

      errors.push(
        `Employees: ${getErrorMessage(
          results[0].reason,
          "Unable to load employees."
        )}`
      );
    }

    // Payroll records
    if (results[1].status === "fulfilled") {
      const responseData = results[1].value.data;

      setPayrollRecords(extractArray(responseData, "payrolls"));
    } else {
      setPayrollRecords([]);

      errors.push(
        `Payroll: ${getErrorMessage(
          results[1].reason,
          "Unable to load payroll records."
        )}`
      );
    }

    // Company settings
    if (results[2].status === "fulfilled") {
      const responseData = results[2].value.data;

      const settings =
        responseData?.settings ||
        responseData?.data?.settings ||
        responseData?.data ||
        {};

      setCompanySettings(normalizeCompanySettings(settings));
    } else {
      setCompanySettings({
        companyName: "Your Company",
        address: "",
        email: "",
        phone: "",
        logoUrl: "",
        currency: "INR",
      });

      errors.push(
        `Company Settings: ${getErrorMessage(
          results[2].reason,
          "Unable to load company settings."
        )}`
      );
    }

    if (errors.length > 0) {
      setMessageType("error");
      setMessage(errors.join(" | "));
    }

    setLoading(false);
  }, [payrollMonth]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;
      await loadPageData();
    };

    load();

    return () => {
      mounted = false;
    };
  }, [loadPageData]);

  const employee = useMemo(
    () =>
      employees.find(
        (item) => getEmployeeId(item) === selectedEmployee
      ),
    [employees, selectedEmployee]
  );

  const basic = Number(basicSalary) || 0;
  const allowanceAmount = Number(allowances) || 0;
  const hraAmount = Number(employee?.salary?.hra) || 0;
  const bonusAmount = Number(bonus) || 0;
  const deductionAmount = Number(deductions) || 0;

  const grossSalary =
    basic + hraAmount + allowanceAmount + bonusAmount;

  const netSalary = Math.max(
    0,
    grossSalary - deductionAmount
  );

  const alreadyGenerated = useMemo(() => {
    if (!selectedEmployee) return false;

    let period;

    try {
      period = getPayrollPeriod(payrollMonth);
    } catch {
      return false;
    }

    return payrollRecords.some((record) => {
      const recordEmployeeId = getPayrollEmployeeId(record);

      return (
        recordEmployeeId === selectedEmployee &&
        Number(record.month ?? record.payrollMonth) ===
          period.month &&
        Number(record.year ?? record.payrollYear) ===
          period.year
      );
    });
  }, [payrollRecords, selectedEmployee, payrollMonth]);

  // Employee dropdown passes employeeId directly.
  const handleEmployeeChange = (employeeId) => {
    setSelectedEmployee(employeeId);
    setMessage("");

    const selected = employees.find(
      (item) => getEmployeeId(item) === employeeId
    );

    if (selected) {
      setBasicSalary(String(getEmployeeSalary(selected)));
      setAllowances(String(getEmployeeAllowances(selected)));
      setBonus(String(selected.bonus ?? 0));
      setDeductions(String(getEmployeeDeductions(selected)));
    } else {
      setBasicSalary("");
      setAllowances("0");
      setBonus("0");
      setDeductions("0");
    }
  };

  const handleMonthChange = (event) => {
    setPayrollMonth(event.target.value);
    setMessage("");
  };

  const handleGeneratePayroll = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setMessage("");

    if (!selectedEmployee || !employee) {
      setMessageType("error");
      setMessage("Please select an employee.");
      return;
    }

    let period;

    try {
      period = getPayrollPeriod(payrollMonth);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
      return;
    }

    if (
      !Number.isFinite(bonusAmount) ||
      !Number.isFinite(deductionAmount) ||
      bonusAmount < 0 ||
      deductionAmount < 0
    ) {
      setMessageType("error");
      setMessage(
        "Bonus and deductions must be valid non-negative amounts."
      );
      return;
    }

    if (
      !Number.isFinite(basic) ||
      !Number.isFinite(allowanceAmount) ||
      basic < 0 ||
      allowanceAmount < 0
    ) {
      setMessageType("error");
      setMessage("Employee salary details are invalid.");
      return;
    }

    if (deductionAmount > grossSalary) {
      setMessageType("error");
      setMessage("Deductions cannot exceed gross salary.");
      return;
    }

    if (alreadyGenerated) {
      setMessageType("error");
      setMessage(
        "Payroll already exists for this employee and month."
      );
      return;
    }

    const employeeId = getEmployeeId(employee);

    if (!employeeId) {
      setMessageType("error");
      setMessage("Invalid employee ID.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        employeeId,
        month: period.month,
        year: period.year,
        bonus: bonusAmount,
        deductions: deductionAmount,
        remarks: notes.trim(),
      };

      const response = await api.post(
        "/payroll/generate",
        payload
      );

      setMessageType("success");
      setMessage(
        response.data?.message ||
          "Payroll generated successfully."
      );

      setNotes("");

      await loadPageData();
    } catch (error) {
      setMessageType("error");
      setMessage(
        getErrorMessage(
          error,
          "An error occurred while generating payroll."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    await loadPageData();
  };

  const periodLabel = useMemo(() => {
    try {
      const { month, year } = getPayrollPeriod(payrollMonth);

      return new Date(year, month - 1, 1).toLocaleDateString(
        "en-IN",
        {
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  }, [payrollMonth]);

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (item) =>
          String(item.status || "active").toLowerCase() ===
          "active"
      ),
    [employees]
  );

  const selectedEmployeeDepartment = getDepartmentName(
    employee?.department
  );

  const existingPayrollCount = payrollRecords.length;

  const processedCount = payrollRecords.filter((record) =>
    ["processed", "paid"].includes(
      String(record.status || "").toLowerCase()
    )
  ).length;

  const draftCount = payrollRecords.filter(
    (record) =>
      String(record.status || "").toLowerCase() === "draft"
  ).length;

  const paidCount = payrollRecords.filter(
    (record) =>
      String(record.status || "").toLowerCase() === "paid"
  ).length;

  const currency = companySettings.currency || "INR";

  return (
    <div className="generate-payroll-page">
      <div className="generate-payroll-header">
        <div className="generate-payroll-title">
          <span className="payroll-eyebrow">
            PAYROLL MANAGEMENT
          </span>

          <h1>Generate Payroll</h1>

          <p>
            Calculate employee salaries and generate monthly payroll
            records.
          </p>
        </div>

        <div className="generate-payroll-header-actions">
          <button
            type="button"
            className="payroll-secondary-btn"
            onClick={() => navigate("/admin/payroll/history")}
          >
            <FaArrowLeft /> Payroll History
          </button>

          <button
            type="button"
            className="payroll-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh payroll data"
          >
            <FaSyncAlt
              className={loading ? "payroll-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Company Details */}
      <section
        className="generate-form-card"
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
        aria-label="Company details"
      >
        {companySettings.logoUrl ? (
          <img
            src={companySettings.logoUrl}
            alt={`${companySettings.companyName} logo`}
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
              borderRadius: 8,
            }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        <div style={{ minWidth: 220, flex: 1 }}>
          <h2 style={{ margin: "0 0 6px" }}>
            {companySettings.companyName}
          </h2>

          {companySettings.address && (
            <p style={{ margin: "3px 0" }}>
              {companySettings.address}
            </p>
          )}

          <p style={{ margin: "3px 0" }}>
            {[companySettings.email, companySettings.phone]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </section>

      {/* Summary */}
      <div className="generate-payroll-summary">
        <div className="generate-summary-card">
          <div className="generate-summary-icon blue">
            <FaUsers />
          </div>

          <div>
            <span>Total Employees</span>
            <h3>{loading ? "—" : activeEmployees.length}</h3>
          </div>
        </div>

        <div className="generate-summary-card">
          <div className="generate-summary-icon purple">
            <FaCalendarAlt />
          </div>

          <div>
            <span>Selected Month</span>
            <h3>{periodLabel || "Not selected"}</h3>
          </div>
        </div>

        <div className="generate-summary-card">
          <div className="generate-summary-icon green">
            <FaMoneyBillWave />
          </div>

          <div>
            <span>Payroll Records</span>
            <h3>{loading ? "—" : existingPayrollCount}</h3>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`payroll-notice ${
            messageType === "success" ? "success" : "error"
          }`}
          role="status"
        >
          {messageType === "success" ? (
            <FaCheckCircle />
          ) : (
            <FaExclamationCircle />
          )}

          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="payroll-loading">
          <span className="payroll-loader" />
          <p>Loading employees and payroll records...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="payroll-notice warning">
          <FaExclamationCircle />

          <div>
            <strong>No employees found</strong>

            <p>
              Add employees first, or check your employee API
              endpoint and backend response.
            </p>
          </div>
        </div>
      ) : (
        <form
          className="generate-payroll-form"
          onSubmit={handleGeneratePayroll}
        >
          <div className="generate-form-main">
            {/* Employee Information */}
            <section className="generate-form-card">
              <div className="generate-card-heading">
                <div className="generate-heading-icon">
                  <FaUserTie />
                </div>

                <div>
                  <h2>Employee Information</h2>
                  <p>Select an employee and payroll month.</p>
                </div>
              </div>

              <div className="generate-form-grid">
                <div className="generate-field full-width">
                  <label htmlFor="payrollEmployee">
                    Select Employee <span>*</span>
                  </label>

                  <select
                    id="payrollEmployee"
                    value={selectedEmployee}
                    onChange={(event) =>
                      handleEmployeeChange(event.target.value)
                    }
                    required
                  >
                    <option value="">Choose an employee</option>

                    {activeEmployees.map((item, index) => {
                      const id = getEmployeeId(item);

                      return (
                        <option
                          key={id || index}
                          value={id}
                          disabled={!id}
                        >
                          {getEmployeeName(item)}
                          {item.employeeCode || item.employeeId
                            ? ` (${
                                item.employeeCode ||
                                item.employeeId
                              })`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="generate-field">
                  <label htmlFor="payrollMonth">
                    Payroll Month <span>*</span>
                  </label>

                  <input
                    id="payrollMonth"
                    type="month"
                    value={payrollMonth}
                    onChange={handleMonthChange}
                    required
                  />
                </div>

                <div className="generate-field full-width">
                  <p role="note">
                    Attendance, half-days, absences, and approved
                    unpaid leave are calculated by the backend when
                    payroll is generated. Paid days are not entered
                    manually here.
                  </p>
                </div>

                <div className="generate-field">
                  <label htmlFor="payrollDepartment">
                    Department
                  </label>

                  <input
                    id="payrollDepartment"
                    type="text"
                    value={selectedEmployeeDepartment}
                    placeholder="Not assigned"
                    readOnly
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="payrollEmployeeId">
                    Employee ID
                  </label>

                  <input
                    id="payrollEmployeeId"
                    type="text"
                    value={
                      employee ? getEmployeeId(employee) : ""
                    }
                    placeholder="Select employee"
                    readOnly
                  />
                </div>

                <div className="generate-field full-width">
                  <label htmlFor="payrollEmail">
                    Email Address
                  </label>

                  <input
                    id="payrollEmail"
                    type="email"
                    value={employee?.email || ""}
                    placeholder="No email available"
                    readOnly
                  />
                </div>
              </div>
            </section>

            {/* Salary Breakdown */}
            <section className="generate-form-card">
              <div className="generate-card-heading">
                <div className="generate-heading-icon salary-icon">
                  <FaMoneyBillWave />
                </div>

                <div>
                  <h2>Salary Breakdown</h2>

                  <p>
                    Review the employee's monthly salary and enter
                    additional payroll adjustments.
                  </p>
                </div>
              </div>

              <div className="generate-form-grid">
                <div className="generate-field">
                  <label htmlFor="basicSalary">
                    Basic Salary (₹)
                  </label>

                  <input
                    id="basicSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    readOnly
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="hra">
                    House Rent Allowance (₹)
                  </label>

                  <input
                    id="hra"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hraAmount}
                    readOnly
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="allowances">
                    Other Allowances (₹)
                  </label>

                  <input
                    id="allowances"
                    type="number"
                    min="0"
                    step="0.01"
                    value={allowances}
                    readOnly
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="bonus">Bonus (₹)</label>

                  <input
                    id="bonus"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonus}
                    onChange={(event) =>
                      setBonus(event.target.value)
                    }
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="deductions">
                    Additional Deductions (₹)
                  </label>

                  <input
                    id="deductions"
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions}
                    onChange={(event) =>
                      setDeductions(event.target.value)
                    }
                  />
                </div>

                <div className="generate-field full-width">
                  <label htmlFor="notes">Remarks</label>

                  <textarea
                    id="notes"
                    rows={3}
                    maxLength={1000}
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Optional payroll remarks..."
                  />
                </div>
              </div>
            </section>

            {/* Salary Preview */}
            <section className="generate-form-card">
              <div className="generate-card-heading">
                <div className="generate-heading-icon">
                  <FaCalculator />
                </div>

                <div>
                  <h2>Salary Preview</h2>

                  <p>
                    Estimated figures before attendance-based
                    deductions are applied by the backend.
                  </p>
                </div>
              </div>

              <div className="generate-salary-preview">
                <div className="generate-salary-row">
                  <span>Basic Salary</span>
                  <strong>
                    {formatCurrency(basic, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row">
                  <span>House Rent Allowance</span>
                  <strong>
                    {formatCurrency(hraAmount, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row">
                  <span>Other Allowances</span>
                  <strong>
                    {formatCurrency(allowanceAmount, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row">
                  <span>Bonus</span>
                  <strong>
                    {formatCurrency(bonusAmount, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row">
                  <span>Gross Salary</span>
                  <strong>
                    {formatCurrency(grossSalary, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row deduction">
                  <span>Additional Deductions</span>

                  <strong>
                    −{formatCurrency(deductionAmount, currency)}
                  </strong>
                </div>

                <div className="generate-salary-row net">
                  <span>
                    Estimated Net Before Attendance Deductions
                  </span>

                  <strong>
                    {formatCurrency(netSalary, currency)}
                  </strong>
                </div>
              </div>

              <p className="generate-preview-note">
                Final net salary may be lower after the backend
                calculates absence, half-day, and approved
                unpaid-leave deductions. Confirm the generated
                payroll record before processing it.
              </p>
            </section>

            {/* Form Actions */}
            <div className="generate-payroll-actions">
              <button
                type="button"
                className="payroll-secondary-btn"
                onClick={() => navigate("/admin/payroll")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="generate-submit-btn"
                disabled={
                  submitting ||
                  loading ||
                  !selectedEmployee ||
                  alreadyGenerated
                }
              >
                {submitting ? (
                  <>
                    <FaSyncAlt className="payroll-spin" />
                    Generating Payroll...
                  </>
                ) : alreadyGenerated ? (
                  <>
                    <FaExclamationCircle />
                    Payroll Already Exists
                  </>
                ) : (
                  <>
                    <FaSave />
                    Generate Payroll
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="generate-payroll-sidebar">
            <section className="generate-form-card">
              <div className="generate-card-heading">
                <div className="generate-heading-icon">
                  <FaCalendarAlt />
                </div>

                <div>
                  <h2>Payroll Status</h2>
                  <p>{periodLabel}</p>
                </div>
              </div>

              <div className="generate-status-list">
                <div>
                  <span>Total Records</span>
                  <strong>{existingPayrollCount}</strong>
                </div>

                <div>
                  <span>Draft</span>
                  <strong>{draftCount}</strong>
                </div>

                <div>
                  <span>Processed / Paid</span>
                  <strong>{processedCount}</strong>
                </div>

                <div>
                  <span>Paid</span>
                  <strong>{paidCount}</strong>
                </div>
              </div>

              <button
                type="button"
                className="payroll-secondary-btn full-width"
                onClick={() =>
                  navigate("/admin/payroll/history")
                }
              >
                View Payroll History
              </button>
            </section>

            <section className="generate-form-card">
              <h2>Important Notes</h2>

              <ul className="generate-payroll-notes">
                <li>
                  Select the correct employee and payroll month.
                </li>

                <li>
                  Employee salary components come from the saved
                  employee record.
                </li>

                <li>
                  Attendance deductions are calculated by the
                  backend.
                </li>

                <li>
                  Generated payroll should be reviewed before it
                  is processed or marked as paid.
                </li>
              </ul>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
}

export default GeneratePayroll;