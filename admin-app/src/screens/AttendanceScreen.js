import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import GradientButton from '../components/GradientButton';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const AttendanceRow = ({ item, onChange }) => {
  const isPresent = item.attendance === 'present';

  return (
    <LinearGradient colors={gradients.card} style={[styles.row, isPresent && styles.rowPresent]}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={20} color={colors.yellow} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
        <Text style={styles.details}>
          {(item.positions || []).join(', ')} <Text style={{ color: colors.yellow }}>•</Text> {item.ageCategory || 'U20'}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.statusChip, isPresent && styles.statusChipPresentActive]}
        activeOpacity={0.8}
        onPress={() => onChange(item._id)}
      >
        <Ionicons
          name={isPresent ? 'checkmark-circle' : 'add-circle-outline'}
          size={17}
          color={isPresent ? colors.textDark : colors.green}
        />
        <Text style={[styles.statusChipText, isPresent && styles.statusChipTextActive]}>
          {isPresent ? 'Present' : 'Mark Present'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default function AttendanceScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedDate, setSavedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dateKey = toLocalDateString(selectedDate);

  const loadAttendance = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/attendance?date=${dateKey}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayers(res.data.data || []);
      setSavedDate(dateKey);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadAttendance());
    return unsubscribe;
  }, [navigation, dateKey]);

  useEffect(() => { loadAttendance(); }, [dateKey]);

  const changeStatus = (id) => {
    setPlayers(prev => prev.map(p => {
      if (p._id !== id) return p;
      return { ...p, attendance: p.attendance === 'present' ? null : 'present' };
    }));
  };

  const shiftDay = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const saveAttendance = async () => {
    const records = players.map(p => ({
      playerId: p._id,
      status: p.attendance === 'present' ? 'present' : 'absent'
    }));
    if (records.length === 0) {
      Alert.alert('No changes', 'No accepted players to mark.');
      return;
    }
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/attendance`, { date: dateKey, records }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedDate(dateKey);
      Alert.alert('Saved', `Attendance saved for ${formatDisplayDate(selectedDate)}`);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visiblePlayers = normalizedSearch
    ? players.filter(p => p.attendance === 'present' || [p.fullName, p.phone, p.email, p.ageCategory, ...(p.positions || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))
    : players.filter(p => p.attendance === 'present');

  const presentCount = players.filter(p => p.attendance === 'present').length;
  const absentCount = players.length - presentCount;
  const isSaved = savedDate === dateKey;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.dateCard}>
          <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDay(-1)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>Practice Date</Text>
            <Text style={styles.dateValue}>{formatDisplayDate(selectedDate)}</Text>
            <TouchableOpacity
              style={[styles.todayBtn, toLocalDateString(new Date()) === dateKey && styles.todayBtnActive]}
              onPress={() => setSelectedDate(new Date())}
              activeOpacity={0.7}
            >
              <Text style={[styles.todayBtnText, toLocalDateString(new Date()) === dateKey && styles.todayBtnTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dateNavBtn} onPress={() => shiftDay(1)} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search players to mark present..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryTile, { borderColor: colors.green }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={[styles.summaryValue, { color: colors.green }]}>{presentCount}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={[styles.summaryTile, { borderColor: colors.red }]}>
            <Ionicons name="close-circle" size={18} color={colors.red} />
            <Text style={[styles.summaryValue, { color: colors.red }]}>{absentCount}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={[styles.summaryTile, { borderColor: colors.border }]}>
            <Ionicons name="people" size={18} color={colors.yellow} />
            <Text style={styles.summaryValue}>{players.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Player Attendance</Text>
            <Text style={styles.subHeading}>
              {isSaved ? 'Attendance saved for this date' : `${presentCount} player${presentCount === 1 ? '' : 's'} present`}
            </Text>
          </View>
          <GradientButton label="SAVE" icon="checkmark-done" onPress={saveAttendance} loading={saving} small />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.yellow} />
          </View>
        ) : (
          <View style={styles.list}>
            {players.length === 0 ? (
              <EmptyState icon="calendar-outline" title="No accepted players" subtitle="Approve players from the Manage tab first" />
            ) : visiblePlayers.length === 0 ? (
              <EmptyState
                icon={normalizedSearch ? 'search-outline' : 'checkmark-done-outline'}
                title={normalizedSearch ? 'No players found' : 'No players marked present'}
                subtitle={normalizedSearch ? 'Try a different search' : 'Search a player above and tap Mark Present'}
              />
            ) : visiblePlayers.map(item => (
              <AttendanceRow key={item._id} item={item} onChange={changeStatus} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.lg, ...shadows.md,
  },
  dateNavBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgSurface,
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    height: 46, borderRadius: radius.md, backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 0, marginLeft: spacing.sm },
  clearBtn: { padding: spacing.xs },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { ...typography.label, color: colors.textMuted, letterSpacing: 0.5 },
  dateValue: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: spacing.xs },
  todayBtn: {
    marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border,
  },
  todayBtnActive: { backgroundColor: colors.yellowDim, borderColor: colors.yellow },
  todayBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  todayBtnTextActive: { color: colors.yellow },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  summaryTile: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1,
  },
  summaryValue: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  summaryLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  heading: { ...typography.h2 },
  subHeading: { ...typography.small, marginTop: 2, fontWeight: '600' },
  loadingWrap: { paddingVertical: 80, alignItems: 'center' },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  rowPresent: { borderColor: colors.green },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.yellow, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radius.full,
    backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border,
  },
  statusChipPresentActive: { backgroundColor: colors.greenDim, borderColor: colors.green },
  statusChipText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  statusChipTextActive: { color: colors.text },
});
