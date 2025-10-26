import Questionnaire from "../models/Questionnaire.js";
import User from "../models/User.js";

const coerceNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const trimString = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeQuestionnairePayload = (payload = {}) => {
  const normalized = {};

  if (payload.age !== undefined) {
    normalized.age = coerceNumber(payload.age);
  }

  ["gender", "stressLevel", "sleepQuality", "socialSupport", "academicPressure"].forEach((field) => {
    if (payload[field] !== undefined) {
      const value = trimString(payload[field]);
      if (value !== undefined) {
        normalized[field] = value;
      }
    }
  });

  if (payload.preferredSupportType !== undefined) {
    const entries = Array.isArray(payload.preferredSupportType)
      ? payload.preferredSupportType.map(trimString).filter(Boolean)
      : [];
    normalized.preferredSupportType = entries;
  }

  if (payload.hasEmergencyContact !== undefined) {
    const hasContact = payload.hasEmergencyContact === true || payload.hasEmergencyContact === "true";
    normalized.hasEmergencyContact = hasContact;
    if (hasContact) {
      const contactName = trimString(payload.emergencyContactName);
      const contactPhone = trimString(payload.emergencyContactPhone);
      if (contactName !== undefined) normalized.emergencyContactName = contactName;
      if (contactPhone !== undefined) normalized.emergencyContactPhone = contactPhone;
    } else {
      normalized.emergencyContactName = undefined;
      normalized.emergencyContactPhone = undefined;
    }
  }

  if (payload.allowMoodTracking !== undefined) {
    normalized.allowMoodTracking = payload.allowMoodTracking !== false && payload.allowMoodTracking !== "false";
  }

  if (payload.shareWithTrustedPerson !== undefined) {
    normalized.shareWithTrustedPerson = payload.shareWithTrustedPerson !== false;
  }

  if (payload.allowCommunityAccess !== undefined) {
    normalized.allowCommunityAccess = payload.allowCommunityAccess !== false;
  }

  if (payload.additionalNotes !== undefined) {
    const notes = typeof payload.additionalNotes === "string" ? payload.additionalNotes.trim() : "";
    normalized.additionalNotes = notes;
  }

  return normalized;
};

const applyQuestionnaireUpdates = (document, updates = {}) => {
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) {
      document.set(key, undefined);
    } else {
      document.set(key, value);
    }
  });
};

// Create or update questionnaire
export const createQuestionnaire = async (req, res) => {
  try {
    const userId = req.user.id;
    const questionnaireData = normalizeQuestionnairePayload(req.body || {});

    if (questionnaireData.age === null) {
      return res.status(400).json({ success: false, message: "Invalid age supplied" });
    }

    if (questionnaireData.age === undefined) {
      return res.status(400).json({ success: false, message: "Age is required" });
    }

    if (!Number.isInteger(questionnaireData.age)) {
      return res.status(400).json({ success: false, message: "Age must be a whole number" });
    }

    const requiredStrings = ["gender", "stressLevel"];
    for (const field of requiredStrings) {
      if (!questionnaireData[field]) {
        return res.status(400).json({ success: false, message: `${field} is required` });
      }
    }

    if (!Array.isArray(questionnaireData.preferredSupportType)) {
      questionnaireData.preferredSupportType = [];
    }

    if (questionnaireData.allowMoodTracking === undefined) {
      questionnaireData.allowMoodTracking = true;
    }

    if (questionnaireData.hasEmergencyContact === false) {
      questionnaireData.emergencyContactName = undefined;
      questionnaireData.emergencyContactPhone = undefined;
    }

    // Check if questionnaire already exists
    let questionnaire = await Questionnaire.findOne({ user: userId });

    if (questionnaire) {
      applyQuestionnaireUpdates(questionnaire, {
        ...questionnaireData,
        isCompleted: true,
      });
      if (questionnaire.isCompleted && !questionnaire.completedAt) {
        questionnaire.completedAt = new Date();
      }
    } else {
      // Create new questionnaire
      questionnaire = new Questionnaire({
        user: userId,
        ...questionnaireData,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    questionnaire.calculateRiskScore();
    await questionnaire.save();

    // Update user's questionnaire completion status
    const userUpdates = {
      questionnaireCompleted: true,
      questionnaireId: questionnaire._id,
    };

    if (questionnaireData.age !== undefined && questionnaireData.age !== null) {
      userUpdates.age = questionnaireData.age;
    }

    if (questionnaireData.gender) {
      userUpdates.gender = questionnaireData.gender;
    }

    await User.findByIdAndUpdate(userId, userUpdates);

    res.status(200).json({
      success: true,
      message: "Questionnaire completed successfully",
      data: questionnaire
    });
  } catch (error) {
    console.error("Questionnaire creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save questionnaire",
      error: error.message
    });
  }
};

// Get user's questionnaire
export const getQuestionnaire = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const questionnaire = await Questionnaire.findOne({ user: userId })
      .populate('user', 'name email');

    if (!questionnaire) {
      // Return 200 with null data so frontend can handle "not completed yet" cases
      return res.status(200).json({
        success: true,
        data: null,
        message: "No questionnaire found for this user"
      });
    }

    res.status(200).json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error("Get questionnaire error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve questionnaire",
      error: error.message
    });
  }
};

