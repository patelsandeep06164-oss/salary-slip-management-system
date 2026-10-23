const STORAGE_KEY = "salarySlip_employees";

function readEmployees() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const employees = saved ? JSON.parse(saved) : [];

    return Array.isArray(employees) ? employees : [];
  } catch {
    return [];
  }
}

function saveEmployees(employees) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function createId() {
  return `emp_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function matchesSearch(employee, query) {
  const searchText = String(query || "").trim().toLowerCase();

  if (!searchText) return true;

  const fields = [
    employee.name,
    employee.fullName,
    employee.email,
    employee.phone,
    employee.employeeId,
    employee.department,
    employee.designation,
  ];

  return fields.some((value) =>
    String(value || "").toLowerCase().includes(searchText)
  );
}

function applyFilters(employees, params = {}) {
  let result = [...employees];

  if (params.search) {
    result = result.filter((employee) =>
      matchesSearch(employee, params.search)
    );
  }

  if (params.department) {
    result = result.filter(
      (employee) =>
        String(employee.department || "").toLowerCase() ===
        String(params.department).toLowerCase()
    );
  }

  if (params.status) {
    result = result.filter(
      (employee) =>
        String(employee.status || "").toLowerCase() ===
        String(params.status).toLowerCase()
    );
  }

  return result;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function findEmployeeForUser(user, employees) {
  if (!user) return null;

  return (
    employees.find(
      (employee) =>
        user.employeeId &&
        String(employee.employeeId) === String(user.employeeId)
    ) ||
    employees.find(
      (employee) =>
        user.id &&
        String(employee.id) === String(user.id)
    ) ||
    employees.find(
      (employee) =>
        user._id &&
        String(employee._id) === String(user._id)
    ) ||
    employees.find(
      (employee) =>
        user.email &&
        normalizeEmail(employee.email) === normalizeEmail(user.email)
    ) ||
    null
  );
}

const employeeService = {
  // Get all employees with optional filters
  async getAll(params = {}) {
    return applyFilters(readEmployees(), params);
  },

  // Get employee by ID
  async getById(id) {
    const employee = readEmployees().find(
      (item) =>
        String(item.id) === String(id) ||
        String(item._id || "") === String(id)
    );

    if (!employee) {
      throw new Error("Employee not found.");
    }

    return employee;
  },

  // Create employee
  async create(employeeData) {
    const employees = readEmployees();
    const email = normalizeEmail(employeeData.email);

    if (
      email &&
      employees.some(
        (employee) => normalizeEmail(employee.email) === email
      )
    ) {
      throw new Error(
        "An employee with this email already exists."
      );
    }

    const now = new Date().toISOString();

    const employee = {
      ...employeeData,
      id: employeeData.id || createId(),
      email,
      createdAt: now,
      updatedAt: now,
    };

    employees.push(employee);
    saveEmployees(employees);

    return employee;
  },

  // Update existing employee
  async update(id, employeeData) {
    const employees = readEmployees();

    const index = employees.findIndex(
      (item) =>
        String(item.id) === String(id) ||
        String(item._id || "") === String(id)
    );

    if (index === -1) {
      throw new Error("Employee not found.");
    }

    const existingEmployee = employees[index];

    const email = normalizeEmail(
      employeeData.email ?? existingEmployee.email
    );

    const duplicate = employees.some(
      (employee, employeeIndex) =>
        employeeIndex !== index &&
        email &&
        normalizeEmail(employee.email) === email
    );

    if (duplicate) {
      throw new Error(
        "An employee with this email already exists."
      );
    }

    employees[index] = {
      ...existingEmployee,
      ...employeeData,
      id: existingEmployee.id,
      email,
      updatedAt: new Date().toISOString(),
    };

    saveEmployees(employees);

    return employees[index];
  },

  // Partially update employee
  async updatePartial(id, employeeData) {
    return this.update(id, employeeData);
  },

  // Delete employee
  async delete(id) {
    const employees = readEmployees();

    const exists = employees.some(
      (item) =>
        String(item.id) === String(id) ||
        String(item._id || "") === String(id)
    );

    if (!exists) {
      throw new Error("Employee not found.");
    }

    const updatedEmployees = employees.filter(
      (item) =>
        String(item.id) !== String(id) &&
        String(item._id || "") !== String(id)
    );

    saveEmployees(updatedEmployees);

    return {
      success: true,
      message: "Employee deleted successfully.",
      id,
    };
  },

  // Search employees
  async search(query, params = {}) {
    return applyFilters(readEmployees(), {
      ...params,
      search: query,
    });
  },

  // Get logged-in employee profile
  async getMyProfile() {
    const user = getStoredUser();

    if (!user) {
      throw new Error("Please sign in to view your profile.");
    }

    const employees = readEmployees();
    const employee = findEmployeeForUser(user, employees);

    if (!employee) {
      throw new Error("Employee profile not found.");
    }

    return employee;
  },

  // Update logged-in employee profile
  async updateMyProfile(profileData) {
    const profile = await this.getMyProfile();

    // Prevent changes to identifiers, role and administrative status.
    const {
      id,
      _id,
      employeeId,
      role,
      status,
      createdAt,
      updatedAt,
      ...allowedProfileData
    } = profileData;

    return this.update(profile.id, allowedProfileData);
  },

  // Update employee status
  async updateStatus(id, status) {
    return this.update(id, { status });
  },
};

export default employeeService;