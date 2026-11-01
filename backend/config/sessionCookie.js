const SESSION_COOKIE_NAME = "salarySlipSession";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

const setSessionCookie = (res, token) => {
  if (!token) {
    throw new Error("Session token is required.");
  }

  res.cookie(SESSION_COOKIE_NAME, token, cookieOptions);
};

const clearSessionCookie = (res) => {
  const { maxAge, ...clearOptions } = cookieOptions;

  res.clearCookie(SESSION_COOKIE_NAME, clearOptions);
};

const getSessionToken = (req) => {
  return req.cookies?.[SESSION_COOKIE_NAME] || null;
};

module.exports = {
  SESSION_COOKIE_NAME,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
};
