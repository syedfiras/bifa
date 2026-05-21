import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const RefereeCard = ({ item, onEdit, onDelete, isSelected }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient
        colors={isSelected ? ['#292929', colors.bgLight] : gradients.card}
        style={[styles.card, isSelected && styles.selectedCard]}
      >
        <View style={styles.cardContent}>
          <View style={styles.avatar}>
            <FontAwesome5 name="gavel" size={18} color={colors.textDark} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.details}>RIN No. {item.licenseNumber}</Text>
          </View>
          <View style={[styles.badge, item.status === 'active' ? styles.bgSuccess : styles.bgWarning]}>
            <View style={[styles.badgeDot, { backgroundColor: item.status === 'active' ? colors.green : colors.orange }]} />
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.actionsBar}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.editBtn} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={15} color={colors.yellow} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item._id)} style={styles.delBtn} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={15} color={colors.red} />
            <Text style={styles.delBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function RefereesScreen({ route, navigation }) {
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedRefereeId, setSelectedRefereeId] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', licenseNumber: '' });
  const flatListRef = useRef(null);
  const formSlide = useRef(new Animated.Value(0)).current;

  const loadReferees = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/referees`, { headers: { Authorization: `Bearer ${token}` } });
      setReferees(res.data.data);
      if (route?.params?.selectedRefereeId) {
        setTimeout(() => scrollToReferee(route.params.selectedRefereeId, res.data.data), 100);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  useEffect(() => { loadReferees(); }, []);

  const selectedRefereeIdParam = route?.params?.selectedRefereeId;
  const openAddFormParam = route?.params?.openAddForm;
  const prefillRefereeParam = route?.params?.prefillReferee;

  useEffect(() => {
    if (!selectedRefereeIdParam && !openAddFormParam && !prefillRefereeParam) return;
    if (openAddFormParam && prefillRefereeParam) {
      setShowAdd(true);
      setEditingId(null);
      setFormData({
        fullName: prefillRefereeParam.fullName || '',
        email: prefillRefereeParam.email || '',
        phone: prefillRefereeParam.phone || '',
        licenseNumber: ''
      });
    }
    if (selectedRefereeIdParam) setSelectedRefereeId(selectedRefereeIdParam);
    navigation.setParams({ selectedRefereeId: undefined, openAddForm: undefined, prefillReferee: undefined });
  }, [selectedRefereeIdParam, openAddFormParam, prefillRefereeParam]);

  useEffect(() => {
    Animated.timing(formSlide, { toValue: showAdd ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [showAdd]);

  const scrollToReferee = (id, listData = referees) => {
    if (!id || !flatListRef.current || listData.length === 0) return;
    const index = listData.findIndex((item) => item._id === id);
    if (index >= 0) flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API_URL}/referees/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('Success', 'Referee updated');
      } else {
        await axios.post(`${API_URL}/referees`, formData, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert('Success', 'Referee added');
      }
      setShowAdd(false);
      setEditingId(null);
      setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' });
      loadReferees();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to save');
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({ fullName: item.fullName, email: item.email, phone: item.phone, licenseNumber: item.licenseNumber });
    setEditingId(item._id);
    setShowAdd(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('Verify', 'Delete this referee?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem('token');
          await axios.delete(`${API_URL}/referees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadReferees();
        } catch (e) { Alert.alert('Error', 'Failed to delete'); setLoading(false); }
      }}
    ]);
  };

  const renderHeader = () => (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Match Officials</Text>
        <TouchableOpacity onPress={() => { setShowAdd(!showAdd); setEditingId(null); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' }); }} activeOpacity={0.8}>
          <LinearGradient colors={gradients.yellowBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
            <Ionicons name={showAdd ? 'close' : 'add'} size={16} color={colors.textDark} />
            <Text style={styles.addBtnText}>{showAdd ? 'CANCEL' : 'ADD'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <Animated.View style={[styles.formCard, { opacity: formSlide, transform: [{ translateY: formSlide.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.formHandle} />
          <Text style={styles.formTitle}>{editingId ? 'Edit Official' : 'Register New Official'}</Text>
          <View style={styles.formFields}>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textMuted} value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} autoCapitalize="none" />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.textMuted} value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="card-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="RIN Number" placeholderTextColor={colors.textMuted} value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
            </View>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.submitBtn} activeOpacity={0.85}>
            <LinearGradient colors={gradients.yellowBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGrad}>
              <Text style={styles.submitText}>{editingId ? 'UPDATE' : 'SAVE RECORD'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowAdd(false); setEditingId(null); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' }); }} style={styles.doneBtn} activeOpacity={0.85}>
            <LinearGradient colors={['#2e2e2e', colors.bg]} style={styles.doneGrad}>
              <Text style={styles.doneText}>DONE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.yellow} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={referees}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <RefereeCard
              item={item}
              isSelected={selectedRefereeId && item._id === selectedRefereeId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <FontAwesome5 name="gavel" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No match officials</Text>
              <Text style={styles.emptySub}>Tap ADD to register one</Text>
            </View>
          }
          onScrollToIndexFailed={({ index }) => {
            if (referees.length > 0) {
              const safeIndex = Math.min(Math.max(index, 0), referees.length - 1);
              flatListRef.current?.scrollToIndex({ index: safeIndex, animated: true, viewPosition: 0.35 });
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  heading: { ...typography.h1, fontSize: 20 },
  addBtn: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center', gap: spacing.xs },
  addBtnText: { color: colors.textDark, fontWeight: 'bold', fontSize: 12 },
  formCard: { marginHorizontal: spacing.xl, marginTop: spacing.lg, padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgForm, ...shadows.lg },
  formHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.lg },
  formFields: { gap: spacing.md },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.md, fontSize: 14, fontWeight: '600' },
  submitBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.md },
  submitGrad: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md },
  submitText: { color: colors.textDark, fontWeight: 'bold', letterSpacing: 1 },
  doneBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  doneGrad: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md },
  doneText: { color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 1 },
  listContainer: { paddingTop: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  selectedCard: { borderColor: colors.yellow, borderWidth: 1.5 },
  cardContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.blue, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, gap: spacing.xs },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bgSuccess: { backgroundColor: colors.greenDim },
  bgWarning: { backgroundColor: colors.orangeDim },
  actionsBar: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.bgCard, gap: spacing.sm },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.yellowDim },
  editBtnText: { color: colors.yellow, fontWeight: '700', fontSize: 12 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.redDim },
  delBtnText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
});
