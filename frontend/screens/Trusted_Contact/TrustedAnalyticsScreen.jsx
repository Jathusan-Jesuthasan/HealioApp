import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Platform,
  Pressable,
  Animated,
  Modal,
  Switch,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import Colors from "../../utils/Colors";
import { AuthContext } from "../../context/AuthContext";
import {
  getTrustedYouthOverview,
  getTrustedYouthAnalytics,
} from "../../services/analytics";

const RANGE_OPTIONS = [
  { label: "7 Days", value: "7d", icon: "calendar-week" },
  { label: "30 Days", value: "30d", icon: "calendar-month" },
  { label: "90 Days", value: "90d", icon: "calendar-range" },
  { label: "1 Year", value: "365d", icon: "calendar-year" },
];

const permissionBadge = (permissions) => {
  if (!permissions) {
    return { label: "Awaiting Consent", bg: Colors.warningLight, color: Colors.warning, icon: "clock-outline" };
  }
  if (permissions.alertsOnly) {
    return { label: "Alerts Only", bg: Colors.warningLight, color: Colors.warning, icon: "bell-outline" };
  }
  if (permissions.allowTrends && permissions.allowWellness) {
    return { label: "Full Analytics", bg: Colors.successLight, color: Colors.accent, icon: "chart-box" };
  }
  if (permissions.allowWellness) {
    return { label: "Wellness Shared", bg: Colors.infoLight, color: Colors.info, icon: "heart-outline" };
  }
  if (permissions.allowTrends) {
    return { label: "Trends Enabled", bg: Colors.infoLight, color: Colors.info, icon: "trending-up" };
  }
  return { label: "Limited", bg: Colors.warningLight, color: Colors.warning, icon: "lock-outline" };
};