// Get questionnaire by user ID (for trusted persons)
export const getQuestionnaireByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const trustedUserId = req.user.id;

    // Verify the trusted person has access to this user
    const trustedUser = await User.findById(trustedUserId);
    if (!trustedUser.linkedYouthIds.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this user's questionnaire"
      });
    }

    const questionnaire = await Questionnaire.findOne({ user: userId })
      .populate('user', 'name email age gender');

    if (!questionnaire) {
      // Return 200 with null data so callers (trusted users) can handle absence gracefully
      return res.status(200).json({
        success: true,
        data: null,
        message: "No questionnaire found for the requested user"
      });
    }

    res.status(200).json({
      success: true,
      data: questionnaire
    });
  } catch (error) {
    console.error("Get questionnaire by user ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve questionnaire",
      error: error.message
    });
  }
};

// Update questionnaire
export const updateQuestionnaire = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = normalizeQuestionnairePayload(req.body || {});

    const questionnaire = await Questionnaire.findOne({ user: userId });

    if (!questionnaire) {
      // Return 200 with null data to make API idempotent when questionnaire isn't present
      return res.status(200).json({
        success: true,
        data: null,
        message: "No questionnaire data available"
      });
    }

    applyQuestionnaireUpdates(questionnaire, updateData);

    if (questionnaire.hasEmergencyContact === false) {
      questionnaire.emergencyContactName = undefined;
      questionnaire.emergencyContactPhone = undefined;
    }

    if (questionnaire.isCompleted && !questionnaire.completedAt) {
      questionnaire.completedAt = new Date();
    }

    questionnaire.calculateRiskScore();
    await questionnaire.save();

    // Update user's basic info if age/gender changed
    const userUpdates = {};
    if (updateData.age !== undefined && updateData.age !== null) {
      userUpdates.age = updateData.age;
    }
    if (updateData.gender) {
      userUpdates.gender = updateData.gender;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdates);
    }

    res.status(200).json({
      success: true,
      message: "Questionnaire updated successfully",
      data: questionnaire
    });
  } catch (error) {
    console.error("Questionnaire update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update questionnaire",
      error: error.message
    });
  }
};

// Get risk assessment summary
export const getRiskAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const questionnaire = await Questionnaire.findOne({ user: userId });
    
    if (!questionnaire) {
      return res.status(404).json({
        success: false,
        message: "Questionnaire not found"
      });
    }

    const riskLevel = questionnaire.riskScore <= 30 ? 'Low' : 
                     questionnaire.riskScore <= 60 ? 'Moderate' : 'High';

    res.status(200).json({
      success: true,
      data: {
        riskScore: questionnaire.riskScore,
        riskLevel,
        recommendations: generateRecommendations(questionnaire)
      }
    });
  } catch (error) {
    console.error("Risk assessment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get risk assessment",
      error: error.message
    });
  }
};

// Helper function to generate recommendations
const generateRecommendations = (questionnaire) => {
  const recommendations = [];

  if (questionnaire.stressLevel === 'High' || questionnaire.stressLevel === 'Very High') {
    recommendations.push("Consider stress management techniques like meditation or deep breathing exercises");
  }

  if (questionnaire.sleepQuality === 'Poor' || questionnaire.sleepQuality === 'Very Poor') {
    recommendations.push("Improve sleep hygiene by maintaining a consistent sleep schedule");
  }

  if (questionnaire.socialSupport === 'Weak' || questionnaire.socialSupport === 'Very Weak') {
    recommendations.push("Consider joining community groups or reaching out to trusted contacts");
  }

  if (questionnaire.hasAnxiety || questionnaire.hasDepression) {
    recommendations.push("Consider speaking with a mental health professional for additional support");
  }

  if (questionnaire.academicPressure === 'High' || questionnaire.academicPressure === 'Extreme') {
    recommendations.push("Consider time management strategies and academic support resources");
  }

  return recommendations;
};
