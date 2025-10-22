import dotenv from "dotenv";
dotenv.config();
import { sendAlertEmail } from "./utils/mailer.js";

(async () => {
  try {
    const response = await sendAlertEmail({
      toEmail: "jesujathu4@gmail.com", // 👈 your real email for testing
      toName: "Tester",
      subject: "Test Email from Healio App",
      htmlContent: "<h1>Hello from Healio!</h1><p>This is a test email via Nodemailer.</p>",
      textContent: "Hello from Healio! This is a test email via Nodemailer."
    });

    console.log("✅ Email sent successfully:", response);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
})();
