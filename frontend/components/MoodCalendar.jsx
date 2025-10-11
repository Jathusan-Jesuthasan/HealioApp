// Map backend mood values to frontend categories
function mapMoodToCategory(mood) {
  if (!mood) return null;
  const m = mood.toLowerCase();
  if (["happy", "calm", "excited", "grateful", "proud"].includes(m)) return "very good";
  if (["neutral", "okay", "fine", "content"].includes(m)) return "neutral";
  if (["sad", "tired", "bored", "anxious", "stressed", "down", "disappointed"].includes(m)) return "bad";
  if (["angry", "frustrated", "upset", "mad"].includes(m)) return "very bad";
  if (["good", "motivated", "peaceful", "relaxed"].includes(m)) return "good";
  return null;
}
// components/MoodCalendar.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors } from '../utils/Colors';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Easing } from 'react-native';

const { width } = Dimensions.get('window');

const MoodCalendar = ({ onDayPress, showTitle = true }) => {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fetch mood logs from API
  const fetchMoodLogs = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const baseURL = Platform.OS === 'android' 
        ? 'http://10.0.2.2:5000' 
        : 'http://localhost:5000';

      const response = await axios.get(`${baseURL}/api/moodlogs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setMoodData(response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching mood logs:', error);
      Alert.alert('Error', 'Could not load mood data');
    } finally {
      setLoading(false);
      // Start animations after data load
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  useEffect(() => {
    fetchMoodLogs();
  }, []);

  // Generate calendar data for the last 12 weeks (84 days)
  const generateCalendarData = () => {
    const weeks = [];
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 84); // 12 weeks back

    let currentDate = new Date(startDate);
    
    for (let week = 0; week < 12; week++) {
      const days = [];
      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        

        // Find mood entry for this date
        const moodEntry = moodData.find(entry => {
          const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
          return entryDate === dateKey;
        });

        // Map mood to frontend category
        const mappedMood = moodEntry ? mapMoodToCategory(moodEntry.mood) : null;

        days.push({
          date: new Date(currentDate),
          dateKey,
          mood: mappedMood,
          intensity: moodEntry ? calculateIntensity(moodEntry) : 0,
          entry: moodEntry || null,
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(days);
    }
    return weeks;
  };

  // Calculate intensity based on mood type and factors
  const calculateIntensity = (moodEntry) => {
    let baseIntensity = 1;
    
    // Mood intensity mapping
    const moodIntensity = {
      'very bad': 4,
      'bad': 3,
      'neutral': 2,
      'good': 1,
      'very good': 1,
    };

    // Increase intensity based on factors count
    const factorsCount = moodEntry.factors?.length || 0;
    const intensityBoost = Math.min(factorsCount, 2); // Max boost of 2
    
    return Math.min(4, baseIntensity + intensityBoost + (moodIntensity[moodEntry.mood] || 1));
  };

  // Get color for calendar cell based on mood and intensity
  const getDayColor = (mood, intensity) => {
    if (!mood) return '#F5F7FA'; // No data - primary color
    
    const colorIntensity = Math.max(1, Math.min(4, intensity));
    
    const colorMap = {
      'very good': ['#C6E48B', '#7BC96F', '#239A3B', '#196127'], // Greens
      'good': ['#C6E48B', '#7BC96F', '#239A3B', '#196127'],     // Greens
      'neutral': ['#FFE082', '#FFD54F', '#FFB74D', '#FF9800'],  // Yellows/Oranges
      'bad': ['#FFAB91', '#FF8A65', '#F4511E', '#D84315'],      // Oranges/Reds
      'very bad': ['#EF9A9A', '#E57373', '#EF5350', '#D32F2F']  // Reds
    };
    
    return colorMap[mood]?.[colorIntensity - 1] || '#F5F7FA';
  };

  // Get emoji for mood
  const getMoodEmoji = (mood) => {
    const emojiMap = {
      'very good': '😊',
      'good': '🙂',
      'neutral': '😐',
      'bad': '😟',
      'very bad': '😔'
    };
    return emojiMap[mood] || '○';
  };

  // Handle day press
  const handleDayPress = (day) => {
    setSelectedDay(day);
    if (onDayPress) {
      onDayPress(day);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalDays = 84;
    const loggedDays = moodData.length;
    const positiveDays = moodData.filter(entry => 
      entry.mood === 'good' || entry.mood === 'very good'
    ).length;
    const currentStreak = calculateCurrentStreak();

    return {
      totalDays,
      loggedDays,
      positiveDays,
      positivePercentage: Math.round((positiveDays / loggedDays) * 100) || 0,
      currentStreak,
      completionPercentage: Math.round((loggedDays / totalDays) * 100) || 0,
    };
  };

  // Calculate current logging streak
  const calculateCurrentStreak = () => {
    if (moodData.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const sortedData = [...moodData].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    let streak = 0;
    let currentDate = new Date();

    // Check consecutive days from today backwards
    for (let i = 0; i < 84; i++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const hasEntry = sortedData.find(entry => 
        new Date(entry.createdAt).toISOString().split('T')[0] === dateKey
      );

      if (hasEntry) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calendarWeeks = generateCalendarData();
  const stats = calculateStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading your mood history...</Text>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      {/* Header */}
      {showTitle && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="calendar" size={20} color="#4A90E2" />
            <Text style={styles.title}>Mood Contribution Calendar</Text>
          </View>
          <TouchableOpacity onPress={fetchMoodLogs} style={styles.refreshButton}>
            <Ionicons name="refresh" size={16} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.subtitle}>Last 12 weeks of your wellness journey</Text>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Month Labels */}
        <View style={styles.monthLabels}>
          {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            .filter((_, index) => index % 3 === 0)
            .map((month, index) => (
              <Text key={index} style={styles.monthLabel}>{month}</Text>
            ))}
        </View>

        <View style={styles.calendarGrid}>
          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((day, index) => (
              <Text key={index} style={styles.dayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar Cells */}
          <View style={styles.weeksContainer}>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => (
                  <TouchableOpacity
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.day,
                      { 
                        backgroundColor: getDayColor(day.mood, day.intensity),
                        borderWidth: selectedDay?.dateKey === day.dateKey ? 2 : 0,
                        borderColor: '#4A90E2',
                      }
                    ]}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={0.7}
                  >
                    {selectedDay?.dateKey === day.dateKey && day.mood && (
                      <Text style={styles.selectedEmoji}>
                        {getMoodEmoji(day.mood)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[1, 2, 3, 4].map(intensity => (
          <View 
            key={intensity} 
            style={[
              styles.legendItem, 
              { backgroundColor: getDayColor('good', intensity) }
            ]} 
          />
        ))}
        <Text style={styles.legendText}>More</Text>
        
        <View style={styles.legendSpacer} />
        
        <View style={[styles.legendItem, { backgroundColor: '#F5F7FA' }]} />
        <Text style={styles.legendText}>No data</Text>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.loggedDays}</Text>
            <Text style={styles.statLabel}>Days Logged</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completionPercentage}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.positivePercentage}%</Text>
            <Text style={styles.statLabel}>Positive</Text>
          </View>
        </View>
      </View>

      {/* Selected Day Info */}
      {selectedDay && selectedDay.mood && (
        <View style={styles.selectedDayInfo}>
          <Text style={styles.selectedDayTitle}>
            {selectedDay.date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <View style={styles.moodInfo}>
            <Text style={styles.moodEmoji}>{getMoodEmoji(selectedDay.mood)}</Text>
            <Text style={styles.moodText}>
              {selectedDay.mood.charAt(0).toUpperCase() + selectedDay.mood.slice(1)} Mood
            </Text>
          </View>
          {selectedDay.entry?.factors?.length > 0 && (
            <Text style={styles.factorsText}>
              Factors: {selectedDay.entry.factors.join(', ')}
            </Text>
          )}
        </View>
      )}

      {/* Empty State */}
      {moodData.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Mood Data Yet</Text>
          <Text style={styles.emptyText}>
            Start logging your moods to see your wellness journey visualized here!
          </Text>
          <TouchableOpacity 
            style={styles.logMoodButton}
            onPress={() => onDayPress?.({ date: new Date(), dateKey: new Date().toISOString().split('T')[0] })}
          >
            <Text style={styles.logMoodText}>Log Your First Mood</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  calendarContainer: {
    flexDirection: 'row',
  },
  monthLabels: {
    width: 32,
    marginRight: 8,
    paddingTop: 20, // Align with calendar cells
  },
  monthLabel: {
    fontSize: 10,
    color: '#64748B',
    height: 14,
    marginBottom: 2,
  },
  calendarGrid: {
    flex: 1,
  },
  dayLabels: {
    flexDirection: 'row',
    marginBottom: 4,
    height: 14,
  },
  dayLabel: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
    textAlign: 'center',
  },
  weeksContainer: {
    flexDirection: 'row',
  },
  week: {
    flex: 1,
    marginRight: 2,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  legendItem: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  legendSpacer: {
    width: 16,
  },
  legendText: {
    fontSize: 10,
    color: '#64748B',
    marginHorizontal: 4,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  selectedDayInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  selectedDayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  moodEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  moodText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  factorsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  logMoodButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logMoodText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default MoodCalendar;