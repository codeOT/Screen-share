import { Resend } from "resend";
import { FREE_SHARE_LIMIT } from "../account";
import { appUrl } from "./accounts";

type EmailContent = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  button?: { label: string; href: string };
  note?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] || char;
  });
}

function layout(content: EmailContent) {
  const home = appUrl();
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#6f6a64;">${paragraph}</p>`,
    )
    .join("");
  const button = content.button
    ? `<p style="margin:22px 0 0;"><a href="${escapeHtml(content.button.href)}" style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;line-height:1;padding:14px 22px;border-radius:999px;">${escapeHtml(content.button.label)}</a></p>`
    : "";
  const note = content.note
    ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6f6a64;">${content.note}</p>`
    : "";
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4efe8;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
            <tr>
              <td style="padding:0 8px 18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;letter-spacing:-0.03em;color:#141414;">
                <a href="${home}" style="color:#141414;text-decoration:none;">Screnn</a>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border-radius:28px;padding:36px 32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
                <p style="margin:0 0 10px;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6f6a64;">${escapeHtml(content.eyebrow)}</p>
                <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;letter-spacing:-0.04em;font-weight:600;color:#141414;">${escapeHtml(content.title)}</h1>
                ${paragraphs}
                ${button}
                ${note}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 8px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6f6a64;">
                Screnn · The video stays between browsers.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function deliver(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email is not set up. Add RESEND_API_KEY.");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Screnn <onboarding@resend.dev>",
    to,
    subject,
    html,
    replyTo,
  });
  if (error) {
    const message = error.message || "Could not send the email.";
    if (/only send testing emails/i.test(message)) {
      throw new Error("The free Resend sender can only email the address on your Resend account.");
    }
    throw new Error(message);
  }
}

export function mailError(err: unknown) {
  console.error("[screnn] email", err);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await deliver(
    to,
    "Welcome to Screnn",
    layout({
      eyebrow: "Welcome",
      title: `You're in, ${name}.`,
      paragraphs: [
        `${safeName}, your account is ready.`,
        "Share a screen, send the six-character code, and people watch it live in the browser.",
      ],
      button: { label: "Open your dashboard", href: `${appUrl()}/dashboard` },
    }),
  );
}

export async function sendBillingEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  await deliver(
    to,
    "Your Screnn plan",
    layout({
      eyebrow: "Billing",
      title: "You're on the Free plan.",
      paragraphs: [
        `${safeName}, nothing is charged. There is no card on file.`,
        `Free includes ${FREE_SHARE_LIMIT} shares, up to 3 people, for 1 hour each. The price is $0.00.`,
        "Plus is $6.99 a month for 8 people. Premium is $15.99 a month.",
      ],
      button: { label: "View billing", href: `${appUrl()}/dashboard/billing` },
      note: "No invoice was created, because this plan is free.",
    }),
  );
}

export async function sendResetEmail(to: string, token: string) {
  const link = `${appUrl()}/reset-password?token=${token}`;
  await deliver(
    to,
    "Reset your Screnn password",
    layout({
      eyebrow: "Password",
      title: "Choose a new password.",
      paragraphs: ["We got a request to reset the password for this account. The link works for 1 hour."],
      button: { label: "Reset password", href: link },
      note: `If the button does not open, paste this link into your browser:<br>${escapeHtml(link)}`,
    }),
  );
}

export async function sendPasswordChangedEmail(to: string, name: string) {
  await deliver(
    to,
    "Your Screnn password was changed",
    layout({
      eyebrow: "Security",
      title: "Your password was changed.",
      paragraphs: [
        `${escapeHtml(name)}, the password on your Screnn account was just updated.`,
        "If you made this change, you can ignore this email.",
      ],
      button: { label: "I didn't do this", href: `${appUrl()}/forgot-password` },
    }),
  );
}

export async function sendEmailChangedEmail(to: string, name: string, nextEmail: string) {
  await deliver(
    to,
    "Your Screnn email was changed",
    layout({
      eyebrow: "Security",
      title: "Your email address was changed.",
      paragraphs: [
        `${escapeHtml(name)}, this account now uses ${escapeHtml(nextEmail)}.`,
        "If you didn't make that change, reset your password.",
      ],
      button: { label: "Reset password", href: `${appUrl()}/forgot-password` },
    }),
  );
}

export async function sendContactEmail(input: { name: string; email: string; message: string }) {
  const to = process.env.CONTACT_EMAIL?.trim();
  if (!to) throw new Error("Contact email is not set up. Add CONTACT_EMAIL.");
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br>");
  await deliver(
    to,
    `Message from ${input.name.replace(/[\r\n]+/g, " ")}`,
    layout({
      eyebrow: "Contact",
      title: "New message",
      paragraphs: [`${safeName} wrote from ${safeEmail}.`, safeMessage],
    }),
    input.email,
  );
}

export async function sendShareLimitEmail(to: string, name: string) {
  await deliver(
    to,
    "You've used your 3 free shares",
    layout({
      eyebrow: "Plan",
      title: "The free plan is used up.",
      paragraphs: [
        `${escapeHtml(name)}, those ${FREE_SHARE_LIMIT} shares are finished.`,
        "Plus covers 8 people in a room. Premium is the plan with no set viewer limit.",
      ],
      button: { label: "See plans", href: `${appUrl()}/pricing` },
    }),
  );
}
