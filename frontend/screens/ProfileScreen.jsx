// frontend/screens/ProfileScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

/**
 * HOW TO USE
 * ----------
 * <ProfileScreen
 *   navigation={navigation}
 *   route={{ params: { user: { name, email, location, role, avatarUrl } } }}
 * />
 *
 * role: "youth" | "trusted"
 * If no route params are passed, a Youth demo user is used.
 *
 * Integration points are marked with  // TODO: ... (Firebase/DB/navigation)
 */

const COLORS = {
  primary: "#2ECC71", // top arc green
  blue: "#377DFF",
  text: "#111827",
  sub: "#6B7280",
  card: "#FFFFFF",
  bg: "#F5F7FB",
  divider: "#E5E7EB",
  danger: "#EF4444",
};

const DEFAULT_USER = {
  name: "Tharsika Ranganathan",
  email: "tharsikaran@gmail.com",
  location: "Malabe, Colombo",
  role: "youth", // "trusted"
  avatarUrl:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=facearea&facepad=2",
};

// --- Reusable bits -----------------------------------------------------------
const SectionHeader = ({ title, onMore }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onMore ? (
      <TouchableOpacity onPress={onMore}>
        <Feather name="more-vertical" size={20} color={COLORS.sub} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const Row = ({ icon, title, right, onPress }) => (
  <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowTitle}>{title}</Text>
    </View>
    <View style={styles.rowRight}>
      {right}
      <Feather name="chevron-right" size={20} color={COLORS.sub} />
    </View>
  </TouchableOpacity>
);

const Tag = ({ text, color = COLORS.blue }) => (
  <View style={[styles.tag, { backgroundColor: `${color}15` }]}>
    <Text style={[styles.tagText, { color }]}>{text}</Text>
  </View>
);

const PillButton = ({ icon, text, onPress, style }) => (
  <TouchableOpacity
    style={[styles.pillBtn, style]}
    activeOpacity={0.9}
    onPress={onPress}
  >
    {icon}
    <Text style={styles.pillText}>{text}</Text>
  </TouchableOpacity>
);

const Avatar = ({ uri, size = 104 }) => (
  <Image
    source={{ uri }}
    style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: "#fff" }}
  />
);

// --- Trusted contact / youth cards ------------------------------------------
const TrustedContactCard = ({ item, onAlert, onMessage, onCall }) => (
  <View style={styles.personCard}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Avatar uri={item.avatar} size={52} />
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personNote}>{item.relation}</Text>
      </View>
      <TouchableOpacity onPress={() => onAlert(item)} style={styles.alertDot}>
        <MaterialCommunityIcons name="alarm-light-outline" size={22} color={COLORS.danger} />
      </TouchableOpacity>
    </View>

    <View style={styles.personActions}>
      <PillButton
        icon={<Feather name="phone" size={18} color="#fff" />}
        text="Call"
        onPress={() => onCall(item)}
        style={{ backgroundColor: COLORS.blue }}
      />
      <PillButton
        icon={<Feather name="message-circle" size={18} color="#fff" />}
        text="Message"
        onPress={() => onMessage(item)}
        style={{ backgroundColor: COLORS.primary }}
      />
    </View>
  </View>
);

const YouthCard = ({ item, onOpenDashboard }) => (
  <View style={styles.personCard}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Avatar uri={item.avatar} size={52} />
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{item.name}</Text>
        <Text style={styles.personNote}>Last active • {item.lastActive}</Text>
      </View>
      <Tag text={item.riskTag} color={item.riskTag === "Elevated" ? COLORS.danger : COLORS.blue} />
    </View>

    <View style={styles.personActions}>
      <PillButton
        icon={<Feather name="activity" size={18} color="#fff" />}
        text="Open Dashboard"
        onPress={() => onOpenDashboard(item)}
        style={{ backgroundColor: COLORS.blue }}
      />
    </View>
  </View>
);

