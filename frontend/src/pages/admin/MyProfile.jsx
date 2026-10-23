import React, { useEffect, useRef, useState } from "react";
import {
  FaUser,
  FaBriefcase,
  FaShieldAlt,
  FaHistory,
  FaCamera,
  FaSave,
  FaEdit,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaLock,
  FaUserCircle,
  FaTimes,
  FaBuilding,
  FaIdBadge,
} from "react-icons/fa";
import api, { getApiError } from "../../services/api";
import authService from "../../services/authService";

const tabs = [
  { id: "overview", label: "Overview", icon: FaUser },
  { id: "personal", label: "Personal Information", icon: FaUserCircle },
  { id: "work", label: "Work Details", icon: FaBriefcase },
  { id: "security", label: "Security", icon: FaShieldAlt },
  { id: "activity", label: "Account Activity", icon: FaHistory },
];

const initialProfile = {
  name: "",
  email: "",
  role: "admin",
  phone: "",
  address: "",
  profilePhoto: "",
  isActive: true,
  lastLogin: null,
  createdAt: null,
  updatedAt: null,
};

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "AD";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxDimension = 600;
      const scale = Math.min(
        1,
        maxDimension / Math.max(image.width, image.height)
      );

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Could not process this image."));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            reject(new Error("Could not process this image."));
            return;
          }

          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = () =>
            reject(new Error("Could not read this image."));
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        0.72
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Please select a valid image."));
    };

    image.src = objectUrl;
  });

