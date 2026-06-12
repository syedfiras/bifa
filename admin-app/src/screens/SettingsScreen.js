import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

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

      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.sub}>Manage your account</Text>
      </View>

      {/* App version moved to footer */}

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

        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={17} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Current Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showCurrent}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeBtn}>
            <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="lock-open-outline" size={17} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry={!showNew}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
            <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleChangePassword} activeOpacity={0.8}>
          <LinearGradient colors={gradients.yellowBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            <Ionicons name="lock-closed" size={16} color={colors.textDark} style={{ marginRight: spacing.sm }} />
            <Text style={styles.btnText}>Update Password</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerSection}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={gradients.redBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.versionFooter}>
        <View style={styles.versionRowInner}>
          <Text style={styles.versionLabel}>App Version</Text>
          <Text style={styles.versionValue}>2.0</Text>
        </View>
        <Text style={styles.createdBy}>Created by Syed Firas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.xl, paddingTop: spacing.xxxl },
  heading: { ...typography.h1, fontSize: 26 },
  sub: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  card: { backgroundColor: colors.bgLight, padding: spacing.xl, borderRadius: radius.lg, marginHorizontal: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  cardIconWrap: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.md, fontSize: 14, fontWeight: '600' },
  eyeBtn: { padding: spacing.xs },
  btn: { flexDirection: 'row', padding: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, ...shadows.yellow },
  btnText: { ...typography.button, color: colors.textDark },
  dangerSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  logoutBtn: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', ...shadows.md,
  },
  logoutText: { color: colors.text, fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  versionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.md, marginBottom: spacing.sm },
  versionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  versionValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  versionFooter: { position: 'absolute', left: 0, right: 0, bottom: spacing.lg, alignItems: 'center' },
  versionRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  createdBy: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
});
