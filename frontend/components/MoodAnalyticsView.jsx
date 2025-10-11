// /components/MoodAnalyticsView.jsx
import React, { useMemo, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/Colors';

// ✅ FIXED: Move generateLabels function outside the component
const generateLabels = (range, count) => {
  switch (range) {
    case '7d':
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, count);
    case '30d':
      return Array.from({ length: Math.min(count, 4) }, (_, i) => `W${i + 1}`);
    case '90d':
      return ['Jan', 'Feb', 'Mar'].slice(0, Math.min(count, 3));
    case '180d':
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].slice(0, Math.min(count, 6));
    case '365d':
      return ['Q1', 'Q2', 'Q3', 'Q4'].slice(0, Math.min(count, 4));
    default:
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, count);
  }
};

export default function MoodAnalyticsView({ dashboard, riskHistory, selectedWidgets, range: propRange, onRangeChange }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenWidth > 414;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [range, setRange] = useState(propRange || '7d');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

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
    },
    chart: {
      width: Math.min(screenWidth - 40, 400),
      height: isSmallScreen ? 180 : 220,
    }
  };

  // Sync with parent prop if provided
  React.useEffect(() => {
    if (propRange && propRange !== range) setRange(propRange);
  }, [propRange]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [dashboard]);

  // Enhanced data processing
  const chartData = useMemo(() => {
    const baseMoods = dashboard?.weeklyMoods || [3, 4, 3, 4, 5, 4, 3];
    const labels = generateLabels(range, baseMoods.length);
    return {
      labels,
      datasets: [{ 
        data: baseMoods,
        color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
        strokeWidth: 2
      }],
    };
  }, [dashboard, range]);

  const calculateMoodStability = () => {
    const moods = dashboard?.weeklyMoods || [];
    if (moods.length < 2) return 100;
    const mean = moods.reduce((a, b) => a + b, 0) / moods.length;
    const variance = moods.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / moods.length;
    return Math.max(0, Math.min(100, Math.round(100 - (Math.sqrt(variance) / 4) * 100)));
  };

  const getTopFactors = () => {
    const factors = dashboard?.moodLogs?.flatMap(log => log.factors || []) || [];
    const count = factors.reduce((acc, f) => {
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const getMoodDistribution = () => {
    const moods = dashboard?.moodLogs?.map(m => m.mood) || [];
    const dist = { 
      '😊 Happy': 0, 
      '😐 Neutral': 0, 
      '😢 Sad': 0, 
      '😠 Frustrated': 0, 
      '😴 Tired': 0,
      '😰 Anxious': 0
    };
    
    moods.forEach(m => {
      if (dist[m] !== undefined) dist[m]++;
    });
    
    return Object.entries(dist)
      .filter(([_, count]) => count > 0)
      .map(([name, population], index) => ({
        name,
        population,
        color: Colors.chartColors?.[index % Colors.chartColors.length] || 
               ['#4ADE80', '#60A5FA', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'][index],
        legendFontColor: Colors.textPrimary,
        legendFontSize: isSmallScreen ? 10 : 12,
      }));
  };

  const getProgressData = () => {
    const stability = calculateMoodStability() / 100;
    const positivity = dashboard?.mindBalanceScore ? dashboard.mindBalanceScore / 100 : 0.7;
    const consistency = dashboard?.moodLogs ? Math.min(dashboard.moodLogs.length / 30, 1) : 0.5;
    
    return {
      labels: ['Stability', 'Positivity', 'Consistency'],
      data: [stability, positivity, consistency],
      colors: [
        Colors.chartColors?.[0] || '#4ADE80',
        Colors.chartColors?.[1] || '#60A5FA', 
        Colors.chartColors?.[2] || '#F59E0B'
      ]
    };
  };

  const getWeeklyBreakdownData = () => {
    const breakdown = dashboard?.weeklyBreakdown || {
      Monday: 3.2, Tuesday: 3.8, Wednesday: 4.1, Thursday: 3.9,
      Friday: 4.3, Saturday: 4.5, Sunday: 4.0
    };
    
    return {
      labels: Object.keys(breakdown).map(day => day.slice(0, 3)),
      datasets: [{
        data: Object.values(breakdown),
      }],
    };
  };

  const getRiskTrendData = () => {
    const risks = riskHistory.length > 0 ? riskHistory : [2, 3, 1, 2, 1, 3, 2];
    return {
      labels: generateLabels(range, risks.length),
      datasets: [{
        data: risks,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      }],
    };
  };

  const getWellnessStreak = () => {
    const logs = dashboard?.moodLogs || [];
    return Math.min(logs.length, 7); // Mock streak for demo
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: () => Colors.textSecondary,
    fillShadowGradient: Colors.secondary,
    fillShadowGradientOpacity: 0.15,
    propsForDots: { r: isSmallScreen ? '3' : '4', strokeWidth: '2' },
    style: { borderRadius: 16 },
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
    setFilterModalVisible(false);
    if (onRangeChange) onRangeChange(newRange);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const TimeRangeFilter = () => (
    <Modal
      visible={filterModalVisible}
      animationType="fade"
      transparent
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { fontSize: responsive.fontSize.title }]}>
              View Time Period
            </Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={responsive.icon.medium} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterOptions}>
            {[
              { label: 'Past Week', value: '7d', icon: 'calendar-outline', color: '#4ADE80' },
              { label: 'Past Month', value: '30d', icon: 'calendar', color: '#60A5FA' },
              { label: '3 Months', value: '90d', icon: 'business', color: '#F59E0B' },
              { label: '6 Months', value: '180d', icon: 'bar-chart', color: '#8B5CF6' },
              { label: 'Past Year', value: '365d', icon: 'trophy', color: '#EF4444' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  range === option.value && [styles.filterOptionActive, { borderLeftColor: option.color }]
                ]}
                onPress={() => handleRangeChange(option.value)}
              >
                <View style={styles.filterOptionContent}>
                  <Ionicons 
                    name={option.icon} 
                    size={responsive.icon.small} 
                    color={range === option.value ? '#fff' : option.color} 
                  />
                  <Text style={[
                    styles.filterOptionText,
                    { fontSize: responsive.fontSize.body },
                    range === option.value && styles.filterOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {range === option.value && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const MetricCard = ({ icon, value, label, trend, color }) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={responsive.icon.small} color={color} />
      </View>
      <Text style={[styles.metricValue, { fontSize: responsive.fontSize.title }]}>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { fontSize: responsive.fontSize.small }]}>
        {label}
      </Text>
      <Text style={[styles.metricTrend, { fontSize: responsive.fontSize.small }]}>
        {trend}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Range Header */}
        <View style={styles.timeRangeHeader}>
          <View>
            <Text style={[styles.timeRangeTitle, { fontSize: responsive.fontSize.body }]}>
              Showing Data For
            </Text>
            <Text style={[styles.timeRangeValue, { fontSize: responsive.fontSize.subtitle }]}>
              {range === '7d' ? 'Past Week' : 
               range === '30d' ? 'Past Month' : 
               range === '90d' ? '3 Months' : 
               range === '180d' ? '6 Months' : 'Past Year'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options" size={responsive.icon.small} color={Colors.secondary} />
            <Text style={[styles.filterButtonText, { fontSize: responsive.fontSize.small }]}>
              Change
            </Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="heart"
            value={`${dashboard?.mindBalanceScore || 0}/100`}
            label="Wellness Score"
            trend="↑ Building"
            color={Colors.accent}
          />
          <MetricCard
            icon="trending-up"
            value={`${calculateMoodStability()}%`}
            label="Emotional Stability"
            trend="Consistent"
            color={Colors.secondary}
          />
          <MetricCard
            icon="document-text"
            value={dashboard?.moodLogs?.length || 0}
            label="Entries"
            trend="Keep going!"
            color={Colors.warning}
          />
          <MetricCard
            icon="flame"
            value={`${getWellnessStreak()} days`}
            label="Tracking Streak"
            trend="🔥 Active"
            color="#EF4444"
          />
        </View>

        {/* Mood Trend Chart */}
        {selectedWidgets.moodChart && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('moodTrend')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  📈 Your Mood Journey
                </Text>
                <Ionicons 
                  name={expandedSection === 'moodTrend' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'moodTrend' || expandedSection === null) && (
              <>
                <Text style={[styles.sectionDescription, { fontSize: responsive.fontSize.body }]}>
                  How your emotions have changed over time
                </Text>
                <LineChart
                  data={chartData}
                  width={responsive.chart.width}
                  height={responsive.chart.height}
                  yAxisSuffix="/5"
                  yAxisInterval={1}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.chart}
                />
              </>
            )}
          </View>
        )}

        {/* Progress Overview */}
        {selectedWidgets.progressChart && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('progress')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  🎯 Wellness Progress
                </Text>
                <Ionicons 
                  name={expandedSection === 'progress' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'progress' || expandedSection === null) && (
              <>
                <Text style={[styles.sectionDescription, { fontSize: responsive.fontSize.body }]}>
                  Track your emotional wellness journey
                </Text>
                <ProgressChart
                  data={getProgressData()}
                  width={responsive.chart.width}
                  height={isSmallScreen ? 160 : 200}
                  strokeWidth={12}
                  radius={36}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1, index) => {
                      const colors = getProgressData().colors;
                      const hex = colors[index] || '#4A90E2';
                      const r = parseInt(hex.slice(1, 3), 16);
                      const g = parseInt(hex.slice(3, 5), 16);
                      const b = parseInt(hex.slice(5, 7), 16);
                      return `rgba(${r},${g},${b},${opacity})`;
                    },
                  }}
                  hideLegend={false}
                  style={styles.chart}
                />
              </>
            )}
          </View>
        )}

        {/* Mood Distribution */}
        {selectedWidgets.moodDistribution && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('distribution')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  📊 Emotional Balance
                </Text>
                <Ionicons 
                  name={expandedSection === 'distribution' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'distribution' || expandedSection === null) && (
              <>
                <Text style={[styles.sectionDescription, { fontSize: responsive.fontSize.body }]}>
                  Breakdown of your different emotional states
                </Text>
                <PieChart
                  data={getMoodDistribution()}
                  width={responsive.chart.width}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute={false}
                />
              </>
            )}
          </View>
        )}

        {/* Weekly Pattern */}
        {selectedWidgets.weeklyBreakdown && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('weekly')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  📅 Weekly Rhythm
                </Text>
                <Ionicons 
                  name={expandedSection === 'weekly' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'weekly' || expandedSection === null) && (
              <>
                <Text style={[styles.sectionDescription, { fontSize: responsive.fontSize.body }]}>
                  Your mood patterns across the week
                </Text>
                <BarChart
                  data={getWeeklyBreakdownData()}
                  width={responsive.chart.width}
                  height={responsive.chart.height}
                  yAxisLabel=""
                  yAxisSuffix="/5"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                    fillShadowGradient: '#8B5CF6',
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              </>
            )}
          </View>
        )}

        {/* Wellness Alerts */}
        {selectedWidgets.riskTrend && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('alerts')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  ⚠️ Wellness Patterns
                </Text>
                <Ionicons 
                  name={expandedSection === 'alerts' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'alerts' || expandedSection === null) && (
              <>
                <Text style={[styles.sectionDescription, { fontSize: responsive.fontSize.body }]}>
                  Tracking patterns that need attention
                </Text>
                <LineChart
                  data={getRiskTrendData()}
                  width={responsive.chart.width}
                  height={responsive.chart.height - 20}
                  yAxisSuffix="/5"
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                    fillShadowGradient: '#EF4444',
                  }}
                  bezier
                  style={styles.chart}
                />
              </>
            )}
          </View>
        )}

        {/* Sleep & Mood Correlation */}
        {selectedWidgets.sleepCorrelation && dashboard?.sleepCorrelation && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('sleep')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  😴 Sleep Connection
                </Text>
                <Ionicons 
                  name={expandedSection === 'sleep' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'sleep' || expandedSection === null) && (
              <View style={styles.correlationCard}>
                <View style={styles.correlationScore}>
                  <Text style={styles.correlationValue}>
                    {Math.round(dashboard.sleepCorrelation.correlation * 100)}%
                  </Text>
                  <Text style={[styles.correlationLabel, { fontSize: responsive.fontSize.small }]}>
                    Sleep-Mood Connection
                  </Text>
                </View>
                <Text style={[styles.correlationMessage, { fontSize: responsive.fontSize.body }]}>
                  {dashboard.sleepCorrelation.message}
                </Text>
                <Text style={[styles.correlationTip, { fontSize: responsive.fontSize.small }]}>
                  💡 Tip: {dashboard.sleepCorrelation.tip || "Aim for 7-9 hours of quality sleep"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Mood Influencers */}
        {selectedWidgets.factors && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('factors')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  🔍 Mood Influencers
                </Text>
                <Ionicons 
                  name={expandedSection === 'factors' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'factors' || expandedSection === null) && (
              <View style={styles.factorsContainer}>
                {getTopFactors().length > 0 ? (
                  getTopFactors().map(([factor, count], index) => (
                    <View key={factor} style={styles.factorTag}>
                      <View style={styles.factorHeader}>
                        <View style={styles.factorRank}>
                          <Text style={styles.factorRankText}>#{index + 1}</Text>
                        </View>
                        <Text style={[styles.factorText, { fontSize: responsive.fontSize.body }]}>
                          {factor}
                        </Text>
                      </View>
                      <Text style={[styles.factorCount, { fontSize: responsive.fontSize.small }]}>
                        {count} {count === 1 ? 'time' : 'times'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyFactors}>
                    <Ionicons name="analytics" size={40} color={Colors.textSecondary} />
                    <Text style={[styles.noData, { fontSize: responsive.fontSize.body }]}>
                      Track factors with your mood entries to see patterns here
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Activity Impact */}
        {selectedWidgets.activityImpact && dashboard?.activityImpact && (
          <View style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection('activities')}
            >
              <View style={styles.cardTitleRow}>
                <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                  ⚡ Activity Impact
                </Text>
                <Ionicons 
                  name={expandedSection === 'activities' ? 'chevron-up' : 'chevron-down'} 
                  size={responsive.icon.small} 
                  color={Colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
            
            {(expandedSection === 'activities' || expandedSection === null) && (
              <View style={styles.activityContainer}>
                <View style={styles.activitySection}>
                  <Text style={[styles.activityTitle, { fontSize: responsive.fontSize.body }]}>
                    🌟 Positive Influences
                  </Text>
                  {dashboard.activityImpact.positive.map(activity => (
                    <View key={activity} style={styles.activityItem}>
                      <Ionicons name="checkmark-circle" size={responsive.icon.small} color="#10B981" />
                      <Text style={[styles.activityText, { fontSize: responsive.fontSize.body }]}>
                        {activity}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.activitySection}>
                  <Text style={[styles.activityTitle, { fontSize: responsive.fontSize.body }]}>
                    🛑 Challenges
                  </Text>
                  {dashboard.activityImpact.negative.map(activity => (
                    <View key={activity} style={styles.activityItem}>
                      <Ionicons name="alert-circle" size={responsive.icon.small} color="#EF4444" />
                      <Text style={[styles.activityText, { fontSize: responsive.fontSize.body }]}>
                        {activity}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.spacer} />
      </Animated.ScrollView>

      <TimeRangeFilter />
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
  timeRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  timeRangeTitle: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timeRangeValue: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  filterButtonText: {
    color: Colors.secondary,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metricLabel: {
    color: Colors.textSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricTrend: {
    color: Colors.accent,
    fontWeight: '500',
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
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionDescription: {
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 4,
  },
  factorsContainer: {
    gap: 8,
  },
  factorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
  emptyFactors: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  noData: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  correlationCard: {
    backgroundColor: `${Colors.secondary}08`,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  correlationScore: {
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  correlationLabel: {
    color: Colors.textSecondary,
  },
  correlationMessage: {
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  correlationTip: {
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  activityContainer: {
    gap: 16,
  },
  activitySection: {
    gap: 8,
  },
  activityTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  activityText: {
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: Colors.secondary,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterOptionText: {
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  spacer: {
    height: 20,
  },
});