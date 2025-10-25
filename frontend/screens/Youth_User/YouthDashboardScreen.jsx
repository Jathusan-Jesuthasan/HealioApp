// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// export default function YouthDashboardScreen({ route }) {
//   // Optional: receive youth info when navigating: navigation.navigate('YouthDashboard', { youth })
//   const youth = route?.params?.youth ?? { name: 'Demo Youth' };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Youth Dashboard</Text>
//       <Text style={styles.sub}>Monitoring: {youth.name}</Text>

//       {/* TODO: Replace with charts, recent moods, alerts, trends, etc. */}
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Recent Activity</Text>
//         <Text style={styles.cardText}>No data yet. Hook this to your backend.</Text>
//       </View>
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Risk Signals</Text>
//         <Text style={styles.cardText}>Show elevated/normal markers here.</Text>
//       </View>
//     </View>
//   );
// }
// /screens/DashboardScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  Image,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/Card';
import ProgressBarCustom from '../../components/ProgressBarCustom';
import { Colors } from '../../utils/Colors';
import { getDashboard } from '../../services/analytics';
import MotivationCard from '../../components/MotivationCard';
import MoodCalendar from '../../components/MoodCalendar';
import BMICalculator from '../../components/BMICalculator';

/* -------------------------------- Risk Levels -------------------------------- */
const getRiskLevel = (score) => {
  if (score >= 80)
    return {
      label: 'Excellent',
      color: Colors.excellent || '#10B981',
      icon: '🏆',
      description: 'Great mental wellness!',
      gradient: ['#10B981', '#34D399'],
    };
  if (score >= 70)
    return {
      label: 'Stable',
      color: Colors.stable || '#3B82F6',
      icon: '✅',
      description: 'Good balance maintained',
      gradient: ['#3B82F6', '#60A5FA'],
    };
  if (score >= 50)
    return {
      label: 'Mild Concern',
      color: Colors.warning || '#F59E0B',
      icon: '⚠️',
      description: 'Needs attention',
      gradient: ['#F59E0B', '#FBBF24'],
    };
  return {
    label: 'High Risk',
    color: Colors.danger || '#EF4444',
    icon: '🚨',
    description: 'Immediate support recommended',
    gradient: ['#EF4444', '#F87171'],
  };
};

/* -------------------------- Wellness Milestone Levels -------------------------- */
const WELLNESS_MILESTONES = [
  { threshold: 0.25, label: 'Beginner', icon: '🌱' },
  { threshold: 0.5, label: 'Explorer', icon: '🚶' },
  { threshold: 0.75, label: 'Achiever', icon: '⭐' },
  { threshold: 0.9, label: 'Master', icon: '🏆' },
];

