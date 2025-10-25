import TrustedContact from "../models/TrustedContact.js";
import { sendSMS } from "../utils/twilio.js";

export const sendSOS = async (req, res) => {
  try {
    const { useLocation, lat, lon, message } = req.body;
    const userId = req.user._id || req.user; // depending on your auth middleware
    const contacts = await TrustedContact.find({ user: userId, accepted: true });

    if (!contacts.length) {
      return res.status(400).json({ message: "No trusted contacts to notify." });
    }

    const mapLink = useLocation && lat && lon ? ` https://maps.google.com/?q=${lat},${lon}` : "";
    const payload = `[HEALIO SOS]\n${message || "I need help."}${mapLink}`;

    const results = [];
    for (const c of contacts) {
      if (c.phone) {
        try {
          await sendSMS(c.phone, payload);
          results.push({ contact: c.name, status: "sent" });
        } catch (err) {
          results.push({ contact: c.name, status: "failed", error: err.message });
        }
      }
    }

    return res.json({ ok: true, message: "Alerts processed.", results });
  } catch (err) {
    console.error("sendSOS error:", err);
    return res.status(500).json({ message: "Failed to send SOS." });
  }
};
