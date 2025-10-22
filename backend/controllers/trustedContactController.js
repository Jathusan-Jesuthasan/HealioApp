// backend/controllers/trustedContactController.js
import TrustedContact from "../models/TrustedContact.js";
import AIRiskResult from "../models/AIRiskResult.js";
import { sendAlertEmail } from "../utils/mailer.js";

/**
 * Get all trusted contacts for the logged-in user
 */
export const getTrustedContacts = async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error fetching trusted contacts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Add a new trusted contact
 */
export const addTrustedContact = async (req, res) => {
  try {
    const { name, relation, phone, email, notifyVia } = req.body;

    if (!name || !email || !relation) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and relation are required",
      });
    }

    const contact = await TrustedContact.create({
      user: req.user._id,
      name,
      relation,
      phone,
      email,
      notifyVia: notifyVia || ["email"],
    });

    // Send confirmation email to the trusted contact
    try {
      const confirmationHTML = generateConfirmationEmail(req.user.name, name);
      await sendAlertEmail({
        toEmail: email,
        toName: name,
        subject: `🛡️ You've Been Added as a Trusted Contact for ${req.user.name}`,
        htmlContent: confirmationHTML,
        textContent: `Hello ${name}, ${req.user.name} has added you as a trusted contact on Healio Mental Health App. You will receive alerts if concerning patterns are detected.`,
      });
      console.log(`✅ Confirmation email sent to ${name} (${email})`);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the entire request if email fails
    }

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error("Error adding trusted contact:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Update a trusted contact
 */
export const updateTrustedContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation, phone, email, notifyVia } = req.body;

    const contact = await TrustedContact.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Trusted contact not found",
      });
    }

    if (name) contact.name = name;
    if (relation) contact.relation = relation;
    if (phone !== undefined) contact.phone = phone;
    if (email) contact.email = email;
    if (notifyVia) contact.notifyVia = notifyVia;

    await contact.save();

    res.json({ success: true, data: contact });
  } catch (error) {
    console.error("Error updating trusted contact:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Delete a trusted contact
 */
export const deleteTrustedContact = async (req, res) => {
  try {
    const { id } = req.params;

    const contact = await TrustedContact.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Trusted contact not found",
      });
    }

    res.json({ success: true, message: "Trusted contact deleted" });
  } catch (error) {
    console.error("Error deleting trusted contact:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Send risk alert to trusted contacts
 */
export const sendRiskAlert = async (req, res) => {
  try {
    const { riskResultId } = req.body;

    // Fetch the risk result
    const riskResult = await AIRiskResult.findOne({
      _id: riskResultId,
      user: req.user._id,
    }).populate("user", "name email");

    if (!riskResult) {
      return res.status(404).json({
        success: false,
        message: "Risk result not found",
      });
    }

    // Check if risk level is high enough to send alert
    const highRiskLevels = ["SERIOUS", "STRESS", "ANGER", "ANXIETY"];
    if (!highRiskLevels.includes(riskResult.riskLevel)) {
      return res.status(400).json({
        success: false,
        message: "Risk level is not high enough to send alert",
      });
    }

    // Get all trusted contacts
    const contacts = await TrustedContact.find({ user: req.user._id });

    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trusted contacts found",
      });
    }

    // Send email to each contact
    const emailPromises = contacts
      .filter((contact) => contact.notifyVia.includes("email"))
      .map((contact) => {
        const emailHTML = generateRiskAlertEmail(
          riskResult.user.name,
          contact.name,
          riskResult
        );

        return sendAlertEmail({
          toEmail: contact.email,
          toName: contact.name,
          subject: `🚨 Mental Health Alert - ${riskResult.user.name} Needs Support`,
          htmlContent: emailHTML,
          textContent: `Mental Health Alert: ${riskResult.user.name} needs support. Risk Level: ${riskResult.riskLevel}`,
        }).catch((err) => {
          console.error(`Failed to send email to ${contact.email}:`, err);
          return null;
        });
      });

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Alert sent to ${contacts.length} trusted contact(s)`,
      notifiedCount: contacts.length,
    });
  } catch (error) {
    console.error("Error sending risk alert:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Send automatic risk alert when high risk is detected
 */
export const sendAutomaticRiskAlert = async (userId, riskResultId) => {
  try {
    // Fetch the risk result
    const riskResult = await AIRiskResult.findOne({
      _id: riskResultId,
      user: userId,
    }).populate("user", "name email");

    if (!riskResult) {
      console.error("Risk result not found");
      return;
    }

    // Check if risk level is high enough to send alert
    const highRiskLevels = ["SERIOUS", "STRESS", "ANGER", "ANXIETY"];
    if (!highRiskLevels.includes(riskResult.riskLevel)) {
      console.log("Risk level not high enough, skipping alert");
      return;
    }

    // Get all trusted contacts
    const contacts = await TrustedContact.find({ user: userId });

    if (contacts.length === 0) {
      console.log("No trusted contacts found");
      return;
    }

    // Send email to each contact
    const emailPromises = contacts
      .filter((contact) => contact.notifyVia.includes("email"))
      .map((contact) => {
        const emailHTML = generateRiskAlertEmail(
          riskResult.user.name,
          contact.name,
          riskResult
        );

        return sendAlertEmail({
          toEmail: contact.email,
          toName: contact.name,
          subject: `🚨 Mental Health Alert - ${riskResult.user.name} Needs Support`,
          htmlContent: emailHTML,
          textContent: `Mental Health Alert: ${riskResult.user.name} needs support. Risk Level: ${riskResult.riskLevel}`,
        }).catch((err) => {
          console.error(`Failed to send email to ${contact.email}:`, err);
          return null;
        });
      });

    await Promise.all(emailPromises);
    console.log(`✅ Alert sent to ${contacts.length} trusted contact(s)`);
  } catch (error) {
    console.error("Error sending automatic risk alert:", error);
  }
};

/**
 * Generate HTML email for risk alert
 */
function generateRiskAlertEmail(userName, contactName, riskResult) {
  const riskColors = {
    SERIOUS: "#EF4444",
    STRESS: "#F59E0B",
    ANGER: "#DC2626",
    ANXIETY: "#F97316",
    MODERATE: "#FBBF24",
    LOW: "#10B981",
  };

  const riskColor = riskColors[riskResult.riskLevel] || "#6B7280";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .alert-badge { display: inline-block; background-color: ${riskColor}; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; }
        .message { font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px; }
        .risk-card { background-color: #fef3c7; border-left: 4px solid ${riskColor}; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .risk-card h3 { color: #92400e; margin: 0 0 10px 0; font-size: 18px; }
        .risk-detail { margin: 10px 0; }
        .risk-detail strong { color: #1f2937; }
        .suggestions { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .suggestions h3 { color: #1e40af; margin: 0 0 15px 0; }
        .suggestions ul { margin: 0; padding-left: 20px; color: #374151; }
        .suggestions li { margin: 8px 0; }
        .cta-button { display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .emergency { background-color: #fee2e2; border: 2px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .emergency h3 { color: #991b1b; margin: 0 0 10px 0; }
        .emergency p { color: #7f1d1d; margin: 5px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Mental Health Alert</h1>
          <span class="alert-badge">${riskResult.riskLevel} RISK LEVEL</span>
        </div>
        
        <div class="content">
          <p class="greeting">Dear ${contactName},</p>
          
          <p class="message">
            You are receiving this alert as a trusted contact for <strong>${userName}</strong>. 
            Our AI mental health monitoring system has detected concerning patterns that require attention.
          </p>
          
          <div class="risk-card">
            <h3>Risk Assessment Details</h3>
            <div class="risk-detail">
              <strong>Risk Level:</strong> ${riskResult.riskLevel}
            </div>
            <div class="risk-detail">
              <strong>Wellness Index:</strong> ${riskResult.wellnessIndex}/100
            </div>
            <div class="risk-detail">
              <strong>Date:</strong> ${new Date(riskResult.date).toLocaleString()}
            </div>
            <div class="risk-detail">
              <strong>Summary:</strong> ${riskResult.summary}
            </div>
          </div>
          
          ${
            riskResult.suggestions && riskResult.suggestions.length > 0
              ? `
          <div class="suggestions">
            <h3>💡 AI Recommendations</h3>
            <ul>
              ${riskResult.suggestions.map((suggestion) => `<li>${suggestion}</li>`).join("")}
            </ul>
          </div>
          `
              : ""
          }
          
          <div class="emergency">
            <h3>⚠️ If This Is An Emergency</h3>
            <p>🚑 National Suicide Prevention Lifeline: 988</p>
            <p>🏥 Emergency Services: 911</p>
            <p>💬 Crisis Text Line: Text HOME to 741741</p>
          </div>
          
          <p class="message">
            <strong>What You Can Do:</strong><br>
            • Reach out to ${userName} with a supportive message<br>
            • Check in on their well-being<br>
            • Encourage them to seek professional help if needed<br>
            • Be present and listen without judgment
          </p>
          
          <p class="message" style="font-style: italic; color: #6b7280;">
            This alert is generated by Healio's AI system to help support ${userName}'s mental health journey. 
            Your compassion and support can make a real difference.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated alert from Healio Mental Health App</p>
          <p>© ${new Date().getFullYear()} Healio. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email for trusted contact confirmation
 */
function generateConfirmationEmail(userName, contactName) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; }
        .message { font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px; }
        .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .info-box h3 { color: #1e40af; margin: 0 0 10px 0; font-size: 18px; }
        .info-box p { color: #1e40af; margin: 5px 0; }
        .what-this-means { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .what-this-means h3 { color: #1e40af; margin: 0 0 15px 0; }
        .what-this-means ul { margin: 0; padding-left: 20px; color: #374151; }
        .what-this-means li { margin: 8px 0; }
        .privacy-note { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .privacy-note p { color: #92400e; margin: 5px 0; font-size: 14px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .badge { display: inline-block; background-color: #10b981; color: white; padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: bold; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🛡️</div>
          <h1>Trusted Contact Confirmation</h1>
          <span class="badge">Mental Health Support</span>
        </div>
        
        <div class="content">
          <p class="greeting">Dear ${contactName},</p>
          
          <p class="message">
            <strong>${userName}</strong> has added you as a trusted contact on the <strong>Healio Mental Health App</strong>. 
            This is an important role that demonstrates their trust in you.
          </p>
          
          <div class="info-box">
            <h3>✨ What This Means</h3>
            <p><strong>You have been designated as a trusted contact</strong> for ${userName}'s mental health monitoring system.</p>
          </div>
          
          <div class="what-this-means">
            <h3>📋 Your Role as a Trusted Contact</h3>
            <ul>
              <li><strong>Automated Alerts:</strong> You will receive email notifications if Healio's AI detects concerning patterns in ${userName}'s mental health activity</li>
              <li><strong>High-Risk Situations:</strong> Alerts are sent only when serious risk levels are detected (Serious, Stress, Anger, Anxiety)</li>
              <li><strong>Support System:</strong> You're part of ${userName}'s safety net and support system</li>
              <li><strong>No Action Required:</strong> This email is just to inform you - no action needed at this time</li>
            </ul>
          </div>
          
          <div class="privacy-note">
            <p><strong>🔒 Privacy & Confidentiality</strong></p>
            <p>You will only receive alert notifications. ${userName}'s detailed mood logs, personal information, and private data remain confidential unless they choose to share it with you directly.</p>
          </div>
          
          <p class="message">
            <strong>What to do if you receive an alert:</strong><br>
            • Reach out to ${userName} with compassion and support<br>
            • Listen without judgment<br>
            • Encourage professional help if needed<br>
            • Be present and available
          </p>
          
          <p class="message">
            <strong>Emergency Resources:</strong><br>
            🚑 National Suicide Prevention Lifeline: <strong>988</strong><br>
            🏥 Emergency Services: <strong>911</strong><br>
            💬 Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong>
          </p>
          
          <p class="message" style="font-style: italic; color: #6b7280;">
            Thank you for being part of ${userName}'s mental health support system. Your presence and care can make a meaningful difference.
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation from Healio Mental Health App</p>
          <p>© ${new Date().getFullYear()} Healio. All rights reserved.</p>
          <p style="margin-top: 10px; font-size: 12px;">If you have questions or concerns, please contact ${userName} directly.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Note: sendAutomaticRiskAlert is already exported inline above with 'export const'
// No need for additional exports here since all functions are exported inline
