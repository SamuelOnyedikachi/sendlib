import mongoose, { Schema, Document, Model } from "mongoose";

export type SecurityEventType =
  | "signup"
  | "login"
  | "login_2fa"
  | "login_recovery_code"
  | "logout"
  | "email_verified"
  | "verification_email_sent"
  | "password_reset_requested"
  | "password_reset"
  | "password_changed"
  | "two_factor_setup_started"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "two_factor_failed";

export interface ISecurityEvent extends Document {
  userId?: mongoose.Types.ObjectId;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const SecurityEventSchema = new Schema<ISecurityEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: [
        "signup",
        "login",
        "login_2fa",
        "login_recovery_code",
        "logout",
        "email_verified",
        "verification_email_sent",
        "password_reset_requested",
        "password_reset",
        "password_changed",
        "two_factor_setup_started",
        "two_factor_enabled",
        "two_factor_disabled",
        "two_factor_failed",
      ],
      required: true,
      index: true,
    },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SecurityEventSchema.index({ userId: 1, createdAt: -1 });

const SecurityEvent: Model<ISecurityEvent> =
  mongoose.models.SecurityEvent ??
  mongoose.model<ISecurityEvent>("SecurityEvent", SecurityEventSchema);

export default SecurityEvent;