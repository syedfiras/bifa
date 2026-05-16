import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const API_URL = 'https://bifa-1.onrender.com/api';

export default function RefereesScreen({ route, navigation }) {
    const [referees, setReferees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [selectedRefereeId, setSelectedRefereeId] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' });
    const flatListRef = useRef(null);

    const loadReferees = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/referees`, { headers: { Authorization: `Bearer ${token}` } });
            setReferees(res.data.data);
            if (route?.params?.selectedRefereeId) {
                setTimeout(() => scrollToReferee(route.params.selectedRefereeId, res.data.data), 100);
            }
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadReferees();
    }, []);

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
                licenseNumber: '',
                experienceYears: ''
            });
        }

        if (selectedRefereeIdParam) {
            setSelectedRefereeId(selectedRefereeIdParam);
        }

        navigation.setParams({ selectedRefereeId: undefined, openAddForm: undefined, prefillReferee: undefined });
    }, [selectedRefereeIdParam, openAddFormParam, prefillRefereeParam]);

    const scrollToReferee = (id, listData = referees) => {
        if (!id || !flatListRef.current || listData.length === 0) return;
        const index = listData.findIndex((item) => item._id === id);
        if (index >= 0) {
            flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.35 });
        }
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
            setFormData({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' });
            loadReferees();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to save');
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setFormData({ fullName: item.fullName, email: item.email, phone: item.phone, licenseNumber: item.licenseNumber, experienceYears: item.experienceYears.toString() });
        setEditingId(item._id);
        setShowAdd(true);
    };

    const handleDelete = async (id) => {
        Alert.alert('Verify', 'Delete this referee?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', onPress: async () => {
                    try {
                        setLoading(true);
                        const token = await AsyncStorage.getItem('token');
                        await axios.delete(`${API_URL}/referees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                        loadReferees();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete');
                        setLoading(false);
                    }
                }, style: 'destructive'
            }
        ]);
    };

    const renderHeader = () => (
        <View>
            <View style={styles.headerRow}>
                <Text style={styles.heading}>Match Officials</Text>
                <TouchableOpacity onPress={() => { setShowAdd(!showAdd); setEditingId(null); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' }); }}>
                    <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
                        <Ionicons name={showAdd ? 'close' : 'add'} size={18} color="#000" />
                        <Text style={styles.addBtnText}>{showAdd ? 'CANCEL' : 'ADD NEW'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {showAdd && (
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>{editingId ? 'Edit Official Specs' : 'Register New Official'}</Text>
                    <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#666" value={formData.fullName} onChangeText={t => setFormData({ ...formData, fullName: t })} />
                    <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder="Phone" placeholderTextColor="#666" value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />
                    <TextInput style={styles.input} placeholder="RIN Number" placeholderTextColor="#666" value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
                    <TextInput style={styles.input} placeholder="Experience Years" placeholderTextColor="#666" keyboardType="numeric" value={formData.experienceYears} onChangeText={t => setFormData({ ...formData, experienceYears: t })} />

                    <TouchableOpacity onPress={handleSave} style={styles.submitBtn} activeOpacity={0.85}>
                        <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
                            <Text style={styles.submitBtnText}>{editingId ? 'UPDATE RECORD' : 'SAVE RECORD'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setShowAdd(false); setEditingId(null); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' }); }} style={styles.doneBtn} activeOpacity={0.85}>
                        <LinearGradient colors={['#2e2e2e', '#151515']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.doneGradient}>
                            <Text style={styles.doneBtnText}>DONE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderItem = ({ item }) => {
        const isSelected = selectedRefereeId && item._id === selectedRefereeId;
        return (
            <LinearGradient colors={isSelected ? ['#292929', '#1a1a1a'] : ['#1a1a1a', '#111']} style={[styles.card, isSelected && styles.selectedCard]}>
                <View style={styles.cardContent}>
                <View style={[styles.avatar, { backgroundColor: '#2196F3' }]}>
                    <FontAwesome5 name="gavel" size={20} color="#0c0c0c" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.details}>RIN No. {item.licenseNumber} • {item.experienceYears} yrs</Text>
                </View>
                <View style={[styles.badge, item.status === 'active' ? styles.bgSuccess : styles.bgWarning]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.actionsBar}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                    <Ionicons name="create-outline" size={18} color="#f4ea26" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#f4ea26', fontWeight: 'bold' }}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={18} color="#F44336" style={{ marginRight: 5 }} />
                    <Text style={{ color: '#F44336', fontWeight: 'bold' }}>DELETE</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={referees}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={<View style={styles.empty}><FontAwesome5 name="gavel" size={30} color="#666" /><Text style={styles.emptyText}>No match officials registered.</Text></View>}
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
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    heading: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    addBtn: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, alignItems: 'center' },
    addBtnText: { color: '#000', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
    formCard: { backgroundColor: '#111', marginHorizontal: 20, marginTop: 20, padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
    formTitle: { color: '#fff', fontSize: 18, marginBottom: 16, fontWeight: '900' },
    input: { backgroundColor: '#1f1f1f', color: '#fff', padding: 14, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: '#333' },
    submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    submitGradient: { alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
    submitBtnText: { color: '#0c0c0c', fontWeight: 'bold', letterSpacing: 1 },
    doneBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 10 },
    doneGradient: { alignItems: 'center', paddingVertical: 14, borderRadius: 14 },
    doneBtnText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
    card: { marginHorizontal: 20, borderRadius: 20, marginBottom: 18, borderWidth: 1, borderColor: '#222', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.16, shadowOffset: { width: 0, height: 8 }, shadowRadius: 12, elevation: 6 },
    selectedCard: { borderColor: '#f4ea26', borderWidth: 1.8 },
    cardContent: { padding: 18, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 15, borderWidth: 1, borderColor: '#333' },
    info: { flex: 1 },
    name: { color: '#fff', fontSize: 17, fontWeight: '800' },
    details: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
    badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    bgWarning: { backgroundColor: '#f39c12' },
    bgSuccess: { backgroundColor: '#4CAF50' },
    actionsBar: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#222', paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#111' },
    editBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 16, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: '#222' },
    delBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, backgroundColor: '#2a1212' },
    listContainer: { paddingTop: 14, paddingHorizontal: 20, paddingBottom: 28 },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#888', marginTop: 16, fontWeight: '700', fontSize: 15 }
});
