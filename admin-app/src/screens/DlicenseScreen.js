import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import FormCard from '../components/FormCard';
import IconInput from '../components/IconInput';
import GradientButton from '../components/GradientButton';
import StatusBadge from '../components/StatusBadge';
import ScreenHeader from '../components/ScreenHeader';
import { colors, spacing, radius, shadows, gradients, typography } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const DlicenseCard = ({ item, onDelete, isSelected }) => (
  <View style={[styles.card, isSelected && styles.selectedCard]}>
    <View style={styles.cardHeader}>
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={22} color={colors.yellow} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
        {item.email ? <Text style={styles.detail} numberOfLines={1}>{item.email}</Text> : null}
        <Text style={styles.detail}>{item.phone}</Text>
      </View>
      <View style={styles.licenseBadge}>
        <Text style={styles.licenseLabel}>D-License</Text>
        <Text style={styles.licenseValue} numberOfLines={1}>{item.licenseNumber}</Text>
      </View>
    </View>
    <View style={styles.cardFooter}>
      <StatusBadge status={item.status} />
      <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item._id)} activeOpacity={0.75}>
        <Ionicons name="trash-outline" size={15} color={colors.red} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function DlicenseScreen({ route, navigation }) {
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefereeId, setSelectedRefereeId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', licenseNumber: '' });
  const flatListRef = React.useRef(null);
  const formSlide = useRef(new Animated.Value(0)).current;

  const selectedDlicenseId = route?.params?.selectedDlicenseId;
  const openAddFormParam = route?.params?.openAddForm;
  const prefillRefereeParam = route?.params?.prefillReferee;

  useEffect(() => {
    if (selectedDlicenseId) setSelectedRefereeId(selectedDlicenseId);
    if (openAddFormParam) {
      setShowAdd(true);
      setFormData({
        fullName: prefillRefereeParam?.fullName || '',
        email: prefillRefereeParam?.email || '',
        phone: prefillRefereeParam?.phone || '',
        licenseNumber: ''
      });
    }
    if (selectedDlicenseId || openAddFormParam) {
      navigation.setParams({ selectedDlicenseId: undefined, openAddForm: undefined, prefillReferee: undefined });
    }
  }, [selectedDlicenseId, openAddFormParam, prefillRefereeParam, navigation]);

  useEffect(() => {
    Animated.timing(formSlide, { toValue: showAdd ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [showAdd]);

  const scrollToSelectedReferee = (id) => {
    if (!id || !referees.length || !flatListRef.current) return;
    const index = referees.findIndex((item) => item._id === id || item.id === id);
    if (index >= 0) flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  useEffect(() => {
    if (selectedRefereeId && referees.length) scrollToSelectedReferee(selectedRefereeId);
  }, [selectedRefereeId, referees]);

  const handleSave = async () => {
    if (!formData.fullName || !formData.licenseNumber) {
      Alert.alert('Validation', 'Name and license number are required.');
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${API_URL}/referees`, { ...formData, status: 'active' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'D-License record added.');
      setShowAdd(false);
      setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' });
      loadDlicenses();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.response?.data?.message || 'Unable to save D-License.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete D-License', 'Are you sure you want to delete this D-license record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem('token');
          await axios.delete(`${API_URL}/referees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          loadDlicenses();
        } catch (error) {
          console.log(error);
          Alert.alert('Error', 'Unable to delete D-license.');
          setLoading(false);
        }
      }}
    ]);
  };

  const loadDlicenses = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${API_URL}/referees`, { headers: { Authorization: `Bearer ${token}` } });
      setReferees((res.data.data || []).filter((item) => item.licenseNumber));
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Unable to load D-License list.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => loadDlicenses());
    return unsubscribe;
  }, [navigation]);

  const renderHeader = () => (
    <View>
      <ScreenHeader
        title="D-License Holders"
        subtitle="Officers with a valid digital license"
        action={
          <GradientButton
            label={showAdd ? 'CANCEL' : 'ADD D-LICENSE'}
            icon={showAdd ? 'close' : 'add'}
            onPress={() => setShowAdd(prev => !prev)}
            small
          />
        }
      />

      {showAdd && (
        <Animated.View
          style={{ opacity: formSlide, transform: [{ translateY: formSlide.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}
        >
          <FormCard>
            <Text style={styles.formTitle}>Register D-License Holder</Text>
            <View style={styles.formFields}>
              <IconInput icon="person-outline" placeholder="Full Name" value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} />
              <IconInput icon="mail-outline" placeholder="Email" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} />
              <IconInput icon="call-outline" placeholder="Phone" value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />
              <IconInput icon="card-outline" placeholder="D-License Number" value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
            </View>
            <GradientButton label="SAVE D-LICENSE" icon="checkmark-done" onPress={handleSave} style={styles.submitBtn} />
            <GradientButton label="DONE" variant="dark" onPress={() => { setShowAdd(false); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' }); }} style={styles.doneBtn} />
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
          data={referees}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <DlicenseCard
              item={item}
              isSelected={item._id === selectedRefereeId || item.id === selectedRefereeId}
              onDelete={handleDelete}
            />
          )}
          ref={flatListRef}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderHeader}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState icon="id-card-outline" title="No digital licenses" subtitle="Tap ADD D-LICENSE to register one" />
          }
          onScrollToIndexFailed={({ index }) => {
            if (referees.length > 0) {
              const safeIndex = Math.min(Math.max(index, 0), referees.length - 1);
              flatListRef.current?.scrollToIndex({ index: safeIndex, animated: true, viewPosition: 0.5 });
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
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.bgForm, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.md },
  selectedCard: { borderColor: colors.yellow, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.yellow },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.body },
  detail: { color: colors.textSecondary, fontSize: 12, marginTop: 1, fontWeight: '600' },
  licenseBadge: { alignItems: 'flex-end', marginLeft: spacing.sm },
  licenseLabel: { color: colors.yellow, fontSize: 10, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  licenseValue: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  deleteButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, backgroundColor: colors.redDim, borderRadius: radius.md, gap: spacing.xs },
  deleteText: { color: colors.red, fontWeight: '700', fontSize: 12 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.lg },
  formFields: { gap: spacing.md },
  submitBtn: { marginTop: spacing.md },
  doneBtn: { marginTop: spacing.sm },
});
