import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../utils/Colors';
import { useNavigation } from '@react-navigation/native';
import { getEmotionEmoji } from '../../utils/emotionEmoji';

/* 🕒 Friendly date formatter */
const formatDate = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const oneDay = 24 * 60 * 60 * 1000;

    if (isNaN(date)) return '';

    if (diff < oneDay) return 'Today';
    if (diff < 2 * oneDay) return 'Yesterday';
    if (diff < 7 * oneDay) {
      const days = Math.floor(diff / oneDay);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const toConfidencePercent = (value) => {
  if (typeof value !== 'number') {
    return 0;
  }
  return value > 1 ? Math.round(value) : Math.round(value * 100);
};

const MoodHistoryScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('🔄 Syncing...');
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  /* 🔹 Fetch moods */
  const fetchMoodLogs = async () => {
    try {
      setLoading(true);
      setSyncStatus('🔄 Syncing with Cloud...');
      const token = await AsyncStorage.getItem('userToken');
      const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

      const { data } = await axios.get(`${baseURL}/api/moodlogs/all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (Array.isArray(data) && data.length > 0) {
        setLogs(data);
        await AsyncStorage.setItem('localMoodLogs', JSON.stringify(data));
        setSyncStatus('☁️ Synced from Cloud');
      } else {
        setLogs([]);
        setSyncStatus('☁️ No data found on Cloud');
      }
    } catch (err) {
      console.warn('⚠️ Using local cache:', err.message);
      const saved = await AsyncStorage.getItem('localMoodLogs');
      if (saved) {
        setLogs(JSON.parse(saved));
        setSyncStatus('📱 Offline Mode (Local Data)');
      } else {
        setLogs([]);
        setSyncStatus('❌ No local data available');
      }
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  useEffect(() => {
    fetchMoodLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMoodLogs();
    setTimeout(() => setRefreshing(false), 600);
  };

  /* 🎨 Animated mood card moved into a separate component to allow hooks */
  const MoodHistoryItem = ({ item, index, navigation }) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(15)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const moodEmoji = getEmotionEmoji(item.emotion || item.sentiment, item.mood, item.emoji);

    return (
      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slide }],
        }}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('Profile', {
              screen: 'MoodResult',
              params: {
                emoji: moodEmoji,
                sentiment: item.mood,
                emotion: item.emotion || item.sentiment,
                confidence: toConfidencePercent(item.confidence),
                funnyComment: '',
                note: item.journal,
              },
            })
          }
        >
          <View style={styles.row}>
            <Text style={styles.emoji}>{moodEmoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.moodText}>{item.mood}</Text>
              <Text style={styles.journal} numberOfLines={1}>
                {item.journal}
              </Text>
              {item.sentiment && (
                <Text style={styles.sentiment}>
                  🧠 {item.sentiment} ({toConfidencePercent(item.confidence)}%)
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.date,
                {
                  color:
                    formatDate(item.createdAt) === 'Today'
                      ? '#10B981'
                      : formatDate(item.createdAt) === 'Yesterday'
                        ? '#F59E0B'
                        : '#64748B',
                },
              ]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  /* 🧭 UI */
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <Text style={styles.header}>📘 Your Mood History</Text>
        <View style={styles.syncBar}>
          <Text
            style={[
              styles.syncText,
              syncStatus.includes('Offline')
                ? { color: '#EF4444' }
                : syncStatus.includes('Cloud')
                  ? { color: '#10B981' }
                  : { color: '#4A90E2' },
            ]}>
            {syncStatus}
          </Text>
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.secondary} style={{ marginTop: 60 }} />
      ) : logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No moods logged yet 💭</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id || item.createdAt}
          renderItem={({ item, index }) => (
            <MoodHistoryItem item={item} index={index} navigation={navigation} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
};

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  syncBar: {
    alignSelf: 'center',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
  },
  syncText: { fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 32 },
  moodText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  journal: { fontSize: 14, color: Colors.textSecondary },
  sentiment: {
    fontSize: 13,
    color: Colors.secondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  date: { fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
});

export default MoodHistoryScreen;
