import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Convert form data to HTML
const formDataToHtml = (formData = {}) => {
  let rows = "";

  for (const key of Object.keys(formData)) {
    const val = formData[key] == null ? "" : String(formData[key])
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    rows += `
      <tr>
        <td style="padding:6px;border:1px solid #eee;font-weight:600;">${key}</td>
        <td style="padding:6px;border:1px solid #eee;">${val}</td>
      </tr>`;
  }

  return `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
};

/**
 * ✔ Send confirmation to user
 */
export const sendMailToUser = async ({ email, name, formName }) => {
  if (!email) return;

  const fromAddr = process.env.FROM_EMAIL || process.env.SMTP_USER;

  const html = `
    <div style="font-family:Arial;">
      <h3>Hi ${name || "there"},</h3>
      <p>Thank you for filling out the <strong>${formName}</strong> form.</p>
      <p>We will get back to you shortly.</p>
      <br>
      <p>Regards,<br>Lyfshilp Academy Team</p>
    </div>
  `;

  return transporter.sendMail({
    from: `"Lyfshilp Academy" <${fromAddr}>`,
    to: email,
    subject: `Thanks for submitting the ${formName} form`,
    html,
  });
};

/**
 * ✔ Send form to Admins
 */
export const sendMailToAdmins = async ({ formName, name, email, formData = {}, meta = {} }) => {
  const adminList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminList.length === 0) {
    throw new Error("No admin emails configured in ADMIN_EMAILS");
  }

  const submittedAt = meta.submittedAt || new Date().toISOString();

  const html = `
    <div style="font-family:Arial;">
      <h3>New form submission — ${formName}</h3>
      <p><strong>Name:</strong> ${name || "—"}</p>
      <p><strong>Email:</strong> ${email || "—"}</p>
      <p><strong>Submitted at:</strong> ${new Date(submittedAt).toLocaleString()}</p>

      ${formDataToHtml(formData)}

      <hr/>
      <p style="font-size:12px;color:#666;">
        Page: ${meta.path || "unknown"} |
        User Agent: ${meta.userAgent || "unknown"}
      </p>
    </div>
  `;

  const fromAddr = process.env.FROM_EMAIL || process.env.SMTP_USER;

  return transporter.sendMail({
    from: `"Lyfshilp Notifications" <${fromAddr}>`,
    to: adminList,
    subject: `[Lyfshilp] New ${formName} submission — ${name || ""}`,
    html,
    replyTo: email || undefined,
  });
};
