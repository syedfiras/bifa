import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

const STATUS_MAP = {
  pending: { color: colors.orange, icon: 'time' },
  accepted: { color: colors.green, icon: 'checkmark-circle' },
  active: { color: colors.green, icon: 'checkmark-circle' },
  inactive: { color: colors.textMuted, icon: 'remove-circle' },
  declined: { color: colors.red, icon: 'close-circle' },
  present: { color: colors.green, icon: 'checkmark-circle' },
  absent: { color: colors.red, icon: 'close-circle' },
};

const StatusBadge = ({ status, variant = 'dot', label }) => {
  const config = STATUS_MAP[status] || { color: colors.textMuted, icon: 'remove-circle' };
  const text = label || status;

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '1c' }]}>
      {variant === 'dot' && <View style={[styles.dot, { backgroundColor: config.color }]} />}
      {variant === 'icon' && <Ionicons name={config.icon} size={12} color={config.color} />}
      <Text style={[styles.text, { color: config.color }]} numberOfLines={1}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
});

export default StatusBadge;
