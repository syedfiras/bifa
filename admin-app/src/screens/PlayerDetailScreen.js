import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Image, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PlayerIdCard from '../components/PlayerIdCard';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const InfoRow = ({ icon, label, value, valueColor }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={17} color={colors.yellow} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  </View>
);

export default function PlayerDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;

  const loadPlayer = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/players/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlayer(res.data.data);
      Animated.parallel([
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    } catch (e) { Alert.alert('Error', 'Failed to load details'); }
    setLoading(false);
  };

  useEffect(() => { loadPlayer(); }, [id]);

  const handleAccept = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const routeUrl = `${API_URL}/players/${id}/accept`;
      await axios.put(routeUrl, {}, { headers: { Authorization: `Bearer ${token}` } });
      setLoading(false);
      Alert.alert('Success', 'Player has been approved.');
      navigation.goBack();
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', e.response?.data?.message || 'Something went wrong');
    }
  };

  const handleMatchOfficial = () => {
    if (!player) return;
    const params = player.linkedReferee
      ? { selectedRefereeId: player.linkedReferee.id }
      : { openAddForm: true, prefillReferee: { fullName: player.fullName, email: player.email, phone: player.phone } };
    const targetNav = navigation.getParent?.() || navigation;
    targetNav.navigate('Referees', params);
  };

  const handleDLicense = () => {
    if (!player) return;
    const params = player.linkedReferee
      ? { selectedDlicenseId: player.linkedReferee.id }
      : { openAddForm: true, prefillReferee: { fullName: player.fullName, email: player.email, phone: player.phone } };
    const parentNav = navigation.getParent?.() || navigation;
    parentNav.navigate('D-License', params);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  if (!player) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: colors.textSecondary }}>Player not found</Text>
    </View>
  );

  const statusColor = player.status === 'accepted' ? colors.green : colors.orange;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      <Animated.View style={[styles.profileSection, { opacity: headerAnim }]}>
        <View style={styles.profileGlow} />
        {player.profilePhoto ? (
          <Image source={{ uri: player.profilePhoto }} style={styles.heroAvatar} />
        ) : (
          <View style={[styles.heroAvatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={44} color={colors.yellow} />
          </View>
        )}
        <Text style={styles.heroName}>{player.fullName || 'Unknown Player'}</Text>
        <View style={styles.heroTags}>
          <View style={styles.posBadge}>
            <Text style={styles.posBadgeText}>
              {(player.positions || []).join(' • ')}
            </Text>
          </View>
          <View style={[styles.posBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.posBadgeText, { color: statusColor }]}>
              {player.status || 'Unknown'}
            </Text>
          </View>
          <Text style={styles.ageTag}>{player.ageCategory || 'U20'}</Text>
        </View>
      </Animated.View>

      <View style={styles.infoCard}>
        <InfoRow icon="mail-outline" label="Email" value={player.email} />
        <InfoRow icon="call-outline" label="Phone" value={player.phone} />
        <InfoRow icon="calendar-outline" label="Date of Birth" value={player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : 'N/A'} />
        <InfoRow icon="calendar-number-outline" label="Registration" value={player.registrationDate ? new Date(player.registrationDate).toLocaleDateString() : 'N/A'} />
        <InfoRow icon="trending-up-outline" label="Joining Year" value={String(player.joiningYear || (player.registrationDate ? new Date(player.registrationDate).getFullYear() : 'N/A'))} />
        <InfoRow
          icon="shield-checkmark-outline"
          label="Account Status"
          value={(player.status || 'Unknown').toUpperCase()}
          valueColor={statusColor}
        />
      </View>

      {player.accessPass && (
        <LinearGradient colors={['rgba(244,234,38,0.12)', 'rgba(181,173,16,0.05)']} style={styles.passCard}>
          <View style={styles.passIconWrap}>
            <Ionicons name="ticket" size={22} color={colors.yellow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.passLabel}>Club Access Pass</Text>
            <Text style={styles.passValue}>{player.accessPass}</Text>
          </View>
        </LinearGradient>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handleMatchOfficial} activeOpacity={0.75} style={{ flex: 1 }}>
          <LinearGradient colors={gradients.card} style={styles.linkBtn}>
            <Ionicons name="gavel" size={18} color={colors.yellow} />
            <Text style={styles.linkBtnText}>Match Official</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDLicense} activeOpacity={0.75} style={{ flex: 1 }}>
          <LinearGradient colors={gradients.card} style={styles.linkBtn}>
            <Ionicons name="newspaper-outline" size={18} color={colors.yellow} />
            <Text style={styles.linkBtnText}>D-License</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {player.linkedReferee && (
        <View style={styles.linkedCard}>
          <View style={styles.linkedIconWrap}>
            <Ionicons name="people" size={18} color={colors.yellow} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.linkedTitle}>Also registered as Match Official</Text>
            <Text style={styles.linkedName}>{player.linkedReferee.fullName}</Text>
            <Text style={styles.linkedSub}>License: {player.linkedReferee.licenseNumber} • {player.linkedReferee.experienceYears} yrs experience</Text>
          </View>
        </View>
      )}

      <PlayerIdCard player={player} />

      {player.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <LinearGradient colors={gradients.greenBtn} style={styles.actionBtn}>
              <Ionicons name="checkmark-circle" size={20} color={colors.text} style={{ marginRight: spacing.sm }} />
              <Text style={styles.actionBtnText}>Approve</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: 'center', paddingVertical: spacing.xxl, borderBottomWidth: 1, borderBottomColor: colors.border, position: 'relative', overflow: 'hidden' },
  profileGlow: { position: 'absolute', top: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: colors.yellowDim },
  heroAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.yellow, marginBottom: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center' },
  heroName: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  heroTags: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  posBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.yellowDim,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.yellow,
  },
  posBadgeText: { color: colors.yellow, fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: spacing.xs },
  ageTag: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', backgroundColor: colors.bgCard, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  infoCard: {
    backgroundColor: colors.bgLight, margin: spacing.xl, padding: spacing.xl,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadows.md,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
  infoIconWrap: { width: 32, alignItems: 'center', marginRight: spacing.md },
  infoLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 2 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 1 },
  passCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl,
    padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.yellow,
    ...shadows.md,
  },
  passIconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  passLabel: { ...typography.label, color: colors.yellow, marginBottom: 2 },
  passValue: { color: colors.yellow, fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  actionButtons: { flexDirection: 'row', marginHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.md },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  linkBtnText: { color: colors.yellow, fontSize: 13, fontWeight: '700' },
  linkedCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.xl,
    padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    marginTop: spacing.md, backgroundColor: colors.bgLight,
  },
  linkedIconWrap: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  linkedTitle: { ...typography.label, color: colors.yellow, marginBottom: 4 },
  linkedName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  linkedSub: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  actionContainer: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.md },
  actionBtn: { flexDirection: 'row', padding: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', ...shadows.md },
  actionBtnText: { color: colors.text, fontWeight: 'bold', fontSize: 15 },
});
