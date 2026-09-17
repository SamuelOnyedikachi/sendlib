import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import MailComposer from "nodemailer/lib/mail-composer";
import { connectDB } from "@/lib/db";
import GmailAccount from "@/models/GmailAccount";
import { encrypt, decrypt } from "@/lib/encryption";
import axiosSrv from "@/lib/axios";

/**
 * Transactional email transport for authentication flows.
 *
 * First attempts to deliver via Sendlib's connected Gmail account (using Google OAuth2).
 * Falls back to SMTP or JSON logging if no connected Gmail account exists.
 */

export interface AuthEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

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

async function trySendViaConnectedGmail(
  input: AuthEmailInput
): Promise<{ messageId: string | null } | null> {
  try {
    await connectDB();

    const targetEmail = process.env.SYSTEM_GMAIL_EMAIL || "samueltuoyo9082@gmail.com";
    let account = await GmailAccount.findOne({ gmailEmail: targetEmail, connected: true });
    if (!account) {
      account = await GmailAccount.findOne({ connected: true });
    }
    if (!account) return null;

    const bufferMs = 5 * 60 * 1000;
    let accessToken = decrypt(account.encryptedAccessToken);

    if (
      GOOGLE_CLIENT_ID &&
      GOOGLE_CLIENT_SECRET &&
      account.tokenExpiresAt.getTime() - bufferMs <= Date.now()
    ) {
      try {
        const refreshRes = await axiosSrv.post(
          "https://oauth2.googleapis.com/token",
          new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: decrypt(account.encryptedRefreshToken),
            grant_type: "refresh_token",
          }).toString(),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        const refreshed = refreshRes.data;
        if (refreshed.access_token) {
          account.encryptedAccessToken = encrypt(refreshed.access_token);
          account.tokenExpiresAt = refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1000)
            : new Date(Date.now() + 3600 * 1000);
          await account.save();
          accessToken = refreshed.access_token;
        }
      } catch (err) {
        console.error("Auth email token refresh failed:", err instanceof Error ? err.message : err);
      }
    }

    const from = `${getFromName()} <${account.gmailEmail}>`;
    const mail = new MailComposer({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: {
        "X-Auto-Response-Suppress": "OOF, AutoReply",
      },
    });

    const messageBuffer = await mail.compile().build();
    const encodedMessage = messageBuffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await axiosSrv.post(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      { raw: encodedMessage },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { messageId: result.data?.id ?? null };
  } catch (err) {
    console.error("Could not send auth email via connected Gmail, trying SMTP fallback:", err instanceof Error ? err.message : err);
    return null;
  }
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

export async function sendAuthEmail(input: AuthEmailInput): Promise<{ messageId: string | null }> {
  // 1. First priority: Use Sendlib's connected Gmail OAuth account
  const gmailResult = await trySendViaConnectedGmail(input);
  if (gmailResult) {
    return gmailResult;
  }

  // 2. Fallback: SMTP or JSON development transport
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
      `[auth-email:json] Subject="${input.subject}" to="${input.to}": email NOT delivered. ` +
        `Connect a Gmail account in Sendlib or configure SMTP (EMAIL_TRANSPORT=smtp + SMTP_*) for real delivery.`
    );
  }

  return { messageId };
}