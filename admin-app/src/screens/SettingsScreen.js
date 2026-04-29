import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://bifa-1.onrender.com/api';

export default function SettingsScreen({ setToken }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleChangePassword = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${API_URL}/auth/password`, { currentPassword, newPassword }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Password updated safely.');
            setCurrentPassword('');
            setNewPassword('');
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to change password');
        }
    };

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        if (setToken) {
            setToken(null);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#0c0c0c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.header}>
                <Text style={styles.heading}>Preferences</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Ionicons name="shield-checkmark" size={24} color="#f4ea26" style={{ marginRight: 10 }} />
                    <Text style={styles.subHeading}>Security Options</Text>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    placeholderTextColor="#666"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#666"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={handleChangePassword} activeOpacity={0.8}>
                    <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                        <Ionicons name="lock-closed" size={18} color="#0c0c0c" style={{ marginRight: 8 }} />
                        <Text style={styles.btnText}>UPDATE PASSWORD</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
                <LinearGradient colors={['#F44336', '#b71c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>SIGN OUT</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0c0c0c' },
    header: { padding: 20, paddingTop: 30 },
    heading: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
    card: { backgroundColor: '#1a1a1a', padding: 25, borderRadius: 16, marginHorizontal: 20, borderWidth: 1, borderColor: '#333', elevation: 5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    subHeading: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333' },
    btn: { flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
    btnText: { color: '#0c0c0c', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
    logoutBtn: { flexDirection: 'row', marginHorizontal: 20, padding: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 30, elevation: 5 },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});
