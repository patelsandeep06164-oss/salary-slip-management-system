const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadRoot = path.resolve(__dirname, "../uploads");
const employeeDocumentsDir = path.join(uploadRoot, "employee-documents");
const salarySlipsDir = path.join(uploadRoot, "salary-slips");

for (const directory of [employeeDocumentsDir, salarySlipsDir]) {
  fs.mkdirSync(directory, { recursive: true });
}

const allowedDocumentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, employeeDocumentsDir);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    callback(null, uniqueName);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    !allowedDocumentTypes.has(file.mimetype) ||
    !allowedExtensions.has(extension)
  ) {
    const error = new Error(
      "Only PDF, JPG, JPEG and PNG documents are allowed."
    );
    error.statusCode = 400;
    return callback(error);
  }

  callback(null, true);
};

const uploadEmployeeDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

module.exports = {
  uploadEmployeeDocument,
  employeeDocumentsDir,
  salarySlipsDir,
};