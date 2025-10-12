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
  Dimensions
} from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../utils/Colors';

// ✅ Helper: clean invalid numbers (NaN, undefined, null)
const cleanNumbers = (arr = [], fallback = 0) =>
  arr.map(v => (typeof v === 'number' && isFinite(v) ? v : fallback));

// ✅ FIXED: Move generateLabels outside the component
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
  const isTablet = screenWidth >= 768;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [range, setRange] = useState(propRange || '7d');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  // Enhanced responsive design values
  const responsive = {
    fontSize: {
      title: isSmallScreen ? 18 : isTablet ? 24 : 20,
      subtitle: isSmallScreen ? 14 : isTablet ? 18 : 16,
      body: isSmallScreen ? 14 : isTablet ? 16 : 15,
      small: isSmallScreen ? 12 : isTablet ? 14 : 13,
    },
    chart: {
      width: Math.min(screenWidth - (isSmallScreen ? 20 : 40), isTablet ? 600 : 400),
      height: isSmallScreen ? 160 : isTablet ? 240 : 200,
    },
    spacing: {
      card: isSmallScreen ? 12 : isTablet ? 24 : 16,
      section: isSmallScreen ? 8 : isTablet ? 16 : 12,
    }
  };

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

  // ✅ Sanitize chart data before rendering
  const chartData = useMemo(() => {
    const baseMoods = cleanNumbers(dashboard?.weeklyMoods || [3, 4, 3, 4, 5, 4, 3]);
    const labels = generateLabels(range, baseMoods.length);
    return {
      labels,
      datasets: [
        {
          data: baseMoods,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: isSmallScreen ? 1 : 2,
        },
      ],
    };
  }, [dashboard, range, isSmallScreen]);

  const calculateMoodStability = () => {
    const moods = cleanNumbers(dashboard?.weeklyMoods || []);
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
    const dist = { '😊 Happy': 0, '😐 Neutral': 0, '😢 Sad': 0, '😠 Frustrated': 0, '😴 Tired': 0, '😰 Anxious': 0 };
    moods.forEach(m => { if (dist[m] !== undefined) dist[m]++; });
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
    const stability = Math.max(0, Math.min(1, calculateMoodStability() / 100 || 0));
    const positivity = Math.max(0, Math.min(1, (dashboard?.mindBalanceScore || 0) / 100));
    const consistency = Math.max(0, Math.min(1, dashboard?.moodLogs ? dashboard.moodLogs.length / 30 : 0.5));
    return {
      labels: ['Stability', 'Positivity', 'Consistency'],
      data: cleanNumbers([stability, positivity, consistency]),
      colors: ['#4ADE80', '#60A5FA', '#F59E0B'],
    };
  };

  const getWeeklyBreakdownData = () => {
    const breakdown = dashboard?.weeklyBreakdown || {
      Monday: 3.2, Tuesday: 3.8, Wednesday: 4.1, Thursday: 3.9,
      Friday: 4.3, Saturday: 4.5, Sunday: 4.0
    };
    return {
      labels: Object.keys(breakdown).map(day => day.slice(0, isSmallScreen ? 2 : 3)),
      datasets: [{ data: cleanNumbers(Object.values(breakdown)) }],
    };
  };

  const getRiskTrendData = () => {
    const risks = cleanNumbers(riskHistory.length > 0 ? riskHistory : [2, 3, 1, 2, 1, 3, 2]);
    return {
      labels: generateLabels(range, risks.length),
      datasets: [{
        data: risks,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      }],
    };
  };

  const getWellnessStreak = () => Math.min((dashboard?.moodLogs || []).length, 7);

  const chartConfig = {
    backgroundColor: Colors.card,
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: () => Colors.textSecondary,
    fillShadowGradient: Colors.secondary,
    fillShadowGradientOpacity: 0.15,
    propsForDots: { 
      r: isSmallScreen ? '3' : isTablet ? '5' : '4', 
      strokeWidth: isSmallScreen ? '1' : '2' 
    },
    style: { borderRadius: 16 },
    propsForLabels: {
      fontSize: isSmallScreen ? 10 : 12,
    },
    propsForVerticalLabels: {
      fontSize: isSmallScreen ? 9 : 11,
    },
    propsForHorizontalLabels: {
      fontSize: isSmallScreen ? 9 : 11,
    },
  };

  const handleRangeChange = newRange => {
    setRange(newRange);
    setFilterModalVisible(false);
    if (onRangeChange) onRangeChange(newRange);
  };

  const toggleSection = section => setExpandedSection(expandedSection === section ? null : section);

  // Enhanced Metric Card with better icons
  const MetricCard = ({ icon, value, label, trend, color }) => (
    <View style={[
      styles.metricCard, 
      isSmallScreen && styles.metricCardSmall,
      isTablet && styles.metricCardTablet
    ]}>
      <View style={[
        styles.metricIcon, 
        { backgroundColor: `${color}20` },
        isSmallScreen && styles.metricIconSmall,
        isTablet && styles.metricIconTablet
      ]}>
        <Ionicons name={icon} size={isSmallScreen ? 16 : isTablet ? 24 : 20} color={color} />
      </View>
      <Text style={[
        styles.metricValue,
        { fontSize: responsive.fontSize.title },
        isSmallScreen && styles.metricValueSmall
      ]}>{value}</Text>
      <Text style={[
        styles.metricLabel,
        { fontSize: responsive.fontSize.small },
        isSmallScreen && styles.metricLabelSmall
      ]}>{label}</Text>
      {trend && (
        <Text style={[
          styles.metricTrend,
          { fontSize: responsive.fontSize.small - 1 },
          isSmallScreen && styles.metricTrendSmall
        ]}>{trend}</Text>
      )}
    </View>
  );

  // Time Range Selector Component
  const TimeRangeSelector = () => (
    <View style={styles.rangeSelector}>
      <Text style={[styles.rangeLabel, { fontSize: responsive.fontSize.body }]}>
        Time Range:
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rangeScrollContent}
      >
        {['7d', '30d', '90d', '180d', '365d'].map((timeRange) => (
          <TouchableOpacity
            key={timeRange}
            style={[
              styles.rangeButton,
              range === timeRange && styles.rangeButtonActive,
              isSmallScreen && styles.rangeButtonSmall
            ]}
            onPress={() => handleRangeChange(timeRange)}
          >
            <Text style={[
              styles.rangeButtonText,
              range === timeRange && styles.rangeButtonTextActive,
              isSmallScreen && styles.rangeButtonTextSmall
            ]}>
              {timeRange}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity 
        style={[styles.filterButton, isSmallScreen && styles.filterButtonSmall]}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons 
          name="filter" 
          size={isSmallScreen ? 16 : 18} 
          color={Colors.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView
        style={[styles.container, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.scrollContentSmall,
          isTablet && styles.scrollContentTablet
        ]}
      >

        {/* Header with Time Range Selector */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="analytics" size={24} color={Colors.primary} />
            <Text style={[styles.headerTitleText, { fontSize: responsive.fontSize.title + 2 }]}>
              Mood Analytics
            </Text>
          </View>
          <TimeRangeSelector />
        </View>

        {/* Quick Stats Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.metricsRow}
          contentContainerStyle={styles.metricsRowContent}
        >
          <MetricCard
            icon="trending-up"
            value={`${calculateMoodStability()}%`}
            label="Stability"
            trend="+5%"
            color="#4ADE80"
          />
          <MetricCard
            icon="flash"
            value={getWellnessStreak()}
            label="Day Streak"
            trend="🔥"
            color="#F59E0B"
          />
          <MetricCard
            icon="heart"
            value={`${dashboard?.mindBalanceScore || 75}%`}
            label="Wellness"
            color="#EF4444"
          />
          <MetricCard
            icon="calendar"
            value={dashboard?.moodLogs?.length || 0}
            label="Entries"
            color="#60A5FA"
          />
        </ScrollView>

        {/* Mood Trend */}
        {selectedWidgets.moodChart && (
          <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
            <View style={styles.cardHeader}>
              <Ionicons name="pulse" size={20} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                Your Mood Journey
              </Text>
            </View>
            <LineChart
              data={chartData}
              width={responsive.chart.width}
              height={responsive.chart.height}
              yAxisSuffix="/5"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withVerticalLines={!isSmallScreen}
              withHorizontalLines={!isSmallScreen}
            />
          </View>
        )}

        {/* Weekly Breakdown */}
        {selectedWidgets.weeklyBreakdown && (
          <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                Weekly Rhythm
              </Text>
            </View>
            <BarChart
              data={getWeeklyBreakdownData()}
              width={responsive.chart.width}
              height={responsive.chart.height}
              yAxisSuffix="/5"
              chartConfig={chartConfig}
              showValuesOnTopOfBars
              style={styles.chart}
              fromZero
            />
          </View>
        )}

        {/* Progress Chart */}
        {selectedWidgets.progressChart && (
          <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={20} color={Colors.primary} />
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                Wellness Progress
              </Text>
            </View>
            <ProgressChart
              data={getProgressData()}
              width={responsive.chart.width}
              height={isSmallScreen ? 160 : 200}
              strokeWidth={isSmallScreen ? 10 : 12}
              radius={isSmallScreen ? 28 : 36}
              chartConfig={chartConfig}
              hideLegend={false}
              style={styles.chart}
            />
          </View>
        )}

        {/* Risk Trend */}
        {selectedWidgets.riskTrend && (
          <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={[styles.sectionTitle, { fontSize: responsive.fontSize.title }]}>
                Wellness Patterns
              </Text>
            </View>
            <LineChart
              data={getRiskTrendData()}
              width={responsive.chart.width}
              height={responsive.chart.height}
              yAxisSuffix="/5"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              }}
              bezier
              style={styles.chart}
              withVerticalLines={!isSmallScreen}
              withHorizontalLines={!isSmallScreen}
            />
          </View>
        )}

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContent,
              isSmallScreen && styles.modalContentSmall
            ]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: responsive.fontSize.title }]}>
                  Filter Analytics
                </Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {/* Add filter options here */}
            </View>
          </View>
        </Modal>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.background || '#F8FAFC' 
  },
  container: { 
    flex: 1 
  },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingVertical: 8 
  },
  scrollContentSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scrollContentTablet: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleText: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  rangeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeLabel: {
    color: Colors.textSecondary,
    marginRight: 12,
  },
  rangeScrollContent: {
    flexGrow: 1,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rangeButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rangeButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  rangeButtonTextSmall: {
    fontSize: 11,
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonSmall: {
    padding: 6,
  },
  metricsRow: {
    marginBottom: 16,
  },
  metricsRowContent: {
    paddingRight: 16,
  },
  metricCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 100,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  metricCardSmall: {
    padding: 12,
    minWidth: 85,
    borderRadius: 10,
    marginRight: 8,
  },
  metricCardTablet: {
    padding: 20,
    minWidth: 120,
    borderRadius: 16,
    marginRight: 16,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
  },
  metricIconTablet: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 12,
  },
  metricValue: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  metricValueSmall: {
    marginBottom: 2,
  },
  metricLabel: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  metricLabelSmall: {
    fontSize: 11,
  },
  metricTrend: {
    color: Colors.accent,
    fontWeight: '500',
    marginTop: 2,
  },
  metricTrendSmall: {
    marginTop: 1,
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
  cardSmall: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalContentSmall: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});