import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

/**
 * Transactional email transport for authentication flows.
 *
 * Uses the project's existing email stack (nodemailer). Supported transports:
 *  - "smtp"  : real SMTP delivery (production). Configure SMTP_HOST/PORT/USER/PASS.
 *  - "json"  : nodemailer's jsonTransport — writes the fully-formed MIME message
 *              to the server log. Intended for local development only.
 *
 * When no transport is configured, development defaults to "json" and
 * production fails loudly rather than silently dropping security emails.
 */

export interface AuthEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getFromAddress(): string {
  return (
    process.env.AUTH_EMAIL_FROM ??
    process.env.SMTP_FROM ??
    `no-reply@${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "").split("/")[0] ?? "sendlib.local"}`
  );
}

function getFromName(): string {
  return process.env.AUTH_EMAIL_NAME ?? "Sendlib";
}

function createTransport(): { transporter: nodemailer.Transporter; isJson: boolean } {
  const transport = (process.env.EMAIL_TRANSPORT ?? (process.env.NODE_ENV === "production" ? "smtp" : "json"))
    .trim()
    .toLowerCase();

  if (transport === "json") {
    return { transporter: nodemailer.createTransport({ jsonTransport: true }), isJson: true };
  }

  if (transport === "smtp") {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !port || !user || !pass) {
      throw new Error(
        "SMTP is not configured. Set EMAIL_TRANSPORT=smtp along with SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS."
      );
    }
    const smtpOptions: SMTPTransport.Options = {
      host,
      port: Number(port),
      secure: (process.env.SMTP_SECURE ?? "true") === "true",
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    };
    return { transporter: nodemailer.createTransport(smtpOptions), isJson: false };
  }

  throw new Error(
    `Unknown EMAIL_TRANSPORT "${transport}". Use "smtp" for real delivery or "json" for development logging.`
  );
}

/**
 * Send an authentication email. Throws a descriptive error if delivery is
 * impossible (misconfigured SMTP). Callers decide whether a failure should
 * fail the whole flow or be surfaced to the user.
 */
export async function sendAuthEmail(input: AuthEmailInput): Promise<{ messageId: string | null }> {
  const { transporter, isJson } = createTransport();
  const from = `${getFromName()} <${getFromAddress()}>`;

  const mailOptions: Mail.Options = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    headers: {
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  };

  const info = await transporter.sendMail(mailOptions);
  const messageId = info.messageId ?? null;

  if (isJson) {
    console.warn(
      `[auth-email:json] Subject="${input.subject}" to="${input.to}" — email NOT delivered. ` +
        `Configure SMTP (EMAIL_TRANSPORT=smtp + SMTP_*) for real delivery.`
    );
  }

  return { messageId };
}