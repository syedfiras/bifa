import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, Animated, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const AGE_CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const SORT_OPTIONS = ['Name (A-Z)', 'Most Matches', 'Most Goals', 'Most Assists'];
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValueWrap}>
          <Text style={styles.dropdownValue} numberOfLines={1} ellipsizeMode="tail">{selected || 'All'}</Text>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
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
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
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

const StatTile = ({ icon, value, label }) => (
  <View style={styles.statTile}>
    <Ionicons name={icon} size={15} color={colors.yellow} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatsCard = ({ item, onPress, onEdit }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        <LinearGradient colors={gradients.card} style={styles.card}>
          <View style={styles.cardHeader}>
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
            <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={styles.cardEditBtn}>
              <Ionicons name="pencil" size={14} color={colors.textDark} />
            </TouchableOpacity>
          </View>
          <View style={styles.statsRow}>
            <StatTile icon="calendar" value={item.matchesPlayed ?? 0} label="Matches" />
            <View style={styles.statDivider} />
            <StatTile icon="football" value={item.goals ?? 0} label="Goals" />
            <View style={styles.statDivider} />
            <StatTile icon="hand-left" value={item.assists ?? 0} label="Assists" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function StatsScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAge, setFilterAge] = useState('All');
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [statDraft, setStatDraft] = useState({ matchesPlayed: '0', goals: '0', assists: '0' });
  const [savingStats, setSavingStats] = useState(false);

  const loadPlayers = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let queryUrl = `${API_URL}/players?status=accepted&inStats=true`;
      if (filterAge !== 'All') queryUrl += `&ageCategory=${encodeURIComponent(filterAge)}`;
      const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
      setPlayers(res.data.data || []);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const u = navigation.addListener('focus', () => loadPlayers());
    return u;
  }, [navigation, filterAge]);

  useEffect(() => { loadPlayers(); }, [filterAge]);

  const openPicker = async () => {
    setPickerOpen(true);
    setPickerSearch('');
    await loadCandidates();
  };

  const loadCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/players?status=accepted`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data.data || []);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Failed to load roster');
    }
    setCandidatesLoading(false);
  };

  const addToStats = async (id) => {
    try {
      setAddingId(id);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/players/${id}/in-stats`, { active: true }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(prev => prev.map(p => p._id === id ? { ...p, inStats: true } : p));
      loadPlayers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add player');
    } finally {
      setAddingId(null);
    }
  };

  const openEditStats = (player) => {
    setStatDraft({
      matchesPlayed: String(player.matchesPlayed ?? 0),
      goals: String(player.goals ?? 0),
      assists: String(player.assists ?? 0),
    });
    setEditingPlayer(player);
  };

  const saveStats = async () => {
    const parse = (v) => {
      const n = Number(v);
      return Number.isInteger(n) && n >= 0 ? n : NaN;
    };
    const stats = {
      matchesPlayed: parse(statDraft.matchesPlayed),
      goals: parse(statDraft.goals),
      assists: parse(statDraft.assists),
    };
    if ([stats.matchesPlayed, stats.goals, stats.assists].some(Number.isNaN)) {
      Alert.alert('Invalid input', 'Stats must be non-negative whole numbers.');
      return;
    }
    try {
      setSavingStats(true);
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/players/${editingPlayer._id}/stats`, stats, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingPlayer(null);
      loadPlayers();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save stats');
    } finally {
      setSavingStats(false);
    }
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPlayers = normalizedSearch
    ? players.filter(p => [p.fullName, p.phone, p.email, p.ageCategory, ...(p.positions || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))
    : players;

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'Most Matches') return (b.matchesPlayed ?? 0) - (a.matchesPlayed ?? 0);
    if (sortBy === 'Most Goals') return (b.goals ?? 0) - (a.goals ?? 0);
    if (sortBy === 'Most Assists') return (b.assists ?? 0) - (a.assists ?? 0);
    return (a.fullName || '').localeCompare(b.fullName || '', undefined, { sensitivity: 'base' });
  });

  const normalizedPickerSearch = pickerSearch.trim().toLowerCase();
  const filteredCandidates = normalizedPickerSearch
    ? candidates.filter(p => [p.fullName, p.phone, p.email, p.ageCategory, ...(p.positions || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedPickerSearch))
    : candidates;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
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

      <View style={styles.dropdownRow}>
        <Dropdown label="Category" options={['All', ...AGE_CATEGORIES]} selected={filterAge} onSelect={setFilterAge} />
        <Dropdown label="Sort" options={SORT_OPTIONS} selected={sortBy} onSelect={setSortBy} />
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.heading}>Player Stats</Text>
        <TouchableOpacity onPress={openPicker} activeOpacity={0.8}>
          <LinearGradient colors={gradients.yellowBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
            <Ionicons name="add" size={16} color={colors.textDark} />
            <Text style={styles.addBtnText}>ADD</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      ) : (
        <FlatList
          data={sortedPlayers}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <StatsCard item={item} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })} onEdit={() => openEditStats(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadPlayers(true); }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="bar-chart-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No players in stats</Text>
              <Text style={styles.emptySub}>Tap ADD to select players from the roster</Text>
            </View>
          }
        />
      )}

      <Modal visible={pickerOpen} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add from Roster</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.pickerClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerSearchContainer}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.pickerSearchInput}
                placeholder="Search roster..."
                placeholderTextColor={colors.textMuted}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {candidatesLoading ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="large" color={colors.yellow} />
              </View>
            ) : filteredCandidates.length === 0 ? (
              <View style={styles.pickerEmpty}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.textMuted} />
                <Text style={styles.pickerEmptyTitle}>All roster players already in stats</Text>
                <Text style={styles.pickerEmptySub}>No remaining players to add</Text>
              </View>
            ) : (
              <FlatList
                data={filteredCandidates}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.pickerList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerRow}
                    activeOpacity={0.7}
                    onPress={() => addToStats(item._id)}
                    disabled={addingId === item._id}
                  >
                    {item.profilePhoto ? (
                      <Image source={{ uri: item.profilePhoto }} style={styles.pickerAvatar} />
                    ) : (
                      <View style={[styles.pickerAvatar, styles.pickerAvatarPlaceholder]}>
                        <Ionicons name="person" size={16} color={colors.textSecondary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerName} numberOfLines={1}>{item.fullName}</Text>
                      <Text style={styles.pickerDetails}>
                        {(item.positions || []).join(', ')} <Text style={{ color: colors.yellow }}>•</Text> {item.ageCategory || 'U20'}
                      </Text>
                    </View>
                    {addingId === item._id ? (
                      <ActivityIndicator size="small" color={colors.yellow} />
                    ) : (
                      <View style={styles.pickerAddBadge}>
                        <Ionicons name="add" size={14} color={colors.textDark} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={editingPlayer !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModalCard}>
            <Text style={styles.modalTitle}>Edit Season Stats</Text>
            <Text style={styles.modalSubtitle}>{editingPlayer?.fullName}</Text>
            {[
              { key: 'matchesPlayed', label: 'Matches Played', icon: 'calendar' },
              { key: 'goals', label: 'Goals', icon: 'football' },
              { key: 'assists', label: 'Assists', icon: 'hand-left' },
            ].map(field => (
              <View key={field.key} style={styles.modalFieldRow}>
                <Ionicons name={field.icon} size={16} color={colors.yellow} />
                <Text style={styles.modalFieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={statDraft[field.key]}
                  onChangeText={text => setStatDraft(prev => ({ ...prev, [field.key]: text.replace(/[^0-9]/g, '') }))}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setEditingPlayer(null)}
                disabled={savingStats}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={saveStats}
                disabled={savingStats}
                activeOpacity={0.8}
              >
                {savingStats ? (
                  <ActivityIndicator size="small" color={colors.textDark} />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg,
    marginTop: spacing.md, marginBottom: spacing.sm, paddingHorizontal: spacing.md,
    height: 46, borderRadius: radius.md, backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 0, marginLeft: spacing.sm },
  clearBtn: { padding: spacing.xs },
  dropdownRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  dropdownBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  dropdownValueWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: spacing.sm },
  modalOption: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, marginBottom: spacing.xs },
  modalOptionActive: { backgroundColor: colors.yellowDim },
  modalOptionText: { color: colors.textSecondary, fontSize: 14 },
  modalOptionTextActive: { color: colors.text, fontWeight: '800' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  heading: { ...typography.h1, fontSize: 20 },
  addBtn: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center', gap: spacing.xs },
  addBtnText: { color: colors.textDark, fontWeight: 'bold', fontSize: 12 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  cardHeader: { padding: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.yellow, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  statsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgCard },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  statLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' },
  pickerOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  pickerCard: {
    backgroundColor: colors.bgLight, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, maxHeight: '75%', ...shadows.lg,
  },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  pickerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center' },
  pickerSearchContainer: {
    flexDirection: 'row', alignItems: 'center', margin: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, height: 42, borderRadius: radius.md, backgroundColor: colors.bgInput,
    borderWidth: 1, borderColor: colors.border,
  },
  pickerSearchInput: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 0, marginLeft: spacing.sm },
  pickerLoading: { paddingVertical: 60, alignItems: 'center' },
  pickerEmpty: { alignItems: 'center', paddingVertical: 50 },
  pickerEmptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: spacing.md },
  pickerEmptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  pickerList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pickerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.yellow, marginRight: spacing.md },
  pickerAvatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderColor: colors.border },
  pickerName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pickerDetails: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  pickerAddBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.yellow, justifyContent: 'center', alignItems: 'center' },
  cardEditBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.yellow,
    justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm,
  },
  editModalCard: { backgroundColor: colors.bgLight, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.lg },
  modalSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2, marginBottom: spacing.lg },
  modalFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  modalFieldLabel: { flex: 1, color: colors.textSecondary, fontSize: 14, fontWeight: '700', marginLeft: spacing.md },
  modalInput: {
    width: 90, textAlign: 'center', color: colors.text, fontSize: 16, fontWeight: '800',
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: 10,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  modalBtnCancelText: { color: colors.textSecondary, fontWeight: '800' },
  modalBtnSave: { backgroundColor: colors.yellow },
  modalBtnSaveText: { color: colors.textDark, fontWeight: '900' },
});