// --- Main Screen -------------------------------------------------------------
export default function ProfileScreen({ navigation, route }) {
  const user = route?.params?.user ?? DEFAULT_USER;

  // local UI state
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(true);

  // demo data (replace with firestore/REST)
  const trustedContacts = useMemo(
    () => [
      {
        id: "t1",
        name: "Ramesh K",
        relation: "Father",
        avatar:
          "https://images.unsplash.com/photo-1606081430924-b6480765d470?q=80&w=400&auto=format&fit=facearea&facepad=2",
      },
      {
        id: "t2",
        name: "Anjana S",
        relation: "Sister",
        avatar:
          "https://images.unsplash.com/photo-1598970434795-0c54fe7c0642?q=80&w=400&auto=format&fit=facearea&facepad=2",
      },
    ],
    []
  );

  const myYouth = useMemo(
    () => [
      {
        id: "y1",
        name: "Ishan Perera",
        lastActive: "2h ago",
        riskTag: "Normal",
        avatar:
          "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=facearea&facepad=2",
      },
      {
        id: "y2",
        name: "Dulani Silva",
        lastActive: "Yesterday",
        riskTag: "Elevated",
        avatar:
          "https://images.unsplash.com/photo-1551561190-2a8555f1a136?q=80&w=400&auto=format&fit=facearea&facepad=2",
      },
    ],
    []
  );

  // --- actions (wire to backend) -------------------------------------------
  const goPersonalInfo = () => {
    // TODO: navigation.navigate("PersonalInfo");
    Alert.alert("Personal Info", "Open personal info form here.");
  };

  const openLanguage = () => {
    // TODO: show language picker
    Alert.alert("Language", "Open language picker.");
  };

  const openSecurity = () => {
    // TODO: navigation.navigate("Security");
    Alert.alert("Security", "Open security settings (2FA, passcode, etc.).");
  };

  const openHelp = () => {
    // TODO: navigation.navigate("HelpCenter");
    Alert.alert("Help Center", "Open help center / FAQ.");
  };

  const inviteFriends = () => {
    // TODO: Share API
    Alert.alert("Invite", "Share app link to invite friends/trusted contacts.");
  };

  const logOut = () => {
    // TODO: use AuthContext.signOut()
    Alert.alert("Log out", "Hook this to AuthContext.signOut()");
  };

  const addTrustedContact = () => {
    // TODO: navigation.navigate("AddTrustedContact")
    Alert.alert("Trusted Person", "Open 'Add Trusted Person' flow.");
  };

  const onSendEmergencyAlert = (contact) => {
    /**
     * TODO:
     * - If using Firebase/Cloud Functions:
     *    1) Write an 'alerts' doc for this user with contact + timestamp
     *    2) Cloud Function triggers push/SMS/email via provider (Twilio, SendGrid)
     */
    Alert.alert(
      "Emergency Alert",
      `Send urgent alert to ${contact.name}?`,
      [{ text: "Cancel" }, { text: "Send", onPress: () => Alert.alert("Sent ✅") }]
    );
  };

  const onMessage = (contact) => {
    // TODO: navigation.navigate("Chat", { peerId: contact.id })
    Alert.alert("Message", `Open chat with ${contact.name}`);
  };

  const onCall = (contact) => {
    // TODO: Linking.openURL(`tel:${phone}`)
    Alert.alert("Call", `Call ${contact.name}`);
  };

  const onOpenYouthDashboard = (youth) => {
    // TODO: navigation.navigate("TrustedDashboard", { youthId: youth.id })
    Alert.alert("Trusted Dashboard", `Open dashboard for ${youth.name}`);
  };

  const HeaderArc = () => (
    <View style={styles.headerArc}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* center avatar stack */}
      <View style={styles.avatarWrap}>
        <Avatar uri={user.avatarUrl} />
        <View style={styles.headerBadgeLeft}>
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
        </View>
        <View style={styles.headerBadgeRight}>
          <Feather name="smile" size={20} color="#fff" />
        </View>
      </View>

      {/* name + meta */}
      <View style={{ alignItems: "center", marginTop: 12 }}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userSub}>{user.email}</Text>
        <Text style={styles.userSub}>{user.location}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          <Tag text={user.role === "trusted" ? "Trusted Person" : "Youth User"} />
          <Tag text="Verified" color={COLORS.primary} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <HeaderArc />

        {/* GENERAL SETTINGS */}
        <View style={styles.section}>
          <SectionHeader title="General Settings" onMore={() => {}} />

          <View style={{ gap: 12 }}>
            <Row
              icon={<Ionicons name="notifications-outline" size={20} color={COLORS.text} />}
              title="Notifications"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ true: `${COLORS.blue}66`, false: "#D1D5DB" }}
                  thumbColor={notifications ? COLORS.blue : "#f4f3f4"}
                />
              }
              onPress={() => setNotifications((v) => !v)}
            />

            <Row
              icon={<Feather name="user" size={20} color={COLORS.text} />}
              title="Personal Information"
              onPress={goPersonalInfo}
            />

            {/* Youth: Emergency Contact / Trusted Person manager */}
            {user.role === "youth" && (
              <Row
                icon={<Feather name="alert-triangle" size={20} color={COLORS.text} />}
                title="Emergency Contact"
                right={<Text style={styles.linkText}>15+</Text>}
                onPress={addTrustedContact}
              />
            )}

            {/* Language */}
            <Row
              icon={<Feather name="globe" size={20} color={COLORS.text} />}
              title="Language"
              right={<Text style={styles.linkText}>English (EN)</Text>}
              onPress={openLanguage}
            />

            {/* Dark Mode */}
            <Row
              icon={<Feather name="moon" size={20} color={COLORS.text} />}
              title="Dark Mode"
              right={
                <Switch
                  value={dark}
                  onValueChange={setDark}
                  trackColor={{ true: `${COLORS.primary}66`, false: "#D1D5DB" }}
                  thumbColor={dark ? COLORS.primary : "#f4f3f4"}
                />
              }
              onPress={() => setDark((v) => !v)}
            />

            <Row
              icon={<Feather name="share-2" size={20} color={COLORS.text} />}
              title="Invite Friends"
              onPress={inviteFriends}
            />
          </View>
        </View>

        {/* ROLE-BASED BLOCKS */}
        {user.role === "youth" ? (
          <View style={styles.section}>
            <SectionHeader title="My Trusted Persons" onMore={() => {}} />
            <View style={{ gap: 12 }}>
              <FlatList
                data={trustedContacts}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <TrustedContactCard
                    item={item}
                    onAlert={onSendEmergencyAlert}
                    onMessage={onMessage}
                    onCall={onCall}
                  />
                )}
                scrollEnabled={false}
              />

              <PillButton
                icon={<Feather name="user-plus" size={18} color="#fff" />}
                text="Add Trusted Person"
                onPress={addTrustedContact}
                style={{ backgroundColor: COLORS.blue, alignSelf: "center", paddingHorizontal: 18 }}
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <SectionHeader title="You Manage (Youth)" onMore={() => {}} />
            <View style={{ gap: 12 }}>
              <FlatList
                data={myYouth}
                keyExtractor={(it) => it.id}
                renderItem={({ item }) => (
                  <YouthCard item={item} onOpenDashboard={onOpenYouthDashboard} />
                )}
                scrollEnabled={false}
              />
            </View>
          </View>
        )}

        {/* COMMUNITY & PRIVACY */}
        <View style={styles.section}>
          <SectionHeader title="Security & Privacy" onMore={() => {}} />

          <View style={{ gap: 12 }}>
            <Row
              icon={<Feather name="shield" size={20} color={COLORS.text} />}
              title="Security"
              onPress={openSecurity}
            />
            <Row
              icon={<Feather name="help-circle" size={20} color={COLORS.text} />}
              title="Help Center"
              onPress={openHelp}
            />
          </View>
        </View>

        {/* COMMUNITY / HUB */}
        <View style={styles.section}>
          <SectionHeader title="Community & Knowledge Hub" />
          <View style={{ gap: 12 }}>
            <Row
              icon={<Feather name="book-open" size={20} color={COLORS.text} />}
              title="Open Knowledge Hub"
              right={<Tag text="New" color={COLORS.primary} />}
              onPress={() => Alert.alert("Knowledge Hub", "Open curated articles & tips.")}
            />
            <Row
              icon={<Feather name="message-square" size={20} color={COLORS.text} />}
              title="Messages"
              onPress={() => Alert.alert("Messages", "Open in-app communication/chat.")}
            />
          </View>
        </View>

        {/* LOG OUT */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <SectionHeader title="Log Out" onMore={() => {}} />
          <Row
            icon={<Feather name="log-out" size={20} color={COLORS.text} />}
            title="Log Out"
            onPress={logOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// --- styles ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerArc: {
    backgroundColor: COLORS.primary,
    paddingBottom: 56,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  avatarWrap: {
    marginTop: 14,
    alignItems: "center",
  },
  headerBadgeLeft: {
    position: "absolute",
    left: 54,
    top: 32,
    backgroundColor: "#7c9cff",
    borderRadius: 22,
    padding: 10,
    elevation: 2,
  },
  headerBadgeRight: {
    position: "absolute",
    right: 54,
    top: 32,
    backgroundColor: "#79c2b0",
    borderRadius: 22,
    padding: 10,
    elevation: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  userSub: {
    color: COLORS.sub,
    marginTop: 4,
    fontSize: 13,
  },

  section: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },

  row: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: { fontSize: 15, color: COLORS.text, fontWeight: "600" },
  linkText: { color: COLORS.blue, fontWeight: "600" },

  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontWeight: "700", fontSize: 12 },

  personCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  personName: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  personNote: { fontSize: 12, color: COLORS.sub },
  alertDot: {
    backgroundColor: "#FEE2E2",
    padding: 8,
    borderRadius: 14,
  },
  personActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pillText: { color: "#fff", fontWeight: "700" },
});
