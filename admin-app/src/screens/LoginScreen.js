import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, KeyboardAvoidingView, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const API_URL = 'https://bifa-1.onrender.com/api';

export default function LoginScreen({ setToken }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const normalizedUsername = username.trim().toLowerCase();
        const normalizedPassword = password;

        if (!normalizedUsername || !normalizedPassword) {
            Alert.alert('Login Failed', 'Please enter username and password');
            return;
        }

        try {
            const res = await axios.post(
                `${API_URL}/auth/login`,
                { username: normalizedUsername, password: normalizedPassword },
                { timeout: 15000 }
            );
            if (res.data.success) {
                setToken(res.data.token);
                try {
                    await AsyncStorage.setItem('token', res.data.token);
                } catch (_storageError) {
                    // Keep user logged in for current session even if persistence fails.
                }
            }
        } catch (err) {
            const message =
                err.response?.data?.message ||
                (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Error connecting to server');
            Alert.alert('Login Failed', message);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
            <LinearGradient colors={['#1a1a1a', '#050505']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={require('../../assets/images/splash-icon.png')} style={styles.logoImage} />
                    <Text style={styles.subtitle}>MANAGEMENT SYSTEM</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.loginTitle}>Admin Access</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="System Username"
                        placeholderTextColor="#666"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Security Password"
                        placeholderTextColor="#666"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity onPress={handleLogin} activeOpacity={0.8}>
                        <LinearGradient colors={['#f4ea26', '#b5ad10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
                            <Text style={styles.buttonText}>AUTHENTICATE</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
    logoContainer: { alignItems: 'center', marginBottom: 50 },
    logoImage: { width: 150, height: 150, marginBottom: 15, borderRadius: 30, borderWidth: 2, borderColor: '#f4ea26' },
    subtitle: { color: '#a1a1aa', fontSize: 16, letterSpacing: 3, marginTop: 5, fontWeight: '600' },
    card: { width: '100%', backgroundColor: 'rgba(26, 26, 26, 0.6)', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
    loginTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 25, textAlign: 'center' },
    input: { backgroundColor: 'rgba(44, 44, 44, 0.7)', color: '#fff', padding: 18, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#444' },
    button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#f4ea26', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    buttonText: { color: '#0c0c0c', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});
