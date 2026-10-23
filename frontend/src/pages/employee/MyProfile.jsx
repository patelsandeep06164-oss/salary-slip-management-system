
import { useEffect, useState } from "react";
import {
  FaUserCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaIdBadge,
  FaEdit,
  FaSave,
  FaTimes,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import "./MyProfile.css";

const emptyProfile = {
  name: "",
  email: "",
  employeeId: "",
  department: "",
  designation: "",
  joiningDate: "",
  status: "",
  phone: "",
  address: "",
  emergencyContact: "",
  photo: "",
};

function formatDate(value) {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name) {
  return String(name || "Employee")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function MyProfile() {
  const [employee, setEmployee] = useState(emptyProfile);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        const response = await fetch("/api/employee/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "Your session may have expired. Please sign in again."
              : "Unable to load your profile. Please try again."
          );
        }

        const result = await response.json();
        const data = result.employee || result.data || result;

        if (!active) return;

        const profile = {
          ...emptyProfile,
          ...data,
          name:
            data.name ||
            data.fullName ||
            [data.firstName, data.lastName].filter(Boolean).join(" "),
          employeeId:
            data.employeeId || data.employeeCode || data.id || "",
          designation:
            data.designation || data.position || data.jobTitle || "",
          joiningDate: data.joiningDate || data.dateOfJoining || "",
          phone: data.phone || data.mobile || "",
          photo: data.photo || data.profileImage || "",
        };

        setEmployee(profile);
        setFormData({
          phone: profile.phone,
          address: profile.address || "",
          emergencyContact: profile.emergencyContact || "",
        });
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              "Unable to connect to the server. Please try again."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData({
      phone: employee.phone || "",
      address: employee.address || "",
      emergencyContact: employee.emergencyContact || "",
    });

    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const phonePattern = /^[+\d\s()-]{7,20}$/;

    if (
      formData.phone.trim() &&
      !phonePattern.test(formData.phone.trim())
    ) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (
      formData.emergencyContact.trim() &&
      !phonePattern.test(formData.emergencyContact.trim())
    ) {
      setError("Please enter a valid emergency contact number.");
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phone: formData.phone.trim(),
          mobile: formData.phone.trim(),
          address: formData.address.trim(),
          emergencyContact: formData.emergencyContact.trim(),
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));

        throw new Error(
          result.message || "Unable to save your profile changes."
        );
      }

      const result = await response.json().catch(() => ({}));
      const updatedData = result.employee || result.data || {};

      const updatedEmployee = {
        ...employee,
        ...updatedData,
        phone: formData.phone.trim(),
        mobile: formData.phone.trim(),
        address: formData.address.trim(),
        emergencyContact: formData.emergencyContact.trim(),
      };

      setEmployee(updatedEmployee);
      setFormData({
        phone: updatedEmployee.phone || "",
        address: updatedEmployee.address || "",
        emergencyContact: updatedEmployee.emergencyContact || "",
      });
      setIsEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Unable to save your changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const personalDetails = [
    {
      label: "Full Name",
      value: employee.name,
      icon: <FaUser />,
    },
    {
      label: "Email Address",
      value: employee.email,
      icon: <FaEnvelope />,
    },
    {
      label: "Employee ID",
      value: employee.employeeId,
      icon: <FaIdBadge />,
    },
    {
      label: "Phone Number",
      value: formData.phone,
      icon: <FaPhone />,
    },
    {
      label: "Department",
      value: employee.department,
      icon: <FaBuilding />,
    },
    {
      label: "Designation",
      value: employee.designation,
      icon: <FaBriefcase />,
    },
    {
      label: "Date of Joining",
      value: formatDate(employee.joiningDate),
      icon: <FaCalendarAlt />,
    },
    {
      label: "Employment Status",
      value: employee.status,
      icon: <FaCheckCircle />,
    },
  ];

  if (isLoading) {
    return (
      <main className="employee-profile-page">
        <div className="employee-profile-loading">
          <span className="employee-profile-spinner" />
          <p>Loading your profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="employee-profile-page">
      <header className="employee-profile-page-header">
        <div>
          <span className="employee-profile-eyebrow">
            EMPLOYEE ACCOUNT
          </span>
          <h1>My Profile</h1>
          <p>
            View your employee information and manage your contact details.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            className="employee-profile-edit-button"
            onClick={() => {
              setIsEditing(true);
              setError("");
              setSuccess("");
            }}
          >
            <FaEdit />
            Edit Profile
          </button>
        )}
      </header>

      {error && (
        <div className="employee-profile-alert error" role="alert">
          <FaShieldAlt />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="employee-profile-alert success" role="status">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      <section className="employee-profile-hero">
        <div className="employee-profile-avatar">
          {employee.photo ? (
            <img src={employee.photo} alt={employee.name || "Employee"} />
          ) : (
            <span>{getInitials(employee.name)}</span>
          )}
        </div>

        <div className="employee-profile-hero-info">
          <h2>{employee.name || "Employee Name"}</h2>
          <p>{employee.designation || "Designation not assigned"}</p>

          <div className="employee-profile-hero-meta">
            <span>
              <FaIdBadge />
              ID: {employee.employeeId || "Not assigned"}
            </span>

            <span>
              <FaBuilding />
              {employee.department || "Department not assigned"}
            </span>
          </div>
        </div>

        <div className="employee-profile-status">
          <span className="employee-profile-status-dot" />
          {employee.status || "Status unavailable"}
        </div>
      </section>

      <div className="employee-profile-content-grid">
        <section className="employee-profile-details-card">
          <div className="employee-profile-section-heading">
            <div>
              <h2>Personal & Employment Details</h2>
              <p>Your registered employee information.</p>
            </div>

            <span className="employee-profile-section-icon">
              <FaUserCircle />
            </span>
          </div>

          <div className="employee-profile-detail-grid">
            {personalDetails.map((detail) => (
              <div
                className="employee-profile-detail"
                key={detail.label}
              >
                <span className="employee-profile-detail-icon">
                  {detail.icon}
                </span>

                <div>
                  <small>{detail.label}</small>
                  <strong>{detail.value || "Not provided"}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="employee-profile-side-card">
          <div className="employee-profile-side-icon">
            <FaShieldAlt />
          </div>

          <h2>Account Security</h2>
          <p>
            Keep your contact information up to date and protect your
            employee account with a strong password.
          </p>

          <Link
            to="/employee/change-password"
            className="employee-profile-security-link"
          >
            <FaLock />
            Change Password
          </Link>

          <div className="employee-profile-security-note">
            <FaCheckCircle />
            <span>
              Your official employment information is managed by your
              HR administrator. Contact HR for corrections.
            </span>
          </div>
        </aside>
      </div>

      <section className="employee-profile-contact-card">
        <div className="employee-profile-section-heading">
          <div>
            <h2>Contact Information</h2>
            <p>
              {isEditing
                ? "Update your phone number, address and emergency contact."
                : "Your contact details and emergency contact."}
            </p>
          </div>

          <span className="employee-profile-section-icon">
            <FaPhone />
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="employee-profile-contact-grid">
            <div className="employee-profile-field">
              <label htmlFor="profile-phone">Phone Number</label>

              <div className="employee-profile-input-wrap">
                <FaPhone />
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  readOnly={!isEditing}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="employee-profile-field">
              <label htmlFor="profile-emergency">
                Emergency Contact
              </label>

              <div className="employee-profile-input-wrap">
                <FaPhone />
                <input
                  id="profile-emergency"
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Enter emergency contact"
                  readOnly={!isEditing}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="employee-profile-field employee-profile-address-field">
              <label htmlFor="profile-address">Address</label>

              <div className="employee-profile-input-wrap">
                <FaMapMarkerAlt />
                <textarea
                  id="profile-address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  readOnly={!isEditing}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="employee-profile-form-actions">
              <button
                type="button"
                className="employee-profile-cancel-button"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <FaTimes />
                Cancel
              </button>

              <button
                type="submit"
                className="employee-profile-save-button"
                disabled={isSaving}
              >
                <FaSave />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </section>

      <p className="employee-profile-footer-note">
        <FaShieldAlt />
        Your profile information is managed securely through your employee
        account.
      </p>
    </main>
  );
}

export default MyProfile;
