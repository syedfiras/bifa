import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const API_URL = Platform.OS === 'web' ? 'http://127.0.0.1:5000/api' : 'http://192.168.1.100:5000/api';

export default function ManagePlayersScreen({ navigation }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('pending');

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/players?status=${filterStatus}`, { headers: { Authorization: `Bearer ${token}` } });
            setPlayers(res.data.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const u = navigation.addListener('focus', () => loadPlayers());
        return u;
    }, [navigation, filterStatus]);

    useEffect(() => {
        loadPlayers();
    }, [filterStatus]);

    const renderItem = ({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })}>
            <LinearGradient colors={['#1a1a1a', '#111']} style={styles.card}>
                <View style={styles.cardContent}>
                    {item.profilePhoto ? (
                        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person-outline" size={20} color="#a1a1aa" />
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.fullName}</Text>
                        <Text style={styles.details}>{item.positions.join(', ')}</Text>
                    </View>
                    <View style={[styles.badge, item.status === 'pending' ? styles.bgWarning : styles.bgDanger]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.filterContainer}>
                <TouchableOpacity style={[styles.filterBtn, filterStatus === 'pending' && styles.filterActive]} onPress={() => setFilterStatus('pending')}>
                    <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>Pending Approvals</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filterStatus === 'declined' && styles.filterActive]} onPress={() => setFilterStatus('declined')}>
                    <Text style={[styles.filterText, filterStatus === 'declined' && styles.filterTextActive]}>Declined</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<View style={styles.empty}><Ionicons name="file-tray" size={40} color="#666" /><Text style={styles.emptyText}>No {filterStatus} applications.</Text></View>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    filterContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#111' },
    filterBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', marginHorizontal: 10 },
    filterActive: { backgroundColor: '#f4ea26', borderColor: '#f4ea26', shadowColor: '#f4ea26', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
    filterText: { color: '#a1a1aa', fontWeight: 'bold' },
    filterTextActive: { color: '#0c0c0c', fontWeight: '900' },
    list: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 25 },
    card: { borderRadius: 16, marginBottom: 12, elevation: 3, borderWidth: 1, borderColor: '#333' },
    cardContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    avatarPlaceholder: { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
    info: { flex: 1 },
    name: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
    details: { color: '#a1a1aa', marginTop: 4, fontSize: 13 },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    bgWarning: { backgroundColor: '#f39c12' },
    bgDanger: { backgroundColor: '#F44336' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#666', fontSize: 16, marginTop: 15, fontWeight: '600' }
});
