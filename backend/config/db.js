// backend/config/db.js
import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_MS = 3000;

const maskUri = (uri) => {
  try {
    const u = new URL(uri);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "<invalid MONGO_URI>";
  }
};

const connectOnce = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI not set in environment");
  }
  console.log("🔌 Connecting to MongoDB:", maskUri(uri));
  const conn = await mongoose.connect(uri); // Mongoose 8: no extra options
  console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
};

const connectDB = async () => {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await connectOnce();
      return;
    } catch (err) {
      attempt++;
      console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`);
      // Common Atlas hints
      if (
        /whitelist|whitelisting|ip|not authorized|authentication/i.test(err.message) ||
        /Could not connect to any servers/i.test(err.message)
      ) {
        console.error(
          "🛠️  Hints: (1) Add your IP in Atlas Network Access, " +
          "(2) Ensure DB name exists in URI, (3) URL-encode password, " +
          "(4) User has readWrite on that DB, (5) Check VPN/firewall."
        );
      }
      if (attempt >= MAX_RETRIES) {
        console.error("🛑 Giving up after max retries.");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, RETRY_MS));
    }
  }
};

export default connectDB;