export default function YouthDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const screenWidth = Math.min(width - 48, 720);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [barAnim] = useState(new Animated.Value(0));

  const [mindBalanceScore, setMindBalanceScore] = useState(0);
  const [progressMilestone, setProgressMilestone] = useState(0);
  const [weeklyMoods, setWeeklyMoods] = useState([]);
  const [aiRiskDetected, setAiRiskDetected] = useState(false);
  const [riskPatterns, setRiskPatterns] = useState([]);
  const [trustedPersonStatus, setTrustedPersonStatus] = useState('inactive');
  const [wellnessStreak, setWellnessStreak] = useState(0);

  const risk = useMemo(() => getRiskLevel(mindBalanceScore), [mindBalanceScore]);

  /* -------------------------------- Animations -------------------------------- */
  const startAnimations = useCallback(() => {
    const pulse = Animated.loop(
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
    );
    pulse.start();

    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    Animated.timing(barAnim, {
      toValue: mindBalanceScore,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    return () => pulse.stop();
  }, [mindBalanceScore, pulseAnim, slideAnim, barAnim]);

  /* ---------------------------- Helper Functions ---------------------------- */
  const getCurrentMilestone = () =>
    WELLNESS_MILESTONES.filter((m) => progressMilestone >= m.threshold).pop() ||
    WELLNESS_MILESTONES[0];

  const getRiskPatternsSummary = () => {
    if (!riskPatterns || riskPatterns.length === 0) return 'No concerning patterns detected';
    const patterns = (riskPatterns || []).slice(0, 2);
    return patterns.map((p) => p.type).join(', ');
  };

  const getTrustedPersonStatusText = () => {
    const statusMap = {
      active: { text: 'Active - Notifications Enabled', color: '#10B981', icon: '🔔' },
      inactive: { text: 'Inactive - Setup Required', color: '#6B7280', icon: '⚙️' },
      notified: { text: 'Recently Notified', color: '#F59E0B', icon: '📤' },
    };
    return statusMap[trustedPersonStatus] || statusMap.inactive;
  };

  const last7Labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* -------------------------------- Load Data -------------------------------- */
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
  }, [startAnimations]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    startAnimations();
    setRefreshing(false);
  }, [load, startAnimations]);

  /* -------------------------------- UI Blocks -------------------------------- */
  const cardSlide = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const animatedBarWidth = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const renderRiskIndicator = () => (
    <Animated.View
      style={[
        styles.riskIndicator,
        { 
          backgroundColor: risk.color, 
          transform: [{ scale: pulseAnim }],
          borderLeftWidth: 6,
          borderLeftColor: '#fff',
        },
      ]}
    >
      <View style={styles.riskContent}>
        <Text style={styles.riskIndicatorText}>
          {risk.icon} {risk.label}
        </Text>
        <Text style={styles.riskIndicatorSubtext}>{risk.description}</Text>
        {mindBalanceScore >= 70 && (
          <View style={styles.positiveBadge}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Text style={styles.positiveText}>You're doing great!</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderWellnessStreak = () => (
    <View style={styles.streakContainer}>
      <Ionicons name="flame" size={22} color="#F59E0B" />
      <Text style={styles.streakText}>{wellnessStreak} day streak</Text>
      {wellnessStreak > 7 && (
        <View style={styles.fireBadge}>
          <Text style={styles.streakSubtext}>Keep going! 🔥</Text>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={styles.quickAction}
        onPress={() => navigation.navigate('MoodLog')}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
          <Ionicons name="happy" size={20} color="#8B5CF6" />
        </View>
        <Text style={styles.actionText}>Log Mood</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickAction}
        onPress={() => navigation.navigate('Activity', { screen: 'Meditation' })}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
          <Ionicons name="water" size={20} color="#3B82F6" />
        </View>
        <Text style={styles.actionText}>Breathe</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickAction}
        onPress={() => navigation.navigate('Activity', { screen: 'Journal' })}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Ionicons name="book" size={20} color="#10B981" />
        </View>
        <Text style={styles.actionText}>Journal</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickAction}
        onPress={() => navigation.navigate('Resources')}
      >
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
          <Ionicons name="library" size={20} color="#F59E0B" />
        </View>
        <Text style={styles.actionText}>Resources</Text>
      </TouchableOpacity>
    </View>
  );

  /* ---------------------------------- Render ---------------------------------- */
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.secondary}
          colors={[Colors.secondary]}
        />
      }
    >
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
          {renderRiskIndicator()}

          {/* Quick Actions */}
          {renderQuickActions()}

          <Animated.View style={{ transform: [{ translateY: cardSlide }] }}>
            {/* Mind Balance Score */}
            <Card style={[styles.shadowCard, styles.scoreCard]}>
              <View style={styles.scoreHeader}>
                <Text style={styles.title}>⚖️ Mind Balance Score</Text>
                {renderWellnessStreak()}
              </View>

              <View style={styles.scoreContainer}>
                <Text style={styles.score}>{mindBalanceScore}/100</Text>
                <View style={styles.scoreMeter}>
                  <Animated.View
                    style={[
                      styles.scoreFill,
                      { width: animatedBarWidth, backgroundColor: risk.color },
                    ]}
                  />
                </View>
              </View>

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

            {/* Mood Calendar */}
            <MoodCalendar />

            {/* Motivation Card */}
            <MotivationCard score={mindBalanceScore} moodData={weeklyMoods} showRefresh />

            {/* BMI Calculator */}
            <BMICalculator />

            {/* AI Risk Detection */}
            <Card style={[styles.shadowCard, styles.riskCard]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('RiskDetail')}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>🤖 AI Risk Intelligence</Text>
                  <View style={styles.statusBadge}>
                    <Ionicons
                      name="analytics"
                      size={16}
                      color={aiRiskDetected ? Colors.danger : Colors.stable}
                    />
                    <Text style={[
                      styles.statusBadgeText, 
                      { color: aiRiskDetected ? Colors.danger : Colors.stable }
                    ]}>
                      {aiRiskDetected ? 'Alert' : 'Clear'}
                    </Text>
                  </View>
                </View>

                <View style={styles.riskStatus}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: aiRiskDetected ? Colors.danger : Colors.stable,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {aiRiskDetected ? 'Pattern Alert' : 'All Clear'}
                    </Text>
                  </View>

                  <Text style={styles.riskDescription}>
                    {aiRiskDetected
                      ? `AI detected ${riskPatterns.length} concerning patterns`
                      : 'No behavioral risks identified'}
                  </Text>

                  {riskPatterns.length > 0 && (
                    <Text style={styles.patternSummary}>{getRiskPatternsSummary()}</Text>
                  )}
                </View>

                <View style={styles.riskFeatures}>
                  {[
                    ['pulse', 'Real-time Monitoring'],
                    ['trending-up', 'Pattern Analysis'],
                    ['alert-circle', 'Early Warnings'],
                  ].map(([icon, text]) => (
                    <View key={text} style={styles.featureItem}>
                      <Ionicons name={icon} size={16} color={Colors.secondary} />
                      <Text style={styles.featureText}>{text}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>View Detailed Analysis</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            </Card>

            {/* Mood Analytics */}
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
                    labels: last7Labels,
                    datasets: [
                      { data: weeklyMoods.length ? weeklyMoods : [3, 3, 3, 3, 3, 3, 3] },
                    ],
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
                    color: (opacity = 1) => `rgba(74,144,226,${opacity})`,
                    labelColor: () => Colors.textSecondary,
                    propsForDots: { r: '6', strokeWidth: '2', stroke: Colors.secondary },
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
                        ? 'Consistent positive patterns detected 🌟'
                        : 'Variability observed — track daily patterns'}
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

            {/* Trusted Person */}
            <Card style={[styles.shadowCard, styles.trustedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>👨‍👩‍👧 Trusted Support Network</Text>
                <Ionicons name="people" size={20} color={Colors.secondary} />
              </View>

              <View style={styles.trustedStatus}>
                <Text
                  style={[
                    styles.trustedStatusText,
                    { color: getTrustedPersonStatusText().color },
                  ]}
                >
                  {getTrustedPersonStatusText().icon} {getTrustedPersonStatusText().text}
                </Text>

                {trustedPersonStatus === 'active' && (
                  <Text style={styles.trustedDescription}>
                    Your trusted person will receive automated alerts if concerning patterns are
                    detected.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.trustedButton}
                onPress={() => navigation.navigate('TrustedPerson')}
              >
                <Text style={styles.trustedButtonText}>
                  {trustedPersonStatus === 'active'
                    ? 'Manage Settings'
                    : 'Setup Trusted Contact'}
                </Text>
              </TouchableOpacity>
            </Card>

            {/* AI Insights History */}
            <Card style={styles.shadowCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AIInsightsHistory')}
              >
                <View style={styles.reportHeader}>
                  <Ionicons name="analytics" size={24} color={Colors.secondary} />
                  <View>
                    <Text style={styles.title}>🤖 AI Insights History</Text>
                    <Text style={styles.reportSubtitle}>All your past AI risk analyses</Text>
                  </View>
                </View>

                <View style={styles.reportFeatures}>
                  {['• Risk Level Timeline', '• AI Suggestions', '• Mood Pattern Archive'].map((f) => (
                    <Text key={f} style={styles.reportFeature}>
                      {f}
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.link}>View AI Insights History</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.secondary} />
                </View>
              </TouchableOpacity>
            </Card>

            {/* Wellness Tips */}
            <Card style={[styles.shadowCard, styles.tipsCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>💡 Daily Wellness Tips</Text>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
              </View>
              
              <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                  <Ionicons name="water" size={16} color="#3B82F6" />
                  <Text style={styles.tipText}>Stay hydrated - drink 8 glasses today</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="walk" size={16} color="#10B981" />
                  <Text style={styles.tipText}>Take a 10-minute walk outside</Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="moon" size={16} color="#8B5CF6" />
                  <Text style={styles.tipText}>Aim for 8 hours of sleep tonight</Text>
                </View>
              </View>
            </Card>

            {/* Banner Image */}
            <Image
              source={require('../../assets/dashboard.png')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <Text style={styles.bannerText}>
               - Healio walks with you -
            </Text>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

/* ---------------------------------- Styles ---------------------------------- */
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
    fontSize: 16 
  },
  riskIndicator: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  riskContent: {
    alignItems: 'center',
  },
  riskIndicatorText: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#fff', 
    marginBottom: 6,
    textAlign: 'center'
  },
  riskIndicatorSubtext: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.9)', 
    fontWeight: '500',
    textAlign: 'center'
  },
  positiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  positiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.secondary, 
    backgroundColor: Colors.card 
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: { 
    alignItems: 'center', 
    marginBottom: 16 
  },
  score: { 
    fontSize: 42, 
    fontWeight: '800', 
    color: Colors.textPrimary, 
    marginBottom: 12 
  },
  scoreMeter: { 
    width: '100%', 
    height: 8, 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  scoreFill: { 
    height: '100%', 
    borderRadius: 4 
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  streakText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#F59E0B', 
    marginLeft: 4 
  },
  fireBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  streakSubtext: { 
    fontSize: 10, 
    color: '#F59E0B' 
  },
  milestoneContainer: { 
    marginTop: 8 
  },
  milestoneTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    marginBottom: 8 
  },
  milestoneText: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    marginTop: 4, 
    textAlign: 'center' 
  },
  riskCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.danger, 
    backgroundColor: Colors.card 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: { 
    fontSize: 12, 
    color: Colors.textSecondary 
  },
  riskStatus: { 
    marginBottom: 16 
  },
  statusIndicator: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    alignSelf: 'flex-start', 
    marginBottom: 8 
  },
  statusText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 12 
  },
  riskDescription: { 
    fontSize: 14, 
    color: Colors.textPrimary, 
    marginBottom: 4 
  },
  patternSummary: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    fontStyle: 'italic' 
  },
  riskFeatures: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  featureItem: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  featureText: { 
    fontSize: 10, 
    color: Colors.textSecondary, 
    marginLeft: 4 
  },
  chart: { 
    marginVertical: 8, 
    borderRadius: 12 
  },
  moodInsights: { 
    backgroundColor: 'rgba(74,144,226,0.05)', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 8 
  },
  insightTitle: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: Colors.textPrimary, 
    marginBottom: 2 
  },
  insightText: { 
    fontSize: 11, 
    color: Colors.textSecondary 
  },
  emptyState: { 
    alignItems: 'center', 
    padding: 20 
  },
  emptyText: { 
    marginTop: 8, 
    color: Colors.textSecondary, 
    fontSize: 12 
  },
  trustedCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: Colors.accent, 
    backgroundColor: Colors.card 
  },
  trustedStatus: { 
    marginBottom: 16 
  },
  trustedStatusText: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 8 
  },
  trustedDescription: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    lineHeight: 16 
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
    fontSize: 14 
  },
  reportHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  reportSubtitle: { 
    fontSize: 12, 
    color: Colors.textSecondary 
  },
  reportFeatures: { 
    marginBottom: 16 
  },
  reportFeature: { 
    fontSize: 12, 
    color: Colors.textSecondary, 
    marginBottom: 2 
  },
  tipsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsContainer: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderRadius: 8,
  },
  tipText: {
    fontSize: 12,
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 8, 
    paddingBottom: 10 
  },
  title: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.secondary 
  },
  description: { 
    fontSize: 15, 
    color: Colors.textSecondary, 
    lineHeight: 20, 
    marginBottom: 12 
  },
  link: { 
    color: Colors.accent, 
    fontWeight: '600', 
    fontSize: 14 
  },
  retryButton: { 
    backgroundColor: Colors.accent, 
    padding: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 8 
  },
  retryText: { 
    color: '#fff', 
    fontWeight: '600' 
  },
  bannerImage: {
    width: '75%',
    height: 170,
    borderRadius: 16,
    marginTop: 7,
    marginBottom: 6,
    alignSelf: 'center',
  },
  bannerText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: '700',
    marginBottom: 70,
    letterSpacing: 1.1,
  },
  shadowCard: {
    backgroundColor: Colors.card,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
  },
});