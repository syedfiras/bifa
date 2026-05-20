// PlayerDetailScreen.jsx
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Alert, ScrollView, Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PlayerIdCard from '../components/PlayerIdCard';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function PlayerDetailScreen({ route, navigation }) {
    const { id } = route.params;
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadPlayer = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/players/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlayer(res.data.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load details');
        }
        setLoading(false);
    };

    useEffect(() => { loadPlayer(); }, [id]);

    const handleAction = async (action) => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const routeUrl = action === 'accept'
                ? `${API_URL}/players/${id}/accept`
                : `${API_URL}/players/${id}/decline`;
            await axios.put(routeUrl, {}, { headers: { Authorization: `Bearer ${token}` } });
            setLoading(false);
            Alert.alert('Success', `Player has been ${action}ed.`);
            navigation.goBack();
        } catch (e) {
            setLoading(false);
            Alert.alert('Error', e.response?.data?.message || 'Something went wrong');
        }
    };

    const handleMatchOfficial = () => {
        if (!player) return;

        const params = player.linkedReferee
            ? { selectedRefereeId: player.linkedReferee.id }
            : {
                openAddForm: true,
                prefillReferee: {
                    fullName: player.fullName,
                    email: player.email,
                    phone: player.phone,
                }
            };

        const targetNav = navigation.getParent?.() || navigation;
        targetNav.navigate('Referees', params);
    };

    const handleDLicense = () => {
        if (!player) return;

        const params = player.linkedReferee
            ? { selectedDlicenseId: player.linkedReferee.id }
            : {
                openAddForm: true,
                prefillReferee: {
                    fullName: player.fullName,
                    email: player.email,
                    phone: player.phone,
                }
            };

        const parentNav = navigation.getParent?.() || navigation;
        parentNav.navigate('D-License', params);
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />
                <ActivityIndicator size="large" color="#f4ea26" />
            </View>
        );
    }

    if (!player) return (
        <View style={styles.container}>
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Not found</Text>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.headerProfile}>
                {player.profilePhoto ? (
                    <Image source={{ uri: player.profilePhoto }} style={styles.heroAvatar} />
                ) : (
                    <View style={[styles.heroAvatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={50} color="#f4ea26" />
                    </View>
                )}
                <Text style={styles.heroName}>{player.fullName || 'Unknown Player'}</Text>
                <View style={styles.posBadge}>
                    <Text style={styles.posBadgeText}>
                        {(player.positions?.length ? player.positions.join(' • ') : 'No position')}
                        {' • '}
                        {player.ageCategory || 'U20'}
                    </Text>
                </View>
            </View>

            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Ionicons name="mail" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                        <Text style={styles.label}>Email Address</Text>
                        <Text style={styles.value}>{player.email}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                        <Text style={styles.label}>Phone Number</Text>
                        <Text style={styles.value}>{player.phone}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                                <Text style={styles.label}>Date of Birth</Text>
                        <Text style={styles.value}>{player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                        <Text style={styles.label}>Registration Date</Text>
                        <Text style={styles.value}>{player.registrationDate ? new Date(player.registrationDate).toLocaleDateString() : 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                        <Text style={styles.label}>Joining Year</Text>
                        <Text style={styles.value}>{player.joiningYear || (player.registrationDate ? new Date(player.registrationDate).getFullYear() : 'N/A')}</Text>
                    </View>
                </View>
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Ionicons name="information-circle" size={20} color="#f4ea26" style={styles.icon} />
                    <View>
                        <Text style={styles.label}>Account Status</Text>
                        <Text style={[
                            styles.value,
                            {
                                color: player.status === 'accepted' ? '#4CAF50'
                                    : player.status === 'declined' ? '#F44336'
                                    : '#f39c12',
                                textTransform: 'uppercase'
                            }
                        ]}>
                            {player.status || 'Unknown'}
                        </Text>
                    </View>
                </View>
            </View>

            {player.accessPass && (
                <LinearGradient colors={['#f4ea26', '#b5ad10']} style={styles.passCard}>
                    <Ionicons name="ticket" size={28} color="#0c0c0c" style={{ marginRight: 15 }} />
                    <View>
                        <Text style={styles.passLabel}>Club Access Pass</Text>
                        <Text style={styles.passValue}>{player.accessPass}</Text>
                    </View>
                </LinearGradient>
            )}

            <TouchableOpacity onPress={handleMatchOfficial} activeOpacity={0.8} style={styles.matchOfficialButtonWrapper}>
                <LinearGradient colors={['#1a1a1a', '#111']} style={styles.matchOfficialButton}>
                    <Ionicons name="gavel" size={20} color="#f4ea26" style={{ marginRight: 10 }} />
                    <Text style={styles.matchOfficialButtonText}>Match Official</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDLicense} activeOpacity={0.8} style={styles.matchOfficialButtonWrapper}>
                <LinearGradient colors={['#1a1a1a', '#111']} style={styles.matchOfficialButton}>
                    <Ionicons name="newspaper" size={20} color="#f4ea26" style={{ marginRight: 10 }} />
                    <Text style={styles.matchOfficialButtonText}>D-License</Text>
                </LinearGradient>
            </TouchableOpacity>

            {player.linkedReferee && (
                <View style={styles.linkedCard}>
                    <Text style={styles.linkedTitle}>Also registered as match official</Text>
                    <Text style={styles.linkedName}>{player.linkedReferee.fullName}</Text>
                    <Text style={styles.linkedSubtitle}>License: {player.linkedReferee.licenseNumber} • {player.linkedReferee.experienceYears} yrs experience</Text>
                </View>
            )}

            <PlayerIdCard player={player} />

           

            {player.status === 'pending' && (
                <View style={styles.actionContainer}>
                    <TouchableOpacity
                        style={styles.actionBtnBody}
                        onPress={() => handleAction('accept')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.actionGradient}>
                            <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionText}>Approve</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtnBody}
                        onPress={() => handleAction('decline')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient colors={['#F44336', '#C62828']} style={styles.actionGradient}>
                            <Ionicons name="close-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionText}>Decline</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    headerProfile: { alignItems: 'center', paddingVertical: 30, borderBottomWidth: 1, borderBottomColor: '#222' },
    heroAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#f4ea26', marginBottom: 15 },
    avatarPlaceholder: { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' },
    heroName: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
    posBadge: { backgroundColor: 'rgba(244, 234, 38, 0.15)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: '#f4ea26' },
    posBadgeText: { color: '#f4ea26', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
    infoCard: { backgroundColor: '#1a1a1a', margin: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' },
    infoRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2c2c2c', paddingVertical: 15 },
    icon: { marginRight: 15, width: 25, textAlign: 'center' },
    label: { color: '#a1a1aa', fontSize: 13, textTransform: 'uppercase', fontWeight: '600' },
    value: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
    passCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 20, borderRadius: 16, elevation: 4 },
    passLabel: { color: '#0c0c0c', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
    passValue: { color: '#0c0c0c', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
    linkedCard: { backgroundColor: '#111', marginHorizontal: 20, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginTop: 15 },
    linkedTitle: { color: '#f4ea26', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, fontSize: 12 },
    linkedName: { color: '#fff', fontSize: 16, fontWeight: '800' },
    linkedSubtitle: { color: '#a1a1aa', marginTop: 4, fontSize: 13 },
    matchOfficialButtonWrapper: { marginHorizontal: 20, marginTop: 15 },
    matchOfficialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#333' },
    matchOfficialButtonText: { color: '#f4ea26', fontSize: 15, fontWeight: 'bold' },
   
    actionContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
    actionBtnBody: { flex: 0.48 },
    actionGradient: { flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
