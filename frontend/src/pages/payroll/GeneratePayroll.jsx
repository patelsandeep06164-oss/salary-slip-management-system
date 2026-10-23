
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
import "./GeneratePayroll.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const EMPLOYEES_API = `${API_BASE_URL}/employees`;
const PAYROLL_API = `${API_BASE_URL}/payroll`;
const COMPANY_SETTINGS_KEY = "company_settings";

const readCompanySettings = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem(COMPANY_SETTINGS_KEY) || "{}"
    );

    return {
      companyName: saved.companyName || "Your Company",
      address: saved.address || "",
      email: saved.email || "",
      phone: saved.phone || "",
      gstin: saved.gstin || "",
      logoUrl: saved.logoUrl || "",
    };
  } catch {
    return {
      companyName: "Your Company",
      address: "",
      email: "",
      phone: "",
      gstin: "",
      logoUrl: "",
    };
  }
};

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

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const extractArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.employees)) return response.employees;
  if (Array.isArray(response?.payrolls)) return response.payrolls;
  if (Array.isArray(response?.payrollRecords)) {
    return response.payrollRecords;
  }
  if (Array.isArray(response?.records)) return response.records;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.employees)) {
    return response.data.employees;
  }
  if (Array.isArray(response?.data?.payrolls)) {
    return response.data.payrolls;
  }
  if (Array.isArray(response?.data?.records)) {
    return response.data.records;
  }
  return [];
};

const getErrorMessage = (data, fallback) =>
  data?.message || data?.error || fallback;

