
const EmailLog = require("../models/EmailLog");
const emailService = require("../services/emailService");

const getEmailLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.emailType) filter.emailType = req.query.emailType;

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .populate("employee", "employeeCode firstName lastName email")
        .populate("salarySlip", "slipNumber month year status")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EmailLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const retrySalarySlipEmail = async (req, res, next) => {
  try {
    const log = await EmailLog.findById(req.params.id);

    if (!log) {
      const error = new Error("Email log not found.");
      error.statusCode = 404;
      throw error;
    }

    if (log.emailType !== "salary-slip" || !log.salarySlip) {
      const error = new Error(
        "This log is not for a salary slip email."
      );
      error.statusCode = 400;
      throw error;
    }

    if (log.status === "sent") {
      return res.status(200).json({
        success: true,
        message: "This email has already been sent.",
        result: {
          emailLogId: log._id,
          status: log.status,
        },
      });
    }

    const result = await emailService.retryEmailLog(log._id);

    return res.status(200).json({
      success: true,
      message: "Salary slip email retry completed.",
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmailLogs,
  retrySalarySlipEmail,
};
