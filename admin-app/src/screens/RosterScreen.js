import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, Animated, Modal, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildHtml, getAssetBase64, SIGNATURE_ASSET } from '../components/PlayerIdCard';
import { colors, spacing, radius, shadows, gradients } from '../theme';

const POSITIONS = ['All', 'Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const AGE_CATEGORIES = ['All', 'U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];
const SORT_OPTIONS = ['Name (A-Z)', 'Reg. Date'];
const CARD_TYPE_OPTIONS = ['Normal', 'Gold'];
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

const PlayerCard = ({ item, onPress, onSelect, selected, selectMode }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={selectMode ? () => onSelect(item._id) : onPress}
      >
        <LinearGradient colors={gradients.card} style={[styles.card, selected && styles.cardSelected]}>
          <View style={styles.cardContent}>
            {selectMode && (
              <TouchableOpacity
                style={styles.checkboxWrap}
                onPress={() => onSelect(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                  {selected && <Ionicons name="checkmark" size={14} color={colors.textDark} />}
                </View>
              </TouchableOpacity>
            )}
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
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [cardType, setCardType] = useState('Normal');

  const toggleSelectMode = () => {
    if (selectMode) setSelectedIds([]);
    setSelectMode(prev => !prev);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPlayers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlayers.map(p => p._id));
    }
  };

  const handleDownloadAll = async () => {
    const toDownload = filteredPlayers.filter(p => selectedIds.includes(p._id));
    if (toDownload.length === 0) {
      Alert.alert('No selection', 'Select at least one player to download.');
      return;
    }
    try {
      setDownloadingAll(true);
      const signatureBase64 = await getAssetBase64(SIGNATURE_ASSET, 'signature');
      const cardsHtml = toDownload.map((p, i) => `
        <div style="page-break-after: ${i < toDownload.length - 1 ? 'always' : 'avoid'};">
          ${buildHtml(p, signatureBase64, cardType.toLowerCase())}
        </div>
      `).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
        * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        body { background:#000; font-family:Arial,sans-serif; }
      </style></head><body>${cardsHtml}</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false, width: 440, height: 700 });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = 'BIFA Roster Cards.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'BIFA Roster Cards', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Success', 'PDF saved');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate cards. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  const loadPlayers = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let queryUrl = `${API_URL}/players?status=accepted`;
      if (filterPos !== 'All') queryUrl += `&position=${encodeURIComponent(filterPos)}`;
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
  }, [navigation, filterPos, filterAge]);

  useEffect(() => { loadPlayers(); }, [filterPos, filterAge]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPlayers = (normalizedSearch
    ? players.filter(p => [p.fullName, p.phone, p.email, p.accessPass, p.ageCategory, ...(p.positions || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(normalizedSearch))
    : players
  ).sort((a, b) => {
    if (sortBy === 'Reg. Date') {
      return new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0);
    }
    return (a.fullName || '').localeCompare(b.fullName || '', undefined, { sensitivity: 'base' });
  });

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
        <Dropdown label="Sort" options={SORT_OPTIONS} selected={sortBy} onSelect={setSortBy} />
        <Dropdown label="Category" options={AGE_CATEGORIES} selected={filterAge} onSelect={setFilterAge} />
      </View>

      <TouchableOpacity style={styles.selectToggleBtn} onPress={toggleSelectMode} activeOpacity={0.8}>
        <Text style={styles.selectToggleText}>{selectMode ? 'Cancel' : 'Select'}</Text>
      </TouchableOpacity>

      {selectMode && (
        <>
          <View style={styles.selectionRow}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll} activeOpacity={0.7}>
              <Ionicons
                name={selectedIds.length === filteredPlayers.length && filteredPlayers.length > 0 ? 'checkbox' : 'square-outline'}
                size={16}
                color={colors.yellow}
              />
              <Text style={styles.selectAllText}>
                {selectedIds.length === filteredPlayers.length && filteredPlayers.length > 0 ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>
              {selectedIds.length} / {filteredPlayers.length} selected
            </Text>
          </View>

          <View style={styles.cardTypeRow}>
            <Text style={styles.cardTypeLabel}>Card</Text>
            {CARD_TYPE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.cardTypeChip, cardType === option && styles.cardTypeChipActive]}
                onPress={() => setCardType(option)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cardTypeChipText, cardType === option && styles.cardTypeChipTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.downloadBtn, selectedIds.length === 0 && styles.downloadBtnDisabled]}
            onPress={handleDownloadAll}
            disabled={downloadingAll || selectedIds.length === 0}
            activeOpacity={0.8}
          >
            {downloadingAll ? (
              <ActivityIndicator size="small" color={colors.textDark} />
            ) : (
              <Ionicons name="download-outline" size={18} color={selectedIds.length === 0 ? colors.textMuted : colors.textDark} />
            )}
            <Text style={[styles.downloadBtnText, selectedIds.length === 0 && { color: colors.textMuted }]}>
              {downloadingAll ? 'Generating PDF...' : `Download (${selectedIds.length})`}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      ) : (
          <FlatList
            data={filteredPlayers}
            keyExtractor={item => item._id}
            renderItem={({ item }) => <PlayerCard item={item} selected={selectedIds.includes(item._id)} selectMode={selectMode} onSelect={toggleSelect} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })} />}
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
  dropdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.sm },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.sm, gap: spacing.sm },
  cardTypeLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginRight: spacing.xs },
  cardTypeChip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: radius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  cardTypeChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  cardTypeChipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  cardTypeChipTextActive: { color: colors.textDark },
  selectToggleBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingVertical: 10, paddingHorizontal: 20, borderRadius: radius.md, backgroundColor: colors.yellow, gap: spacing.xs },
  selectToggleText: { color: colors.textDark, fontSize: 14, fontWeight: '800' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.yellow, gap: spacing.sm },
  downloadBtnDisabled: { backgroundColor: colors.bgCard },
  downloadBtnText: { color: colors.textDark, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 },
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  cardContent: { padding: spacing.md, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.yellow, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  chevronWrap: { marginLeft: spacing.sm },
  selectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  selectAllText: { color: colors.yellow, fontSize: 12, fontWeight: '700' },
  selectedCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  checkboxWrap: { marginRight: spacing.md },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  cardSelected: { borderColor: colors.yellow, ...shadows.yellow },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' },
});
