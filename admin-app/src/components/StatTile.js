import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const StatTile = ({ icon, value, label }) => (
  <View style={styles.tile}>
    <Ionicons name={icon} size={15} color={colors.yellow} />
    <Text style={styles.value}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  value: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 2 },
  label: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});

export default StatTile;
