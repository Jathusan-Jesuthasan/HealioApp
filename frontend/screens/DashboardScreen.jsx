// /screens/DashboardScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  RefreshControl,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Card from '../components/Card';
import ProgressBarCustom from '../components/ProgressBarCustom';
import { Colors } from '../utils/Colors';
import { getDashboard } from '../services/analytics';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Math.min(Dimensions.get('window').width - 48, 720);

// Helper: Risk Label with enhanced categories
const getRiskLevel = (score) => {
  if (score >= 80) return { 
    label: 'Excellent', 
    color: Colors.excellent || '#10b981', 
    icon: '🏆',
    description: 'Great mental wellness!',
    gradient: ['#10b981', '#34d399']
  };
  if (score >= 70) return { 
    label: 'Stable', 
    color: Colors.stable, 
    icon: '✅',
    description: 'Good balance maintained',
    gradient: ['#3b82f6', '#60a5fa']
  };
  if (score >= 50) return { 
    label: 'Mild Concern', 
    color: Colors.warning, 
    icon: '⚠️',
    description: 'Needs attention',
    gradient: ['#f59e0b', '#fbbf24']
  };
  return { 
    label: 'High Risk', 
    color: Colors.danger, 
    icon: '🚨',
    description: 'Immediate support recommended',
    gradient: ['#ef4444', '#f87171']
  };
};

