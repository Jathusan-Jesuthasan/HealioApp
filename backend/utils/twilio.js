import twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER, // e.g. +1855XXXXXXX
} = process.env;

export const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export async function sendSMS(to, body) {
  if (!to) throw new Error("Missing recipient phone");
  if (!TWILIO_FROM_NUMBER) throw new Error("Missing TWILIO_FROM_NUMBER");
  return twilioClient.messages.create({ to, from: TWILIO_FROM_NUMBER, body });
}