function MyProfile() {
  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(initialProfile);
  const [form, setForm] = useState({
    name: "",
    email:"",
    phone: "",
    address: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/auth/me");
        const data = response.data || {};
        const user = data.user || data.data?.user;

        if (!user) {
          throw new Error("Profile information was not returned by the server.");
        }

        if (!mounted) return;

        const nextProfile = { ...initialProfile, ...user };

        setProfile(nextProfile);
        setForm({
          name: nextProfile.name || "",
          phone: nextProfile.phone || "",
          address: nextProfile.address || "",
        });
      } catch (err) {
        if (mounted) {
          setError(
            getApiError(err, "Unable to load your profile. Please try again.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    clearMessages();

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please select an image smaller than 5 MB.");
      return;
    }

    try {
      const compressedPhoto = await compressImage(file);

      setProfile((previous) => ({
        ...previous,
        profilePhoto: compressedPhoto,
      }));

      setSuccess("Photo selected. Click Save Changes to update your profile.");
    } catch (err) {
      setError(err.message || "Unable to process this photo.");
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (form.name.trim().length > 100) {
      setError("Name cannot exceed 100 characters.");
      return;
    }

    if (form.phone.trim() && !/^[+\d\s()-]{7,20}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        profilePhoto: profile.profilePhoto || "",
      });

      const data = response.data || {};
      const updatedUser = data.user || data.data?.user;

      if (!updatedUser) {
        throw new Error(
          "The server did not return the updated profile. Please check your backend response."
        );
      }

      const nextProfile = { ...initialProfile, ...updatedUser };

      setProfile(nextProfile);
      setForm({
        name: nextProfile.name || "",
        phone: nextProfile.phone || "",
        address: nextProfile.address || "",
      });

      // Keep the saved user information available to the app.
      const storedUser = authService.getStoredUser() || {};
      localStorage.setItem(
        "user",
        JSON.stringify({ ...storedUser, ...updatedUser })
      );

      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: updatedUser })
      );

      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        getApiError(err, "Unable to save your profile. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    clearMessages();

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from your current password.");
      return;
    }

    setPasswordSaving(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSuccess("Your password has been changed successfully.");
    } catch (err) {
      setError(
        getApiError(err, "Unable to change your password. Please try again.")
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const startEditing = () => {
    clearMessages();

    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });

    setEditing(true);
  };

  const cancelEditing = () => {
    setForm({
      name: profile.name || "",
      phone: profile.phone || "",
      address: profile.address || "",
    });

    setEditing(false);
    clearMessages();
  };

  const Avatar = ({ size = "large" }) => (
    <div className={`mp-avatar mp-avatar-${size}`}>
      {profile.profilePhoto ? (
        <img src={profile.profilePhoto} alt="Profile" />
      ) : (
        <span>{getInitials(profile.name)}</span>
      )}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="mp-overview-hero">
        <div className="mp-overview-identity">
          <div className="mp-avatar-wrap">
            <Avatar />
            <button
              type="button"
              className="mp-camera-button"
              title="Change profile photo"
              aria-label="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaCamera />
            </button>
          </div>

          <div className="mp-identity-copy">
            <span className="mp-eyebrow">ADMINISTRATOR PROFILE</span>
            <h2>{profile.name || "Admin User"}</h2>
            <p>{profile.email || "Email not available"}</p>
            <div className="mp-identity-badges">
              <span className="mp-role-badge">
                <FaShieldAlt /> {profile.role || "admin"}
              </span>
              <span
                className={`mp-status-badge ${
                  profile.isActive ? "is-active" : "is-inactive"
                }`}
              >
                <span />
                {profile.isActive ? "Active account" : "Inactive account"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="mp-primary-button"
          onClick={startEditing}
        >
          <FaEdit /> Edit Profile
        </button>
      </div>

      <div className="mp-stats-grid">
        <div className="mp-stat-card">
          <div className="mp-stat-icon mp-icon-aqua">
            <FaCalendarAlt />
          </div>
          <div>
            <span>Member Since</span>
            <strong>{formatDate(profile.createdAt)}</strong>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon mp-icon-blue">
            <FaClock />
          </div>
          <div>
            <span>Last Login</span>
            <strong>{formatDate(profile.lastLogin)}</strong>
          </div>
        </div>

        <div className="mp-stat-card">
          <div className="mp-stat-icon mp-icon-purple">
            <FaShieldAlt />
          </div>
          <div>
            <span>Account Role</span>
            <strong className="mp-capitalize">{profile.role || "Admin"}</strong>
          </div>
        </div>
      </div>

      <div className="mp-content-card">
        <div className="mp-card-heading">
          <div>
            <h3>Personal Information</h3>
            <p>Your basic contact information</p>
          </div>
          <button
            type="button"
            className="mp-text-button"
            onClick={startEditing}
          >
            Edit details <FaEdit />
          </button>
        </div>

        <div className="mp-info-grid">
          <InfoItem
            icon={<FaUser />}
            label="Full Name"
            value={profile.name}
          />
          <InfoItem
            icon={<FaEnvelope />}
            label="Email Address"
            value={profile.email}
          />
          <InfoItem
            icon={<FaPhone />}
            label="Phone Number"
            value={profile.phone}
          />
          <InfoItem
            icon={<FaMapMarkerAlt />}
            label="Address"
            value={profile.address}
          />
        </div>
      </div>

      <div className="mp-content-card mp-security-card">
        <div className="mp-security-symbol">
          <FaLock />
        </div>
        <div className="mp-security-copy">
          <h3>Keep your account secure</h3>
          <p>
            Review your account details and update your password regularly.
          </p>
        </div>
        <button
          type="button"
          className="mp-secondary-button"
          onClick={() => {
            setActiveTab("security");
            clearMessages();
          }}
        >
          Security Settings
        </button>
      </div>
    </>
  );

  const renderPersonal = () => (
    <div className="mp-content-card">
      <div className="mp-card-heading">
        <div>
          <h3>Personal Information</h3>
          <p>Keep your name and contact details up to date.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="mp-secondary-button"
            onClick={startEditing}
          >
            <FaEdit /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <form className="mp-form" onSubmit={handleSaveProfile}>
          <div className="mp-photo-editor">
            <Avatar size="medium" />
            <div>
              <strong>Profile photo</strong>
              <p>JPG, PNG or another supported image. Maximum 5 MB before compression.</p>
              <button
                type="button"
                className="mp-text-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FaCamera /> Choose photo
              </button>
            </div>
          </div>

          <div className="mp-form-grid">
            <div className="mp-field mp-field-full">
              <label htmlFor="mp-name">Full Name *</label>
              <input
                id="mp-name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleFormChange}
                maxLength={100}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="mp-field">
              <label htmlFor="mp-email">Email Address</label>
              <input
                id="mp-email"
                type="email"
                value={profile.email}
                readOnly
              />
              <small>Email cannot be changed from this screen.</small>
            </div>

            <div className="mp-field">
              <label htmlFor="mp-phone">Phone Number</label>
              <input
                id="mp-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleFormChange}
                maxLength={20}
                placeholder="Enter phone number"
              />
            </div>

            <div className="mp-field mp-field-full">
              <label htmlFor="mp-address">Address</label>
              <textarea
                id="mp-address"
                name="address"
                value={form.address}
                onChange={handleFormChange}
                rows={3}
                maxLength={300}
                placeholder="Enter your address"
              />
            </div>
          </div>

          <div className="mp-form-actions">
            <button
              type="button"
              className="mp-secondary-button"
              onClick={cancelEditing}
              disabled={saving}
            >
              <FaTimes /> Cancel
            </button>
            <button
              type="submit"
              className="mp-primary-button"
              disabled={saving}
            >
              <FaSave /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mp-info-grid">
          <InfoItem icon={<FaUser />} label="Full Name" value={profile.name} />
          <InfoItem
            icon={<FaEnvelope />}
            label="Email Address"
            value={profile.email}
          />
          <InfoItem
            icon={<FaPhone />}
            label="Phone Number"
            value={profile.phone}
          />
          <InfoItem
            icon={<FaMapMarkerAlt />}
            label="Address"
            value={profile.address}
          />
        </div>
      )}
    </div>
  );

  const renderWork = () => (
    <div className="mp-content-card">
      <div className="mp-card-heading">
        <div>
          <h3>Work Details</h3>
          <p>Your account and administrator information.</p>
        </div>
        <span className="mp-readonly-badge">Read only</span>
      </div>

      <div className="mp-info-grid">
        <InfoItem
          icon={<FaIdBadge />}
          label="Account Role"
          value={profile.role || "Admin"}
        />
        <InfoItem
          icon={<FaBuilding />}
          label="Department"
          value="Administration"
        />
        <InfoItem
          icon={<FaCalendarAlt />}
          label="Account Created"
          value={formatDate(profile.createdAt)}
        />
        <InfoItem
          icon={<FaCheckCircle />}
          label="Account Status"
          value={profile.isActive ? "Active" : "Inactive"}
        />
      </div>

      <div className="mp-note">
        <FaShieldAlt />
        <p>
          Work details shown here are based on your account. Organization and
          employment information can be managed from the appropriate admin
          sections.
        </p>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <>
      <div className="mp-content-card">
        <div className="mp-card-heading">
          <div>
            <h3>Change Password</h3>
            <p>Choose a strong password to protect your account.</p>
          </div>
          <div className="mp-security-icon">
            <FaLock />
          </div>
        </div>

        <form className="mp-form" onSubmit={handleChangePassword}>
          <div className="mp-field">
            <label htmlFor="mp-current-password">Current Password *</label>
            <input
              id="mp-current-password"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="mp-form-grid">
            <div className="mp-field">
              <label htmlFor="mp-new-password">New Password *</label>
              <input
                id="mp-new-password"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            <div className="mp-field">
              <label htmlFor="mp-confirm-password">
                Confirm New Password *
              </label>
              <input
                id="mp-confirm-password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Re-enter new password"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="mp-password-hint">
            <FaShieldAlt />
            Use at least 8 characters. A mix of letters, numbers and symbols is
            recommended.
          </div>

          <div className="mp-form-actions">
            <button
              type="submit"
              className="mp-primary-button"
              disabled={passwordSaving}
            >
              <FaLock />{" "}
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      <div className="mp-content-card mp-security-card">
        <div className="mp-security-symbol">
          <FaCheckCircle />
        </div>
        <div className="mp-security-copy">
          <h3>Account status</h3>
          <p>
            Your account is currently{" "}
            <strong>{profile.isActive ? "active" : "inactive"}</strong>.
          </p>
        </div>
        <span
          className={`mp-status-badge ${
            profile.isActive ? "is-active" : "is-inactive"
          }`}
        >
          <span />
          {profile.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </>
  );

  const renderActivity = () => (
    <div className="mp-content-card">
      <div className="mp-card-heading">
        <div>
          <h3>Account Activity</h3>
          <p>Important dates associated with your account.</p>
        </div>
        <div className="mp-security-icon">
          <FaHistory />
        </div>
      </div>

      <div className="mp-activity-list">
        <div className="mp-activity-item">
          <div className="mp-activity-icon">
            <FaCheckCircle />
          </div>
          <div className="mp-activity-description">
            <strong>Account created</strong>
            <p>Your account was registered in the system.</p>
          </div>
          <time>{formatDateTime(profile.createdAt)}</time>
        </div>

        <div className="mp-activity-item">
          <div className="mp-activity-icon">
            <FaClock />
          </div>
          <div className="mp-activity-description">
            <strong>Last login</strong>
            <p>The last login time recorded for your account.</p>
          </div>
          <time>{formatDateTime(profile.lastLogin)}</time>
        </div>

        <div className="mp-activity-item">
          <div className="mp-activity-icon">
            <FaUserCircle />
          </div>
          <div className="mp-activity-description">
            <strong>Profile last updated</strong>
            <p>The last time your account record was modified.</p>
          </div>
          <time>{formatDateTime(profile.updatedAt)}</time>
        </div>
      </div>

      <div className="mp-note">
        <FaShieldAlt />
        <p>
          This section displays the account timestamps currently returned by
          your backend. It is not a complete security audit log.
        </p>
      </div>
    </div>
  );

  const pageContent = {
    overview: renderOverview,
    personal: renderPersonal,
    work: renderWork,
    security: renderSecurity,
    activity: renderActivity,
  };

  return (
    <div className="admin-my-profile">
      <style>{`
        .admin-my-profile,
        .admin-my-profile * {
          box-sizing: border-box;
        }

        .admin-my-profile {
          --mp-primary: #087f8c;
          --mp-primary-dark: #076575;
          --mp-aqua: #12b8b0;
          --mp-text: #183344;
          --mp-muted: #718397;
          --mp-border: #e3edf1;
          --mp-surface: #ffffff;
          --mp-page: #f3f8fa;
          width: 100%;
          min-width: 0;
          padding: 24px;
          color: var(--mp-text);
          font-family: inherit;
          background: var(--mp-page);
          border-radius: 20px;
        }

        .admin-my-profile button,
        .admin-my-profile input,
        .admin-my-profile textarea {
          font: inherit;
        }

        .admin-my-profile button {
          cursor: pointer;
        }

        .admin-my-profile button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .mp-page-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 24px;
        }

        .mp-page-heading h1 {
          margin: 0;
          color: #143548;
          font-size: clamp(24px, 2.2vw, 31px);
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.7px;
        }

        .mp-page-heading p {
          margin: 8px 0 0;
          color: var(--mp-muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .mp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 9px;
          color: #8a9bab;
          font-size: 12px;
        }

        .mp-breadcrumb span:last-child {
          color: var(--mp-primary);
          font-weight: 700;
        }

        .mp-page-layout {
          display: grid;
          grid-template-columns: 245px minmax(0, 1fr);
          align-items: start;
          gap: 22px;
        }

        .mp-sidebar,
        .mp-main-panel {
          min-width: 0;
          background: var(--mp-surface);
          border: 1px solid var(--mp-border);
          border-radius: 18px;
          box-shadow: 0 7px 24px rgba(26, 67, 83, 0.045);
        }

        .mp-sidebar {
          padding: 16px 12px;
          position: sticky;
          top: 100px;
        }

        .mp-sidebar-title {
          padding: 8px 12px 15px;
          color: #92a2b1;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
        }

        .mp-tab-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 12px;
          margin: 3px 0;
          text-align: left;
          border: 0;
          border-radius: 11px;
          color: #64798b;
          background: transparent;
          font-size: 13px !important;
          font-weight: 600;
          transition: background 0.2s, color 0.2s, transform 0.2s;
        }

        .mp-tab-button svg {
          flex: 0 0 17px;
          font-size: 16px;
        }

        .mp-tab-button:hover {
          color: var(--mp-primary);
          background: #effafb;
        }

        .mp-tab-button.active {
          color: #067987;
          background: linear-gradient(110deg, #e2fafa, #edf7ff);
          box-shadow: inset 3px 0 0 #11b9b1;
          font-weight: 800;
        }

        .mp-sidebar-footer {
          margin-top: 22px;
          padding: 15px 12px 6px;
          border-top: 1px solid #edf2f5;
          color: #8b9cac;
          font-size: 11px;
          line-height: 1.7;
        }

        .mp-main-panel {
          padding: 25px;
          overflow: hidden;
        }

        .mp-overview-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 22px;
          margin-bottom: 20px;
          border: 1px solid #d9f0f0;
          border-radius: 16px;
          background:
            radial-gradient(ellipse at 95% 0%, rgba(20, 184, 166, 0.13), transparent 44%),
            linear-gradient(120deg, #f1fcfc, #f5f9ff);
        }

        .mp-overview-identity {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }

        .mp-avatar-wrap {
          position: relative;
          flex: 0 0 auto;
        }

        .mp-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
          font-weight: 800;
          background: linear-gradient(135deg, #12b8b0, #1976a5);
          border: 4px solid #ffffff;
          box-shadow: 0 6px 18px rgba(8, 127, 140, 0.18);
          border-radius: 50%;
        }

        .mp-avatar-large {
          width: 104px;
          height: 104px;
          font-size: 32px;
        }

        .mp-avatar-medium {
          width: 76px;
          height: 76px;
          font-size: 24px;
        }

        .mp-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mp-camera-button {
          position: absolute;
          right: 0;
          bottom: 2px;
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          color: white;
          background: #087f8c;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(8, 127, 140, 0.2);
        }

        .mp-camera-button:hover {
          background: #075e6d;
        }

        .mp-identity-copy {
          min-width: 0;
        }

        .mp-eyebrow {
          display: block;
          margin-bottom: 8px;
          color: #078b91;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .mp-identity-copy h2 {
          margin: 0;
          overflow-wrap: anywhere;
          color: #143548;
          font-size: clamp(21px, 2vw, 28px);
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .mp-identity-copy > p {
          margin: 7px 0 12px;
          color: #718397;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .mp-identity-badges {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .mp-role-badge,
        .mp-status-badge,
        .mp-readonly-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .mp-role-badge {
          color: #087987;
          background: #dff8f6;
        }

        .mp-status-badge {
          color: #138456;
          background: #e7f8ee;
        }

        .mp-status-badge > span {
          width: 6px;
          height: 6px;
          background: currentColor;
          border-radius: 50%;
        }

        .mp-status-badge.is-inactive {
          color: #b45309;
          background: #fff4dd;
        }

        .mp-readonly-badge {
          color: #63788b;
          background: #f0f4f7;
          text-transform: none;
        }

        .mp-primary-button,
        .mp-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 42px;
          padding: 11px 17px;
          border-radius: 10px;
          font-size: 12px !important;
          font-weight: 800;
          white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .mp-primary-button {
          color: #fff;
          background: linear-gradient(115deg, #10aeb0, #087f9d);
          border: 1px solid transparent;
          box-shadow: 0 5px 13px rgba(8, 127, 140, 0.17);
        }

        .mp-primary-button:hover:not(:disabled) {
          background: linear-gradient(115deg, #0c999d, #076a87);
          transform: translateY(-1px);
          box-shadow: 0 8px 17px rgba(8, 127, 140, 0.22);
        }

        .mp-secondary-button {
          color: #087f8c;
          background: #fff;
          border: 1px solid #cfe5e9;
        }

        .mp-secondary-button:hover:not(:disabled) {
          background: #f0fbfb;
          border-color: #9edbde;
        }

        .mp-text-button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 0;
          color: #078b91;
          background: transparent;
          border: 0;
          font-size: 12px !important;
          font-weight: 800;
        }

        .mp-text-button:hover {
          color: #075e6d;
        }

        .mp-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 13px;
          margin-bottom: 20px;
        }

        .mp-stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 17px 14px;
          border: 1px solid var(--mp-border);
          border-radius: 14px;
          background: #fff;
        }

        .mp-stat-icon {
          display: grid;
          place-items: center;
          flex: 0 0 42px;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          font-size: 17px;
        }

        .mp-icon-aqua {
          color: #0a9b9d;
          background: #e0f9f6;
        }

        .mp-icon-blue {
          color: #3478cb;
          background: #eaf2ff;
        }

        .mp-icon-purple {
          color: #8660ce;
          background: #f1eaff;
        }

        .mp-stat-card > div:last-child {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .mp-stat-card span {
          color: #8495a5;
          font-size: 11px;
        }

        .mp-stat-card strong {
          color: #1c3a4d;
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .mp-content-card {
          min-width: 0;
          margin-bottom: 20px;
          padding: 22px;
          border: 1px solid var(--mp-border);
          border-radius: 15px;
          background: #fff;
        }

        .mp-content-card:last-child {
          margin-bottom: 0;
        }

        .mp-card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 23px;
        }

        .mp-card-heading h3,
        .mp-security-copy h3 {
          margin: 0;
          color: #1a3b4e;
          font-size: 16px;
          font-weight: 800;
        }

        .mp-card-heading p,
        .mp-security-copy p {
          margin: 7px 0 0;
          color: #8192a1;
          font-size: 12px;
          line-height: 1.6;
        }

        .mp-info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px 22px;
        }

        .mp-info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .mp-info-item-icon {
          display: grid;
          place-items: center;
          flex: 0 0 38px;
          width: 38px;
          height: 38px;
          color: #078b91;
          background: #eaf9f8;
          border-radius: 10px;
          font-size: 15px;
        }

        .mp-info-item > div:last-child {
          min-width: 0;
          padding-top: 2px;
        }

        .mp-info-item span {
          display: block;
          margin-bottom: 6px;
          color: #8797a5;
          font-size: 11px;
        }

        .mp-info-item strong {
          display: block;
          color: #29465a;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.6;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .mp-info-empty {
          color: #a0adba !important;
          font-weight: 500 !important;
        }

        .mp-security-card {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px 20px;
          background: linear-gradient(115deg, #f1fbfb, #f5f9ff);
          border-color: #dceff0;
        }

        .mp-security-symbol,
        .mp-security-icon {
          display: grid;
          place-items: center;
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          color: #087f8c;
          background: #dff8f6;
          border-radius: 13px;
          font-size: 18px;
        }

        .mp-security-copy {
          flex: 1;
          min-width: 0;
        }

        .mp-security-copy h3 {
          font-size: 14px;
        }

        .mp-security-copy p {
          font-size: 12px;
        }

        .mp-form {
          width: 100%;
        }

        .mp-photo-editor {
          display: flex;
          align-items: center;
          gap: 17px;
          margin-bottom: 26px;
          padding: 16px;
          background: #f6fbfc;
          border: 1px dashed #cde4e8;
          border-radius: 13px;
        }

        .mp-photo-editor strong {
          display: block;
          color: #28465a;
          font-size: 13px;
        }

        .mp-photo-editor p {
          margin: 5px 0;
          color: #7d90a0;
          font-size: 11px;
          line-height: 1.6;
        }

        .mp-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .mp-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          margin-bottom: 20px;
        }

        .mp-field-full {
          grid-column: 1 / -1;
        }

        .mp-field label {
          color: #385469;
          font-size: 12px;
          font-weight: 800;
        }

        .mp-field input,
        .mp-field textarea {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          color: #234256;
          background: #fbfdfe;
          border: 1px solid #dce7ec;
          border-radius: 9px;
          outline: none;
          font-size: 13px !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .mp-field input {
          min-height: 44px;
        }

        .mp-field textarea {
          min-height: 95px;
          resize: vertical;
        }

        .mp-field input:focus,
        .mp-field textarea:focus {
          background: #fff;
          border-color: #21b8b5;
          box-shadow: 0 0 0 3px rgba(18, 184, 176, 0.11);
        }

        .mp-field input[readonly] {
          color: #8494a2;
          background: #f1f5f7;
          cursor: not-allowed;
        }

        .mp-field small {
          color: #8a9baa;
          font-size: 10px;
        }

        .mp-form-actions {
          display: flex;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 18px;
          border-top: 1px solid #edf2f5;
        }

        .mp-password-hint {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 13px;
          color: #647c8d;
          background: #f1f9fc;
          border-radius: 9px;
          font-size: 11px;
          line-height: 1.6;
        }

        .mp-password-hint svg {
          flex: 0 0 auto;
          margin-top: 2px;
          color: #078b91;
        }

        .mp-activity-list {
          display: flex;
          flex-direction: column;
        }

        .mp-activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 0;
          border-bottom: 1px solid #edf2f5;
        }

        .mp-activity-item:first-child {
          padding-top: 0;
        }

        .mp-activity-item:last-child {
          padding-bottom: 0;
          border-bottom: 0;
        }

        .mp-activity-icon {
          display: grid;
          place-items: center;
          flex: 0 0 40px;
          width: 40px;
          height: 40px;
          color: #078b91;
          background: #e9f9f8;
          border-radius: 12px;
        }

        .mp-activity-description {
          flex: 1;
          min-width: 0;
        }

        .mp-activity-description strong {
          color: #29465a;
          font-size: 13px;
        }

        .mp-activity-description p {
          margin: 5px 0 0;
          color: #8797a5;
          font-size: 11px;
          line-height: 1.6;
        }

        .mp-activity-item time {
          color: #738899;
          font-size: 11px;
          text-align: right;
          line-height: 1.6;
        }

        .mp-note {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 22px;
          padding: 13px;
          color: #678090;
          background: #f5f9fb;
          border-radius: 10px;
          font-size: 11px;
          line-height: 1.7;
        }

        .mp-note svg {
          flex: 0 0 auto;
          margin-top: 3px;
          color: #078b91;
        }

        .mp-note p {
          margin: 0;
        }

        .mp-capitalize {
          text-transform: capitalize;
        }

        .mp-alert {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 18px;
          padding: 13px 15px;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .mp-alert-error {
          color: #a52a35;
          background: #fff0f0;
          border: 1px solid #ffd8da;
        }

        .mp-alert-success {
          color: #14774c;
          background: #eafaf1;
          border: 1px solid #c8f0d9;
        }

        .mp-alert svg {
          flex: 0 0 auto;
          margin-top: 2px;
        }

        .mp-loading {
          display: grid;
          place-items: center;
          min-height: 280px;
          gap: 12px;
          color: #6d8798;
          font-size: 13px;
        }

        .mp-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #d8eff0;
          border-top-color: #0ca9ac;
          border-radius: 50%;
          animation: mp-spin 0.8s linear infinite;
        }

        @keyframes mp-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .admin-my-profile {
            padding: 18px;
          }

          .mp-page-layout {
            grid-template-columns: 215px minmax(0, 1fr);
            gap: 16px;
          }

          .mp-main-panel {
            padding: 18px;
          }

          .mp-overview-hero {
            align-items: flex-start;
            padding: 17px;
          }

          .mp-avatar-large {
            width: 88px;
            height: 88px;
            font-size: 27px;
          }

          .mp-stats-grid {
            gap: 9px;
          }

          .mp-stat-card {
            padding: 13px 10px;
            gap: 9px;
          }

          .mp-stat-icon {
            flex-basis: 36px;
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 800px) {
          .admin-my-profile {
            padding: 14px;
            border-radius: 14px;
          }

          .mp-page-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .mp-sidebar {
            position: static;
            padding: 10px;
            overflow: hidden;
          }

          .mp-sidebar-title,
          .mp-sidebar-footer {
            display: none;
          }

          .mp-sidebar nav {
            display: flex;
            gap: 7px;
            overflow-x: auto;
            padding: 2px;
            scrollbar-width: thin;
          }

          .mp-tab-button {
            flex: 0 0 auto;
            width: auto;
            min-height: 42px;
            margin: 0;
            padding: 10px 12px;
            white-space: nowrap;
            box-shadow: none !important;
          }

          .mp-tab-button.active {
            background: linear-gradient(110deg, #e2fafa, #edf7ff);
            box-shadow: inset 0 -3px 0 #11b9b1 !important;
          }

          .mp-main-panel {
            padding: 15px;
          }

          .mp-page-heading {
            margin-bottom: 17px;
          }
        }

        @media (max-width: 560px) {
          .admin-my-profile {
            padding: 10px;
          }

          .mp-page-heading {
            margin-bottom: 15px;
          }

          .mp-page-heading h1 {
            font-size: 23px;
          }

          .mp-page-heading p {
            font-size: 12px;
          }

          .mp-main-panel {
            padding: 10px;
            border-radius: 13px;
          }

          .mp-overview-hero {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 14px;
          }

          .mp-overview-identity {
            align-items: center;
            gap: 12px;
          }

          .mp-avatar-large {
            width: 70px;
            height: 70px;
            font-size: 22px;
            border-width: 3px;
          }

          .mp-camera-button {
            width: 27px;
            height: 27px;
            border-width: 2px;
            font-size: 10px;
          }

          .mp-identity-copy h2 {
            font-size: 19px;
          }

          .mp-identity-copy > p {
            font-size: 11px;
            margin: 5px 0 8px;
          }

          .mp-eyebrow {
            font-size: 9px;
            letter-spacing: 1px;
          }

          .mp-role-badge,
          .mp-status-badge {
            font-size: 9px;
            padding: 5px 7px;
          }

          .mp-overview-hero > .mp-primary-button {
            width: 100%;
          }

          .mp-stats-grid {
            grid-template-columns: 1fr;
            gap: 9px;
          }

          .mp-stat-card {
            padding: 12px;
          }

          .mp-stat-card strong {
            font-size: 12px;
          }

          .mp-content-card {
            padding: 15px 12px;
            margin-bottom: 12px;
            border-radius: 12px;
          }

          .mp-card-heading {
            align-items: flex-start;
            margin-bottom: 18px;
          }

          .mp-card-heading h3 {
            font-size: 14px;
          }

          .mp-card-heading p {
            font-size: 11px;
          }

          .mp-info-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .mp-form-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 0;
          }

          .mp-field-full {
            grid-column: auto;
          }

          .mp-security-card {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 12px;
          }

          .mp-security-copy {
            flex: 1 1 calc(100% - 60px);
          }

          .mp-security-card > .mp-secondary-button,
          .mp-security-card > .mp-status-badge {
            margin-left: 56px;
          }

          .mp-activity-item {
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 10px;
          }

          .mp-activity-description {
            flex: 1 1 calc(100% - 55px);
          }

          .mp-activity-item time {
            width: 100%;
            padding-left: 50px;
            text-align: left;
          }

          .mp-photo-editor {
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
          }

          .mp-form-actions {
            flex-direction: column-reverse;
          }

          .mp-form-actions button {
            width: 100%;
          }

          .mp-tab-button {
            font-size: 11px !important;
            padding: 10px;
          }

          .mp-tab-button svg {
            font-size: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .admin-my-profile *,
          .admin-my-profile *::before,
          .admin-my-profile *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        hidden
      />

      <div className="mp-page-heading">
        <div>
          <div className="mp-breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <span>My Profile</span>
          </div>
          <h1>My Profile</h1>
          <p>Manage your personal details and account preferences.</p>
        </div>
      </div>

      {error && (
        <div className="mp-alert mp-alert-error" role="alert">
          <FaTimes />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mp-alert mp-alert-success" role="status">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="mp-main-panel mp-loading">
          <div className="mp-spinner" />
          <span>Loading your profile...</span>
        </div>
      ) : (
        <div className="mp-page-layout">
          <aside className="mp-sidebar">
            <div className="mp-sidebar-title">Profile Menu</div>

            <nav aria-label="Profile sections">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    type="button"
                    key={tab.id}
                    className={`mp-tab-button ${
                      activeTab === tab.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      clearMessages();
                    }}
                  >
                    <Icon />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mp-sidebar-footer">
              <FaShieldAlt /> Your account details are private and protected.
            </div>
          </aside>

          <main className="mp-main-panel">
            {pageContent[activeTab]()}
          </main>
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  const hasValue = value !== undefined && value !== null && String(value).trim();

  return (
    <div className="mp-info-item">
      <div className="mp-info-item-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong className={hasValue ? "" : "mp-info-empty"}>
          {hasValue ? value : "Not provided"}
        </strong>
      </div>
    </div>
  );
}

export default MyProfile;