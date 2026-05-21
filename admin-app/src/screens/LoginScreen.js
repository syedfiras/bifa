import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, KeyboardAvoidingView, Image, Animated, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function LoginScreen({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideUp = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password;
    if (!normalizedUsername || !normalizedPassword) {
      Alert.alert('Login Failed', 'Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { username: normalizedUsername, password: normalizedPassword },
        { timeout: 15000 }
      );
      if (res.data.success) {
        setToken(res.data.token);
        try { await AsyncStorage.setItem('token', res.data.token); } catch (_) { }
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Error connecting to server');
      Alert.alert('Login Failed', message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <LinearGradient colors={gradients.bgDeep} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoGlow}>
            <Image source={require('../../assets/images/splash-icon.png')} style={styles.logoImage} />
          </View>
          <Text style={styles.brand}>BIFA</Text>
          <Text style={styles.subtitle}>Management System</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardGlow} />
          <Text style={styles.loginTitle}>Admin Access</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
            <LinearGradient colors={gradients.yellowBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.textDark} />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={18} color={colors.textDark} style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Sign In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  logoContainer: { alignItems: 'center', marginBottom: 50 },
  logoGlow: {
    width: 130, height: 130, borderRadius: 30,
    backgroundColor: colors.yellowDim, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: { width: 110, height: 110, borderRadius: 24 },
  brand: { color: colors.text, fontSize: 36, fontWeight: '900', letterSpacing: 6, marginBottom: spacing.xs },
  subtitle: { color: colors.textSecondary, fontSize: 14, letterSpacing: 4, fontWeight: '600' },
  card: {
    width: '100%', backgroundColor: colors.bgLight, padding: spacing.xxl,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', ...shadows.lg,
  },
  cardGlow: {
    position: 'absolute', top: -60, right: -60, width: 120, height: 120,
    borderRadius: 60, backgroundColor: colors.yellowDim,
  },
  loginTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.xxl, textAlign: 'center', letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgInput, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  inputIcon: { marginRight: spacing.md },
  input: { flex: 1, color: colors.text, paddingVertical: spacing.lg, fontSize: 15, fontWeight: '600' },
  eyeBtn: { padding: spacing.xs },
  button: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: radius.md, alignItems: 'center',
    justifyContent: 'center', marginTop: spacing.sm, ...shadows.yellow,
  },
  buttonText: { ...typography.button, color: colors.textDark },
});
