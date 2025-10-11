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
import Card from '../components/Card';
import ProgressBarCustom from '../components/ProgressBarCustom';
import { Colors } from '../utils/Colors';
import { getDashboard } from '../services/analytics';
import MotivationCard from '../components/MotivationCard';
import MoodCalendar from '../components/MoodCalendar';

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

export default function DashboardScreen({ navigation }) {
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
  }, [mindBalanceScore]);

  /* ---------------------------- Helper Functions ---------------------------- */
  const getCurrentMilestone = () =>
    WELLNESS_MILESTONES.filter((m) => progressMilestone >= m.threshold).pop() ||
    WELLNESS_MILESTONES[0];

  const getRiskPatternsSummary = () => {
    if (!riskPatterns.length) return 'No concerning patterns detected';
  const patterns = (riskPatterns || []).slice(0, 2);
    return patterns.map((pattern) => pattern.type).join(', ');
  };

  const getTrustedPersonStatusText = () => {
    const statusMap = {
      active: { text: 'Active - Notifications Enabled', color: '#10B981', icon: '🔔' },
      inactive: { text: 'Inactive - Setup Required', color: '#6B7280', icon: '⚙️' },
      notified: { text: 'Recently Notified', color: '#F59E0B', icon: '📤' },
    };
    return statusMap[trustedPersonStatus] || statusMap.inactive;
  };

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
        { backgroundColor: risk.color, transform: [{ scale: pulseAnim }] },
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
      <Ionicons name="flame" size={22} color="#F59E0B" />
      <Text style={styles.streakText}>{wellnessStreak} day streak</Text>
      {wellnessStreak > 7 && <Text style={styles.streakSubtext}>Keep going! 🔥</Text>}
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

            <MoodCalendar />
            <MotivationCard score={mindBalanceScore} moodData={weeklyMoods} showRefresh />

            {/* AI Risk Detection */}
            <Card style={[styles.shadowCard, styles.riskCard]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('RiskDetail')}
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
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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

            {/* AI Insights */}
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

            {/* Banner Image */}
            
            <Image
              source={require('../assets/dashboard.png')}
              style={{
                width: '75%',
                height: 170,
                borderRadius: 16,
                marginTop: 7,
                marginBottom: 6,
                alignSelf: 'center',
              }}
              resizeMode="cover"
            />
            <Text
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: Colors.secondary,
                fontWeight: '700',
                marginBottom: 70,
                letterSpacing: 1.1,
              }}
            >
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
    backgroundColor: Colors.background, // #F5F7FA
    padding: 16,
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  loading: { marginTop: 12, color: Colors.textSecondary, fontSize: 16 },
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
  riskIndicatorText: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  riskIndicatorSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  scoreCard: { borderLeftWidth: 4, borderLeftColor: Colors.secondary, backgroundColor: Colors.card },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: { alignItems: 'center', marginBottom: 16 },
  score: { fontSize:42, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
scoreMeter: { width: '100%', height: 8, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden' },
scoreFill: { height: '100%', borderRadius: 4 },
streakContainer: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: 'rgba(245,158,11,0.1)',
paddingHorizontal: 12,
paddingVertical: 6,
borderRadius: 16,
},
streakText: { fontSize: 12, fontWeight: '600', color: '#F59E0B', marginLeft: 4 },
streakSubtext: { fontSize: 10, color: '#F59E0B', marginLeft: 4 },
milestoneContainer: { marginTop: 8 },
milestoneTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
milestoneText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
riskCard: { borderLeftWidth: 4, borderLeftColor: Colors.danger, backgroundColor: Colors.card },
cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
subtitle: { fontSize: 12, color: Colors.textSecondary },
riskStatus: { marginBottom: 16 },
statusIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 8 },
statusText: { color: '#fff', fontWeight: '600', fontSize: 12 },
riskDescription: { fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
patternSummary: { fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
riskFeatures: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
featureItem: { flexDirection: 'row', alignItems: 'center' },
featureText: { fontSize: 10, color: Colors.textSecondary, marginLeft: 4 },
chart: { marginVertical: 8, borderRadius: 12 },
moodInsights: { backgroundColor: 'rgba(74,144,226,0.05)', padding: 12, borderRadius: 8, marginTop: 8 },
insightTitle: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
insightText: { fontSize: 11, color: Colors.textSecondary },
emptyState: { alignItems: 'center', padding: 20 },
emptyText: { marginTop: 8, color: Colors.textSecondary, fontSize: 12 },
trustedCard: { borderLeftWidth: 4, borderLeftColor: Colors.accent, backgroundColor: Colors.card },
trustedStatus: { marginBottom: 16 },
trustedStatusText: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
trustedDescription: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
trustedButton: {
backgroundColor: Colors.secondary,
paddingVertical: 12,
paddingHorizontal: 16,
borderRadius: 8,
alignItems: 'center',
},
trustedButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
reportSubtitle: { fontSize: 12, color: Colors.textSecondary },
reportFeatures: { marginBottom: 16 },
reportFeature: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingBottom: 10 },
title: { fontSize: 18, fontWeight: '600', color: Colors.secondary },
description: { fontSize: 15, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
link: { color: Colors.accent, fontWeight: '600', fontSize: 14 },
retryButton: { backgroundColor: Colors.accent, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
retryText: { color: '#fff', fontWeight: '600' },
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
