const calculateSalary = ({
  basicSalary = 0,
  allowances = 0,
  bonuses = 0,
  deductions = 0,
  workingDays = 0,
  payableDays,
  overtimeAmount = 0,
}) => {
  const values = {
    basicSalary,
    allowances,
    bonuses,
    deductions,
    workingDays,
    overtimeAmount,
  };

  for (const [key, value] of Object.entries(values)) {
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      throw new TypeError(`${key} must be a non-negative number.`);
    }
  }

  const basic = Number(basicSalary);
  const allowanceAmount = Number(allowances);
  const bonusAmount = Number(bonuses);
  const deductionAmount = Number(deductions);
  const days = Number(workingDays);
  const overtime = Number(overtimeAmount);

  const payable =
    payableDays === undefined ? days : Number(payableDays);

  if (!Number.isFinite(payable) || payable < 0) {
    throw new TypeError("payableDays must be a non-negative number.");
  }

  if (payable > days) {
    throw new RangeError("payableDays cannot exceed workingDays.");
  }

  const dailyRate = days > 0 ? basic / days : 0;
  const proratedBasic = dailyRate * payable;

  const grossSalary =
    proratedBasic + allowanceAmount + bonusAmount + overtime;

  const netSalary = Math.max(0, grossSalary - deductionAmount);

  return {
    basicSalary: Number(basic.toFixed(2)),
    proratedBasic: Number(proratedBasic.toFixed(2)),
    allowances: Number(allowanceAmount.toFixed(2)),
    bonuses: Number(bonusAmount.toFixed(2)),
    overtimeAmount: Number(overtime.toFixed(2)),
    grossSalary: Number(grossSalary.toFixed(2)),
    deductions: Number(deductionAmount.toFixed(2)),
    netSalary: Number(netSalary.toFixed(2)),
    workingDays: days,
    payableDays: payable,
    dailyRate: Number(dailyRate.toFixed(2)),
  };
};

module.exports = calculateSalary;
