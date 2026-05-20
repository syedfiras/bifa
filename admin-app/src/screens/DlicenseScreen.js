import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function DlicenseScreen({ route, navigation }) {
    const [referees, setReferees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRefereeId, setSelectedRefereeId] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', licenseNumber: '' });
    const flatListRef = React.useRef(null);

    const selectedDlicenseId = route?.params?.selectedDlicenseId;
    const openAddFormParam = route?.params?.openAddForm;
    const prefillRefereeParam = route?.params?.prefillReferee;

    useEffect(() => {
        if (selectedDlicenseId) {
            setSelectedRefereeId(selectedDlicenseId);
        }

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

    const scrollToSelectedReferee = (id) => {
        if (!id || !referees.length || !flatListRef.current) return;
        const index = referees.findIndex((item) => item._id === id || item.id === id);
        if (index >= 0) {
            flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }
    };

    useEffect(() => {
        if (selectedRefereeId && referees.length) {
            scrollToSelectedReferee(selectedRefereeId);
        }
    }, [selectedRefereeId, referees]);

    const handleSave = async () => {
        if (!formData.fullName || !formData.licenseNumber) {
            Alert.alert('Validation', 'Name and license number are required.');
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            await axios.post(`${API_URL}/referees`, {
                ...formData,
                status: 'active'
            }, { headers: { Authorization: `Bearer ${token}` } });
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
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
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
                }
            }
        ]);
    };

    const renderHeader = () => (
        <View>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => setShowAdd(!showAdd)} style={styles.addBtn}>
                    <LinearGradient colors={['#f4ea26', '#b5ad10']} style={styles.addBtnGradient}>
                        <Ionicons name={showAdd ? 'close' : 'add'} size={18} color="#000" style={{ marginRight: 8 }} />
                        <Text style={styles.addBtnText}>{showAdd ? 'CANCEL' : 'ADD D-LICENSE'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {showAdd && (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Register D-License Holder</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#666"
                        value={formData.fullName}
                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                        value={formData.email}
                        onChangeText={(text) => setFormData({ ...formData, email: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone"
                        placeholderTextColor="#666"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="D-License Number"
                        placeholderTextColor="#666"
                        value={formData.licenseNumber}
                        onChangeText={(text) => setFormData({ ...formData, licenseNumber: text })}
                    />
                    <TouchableOpacity onPress={handleSave} style={styles.submitBtn} activeOpacity={0.85}>
                        <LinearGradient colors={['#f4ea26', '#b5ad10']} style={styles.submitGradient}>
                            <Text style={styles.submitText}>SAVE D-LICENSE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowAdd(false); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '' }); }} style={styles.doneBtn} activeOpacity={0.85}>
                        <LinearGradient colors={['#2e2e2e', '#151515']} style={styles.doneGradient}>
                            <Text style={styles.doneBtnText}>DONE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

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

    const renderItem = ({ item }) => (
        <View style={[styles.card, item._id === selectedRefereeId || item.id === selectedRefereeId ? styles.selectedCard : null]}>
            <View style={styles.cardRow}>
                <View style={styles.avatarWrapper}>
                    {item.profilePhoto ? (
                        <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={24} color="#f4ea26" />
                        </View>
                    )}
                </View>
                <View style={styles.cardLeft}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    {item.email ? <Text style={styles.details}>{item.email}</Text> : <Text style={styles.details}>No email provided</Text>}
                    <Text style={styles.details}>{item.phone}</Text>
                </View>
                <View style={styles.cardRight}>
                    <Text style={styles.licenseLabel}>D-License</Text>
                    <Text style={styles.licenseValue}>{item.licenseNumber}</Text>
                </View>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaText}>Status: {item.status}</Text>
            </View>
            <View style={styles.deleteRow}>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
                    <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteText}>Delete D-License</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.header}>
                <Text style={styles.title}>D-License Holders</Text>
                <Text style={styles.subtitle}>A list of all referees currently holding a digital license.</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={referees}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    ref={flatListRef}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={renderHeader}
                    ListHeaderComponentStyle={{ paddingBottom: showAdd ? 20 : 0 }}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={(
                        <View style={styles.empty}>
                            <Ionicons name="alert-circle" size={40} color="#666" />
                            <Text style={styles.emptyText}>No digital licenses found.</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
    title: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6 },
    subtitle: { color: '#a1a1aa', fontSize: 14, lineHeight: 20 },
    list: { paddingHorizontal: 15, paddingTop: 20, paddingBottom: 40 },
    card: { backgroundColor: '#111', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#222' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    cardLeft: { flex: 1, paddingRight: 10 },
    cardRight: { flex: 1, alignItems: 'flex-end' },
    name: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginBottom: 6 },
    details: { color: '#a1a1aa', fontSize: 13 },
    licenseLabel: { color: '#f4ea26', fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    licenseValue: { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'right' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
    metaText: { color: '#888', fontSize: 12, marginTop: 6 },
    headerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
    addBtn: { alignSelf: 'flex-end' },
    addBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    addBtnText: { color: '#000', fontWeight: 'bold', letterSpacing: 0.5 },
    formCard: { backgroundColor: '#111', marginHorizontal: 15, marginTop: 15, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#222' },
    formTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
    input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#333', marginBottom: 12 },
    submitBtn: { borderRadius: 14, overflow: 'hidden' },
    submitGradient: { alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
    submitText: { color: '#000', fontWeight: 'bold', letterSpacing: 0.8 },
    doneBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    doneGradient: { alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
    doneBtnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 0.8 },
    avatarWrapper: { marginRight: 12 },
    avatarImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#333' },
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
    deleteRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#b71c1c', borderRadius: 12 },
    deleteText: { color: '#fff', fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#666', marginTop: 12, fontSize: 15, textAlign: 'center' },
    selectedCard: { borderColor: '#f4ea26', borderWidth: 1.5, backgroundColor: '#1a1a1a' },
});
