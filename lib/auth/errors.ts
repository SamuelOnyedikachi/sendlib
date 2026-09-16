export class AuthError extends Error {
  readonly code: string;
  readonly status: number;
  readonly expose: boolean;

  constructor(message: string, code: string, status = 400, expose = true) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
    this.expose = expose;
  }
}

export const AuthErrors = {
  invalidCredentials: () =>
    new AuthError("Incorrect email or password.", "invalid_credentials", 401),
  tooManyAttempts: () =>
    new AuthError(
      "Too many failed attempts. Please wait a few minutes and try again.",
      "too_many_attempts",
      429
    ),
  accountDisabled: () =>
    new AuthError("Incorrect email or password.", "invalid_credentials", 401, false),
  invalidOrExpiredToken: () =>
    new AuthError(
      "This link is invalid or has expired. Please request a new one.",
      "invalid_or_expired_token",
      400
    ),
  emailAlreadyExists: () =>
    new AuthError("An account with this email already exists. Try logging in instead.", "email_exists", 409),
  emailNotVerified: () => new AuthError("Please verify your email address first.", "email_not_verified", 403),
  twoFactorRequired: () => new AuthError("Two-factor authentication is required.", "2fa_required", 403),
  invalidTwoFactorCode: () =>
    new AuthError("The code you entered is invalid or has expired.", "invalid_2fa_code", 401),
  twoFactorNotEnabled: () =>
    new AuthError("Two-factor authentication is not enabled on this account.", "2fa_not_enabled", 400),
  invalidCurrentPassword: () => new AuthError("Your current password is incorrect.", "invalid_password", 401),
  noPasswordSet: () =>
    new AuthError(
      "This account was created with a social login and has no password. Set a password to use this feature.",
      "no_password_set",
      400
    ),
  weakPassword: (reason: string) => new AuthError(reason, "weak_password", 400),
  invalidInput: (message: string) => new AuthError(message, "invalid_input", 400),
  emailUnverified: () => new AuthError("Your email address is not verified.", "email_not_verified", 403),
} as const;