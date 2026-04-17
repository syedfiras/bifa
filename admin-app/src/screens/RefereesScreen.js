import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:5000/api' : 'http://192.168.1.100:5000/api';

export default function RefereesScreen() {
    const [referees, setReferees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' });

    const loadReferees = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/referees`, { headers: { Authorization: `Bearer ${token}` } });
            setReferees(res.data.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadReferees();
    }, []);

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

    const renderItem = ({ item }) => (
        <LinearGradient colors={['#1a1a1a', '#111']} style={styles.card}>
            <View style={styles.cardContent}>
                <View style={[styles.avatar, { backgroundColor: '#2196F3' }]}>
                    <FontAwesome5 name="gavel" size={20} color="#0c0c0c" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.fullName}</Text>
                    <Text style={styles.details}>Lic No. {item.licenseNumber} • {item.experienceYears} yrs</Text>
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

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.headerRow}>
                <Text style={styles.heading}>Match Officials</Text>
                <TouchableOpacity onPress={() => { setShowAdd(!showAdd); setEditingId(null); setFormData({ fullName: '', email: '', phone: '', licenseNumber: '', experienceYears: '' }); }}>
                    <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtn}>
                        <Ionicons name={showAdd ? "close" : "add"} size={18} color="#000" />
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
                    <TextInput style={styles.input} placeholder="License Number" placeholderTextColor="#666" value={formData.licenseNumber} onChangeText={t => setFormData({ ...formData, licenseNumber: t })} />
                    <TextInput style={styles.input} placeholder="Experience Years" placeholderTextColor="#666" keyboardType="numeric" value={formData.experienceYears} onChangeText={t => setFormData({ ...formData, experienceYears: t })} />

                    <TouchableOpacity onPress={handleSave}>
                        <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                            <Text style={styles.submitBtnText}>{editingId ? 'UPDATE RECORD' : 'SAVE RECORD'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={referees}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                    ListEmptyComponent={<View style={styles.empty}><FontAwesome5 name="gavel" size={30} color="#666" /><Text style={styles.emptyText}>No match officials registered.</Text></View>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
    heading: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    addBtn: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
    addBtnText: { color: '#000', fontWeight: 'bold', marginLeft: 4, fontSize: 12 },
    formCard: { backgroundColor: '#1a1a1a', margin: 15, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
    formTitle: { color: '#fff', fontSize: 16, marginBottom: 15, fontWeight: 'bold' },
    input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
    submitBtn: { padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 5 },
    submitBtnText: { color: '#0c0c0c', fontWeight: 'bold', letterSpacing: 1 },
    card: { marginHorizontal: 15, borderRadius: 16, marginBottom: 15, elevation: 4, borderWidth: 1, borderColor: '#333' },
    cardContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    info: { flex: 1 },
    name: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    details: { color: '#a1a1aa', fontSize: 13, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    bgWarning: { backgroundColor: '#f39c12' },
    bgSuccess: { backgroundColor: '#4CAF50' },
    actionsBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2c2c2c', paddingVertical: 10, paddingHorizontal: 15 },
    editBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
    delBtn: { flexDirection: 'row', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#666', marginTop: 15, fontWeight: 'bold' }
});
