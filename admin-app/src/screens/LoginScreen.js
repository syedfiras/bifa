import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Platform, KeyboardAvoidingView, Image, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import IconInput from '../components/IconInput';
import GradientButton from '../components/GradientButton';
import { colors, spacing, radius, typography, shadows, gradients } from '../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export default function LoginScreen({ setToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideUp = useRef(new Animated.Value(24)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password) {
      setError('Please enter username and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { username: normalizedUsername, password },
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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

          <IconInput
            icon="person-outline"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            style={styles.field}
          />
          <IconInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            rightIcon={showPass ? 'eye-off-outline' : 'eye-outline'}
            onRightPress={() => setShowPass(!showPass)}
            style={styles.field}
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <GradientButton
            label="Sign In"
            icon="shield-checkmark"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  logoContainer: { alignItems: 'center', marginBottom: 44 },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: colors.yellowDim,
    borderWidth: 1,
    borderColor: colors.yellowGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: { width: 100, height: 100, borderRadius: 22 },
  brand: { ...typography.display, fontSize: 34, letterSpacing: 6, marginBottom: spacing.xs },
  subtitle: { color: colors.textSecondary, fontSize: 13, letterSpacing: 4, fontWeight: '600' },
  card: {
    width: '100%',
    backgroundColor: colors.bgLight,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.lg,
  },
  cardGlow: {
    position: 'absolute', top: -60, right: -60, width: 120, height: 120,
    borderRadius: 60, backgroundColor: colors.yellowDim,
  },
  loginTitle: { ...typography.h3, textAlign: 'center', letterSpacing: 1, marginBottom: spacing.xxl },
  field: { marginBottom: spacing.md },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.redDim,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.red, fontSize: 12, fontWeight: '700', flex: 1 },
  button: { marginTop: spacing.xs, ...shadows.yellow },
});
