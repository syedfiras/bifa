import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, gradients, typography } from '../theme';

const GRADIENTS = {
  yellow: gradients.yellowBtn,
  red: gradients.redBtn,
  green: gradients.greenBtn,
  dark: [colors.bgSurface, colors.bg],
};

const GradientButton = ({
  label,
  icon,
  variant = 'yellow',
  onPress,
  disabled,
  loading,
  small = false,
  textColor,
  style,
}) => {
  const content = (
    <LinearGradient
      colors={GRADIENTS[variant] || GRADIENTS.yellow}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.btn, small && styles.btnSmall, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor || (variant === 'yellow' ? colors.textDark : colors.text)} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={textColor || (variant === 'yellow' ? colors.textDark : colors.text)} /> : null}
          <Text style={[styles.label, textColor && { color: textColor }]}>{label}</Text>
        </>
      )}
    </LinearGradient>
  );

  if (disabled) {
    return <TouchableOpacity style={{ opacity: 0.55 }} disabled activeOpacity={1}>{content}</TouchableOpacity>;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={loading}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  btnSmall: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  label: { ...typography.button, color: colors.textDark, fontSize: 13 },
});

export default GradientButton;
