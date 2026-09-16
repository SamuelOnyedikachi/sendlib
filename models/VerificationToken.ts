import mongoose, { Schema, Document, Model } from "mongoose";

export type VerificationTokenKind = "email_verification" | "password_reset";

export interface IVerificationToken extends Document {
  userId: mongoose.Types.ObjectId;
  kind: VerificationTokenKind;
  /** SHA-256 hex digest of the opaque token sent to the user. */
  tokenHash: string;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["email_verification", "password_reset"], required: true },
    tokenHash: { type: String, required: true, unique: true },
    usedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

VerificationTokenSchema.index({ userId: 1, kind: 1, createdAt: -1 });
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken ??
  mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);

export default VerificationToken;