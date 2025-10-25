# Alert Settings Guide - How It Works

## 📋 Overview
The Alert Settings feature allows users to control when and how they receive notifications about their mental health risk levels. All settings are now **stored in the database** and synced across devices.

---

## 🎛️ Alert Settings Features

### 1. **Automatic Alerts** 🚨
- **What it does**: Sends emails to trusted contacts when AI detects concerning mental health patterns
- **How it works**: 
  - When enabled (default), alerts are sent automatically when high-risk patterns are detected
  - When disabled, NO alerts are sent regardless of risk level
- **Risk levels that trigger alerts**: SERIOUS, STRESS, ANGER, ANXIETY
- **Backend logic**: `riskController.js` checks `user.alertSettings.autoAlert` before sending alerts

**Example:**
```
User logs a mood → AI analyzes → Detects "SERIOUS" risk
→ If autoAlert = true → Email sent to all trusted contacts
→ If autoAlert = false → No email sent
```

---

### 2. **Critical Only** ⚡
- **What it does**: Only sends alerts for the most severe risk levels
- **How it works**:
  - When enabled, alerts are ONLY sent for "SERIOUS" risk level
  - When disabled, alerts are sent for all high-risk levels (SERIOUS, STRESS, ANGER, ANXIETY)
- **Use case**: For users who don't want to worry their contacts unless it's truly critical

**Example:**
```
Scenario 1: criticalOnly = false (default)
- SERIOUS risk → Alert sent ✅
- STRESS risk → Alert sent ✅
- ANGER risk → Alert sent ✅
- ANXIETY risk → Alert sent ✅

Scenario 2: criticalOnly = true
- SERIOUS risk → Alert sent ✅
- STRESS risk → No alert ❌
- ANGER risk → No alert ❌
- ANXIETY risk → No alert ❌
```

---

### 3. **Daily Summary** 📧
- **What it does**: Sends a daily summary email to trusted contacts about the user's mental health activity
- **Current status**: ✅ **FULLY WORKING** - Automated cron job runs daily at 8:00 PM
- **How it works**:
  - Backend cron job runs automatically every day at 8:00 PM
  - Fetches user's mood logs and AI insights from the past 24 hours
  - Sends summary email to all trusted contacts
  - Includes: Total mood entries, average wellness score, highest risk level, moods logged, AI recommendations
  - Only sends if user has `dailySummary: true` in settings

**Email includes:**
- 📅 Date of summary
- 📝 Number of mood entries
- 💚 Average wellness index
- ⚠️ Highest risk level detected
- 😊 Moods logged throughout the day
- 💡 AI recommendations/suggestions

**Schedule:**
- Runs automatically at 8:00 PM every day
- Can be manually triggered via API for testing: `POST /api/trusted-contacts/test-daily-summary`

---

## 🔧 Technical Implementation

### Database Schema (User Model)
```javascript
alertSettings: {
  autoAlert: { type: Boolean, default: true },     // Master toggle
  criticalOnly: { type: Boolean, default: false }, // Filter by severity
  dailySummary: { type: Boolean, default: false }  // Daily emails
}
```

### API Endpoints
```
GET  /api/auth/alert-settings  → Fetch user's settings
PUT  /api/auth/alert-settings  → Update settings
```

### Flow Diagram
```
1. User toggles setting in app
   ↓
2. Frontend calls PUT /api/auth/alert-settings
   ↓
3. Backend saves to User.alertSettings in MongoDB
   ↓
4. When AI detects risk:
   a. Check user.alertSettings.autoAlert
   b. Check user.alertSettings.criticalOnly
   c. If conditions met → Send email
   d. If not → Skip alert
```

---

## 🧪 Testing the Feature

### Test Automatic Alerts
1. **Enable Auto Alerts**:
   - Go to Trusted Person Alert screen
   - Turn ON "Automatic Alerts"
   - Turn OFF "Critical Only"

2. **Log a concerning mood**:
   - Go to Mood Log screen
   - Log a mood entry with negative emotions (e.g., "I feel hopeless and anxious")
   - AI should detect high risk

