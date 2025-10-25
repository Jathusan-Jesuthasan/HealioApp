import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../config/api';
// Local theme for this screen (do not change global Colors)
const THEME = {
  primary: '#F5F7FA', // background
  secondary: '#4A90E2', // main action color
  accent: '#103981', // dark accent
};

export default function TrustedRiskAlert({ navigation }) {
  const [isActive, setIsActive] = useState(false);
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [trustedPerson, setTrustedPerson] = useState({
    name: '',
    email: '',
    phone: '',
    relation: '',
  });
  const [alertSettings, setAlertSettings] = useState({
    autoAlert: true,
    criticalOnly: false,
    dailySummary: false,
  });

  useEffect(() => {
    fetchTrustedContacts();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Fetch settings from backend
      const response = await API.get('/api/auth/alert-settings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setAlertSettings(response.data.data);
        // Also save to local storage as cache
        await AsyncStorage.setItem('alertSettings', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to local storage if backend fails
      const settings = await AsyncStorage.getItem('alertSettings');
      if (settings) {
        setAlertSettings(JSON.parse(settings));
      }
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      // Save to backend
      await API.put('/api/auth/alert-settings', newSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Also save to local storage
      await AsyncStorage.setItem('alertSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save alert settings');
    }
  };

  const fetchTrustedContacts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      const response = await API.get('/api/trusted-contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTrustedContacts(response.data.data);
        setIsActive(response.data.data.length > 0);
      }
    } catch (error) {
      console.error('Error fetching trusted contacts:', error);
      Alert.alert('Error', 'Failed to load trusted contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrustedContacts();
  };

  const handleSave = async () => {
    if (!trustedPerson.name || !trustedPerson.email) {
      Alert.alert('Error', 'Please enter at least a name and email for your trusted person.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }

      setLoading(true);

      if (editingContact) {
        // Update existing contact
        await API.put(
          `/api/trusted-contacts/${editingContact._id}`,
          {
            name: trustedPerson.name,
            email: trustedPerson.email,
            phone: trustedPerson.phone,
            relation: trustedPerson.relation,
            notifyVia: ['email'],
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Alert.alert('Success', 'Trusted contact updated successfully!');
      } else {
        // Add new contact
        await API.post(
          '/api/trusted-contacts',
          {
            name: trustedPerson.name,
            email: trustedPerson.email,
            phone: trustedPerson.phone,
            relation: trustedPerson.relation,
            notifyVia: ['email'],
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Alert.alert('Success', 'Trusted contact added successfully!');
      }

      // Reset form and refresh list
      setTrustedPerson({ name: '', email: '', phone: '', relation: '' });
      setEditingContact(null);
      fetchTrustedContacts();
    } catch (error) {
      console.error('Error saving trusted contact:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save trusted contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this trusted contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await API.delete(`/api/trusted-contacts/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Success', 'Trusted contact removed');
              fetchTrustedContacts();
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setTrustedPerson({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      relation: contact.relation,
    });
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setTrustedPerson({ name: '', email: '', phone: '', relation: '' });
  };

  const handleTestAlert = () => {
    if (!isActive || trustedContacts.length === 0) {
      Alert.alert('Error', 'Please add at least one trusted contact first.');
      return;
    }

    Alert.alert(
      'Send Test Alert?',
      `A test notification will be sent to all ${trustedContacts.length} trusted contact(s)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await API.post(
                '/api/trusted-contacts/send-test-alert',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Test Alert Sent', 'Your trusted contacts were emailed a test alert.');
            } catch (e) {
              console.error('Error sending test alert:', e);
              Alert.alert('Error', e.response?.data?.message || 'Failed to send test alert');
            }
          },
        },
      ]
    );
  };

  const handleSendDailySummaryNow = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Please log in again');
        return;
      }
      setLoading(true);
      const res = await API.post(
        '/api/trusted-contacts/test-daily-summary',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Daily Summary', res.data?.message || 'Daily summary sent successfully!');
    } catch (e) {
      console.error('Error sending daily summary:', e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to send daily summary');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (value) => {
    setIsActive(value);
  };

  const handleAlertSettingChange = async (key, value) => {
    const newSettings = { ...alertSettings, [key]: value };
    setAlertSettings(newSettings);
    await saveSettings(newSettings);
  };

  if (loading && trustedContacts.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={THEME.secondary} />
        <Text style={styles.loadingText}>Loading trusted contacts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={48} color={THEME.accent} />
        <Text style={styles.title}>Trusted Person Alert</Text>
        <Text style={styles.subtitle}>
          Setup trusted contacts who will receive alerts if concerning patterns are detected in
          your mental health activity.
        </Text>
      </View>

      {/* Activation Toggle */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Activate Trusted Person Alerts</Text>
            <Text style={styles.cardSubtitle}>
              Enable automatic alerts to your trusted contacts
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: '#D1D5DB', true: THEME.secondary }}
            thumbColor={isActive ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Existing Trusted Contacts */}
      {trustedContacts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Trusted Contacts ({trustedContacts.length})</Text>
          {trustedContacts.map((contact, index) => (
            <View key={contact._id} style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="person" size={24} color={THEME.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactDetail}>{contact.relation}</Text>
                <Text style={styles.contactDetail}>{contact.email}</Text>
                {contact.phone && <Text style={styles.contactDetail}>📱 {contact.phone}</Text>}
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(contact)}>
                  <Ionicons name="pencil" size={20} color={THEME.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDelete(contact._id)}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add/Edit Trusted Person Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {editingContact ? 'Edit Trusted Contact' : 'Add New Trusted Contact'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            value={trustedPerson.name}
            onChangeText={(text) => setTrustedPerson({ ...trustedPerson, name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={trustedPerson.email}
            onChangeText={(text) => setTrustedPerson({ ...trustedPerson, email: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={trustedPerson.phone}
            onChangeText={(text) => setTrustedPerson({ ...trustedPerson, phone: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Relationship *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Parent, Friend, Counselor"
            value={trustedPerson.relation}
            onChangeText={(text) => setTrustedPerson({ ...trustedPerson, relation: text })}
          />
        </View>

        <View style={styles.formButtons}>
          {editingContact && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.saveButton, editingContact && { flex: 1 }]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Alert Settings */}
      {isActive && trustedContacts.length > 0 && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Alert Settings</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Automatic Alerts</Text>
                <Text style={styles.settingDesc}>
                  Send alerts when AI detects high risk patterns
                </Text>
              </View>
              <Switch
                value={alertSettings.autoAlert}
                onValueChange={(val) => handleAlertSettingChange('autoAlert', val)}
                trackColor={{ false: '#D1D5DB', true: THEME.secondary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Critical Only</Text>
                <Text style={styles.settingDesc}>Only alert for high-risk situations</Text>
              </View>
              <Switch
                value={alertSettings.criticalOnly}
                onValueChange={(val) => handleAlertSettingChange('criticalOnly', val)}
                trackColor={{ false: '#D1D5DB', true: THEME.secondary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Daily Summary</Text>
                <Text style={styles.settingDesc}>Send daily summary of activities</Text>
              </View>
              <Switch
                value={alertSettings.dailySummary}
                onValueChange={(val) => handleAlertSettingChange('dailySummary', val)}
                trackColor={{ false: '#D1D5DB', true: THEME.secondary }}
              />
            </View>
          </View>

          {/* Test Alert Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.testButton} onPress={handleTestAlert}>
              <Ionicons name="notifications-outline" size={20} color={THEME.secondary} />
              <Text style={styles.testButtonText}>Send Test Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testButton} onPress={handleSendDailySummaryNow}>
              <Ionicons name="mail-outline" size={20} color={THEME.secondary} />
              <Text style={styles.testButtonText}>Send Daily Summary Now</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Info Card */}
      <View style={[styles.card, styles.infoCard]}>
        <Ionicons name="information-circle" size={24} color={THEME.accent} />
        <Text style={styles.infoText}>
          Your trusted contacts will receive automatic email alerts when our AI detects concerning
          patterns (SERIOUS, STRESS, ANGER, ANXIETY risk levels). Your personal mood logs and
          details remain private unless you choose to share them.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginTop: 8,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E9F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  inputGroup: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: THEME.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: THEME.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E9F2FD',
    borderColor: THEME.secondary,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: THEME.accent,
    lineHeight: 18,
  },
});
