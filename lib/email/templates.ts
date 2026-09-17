/**
 * Branded transactional email shell for authentication flows.
 * Inline-styled, table-based HTML for maximum email client compatibility.
 */

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export interface RenderEmailOptions {
  heading: string;
  preheader: string;
  bodyHtml: string;
  actionUrl?: string;
  actionLabel?: string;
  ignoreNote?: string;
}

/**
 * Shared shell: Sendlib wordmark, single-column card, action button,
 * safety/ignore note and footer.
 */
export function renderAuthEmail(opts: RenderEmailOptions): string {
  const action = opts.actionUrl
    ? `
      <tr>
        <td style="padding:16px 28px 24px 28px;">
          <a href="${escapeHtml(opts.actionUrl)}" style="background-color:#000000;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;display:inline-block;">
            ${escapeHtml(opts.actionLabel ?? "Continue")}
          </a>
        </td>
      </tr>`
    : "";

  const fallbackUrl = opts.actionUrl
    ? `<tr><td style="padding:0 28px 16px 28px;"><p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#6b7280;line-height:1.5;margin:0 0 4px 0;">If the button above doesn't work, copy and paste this link into your browser:</p><p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#2563eb;line-height:1.5;margin:0;word-break:break-all;">${escapeHtml(opts.actionUrl)}</p></td></tr>`
    : "";

  const ignoreNote = opts.ignoreNote
    ? `<tr><td style="padding:16px 28px 0 28px;"><p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.6;margin:0;border-top:1px solid #e5e7eb;padding-top:16px;">${opts.ignoreNote}</p></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(opts.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;">
    <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(opts.preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#111827;margin:0;">Send<span style="color:#d97706;">lib</span></p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 8px 28px;">
                <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#111827;margin:0 0 8px 0;">${escapeHtml(opts.heading)}</h1>
                <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#4b5563;line-height:1.6;margin:0;">${escapeHtml(opts.preheader)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${opts.bodyHtml}
                </table>
              </td>
            </tr>
            ${action}
            ${fallbackUrl}
            ${ignoreNote}
            <tr>
              <td style="padding:24px 28px 28px 28px;">
                <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:#9ca3af;line-height:1.6;margin:0;border-top:1px solid #e5e7eb;padding-top:16px;">
                  You received this email because a request was made on your Sendlib account.
                  If you did not make this request, you can safely ignore this email.
                  <br /><br />
                  &copy; ${new Date().getFullYear()} Sendlib
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Wrap a paragraph in a table row. */
export function row(paragraphHtml: string): string {
  return `<tr><td style="padding:0 0 12px 0;">${paragraphHtml}</td></tr>`;
}

export function paragraph(text: string, opts: { strong?: boolean; muted?: boolean } = {}): string {
  const color = opts.muted ? "#6b7280" : "#374151";
  const weight = opts.strong ? "600" : "400";
  return `<p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:${color};line-height:1.6;margin:0;font-weight:${weight};">${escapeHtml(text)}</p>`;
}

/** Monospace block for lists of sensitive artifacts (e.g. recovery codes). */
export function bulletList(items: string[]): string {
  return items
    .map(
      (item) =>
        `<p style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;font-size:14px;color:#374151;line-height:1.6;margin:0 0 8px 0;background-color:#f3f4f6;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;">${escapeHtml(item)}</p>`
    )
    .join("");
}

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
