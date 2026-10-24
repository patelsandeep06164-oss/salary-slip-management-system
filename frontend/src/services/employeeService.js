
import api from "./api";

// Keep the department object intact so every page can access its ID and name.
const normalizeEmployee = (raw = {}) => {
  const salary =
    raw.salary && typeof raw.salary === "object"
      ? raw.salary
      : {
          basic: Number(raw.salary ?? raw.basicSalary ?? 0),
        };

  const name =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ").trim();

  const department = raw.department ?? null;

  // Prefer the backend salary object's basic value when available.
  const basicSalary = Number(
    salary.basic ?? salary.basicSalary ?? raw.basicSalary ?? 0
  );

  return {
    ...raw,
    id: raw._id || raw.id || raw.employeeCode || raw.employeeId,
    _id: raw._id || raw.id,
    employeeId: raw.employeeCode || raw.employeeId || "",
    employeeCode: raw.employeeCode || raw.employeeId || "",
    name,
    fullName: raw.fullName || name,

    // Preserve both department._id and department.name.
    department,

    basicSalary,
    allowances: Number(raw.allowances ?? salary.allowances ?? 0),
    deductions: Number(raw.deductions ?? salary.deductions ?? 0),
    salary: {
      ...salary,
      basic: basicSalary,
    },
    status: String(raw.status || "active").toLowerCase(),
    employmentType: String(
      raw.employmentType || "full-time"
    ).toLowerCase(),
  };
};

const getRows = (data) => {
  const rows = Array.isArray(data)
    ? data
    : data?.employees ||
      data?.data?.employees ||
      [];

  return Array.isArray(rows) ? rows.map(normalizeEmployee) : [];
};

const unwrapEmployee = (data) =>
  normalizeEmployee(
    data?.employee ||
      data?.data?.employee ||
      data?.data ||
      data
  );

const getDepartmentId = (department) => {
  if (department && typeof department === "object") {
    department = department._id || department.id || "";
  }

  const value = String(department || "").trim();

  return /^[a-f\d]{24}$/i.test(value) ? value : null;
};

const toApiPayload = (input = {}) => {
  const fullName = String(
    input.name ||
      [input.firstName, input.lastName].filter(Boolean).join(" ")
  ).trim();

  const nameParts = fullName.split(/\s+/).filter(Boolean);

  const salary =
    input.salary && typeof input.salary === "object"
      ? input.salary
      : {};

  // Prefer the updated salary object over any stale top-level basicSalary.
  const basicValue =
    salary.basic ??
    salary.basicSalary ??
    input.basicSalary ??
    (typeof input.salary === "number" ? input.salary : 0);

  const basic = Number(basicValue);

  const payload = {
    employeeCode: String(
      input.employeeCode || input.employeeId || ""
    ).trim(),

    firstName: String(
      input.firstName || nameParts[0] || ""
    ).trim(),

    lastName: String(
      input.lastName || nameParts.slice(1).join(" ")
    ).trim(),

    email: String(input.email || "").trim().toLowerCase(),
    phone: String(input.phone || "").trim(),
    pan: String(input.pan || "").trim().toUpperCase(),
    designation: String(input.designation || "Employee").trim(),

    joiningDate:
      input.joiningDate || new Date().toISOString().slice(0, 10),

    employmentType: String(
      input.employmentType || "full-time"
    )
      .toLowerCase()
      .replace(/\s+/g, "-"),

    status: String(input.status || "active").toLowerCase(),

    salary: {
      currency: salary.currency || "INR",
      basic: Number.isFinite(basic) ? basic : 0,
      hra: Number(input.hra ?? salary.hra ?? 0),
      allowances: Number(
        input.allowances ?? salary.allowances ?? 0
      ),
      deductions: Number(
        input.deductions ?? salary.deductions ?? 0
      ),
    },
  };

  // Preserve a valid department ID. Explicit null clears the department.
  if (Object.prototype.hasOwnProperty.call(input, "department")) {
    if (
      input.department === null ||
      input.department === ""
    ) {
      payload.department = null;
    } else {
      const departmentId = getDepartmentId(input.department);

      if (departmentId) {
        payload.department = departmentId;
      } else {
        throw new Error(
          "Invalid department. Please select a department from the list."
        );
      }
    }
  }

  if (input.address && typeof input.address === "object") {
    payload.address = input.address;
  } else if (input.address) {
    payload.address = {
      street: String(input.address),
      country: "India",
    };
  }

  return payload;
};

