import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = Platform.OS === 'web' ? 'http://localhost:5000/api' : 'http://192.168.1.100:5000/api';

export default function PlayersScreen({ navigation }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPos, setFilterPos] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            // Construct query manually
            let queryUrl = `${API_URL}/players?`;
            if (filterPos) queryUrl += `position=${filterPos}&`;
            if (filterStatus) queryUrl += `status=${filterStatus}`;

            const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
            setPlayers(res.data.data);
        } catch (e) {
            console.log('Error loading players:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const u = navigation.addListener('focus', () => loadPlayers());
        return u;
    }, [navigation, filterPos, filterStatus]);

    useEffect(() => {
        loadPlayers();
    }, [filterPos, filterStatus]);

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })}>
            <View>
                <Text style={styles.name}>{item.fullName}</Text>
                <Text style={styles.details}>{item.positions.join(', ')}</Text>
            </View>
            <View style={[styles.badge, item.status === 'accepted' ? styles.bgSuccess : item.status === 'declined' ? styles.bgDanger : styles.bgWarning]}>
                <Text style={styles.badgeText}>{item.status}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                {/* Simple filters for demo */}
                <TouchableOpacity style={[styles.filterBtn, filterStatus === '' && styles.filterActive]} onPress={() => setFilterStatus('')}>
                    <Text style={styles.filterText}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filterStatus === 'pending' && styles.filterActive]} onPress={() => setFilterStatus('pending')}>
                    <Text style={styles.filterText}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.filterBtn, filterStatus === 'accepted' && styles.filterActive]} onPress={() => setFilterStatus('accepted')}>
                    <Text style={styles.filterText}>Accepted</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" />
            ) : (
                <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>No players found</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c', padding: 15 },
    filterContainer: { flexDirection: 'row', marginBottom: 15, justifyContent: 'space-around' },
    filterBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
    filterActive: { backgroundColor: '#f4ea26', borderColor: '#f4ea26' },
    filterText: { color: '#fff', fontWeight: 'bold' },
    card: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    details: { color: '#a1a1aa' },
    badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    bgWarning: { backgroundColor: '#f39c12' },
    bgSuccess: { backgroundColor: '#4CAF50' },
    bgDanger: { backgroundColor: '#F44336' }
});
