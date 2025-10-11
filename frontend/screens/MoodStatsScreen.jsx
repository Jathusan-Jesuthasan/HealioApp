// /screens/MoodStatsScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Switch,
  useWindowDimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDashboard, getRiskHistory } from '../services/analytics';
import { Colors } from '../utils/Colors';
import MoodAnalyticsView from '../components/MoodAnalyticsView';
import MoodReportView from '../components/MoodReportView';

export default function MoodStatsScreen({ navigation }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  const isLargeScreen = screenWidth > 414;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState('7d');
  const [dashboard, setDashboard] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [userNotes, setUserNotes] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  const [fadeAnim] = useState(new Animated.Value(0));

  const [selectedWidgets, setSelectedWidgets] = useState({
    moodChart: true,
    aiInsights: true,
    riskTrend: true,
    factors: true,
    weeklyBreakdown: true,
    moodDistribution: true,
    progressChart: true,
    sleepCorrelation: true,
    activityImpact: true,
  });

  // Enhanced filters with mental health focus
  const filters = React.useMemo(() => {
    const baseFilters = [
      { label: 'Week', value: '7d', icon: 'calendar-outline', color: '#4ADE80' },
      { label: 'Month', value: '30d', icon: 'calendar', color: '#60A5FA' },
      { label: '3 Months', value: '90d', icon: 'business', color: '#F59E0B' },
      { label: '6 Months', value: '180d', icon: 'bar-chart', color: '#8B5CF6' },
    ];
    
    if (isSmallScreen) {
      return baseFilters.slice(0, 3);
    }
    
    return [...baseFilters, { label: 'Year', value: '365d', icon: 'trophy', color: '#EF4444' }];
  }, [isSmallScreen]);

  const reportWidgets = [
    { id: 'moodChart', label: 'Mood Journey', icon: '📈', category: 'Trends', description: 'See how your mood changes over time' },
    { id: 'aiInsights', label: 'AI Insights', icon: '🤖', category: 'Smart Analysis', description: 'Personalized insights from your data' },
    { id: 'riskTrend', label: 'Wellness Alerts', icon: '⚠️', category: 'Safety', description: 'Track patterns that need attention' },
    { id: 'factors', label: 'Mood Influencers', icon: '🔍', category: 'Analysis', description: 'What affects your mood most' },
    { id: 'weeklyBreakdown', label: 'Weekly Patterns', icon: '📅', category: 'Patterns', description: 'Your mood across different days' },
    { id: 'moodDistribution', label: 'Mood Balance', icon: '⚖️', category: 'Overview', description: 'Distribution of your emotional states' },
    { id: 'progressChart', label: 'Progress Track', icon: '🎯', category: 'Goals', description: 'Your wellness journey progress' },
    { id: 'sleepCorrelation', label: 'Sleep & Mood', icon: '😴', category: 'Health', description: 'How sleep affects your feelings' },
    { id: 'activityImpact', label: 'Activity Impact', icon: '⚡', category: 'Lifestyle', description: 'What activities help or hinder' },
  ];

  // Enhanced data loading with mental health focus
  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardData, riskData] = await Promise.all([
        getDashboard(range),
        getRiskHistory(range),
      ]);
      
      const enhancedDashboard = {
        ...dashboardData,
        sleepCorrelation: dashboardData.sleepCorrelation || calculateSleepCorrelation(dashboardData),
        activityImpact: dashboardData.activityImpact || calculateActivityImpact(dashboardData),
        weeklyBreakdown: dashboardData.weeklyBreakdown || generateWeeklyBreakdown(dashboardData),
        moodPredictions: dashboardData.moodPredictions || generateMoodPredictions(dashboardData),
        wellnessTips: generateWellnessTips(dashboardData),
      };
      
      setDashboard(enhancedDashboard);
      setRiskHistory(riskData);

      // Animate content in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('❌ Analytics load failed:', err.message);
      Alert.alert(
        'Connection Issue', 
        'Having trouble loading your wellness data. Please check your connection and try again.',
        [{ text: 'Try Again', onPress: loadData }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Enhanced mock data with youth mental health focus
  const calculateSleepCorrelation = (data) => {
    return {
      correlation: 0.72,
      message: "Getting 7+ hours of sleep improves mood by 60%",
      data: [7.2, 6.8, 7.5, 6.2, 7.8, 8.1, 7.0],
      tip: "Try consistent sleep times for better mood stability"
    };
  };

  const calculateActivityImpact = (data) => {
    return {
      positive: ['Exercise', 'Social Time', 'Nature Walks', 'Creative Hobbies'],
      negative: ['Academic Stress', 'Social Media Overuse', 'Poor Sleep', 'Isolation'],
      impactScores: { Exercise: 0.8, 'Social Time': 0.7, 'Nature Walks': 0.6, 'Creative Hobbies': 0.5 }
    };
  };

  const generateWeeklyBreakdown = (data) => {
    return {
      Monday: 3.2, Tuesday: 3.8, Wednesday: 4.1, Thursday: 3.9,
      Friday: 4.3, Saturday: 4.5, Sunday: 4.0
    };
  };

  const generateMoodPredictions = (data) => {
    return {
      nextWeek: 4.2,
      confidence: 0.76,
      trend: 'improving',
      factors: ['Better sleep pattern', 'Reduced academic stress', 'More social connection']
    };
  };

  const generateWellnessTips = (data) => {
    return [
      "Take 5-minute mindfulness breaks between study sessions",
      "Connect with friends daily, even briefly",
      "Move your body for 15 minutes each day",
      "Limit social media to specific times",
      "Practice gratitude before bed"
    ];
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const toggleWidget = (widgetId) => {
    setSelectedWidgets((prev) => ({ ...prev, [widgetId]: !prev[widgetId] }));
  };

  const navigateToMoodLog = () => {
    navigation.navigate('MoodLog');
  };

  // Responsive design values
  const responsive = {
    fontSize: {
      title: isSmallScreen ? 22 : isLargeScreen ? 26 : 24,
      subtitle: isSmallScreen ? 13 : 14,
      tab: isSmallScreen ? 14 : 15,
      filter: isSmallScreen ? 12 : 13,
      metric: isSmallScreen ? 16 : 18,
    },
    spacing: {
      small: isSmallScreen ? 12 : 16,
      medium: isSmallScreen ? 16 : 20,
      large: isSmallScreen ? 20 : 24,
    },
    icon: {
      small: isSmallScreen ? 16 : 18,
      medium: isSmallScreen ? 20 : 22,
      large: isSmallScreen ? 24 : 28,
    }
  };

  // Quick stats for mental health overview
  const QuickStats = () => (
    <View style={styles.quickStats}>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { fontSize: responsive.fontSize.metric }]}>
          {dashboard?.mindBalanceScore || 0}
        </Text>
        <Text style={styles.statLabel}>Wellness Score</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { fontSize: responsive.fontSize.metric }]}>
          {dashboard?.moodLogs?.length || 0}
        </Text>
        <Text style={styles.statLabel}>Entries</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { fontSize: responsive.fontSize.metric }]}>
          {dashboard?.weeklyMoods?.length || 0}/7
        </Text>
        <Text style={styles.statLabel}>This Week</Text>
      </View>
    </View>
  );

  // Loading state with mental health affirmation
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
          <Text style={[styles.loadingText, { fontSize: responsive.fontSize.subtitle }]}>
            Understanding your emotional patterns...
          </Text>
          <Text style={styles.affirmation}>
            Taking time to reflect is a sign of strength 💪
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        
        {/* Enhanced Header with Mental Health Focus */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { fontSize: responsive.fontSize.title }]}>
                🌱 Your Wellness Journey
              </Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => setExportModalVisible(true)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Ionicons name="options-outline" size={responsive.icon.medium} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.subtitle, { fontSize: responsive.fontSize.subtitle }]}>
              Track patterns, understand yourself, grow stronger
            </Text>
          </View>
        </View>

        {/* Quick Stats Overview */}
        {dashboard && <QuickStats />}

        {/* Enhanced Tab Navigation */}
        <View style={[
          styles.tabContainer,
          { marginHorizontal: responsive.spacing.small }
        ]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
            onPress={() => setActiveTab('analytics')}
          >
            <Ionicons 
              name="analytics" 
              size={responsive.icon.small} 
              color={activeTab === 'analytics' ? Colors.secondary : Colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              { fontSize: responsive.fontSize.tab },
              activeTab === 'analytics' && styles.activeTabText
            ]}>
              Insights
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <Ionicons 
              name="document-text-outline" 
              size={responsive.icon.small} 
              color={activeTab === 'reports' ? Colors.secondary : Colors.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { fontSize: responsive.fontSize.tab },
              activeTab === 'reports' && styles.activeTabText
            ]}>
              Reports
            </Text>
          </TouchableOpacity>
        </View>

        {/* Enhanced Time Range Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>View data for:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {filters.map((f, index) => (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterButton,
                  range === f.value && [styles.activeFilterButton, { borderColor: f.color }],
                ]}
                onPress={() => setRange(f.value)}
              >
                <Ionicons 
                  name={f.icon} 
                  size={responsive.icon.small} 
                  color={range === f.value ? '#fff' : f.color} 
                />
                <Text style={[
                  styles.filterText,
                  { fontSize: responsive.fontSize.filter },
                  range === f.value && styles.activeFilterText,
                ]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={styles.content}>
          {dashboard ? (
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.secondary}
                  colors={[Colors.secondary]}
                  title="Updating your wellness data..."
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {activeTab === 'analytics' ? (
                <MoodAnalyticsView
                  dashboard={dashboard}
                  riskHistory={riskHistory}
                  selectedWidgets={selectedWidgets}
                  range={range}
                />
              ) : (
                <MoodReportView
                  dashboard={dashboard}
                  userProfile={dashboard?.userProfile || { name: 'User' }}
                  selectedWidgets={selectedWidgets}
                  userNotes={userNotes}
                  setUserNotes={setUserNotes}
                />
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Ionicons 
                  name="stats-chart-outline" 
                  size={isSmallScreen ? 80 : 100} 
                  color={`${Colors.textSecondary}40`} 
                />
                <View style={styles.emptyTextContent}>
                  <Text style={[styles.emptyTitle, { fontSize: responsive.fontSize.title }]}>
                    Your Wellness Story Awaits
                  </Text>
                  <Text style={[styles.emptySub, { fontSize: responsive.fontSize.subtitle }]}>
                    Start tracking your mood to uncover patterns and build emotional awareness
                  </Text>
                </View>
              </View>
              
              <View style={styles.emptyActions}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={navigateToMoodLog}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Log My First Mood</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => Alert.alert(
                    "Why Track Mood?",
                    "Regular mood tracking helps you:\n\n• Spot patterns and triggers\n• Understand yourself better\n• Build emotional intelligence\n• Celebrate progress\n• Get support when needed"
                  )}
                >
                  <Text style={styles.secondaryButtonText}>Learn How It Helps</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Enhanced Customization Modal */}
        <Modal
          visible={exportModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setExportModalVisible(false)}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContent,
              { 
                maxHeight: screenHeight * 0.85,
                marginHorizontal: isSmallScreen ? 8 : 16,
              }
            ]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[
                    styles.modalTitle,
                    { fontSize: responsive.fontSize.title }
                  ]}>
                    Customize Your View
                  </Text>
                  <Text style={[
                    styles.modalSubtitle,
                    { fontSize: responsive.fontSize.subtitle }
                  ]}>
                    Choose what matters most to you
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setExportModalVisible(false)}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={responsive.icon.medium} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={reportWidgets}
                renderItem={({ item }) => (
                  <View style={styles.widgetItem}>
                    <View style={styles.widgetInfo}>
                      <Text style={styles.widgetEmoji}>{item.icon}</Text>
                      <View style={styles.widgetTextContainer}>
                        <Text style={[
                          styles.widgetLabel,
                          { fontSize: responsive.fontSize.tab }
                        ]}>
                          {item.label}
                        </Text>
                        <Text style={[
                          styles.widgetDescription,
                          { fontSize: responsive.fontSize.filter }
                        ]}>
                          {item.description}
                        </Text>
                        <Text style={styles.widgetCategory}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={selectedWidgets[item.id]}
                      onValueChange={() => toggleWidget(item.id)}
                      trackColor={{ true: Colors.secondary, false: '#E2E8F0' }}
                      thumbColor={selectedWidgets[item.id] ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                )}
                keyExtractor={(item) => item.id}
                style={styles.widgetList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.widgetListContent}
              />
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalActionButton}
                  onPress={() => setSelectedWidgets({
                    moodChart: true, aiInsights: true, riskTrend: true,
                    factors: true, weeklyBreakdown: true, moodDistribution: true,
                    progressChart: true, sleepCorrelation: true, activityImpact: true,
                  })}
                >
                  <Text style={styles.modalActionText}>Select All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
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
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  affirmation: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 32,
  },
  subtitle: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  helpButton: {
    padding: 8,
    backgroundColor: `${Colors.secondary}15`,
    borderRadius: 12,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: `${Colors.textSecondary}20`,
    marginHorizontal: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: `${Colors.secondary}08`,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    minHeight: 48,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.secondary,
  },
  filterSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 44,
  },
  activeFilterButton: {
    backgroundColor: Colors.secondary,
    borderWidth: 2,
  },
  filterText: {
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyIllustration: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTextContent: {
    alignItems: 'center',
    marginTop: 24,
  },
  emptyTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  emptySub: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  widgetList: {
    flexGrow: 0,
  },
  widgetListContent: {
    paddingBottom: 16,
  },
  widgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  widgetInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 16,
  },
  widgetTextContainer: {
    flex: 1,
  },
  widgetEmoji: {
    fontSize: 24,
    width: 32,
  },
  widgetLabel: {
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  widgetDescription: {
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  widgetCategory: {
    color: Colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  modalActionButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionText: {
    color: Colors.secondary,
    fontWeight: '600',
    fontSize: 16,
  },
});