// Builds a payload containing only the fields supplied by the caller.
const toPartialPayload = (input = {}) => {
  const payload = {};
  const has = (key) =>
    Object.prototype.hasOwnProperty.call(input, key);

  if (has("employeeCode") || has("employeeId")) {
    payload.employeeCode = String(
      input.employeeCode ?? input.employeeId ?? ""
    ).trim();
  }

  if (has("name") || has("firstName") || has("lastName")) {
    const fullName = String(
      input.name ||
        [input.firstName, input.lastName].filter(Boolean).join(" ")
    ).trim();

    const parts = fullName.split(/\s+/).filter(Boolean);

    if (has("firstName") || has("name")) {
      payload.firstName = String(
        input.firstName || parts[0] || ""
      ).trim();
    }

    if (has("lastName") || has("name")) {
      payload.lastName = String(
        input.lastName || parts.slice(1).join(" ")
      ).trim();
    }
  }

  if (has("email")) {
    payload.email = String(input.email || "")
      .trim()
      .toLowerCase();
  }

  if (has("phone")) {
    payload.phone = String(input.phone || "").trim();
  }

  if (has("pan")) {
    payload.pan = String(input.pan || "").trim().toUpperCase();
  }

  if (has("designation")) {
    payload.designation = String(input.designation || "").trim();
  }

  if (has("joiningDate")) {
    payload.joiningDate = input.joiningDate;
  }

  if (has("employmentType")) {
    payload.employmentType = String(input.employmentType || "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  if (has("status")) {
    payload.status = String(input.status || "").toLowerCase();
  }

  if (has("department")) {
    if (input.department === null || input.department === "") {
      payload.department = null;
    } else {
      const departmentId = getDepartmentId(input.department);

      if (!departmentId) {
        throw new Error(
          "Invalid department. Please select a department from the list."
        );
      }

      payload.department = departmentId;
    }
  }

  if (
    has("salary") ||
    has("basicSalary") ||
    has("hra") ||
    has("allowances") ||
    has("deductions")
  ) {
    const salary =
      input.salary && typeof input.salary === "object"
        ? input.salary
        : {};

    const result = {};

    if (
      has("salary") ||
      has("basicSalary") ||
      Object.prototype.hasOwnProperty.call(salary, "basic")
    ) {
      const basicValue =
        salary.basic ??
        salary.basicSalary ??
        input.basicSalary ??
        (typeof input.salary === "number" ? input.salary : 0);

      result.basic = Number(basicValue);
    }

    if (
      has("salary") ||
      has("hra") ||
      Object.prototype.hasOwnProperty.call(salary, "hra")
    ) {
      result.hra = Number(input.hra ?? salary.hra ?? 0);
    }

    if (
      has("salary") ||
      has("allowances") ||
      Object.prototype.hasOwnProperty.call(salary, "allowances")
    ) {
      result.allowances = Number(
        input.allowances ?? salary.allowances ?? 0
      );
    }

    if (
      has("salary") ||
      has("deductions") ||
      Object.prototype.hasOwnProperty.call(salary, "deductions")
    ) {
      result.deductions = Number(
        input.deductions ?? salary.deductions ?? 0
      );
    }

    if (salary.currency) {
      result.currency = salary.currency;
    }

    payload.salary = result;
  }

  if (has("address")) {
    if (input.address && typeof input.address === "object") {
      payload.address = input.address;
    } else if (input.address) {
      payload.address = {
        street: String(input.address),
        country: "India",
      };
    } else {
      payload.address = input.address;
    }
  }

  return payload;
};

const employeeService = {
  async getAll(params = {}) {
    const response = await api.get("/employees", {
      params: { limit: 100, ...params },
    });

    return {
      ...response.data,
      employees: getRows(response.data),
    };
  },

  async getById(id) {
    const response = await api.get(
      `/employees/${encodeURIComponent(id)}`
    );

    return unwrapEmployee(response.data);
  },

  async create(employeeData) {
    const response = await api.post(
      "/employees",
      toApiPayload(employeeData)
    );

    return unwrapEmployee(response.data);
  },

  async update(id, employeeData) {
    const response = await api.patch(
      `/employees/${encodeURIComponent(id)}`,
      toApiPayload(employeeData)
    );

    return unwrapEmployee(response.data);
  },

  async updatePartial(id, employeeData) {
    const response = await api.patch(
      `/employees/${encodeURIComponent(id)}`,
      toPartialPayload(employeeData)
    );

    return unwrapEmployee(response.data);
  },

  async delete(id) {
    const response = await api.delete(
      `/employees/${encodeURIComponent(id)}`
    );

    return response.data;
  },

  async search(query, params = {}) {
    const response = await api.get("/employees", {
      params: { ...params, search: query },
    });

    return getRows(response.data);
  },

  async getMyProfile() {
    const response = await api.get("/auth/me");

    return (
      response.data?.employee ||
      response.data?.user ||
      response.data?.data?.employee ||
      response.data?.data?.user ||
      response.data
    );
  },

  async updateMyProfile(profileData) {
    const response = await api.patch(
      "/auth/profile",
      profileData
    );

    return (
      response.data?.user ||
      response.data?.data?.user ||
      response.data
    );
  },

  async updateStatus(id, status) {
    return this.updatePartial(id, { status });
  },
};

export default employeeService;
