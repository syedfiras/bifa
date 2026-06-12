import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Animated, ScrollView, Modal, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const AGE_CATEGORIES = ['All', 'U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownLabel}>{label}</Text>
        <View style={styles.dropdownValueWrap}>
          <Text style={styles.dropdownValue}>{selected || 'All'}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
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

const StatusBadge = ({ status }) => {
  const config = {
    pending: { color: colors.orange, bg: colors.orangeDim, icon: 'time-outline' },
  };
  const c = config[status] || config.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={12} color={c.color} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: c.color }]}>{status}</Text>
    </View>
  );
};

const ManageCard = ({ item, onPress, onDecline }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View>
        <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
          <LinearGradient colors={gradients.card} style={styles.card}>
            <View style={styles.cardContent}>
              {item.profilePhoto ? (
                <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                <Text style={styles.details}>
                  {(item.positions || []).join(', ')} <Text style={{ color: colors.yellow }}>•</Text> {item.ageCategory || 'U20'}
                </Text>
              </View>
              <StatusBadge status={item.status} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDecline(item._id, item.fullName)} activeOpacity={0.75} style={styles.declineCardBtn}>
          <Ionicons name="close-circle-outline" size={16} color={colors.red} style={{ marginRight: spacing.sm }} />
          <Text style={styles.declineCardBtnText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function ManagePlayersScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgeCategory, setFilterAgeCategory] = useState('All');

  const handleDeclineQuick = (playerId, playerName) => {
    const deletePlayer = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        await axios.put(`${API_URL}/players/${playerId}/decline`, {}, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('Success', 'Player deleted.');
        loadPlayers();
      } catch (e) {
        Alert.alert('Error', e.response?.data?.message || 'Failed to delete');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${playerName}? This cannot be undone.`)) {
        deletePlayer();
      }
      return;
    }

    Alert.alert('Delete Player', `Delete ${playerName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deletePlayer }
    ]);
  };

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      let queryUrl = `${API_URL}/players?status=pending`;
      if (filterAgeCategory !== 'All') queryUrl += `&ageCategory=${encodeURIComponent(filterAgeCategory)}`;
      const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
      setPlayers(res.data.data);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => {
    const u = navigation.addListener('focus', () => loadPlayers());
    return u;
  }, [navigation, filterAgeCategory]);

  useEffect(() => { loadPlayers(); }, [filterAgeCategory]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      <View style={styles.filterRowTop}>
        <Dropdown label="Application age" options={AGE_CATEGORIES} selected={filterAgeCategory} onSelect={setFilterAgeCategory} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ManageCard item={item} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })} onDecline={handleDeclineQuick} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="file-tray-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No pending applications</Text>
              <Text style={styles.emptySub}>All clear for this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRowTop: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  toggleContainer: {
    flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard,
    gap: spacing.md,
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xl,
    borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  toggleActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  toggleText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  toggleTextActive: { color: colors.textDark },
  ageRow: { maxHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCard },
  ageContent: { paddingHorizontal: spacing.lg, alignItems: 'center', paddingVertical: spacing.sm },
  dropdownBtn: {
    minWidth: 130,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
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
  ageChip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1,
    borderColor: colors.border, marginRight: spacing.sm,
  },
  ageChipActive: { backgroundColor: colors.yellow, borderColor: colors.yellow },
  ageChipText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  ageChipTextActive: { color: colors.textDark },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  cardContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  details: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  declineCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.lg, marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  declineCardBtnText: { color: colors.red, fontWeight: '700', fontSize: 13 },
});
