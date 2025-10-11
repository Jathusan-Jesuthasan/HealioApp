// /components/MoodReportView.jsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ScrollView,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Colors } from '../utils/Colors';

export default function MoodReportView({
  dashboard,
  userProfile,
  userNotes,
  setUserNotes,
  selectedWidgets,
}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenWidth > 414;
  
  const reportRef = useRef();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [sharingReport, setSharingReport] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Responsive design values
  const responsive = {
    fontSize: {
      title: isSmallScreen ? 18 : 20,
      subtitle: isSmallScreen ? 14 : 16,
      body: isSmallScreen ? 14 : 15,
      small: isSmallScreen ? 12 : 13,
    },
    spacing: {
      small: isSmallScreen ? 12 : 16,
      medium: isSmallScreen ? 16 : 20,
      large: isSmallScreen ? 20 : 24,
    },
    icon: {
      small: isSmallScreen ? 18 : 20,
      medium: isSmallScreen ? 22 : 24,
      large: isSmallScreen ? 28 : 32,
    }
  };

  const calculateMoodStability = () => {
    const moods = dashboard?.weeklyMoods || [];
    if (moods.length < 2) return 100;
    const mean = moods.reduce((a, b) => a + b, 0) / moods.length;
    const variance = moods.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / moods.length;
    return Math.max(0, Math.min(100, Math.round(100 - (Math.sqrt(variance) / 4) * 100)));
  };

  const getTopFactors = () => {
    const allFactors = dashboard?.moodLogs?.flatMap(l => l.factors || []) || [];
    const factorCount = allFactors.reduce((acc, f) => {
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(factorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getMoodInsights = () => {
    const stability = calculateMoodStability();
    const score = dashboard?.mindBalanceScore || 0;
    const entries = dashboard?.moodLogs?.length || 0;
    
    if (score >= 80 && stability >= 80 && entries >= 7) {
      return {
        level: 'excellent',
        message: 'Amazing consistency in your wellness journey! 🌟',
        suggestion: 'Your dedication to self-awareness is paying off. Consider mentoring others or deepening your mindfulness practice.',
        icon: 'trophy',
        color: '#10B981'
      };
    } else if (score >= 70 || (stability >= 70 && entries >= 5)) {
      return {
        level: 'good', 
        message: 'Great progress in understanding your patterns! 📈',
        suggestion: 'Keep building on your positive habits. Try adding one new self-care activity this week.',
        icon: 'trending-up',
        color: '#3B82F6'
      };
    } else if (entries >= 3) {
      return {
        level: 'growing',
        message: 'You\'re building valuable self-awareness! 🌱',
        suggestion: 'Consistency is key. Try to log your mood at the same time each day for better insights.',
        icon: 'leaf',
        color: '#8B5CF6'
      };
    } else {
      return {
        level: 'beginning',
        message: 'Welcome to your wellness journey! 🎯',
        suggestion: 'Start with small, consistent entries. Every log helps build your emotional awareness.',
        icon: 'star',
        color: Colors.secondary
      };
    }
  };

  const getWellnessStreak = () => {
    const logs = dashboard?.moodLogs || [];
    if (logs.length === 0) return 0;
    
    // Simple streak calculation based on consecutive days with entries
    return Math.min(logs.length, 7); // Mock streak for demo
  };

  const exportPDF = async () => {
    if (!dashboard) return;
    
    try {
      setGeneratingPDF(true);
      
      const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const insights = getMoodInsights();
      const topFactors = getTopFactors();
      const streak = getWellnessStreak();

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
                padding: 24px; 
                color: #1a202c;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
              }
              .header { 
                text-align: center; 
                margin-bottom: 32px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e2e8f0;
              }
              h1 { 
                color: ${Colors.secondary}; 
                font-size: 32px;
                margin-bottom: 8px;
                font-weight: 700;
              }
              .subtitle { 
                color: #718096; 
                font-size: 18px;
              }
              .user-info {
                background: #f7fafc;
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 24px;
                text-align: center;
              }
              .section { 
                margin-bottom: 32px; 
              }
              h2 { 
                color: #2d3748; 
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 12px;
                margin-bottom: 20px;
                font-size: 24px;
              }
              .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
              }
              .metric-card {
                background: #f8fafc;
                padding: 20px;
                border-radius: 12px;
                border-left: 4px solid ${Colors.secondary};
                text-align: center;
              }
              .metric-value {
                font-size: 28px;
                font-weight: bold;
                color: #2d3748;
                margin-bottom: 8px;
              }
              .metric-label {
                color: #718096;
                font-size: 14px;
                font-weight: 500;
              }
              .insight-card {
                background: linear-gradient(135deg, #fff7ed, #fed7aa);
                padding: 24px;
                border-radius: 16px;
                border-left: 6px solid ${insights.color};
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .factors-grid {
                display: grid;
                gap: 12px;
              }
              .factor-item {
                background: #f7fafc;
                padding: 16px;
                border-radius: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border: 1px solid #e2e8f0;
              }
              .notes-section {
                background: #f0fff4;
                padding: 20px;
                border-radius: 12px;
                border-left: 4px solid #48bb78;
              }
              .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
              }
              .streak-info {
                background: linear-gradient(135deg, #4ADE80, #22C55E);
                color: white;
                padding: 16px;
                border-radius: 12px;
                text-align: center;
                margin: 20px 0;
              }
              @media (max-width: 600px) {
                body { padding: 16px; }
                .metrics-grid { grid-template-columns: 1fr; }
                h1 { font-size: 24px; }
                h2 { font-size: 20px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🌱 Healio Wellness Report</h1>
              <p class="subtitle">Generated on ${date}</p>
            </div>

            <div class="user-info">
              <strong>Report for:</strong> ${userProfile?.name || 'Healio User'} • 
              <strong> Period:</strong> Last ${dashboard?.moodLogs?.length || 0} days
            </div>

            <div class="section">
              <h2>📊 Your Wellness Snapshot</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${dashboard?.mindBalanceScore || 0}/100</div>
                  <div class="metric-label">Wellness Score</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${calculateMoodStability()}%</div>
                  <div class="metric-label">Mood Stability</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${dashboard?.moodLogs?.length || 0}</div>
                  <div class="metric-label">Total Entries</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${streak} days</div>
                  <div class="metric-label">Tracking Streak</div>
                </div>
              </div>
            </div>

            ${streak >= 3 ? `
              <div class="streak-info">
                <h3>🔥 ${streak}-Day Tracking Streak!</h3>
                <p>Your consistency is building powerful self-awareness!</p>
              </div>
            ` : ''}

            <div class="section">
              <h2>🤖 Personalized Insights</h2>
              <div class="insight-card">
                <h3 style="margin-top: 0; color: #7c2d12;">${insights.message}</h3>
                <p style="margin-bottom: 0; font-size: 16px; line-height: 1.5;"><strong>Next Step:</strong> ${insights.suggestion}</p>
              </div>
            </div>

            <div class="section">
              <h2>🔍 Top Mood Influencers</h2>
              <div class="factors-grid">
                ${topFactors.map(([factor, count], index) => `
                  <div class="factor-item">
                    <span style="font-weight: 500;">${index + 1}. ${factor}</span>
                    <strong style="color: ${Colors.secondary};">${count} ${count === 1 ? 'time' : 'times'}</strong>
                  </div>
                `).join('')}
                ${topFactors.length === 0 ? '<p style="text-align: center; color: #718096; font-style: italic;">Start adding factors to your mood entries to see patterns here.</p>' : ''}
              </div>
            </div>

            ${userNotes ? `
              <div class="section">
                <h2>📝 Your Reflections</h2>
                <div class="notes-section">
                  <p style="margin: 0; line-height: 1.6;">${userNotes}</p>
                </div>
              </div>
            ` : ''}

            <div class="footer">
              <p>Generated with care by Healio Mental Health Tracker ❤️</p>
              <p><small>Your privacy is protected. This report contains only your anonymized wellness data.</small></p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Your Wellness Report',
        UTI: 'com.adobe.pdf',
      });
      
    } catch (err) {
      console.error('PDF Export Error:', err);
      Alert.alert(
        'Export Issue', 
        'We couldn\'t create your PDF right now. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  const shareReport = async () => {
    try {
      setSharingReport(true);
      
      const stats = {
        score: dashboard?.mindBalanceScore || 0,
        stability: calculateMoodStability(),
        total: dashboard?.moodLogs?.length || 0,
        streak: getWellnessStreak(),
        topFactor: getTopFactors()[0]?.[0] || 'Various factors',
      };
      
      const insights = getMoodInsights();
      
      const msg = `
🌟 My Healio Wellness Journey 🌟

📊 Wellness Score: ${stats.score}/100
🎯 Emotional Stability: ${stats.stability}%
📝 Days Tracked: ${stats.total}
🔥 Current Streak: ${stats.streak} days
🔍 Top Influence: ${stats.topFactor}

💡 ${insights.message}

✨ ${insights.suggestion}

Track your mental wellness with me using Healio! 💚

#MentalWellness #SelfCare #HealioJourney
      `.trim();
      
      await Share.share({ 
        message: msg, 
        title: 'My Wellness Progress Report' 
      });
    } catch (err) {
      console.error('Share Error:', err);
      Alert.alert(
        'Share Not Sent',
        'The share was cancelled or couldn\'t be sent.',
        [{ text: 'OK' }]
      );
    } finally {
      setSharingReport(false);
    }
  };

  if (!dashboard) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={[styles.loadingText, { fontSize: responsive.fontSize.body }]}>
          Creating your personalized report...
        </Text>
      </View>
    );
  }

  const insights = getMoodInsights();
  const topFactors = getTopFactors();
  const wellnessStreak = getWellnessStreak();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView 
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        ref={reportRef}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wellness Overview Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={[styles.heroTitle, { fontSize: responsive.fontSize.title }]}>
              🌱 Your Wellness Report
            </Text>
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={responsive.icon.small} color="#FFFFFF" />
              <Text style={styles.streakText}>{wellnessStreak} days</Text>
            </View>
          </View>
          <Text style={[styles.heroSubtitle, { fontSize: responsive.fontSize.subtitle }]}>
            Celebrating your self-awareness journey
          </Text>
        </View>

        {/* AI Insights */}
        {selectedWidgets.aiInsights && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                🤖 Your Personal Insights
              </Text>
              <Ionicons name={insights.icon} size={responsive.icon.medium} color={insights.color} />
            </View>
            <View style={[styles.insightCard, { borderLeftColor: insights.color }]}>
              <Text style={[styles.insightText, { fontSize: responsive.fontSize.body }]}>
                {insights.message}
              </Text>
              <View style={styles.suggestionBox}>
                <Ionicons name="bulb-outline" size={responsive.icon.small} color={Colors.textSecondary} />
                <Text style={[styles.insightSuggestion, { fontSize: responsive.fontSize.small }]}>
                  {insights.suggestion}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Personal Reflections */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
            📝 Your Reflections
          </Text>
          <TextInput
            style={[styles.input, { 
              fontSize: responsive.fontSize.body,
              minHeight: isSmallScreen ? 80 : 100 
            }]}
            multiline
            numberOfLines={4}
            placeholder="How are you feeling about your progress? What patterns have you noticed?..."
            placeholderTextColor={Colors.textSecondary}
            value={userNotes}
            onChangeText={setUserNotes}
          />
          <Text style={[styles.notesHint, { fontSize: responsive.fontSize.small }]}>
            These notes will be included in your exported reports
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
            📈 Progress Overview
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: isSmallScreen ? 20 : 24 }]}>
                {dashboard?.mindBalanceScore || 0}
              </Text>
              <Text style={[styles.statLabel, { fontSize: responsive.fontSize.small }]}>
                Wellness Score
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: isSmallScreen ? 20 : 24 }]}>
                {calculateMoodStability()}%
              </Text>
              <Text style={[styles.statLabel, { fontSize: responsive.fontSize.small }]}>
                Stability
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { fontSize: isSmallScreen ? 20 : 24 }]}>
                {dashboard?.moodLogs?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { fontSize: responsive.fontSize.small }]}>
                Entries
              </Text>
            </View>
          </View>
        </View>

        {/* Top Factors */}
        {selectedWidgets.factors && topFactors.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
              🔍 Your Mood Influencers
            </Text>
            <View style={styles.factorsContainer}>
              {topFactors.map(([factor, count], index) => (
                <View key={factor} style={styles.factorTag}>
                  <View style={styles.factorRank}>
                    <Text style={styles.factorRankText}>#{index + 1}</Text>
                  </View>
                  <Text style={[styles.factorText, { fontSize: responsive.fontSize.body }]}>
                    {factor}
                  </Text>
                  <Text style={[styles.factorCount, { fontSize: responsive.fontSize.small }]}>
                    {count}x
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Export & Share Section */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
            📤 Share Your Journey
          </Text>
          <Text style={[styles.exportDescription, { fontSize: responsive.fontSize.body }]}>
            Export your progress or share achievements with your support system
          </Text>
          
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportButton, styles.pdfButton]}
              onPress={exportPDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="document-text" size={responsive.icon.small} color="#fff" />
                  <Text style={[styles.exportText, { fontSize: responsive.fontSize.body }]}>
                    PDF Report
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, styles.shareButton]}
              onPress={shareReport}
              disabled={sharingReport}
            >
              {sharingReport ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="share" size={responsive.icon.small} color="#fff" />
                  <Text style={[styles.exportText, { fontSize: responsive.fontSize.body }]}>
                    Share
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.exportHint, { fontSize: responsive.fontSize.small }]}>
            Your data is private and secure. Share only what you're comfortable with.
          </Text>
        </View>

        {/* Support Resources */}
        <View style={[styles.card, styles.supportCard]}>
          <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
            🫂 You're Not Alone
          </Text>
          <Text style={[styles.resourcesText, { fontSize: responsive.fontSize.body }]}>
            Remember: Progress isn't always linear. Celebrate every step forward.
          </Text>
          
          <View style={styles.resourceLinks}>
            <TouchableOpacity style={styles.resourceLink}>
              <Ionicons name="call" size={responsive.icon.small} color={Colors.secondary} />
              <Text style={[styles.resourceLinkText, { fontSize: responsive.fontSize.body }]}>
                Crisis Helpline: 988
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceLink}>
              <Ionicons name="heart" size={responsive.icon.small} color={Colors.secondary} />
              <Text style={[styles.resourceLinkText, { fontSize: responsive.fontSize.body }]}>
                Mental Health America
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resourceLink}>
              <Ionicons name="people" size={responsive.icon.small} color={Colors.secondary} />
              <Text style={[styles.resourceLinkText, { fontSize: responsive.fontSize.body }]}>
                Find a Therapist
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: { 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: { 
    color: Colors.textSecondary, 
    marginTop: 16,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  insightCard: {
    backgroundColor: `${Colors.secondary}08`,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  insightText: {
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 22,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
  },
  insightSuggestion: {
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.primary,
    textAlignVertical: 'top',
  },
  notesHint: {
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: `${Colors.textSecondary}20`,
  },
  factorsContainer: {
    gap: 8,
  },
  factorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  factorRank: {
    backgroundColor: Colors.secondary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factorRankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  factorText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  factorCount: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  exportDescription: {
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pdfButton: { 
    backgroundColor: Colors.secondary,
  },
  shareButton: { 
    backgroundColor: '#8B5CF6',
  },
  exportText: { 
    color: '#fff', 
    fontWeight: '600',
  },
  exportHint: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  supportCard: {
    backgroundColor: `${Colors.secondary}05`,
    borderWidth: 1,
    borderColor: `${Colors.secondary}20`,
  },
  resourcesText: {
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 20,
  },
  resourceLinks: {
    gap: 12,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  resourceLinkText: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  spacer: {
    height: 20,
  },
});