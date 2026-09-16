import mongoose, { Schema, Document, Model } from "mongoose";

export type SessionStatus = "active" | "pending";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  /** SHA-256 hex digest of the opaque session token. */
  tokenHash: string;
  userAgent?: string;
  ip?: string;
  /** pending = awaiting a second factor before the session is usable. */
  status: SessionStatus;
  failedTwoFactorAttempts: number;
  lastActiveAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String },
    ip: { type: String },
    status: { type: String, enum: ["active", "pending"], default: "active" },
    failedTwoFactorAttempts: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: true }
);

SessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISession> =
  mongoose.models.Session ?? mongoose.model<ISession>("Session", SessionSchema);

export default Session;