require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { validateEnv } = require("./config/env");

// Scheduled jobs
const monthlyPayrollJob = require("./jobs/monthlyPayrollJob");
const monthlySalarySlipEmailJob = require("./jobs/monthlySalarySlipEmailJob");
const retryFailedEmailsJob = require("./jobs/retryFailedEmailsJob");

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to MongoDB before starting the jobs
    await connectDB();

    // Start scheduled jobs only after successful DB connection
    monthlyPayrollJob.start();
    monthlySalarySlipEmailJob.start();
    retryFailedEmailsJob.start();

    console.log("Monthly payroll job started.");
    console.log("Monthly salary slip email job started.");
    console.log("Failed email retry job started.");

    const server = app.listen(PORT, () => {
      console.log(`Salary Slip API running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    let isShuttingDown = false;

    const shutdown = (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`${signal} received. Shutting down...`);

      // Stop all scheduled jobs
      monthlyPayrollJob.stop();
      monthlySalarySlipEmailJob.stop();
      retryFailedEmailsJob.stop();

      server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
      });

      // Prevent indefinite waiting for the HTTP server to close
      setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
