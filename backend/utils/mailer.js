// backend/utils/mailer.js

import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Sends an alert email using Nodemailer + Gmail SMTP
 * @param {Object} options
 * @param {string} options.toEmail - Recipient email address
 * @param {string} options.toName - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - HTML email content
 * @param {string} options.textContent - Plain text email content
 */
export const sendAlertEmail = async ({ toEmail, toName, subject, htmlContent, textContent }) => {
  try {
    // ✅ Check if environment variables exist
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error("Missing SMTP credentials. Please check .env file.");
    }

    // ✅ 1. Create transporter (Gmail SMTP)
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can also use 'Outlook', 'Yahoo', or custom SMTP
      auth: {
        user: process.env.SMTP_USER, // Your Gmail address
        pass: process.env.SMTP_PASS, // Your Gmail App Password
      },
    });

    // ✅ 2. Define email details
    const mailOptions = {
      from: `"Healio Mental Health Alert" <${process.env.SMTP_USER}>`,
      to: `${toName} <${toEmail}>`,
      subject: subject || "Healio Alert Notification",
      text: textContent || "This is a plain text version of the email.",
      html: htmlContent || "<p>This is the HTML version of the email.</p>",
    };

    // ✅ 3. Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);

    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
    throw error;
  }
};
