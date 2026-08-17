import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import FormCard from '../components/FormCard';
import IconInput from '../components/IconInput';
import GradientButton from '../components/GradientButton';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const RefereeCard = ({ item, onEdit, onDelete, isSelected }) => (
  <View style={[styles.card, isSelected && styles.selectedCard]}>
    <View style={styles.cardContent}>
      <View style={styles.avatar}>
        <Ionicons name="whistle" size={18} color={colors.yellow} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
        <Text style={styles.details}>RIN No. {item.licenseNumber}</Text>
      </View>
      <StatusBadge status={item.status} />
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
  </View>
);

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
    Animated.timing(formSlide, { toValue: showAdd ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [showAdd]);

  const scrollToReferee = (id, listData = referees) => {
    if (!id || !flatListRef.current || listData.length === 0) return;
    const index = listData.findIndex((item) => item._id === id);
    if (index >= 0) flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' });
    setEditingId(null);
  };

  const toggleForm = () => {
    setShowAdd(prev => !prev);
    resetForm();
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
      resetForm();
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
      <ScreenHeader
        title="Match Officials"
        subtitle={`${referees.length} registered official${referees.length === 1 ? '' : 's'}`}
        action={
          <GradientButton
            label={showAdd ? 'CANCEL' : 'ADD'}
            icon={showAdd ? 'close' : 'add'}
            onPress={toggleForm}
            small
          />
        }
      />

      {showAdd && (
        <Animated.View
          style={{ opacity: formSlide, transform: [{ translateY: formSlide.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
        >
          <FormCard>
            <Text style={styles.formTitle}>{editingId ? 'Edit Official' : 'Register New Official'}</Text>
            <View style={styles.formFields}>
              <IconInput icon="person-outline" placeholder="Full Name" value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} />
              <IconInput icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} />
              <IconInput icon="call-outline" placeholder="Phone" value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />
              <IconInput icon="card-outline" placeholder="RIN Number" value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
            </View>
            <GradientButton label={editingId ? 'UPDATE' : 'SAVE RECORD'} icon="checkmark-done" onPress={handleSave} style={styles.submitBtn} />
            <GradientButton label="DONE" variant="dark" onPress={() => { setShowAdd(false); resetForm(); }} style={styles.doneBtn} />
          </FormCard>
        </Animated.View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.bg} style={StyleSheet.absoluteFillObject} />

      {loading ? (
        <View style={styles.loadingWrap}>
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
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState icon="whistle-outline" title="No match officials" subtitle="Tap ADD to register one" />
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingTop: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.md },
  selectedCard: { borderColor: colors.yellow, borderWidth: 1.5 },
  cardContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgForm },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  name: { ...typography.body },
  details: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '600' },
  actionsBar: {
    flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: colors.border,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, backgroundColor: colors.bgCard, gap: spacing.sm,
  },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.yellowDim },
  editBtnText: { color: colors.yellow, fontWeight: '700', fontSize: 12 },
  delBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, backgroundColor: colors.redDim },
  delBtnText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.lg },
  formFields: { gap: spacing.md },
  submitBtn: { marginTop: spacing.md },
  doneBtn: { marginTop: spacing.sm },
});
