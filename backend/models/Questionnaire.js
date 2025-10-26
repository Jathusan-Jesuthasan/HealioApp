import mongoose from "mongoose";

const questionnaireSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  // Basic Demographics
  age: {
    type: Number,
    required: true,
    min: 13,
    max: 120,
  },
  gender: {
    type: String,
    enum: [
      "Male",
      "Female",
      "Non-binary",
      "Other",
      "Prefer not to say",
      "Prefer to self-describe",
    ],
    required: true,
  },

  // Mental Health Assessment Questions
  stressLevel: {
    type: String,
    enum: [
      "Very Low",
      "Low",
      "Moderate",
      "High",
      "Very High",
      "Relaxed",
      "Mostly okay",
      "Stressed",
      "Overwhelmed",
    ],
    required: true,
  },

  sleepQuality: {
    type: String,
    enum: [
      "Excellent",
      "Good",
      "Fair",
      "Poor",
      "Very Poor",
      "Rested",
      "Light sleep",
      "Restless",
      "Exhausted",
    ],
    required: false,
  },

  socialSupport: {
    type: String,
    enum: [
      "Very Strong",
      "Strong",
      "Moderate",
      "Weak",
      "Very Weak",
      "Supported",
      "Somewhat supported",
      "Neutral",
      "Isolated",
    ],
    required: false,
  },

  academicPressure: {
    type: String,
    enum: ["None", "Low", "Moderate", "High", "Extreme", "Overwhelming"],
    required: false,
  },
  
  // Mental Health History
  hasAnxiety: {
    type: Boolean,
    default: false
  },
  
  hasDepression: {
    type: Boolean,
    default: false
  },
  
  hasTherapy: {
    type: Boolean,
    default: false
  },
  
  // Support Preferences
  preferredSupportType: {
    type: [String],
    enum: [
      "Professional Counseling",
      "Peer Support",
      "Family Support",
      "Self-Help",
      "Emergency Contacts",
      "Breathing exercises",
      "Grounding techniques",
      "Mood journaling",
      "Talk to a mentor",
      "Guided meditation",
      "Peer stories",
    ],
    default: [],
  },
  
  // Emergency Contact Preferences
  hasEmergencyContact: {
    type: Boolean,
    default: false
  },
  
  emergencyContactName: {
    type: String,
    maxlength: 80
  },
  
  emergencyContactPhone: {
    type: String,
    maxlength: 30,
    match: [/^[0-9+\-\s()]{6,30}$/, 'Invalid phone number']
  },
  
  // Privacy Settings
  shareWithTrustedPerson: {
    type: Boolean,
    default: true
  },
  
  allowMoodTracking: {
    type: Boolean,
    default: true
  },
  
  allowCommunityAccess: {
    type: Boolean,
    default: true
  },
  
  // Additional Notes
  additionalNotes: {
    type: String,
    maxlength: 500
  },
  
  // Risk Assessment Score (calculated)
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Completion Status
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate risk score based on responses
questionnaireSchema.methods.calculateRiskScore = function() {
  let score = 0;
  
  // Stress level scoring (0-20 points)
  const stressScores = {
    "Very Low": 0,
    "Low": 5,
    "Relaxed": 5,
    "Mostly okay": 10,
    "Moderate": 10,
    "High": 15,
    "Stressed": 15,
    "Very High": 20,
    "Overwhelmed": 20,
  };
  score += stressScores[this.stressLevel] || 0;
  
  // Sleep quality scoring (0-20 points)
  const sleepScores = {
    "Excellent": 0,
    "Rested": 0,
    "Good": 5,
    "Light sleep": 5,
    "Fair": 10,
    "Poor": 15,
    "Restless": 15,
    "Very Poor": 20,
    "Exhausted": 20,
  };
  score += sleepScores[this.sleepQuality] || 0;
  
  // Social support scoring (0-20 points, inverted)
  const supportScores = {
    "Very Strong": 0,
    "Strong": 5,
    "Supported": 5,
    "Moderate": 10,
    "Somewhat supported": 10,
    "Neutral": 10,
    "Weak": 15,
    "Very Weak": 20,
    "Isolated": 20,
  };
  score += supportScores[this.socialSupport] || 0;
  
  // Academic pressure scoring (0-20 points)
  const pressureScores = {
    "None": 0,
    "Low": 5,
    "Moderate": 10,
    "High": 15,
    "Extreme": 20,
    "Overwhelming": 20,
  };
  score += pressureScores[this.academicPressure] || 0;
  
  // Mental health history scoring (0-20 points)
  if (this.hasAnxiety) score += 10;
  if (this.hasDepression) score += 10;
  
  this.riskScore = Math.min(score, 100);
  return this.riskScore;
};

// Pre-save middleware to calculate risk score
questionnaireSchema.pre('save', function(next) {
  if (this.isModified('stressLevel') || this.isModified('sleepQuality') || 
      this.isModified('socialSupport') || this.isModified('academicPressure') ||
      this.isModified('hasAnxiety') || this.isModified('hasDepression')) {
    this.calculateRiskScore();
  }
  
  if (this.isCompleted && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

const Questionnaire = mongoose.model("Questionnaire", questionnaireSchema);
export default Questionnaire;
