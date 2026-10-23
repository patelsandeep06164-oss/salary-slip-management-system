import React, { useMemo } from "react";
import {
  FaWallet,
  FaPlusCircle,
  FaMinusCircle,
  FaMoneyBillWave,
  FaCalculator,
} from "react-icons/fa";

function SalaryBreakdown({
  salary = {},
  currency = "INR",
  loading = false,
  title = "Salary Breakdown",
  showSummary = true,
}) {
  const numberFormat = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      });
    } catch {
      return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        maximumFractionDigits: 2,
      });
    }
  }, [currency]);

  const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? Math.max(0, amount) : 0;
  };

  const basicSalary = toAmount(salary.basicSalary ?? salary.basic ?? 0);

  const allowances = toAmount(
    salary.allowances ??
      salary.totalAllowances ??
      salary.allowance ??
      0
  );

  const deductions = toAmount(
    salary.deductions ??
      salary.totalDeductions ??
      salary.deduction ??
      0
  );

  const grossSalary = toAmount(
    salary.grossSalary ?? basicSalary + allowances
  );

  const netSalary = toAmount(
    salary.netSalary ?? salary.netPay ?? grossSalary - deductions
  );

  const rows = [
    {
      label: "Basic Salary",
      amount: basicSalary,
      icon: FaWallet,
      type: "normal",
    },
    {
      label: "Allowances",
      amount: allowances,
      icon: FaPlusCircle,
      type: "positive",
    },
    {
      label: "Deductions",
      amount: deductions,
      icon: FaMinusCircle,
      type: "negative",
    },
  ];

  if (loading) {
    return (
      <div className="salary-breakdown-card" aria-busy="true">
        <style>{styles}</style>

        <div className="salary-breakdown-header">
          <div className="salary-breakdown-heading">
            <span className="salary-breakdown-main-icon">
              <FaCalculator />
            </span>
            <div>
              <h3>{title}</h3>
              <p>Loading salary details...</p>
            </div>
          </div>
        </div>

        {[1, 2, 3, 4].map((item) => (
          <div className="salary-breakdown-skeleton" key={item} />
        ))}
      </div>
    );
  }

  return (
    <section className="salary-breakdown-card">
      <style>{styles}</style>

      <div className="salary-breakdown-header">
        <div className="salary-breakdown-heading">
          <span className="salary-breakdown-main-icon">
            <FaCalculator />
          </span>

          <div>
            <h3>{title}</h3>
            <p>Salary earnings and deductions</p>
          </div>
        </div>
      </div>

      <div className="salary-breakdown-list">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div className="salary-breakdown-row" key={row.label}>
              <div className="salary-breakdown-label">
                <span
                  className={`salary-breakdown-row-icon ${row.type}`}
                >
                  <Icon />
                </span>

                <span>{row.label}</span>
              </div>

              <span
                className={`salary-breakdown-amount ${row.type}`}
              >
                {row.type === "positive" && "+"}
                {row.type === "negative" && "-"}
                {numberFormat.format(row.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {showSummary && (
        <div className="salary-breakdown-summary">
          <div className="salary-breakdown-total">
            <div>
              <span className="salary-breakdown-total-label">
                Gross Salary
              </span>
              <small>Before deductions</small>
            </div>

            <strong>{numberFormat.format(grossSalary)}</strong>
          </div>

          <div className="salary-breakdown-net">
            <div className="salary-breakdown-net-label">
              <FaMoneyBillWave />
              <div>
                <strong>Net Salary</strong>
                <small>Final payable amount</small>
              </div>
            </div>

            <strong className="salary-breakdown-net-amount">
              {numberFormat.format(netSalary)}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}

const styles = `
  .salary-breakdown-card,
  .salary-breakdown-card * {
    box-sizing: border-box;
  }

  .salary-breakdown-card {
    width: 100%;
    min-width: 0;
    padding: 22px;
    border: 1px solid #dbeafe;
    border-radius: 18px;
    background: linear-gradient(145deg, #ffffff 0%, #f5fbff 100%);
    box-shadow: 0 8px 24px rgba(15, 78, 120, 0.07);
    color: #183247;
  }

  .salary-breakdown-header {
    padding-bottom: 18px;
    border-bottom: 1px solid #e5edf5;
  }

  .salary-breakdown-heading {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .salary-breakdown-main-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 13px;
    background: linear-gradient(135deg, #0ea5e9, #2563eb);
    color: #ffffff;
    font-size: 18px;
  }

  .salary-breakdown-heading h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
    color: #12304a;
  }

  .salary-breakdown-heading p {
    margin: 5px 0 0;
    color: #718096;
    font-size: 12px;
  }

  .salary-breakdown-list {
    padding: 8px 0;
  }

  .salary-breakdown-row,
  .salary-breakdown-label {
    display: flex;
    align-items: center;
  }

  .salary-breakdown-row {
    justify-content: space-between;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid #edf2f7;
  }

  .salary-breakdown-label {
    gap: 10px;
    min-width: 0;
    color: #526579;
    font-size: 13px;
    font-weight: 600;
  }

  .salary-breakdown-row-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    border-radius: 9px;
    background: #eff6ff;
    color: #2563eb;
  }

  .salary-breakdown-row-icon.positive {
    background: #dcfce7;
    color: #15803d;
  }

  .salary-breakdown-row-icon.negative {
    background: #fee2e2;
    color: #b91c1c;
  }

  .salary-breakdown-amount {
    color: #183247;
    font-size: 13px;
    font-weight: 700;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .salary-breakdown-amount.positive {
    color: #15803d;
  }

  .salary-breakdown-amount.negative {
    color: #dc2626;
  }

  .salary-breakdown-summary {
    padding-top: 10px;
  }

  .salary-breakdown-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 0 18px;
  }

  .salary-breakdown-total > div,
  .salary-breakdown-net-label > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .salary-breakdown-total-label {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .salary-breakdown-total small,
  .salary-breakdown-net small {
    color: #8291a4;
    font-size: 11px;
  }

  .salary-breakdown-total > strong {
    font-size: 15px;
    color: #1e40af;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .salary-breakdown-net {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 17px;
    border: 1px solid #bae6fd;
    border-radius: 14px;
    background: linear-gradient(120deg, #e0f7ff, #eaf1ff);
  }

  .salary-breakdown-net-label {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0369a1;
  }

  .salary-breakdown-net-label > svg {
    font-size: 22px;
    flex-shrink: 0;
  }

  .salary-breakdown-net-label strong {
    color: #075985;
    font-size: 13px;
  }

  .salary-breakdown-net-amount {
    color: #075985;
    font-size: 17px;
    text-align: right;
    overflow-wrap: anywhere;
  }

  .salary-breakdown-skeleton {
    height: 42px;
    margin-top: 14px;
    border-radius: 9px;
    background: linear-gradient(90deg, #edf2f7 25%, #f8fafc 50%, #edf2f7 75%);
    background-size: 200% 100%;
    animation: salaryBreakdownShimmer 1.4s infinite;
  }

  @keyframes salaryBreakdownShimmer {
    to { background-position: -200% 0; }
  }

  @media (max-width: 480px) {
    .salary-breakdown-card {
      padding: 16px;
      border-radius: 14px;
    }

    .salary-breakdown-heading h3 {
      font-size: 16px;
    }

    .salary-breakdown-row {
      gap: 8px;
    }

    .salary-breakdown-label,
    .salary-breakdown-amount {
      font-size: 12px;
    }

    .salary-breakdown-net {
      padding: 13px;
    }

    .salary-breakdown-net-amount {
      font-size: 14px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .salary-breakdown-skeleton {
      animation: none;
    }
  }
`;

export default SalaryBreakdown;
