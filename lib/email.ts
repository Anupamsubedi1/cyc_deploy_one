import "server-only";
import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface ContactEmailPayload {
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(payload: ContactEmailPayload) {
  const transporter = createTransporter();
  const to = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${payload.senderName}" <${process.env.SMTP_USER}>`,
    replyTo: payload.senderEmail,
    to,
    subject: `[Contact Form] ${payload.subject || "New Message"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#005d59">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:120px">Name:</td><td style="padding:8px">${escHtml(payload.senderName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px"><a href="mailto:${escHtml(payload.senderEmail)}">${escHtml(payload.senderEmail)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Subject:</td><td style="padding:8px">${escHtml(payload.subject)}</td></tr>
        </table>
        <h3 style="color:#005d59;margin-top:24px">Message:</h3>
        <div style="background:#f9f9f9;padding:16px;border-left:4px solid #005d59;white-space:pre-wrap">${escHtml(payload.message)}</div>
      </div>
    `,
  });
}

export interface GunasEmailPayload {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  complaintType: string;
  message: string;
}

export async function sendGunasEmail(payload: GunasEmailPayload) {
  const transporter = createTransporter();
  const to = process.env.SMTP_USER!;

  await transporter.sendMail({
    from: `"${payload.senderName}" <${process.env.SMTP_USER}>`,
    replyTo: payload.senderEmail,
    to,
    subject: `[Gunaso / Complaint] ${payload.complaintType || "New Complaint"}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#005d59">New Gunaso (Complaint) Submission</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:140px">Name:</td><td style="padding:8px">${escHtml(payload.senderName)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Email:</td><td style="padding:8px"><a href="mailto:${escHtml(payload.senderEmail)}">${escHtml(payload.senderEmail)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone:</td><td style="padding:8px">${escHtml(payload.senderPhone)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Complaint Type:</td><td style="padding:8px">${escHtml(payload.complaintType)}</td></tr>
        </table>
        <h3 style="color:#005d59;margin-top:24px">Complaint Details:</h3>
        <div style="background:#f9f9f9;padding:16px;border-left:4px solid #e05c00;white-space:pre-wrap">${escHtml(payload.message)}</div>
      </div>
    `,
  });
}

const COMPANY_NAME = "CYC Nepal Laghubitta Bittiya Sanstha Ltd.";

export interface ApplicationStatusEmailPayload {
  to: string;
  applicantName: string;
  vacancyTitle: string;
  /** Application status — "rejected" produces the rejection email; anything else is treated as accepted. */
  status: string;
  /** Reason shown to the applicant when the application is rejected. */
  rejectionReason?: string;
}

/**
 * Notifies an applicant that their application has been accepted or rejected.
 * Rejection emails include the admin-provided reason.
 */
export async function sendApplicationStatusEmail(payload: ApplicationStatusEmailPayload) {
  const transporter = createTransporter();
  const isRejected = payload.status === "rejected";
  const name = payload.applicantName?.trim() || "Applicant";
  const title = payload.vacancyTitle?.trim() || "the position";

  const subject = isRejected
    ? `Your application for "${title}" was not successful`
    : `Your application for "${title}" has been accepted`;

  const reasonBlock =
    isRejected && payload.rejectionReason?.trim()
      ? `
        <h3 style="color:#b91c1c;margin-top:24px;margin-bottom:8px">Reason for rejection</h3>
        <div style="background:#fef2f2;padding:16px;border-left:4px solid #dc2626;white-space:pre-wrap;color:#7f1d1d">${escHtml(
          payload.rejectionReason.trim(),
        )}</div>`
      : "";

  const message = isRejected
    ? `We regret to inform you that your application for <strong>${escHtml(
        title,
      )}</strong> has not been successful at this time.`
    : `We are pleased to inform you that your application for <strong>${escHtml(
        title,
      )}</strong> has been accepted. Our team will contact you with the next steps.`;

  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${process.env.SMTP_USER}>`,
    to: payload.to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
        <h2 style="color:#005d59">${escHtml(COMPANY_NAME)}</h2>
        <p>Dear ${escHtml(name)},</p>
        <p>${message}</p>
        ${reasonBlock}
        <p style="margin-top:24px">You can review your application status anytime by logging in to your dashboard.</p>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">Regards,<br/>${escHtml(COMPANY_NAME)}</p>
      </div>
    `,
  });
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
