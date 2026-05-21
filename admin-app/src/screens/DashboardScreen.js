import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const StatCard = ({ icon, label, value, color, delay, sublabel }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, delay, tension: 50, friction: 8, useNativeDriver: true }).start();
    count.addListener(({ value: v }) => setDisplayValue(Math.round(v).toString()));
    Animated.timing(count, { toValue: value, duration: 1000, delay: delay + 200, useNativeDriver: false }).start();
    return () => count.removeAllListeners();
  }, [value]);

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale }] }]}>
      <LinearGradient colors={gradients.card} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.statIconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
      </View>
      <Text style={[styles.statValue, { color }]}>{displayValue}</Text>
    </Animated.View>
  );
};

const ActionCard = ({ icon, iconBg, title, subtitle, onPress, accentColor }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <LinearGradient colors={gradients.card} style={styles.actionCard}>
      <View style={[styles.actionIconWrap, { backgroundColor: (accentColor || colors.yellow) + '20' }]}>
        <Ionicons name={icon} size={20} color={accentColor || colors.yellow} />
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSub}>{subtitle}</Text>
      </View>
      <View style={styles.actionArrow}>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ totalPlayers: 0, pending: 0, accepted: 0, declined: 0, referees: 0 });
  const headerFade = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resPlayers, resReferees] = await Promise.all([
        axios.get(`${API_URL}/players`, config),
        axios.get(`${API_URL}/referees`, config),
      ]);
      const players = resPlayers.data.data;
      const referees = resReferees.data.data;
      setStats({
        totalPlayers: players.length,
        pending: players.filter(p => p.status === 'pending').length,
        accepted: players.filter(p => p.status === 'accepted').length,
        declined: players.filter(p => p.status === 'declined').length,
        referees: referees.length,
      });
    } catch (e) { console.log('Error loading stats', e); }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadData());
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: headerFade }}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.heading}>Admin Dashboard</Text>
            </View>
            <View style={styles.headerBadge}>
              <View style={styles.headerDot} />
              <Text style={styles.headerBadgeText}>Live</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.statsSection}>
          <StatCard icon="people" label="Total" value={stats.totalPlayers} color={colors.yellow} delay={100} sublabel="registrations" />
          <StatCard icon="time-outline" label="Pending" value={stats.pending} color={colors.orange} delay={200} />
          <StatCard icon="checkmark-circle-outline" label="Accepted" value={stats.accepted} color={colors.green} delay={300} />
          <StatCard icon="close-circle-outline" label="Declined" value={stats.declined} color={colors.red} delay={400} />
          <StatCard icon="gavel-outline" label="Officials" value={stats.referees} color={colors.blue} delay={500} sublabel="referees" />
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <ActionCard
          icon="clipboard-list"
          title="Team Roster"
          subtitle="View accepted players"
          onPress={() => navigation.navigate('Roster')}
        />
        <ActionCard
          icon="mail-unread-outline"
          title="Applications"
          subtitle="Manage pending requests"
          accentColor={colors.orange}
          onPress={() => navigation.navigate('Manage')}
        />
        <ActionCard
          icon="gavel"
          title="Match Officials"
          subtitle="Manage referees"
          accentColor={colors.blue}
          onPress={() => navigation.navigate('Referees')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  header: { marginTop: spacing.lg, marginBottom: spacing.xxl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: colors.textSecondary, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  heading: { color: colors.text, fontSize: 28, fontWeight: '900', letterSpacing: 0.5, marginTop: spacing.xs },
  headerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenDim, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginRight: spacing.xs },
  headerBadgeText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  statsSection: { marginBottom: spacing.xxl, gap: spacing.sm },
  statCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.md,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  statLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 2 },
  statSublabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.md, marginTop: spacing.xs },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.lg,
    borderRadius: radius.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  actionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  actionSub: { color: colors.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' },
  actionArrow: { marginLeft: spacing.sm },
});
