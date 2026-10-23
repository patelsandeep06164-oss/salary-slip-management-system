
const Employee = require("../models/Employee");
const Payroll = require("../models/Payroll");
const SalarySlip = require("../models/SalarySlip");
const Department = require("../models/Department");

const globalSearch = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please enter at least 2 characters to search.",
      });
    }

    if (q.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query is too long.",
      });
    }

    // Escape special characters so the search text is treated literally.
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const limit = 5;

    const [
      employees,
      payrolls,
      salarySlips,
      departments,
    ] = await Promise.all([
      Employee.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { employeeCode: regex },
          { email: regex },
          { designation: regex },
        ],
      })
        .select("firstName lastName employeeCode email designation")
        .limit(limit)
        .lean(),

      Payroll.find({
        $or: [
          { status: regex },
          { slipNumber: regex },
          { month: Number(q) || -1 },
          { year: Number(q) || -1 },
        ],
      })
        .select("employee month year status netSalary")
        .populate("employee", "firstName lastName employeeCode")
        .limit(limit)
        .lean(),

      SalarySlip.find({
        $or: [
          { slipNumber: regex },
          { status: regex },
          { emailStatus: regex },
          { month: Number(q) || -1 },
          { year: Number(q) || -1 },
        ],
      })
        .select("slipNumber employee month year status emailStatus")
        .populate("employee", "firstName lastName employeeCode")
        .limit(limit)
        .lean(),

      Department.find({
        $or: [
          { name: regex },
          { departmentName: regex },
          { code: regex },
        ],
      })
        .limit(limit)
        .lean(),
    ]);

    const results = [
      ...employees.map((item) => ({
        id: String(item._id),
        type: "Employee",
        title:
          `${item.firstName || ""} ${item.lastName || ""}`.trim() ||
          item.employeeCode,
        description: [
          item.employeeCode,
          item.email,
          item.designation,
        ]
          .filter(Boolean)
          .join(" · "),
        path: `/admin/employees/edit/${item._id}`,
      })),

      ...payrolls.map((item) => ({
        id: String(item._id),
        type: "Payroll",
        title: `Payroll · ${item.employee?.employeeCode || "Employee"}`,
        description: [
          item.employee
            ? `${item.employee.firstName || ""} ${item.employee.lastName || ""}`.trim()
            : "",
          item.month && item.year
            ? `${item.month}/${item.year}`
            : "",
          item.status,
        ]
          .filter(Boolean)
          .join(" · "),
        path: `/admin/payroll/details/${item._id}`,
      })),

      ...salarySlips.map((item) => ({
        id: String(item._id),
        type: "Salary Slip",
        title: item.slipNumber || "Salary Slip",
        description: [
          item.employee?.employeeCode,
          item.month && item.year
            ? `${item.month}/${item.year}`
            : "",
          item.status,
          item.emailStatus,
        ]
          .filter(Boolean)
          .join(" · "),
        path: `/admin/salary-slips/details/${item._id}`,
      })),

      ...departments.map((item) => ({
        id: String(item._id),
        type: "Department",
        title:
          item.name ||
          item.departmentName ||
          item.code ||
          "Department",
        description: item.description || "",
        path: "/admin/departments",
      })),
    ];

    return res.status(200).json({
      success: true,
      query: q,
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
