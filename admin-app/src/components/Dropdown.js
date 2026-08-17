import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

const Dropdown = ({ label, options, selected, onSelect, placeholder = 'All', compact = false }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueWrap}>
          <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">{selected || placeholder}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.card}>
            <Text style={styles.title}>{label}</Text>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.option, selected === option && styles.optionActive]}
                activeOpacity={0.7}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, selected === option && styles.optionTextActive]}>{option}</Text>
                {selected === option && <Ionicons name="checkmark" size={16} color={colors.yellow} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCompact: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: radius.sm },
  label: { ...typography.label, marginBottom: 4 },
  valueWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
  value: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.bgLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.h3, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  optionActive: { backgroundColor: colors.yellowDim },
  optionText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  optionTextActive: { color: colors.text, fontWeight: '800' },
});

export default Dropdown;
