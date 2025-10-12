// backend/controllers/activityController.js
import Activity from "../models/Activity.js";

/* ✅ Add a new activity */
export const addActivity = async (req, res) => {
  try {
    const { userId, type, name, duration, date, time } = req.body;
    console.log("📥 Received activity:", req.body);

    if (!userId || !name || !duration) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Default type to "Exercise" if not provided for backward compatibility
    const activityType = type || "Exercise";

    const newActivity = new Activity({ 
      userId, 
      type: activityType, 
      name, 
      duration, 
      date, 
      time 
    });
    
    console.log("💾 About to save activity:", newActivity);
    const savedActivity = await newActivity.save();
    console.log("✅ Activity saved to MongoDB:", savedActivity);
    
    res.status(201).json({ message: "✅ Activity saved successfully", data: savedActivity });
  } catch (err) {
    console.error("❌ Activity save error:", err);
    res.status(500).json({ message: "Server error while saving activity" });
  }
};

/* ✅ Fetch all activities (for dashboard/rewards) */
export const getActivities = async (req, res) => {
  try {
    console.log("📋 Fetching all activities from MongoDB...");
    const activities = await Activity.find();
    console.log("📊 Found activities:", activities.length, "records");
    console.log("📝 Activities data:", activities);
    res.status(200).json(activities);
  } catch (err) {
    console.error("❌ Fetch activities error:", err);
    res.status(500).json({ message: "Server error while fetching activities" });
  }
};
