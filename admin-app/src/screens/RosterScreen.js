import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, TextInput, Animated, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows, gradients } from '../theme';

const POSITIONS = ['All', 'Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const AGE_CATEGORIES = ['All', 'U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValueWrap}>
          <Text style={styles.dropdownValue}>{selected || 'All'}</Text>
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

const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const PlayerCard = ({ item, onPress, index }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        <LinearGradient colors={gradients.card} style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.serialWrap}>
              <Text style={styles.serialText}>{(index || 0) + 1}</Text>
            </View>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={22} color={colors.yellow} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
              <Text style={styles.details}>
                {(item.positions || []).join(', ')} <Text style={{ color: colors.yellow }}>•</Text> {item.ageCategory || 'U20'}
              </Text>
              <View style={styles.activeRow}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active Member</Text>
              </View>
            </View>
            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function RosterScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPos, setFilterPos] = useState('All');
  const [filterAge, setFilterAge] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPlayers = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let queryUrl = `${API_URL}/players?status=accepted`;
      if (filterPos !== 'All') queryUrl += `&position=${encodeURIComponent(filterPos)}`;
      if (filterAge !== 'All') queryUrl += `&ageCategory=${encodeURIComponent(filterAge)}`;
      const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
      const playersData = (res.data.data || []).slice();
      playersData.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', undefined, { sensitivity: 'base' }));
      setPlayers(playersData);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    const u = navigation.addListener('focus', () => loadPlayers());
    return u;
  }, [navigation, filterPos, filterAge]);

  useEffect(() => { loadPlayers(); }, [filterPos, filterAge]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPlayers = normalizedSearch
    ? players.filter(p => [p.fullName, p.phone, p.email, p.accessPass, p.ageCategory, ...(p.positions || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))
    : players;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search roster..."
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
        <Dropdown label="Position" options={POSITIONS} selected={filterPos} onSelect={setFilterPos} />
        <Dropdown label="Age" options={AGE_CATEGORIES} selected={filterAge} onSelect={setFilterAge} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      ) : (
          <FlatList
            data={filteredPlayers}
            keyExtractor={item => item._id}
            renderItem={({ item, index }) => <PlayerCard item={item} index={index} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })} />}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadPlayers(true); }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="search" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No players found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters or search query</Text>
            </View>
          }
        />
      )}
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
  filterRow: { maxHeight: 52, backgroundColor: colors.bgLight, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing.lg, alignItems: 'center', paddingVertical: spacing.sm },
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  dropdownBtn: {
    flex: 1,
    minWidth: 130,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.full,
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
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.bgCard,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow, ...shadows.yellow },
  chipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.textDark },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  cardContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: colors.yellow, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  serialWrap: { width: 34, height: 34, borderRadius: 18, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: colors.border },
  serialText: { color: colors.text, fontWeight: '800' },
  activeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.green, marginRight: spacing.xs },
  activeText: { color: colors.green, fontSize: 11, fontWeight: '700' },
  chevronWrap: { marginLeft: spacing.sm },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' },
});
