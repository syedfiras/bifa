import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import IconInput from '../components/IconInput';
import GradientButton from '../components/GradientButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function SettingsScreen({ setToken }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation', 'Please fill in both password fields.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/auth/password`, { currentPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Password updated safely.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('token');
        if (setToken) setToken(null);
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Settings" subtitle="Manage your account" />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color={colors.yellow} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.cardTitle}>Security</Text>
              <Text style={styles.cardSub}>Update your login credentials</Text>
            </View>
          </View>

          <IconInput
            icon="lock-closed-outline"
            placeholder="Current Password"
            secureTextEntry={!showCurrent}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            rightIcon={showCurrent ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowCurrent(prev => !prev)}
          />
          <View style={{ height: spacing.md }} />
          <IconInput
            icon="lock-open-outline"
            placeholder="New Password"
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={setNewPassword}
            rightIcon={showNew ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowNew(prev => !prev)}
          />

          <GradientButton label="Update Password" icon="lock-closed" onPress={handleChangePassword} style={styles.updateBtn} />
        </View>

        <View style={styles.dangerSection}>
          <GradientButton label="Sign Out" icon="log-out-outline" variant="red" onPress={handleLogout} />
        </View>

        <View style={styles.versionFooter}>
          <Text style={styles.versionLabel}>App Version</Text>
          <Text style={styles.versionValue}>3.0.0</Text>
          <Text style={styles.createdBy}>Developed by Syed Firas</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.bgLight, padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.md, marginTop: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  cardIconWrap: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { ...typography.h3 },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  updateBtn: { marginTop: spacing.lg },
  dangerSection: { marginTop: spacing.xxl },
  versionFooter: { alignItems: 'center', marginTop: spacing.xxl },
  versionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  versionValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 2 },
  createdBy: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
});