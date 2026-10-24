const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    {
      name: err.name,
      message: err.message,
      code: err.code,
      keyPattern: err.keyPattern,
      keyValue: err.keyValue,
      stack: err.stack,
    }
  );

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  // MongoDB duplicate-key error
  if (err.code === 11000) {
    statusCode = 409;

    const duplicateFields = Object.keys(
      err.keyPattern || err.keyValue || {}
    );

    if (duplicateFields.includes("employeeCode")) {
      message = "Employee ID already exists. Please use a different ID.";
    } else if (duplicateFields.includes("email")) {
      message = "This email is already registered.";
    } else if (duplicateFields.includes("user")) {
      message = "This user account is already linked to another employee.";
    } else if (duplicateFields.length > 0) {
      message = `Duplicate value detected for field: ${duplicateFields.join(", ")}.`;
    } else {
      message = "A duplicate database value was detected.";
    }
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .join(", ");
  }

  // Invalid JSON request body
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

const isProduction = process.env.NODE_ENV === "production";
const debugEnabled = process.env.DEBUG_API_ERRORS === "true";

if (isProduction && statusCode >= 500) {
  message = debugEnabled
    ? String(err.message || "Unknown server error")
    : "Internal server error";
}

  res.status(statusCode).json({
    success: false,
    message,
    ...(isProduction && debugEnabled && statusCode >= 500
      ? { debugCode: err.code || null, debugName: err.name || null }
      : {}),
    ...(!isProduction && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;