// Wellness Milestones
const WELLNESS_MILESTONES = [
  { threshold: 0.25, label: 'Beginner', icon: '🌱' },
  { threshold: 0.5, label: 'Explorer', icon: '🚶' },
  { threshold: 0.75, label: 'Achiever', icon: '⭐' },
  { threshold: 0.9, label: 'Master', icon: '🏆' },
];

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  // Backend data
  const [mindBalanceScore, setMindBalanceScore] = useState(0);
  const [progressMilestone, setProgressMilestone] = useState(0);
  const [weeklyMoods, setWeeklyMoods] = useState([]);
  const [aiRiskDetected, setAiRiskDetected] = useState(false);
  const [riskPatterns, setRiskPatterns] = useState([]);
  const [trustedPersonStatus, setTrustedPersonStatus] = useState('inactive');
  const [wellnessStreak, setWellnessStreak] = useState(0);

  const risk = useMemo(() => getRiskLevel(mindBalanceScore), [mindBalanceScore]);

  const startAnimations = () => {
    // Pulse animation for important elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide animation for cards
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  };

  const getCurrentMilestone = () => {
    return WELLNESS_MILESTONES
      .filter(milestone => progressMilestone >= milestone.threshold)
      .pop() || WELLNESS_MILESTONES[0];
  };

  const getRiskPatternsSummary = () => {
    if (!riskPatterns.length) return "No concerning patterns detected";
    
    const patterns = riskPatterns.slice(0, 2);
    return patterns.map(pattern => pattern.type).join(', ');
  };

  const getTrustedPersonStatusText = () => {
    const statusMap = {
      active: { text: 'Active - Notifications Enabled', color: '#10b981', icon: '🔔' },
      inactive: { text: 'Inactive - Setup Required', color: '#6b7280', icon: '⚙️' },
      notified: { text: 'Recently Notified', color: '#f59e0b', icon: '📤' }
    };
    return statusMap[trustedPersonStatus] || statusMap.inactive;
  };

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const data = await getDashboard('7d');

      setMindBalanceScore(Math.round(data?.mindBalanceScore ?? 0));
      setProgressMilestone(Math.max(0, Math.min(1, data?.progressMilestone ?? 0)));
      setWeeklyMoods(Array.isArray(data?.weeklyMoods) ? data.weeklyMoods : []);
      setAiRiskDetected(!!data?.aiRiskDetected);
      setRiskPatterns(data?.riskPatterns || []);
      setTrustedPersonStatus(data?.trustedPersonStatus || 'inactive');
      setWellnessStreak(data?.wellnessStreak || 0);

      startAnimations();
    } catch (e) {
      console.error('Dashboard load failed:', e);
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const cardSlide = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const renderRiskIndicator = () => (
    <Animated.View 
      style={[
        styles.riskIndicator,
        { 
          backgroundColor: risk.color,
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      <Text style={styles.riskIndicatorText}>
        {risk.icon} {risk.label}
      </Text>
      <Text style={styles.riskIndicatorSubtext}>{risk.description}</Text>
    </Animated.View>
  );

  const renderWellnessStreak = () => (
    <View style={styles.streakContainer}>
      <Ionicons name="flame" size={24} color="#f59e0b" />
      <Text style={styles.streakText}>{wellnessStreak} day streak</Text>
      {wellnessStreak > 7 && (
        <Text style={styles.streakSubtext}>Keep going! 🔥</Text>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.secondary}
          colors={[Colors.secondary]}
        />
      }>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={styles.loading}>Analyzing your wellness patterns…</Text>
        </View>
      ) : error ? (
        <Card>
          <Text style={[styles.title, { color: Colors.danger }]}>Couldn't load dashboard</Text>
          <Text style={styles.description}>{String(error)}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Text style={styles.retryText}>🔄 Tap to retry</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          {/* Header with Risk Status */}
          {renderRiskIndicator()}

          <Animated.View style={{ transform: [{ translateY: cardSlide }] }}>
            {/* Mind Balance Score with Visual Meter */}
            <Card style={[styles.shadowCard, styles.scoreCard]}>
              <View style={styles.scoreHeader}>
                <Text style={styles.title}>⚖️ Mind Balance Score</Text>
                {renderWellnessStreak()}
              </View>
              
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{mindBalanceScore}/100</Text>
                <View style={styles.scoreMeter}>
                  <View 
                    style={[
                      styles.scoreFill,
                      { 
                        width: `${mindBalanceScore}%`,
                        backgroundColor: risk.color
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Milestone Progress */}
              <View style={styles.milestoneContainer}>
                <Text style={styles.milestoneTitle}>
                  {getCurrentMilestone().icon} {getCurrentMilestone().label}
                </Text>
                <ProgressBarCustom 
                  progress={progressMilestone} 
                  showLabel 
                  height={12}
                  gradient={risk.gradient}
                />
                <Text style={styles.milestoneText}>
                  {Math.round((1 - progressMilestone) * 100)}% to next level
                </Text>
              </View>
            </Card>

            {/* AI Risk Detection with Pattern Insights */}
            <Card style={[styles.shadowCard, styles.riskCard]}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('RiskDetail')}
                style={styles.touchableCard}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>🤖 AI Risk Intelligence</Text>
                  <Ionicons 
                    name="analytics" 
                    size={20} 
                    color={aiRiskDetected ? Colors.danger : Colors.stable} 
                  />
                </View>
                
                <View style={styles.riskStatus}>
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: aiRiskDetected ? Colors.danger : Colors.stable }
                  ]}>
                    <Text style={styles.statusText}>
                      {aiRiskDetected ? 'Pattern Alert' : 'All Clear'}
                    </Text>
                  </View>
                  
                  <Text style={styles.riskDescription}>
                    {aiRiskDetected 
                      ? `AI detected ${riskPatterns.length} concerning patterns` 
                      : 'No behavioral risks identified'
                    }
                  </Text>
                  
                  {riskPatterns.length > 0 && (
                    <Text style={styles.patternSummary}>
                      {getRiskPatternsSummary()}
                    </Text>
                  )}
                </View>

                <View style={styles.riskFeatures}>
                  <View style={styles.featureItem}>
                    <Ionicons name="pulse" size={16} color={Colors.secondary} />
                    <Text style={styles.featureText}>Real-time Monitoring</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="trending-up" size={16} color={Colors.secondary} />
                    <Text style={styles.featureText}>Pattern Analysis</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons name="alert-circle" size={16} color={Colors.secondary} />
                    <Text style={styles.featureText}>Early Warnings</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>View Detailed Analysis</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            </Card>

            {/* Weekly Mood Analytics */}
            <Card style={styles.shadowCard}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('MoodStats')}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>📊 Mood Analytics</Text>
                  <Text style={styles.subtitle}>7-day trend analysis</Text>
                </View>

                <LineChart
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                      data: weeklyMoods.length ? weeklyMoods : [3, 3, 3, 3, 3, 3, 3],
                    }],
                  }}
                  width={screenWidth}
                  height={200}
                  yAxisInterval={1}
                  fromZero
                  chartConfig={{
                    backgroundColor: Colors.card,
                    backgroundGradientFrom: Colors.card,
                    backgroundGradientTo: Colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                    labelColor: () => Colors.textSecondary,
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: Colors.secondary,
                    },
                    fillShadowGradient: Colors.secondary,
                    fillShadowGradientOpacity: 0.1,
                  }}
                  bezier
                  style={styles.chart}
                />

                {weeklyMoods.length ? (
                  <View style={styles.moodInsights}>
                    <Text style={styles.insightTitle}>AI Insights:</Text>
                    <Text style={styles.insightText}>
                      {mindBalanceScore >= 70 
                        ? "Consistent positive patterns detected 🌟" 
                        : "Variability observed - track daily patterns"
                      }
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="stats-chart" size={32} color={Colors.textSecondary} />
                    <Text style={styles.emptyText}>Start logging to see analytics</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>Explore Detailed Statistics</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            </Card>

            {/* Trusted Person Network */}
            <Card style={[styles.shadowCard, styles.trustedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>👨‍👩‍👧 Trusted Support Network</Text>
                <Ionicons name="people" size={20} color={Colors.secondary} />
              </View>

              <View style={styles.trustedStatus}>
                <Text style={[
                  styles.trustedStatusText, 
                  { color: getTrustedPersonStatusText().color }
                ]}>
                  {getTrustedPersonStatusText().icon} {getTrustedPersonStatusText().text}
                </Text>
                
                {trustedPersonStatus === 'active' && (
                  <Text style={styles.trustedDescription}>
                    Your trusted person will receive automated alerts if concerning patterns are detected
                  </Text>
                )}
              </View>

              <TouchableOpacity 
                style={styles.trustedButton}
                onPress={() => navigation.navigate('TrustedPerson')}
              >
                <Text style={styles.trustedButtonText}>
                  {trustedPersonStatus === 'active' ? 'Manage Settings' : 'Setup Trusted Contact'}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* Quick Report Generation */}
            <Card style={styles.shadowCard}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('Report')}
                style={styles.reportCard}
              >
                <View style={styles.reportHeader}>
                  <Ionicons name="document-text" size={24} color={Colors.secondary} />
                  <View>
                    <Text style={styles.title}>📑 Wellness Report</Text>
                    <Text style={styles.reportSubtitle}>AI-powered insights</Text>
                  </View>
                </View>

                <View style={styles.reportFeatures}>
                  <Text style={styles.reportFeature}>• PDF Export</Text>
                  <Text style={styles.reportFeature}>• Trend Analysis</Text>
                  <Text style={styles.reportFeature}>• Healthcare Ready</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>Generate Custom Report</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: 16,
  },
  center: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 48 
  },
  loading: { 
    marginTop: 12, 
    color: Colors.textSecondary,
    fontSize: 16,
  },
  riskIndicator: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  riskIndicatorText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  riskIndicatorSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  scoreCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  score: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  scoreMeter: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 1s ease-in-out',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 4,
  },
  streakSubtext: {
    fontSize: 10,
    color: '#f59e0b',
    marginLeft: 4,
  },
  milestoneContainer: {
    marginTop: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  milestoneText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  riskCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  riskStatus: {
    marginBottom: 16,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  riskDescription: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patternSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  riskFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  touchableCard: {
    opacity: 1,
  },
  chart: { 
    marginVertical: 8, 
    borderRadius: 12 
  },
  moodInsights: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  insightText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  trustedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  trustedStatus: {
    marginBottom: 16,
  },
  trustedStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  trustedDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  trustedButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  trustedButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportCard: {
    opacity: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reportFeatures: {
    marginBottom: 16,
  },
  reportFeature: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  description: { 
    fontSize: 15, 
    color: Colors.textSecondary, 
    lineHeight: 20,
    marginBottom: 12,
  },
  link: { 
    color: Colors.secondary, 
    fontWeight: '600',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  shadowCard: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
});