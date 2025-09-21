// backend/utils/sendEmail.js
import nodemailer from "nodemailer";

/**
 * Utility to send email using Gmail + App Password.
 * Make sure your .env has:
 *   EMAIL=youraddress@gmail.com
 *   EMAIL_PASS=your_app_password
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,      // Gmail address
        pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password!)
      },
    });

    // Mail content
    const mailOptions = {
      from: `"Healio Support" <${process.env.EMAIL}>`,
      to,
      subject,
      html,
    };

    // Send
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw error;
  }
};
