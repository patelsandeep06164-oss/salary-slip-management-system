
const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`,
    err
  );

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists.";
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID.";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // Invalid JSON request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  if (process.env.NODE_ENV === "production" && statusCode >= 500) {
    message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorMiddleware;
