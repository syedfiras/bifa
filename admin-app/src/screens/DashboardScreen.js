import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const API_URL = 'https://bifa-1.onrender.com/api';

export default function DashboardScreen({ navigation }) {
    const [stats, setStats] = useState({ totalPlayers: 0, pending: 0, accepted: 0, declined: 0, referees: 0 });

    const loadData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const resPlayers = await axios.get(`${API_URL}/players`, config);
            const resReferees = await axios.get(`${API_URL}/referees`, config);

            const players = resPlayers.data.data;
            const referees = resReferees.data.data;

            setStats({
                totalPlayers: players.length,
                pending: players.filter(p => p.status === 'pending').length,
                accepted: players.filter(p => p.status === 'accepted').length,
                declined: players.filter(p => p.status === 'declined').length,
                referees: referees.length
            });
        } catch (e) {
            console.log('Error loading stats', e);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => loadData());
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.greeting}>Welcome Back,</Text>
                    <Text style={styles.heading}>Admin Dashboard</Text>
                </View>

                <View style={styles.statsGrid}>
                    <LinearGradient colors={['#2c2c2c', '#1a1a1a']} style={[styles.statCard, { width: '100%' }]}>
                        <FontAwesome5 name="users" size={28} color="#f4ea26" style={styles.icon} />
                        <View>
                            <Text style={styles.statLabel}>Total Registrations</Text>
                            <Text style={styles.statValue}>{stats.totalPlayers}</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient colors={['#2a2a00', '#1a1a1a']} style={styles.statCardHalf}>
                        <Ionicons name="time-outline" size={28} color="#f39c12" style={styles.icon} />
                        <Text style={styles.statLabel}>Pending</Text>
                        <Text style={[styles.statValue, { color: '#f39c12' }]}>{stats.pending}</Text>
                    </LinearGradient>

                    <LinearGradient colors={['#002a00', '#1a1a1a']} style={styles.statCardHalf}>
                        <Ionicons name="checkmark-circle-outline" size={28} color="#4CAF50" style={styles.icon} />
                        <Text style={styles.statLabel}>Accepted</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.accepted}</Text>
                    </LinearGradient>
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <TouchableOpacity onPress={() => navigation.navigate('Roster')} activeOpacity={0.8}>
                    <LinearGradient colors={['#f4ea26', '#d6ca00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionCard}>
                        <View style={styles.iconCircle}>
                            <FontAwesome5 name="clipboard-list" size={20} color="#0c0c0c" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Team Roster</Text>
                            <Text style={styles.actionSub}>View accepted players</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#0c0c0c" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Manage')} activeOpacity={0.8}>
                    <LinearGradient colors={['#2c2c2c', '#1a1a1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionCard}>
                        <View style={[styles.iconCircle, { backgroundColor: '#f39c12' }]}>
                            <Ionicons name="mail-unread-outline" size={22} color="#0c0c0c" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: '#fff' }]}>Applications</Text>
                            <Text style={styles.actionSub}>Manage pending requests</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Referees')} activeOpacity={0.8}>
                    <LinearGradient colors={['#2c2c2c', '#1a1a1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionCard}>
                        <View style={[styles.iconCircle, { backgroundColor: '#2196F3' }]}>
                            <FontAwesome5 name="gavel" size={18} color="#0c0c0c" />
                        </View>
                        <View style={styles.actionTextContainer}>
                            <Text style={[styles.actionTitle, { color: '#fff' }]}>Referees</Text>
                            <Text style={styles.actionSub}>Manage match officials</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    scroll: { padding: 20, paddingBottom: 40 },
    header: { marginTop: 20, marginBottom: 30 },
    greeting: { color: '#a1a1aa', fontSize: 16, letterSpacing: 1, textTransform: 'uppercase' },
    heading: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
    statCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 5 },
    statCardHalf: { width: '48%', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 5 },
    icon: { marginBottom: 10, marginRight: 15 },
    statLabel: { color: '#a1a1aa', fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
    statValue: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
    actionCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, marginBottom: 15, elevation: 4 },
    iconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#f4ea26', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    actionTextContainer: { flex: 1 },
    actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0c0c0c' },
    actionSub: { fontSize: 13, color: '#888', marginTop: 2 }
});
