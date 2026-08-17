import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Dropdown from '../components/Dropdown';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const AGE_CATEGORIES = ['All', 'U13', 'U15', 'U17', 'U19', 'U20', 'SENIOR'];

const ManageCard = ({ item, onPress }) => (
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
        <View style={styles.badgeWrap}>
          <StatusBadge status={item.status} variant="icon" />
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default function ManagePlayersScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAgeCategory, setFilterAgeCategory] = useState('All');

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
        <ScreenHeader
          title="Applications"
          subtitle={`${players.length} pending request${players.length === 1 ? '' : 's'}`}
          action={
            <Dropdown label="Category" options={AGE_CATEGORIES} selected={filterAgeCategory} onSelect={setFilterAgeCategory} />
          }
        />
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
            <ManageCard item={item} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon="file-tray-outline" title="No pending applications" subtitle="All clear for this category" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRowTop: { paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  cardContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  info: { flex: 1 },
  name: { ...typography.body },
  details: { color: colors.textSecondary, marginTop: 2, fontSize: 12, fontWeight: '600' },
  badgeWrap: { marginLeft: spacing.sm },
});
