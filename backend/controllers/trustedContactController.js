import TrustedContact from "../models/TrustedContact.js";
import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

// ✅ Add a trusted contact
export const addTrustedContact = async (req, res) => {
  try {
    // Enforce max 3 trusted contacts per youth
    const existingCount = await TrustedContact.countDocuments({ youthId: req.user._id });
    if (existingCount >= 3) {
      return res.status(400).json({ message: 'You can only add up to 3 trusted contacts.' });
    }
    const { name, email, phone, relationship, privacyLevel } = req.body;
    // Require either email or phone to identify a registered Healio user
    if (!email && !phone) {
      return res.status(400).json({ message: 'Provide email or phone of the trusted person (they must have a Healio account).' });
    }

    // Attempt to find an existing Healio user by email or phone
    let existingUser = null;
    if (email) existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (!existingUser && phone) existingUser = await User.findOne({ phone: String(phone) });

    // If the contact is not a registered user, return 400 and include an invite link when possible
    if (!existingUser) {
      const inviteCode = crypto.randomBytes(4).toString("hex");
      const inviteLink = email ? `${process.env.CLIENT_URL}/trusted-invite/${inviteCode}` : null;
      return res.status(400).json({ message: 'The contact is not a registered Healio user. Please ask them to create an account first.', inviteLink });
    }

    const inviteCode = crypto.randomBytes(4).toString("hex");

    const newContact = await TrustedContact.create({
      youthId: req.user._id,
      name,
      email,
      phone,
      relationship,
      privacyLevel,
      inviteCode,
      // link immediately to the existing user's id so frontend can use trustedId when starting chats
      trustedId: existingUser._id,
    });

    // Also persist reference in the youth user's document for quick access
    try {
      await User.findByIdAndUpdate(req.user._id, { $push: { trustedContacts: newContact._id } });
    } catch (e) {
      // non-fatal: log and continue
      console.warn('Could not push trusted contact to user document:', e.message || e);
    }

    if (email) {
      const inviteLink = `${process.env.CLIENT_URL}/trusted-invite/${inviteCode}`;
      await sendEmail({
        to: email,
        subject: "You’ve been invited as a Trusted Contact on Healio 💚",
        html: `<h3>${name}, you’ve been invited!</h3>
               <p>Click to accept: <a href="${inviteLink}">${inviteLink}</a></p>`,
      });
    }

    res.json(newContact);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all trusted contacts for a youth
export const getTrustedContacts = async (req, res) => {
  const contacts = await TrustedContact.find({ youthId: req.user._id });
  res.json(contacts);
};

// ✅ Accept invite (for trusted person)
export const acceptInvite = async (req, res) => {
  const { inviteCode } = req.body;
  const contact = await TrustedContact.findOne({ inviteCode });
  if (!contact) return res.status(404).json({ message: "Invalid invite code" });
  // Prevent accepting if this invite is already accepted
  if (contact.status === 'Accepted') return res.status(400).json({ message: 'Invite already accepted.' });

  // Enforce max per trusted user: a trusted person can monitor up to 3 youth
  const trustedUser = await User.findById(req.user._id);
  const monitoringCount = (trustedUser?.linkedYouthIds || []).length;
  if (monitoringCount >= 3) {
    return res.status(400).json({ message: 'You can only monitor up to 3 youth users.' });
  }

  // Enforce max for the youth as well (they may not accept more than 3 contacts)
  const youthCount = await TrustedContact.countDocuments({ youthId: contact.youthId });
  if (youthCount >= 3) {
    return res.status(400).json({ message: 'This youth already has the maximum number of trusted contacts.' });
  }

  contact.status = "Accepted";
  contact.trustedId = req.user._id;
  await contact.save();

  // Add this youth to the trusted user's linkedYouthIds for quick lookup
  try {
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { linkedYouthIds: contact.youthId } });
  } catch (e) {
    console.warn('Could not update trusted user linkedYouthIds:', e.message || e);
  }
  res.json({ message: "Invite accepted successfully" });
};

// ✅ Delete a trusted contact (youth can remove a contact)
export const deleteTrustedContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await TrustedContact.findById(id);
    if (!contact) return res.status(404).json({ message: 'Not found' });
    if (String(contact.youthId) !== String(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    await contact.deleteOne();
    // Remove reference from youth user doc
    try {
      await User.findByIdAndUpdate(req.user._id, { $pull: { trustedContacts: contact._id } });
    } catch (e) {
      console.warn('Could not pull trusted contact from user document:', e.message || e);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Emergency alert trigger
export const sendEmergencyAlert = async (req, res) => {
  const contacts = await TrustedContact.find({ youthId: req.user._id, status: "Accepted" });
  contacts.forEach((contact) => {
    if (contact.email) {
      sendEmail({
        to: contact.email,
        subject: "🚨 Emergency Alert from Healio",
        html: `<p>${req.user.name} triggered an emergency alert. Please check immediately.</p>`,
      });
    }
  });
  res.json({ message: "Emergency alerts sent." });
};
