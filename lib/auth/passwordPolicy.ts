import { z } from "zod";

/**
 * Client-safe validation schemas (no server-only imports). The same schemas
 * are re-validated server-side in lib/auth/passwords.ts — never trust the
 * client alone.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must be at most 128 characters long.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .refine((v) => v === v.trim(), "Password cannot start or end with whitespace.");

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

export const MANUAL_2FA_CODE_SCHEMA = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");