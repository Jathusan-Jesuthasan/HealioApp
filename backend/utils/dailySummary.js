// backend/utils/dailySummary.js
import cron from 'node-cron';
import User from '../models/User.js';
import TrustedContact from '../models/TrustedContact.js';
import MoodLog from '../models/MoodLog.js';
import AIRiskResult from '../models/AIRiskResult.js';
import { sendAlertEmail } from './mailer.js';

/**
 * Generate HTML email for daily summary
 */
const generateDailySummaryEmail = (userName, userEmail, moodLogs, riskResults, contacts) => {
  const totalMoodLogs = moodLogs.length;
  const avgWellness = riskResults.length > 0 
    ? (riskResults.reduce((sum, r) => sum + (r.wellnessIndex || 0), 0) / riskResults.length).toFixed(1)
    : 'N/A';
  
  const riskLevels = riskResults.map(r => r.riskLevel).filter(Boolean);
  const highestRisk = riskLevels.includes('SERIOUS') ? 'SERIOUS' 
    : riskLevels.includes('STRESS') ? 'STRESS'
    : riskLevels.includes('ANXIETY') ? 'ANXIETY'
    : riskLevels.includes('ANGER') ? 'ANGER'
    : 'LOW';

  const moodEmojis = moodLogs.map(log => log.mood || '').join(', ') || 'No moods logged';

  const allSuggestions = riskResults
    .flatMap(r => r.suggestions || [])
    .filter((v, i, a) => a.indexOf(v) === i) // Unique suggestions
    .slice(0, 3);

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 15px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .icon { font-size: 48px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; }
        .date-badge { background-color: #eff6ff; color: #1e40af; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card { background-color: #f9fafb; padding: 20px; border-radius: 12px; text-align: center; border: 2px solid #e5e7eb; }
        .stat-value { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
        .stat-label { font-size: 14px; color: #6b7280; }
        .risk-badge { display: inline-block; padding: 6px 12px; border-radius: 16px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        .risk-serious { background-color: #fee2e2; color: #991b1b; }
        .risk-stress { background-color: #fef3c7; color: #92400e; }
        .risk-anxiety { background-color: #fef3c7; color: #92400e; }
        .risk-anger { background-color: #ffedd5; color: #9a3412; }
        .risk-low { background-color: #d1fae5; color: #065f46; }
        .mood-box { background-color: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .mood-box h3 { color: #92400e; margin: 0 0 10px 0; }
        .suggestions-box { background-color: #eff6ff; padding: 20px; border-radius: 12px; margin: 20px 0; }
        .suggestions-box h3 { color: #1e40af; margin: 0 0 15px 0; }
        .suggestions-box ul { margin: 0; padding-left: 20px; color: #374151; }
        .suggestions-box li { margin: 8px 0; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
        .footer p { margin: 5px 0; }
        .disclaimer { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .disclaimer p { color: #92400e; margin: 5px 0; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${process.env.HEALIO_LOGO_URL || 'https://via.placeholder.com/180x60/667eea/ffffff?text=Healio'}" alt="Healio Logo" class="logo" />
          <div class="icon">📊</div>
          <h1>Daily Mental Health Summary</h1>
        </div>
        
        <div class="content">
          <div class="date-badge">📅 ${today}</div>
          
          <p class="greeting">Daily summary for <strong>${userName}</strong> (${userEmail})</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">📝 Mood Entries</div>
              <div class="stat-value">${totalMoodLogs}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">💚 Avg Wellness</div>
              <div class="stat-value">${avgWellness}${avgWellness !== 'N/A' ? '%' : ''}</div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Highest Risk Level Today:</p>
            <span class="risk-badge risk-${highestRisk.toLowerCase()}">${highestRisk}</span>
          </div>
          
          ${totalMoodLogs > 0 ? `
          <div class="mood-box">
            <h3>😊 Moods Logged Today</h3>
            <p style="font-size: 16px; color: #92400e;">${moodEmojis}</p>
          </div>
          ` : `
          <div class="mood-box">
            <h3>😊 Moods Logged Today</h3>
            <p style="font-size: 16px; color: #92400e;">No mood entries recorded today.</p>
          </div>
          `}
          
          ${allSuggestions.length > 0 ? `
          <div class="suggestions-box">
            <h3>💡 AI Recommendations</h3>
            <ul>
              ${allSuggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="disclaimer">
            <p><strong>ℹ️ About This Summary:</strong></p>
            <p>This is an automated daily summary of ${userName}'s mental health activity on Healio. You are receiving this because you are listed as a trusted contact and the user has enabled daily summaries.</p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Healio Mental Health App</strong></p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p style="margin-top: 15px;">If you have concerns about ${userName}, please reach out to them directly.</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
            To stop receiving daily summaries, ask ${userName} to disable this setting in their Healio app.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send daily summary to all trusted contacts for users who have it enabled
 */
export const sendDailySummaries = async () => {
  try {
    console.log('📧 Starting daily summary job...');
    
    // Find all users with dailySummary enabled
    const users = await User.find({ 'alertSettings.dailySummary': true }).select('_id email alertSettings');
    
    if (users.length === 0) {
      console.log('📧 No users have daily summary enabled.');
      return;
    }

    console.log(`📧 Found ${users.length} user(s) with daily summary enabled.`);
    
    for (const user of users) {
      try {
        // Get today's data (from midnight to now)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const moodLogs = await MoodLog.find({ 
          user: user._id, 
          createdAt: { $gte: today } 
        });
        
        const riskResults = await AIRiskResult.find({ 
          user: user._id, 
          date: { $gte: today } 
        });
        
        // Get trusted contacts
        const contacts = await TrustedContact.find({ user: user._id });
        
        if (contacts.length === 0) {
          console.log(`📧 User ${user.email} has no trusted contacts - skipping.`);
          continue;
        }

        // Generate summary email HTML
        const summaryHTML = generateDailySummaryEmail(
          user.email.split('@')[0], // Simple username from email
          user.email,
          moodLogs,
          riskResults,
          contacts
        );
        
        // Send to all trusted contacts
        let sentCount = 0;
        for (const contact of contacts) {
          try {
            await sendAlertEmail(
              contact.email, 
              `Daily Mental Health Summary - ${user.email}`, 
              summaryHTML
            );
            sentCount++;
            console.log(`📧 Sent daily summary to ${contact.email} for user ${user.email}`);
          } catch (emailError) {
            console.error(`📧 Failed to send to ${contact.email}:`, emailError.message);
          }
        }
        
        console.log(`✅ Daily summary sent to ${sentCount}/${contacts.length} contacts for user ${user.email}`);
        
      } catch (userError) {
        console.error(`❌ Error processing user ${user.email}:`, userError.message);
      }
    }
    
    console.log('📧 Daily summary job completed!');
    
  } catch (error) {
    console.error('❌ Daily summary job failed:', error);
  }
};

/**
 * Schedule daily summary to run every day at 8:00 PM
 * Cron format: minute hour day month dayOfWeek
 * '0 20 * * *' = At 20:00 (8:00 PM) every day
 */
export const scheduleDailySummary = () => {
  // Run at 8:00 PM every day
  cron.schedule('0 20 * * *', () => {
    console.log('⏰ Daily summary cron job triggered at 8:00 PM');
    sendDailySummaries();
  });
  
  console.log('✅ Daily summary scheduler initialized - will run at 8:00 PM every day');
};

/**
 * Manual trigger for testing (call this from an API endpoint)
 */
export const triggerDailySummaryNow = async () => {
  console.log('🧪 Manually triggering daily summary...');
  await sendDailySummaries();
};
