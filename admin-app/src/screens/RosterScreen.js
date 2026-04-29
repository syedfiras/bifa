import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const POSITIONS = ['All', 'Goalkeeper', 'CB', 'LB', 'RB', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'CF', 'ST'];
const API_URL = 'https://bifa-1.onrender.com/api';

export default function RosterScreen({ navigation }) {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPos, setFilterPos] = useState('All');

    const loadPlayers = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            let queryUrl = `${API_URL}/players?status=accepted`;
            if (filterPos !== 'All') queryUrl += `&position=${filterPos}`;

            const res = await axios.get(queryUrl, { headers: { Authorization: `Bearer ${token}` } });
            setPlayers(res.data.data);
        } catch (e) {
            console.log(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        const u = navigation.addListener('focus', () => loadPlayers());
        return u;
    }, [navigation, filterPos]);

    useEffect(() => {
        loadPlayers();
    }, [filterPos]);

    const renderItem = ({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('PlayerDetail', { id: item._id })}>
            <LinearGradient colors={['#2c2c2c', '#1a1a1a']} style={styles.card}>
                <View style={styles.cardContent}>
                    {item.profilePhoto ? (
                        <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Ionicons name="person" size={24} color="#f4ea26" />
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.fullName}</Text>
                        <Text style={styles.details}>{item.positions.join(', ')} • {item.ageCategory || 'U20'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <View style={styles.dot} />
                            <Text style={styles.activeText}>Active Member</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.posScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, alignItems: 'center' }}>
                    {POSITIONS.map(pos => (
                        <TouchableOpacity
                            key={pos}
                            style={[styles.chip, filterPos === pos && styles.chipActive]}
                            onPress={() => setFilterPos(pos)}
                        >
                            <Text style={[styles.chipText, filterPos === pos && styles.chipTextActive]}>{pos}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#f4ea26" style={{ marginTop: 30 }} />
            ) : (
                <FlatList
                    data={players}
                    keyExtractor={item => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search" size={40} color="#666" />
                            <Text style={styles.emptyText}>No accepted players match.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    posScrollContainer: { height: 75, borderBottomWidth: 1, borderBottomColor: '#222', justifyContent: 'center', backgroundColor: '#111' },
    chip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#1a1a1a', marginHorizontal: 6, borderWidth: 1, borderColor: '#333' },
    chipActive: { backgroundColor: '#f4ea26', borderColor: '#f4ea26', elevation: 5 },
    chipText: { color: '#a1a1aa', fontWeight: 'bold', fontSize: 15 },
    chipTextActive: { color: '#0c0c0c', fontWeight: '900' },
    list: { paddingHorizontal: 15, paddingTop: 15, paddingBottom: 25 },
    card: { borderRadius: 16, marginBottom: 12, elevation: 4, borderWidth: 1, borderColor: '#333' },
    cardContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#f4ea26', marginRight: 15 },
    avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderColor: '#555' },
    info: { flex: 1 },
    name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    details: { color: '#a1a1aa', fontSize: 13, marginTop: 2, fontWeight: '600' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginRight: 6 },
    activeText: { color: '#4CAF50', fontSize: 12, fontWeight: 'bold' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#666', fontSize: 16, marginTop: 15, fontWeight: '600' }
});
