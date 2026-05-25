import { Resend } from "resend";
import type { DonationReceiptPayload, DonationReceiptProvider } from "@/lib/email/receipt";
import type {
  EventReminderEmailPayload,
  RegistrationEmailPayload,
  RegistrationEmailProvider,
} from "@/lib/email/provider";

const DEFAULT_FROM_EMAIL = "Church App <onboarding@resend.dev>";

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  });
}

function formatMoney(amountPence: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountPence / 100);
}

function baseTemplate(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
            <tr>
              <td>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:32px;color:#0f172a;">${escapeHtml(title)}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function registrationConfirmationHtml(payload: RegistrationEmailPayload) {
  return baseTemplate(
    "Registration confirmed",
    `<p style="margin:0 0 12px;font-size:16px;line-height:24px;">You are registered for <strong>${escapeHtml(payload.eventTitle)}</strong>.</p>
     <p style="margin:0 0 18px;font-size:16px;line-height:24px;">Event date: ${escapeHtml(formatDateTime(payload.eventStartsAt))}</p>
     <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#475569;">Your check-in QR token:</p>
     <p style="margin:0;padding:14px 16px;background:#f1f5f9;border-radius:8px;font-family:monospace;font-size:15px;line-height:22px;word-break:break-all;">${escapeHtml(payload.qrToken)}</p>`,
  );
}

function eventReminderHtml(payload: EventReminderEmailPayload) {
  return baseTemplate(
    "Event reminder",
    `<p style="margin:0 0 12px;font-size:16px;line-height:24px;">This is a reminder that <strong>${escapeHtml(payload.eventTitle)}</strong> starts in about 24 hours.</p>
     <p style="margin:0 0 18px;font-size:16px;line-height:24px;">Event date: ${escapeHtml(formatDateTime(payload.eventStartsAt))}</p>
     <p style="margin:0;font-size:14px;line-height:22px;color:#475569;">If you can no longer attend, contact the church team so your space can be released.</p>`,
  );
}

function donationReceiptHtml(payload: DonationReceiptPayload) {
  return baseTemplate(
    "Donation receipt",
    `<p style="margin:0 0 12px;font-size:16px;line-height:24px;">Thank you for your gift.</p>
     <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">
       <tr>
         <td style="padding:8px 0;color:#475569;">Amount</td>
         <td style="padding:8px 0;text-align:right;font-weight:700;">${escapeHtml(formatMoney(payload.amountPence, payload.currency))}</td>
       </tr>
       <tr>
         <td style="padding:8px 0;color:#475569;">Fund</td>
         <td style="padding:8px 0;text-align:right;">${escapeHtml(payload.fundName)}</td>
       </tr>
       <tr>
         <td style="padding:8px 0;color:#475569;">Timestamp</td>
         <td style="padding:8px 0;text-align:right;">${escapeHtml(formatDateTime(payload.receiptedAt))}</td>
       </tr>
     </table>`,
  );
}

export class ResendEmailProvider implements RegistrationEmailProvider, DonationReceiptProvider {
  async sendRegistrationConfirmation(payload: RegistrationEmailPayload): Promise<void> {
    const { error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: payload.to,
      subject: `Registration confirmed: ${payload.eventTitle}`,
      html: registrationConfirmationHtml(payload),
    });

    if (error) {
      throw new Error(`Resend registration email failed: ${error.message}`);
    }
  }

  async sendEventReminder(payload: EventReminderEmailPayload): Promise<void> {
    const { error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: payload.to,
      subject: `Reminder: ${payload.eventTitle} is tomorrow`,
      html: eventReminderHtml(payload),
    });

    if (error) {
      throw new Error(`Resend event reminder failed: ${error.message}`);
    }
  }

  async sendDonationReceipt(payload: DonationReceiptPayload): Promise<void> {
    const { error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: payload.to,
      subject: `Donation receipt: ${formatMoney(payload.amountPence, payload.currency)}`,
      html: donationReceiptHtml(payload),
    });

    if (error) {
      throw new Error(`Resend donation receipt failed: ${error.message}`);
    }
  }
}
