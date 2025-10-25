import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  Keyboard,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import { MotiView } from "moti";
import api from "../../config/api";
import { AuthContext } from "../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PersonalInfoScreen({ navigation }) {
  const { userToken, signOut } = useContext(AuthContext);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bio: "",
    role: "Youth",
    profileImage: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});
  const saveTimerRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users/me", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // Map backend avatarUrl to profileImage used in the UI for consistency
      const mapped = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        dob: data.dob ? (new Date(data.dob)).toISOString().split('T')[0] : "",
        gender: data.gender || "",
        bio: data.bio || "",
        role: data.role || "Youth",
        profileImage: data.avatarUrl || data.profileImage || "",
      };
      setProfile(mapped);
    } catch (error) {
      Alert.alert("Error", "Could not load profile");
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissions required", "Please allow photo access to set a profile picture.");
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setProfile({ ...profile, profileImage: result.assets[0].uri });
    }
  };

  const removeImage = () => {
    Alert.alert("Remove photo", "Do you want to remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setProfile({ ...profile, profileImage: "" }) },
    ]);
  };

  const handleSave = async () => {
    const valid = validateProfile();
    if (!valid) return;
    setSaving(true);
    try {
      let avatarUrlToSend = profile.profileImage || null;

      // if profileImage is a local file URI (from expo-image-picker) or a blob/data URI (web), upload it first
      if (
        avatarUrlToSend &&
        (avatarUrlToSend.startsWith("file:") || avatarUrlToSend.startsWith("/") || avatarUrlToSend.startsWith("blob:") || avatarUrlToSend.startsWith("data:"))
      ) {
        const form = new FormData();
        // derive a filename and mime type when possible
        const uriParts = avatarUrlToSend.split('/');
        let name = uriParts[uriParts.length - 1] || `avatar.jpg`;
        const match = name.match(/\.([0-9a-z]+)(?:[?#]|$)/i);
        const ext = match ? match[1].toLowerCase() : null;
        let inferredMime = ext === 'png' ? 'image/png' : 'image/jpeg';

        try {
          if (Platform.OS === 'web') {
            // On web, convert blob/data/blob: URIs to a File object
            const response = await fetch(avatarUrlToSend);
            const blob = await response.blob();
            const webExt = ext || (blob.type && blob.type.split('/')[1]) || 'jpg';
            const fileName = name || `avatar.${webExt}`;
            const file = new File([blob], fileName, { type: blob.type || inferredMime });
            form.append('avatar', file);
          } else {
            // Native (expo) accepts an object with uri/name/type
            const fileName = name.split('?')[0];
            form.append('avatar', {
              uri: avatarUrlToSend,
              name: fileName,
              type: inferredMime,
            });
          }

          // Do not set Content-Type header manually; let fetch/browser set multipart boundary
          const uploadResp = await fetch(`${api.defaults.baseURL || ''}/api/users/me/avatar`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${userToken}`,
            },
            body: form,
          });
          const uploadData = await uploadResp.json();
          if (uploadResp.ok && uploadData.avatarUrl) {
            avatarUrlToSend = uploadData.avatarUrl;
          }
        } catch (upErr) {
          console.warn('Avatar upload failed', upErr);
        }
      }

      const payload = {
        name: profile.name,
        phone: profile.phone,
        dob: profile.dob || null,
        gender: profile.gender,
        bio: profile.bio,
        role: profile.role,
        avatarUrl: avatarUrlToSend || null,
      };
      const { data } = await api.put("/api/users/me", payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const mapped = {
        name: data.name || "",
        email: data.email || profile.email,
        phone: data.phone || "",
        dob: data.dob ? (new Date(data.dob)).toISOString().split('T')[0] : profile.dob,
        gender: data.gender || "",
        bio: data.bio || "",
        role: data.role || "Youth",
        profileImage: data.avatarUrl || profile.profileImage || "",
      };
      setProfile(mapped);
      setShowSuccessModal(true);
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setShowSuccessModal(false);
        // navigate to Profile so user sees updated details
        if (navigation && navigation.navigate) navigation.navigate('Profile');
      }, 1200);
    } catch (error) {
      Alert.alert("Error", "Could not update profile");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    Alert.alert("Confirm", "Are you sure you want to delete your account?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/api/users/me", {
              headers: { Authorization: `Bearer ${userToken}` },
            });
            Alert.alert("Deleted", "Your profile has been deleted");
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Could not delete account");
          }
        },
      },
    ]);
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split("T")[0];
      setProfile({ ...profile, dob: iso });
      setErrors((e) => ({ ...e, dob: undefined }));
    }
  };

  const validateProfile = () => {
    const e = {};
    if (!profile.name || profile.name.trim().length < 2) e.name = "Please enter your full name";
    if (profile.phone && !/^\+?[0-9 \-()]{6,30}$/.test(profile.phone)) e.phone = "Please enter a valid phone number";
    if (profile.dob) {
      const age = (() => {
        try {
          const today = new Date();
          const dobDate = new Date(profile.dob);
          let ageCalc = today.getFullYear() - dobDate.getFullYear();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) ageCalc--;
          return ageCalc;
        } catch (err) {
          return null;
        }
      })();
      if (age !== null && (age < 13 || age > 120)) e.dob = "Please enter a valid date of birth";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing' }}
        >
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 16, color: "#6B7280", fontSize: 16 }}>Loading your profile...</Text>
        </MotiView>
      </View>
    );
  }

  const handleModalShow = () => {
    try {
      if (typeof document !== 'undefined' && document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardAvoid}
      >
        <View>
          <ScrollView 
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600 }}
              style={styles.headerSection}
            >
              <LinearGradient
                colors={['#4A90E2', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                <Text style={styles.headerTitle}>Personal Information</Text>
                <Text style={styles.headerSubtitle}>Update your profile details</Text>
              </LinearGradient>
            </MotiView>

            {/* Profile Picture Section */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 100 }}
              style={styles.avatarSection}
            >
              <View style={styles.avatarContainer}>
                <TouchableOpacity 
                  onPress={pickImage} 
                  style={styles.avatarTouchable}
                  accessible
                  accessibilityRole="imagebutton"
                  accessibilityLabel="Change profile photo"
                >
                  {profile.profileImage ? (
                    <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
                  ) : (
                    <LinearGradient
                      colors={['#E5E7EB', '#D1D5DB']}
                      style={styles.avatarPlaceholder}
                    >
                      <Ionicons name="person" size={40} color="#6B7280" />
                      <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
                
                {profile.profileImage ? (
                  <View style={styles.avatarActions}>
                    <TouchableOpacity 
                      style={styles.editPhotoBtn}
                      onPress={pickImage}
                      accessibilityLabel="Edit photo"
                    >
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.removePhotoBtn}
                      onPress={removeImage}
                      accessibilityLabel="Remove photo"
                    >
                      <Text style={styles.removePhotoText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </MotiView>

            {/* Form Section */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 200 }}
              style={styles.formSection}
            >
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  placeholder="Enter your full name"
                  value={profile.name}
                  onChangeText={(v) => {
                    setProfile({ ...profile, name: v });
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholderTextColor="#9CA3AF"
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={styles.disabledText}>{profile.email}</Text>
                </View>
                <Text style={styles.helperText}>Email cannot be changed</Text>
              </View>

              {/* Phone Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                  value={profile.phone}
                  onChangeText={(v) => {
                    setProfile({ ...profile, phone: v });
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholderTextColor="#9CA3AF"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              {/* Date of Birth Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.input, styles.dateInput]}
                >
                  <Text style={profile.dob ? styles.dateText : styles.placeholderText}>
                    {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Select your date of birth'}
                  </Text>
                  <Feather name="calendar" size={20} color="#6B7280" />
                </TouchableOpacity>
                {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
                {showDatePicker && (
                  <DateTimePicker
                    value={profile.dob ? new Date(profile.dob) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onChangeDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Gender Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile.gender}
                    onValueChange={(itemValue) => setProfile({ ...profile, gender: itemValue })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Gender" value="" />
                    <Picker.Item label="Male" value="Male" />
                    <Picker.Item label="Female" value="Female" />
                    <Picker.Item label="Other" value="Other" />
                    <Picker.Item label="Prefer not to say" value="Prefer not to say" />
                  </Picker>
                </View>
              </View>

              {/* Bio Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChangeText={(v) => setProfile({ ...profile, bio: v })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#9CA3AF"
                  maxLength={200}
                />
                <Text style={styles.charCount}>{profile.bio.length}/200</Text>
              </View>

              {/* Role Field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={profile.role}
                    onValueChange={(itemValue) => setProfile({ ...profile, role: itemValue })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Youth" value="Youth" />
                    <Picker.Item label="Trusted" value="Trusted" />
                  </Picker>
                </View>
              </View>
            </MotiView>

            {/* Action Buttons */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
              style={styles.actionsSection}
            >
              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                onPress={handleSave} 
                disabled={saving}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.saveText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity 
                  style={styles.logoutButton} 
                  onPress={() => signOut()}
                >
                  <Ionicons name="log-out-outline" size={20} color="#4A90E2" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        accessibilityViewIsModal={true}
        onShow={handleModalShow}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            style={styles.successModal}
          >
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Profile Updated!</Text>
            <Text style={styles.successMessage}>Your changes have been saved successfully</Text>
            <Pressable
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                if (navigation && navigation.navigate) navigation.navigate('Profile');
              }}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </Pressable>
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  
  // Header Section
  headerSection: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: 'center',
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarTouchable: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarPlaceholderText: {
    color: "#6B7280",
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  avatarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  editPhotoBtn: {
    backgroundColor: '#4A90E2',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  removePhotoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removePhotoText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: '500',
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    fontSize: 16,
    color: "#111827",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
  },
  disabledText: {
    color: "#6B7280",
    fontSize: 16,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: "#111827",
    fontSize: 16,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    color: "#6B7280",
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  picker: {
    height: 56,
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: 20,
  },
  saveButton: {
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4A90E2",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: "#4A90E2",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#FEF2F2",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FECACA",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModal: {
    backgroundColor: "#FFFFFF",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    width: '100%',
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});