function GeneratePayroll() {
  const navigate = useNavigate();

  const [companySettings, setCompanySettings] = useState(
    readCompanySettings
  );

  const [employees, setEmployees] = useState([]);
  const [payrollRecords, setPayrollRecords] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [payrollMonth, setPayrollMonth] = useState(getMonthValue());

  const [workingDays, setWorkingDays] = useState("26");
  const [paidDays, setPaidDays] = useState("26");

  const [basicSalary, setBasicSalary] = useState("");
  const [allowances, setAllowances] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const refreshCompanySettings = () => {
      setCompanySettings(readCompanySettings());
    };

    window.addEventListener(
      "companySettingsUpdated",
      refreshCompanySettings
    );
    window.addEventListener("storage", refreshCompanySettings);

    return () => {
      window.removeEventListener(
        "companySettingsUpdated",
        refreshCompanySettings
      );
      window.removeEventListener(
        "storage",
        refreshCompanySettings
      );
    };
  }, []);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setMessage("");

    let employeeLoadError = "";
    let payrollLoadError = "";

    const headers = getHeaders();

    try {
      const response = await fetch(EMPLOYEES_API, {
        method: "GET",
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load employees.")
        );
      }

      setEmployees(extractArray(data));
    } catch (error) {
      setEmployees([]);
      employeeLoadError =
        error.message || "Unable to connect to employee API.";
    }

    try {
      const { month, year } = getPayrollPeriod(payrollMonth);

      const response = await fetch(
        `${PAYROLL_API}?month=${month}&year=${year}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load payroll records.")
        );
      }

      setPayrollRecords(extractArray(data));
    } catch (error) {
      setPayrollRecords([]);
      payrollLoadError =
        error.message || "Unable to load payroll records.";
    }

    if (employeeLoadError || payrollLoadError) {
      setMessageType("error");
      setMessage(
        [employeeLoadError, payrollLoadError]
          .filter(Boolean)
          .join(" Payroll: ")
      );
    }

    setLoading(false);
  }, [getHeaders, payrollMonth]);

  useEffect(() => {
    loadPageData();
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

  const totalWorkingDays = Number(workingDays) || 0;
  const totalPaidDays = Number(paidDays) || 0;

  const attendanceFactor =
    totalWorkingDays > 0
      ? Math.min(totalPaidDays, totalWorkingDays) /
        totalWorkingDays
      : 0;

  const proratedBasic = basic * attendanceFactor;
  const proratedAllowances =
    allowanceAmount * attendanceFactor;
  const proratedHra = hraAmount * attendanceFactor;

  const grossSalary =
    proratedBasic +
    proratedHra +
    proratedAllowances +
    bonusAmount;

  const netSalary = grossSalary - deductionAmount;

  const alreadyGenerated = payrollRecords.some((record) => {
    const recordEmployeeId = String(
      record.employeeId?._id ??
        record.employeeId ??
        record.employee?._id ??
        record.employee?.id ??
        record.employee?.employeeId ??
        ""
    );

    let period;

    try {
      period = getPayrollPeriod(payrollMonth);
    } catch {
      return false;
    }

    return (
      recordEmployeeId === selectedEmployee &&
      Number(record.month ?? record.payrollMonth) === period.month &&
      Number(record.year ?? record.payrollYear) === period.year
    );
  });

  const handleEmployeeChange = (value) => {
    setSelectedEmployee(value);
    setMessage("");

    const selected = employees.find(
      (item) => getEmployeeId(item) === value
    );

    if (selected) {
      setBasicSalary(String(getEmployeeSalary(selected)));
      setAllowances(String(getEmployeeAllowances(selected)));
      setBonus(String(selected.bonus ?? 0));
      setDeductions(String(getEmployeeDeductions(selected)));
      setPaidDays(workingDays || "26");
    } else {
      setBasicSalary("");
      setAllowances("0");
      setBonus("0");
      setDeductions("0");
      setPaidDays(workingDays || "26");
    }
  };

  const handleWorkingDaysChange = (value) => {
    setWorkingDays(value);

    if (Number(paidDays) > Number(value)) {
      setPaidDays(value);
    }
  };

  const handleGeneratePayroll = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!employee) {
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
      !Number.isFinite(totalWorkingDays) ||
      !Number.isInteger(totalWorkingDays) ||
      totalWorkingDays < 1 ||
      totalWorkingDays > 31 ||
      !Number.isFinite(totalPaidDays) ||
      totalPaidDays < 0 ||
      totalPaidDays > totalWorkingDays
    ) {
      setMessageType("error");
      setMessage(
        "Paid days must be between 0 and total working days."
      );
      return;
    }

    const salaryValues = [
      basic,
      hraAmount,
      allowanceAmount,
      bonusAmount,
      deductionAmount,
    ];

    if (
      salaryValues.some(
        (value) => !Number.isFinite(value) || value < 0
      ) ||
      deductionAmount > grossSalary
    ) {
      setMessageType("error");
      setMessage(
        "Salary amounts must be valid and non-negative. Deductions cannot exceed gross salary."
      );
      return;
    }

    if (alreadyGenerated) {
      setMessageType("error");
      setMessage(
        "Payroll already exists for this employee and month."
      );
      return;
    }

    const payload = {
      employeeId: getEmployeeId(employee),
      month: period.month,
      year: period.year,
      workingDays: totalWorkingDays,
      paidDays: totalPaidDays,
      basicSalary: basic,
      hra: hraAmount,
      allowances: allowanceAmount,
      bonus: bonusAmount,
      deductions: deductionAmount,
      notes: notes.trim(),
    };

    setSubmitting(true);

    try {
      const response = await fetch(`${PAYROLL_API}/generate`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            responseData,
            "Failed to generate payroll."
          )
        );
      }

      setMessageType("success");
      setMessage(
        responseData.message || "Payroll generated successfully!"
      );

      try {
        const refreshResponse = await fetch(
          `${PAYROLL_API}?month=${period.month}&year=${period.year}`,
          {
            method: "GET",
            headers: getHeaders(),
          }
        );

        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse
            .json()
            .catch(() => ({}));

          setPayrollRecords(extractArray(refreshedData));
        }
      } catch {
        // Payroll is already saved; retain the success message.
      }

      setNotes("");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error.message ||
          "Unable to generate payroll. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

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
            onClick={loadPageData}
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

          {companySettings.gstin && (
            <small>GSTIN: {companySettings.gstin}</small>
          )}
        </div>
      </section>

      <div className="generate-payroll-summary">
        <div className="generate-summary-card">
          <div className="generate-summary-icon blue">
            <FaUsers />
          </div>
          <div>
            <span>Total Employees</span>
            <h3>{loading ? "—" : employees.length}</h3>
          </div>
        </div>

        <div className="generate-summary-card">
          <div className="generate-summary-icon purple">
            <FaCalendarAlt />
          </div>
          <div>
            <span>Selected Month</span>
            <h3>{payrollMonth || "Not selected"}</h3>
          </div>
        </div>

        <div className="generate-summary-card">
          <div className="generate-summary-icon green">
            <FaMoneyBillWave />
          </div>
          <div>
            <span>Payroll Records</span>
            <h3>{loading ? "—" : payrollRecords.length}</h3>
          </div>
        </div>
      </div>

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

                    {employees.map((item, index) => {
                      const id = getEmployeeId(item);

                      return (
                        <option
                          key={id || index}
                          value={id}
                          disabled={!id}
                        >
                          {getEmployeeName(item)}
                          {(item.employeeCode || item.employeeId)
                            ? ` (${item.employeeCode || item.employeeId})`
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
                    onChange={(event) =>
                      setPayrollMonth(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="workingDays">
                    Working Days <span>*</span>
                  </label>
                  <input
                    id="workingDays"
                    type="number"
                    min="1"
                    max="31"
                    value={workingDays}
                    onChange={(event) =>
                      handleWorkingDaysChange(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="paidDays">
                    Paid Days <span>*</span>
                  </label>
                  <input
                    id="paidDays"
                    type="number"
                    min="0"
                    max={workingDays || 31}
                    value={paidDays}
                    onChange={(event) =>
                      setPaidDays(event.target.value)
                    }
                    required
                  />
                  <small>
                    Salary is prorated according to paid days.
                  </small>
                </div>

                <div className="generate-field">
                  <label htmlFor="payrollDepartment">
                    Department
                  </label>
                  <input
                    id="payrollDepartment"
                    type="text"
                    value={getDepartmentName(employee?.department)}
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
                    value={employee ? getEmployeeId(employee) : ""}
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

            <section className="generate-form-card">
              <div className="generate-card-heading">
                <div className="generate-heading-icon salary-icon">
                  <FaMoneyBillWave />
                </div>
                <div>
                  <h2>Salary Breakdown</h2>
                  <p>
                    Enter monthly salary components in Indian rupees.
                  </p>
                </div>
              </div>

              <div className="generate-form-grid">
                <div className="generate-field">
                  <label htmlFor="basicSalary">
                    Basic Salary (₹) <span>*</span>
                  </label>
                  <input
                    id="basicSalary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basicSalary}
                    onChange={(event) =>
                      setBasicSalary(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="allowances">
                    Allowances (₹)
                  </label>
                  <input
                    id="allowances"
                    type="number"
                    min="0"
                    step="0.01"
                    value={allowances}
                    onChange={(event) =>
                      setAllowances(event.target.value)
                    }
                  />
                </div>

                <div className="generate-field">
                  <label htmlFor="bonus">
                    Bonus / Incentives (₹)
                  </label>
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
                    Deductions (₹)
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
                  <label htmlFor="payrollNotes">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="payrollNotes"
                    rows="3"
                    maxLength="1000"
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Add payroll remarks..."
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="generate-payroll-preview">
            <div className="generate-preview-top">
              <div className="generate-preview-icon">
                <FaCalculator />
              </div>
              <h2>Salary Summary</h2>
              <p>
                Estimated salary for the selected employee.
              </p>
            </div>

            <div className="generate-preview-employee">
              <span>Employee</span>
              <strong>
                {employee
                  ? getEmployeeName(employee)
                  : "Not selected"}
              </strong>
              <small>
                {employee
                  ? getEmployeeId(employee)
                  : "Select an employee"}
              </small>
            </div>

            <div className="generate-preview-lines">
              <div>
                <span>Basic salary after attendance</span>
                <strong>{formatCurrency(proratedBasic)}</strong>
              </div>

              <div>
                <span>HRA after attendance</span>
                <strong>{formatCurrency(proratedHra)}</strong>
              </div>

              <div>
                <span>Allowances after attendance</span>
                <strong>
                  {formatCurrency(proratedAllowances)}
                </strong>
              </div>

              <div>
                <span>Bonus / Incentives</span>
                <strong>{formatCurrency(bonusAmount)}</strong>
              </div>

              <div className="gross-line">
                <span>Gross salary</span>
                <strong>{formatCurrency(grossSalary)}</strong>
              </div>

              <div className="deduction-line">
                <span>Deductions</span>
                <strong>
                  − {formatCurrency(deductionAmount)}
                </strong>
              </div>
            </div>

            <div className="generate-preview-total">
              <span>Net Payable Salary</span>
              <strong>{formatCurrency(netSalary)}</strong>
            </div>

            <p className="generate-preview-note">
              Preview only. Verify salary and attendance details
              before generating payroll.
            </p>

            {alreadyGenerated && (
              <div className="payroll-inline-warning">
                <FaExclamationCircle />
                Payroll already exists for this employee and month.
              </div>
            )}

            <button
              type="submit"
              className="generate-payroll-submit"
              disabled={
                submitting ||
                loading ||
                !employee ||
                alreadyGenerated ||
                netSalary < 0
              }
            >
              <FaSave />
              {submitting
                ? "Generating..."
                : "Generate Payroll"}
            </button>

            <button
              type="button"
              className="generate-payroll-cancel"
              onClick={() =>
                navigate("/admin/payroll/history")
              }
              disabled={submitting}
            >
              Cancel
            </button>
          </aside>
        </form>
      )}
    </div>
  );
}

export default GeneratePayroll;