3. **Check email**:
   - Trusted contacts (Loshan & Nikshan) should receive email alert
   - Check backend console for log: `⚠️ High risk detected - Sending automatic alerts`

### Test Critical Only Filter
1. **Enable Critical Only**:
   - Turn ON "Critical Only" in Alert Settings

2. **Log moderate concern**:
   - Log mood with "stressed" emotion
   - AI might detect "STRESS" risk level

3. **Expected behavior**:
   - NO email sent (because criticalOnly requires "SERIOUS" level)
   - Console log: `⚠️ High risk detected (STRESS) - Alerts disabled by user settings (criticalOnly: true)`

### Test Disable All Alerts
1. **Disable Auto Alerts**:
   - Turn OFF "Automatic Alerts"

2. **Log concerning mood**:
   - Even with "SERIOUS" risk detected
   - NO emails sent
   - Console log: `⚠️ High risk detected (SERIOUS) - Alerts disabled by user settings (autoAlert: false)`

### Test Daily Summary
1. **Enable Daily Summary**:
   - Go to Trusted Person Alert screen
   - Turn ON "Daily Summary"

2. **Wait for 8:00 PM** OR **Test Immediately**:
   - **Option A**: Wait until 8:00 PM for automatic send
   - **Option B**: Use Postman/Thunder Client to test immediately:
     ```
     POST http://localhost:5000/api/trusted-contacts/test-daily-summary
     Headers: Authorization: Bearer YOUR_TOKEN
     ```

3. **Check email**:
   - Trusted contacts should receive daily summary email
   - Summary includes: mood count, wellness score, risk levels, moods, suggestions
   - Check backend console for: `📧 Daily summary sent to X contacts for user Y`

4. **Verify cron scheduler**:
   - When server starts, look for: `⏰ Daily summary scheduler is active`
   - At 8:00 PM daily, look for: `⏰ Daily summary cron job triggered at 8:00 PM`

---

## 📱 Frontend Integration

Settings are:
- **Loaded** on screen mount from `/api/auth/alert-settings`
- **Cached** in AsyncStorage for offline access
- **Synced** to backend immediately when toggled
- **Persistent** across app restarts and devices

---

## 🔮 Future Enhancements

### Customizable Summary Time
Allow users to choose what time they want daily summaries sent (e.g., 6:00 PM, 8:00 PM, 10:00 PM).

### Weekly Summary Option
Add a weekly summary that shows trends over 7 days instead of just daily.

### SMS Notifications
Integrate SMS service (Twilio) to send text message alerts in addition to emails.

### In-App Notifications
Add push notifications to the mobile app for real-time alerts.

---

## ✅ Summary

**Current Status:**
- ✅ Automatic Alerts: **WORKING**
- ✅ Critical Only: **WORKING**
- ✅ Daily Summary: **WORKING** (Automated cron job runs at 8:00 PM daily)

**How to Use:**
1. Add trusted contacts
2. Toggle settings based on preference
3. Settings are automatically saved to database
4. Backend respects settings when sending alerts
5. Daily summaries sent automatically at 8:00 PM if enabled

**Backend Logic:**
- Auto Alerts = Master switch (off = no alerts at all)
- Critical Only = Filter (on = only SERIOUS risk triggers alerts)
- Daily Summary = Cron job runs at 8:00 PM, sends summary of day's activity to all trusted contacts

**Files Modified:**
- ✅ `backend/models/User.js` - Added alertSettings schema
- ✅ `backend/routes/authRoutes.js` - Added alert settings endpoints
- ✅ `backend/controllers/authController.js` - Added get/update alert settings functions
- ✅ `backend/controllers/riskController.js` - Respects user alert settings
- ✅ `backend/utils/dailySummary.js` - NEW - Daily summary cron job & email template
- ✅ `backend/routes/trustedContactRoutes.js` - Added test endpoint for daily summary
- ✅ `backend/server.js` - Initialized daily summary scheduler
- ✅ `frontend/screens/TrustedRiskAlert.jsx` - Syncs settings with backend
