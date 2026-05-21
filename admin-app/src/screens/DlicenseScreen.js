import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const DlicenseCard = ({ item, onDelete, isSelected }) => {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 40, friction: 9, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View style={[styles.card, isSelected && styles.selectedCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.avatarWrapper}>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={22} color={colors.yellow} />
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.name}>{item.fullName}</Text>
            {item.email ? <Text style={styles.detail}>{item.email}</Text> : null}
            <Text style={styles.detail}>{item.phone}</Text>
          </View>
          <View style={styles.licenseBadge}>
            <Text style={styles.licenseLabel}>D-License</Text>
            <Text style={styles.licenseValue}>{item.licenseNumber}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? colors.green : colors.orange }]} />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item._id)} activeOpacity={0.75}>
            <Ionicons name="trash-outline" size={15} color={colors.text} />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

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
    Animated.timing(formSlide, { toValue: showAdd ? 1 : 0, duration: 300, useNativeDriver: true }).start();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>D-License Holders</Text>
        <Text style={styles.headerSub}>Officers with a valid digital license</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)} activeOpacity={0.8}>
          <LinearGradient colors={gradients.yellowBtn} style={styles.addBtn}>
            <Ionicons name={showAdd ? 'close' : 'add'} size={16} color={colors.textDark} style={{ marginRight: spacing.xs }} />
            <Text style={styles.addBtnText}>{showAdd ? 'CANCEL' : 'ADD D-LICENSE'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <Animated.View style={[styles.formCard, { opacity: formSlide, transform: [{ translateY: formSlide.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.formHandle} />
          <Text style={styles.formTitle}>Register D-License Holder</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.textMuted} value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={colors.textMuted} value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />
          </View>
          <View style={styles.inputWrap}>
            <Ionicons name="card-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="D-License Number" placeholderTextColor={colors.textMuted} value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.submitBtn} activeOpacity={0.85}>
            <LinearGradient colors={gradients.yellowBtn} style={styles.submitGrad}>
              <Text style={styles.submitText}>SAVE D-LICENSE</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowAdd(false); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' }); }} style={styles.doneBtn} activeOpacity={0.85}>
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
          ListHeaderComponentStyle={{ paddingBottom: showAdd ? spacing.xl : 0 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="id-card-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No digital licenses</Text>
              <Text style={styles.emptySub}>Tap ADD D-LICENSE to register one</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.h1, fontSize: 22 },
  headerSub: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  addBtnText: { color: colors.textDark, fontWeight: 'bold', fontSize: 12 },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.bgForm, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.md },
  selectedCard: { borderColor: colors.yellow, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrapper: { marginRight: spacing.sm },
  avatarImage: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colors.yellow },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  detail: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  licenseBadge: { alignItems: 'flex-end', marginLeft: spacing.sm },
  licenseLabel: { color: colors.yellow, fontSize: 10, fontWeight: '700', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  licenseValue: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md, backgroundColor: colors.redDim, borderRadius: radius.md, gap: spacing.xs },
  deleteText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  formCard: { marginTop: spacing.lg, padding: spacing.xl, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgForm, ...shadows.lg },
  formHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgInput, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.md, fontSize: 14, fontWeight: '600' },
  submitBtn: { borderRadius: radius.md, overflow: 'hidden' },
  submitGrad: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md },
  submitText: { color: colors.textDark, fontWeight: 'bold', letterSpacing: 0.8 },
  doneBtn: { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.sm },
  doneGrad: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.md },
  doneText: { color: colors.textSecondary, fontWeight: 'bold', letterSpacing: 0.8 },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptySub: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' },
});
