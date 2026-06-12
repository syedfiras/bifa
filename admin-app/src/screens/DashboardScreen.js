import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const POSITION_ORDER = ['Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];

const STATUS_OPTIONS = ['All', 'pending', 'accepted'];

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValueWrap}>
          <Text style={styles.dropdownValue}>{selected || 'All'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.modalOption, selected === option && styles.modalOptionActive]}
                activeOpacity={0.7}
                onPress={() => { onSelect(option); setOpen(false); }}
              >
                <Text style={[styles.modalOptionText, selected === option && styles.modalOptionTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

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
  const [stats, setStats] = useState({ totalPlayers: 0, pending: 0, accepted: 0, referees: 0 });
  const [positionData, setPositionData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [filterPos, setFilterPos] = useState('All');
  const [filterAge, setFilterAge] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const headerFade = useRef(new Animated.Value(0)).current;

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resPlayers, resReferees] = await Promise.all([
        axios.get(`${API_URL}/players`, config),
        axios.get(`${API_URL}/referees`, config),
      ]);
      let players = resPlayers.data.data;
      // apply dashboard filters client-side
      if (filterPos && filterPos !== 'All') {
        players = players.filter(p => (p.positions || []).includes(filterPos));
      }
      if (filterAge && filterAge !== 'All') {
        players = players.filter(p => (p.ageCategory || 'U20') === filterAge);
      }
      if (filterStatus && filterStatus !== 'All') {
        players = players.filter(p => p.status === filterStatus);
      }
      const referees = resReferees.data.data;
      setStats({
        totalPlayers: players.length,
        pending: players.filter(p => p.status === 'pending').length,
        accepted: players.filter(p => p.status === 'accepted').length,
        referees: referees.length,
      });
      const positionCounts = players.reduce((acc, player) => {
        (player.positions || []).forEach(pos => {
          if (!pos) return;
          acc[pos] = (acc[pos] || 0) + 1;
        });
        return acc;
      }, {});
      const ageCounts = players.reduce((acc, player) => {
        const age = player.ageCategory || 'U20';
        acc[age] = (acc[age] || 0) + 1;
        return acc;
      }, {});
      setPositionData(POSITION_ORDER.filter(pos => positionCounts[pos]).map(pos => ({ label: pos, count: positionCounts[pos] })));
      setAgeData(AGE_CATEGORIES.map(age => ({ label: age, count: ageCounts[age] || 0 })));
    } catch (e) { console.log('Error loading stats', e); }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadData());
    Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    return unsubscribe;
  }, [navigation]);

  // reload when filters change
  useEffect(() => { loadData(); }, [filterPos, filterAge, filterStatus]);

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
          <View style={styles.filterRow}>
            <Dropdown label="Position" options={['All', ...POSITION_ORDER]} selected={filterPos} onSelect={setFilterPos} />
            <Dropdown label="Age" options={["All", ...AGE_CATEGORIES]} selected={filterAge} onSelect={setFilterAge} />
            <Dropdown label="Status" options={STATUS_OPTIONS} selected={filterStatus} onSelect={setFilterStatus} />
          </View>
          <StatCard icon="people" label="Total" value={stats.totalPlayers} color={colors.yellow} delay={100} sublabel="registrations" />
          <StatCard icon="time-outline" label="Pending" value={stats.pending} color={colors.orange} delay={200} />
          <StatCard icon="checkmark-circle-outline" label="Accepted" value={stats.accepted} color={colors.green} delay={300} />
          <StatCard icon="gavel-outline" label="Officials" value={stats.referees} color={colors.blue} delay={400} sublabel="referees" />
        </View>
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Player distribution</Text>
          <Text style={styles.graphTitle}>By Position</Text>
          <View style={styles.graphCard}>
            {positionData.length > 0 ? positionData.map(item => (
              <View key={item.label} style={styles.graphRow}>
                <Text style={styles.graphLabel}>{item.label}</Text>
                <View style={styles.graphBarBackground}>
                  <View style={[styles.graphBarFill, { width: `${Math.max(8, Math.round((item.count / Math.max(...positionData.map(i => i.count))) * 100))}%` }]} />
                </View>
                <Text style={styles.graphValue}>{item.count}</Text>
              </View>
            )) : <Text style={styles.graphEmpty}>No player data available</Text>}
          </View>
          <Text style={styles.graphTitle}>By Age Category</Text>
          <View style={styles.graphCard}>
            {ageData.map(item => (
              <View key={item.label} style={styles.graphRow}>
                <Text style={styles.graphLabel}>{item.label}</Text>
                <View style={styles.graphBarBackground}>
                  <View style={[styles.graphBarFill, { width: `${Math.max(8, Math.round((item.count / Math.max(...ageData.map(i => i.count, 1))) * 100))}%` }]} />
                </View>
                <Text style={styles.graphValue}>{item.count}</Text>
              </View>
            ))}
          </View>
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
  sectionBlock: { marginBottom: spacing.xxl, gap: spacing.sm },
  graphTitle: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.sm, fontWeight: '700' },
  graphCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.md, marginBottom: spacing.lg },
  graphRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  graphLabel: { color: colors.text, width: 90, fontSize: 13, fontWeight: '600' },
  graphBarBackground: { flex: 1, height: 10, borderRadius: 6, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  graphBarFill: { height: 10, borderRadius: 6, backgroundColor: colors.yellow },
  graphValue: { color: colors.textSecondary, width: 30, textAlign: 'right', fontSize: 12 },
  graphEmpty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-end' },
  dropdownBtn: {
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  dropdownValueWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownValue: { color: colors.text, fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: spacing.sm },
  modalOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.xs },
  modalOptionActive: { backgroundColor: colors.yellowDim },
  modalOptionText: { color: colors.textSecondary, fontSize: 14 },
  modalOptionTextActive: { color: colors.text, fontWeight: '800' },
});
