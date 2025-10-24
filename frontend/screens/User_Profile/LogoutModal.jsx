import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../context/AuthContext";
import { MotiView } from 'moti';

export default function LogoutModal({ visible = false, onClose = () => {} }) {
  const { signOut } = useContext(AuthContext);

  const handleConfirm = async () => {
    // close modal first for snappy UI
    try {
      await signOut();
    } catch (e) {
      // signOut handles its own errors; just close
    } finally {
      onClose();
    }
  };

  const handleModalShow = () => {
    // On web, ensure no background element retains focus while modal is visible.
    try {
      if (typeof document !== 'undefined' && document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal={true}
      onShow={handleModalShow}
    >
      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                  <Ionicons name="log-out-outline" size={48} color="#EF4444" />
                </View>

                <Text style={styles.warningText}>
                  You will be signed out of your account and will need to sign in again to access your data.
                </Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="log-out" size={20} color="#fff" />
                    <Text style={styles.logoutBtnText}>Yes, Log Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="close" size={20} color="#667eea" />
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </MotiView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  keyboardView: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  warningText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  cancelBtnText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
