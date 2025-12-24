import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
export const sendRequestNotificationMail = async ({
  to,
  subject,
  title,
  employeeName,
  details,
}) => {
  await transporter.sendMail({
    from: `"HRMS" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family:Arial; line-height:1.6">
        <h2>${title}</h2>

        <p><b>Employee:</b> ${employeeName}</p>

        <p><b>Details:</b></p>
        <ul>
          ${details.map(d => `<li>${d}</li>`).join("")}
        </ul>

        <p>
          Please login to HRMS to review this request.
        </p>

        <p>
          <a href="${process.env.FRONTEND_URL}">
            Open HRMS
          </a>
        </p>

        <br/>
        <p>HRMS System</p>
      </div>
    `,
  });
};

export const sendUserCredentialsMail = async ({
  to,
  name,
  email,
  password,
}) => {
  await transporter.sendMail({
    from: `"HRMS" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your HRMS Login Credentials",
    html: `
      <div style="font-family:Arial; line-height:1.6">
        <h2>Welcome to HRMS, ${name}</h2>

        <p>Your account has been created by Admin.</p>

        <p><strong>Login Details:</strong></p>
        <ul>
          <li>Email: <b>${email}</b></li>
          <li>Password: <b>${password}</b></li>
        </ul>

        <p>
          Login here:
          <a href="${process.env.FRONTEND_URL}">
            ${process.env.FRONTEND_URL}
          </a>
        </p
        <br/>
        <p>HRMS Team</p>
      </div>
    `,
  });
};
