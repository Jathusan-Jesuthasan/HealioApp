import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  // Configure using env (use Mailtrap for dev)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Healio" <no-reply@healio.app>',
    to,
    subject,
    html,
  });
}