const TrustedAnalyticsScreen = ({ route }) => {
  const { userToken } = useContext(AuthContext);
  const Touchable = Platform.OS === "web" ? Pressable : TouchableOpacity;
  const fadeRef = useRef(new Animated.Value(0));
  const scaleRef = useRef(new Animated.Value(0.95));
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isSmallScreen = screenWidth < 375;
  const isTablet = screenWidth >= 768;

  const responsive = useMemo(
    () => ({
      fontSize: {
        title: isSmallScreen ? 22 : isTablet ? 28 : 24,
        subtitle: isSmallScreen ? 12 : isTablet ? 16 : 14,
        body: isSmallScreen ? 13 : isTablet ? 16 : 14,
        chip: isSmallScreen ? 12 : isTablet ? 15 : 13,
        metric: isSmallScreen ? 16 : isTablet ? 22 : 18,
      },
      spacing: {
        screen: isSmallScreen ? 16 : isTablet ? 28 : 20,
        medium: isSmallScreen ? 12 : isTablet ? 24 : 16,
        small: isSmallScreen ? 8 : isTablet ? 16 : 12,
      },
      icon: {
        small: isSmallScreen ? 16 : isTablet ? 22 : 18,
        medium: isSmallScreen ? 20 : isTablet ? 28 : 22,
      },
    }),
    [isSmallScreen, isTablet]
  );

  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedWidgets, setSelectedWidgets] = useState({
    quickStats: true,
    moodChart: true,
    distribution: true,
    factors: true,
    riskSummary: true,
    insights: true,
  });

  const widgetOptions = useMemo(
    () => [
      {
        id: "quickStats",
        label: "Shared Snapshot",
        description: "Key wellness metrics this youth shares",
        icon: "pulse",
      },
      {
        id: "moodChart",
        label: "Mood Journey",
        description: "Trend of recent mood check-ins",
        icon: "trending-up",
      },
      {
        id: "distribution",
        label: "Mood Balance",
        description: "Distribution across emotions",
        icon: "pie-chart",
      },
      {
        id: "factors",
        label: "Influencing Factors",
        description: "Top contributors impacting mood",
        icon: "options",
      },
      {
        id: "riskSummary",
        label: "AI Wellness Alerts",
        description: "Latest AI risk insights to monitor",
        icon: "warning",
      },
      {
        id: "insights",
        label: "Conversation Starters",
        description: "Suggestions to support the youth",
        icon: "chatbubble-ellipses",
      },
    ],
    []
  );

  const toggleWidget = useCallback((id) => {
    setSelectedWidgets((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const resetWidgets = useCallback(() => {
    setSelectedWidgets({
      quickStats: true,
      moodChart: true,
      distribution: true,
      factors: true,
      riskSummary: true,
      insights: true,
    });
  }, []);

  const [range, setRange] = useState("30d");
  const [overview, setOverview] = useState([]);
  const [selectedYouthId, setSelectedYouthId] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [analyticsMap, setAnalyticsMap] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const cardInset = useMemo(
    () => ({ marginHorizontal: responsive.spacing.screen }),
    [responsive.spacing.screen]
  );

  const selectedDetail = selectedYouthId ? analyticsMap[selectedYouthId] : undefined;
  const analyticsData = selectedDetail?.data;
  const detailLoading = selectedDetail?.loading;
  const detailError = selectedDetail?.error;

  const routeYouthId = route?.params?.youthId ? route.params.youthId.toString() : null;

  useEffect(() => {
    if (routeYouthId && routeYouthId !== selectedYouthId) {
      setSelectedYouthId(routeYouthId);
    }
  }, [routeYouthId, selectedYouthId]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeRef.current, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleRef.current, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const fetchOverview = useCallback(
    async (targetRange) => {
      if (!userToken) return;
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const response = await getTrustedYouthOverview(targetRange);
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];
        setOverview(list);
        if (!list.length) {
          setSelectedYouthId(null);
        } else if (!list.some((item) => item?.id?.toString() === selectedYouthId)) {
          setSelectedYouthId(list[0]?.id?.toString() || null);
        }
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || "Unable to load youth analytics.";
        setOverviewError(message);
        setOverview([]);
      } finally {
        setOverviewLoading(false);
      }
    },
    [selectedYouthId, userToken]
  );

  const fetchDetail = useCallback(async (youthId, targetRange) => {
    if (!youthId || !userToken) return;
    setAnalyticsMap((prev) => ({
      ...prev,
      [youthId]: { ...(prev[youthId] || {}), loading: true, error: null },
    }));
    try {
      const response = await getTrustedYouthAnalytics(youthId, targetRange);
      setAnalyticsMap((prev) => ({
        ...prev,
        [youthId]: {
          loading: false,
          error: null,
          data: response?.data?.data || null,
        },
      }));
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Unable to load detailed insight.";
      setAnalyticsMap((prev) => ({
        ...prev,
        [youthId]: { ...(prev[youthId] || {}), loading: false, error: message },
      }));
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchOverview(range);
    }, [fetchOverview, range])
  );

  useEffect(() => {
    if (!selectedYouthId) return;
    fetchDetail(selectedYouthId, range);
  }, [selectedYouthId, range, fetchDetail]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview(range);
    if (selectedYouthId) {
      await fetchDetail(selectedYouthId, range);
    }
    setRefreshing(false);
  }, [fetchDetail, fetchOverview, range, selectedYouthId]);

  const handleRangeChange = (value) => {
    setRange(value);
  };

  const handleYouthSelect = (youthId) => {
    setSelectedYouthId(youthId);
  };

  const youthList = useMemo(() => overview.map((item) => ({
    ...item,
    id: item?.id?.toString() || item?._id?.toString() || "",
  })), [overview]);

  const renderQuickStats = () => {
    if (!analyticsData) return null;
    const stats = analyticsData.stats || {};
    const summary = [
      {
        label: "Mind Balance",
        value: stats.mindBalanceScore ?? "—",
        icon: "heart",
        color: Colors.secondary,
      },
      {
        label: "Entries Shared",
        value: stats.totalEntries ?? "—",
        icon: "document-text",
        color: Colors.accent,
      },
      {
        label: "Streak",
        value: stats.streak ? `${stats.streak} days` : "0 days",
        icon: "flash",
        color: Colors.warning,
      },
      {
        label: "Top Mood",
        value: stats.topMood || "—",
        icon: "sparkles",
        color: Colors.info,
      },
    ];

    return (
      <View
        style={[
          styles.quickStats,
          cardInset,
          isSmallScreen && styles.quickStatsSmall,
          isTablet && styles.quickStatsTablet,
        ]}
      >
        {summary.map((item) => (
          <View key={item.label} style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={responsive.icon.small} color={item.color} />
            </View>
            <Text style={[styles.quickStatValue, { fontSize: responsive.fontSize.metric }]}>{item.value}</Text>
            <Text style={[styles.quickStatLabel, { fontSize: responsive.fontSize.subtitle }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderFilterButtons = () => (
    <View style={[styles.filterSection, { paddingHorizontal: responsive.spacing.screen }]}>
      <Text style={[styles.filterLabel, { fontSize: responsive.fontSize.body }]}>View data for:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterContent, { paddingRight: responsive.spacing.small }]}
      >
        {RANGE_OPTIONS.map((option) => {
          const isActive = range === option.value;
          return (
            <Touchable
              key={option.value}
              style={[
                styles.filterButton,
                isSmallScreen && styles.filterButtonSmall,
                isTablet && styles.filterButtonTablet,
                isActive && styles.activeFilterButton,
              ]}
              onPress={() => handleRangeChange(option.value)}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={responsive.icon.small}
                color={isActive ? "#fff" : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  { fontSize: responsive.fontSize.subtitle },
                  isActive && styles.activeFilterText,
                ]}
              >
                {option.label}
              </Text>
            </Touchable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderYouthChip = ({ item, index }) => {
    const isActive = item.id === selectedYouthId;
    const badge = permissionBadge(item.permissions);
    const chipWidth = isTablet ? 220 : isSmallScreen ? 140 : 180;
    
    return (
      <Animated.View
        style={{
          transform: [{ scale: fadeRef.current }],
          opacity: fadeRef.current,
        }}
      >
        <Touchable
          onPress={() => handleYouthSelect(item.id)}
          style={[styles.youthChip, { width: chipWidth }, isActive && styles.youthChipActive]}
        >
          <View style={styles.youthChipHeader}>
            <View style={[styles.avatar, { backgroundColor: isActive ? Colors.accent : Colors.primary }]}>
              <Text style={[styles.avatarText, { color: "#fff" }]}>
                {item.name ? item.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>
            <View style={styles.youthInfo}>
              <Text
                style={[styles.youthName, { fontSize: responsive.fontSize.body }, isActive && styles.youthNameActive]}
                numberOfLines={1}
              >
                {item.name || "Youth"}
              </Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <MaterialCommunityIcons name={badge.icon} size={14} color={badge.color} />
                <Text style={[styles.badgeText, { color: badge.color, fontSize: responsive.fontSize.chip }]}>
                  {badge.label}
                </Text>
              </View>
            </View>
          </View>
          {isActive && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.accent} />
            </View>
          )}
        </Touchable>
      </Animated.View>
    );
  };

  const renderMoodChart = () => {
    if (!analyticsData?.permissions?.allowTrends) {
      return (
        <View style={[styles.limitedCard, cardInset]}>
          <Ionicons name="lock-closed" size={24} color={Colors.warning} />
          <View style={styles.limitedTextContainer}>
            <Text style={styles.limitedTitle}>Mood Trends Locked</Text>
            <Text style={styles.limitedText}>Ask the youth if they would like to share mood trends with you.</Text>
          </View>
        </View>
      );
    }

    const data = analyticsData?.recentMood || [];
    if (!data.length) {
      return (
        <View style={[styles.emptyCard, cardInset]}>
          <Ionicons name="time-outline" size={32} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No mood logs recorded in this range</Text>
        </View>
      );
    }

    const chartWidth = Math.max(260, screenWidth - responsive.spacing.screen * 2);

    return (
      <View style={[styles.chartCard, cardInset]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="sparkles" size={20} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Mood Journey</Text>
          </View>
          <Touchable style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textSecondary} />
          </Touchable>
        </View>
        <LineChart
          data={{
            labels: data.map((entry) => entry.label),
            datasets: [
              {
                data: data.map((entry) => entry.value),
                color: () => Colors.secondary,
                strokeWidth: 3,
              },
            ],
          }}
          width={chartWidth}
          height={220}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          fromZero
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: "#FFFFFF",
            backgroundGradientFrom: "#FFFFFF",
            backgroundGradientTo: "#FFFFFF",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "5",
              strokeWidth: "2",
              stroke: Colors.accent,
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: Colors.border,
              strokeWidth: 1,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDistribution = () => {
    if (!analyticsData?.permissions?.allowTrends) return null;
    const distribution = analyticsData?.moodDistribution || [];
    if (!distribution.length) return null;
    const distributionTotal = distribution.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
    return (
      <View style={[styles.sectionCard, cardInset]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Feather name="pie-chart" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Mood Distribution</Text>
          </View>
        </View>
        <View style={styles.distributionContainer}>
          {distribution.map((item, index) => (
            <View key={item.label} style={styles.distributionRow}>
              <View style={styles.distributionLabelContainer}>
                <Text style={styles.distributionLabel}>{item.label}</Text>
                <Text style={styles.distributionPercentage}>{Math.round(((item.value || 0) / distributionTotal) * 100)}%</Text>
              </View>
              <View style={styles.distributionBarTrack}>
                <Animated.View
                  style={[
                    styles.distributionBar,
                    {
                      width: `${Math.min(100, ((item.value || 0) / distributionTotal) * 100)}%`,
                      backgroundColor: Colors.secondary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.distributionValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFactors = () => {
    if (!analyticsData?.permissions?.allowTrends) return null;
    const factors = analyticsData?.topFactors || [];
    if (!factors.length) return null;
    return (
      <View style={[styles.sectionCard, cardInset]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Feather name="sliders" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Influencing Factors</Text>
          </View>
        </View>
        <View style={styles.factorWrap}>
          {factors.map((factor, index) => (
            <View key={factor.label} style={styles.factorPill}>
              <Text style={styles.factorText}>{factor.label}</Text>
              <View style={styles.factorCount}>
                <Text style={styles.factorCountText}>×{factor.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRiskSummary = () => {
    const summary = analyticsData?.riskSummary;
    if (!summary) return null;
    
    const getRiskLevelColor = (level) => {
      switch (level?.toLowerCase()) {
        case 'high': return Colors.error;
        case 'medium': return Colors.warning;
        case 'low': return Colors.success;
        default: return Colors.textSecondary;
      }
    };

    return (
      <View style={[styles.riskCard, cardInset]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>AI Wellness Alerts</Text>
          </View>
          <View style={[styles.riskLevel, { backgroundColor: `${getRiskLevelColor(summary.latestLevel)}15` }]}>
            <Text style={[styles.riskLevelText, { color: getRiskLevelColor(summary.latestLevel) }]}>
              {summary.latestLevel || "None"}
            </Text>
          </View>
        </View>
        
        <View style={styles.riskGrid}>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>Wellness Index</Text>
            <Text style={styles.riskValue}>{summary.wellnessIndex ?? "—"}</Text>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskLabel}>Last Updated</Text>
            <Text style={styles.riskValue}>
              {summary.updatedAt ? new Date(summary.updatedAt).toLocaleDateString() : "—"}
            </Text>
          </View>
        </View>

        {Array.isArray(summary.suggestions) && summary.suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>Support Suggestions</Text>
            {summary.suggestions.slice(0, 3).map((tip, idx) => (
              <View key={idx} style={styles.suggestionItem}>
                <Ionicons name="bulb-outline" size={14} color={Colors.info} />
                <Text style={styles.suggestionText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderInsights = () => {
    const insights = analyticsData?.insights || [];
    if (!insights.length) return null;
    return (
      <View style={[styles.sectionCard, cardInset]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="chatbubble-ellipses" size={18} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Conversation Starters</Text>
          </View>
        </View>
        {insights.map((insight, idx) => (
          <View
            key={`${insight.title}-${idx}`}
            style={[styles.insightCard, insight.tone === "warning" && styles.insightWarning]}
          >
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightText}>{insight.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderAlertsOnlyNotice = () => {
    if (!analyticsData?.permissions?.alertsOnly) return null;
    return (
      <View style={[styles.noticeCard, cardInset]}>
        <Ionicons name="information-circle" size={24} color={Colors.warning} />
        <View style={styles.noticeTextContainer}>
          <Text style={styles.noticeTitle}>Alerts Only Mode</Text>
          <Text style={styles.noticeText}>
            This youth shares emergency alerts only. You will be notified if AI detects high-risk patterns.
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (overviewLoading) {
      return (
        <View style={styles.loaderBlock}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loaderText}>Gathering shared wellness data…</Text>
        </View>
      );
    }

    if (overviewError) {
      return (
        <View style={styles.errorBlock}>
          <Ionicons name="cloud-offline" size={48} color={Colors.warning} />
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorText}>{overviewError}</Text>
          <Touchable style={styles.retryButton} onPress={() => fetchOverview(range)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Touchable>
        </View>
      );
    }

    if (!youthList.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Youth Linked Yet</Text>
          <Text style={styles.emptySubtitle}>
            Accept a youth request to unlock shared analytics and safety alerts
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: responsive.spacing.medium * 2 }]}
      >
        <Animated.View style={{ opacity: fadeRef.current, transform: [{ scale: scaleRef.current }] }}>
          <View
            style={[
              styles.screenHeader,
              {
                paddingHorizontal: responsive.spacing.screen,
                marginBottom: responsive.spacing.medium,
              },
            ]}
          >
            <View style={styles.screenHeaderText}>
              <Text style={[styles.screenTitle, { fontSize: responsive.fontSize.title }]}>
                Trusted Wellness Overview
              </Text>
              <Text style={[styles.screenSubtitle, { fontSize: responsive.fontSize.subtitle }]}>
                Respectful insights shared with consent
              </Text>
            </View>
            <Touchable
              style={styles.settingsButton}
              onPress={() => setExportModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="options" size={responsive.icon.small} color={Colors.secondary} />
            </Touchable>
          </View>

          {renderFilterButtons()}

          <View
            style={[
              styles.youthSection,
              {
                paddingHorizontal: responsive.spacing.screen,
                marginBottom: responsive.spacing.medium,
              },
            ]}
          >
            <Text style={[styles.sectionLabel, { fontSize: responsive.fontSize.body }]}>Select Youth</Text>
            <FlatList
              data={youthList}
              keyExtractor={(item) => item.id}
              renderItem={renderYouthChip}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.youthList}
              contentContainerStyle={[styles.youthListContent, { paddingRight: responsive.spacing.small }]}
            />
          </View>

          {detailLoading && (
            <View style={[styles.loaderInline, cardInset]}>
              <ActivityIndicator color={Colors.accent} size="small" />
              <Text style={styles.loaderInlineText}>Loading detailed view…</Text>
            </View>
          )}

          {detailError && (
            <View style={[styles.errorInline, cardInset]}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
              <Text style={styles.errorInlineText}>{detailError}</Text>
            </View>
          )}

          {analyticsData && (
            <>
              {renderAlertsOnlyNotice()}
              {selectedWidgets.quickStats && renderQuickStats()}
              {selectedWidgets.moodChart && renderMoodChart()}
              {selectedWidgets.distribution && renderDistribution()}
              {selectedWidgets.factors && renderFactors()}
              {selectedWidgets.riskSummary && renderRiskSummary()}
              {selectedWidgets.insights && renderInsights()}
            </>
          )}
        </Animated.View>
      </ScrollView>
    );
  };

  const renderCustomizationModal = () => (
    <Modal
      visible={exportModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setExportModalVisible(false)}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              maxHeight: screenHeight * (isSmallScreen ? 0.9 : 0.85),
              marginHorizontal: isSmallScreen ? 8 : responsive.spacing.screen,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { fontSize: responsive.fontSize.title }]}>Customize View</Text>
              <Text style={[styles.modalSubtitle, { fontSize: responsive.fontSize.subtitle }]}>
                Choose which insights to display
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
            data={widgetOptions}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.widgetListContent}
            renderItem={({ item }) => (
              <View style={[styles.widgetItem, isSmallScreen && styles.widgetItemSmall]}>
                <View style={styles.widgetInfo}>
                  <View style={[styles.widgetIcon, { backgroundColor: `${Colors.secondary}10` }]}>
                    <Ionicons name={item.icon} size={responsive.icon.small} color={Colors.secondary} />
                  </View>
                  <View style={styles.widgetTextContainer}>
                    <Text style={[styles.widgetLabel, { fontSize: responsive.fontSize.body }]}>{item.label}</Text>
                    <Text style={[styles.widgetDescription, { fontSize: responsive.fontSize.subtitle }]}>
                      {item.description}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={selectedWidgets[item.id]}
                  onValueChange={() => toggleWidget(item.id)}
                  trackColor={{ true: Colors.secondary, false: "#E2E8F0" }}
                  thumbColor={selectedWidgets[item.id] ? "#fff" : "#f4f3f4"}
                  style={isSmallScreen && { transform: [{ scale: 0.9 }] }}
                />
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalActionButton} onPress={resetWidgets}>
              <Text style={[styles.modalActionText, { fontSize: responsive.fontSize.body }]}>Select All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (overviewLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <View style={styles.loaderBlock}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loaderText}>Gathering shared wellness data…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
      <View style={styles.container}>{renderContent()}</View>
      {renderCustomizationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
  screenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  screenHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  screenTitle: {
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
  },
  settingsButton: {
    padding: 10,
    backgroundColor: `${Colors.secondary}12`,
    borderRadius: 14,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  filterContent: {
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    minHeight: 44,
  },
  filterButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 10,
  },
  filterButtonTablet: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 52,
    borderRadius: 14,
  },
  activeFilterButton: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "600",
  },
  youthSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  youthList: {
    marginBottom: 8,
  },
  youthListContent: {
    gap: 12,
    paddingRight: 8,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStatsSmall: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickStatsTablet: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  quickStatLabel: {
    color: Colors.textSecondary,
    textAlign: "center",
  },
  youthChip: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  youthChipActive: {
    borderColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  youthChipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  youthInfo: {
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontWeight: "700",
    fontSize: 18,
  },
  youthName: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  youthNameActive: {
    color: Colors.textPrimary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  infoButton: {
    padding: 4,
  },
  chart: {
    borderRadius: 16,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  distributionContainer: {
    gap: 12,
  },
  distributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  distributionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 100,
  },
  distributionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  distributionPercentage: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "600",
  },
  distributionBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  distributionBar: {
    height: 8,
    borderRadius: 4,
  },
  distributionValue: {
    width: 24,
    textAlign: "right",
    fontWeight: "700",
    color: Colors.textPrimary,
    fontSize: 14,
  },
  factorWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  factorPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.infoLight,
  },
  factorText: {
    fontWeight: "600",
    fontSize: 14,
    color: Colors.info,
  },
  factorCount: {
    backgroundColor: Colors.info,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  factorCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  riskCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  riskLevel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: "700",
  },
  riskGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  riskItem: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  riskValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  suggestionBox: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.infoLight,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.info,
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    lineHeight: 18,
  },
  insightCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.successLight,
    marginBottom: 12,
  },
  insightWarning: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warningLight,
  },
  insightTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  insightText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noticeCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warningLight,
    marginBottom: 20,
  },
  noticeTextContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.warning,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 18,
  },
  limitedCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.warningLight,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  limitedTextContainer: {
    flex: 1,
  },
  limitedTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: Colors.warning,
    marginBottom: 4,
  },
  limitedText: {
    fontSize: 14,
    color: Colors.warning,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  loaderBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 80,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  loaderInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    marginBottom: 20,
  },
  loaderInlineText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  errorBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  errorText: {
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  errorInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorInlineText: {
    color: Colors.warning,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.accent,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: `${Colors.textSecondary}12`,
  },
  widgetListContent: {
    paddingBottom: 12,
  },
  widgetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  widgetItemSmall: {
    paddingVertical: 12,
  },
  widgetInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  widgetIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  widgetTextContainer: {
    flex: 1,
  },
  widgetLabel: {
    color: Colors.textPrimary,
    fontWeight: "600",
    marginBottom: 2,
  },
  widgetDescription: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  modalActionButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  modalActionText: {
    color: Colors.secondary,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
  },
});

export default TrustedAnalyticsScreen;