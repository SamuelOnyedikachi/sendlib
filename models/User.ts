import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITwoFactorRecoveryCode {
  hash: string;
  usedAt?: Date;
}

export interface ITwoFactorConfig {
  enabled: boolean;
  /** Encrypted base32 TOTP secret (AES-256-CBC via ENCRYPTION_KEY). */
  secret?: string;
  /** Encrypted base32 secret kept while the user is confirming 2FA setup. */
  pendingSecret?: string;
  /** Recovery codes generated during setup, stored as SHA-256 hashes. */
  recoveryCodes?: ITwoFactorRecoveryCode[];
  /** Recovery codes generated during setup but not yet activated. */
  pendingRecoveryCodes?: ITwoFactorRecoveryCode[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  githubId?: string;
  googleId?: string;
  email?: string;
  displayName: string;
  avatar?: string;
  /** Argon2id hash of the account password (email/password accounts only). */
  passwordHash?: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  /** Soft-blocked accounts cannot log in or use API keys. */
  disabled: boolean;
  disabledReason?: string;
  twoFactor?: ITwoFactorConfig;
  plan: "free" | "pro";
  subscriptionId?: string;
  subscriptionCode?: string;
  subscriptionToken?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
  lastPaymentAt?: Date;
  currentPeriodEnd?: Date;
  billingCurrency?: string;
  monthlySentCount?: number;
  monthlyLimitResetAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TwoFactorRecoveryCodeSchema = new Schema<ITwoFactorRecoveryCode>(
  {
    hash: { type: String, required: true },
    usedAt: { type: Date },
  },
  { _id: false }
);

const TwoFactorSchema = new Schema<ITwoFactorConfig>(
  {
    enabled: { type: Boolean, default: false },
    secret: { type: String },
    pendingSecret: { type: String },
    recoveryCodes: { type: [TwoFactorRecoveryCodeSchema], default: [] },
    pendingRecoveryCodes: { type: [TwoFactorRecoveryCodeSchema], default: [] },
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    githubId: { type: String, sparse: true, index: true },
    googleId: { type: String, sparse: true, index: true },
    email: { type: String },
    displayName: { type: String, required: true },
    avatar: { type: String },
    passwordHash: { type: String },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    disabled: { type: Boolean, default: false },
    disabledReason: { type: String },
    twoFactor: { type: TwoFactorSchema, default: undefined },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    subscriptionId: { type: String },
    subscriptionCode: { type: String, sparse: true, index: true },
    subscriptionToken: { type: String },
    subscriptionStatus: { type: String, enum: ["active", "canceled", "past_due", "none"], default: "none" },
    lastPaymentAt: { type: Date },
    currentPeriodEnd: { type: Date },
    billingCurrency: { type: String },
    monthlySentCount: { type: Number, default: 0 },
    monthlyLimitResetAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Emails are normalized (lowercased + trimmed) before writes so this unique
// index reliably prevents duplicate accounts.
UserSchema.index(
  { email: 1 },
  { unique: true, sparse: true, collation: { locale: "en", strength: 2 } }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
