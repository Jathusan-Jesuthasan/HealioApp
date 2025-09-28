// /screens/MoodStatsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors } from '../utils/Colors';
import { getDashboard } from '../services/analytics';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Math.min(Dimensions.get('window').width - 48, 720);

const MoodStatsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [weeklyMoods, setWeeklyMoods] = useState([]);
  const [avgMood, setAvgMood] = useState(0);
  const [bestDay, setBestDay] = useState(null);
  const [worstDay, setWorstDay] = useState(null);
  const [moodTrend, setMoodTrend] = useState('stable'); // rising, falling, stable
  const [pulseAnim] = useState(new Animated.Value(1));

  const filters = [
    { label: 'Day', value: '1d', icon: 'today' },
    { label: 'Week', value: '7d', icon: 'calendar' },
    { label: 'Month', value: '1m', icon: 'calendar-outline' },
    { label: 'Year', value: '12m', icon: 'stats-chart' },
  ];

  const moodEmojis = {
    1: { emoji: '😡', color: '#ff6b6b', name: 'Angry' },
    2: { emoji: '😔', color: '#74b9ff', name: 'Sad' },
    3: { emoji: '😐', color: '#fdcb6e', name: 'Neutral' },
    4: { emoji: '🙂', color: '#55efc4', name: 'Happy' },
    5: { emoji: '😊', color: '#a29bfe', name: 'Excited' },
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDashboard(range);

      const moods = data?.weeklyMoods ?? [];
      setWeeklyMoods(moods);

      if (moods.length) {
        const valid = moods.filter((m) => m > 0);
        const avg = valid.reduce((a, b) => a + b, 0) / (valid.length || 1);
        setAvgMood(Math.round(avg));

        const max = Math.max(...valid);
        const min = Math.min(...valid);
        setBestDay(dayLabels[moods.indexOf(max)] || '-');
        setWorstDay(dayLabels[moods.indexOf(min)] || '-');

        // Calculate trend
        if (valid.length > 1) {
          const firstHalf = valid.slice(0, Math.floor(valid.length / 2));
          const secondHalf = valid.slice(Math.floor(valid.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg + 0.5) setMoodTrend('rising');
          else if (secondAvg < firstAvg - 0.5) setMoodTrend('falling');
          else setMoodTrend('stable');
        }
      }
      
      startPulseAnimation();
    } catch (err) {
      console.error('Failed to load mood stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const getTrendIcon = () => {
    switch (moodTrend) {
      case 'rising': return { icon: 'trending-up', color: '#00b894' };
      case 'falling': return { icon: 'trending-down', color: '#ff7675' };
      default: return { icon: 'remove', color: '#fdcb6e' };
    }
  };

  const getMotivationalMessage = () => {
    if (!weeklyMoods.length) return "Start your mood journey today! 🌟";
    
    if (avgMood >= 4) return "You're doing amazing! Keep shining! ✨";
    if (avgMood <= 2) return "Every day is a new opportunity. You've got this! 💪";
    return "Consistency is key. Keep tracking your moods! 📈";
  };

  const renderMoodBar = (score, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const moodData = moodEmojis[score];
    
    return (
      <View key={score} style={styles.moodBarContainer}>
        <View style={styles.moodBarHeader}>
          <Text style={styles.moodBarEmoji}>{moodData.emoji}</Text>
          <Text style={styles.moodBarName}>{moodData.name}</Text>
          <Text style={styles.moodBarCount}>{count}</Text>
        </View>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.barFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: moodData.color,
              }
            ]} 
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.title}>📊 Mood Statistics</Text>
        <Text style={styles.subtitle}>{getMotivationalMessage()}</Text>
      </Animated.View>

      {/* Filter Tabs with Icons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterButton, range === f.value && styles.filterButtonActive]}
            onPress={() => setRange(f.value)}>
            <Ionicons 
              name={f.icon} 
              size={16} 
              color={range === f.value ? '#fff' : Colors.textSecondary} 
            />
            <Text style={[styles.filterText, range === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Main Chart Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Mood Evolution</Text>
          {moodTrend && (
            <View style={styles.trendBadge}>
              <Ionicons 
                name={getTrendIcon().icon} 
                size={16} 
                color={getTrendIcon().color} 
              />
              <Text style={[styles.trendText, { color: getTrendIcon().color }]}>
                {moodTrend}
              </Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingText}>Crunching your mood data...</Text>
          </View>
        ) : (
          <>
            <LineChart
              data={{
                labels: dayLabels,
                datasets: [
                  {
                    data: weeklyMoods.length ? weeklyMoods : [0, 0, 0, 0, 0, 0, 0],
                    color: (opacity = 1) => `rgba(66, 135, 245, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth}
              height={240}
              yAxisInterval={1}
              fromZero
              chartConfig={{
                backgroundColor: Colors.card,
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(66, 135, 245, ${opacity})`,
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
              withVerticalLines={false}
              withHorizontalLines={false}
            />

            {!weeklyMoods.length && (
              <View style={styles.emptyState}>
                <Ionicons name="stats-chart-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.noDataTitle}>No Data Yet</Text>
                <Text style={styles.noDataText}>Start logging your moods to see insights!</Text>
                <TouchableOpacity 
                  style={styles.logMoodButton}
                  onPress={() => navigation.navigate('AppTabs', { screen: 'MoodLog' })}
                >
                  <Text style={styles.logMoodText}>Log Your First Mood</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.quickStatsGrid}>
        <View style={[styles.quickStatCard, styles.quickStatCardPrimary]}>
          <Ionicons name="happy-outline" size={24} color="#fff" />
          <Text style={styles.quickStatValue}>{avgMood ? moodEmojis[avgMood].emoji : '–'}</Text>
          <Text style={styles.quickStatLabel}>Average Mood</Text>
        </View>
        
        <View style={[styles.quickStatCard, styles.quickStatCardSuccess]}>
          <Ionicons name="trophy-outline" size={24} color="#fff" />
          <Text style={styles.quickStatValue}>{bestDay}</Text>
          <Text style={styles.quickStatLabel}>Best Day</Text>
        </View>
        
        <View style={[styles.quickStatCard, styles.quickStatCardWarning]}>
          <Ionicons name="alert-circle-outline" size={24} color="#fff" />
          <Text style={styles.quickStatValue}>{worstDay}</Text>
          <Text style={styles.quickStatLabel}>Needs Care</Text>
        </View>
      </View>

      {/* Mood Distribution */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Mood Distribution</Text>
        <Text style={styles.sectionSubtitle}>How your moods are spread across this period</Text>
        
        <View style={styles.moodDistribution}>
          {Object.entries(moodEmojis).map(([score]) => {
            const count = weeklyMoods.filter((m) => m === Number(score)).length;
            const total = weeklyMoods.filter(m => m > 0).length;
            return renderMoodBar(score, count, total);
          })}
        </View>
      </View>

      {/* Weekly Pattern */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Weekly Pattern</Text>
        <Text style={styles.sectionSubtitle}>Your mood patterns throughout the week</Text>
        
        <BarChart
          data={{
            labels: dayLabels,
            datasets: [
              {
                data: weeklyMoods.length ? weeklyMoods : [0, 0, 0, 0, 0, 0, 0],
              },
            ],
          }}
          width={screenWidth}
          height={200}
          chartConfig={{
            backgroundColor: Colors.card,
            backgroundGradientFrom: Colors.card,
            backgroundGradientTo: Colors.card,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(66, 135, 245, ${opacity})`,
            labelColor: () => Colors.textSecondary,
            barPercentage: 0.5,
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>

      {/* AI Insights Card */}
      <TouchableOpacity 
        style={styles.aiCard}
        onPress={() => navigation.navigate('RiskDetail')}
      >
        <View style={styles.aiHeader}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.aiTitle}>AI-Powered Insights</Text>
            <Text style={styles.aiSubtitle}>Personalized recommendations based on your patterns</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
        
        <View style={styles.aiStats}>
          <View style={styles.aiStat}>
            <Text style={styles.aiStatValue}>+15%</Text>
            <Text style={styles.aiStatLabel}>Better this week</Text>
          </View>
          <View style={styles.aiStat}>
            <Text style={styles.aiStatValue}>3</Text>
            <Text style={styles.aiStatLabel}>Positive trends</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
    minWidth: 100,
    justifyContent: 'center',
  },
  filterButtonActive: { 
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: { 
    color: Colors.textSecondary, 
    fontWeight: '600',
    marginLeft: 6,
  },
  filterTextActive: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },
  chart: { 
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  logMoodButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
  },
  logMoodText: {
    color: '#fff',
    fontWeight: '600',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStatCardPrimary: {
    backgroundColor: Colors.secondary,
  },
  quickStatCardSuccess: {
    backgroundColor: '#00b894',
  },
  quickStatCardWarning: {
    backgroundColor: '#fdcb6e',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginVertical: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  moodDistribution: {
    marginTop: 8,
  },
  moodBarContainer: {
    marginBottom: 16,
  },
  moodBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodBarEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodBarName: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  moodBarCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  barBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  aiCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  aiSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  aiStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  aiStat: {
    alignItems: 'center',
  },
  aiStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  aiStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
});

export default MoodStatsScreen;