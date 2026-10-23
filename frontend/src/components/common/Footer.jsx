import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBuilding,
  FaArrowUp,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const quickLinks = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Employees", href: "/admin/employees" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Payroll", href: "/admin/payroll" },
    { label: "Salary Slips", href: "/admin/salary-slips" },
  ];

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const isActiveRoute = (href) => location.pathname === href;

  return (
    <>
      <style>{`
        .it-footer,
        .it-footer * {
          box-sizing: border-box;
        }

        .it-footer {
          width: 100%;
          margin-top: auto;
          background: linear-gradient(135deg, #071d36 0%, #0b2c4d 100%);
          color: #c6d3e4;
          font-family: inherit;
        }

        .it-footer-main {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 42px 36px 35px;
          display: grid;
          grid-template-columns: 1.5fr 0.8fr 1fr;
          gap: 50px;
        }

        .it-footer-brand {
          min-width: 0;
          max-width: 390px;
        }

        .it-footer-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #ffffff;
          text-decoration: none;
        }

        .it-footer-logo-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: linear-gradient(135deg, #1685ff, #0754c7);
          color: #ffffff;
          font-size: 20px;
          box-shadow: 0 5px 15px rgba(8, 102, 233, 0.25);
        }

        .it-footer-company-name {
          display: block;
          color: #ffffff;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.6px;
        }

        .it-footer-company-name strong {
          color: #63a5ff;
        }

        .it-footer-tagline {
          display: block;
          margin-top: 5px;
          color: #9eb2cc;
          font-size: 10px;
          letter-spacing: 0.3px;
        }

        .it-footer-description {
          max-width: 350px;
          margin: 20px 0;
          color: #a9bad0;
          font-size: 13px;
          line-height: 1.9;
        }

        .it-footer-links,
        .it-footer-contact {
          min-width: 0;
        }

        .it-footer-links h3,
        .it-footer-contact h3 {
          margin: 5px 0 20px;
          color: #ffffff;
          font-size: 14px;
          font-weight: 750;
        }

        .it-footer-links {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 13px;
        }

        .it-footer-links a {
          position: relative;
          color: #a9bad0;
          font-size: 12px;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .it-footer-links a:hover,
        .it-footer-links a.active {
          color: #69aaff;
        }

        .it-footer-links a:focus-visible,
        .it-footer-contact-item a:focus-visible,
        .it-footer-logo:focus-visible,
        .it-footer-top:focus-visible {
          outline: 2px solid #70b5ff;
          outline-offset: 4px;
          border-radius: 4px;
        }

        .it-footer-contact {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .it-footer-contact h3 {
          margin-bottom: 3px;
        }

        .it-footer-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #a9bad0;
          font-size: 12px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .it-footer-contact-item > svg {
          flex-shrink: 0;
          margin-top: 3px;
          color: #65a5ff;
        }

        .it-footer-contact-item a {
          color: inherit;
          text-decoration: none;
        }

        .it-footer-contact-item a:hover {
          color: #ffffff;
        }

        .it-footer-bottom {
          min-height: 66px;
          padding: 15px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          border-top: 1px solid #203852;
        }

        .it-footer-bottom p {
          margin: 0;
          color: #92a6bf;
          font-size: 11px;
          line-height: 1.7;
        }

        .it-footer-legal {
          display: flex;
          flex-wrap: wrap;
          gap: 22px;
        }

        .it-footer-legal a {
          color: #a9bad0;
          font-size: 11px;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .it-footer-legal a:hover {
          color: #69aaff;
        }

        .it-footer-top {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          background: #1268e8;
          color: #ffffff;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .it-footer-top:hover {
          background: #3181f7;
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          .it-footer-main {
            grid-template-columns: 1fr 1fr;
            gap: 35px;
            padding: 35px 25px;
          }

          .it-footer-brand {
            grid-column: 1 / -1;
            max-width: 480px;
          }
        }

        @media (max-width: 560px) {
          .it-footer-main {
            grid-template-columns: 1fr;
            gap: 30px;
            padding: 30px 20px;
          }

          .it-footer-brand {
            grid-column: auto;
          }

          .it-footer-company-name {
            font-size: 19px;
          }

          .it-footer-bottom {
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
          }

          .it-footer-legal {
            gap: 16px;
          }

          .it-footer-top {
            align-self: flex-end;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .it-footer *,
          .it-footer *::before,
          .it-footer *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }
        }
      `}</style>

      <footer className="it-footer">
        <div className="it-footer-main">
          <div className="it-footer-brand">
            <Link to="/" className="it-footer-logo">
              <span className="it-footer-logo-icon">
                <FaBuilding aria-hidden="true" />
              </span>

              <span>
                <span className="it-footer-company-name">
                  Salary <strong>Slip</strong>
                </span>

                <span className="it-footer-tagline">
                  Employee & Payroll Management
                </span>
              </span>
            </Link>

            <p className="it-footer-description">
              Manage employee records, attendance, payroll and
              salary slips in one organized workspace. Designed
              to make your payroll workflow simpler and more efficient.
            </p>
          </div>

          <nav className="it-footer-links" aria-label="Footer navigation">
            <h3>Quick Links</h3>

            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={isActiveRoute(link.href) ? "active" : ""}
                aria-current={
                  isActiveRoute(link.href) ? "page" : undefined
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="it-footer-contact">
            <h3>Contact Information</h3>

            <div className="it-footer-contact-item">
              <FaEnvelope aria-hidden="true" />
              <span>
                Configure your company email in Company Settings.
              </span>
            </div>

            <div className="it-footer-contact-item">
              <FaPhoneAlt aria-hidden="true" />
              <span>
                Configure your company phone number in Company Settings.
              </span>
            </div>

            <div className="it-footer-contact-item">
              <FaMapMarkerAlt aria-hidden="true" />
              <span>
                Your company address can be configured in Company Settings.
              </span>
            </div>
          </div>
        </div>

        <div className="it-footer-bottom">
          <p>
            © {currentYear} Salary Slip Management. All rights reserved.
          </p>

          <div className="it-footer-legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms & Conditions</Link>
          </div>

          <button
            type="button"
            className="it-footer-top"
            onClick={handleBackToTop}
            aria-label="Back to top"
            title="Back to top"
          >
            <FaArrowUp aria-hidden="true" />
          </button>
        </div>
      </footer>
    </>
  );
}

export default Footer;
