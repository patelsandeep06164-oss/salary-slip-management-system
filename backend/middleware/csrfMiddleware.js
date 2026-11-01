const crypto = require("crypto");

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  path: "/",
};

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",

  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => {
      try {
        return new URL(url).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean),
]);

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const getRequestOrigin = (req) => {
  const origin = req.get("origin");

  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }

  const referer = req.get("referer");

  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
};

// Issue or reuse a CSRF token.
const issueCsrfToken = (req, res, next) => {
  try {
    let token = req.cookies?.[CSRF_COOKIE_NAME];

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      token = generateCsrfToken();
    }

    res.cookie(CSRF_COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.locals.csrfToken = token;

    next();
  } catch (error) {
    next(error);
  }
};

// Validate Origin and CSRF token on state-changing requests.
const verifyCsrfToken = (req, res, next) => {
  try {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];

    if (safeMethods.includes(req.method)) {
      return next();
    }

    const requestOrigin = getRequestOrigin(req);

    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return res.status(403).json({
        success: false,
        message: "Request origin is not allowed.",
      });
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        success: false,
        message: "CSRF token is missing.",
      });
    }

    if (
      !/^[a-f0-9]{64}$/i.test(cookieToken) ||
      !/^[a-f0-9]{64}$/i.test(headerToken)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid CSRF token.",
      });
    }

    const cookieBuffer = Buffer.from(cookieToken, "hex");
    const headerBuffer = Buffer.from(headerToken, "hex");

    if (
      cookieBuffer.length !== headerBuffer.length ||
      !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      return res.status(403).json({
        success: false,
        message: "CSRF verification failed.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueCsrfToken,
  verifyCsrfToken,
  CSRF_COOKIE_NAME,
};
