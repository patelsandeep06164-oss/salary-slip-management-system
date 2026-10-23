
import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSave,
  FaTimes,
  FaIdCard,
} from "react-icons/fa";

const initialFormData = {
  employeeId: "",
  name: "",
  email: "",
  phone: "",
  pan: "",
  department: "",
  designation: "",
  joiningDate: "",
  employmentType: "Full-time",
  basicSalary: "",
  allowances: "",
  deductions: "",
  address: "",
  status: "Active",
};

function EmployeeForm({
  employee = null,
  onSubmit,
  onCancel,
  loading = false,
  departments = [],
  submitLabel,
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!employee) {
      setFormData({ ...initialFormData });
      setErrors({});
      setSubmitError("");
      return;
    }

    setFormData({
      employeeId: employee.employeeId ?? employee.employeeCode ?? "",
      name:
        employee.name ??
        [employee.firstName, employee.lastName].filter(Boolean).join(" "),
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      pan: employee.pan ?? employee.panNumber ?? "",
      department:
        employee.department?._id ?? employee.department ?? "",
      designation: employee.designation ?? "",
      joiningDate: employee.joiningDate
        ? String(employee.joiningDate).slice(0, 10)
        : "",
      employmentType: employee.employmentType ?? "Full-time",
      basicSalary:
        employee.basicSalary ?? employee.salary?.basic ?? "",
      allowances:
        employee.allowances ?? employee.salary?.allowances ?? "",
      deductions:
        employee.deductions ?? employee.salary?.deductions ?? "",
      address: employee.address ?? "",
      status: employee.status ?? "Active",
    });

    setErrors({});
    setSubmitError("");
  }, [employee]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: name === "pan" ? value.toUpperCase() : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.employeeId.trim()) {
      nextErrors.employeeId = "Employee ID is required.";
    }

    if (!formData.name.trim()) {
      nextErrors.name = "Employee name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (
      formData.phone.trim() &&
      !/^[+\d\s()-]{7,20}$/.test(formData.phone.trim())
    ) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (
      formData.pan.trim() &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan.trim().toUpperCase())
    ) {
      nextErrors.pan = "Enter a valid PAN, e.g. ABCDE1234F.";
    }

    if (!formData.department) {
      nextErrors.department = "Please select a department.";
    }

    if (!formData.designation.trim()) {
      nextErrors.designation = "Designation is required.";
    }

    if (!formData.joiningDate) {
      nextErrors.joiningDate = "Joining date is required.";
    }

    ["basicSalary", "allowances", "deductions"].forEach((field) => {
      const value = formData[field];

      if (value === "" || value === null || value === undefined) {
        if (field === "basicSalary") {
          nextErrors.basicSalary = "Basic salary is required.";
        }
        return;
      }

      const amount = Number(value);

      if (!Number.isFinite(amount) || amount < 0) {
        nextErrors[field] = "Enter a valid non-negative amount.";
      }
    });

    if (
      formData.basicSalary !== "" &&
      Number(formData.basicSalary) <= 0
    ) {
      nextErrors.basicSalary = "Basic salary must be greater than zero.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (loading || !validate()) {
      return;
    }

    if (typeof onSubmit !== "function") {
      setSubmitError(
        "Save handler is not configured. Please connect this form to the employee page."
      );
      return;
    }

    const payload = {
      ...formData,
      employeeId: formData.employeeId.trim(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      pan: formData.pan.trim().toUpperCase(),
      designation: formData.designation.trim(),
      address: formData.address.trim(),
      basicSalary: Number(formData.basicSalary),
      allowances:
        formData.allowances === "" ? 0 : Number(formData.allowances),
      deductions:
        formData.deductions === "" ? 0 : Number(formData.deductions),
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      setSubmitError(
        error?.message || "Unable to save employee. Please try again."
      );
    }
  };

  const fields = [
    {
      name: "employeeId",
      label: "Employee ID",
      icon: FaIdCard,
      placeholder: "Enter employee ID",
      required: true,
    },
    {
      name: "name",
      label: "Full Name",
      icon: FaUser,
      placeholder: "Enter full name",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      icon: FaEnvelope,
      placeholder: "employee@company.com",
      type: "email",
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      icon: FaPhone,
      placeholder: "Enter phone number",
      type: "tel",
    },
    {
      name: "pan",
      label: "PAN Number",
      icon: FaIdCard,
      placeholder: "ABCDE1234F",
    },
    {
      name: "designation",
      label: "Designation",
      icon: FaBriefcase,
      placeholder: "Enter designation",
      required: true,
    },
    {
      name: "joiningDate",
      label: "Joining Date",
      icon: FaCalendarAlt,
      type: "date",
      required: true,
    },
  ];

  const inputClass = (field) =>
    `employee-form-input${errors[field] ? " employee-form-input-error" : ""}`;

  const renderTextField = (field) => {
    const Icon = field.icon;

    return (
      <div className="employee-form-field" key={field.name}>
        <label
          className="employee-form-label"
          htmlFor={`employee-${field.name}`}
        >
          {field.label}
          {field.required && (
            <span className="employee-form-required">*</span>
          )}
        </label>

        <div className="employee-form-control">
          <Icon className="employee-form-control-icon" />

          <input
            id={`employee-${field.name}`}
            className={inputClass(field.name)}
            type={field.type || "text"}
            name={field.name}
            value={formData[field.name]}
            onChange={handleChange}
            placeholder={field.placeholder}
            autoComplete={
              field.name === "name"
                ? "name"
                : field.name === "email"
                ? "email"
                : field.name === "phone"
                ? "tel"
                : "off"
            }
            maxLength={field.name === "pan" ? 10 : undefined}
            required={field.required}
            disabled={loading}
          />
        </div>

        {errors[field.name] && (
          <span className="employee-form-error">{errors[field.name]}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .employee-form,
        .employee-form * {
          box-sizing: border-box;
        }

        .employee-form {
          width: 100%;
          color: #17233e;
          font-family: Inter, Arial, sans-serif;
        }

        .employee-form-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 23px;
        }

        .employee-form-header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #d8faf5, #dbeafe);
          color: #087f8c;
          font-size: 18px;
        }

        .employee-form-header h2 {
          margin: 0;
          font-size: 19px;
          font-weight: 750;
        }

        .employee-form-header p {
          margin: 5px 0 0;
          color: #718198;
          font-size: 12px;
          line-height: 1.5;
        }

        .employee-form-section {
          margin-bottom: 23px;
          padding: 19px;
          border: 1px solid #e5edf5;
          border-radius: 14px;
          background: #fbfdff;
        }

        .employee-form-section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 0 0 18px;
          color: #087f8c;
          font-size: 14px;
          font-weight: 750;
        }

        .employee-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .employee-form-field {
          min-width: 0;
        }

        .employee-form-label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 650;
        }

        .employee-form-required {
          color: #dc2626;
          margin-left: 3px;
        }

        .employee-form-control {
          position: relative;
        }

        .employee-form-control-icon {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-50%);
          color: #8293a8;
          font-size: 13px;
          pointer-events: none;
        }

        .employee-form-input,
        .employee-form-select,
        .employee-form-textarea {
          width: 100%;
          min-width: 0;
          border: 1px solid #dce6ef;
          border-radius: 9px;
          outline: none;
          background: #fff;
          color: #17233e;
          font-family: inherit;
          font-size: 13px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .employee-form-input,
        .employee-form-select {
          min-height: 44px;
          padding: 10px 12px 10px 37px;
        }

        .employee-form-select {
          padding-left: 12px;
          cursor: pointer;
        }

        .employee-form-textarea {
          min-height: 95px;
          padding: 12px;
          resize: vertical;
        }

        .employee-form-input:focus,
        .employee-form-select:focus,
        .employee-form-textarea:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.11);
        }

        .employee-form-input-error {
          border-color: #dc2626;
        }

        .employee-form-error {
          display: block;
          margin-top: 6px;
          color: #dc2626;
          font-size: 11px;
          line-height: 1.5;
        }

        .employee-form-full {
          grid-column: 1 / -1;
        }

        .employee-form-notice {
          margin-bottom: 17px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 9px;
          background: #fef2f2;
          color: #b91c1c;
          font-size: 12px;
          line-height: 1.6;
        }

        .employee-form-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 3px;
        }

        .employee-form-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 43px;
          padding: 11px 18px;
          border: 1px solid transparent;
          border-radius: 9px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .employee-form-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .employee-form-button-primary {
          background: linear-gradient(135deg, #0d9488, #2563eb);
          color: #fff;
          box-shadow: 0 5px 12px rgba(13, 148, 136, 0.18);
        }

        .employee-form-button-secondary {
          border-color: #dce6ef;
          background: #fff;
          color: #475569;
        }

        .employee-form-button-primary:not(:disabled):hover,
        .employee-form-button-secondary:not(:disabled):hover {
          transform: translateY(-1px);
        }

        @media (max-width: 600px) {
          .employee-form-header h2 {
            font-size: 17px;
          }

          .employee-form-section {
            padding: 14px;
            margin-bottom: 16px;
          }

          .employee-form-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }

          .employee-form-full {
            grid-column: auto;
          }

          .employee-form-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .employee-form-button {
            padding: 10px;
          }
        }
      `}</style>

      <form className="employee-form" onSubmit={handleSubmit} noValidate>
        <div className="employee-form-header">
          <div className="employee-form-header-icon">
            <FaUser />
          </div>

          <div>
            <h2>{employee ? "Edit Employee" : "Add Employee"}</h2>
            <p>
              {employee
                ? "Update the employee information below."
                : "Enter the employee details to create a record."}
            </p>
          </div>
        </div>

        <section className="employee-form-section">
          <h3 className="employee-form-section-title">
            <FaUser />
            Personal Information
          </h3>

          <div className="employee-form-grid">
            {fields.slice(0, 5).map(renderTextField)}

            <div className="employee-form-field employee-form-full">
              <label
                className="employee-form-label"
                htmlFor="employee-address"
              >
                Address
              </label>

              <div className="employee-form-control">
                <FaMapMarkerAlt
                  className="employee-form-control-icon"
                  style={{ top: 17, transform: "none" }}
                />

                <textarea
                  id="employee-address"
                  className="employee-form-textarea"
                  style={{ paddingLeft: 37 }}
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter employee address"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="employee-form-section">
          <h3 className="employee-form-section-title">
            <FaBuilding />
            Employment Information
          </h3>

          <div className="employee-form-grid">
            <div className="employee-form-field">
              <label
                className="employee-form-label"
                htmlFor="employee-department"
              >
                Department
                <span className="employee-form-required">*</span>
              </label>

              <select
                id="employee-department"
                className="employee-form-select"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Select department</option>

                {departments.map((department) => {
                  const value =
                    typeof department === "string"
                      ? department
                      : department._id ?? department.name;

                  const label =
                    typeof department === "string"
                      ? department
                      : department.name ?? department.departmentName;

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>

              {errors.department && (
                <span className="employee-form-error">
                  {errors.department}
                </span>
              )}
            </div>

            {fields.slice(5).map(renderTextField)}

            <div className="employee-form-field">
              <label
                className="employee-form-label"
                htmlFor="employee-employmentType"
              >
                Employment Type
              </label>

              <select
                id="employee-employmentType"
                className="employee-form-select"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div className="employee-form-field">
              <label
                className="employee-form-label"
                htmlFor="employee-status"
              >
                Employment Status
              </label>

              <select
                id="employee-status"
                className="employee-form-select"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
        </section>

        <section className="employee-form-section">
          <h3 className="employee-form-section-title">
            <FaMoneyBillWave />
            Salary Information
          </h3>

          <div className="employee-form-grid">
            {[
              {
                name: "basicSalary",
                label: "Basic Salary (₹)",
                required: true,
              },
              {
                name: "allowances",
                label: "Allowances (₹)",
                required: false,
              },
              {
                name: "deductions",
                label: "Deductions (₹)",
                required: false,
              },
            ].map((field) => (
              <div className="employee-form-field" key={field.name}>
                <label
                  className="employee-form-label"
                  htmlFor={`employee-${field.name}`}
                >
                  {field.label}
                  {field.required && (
                    <span className="employee-form-required">*</span>
                  )}
                </label>

                <input
                  id={`employee-${field.name}`}
                  className={inputClass(field.name)}
                  type="number"
                  min="0"
                  step="0.01"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder="0.00"
                  required={field.required}
                  disabled={loading}
                />

                {errors[field.name] && (
                  <span className="employee-form-error">
                    {errors[field.name]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {submitError && (
          <div className="employee-form-notice" role="alert">
            {submitError}
          </div>
        )}

        <div className="employee-form-actions">
          <button
            type="button"
            className="employee-form-button employee-form-button-secondary"
            onClick={() => onCancel?.()}
            disabled={loading}
          >
            <FaTimes />
            Cancel
          </button>

          <button
            type="submit"
            className="employee-form-button employee-form-button-primary"
            disabled={loading}
          >
            <FaSave />
            {loading
              ? "Saving..."
              : submitLabel ||
                (employee ? "Update Employee" : "Save Employee")}
          </button>
        </div>
      </form>
    </>
  );
}

export default EmployeeForm;
