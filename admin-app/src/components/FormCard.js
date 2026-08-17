import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';

const FormCard = ({ children }) => (
  <View style={styles.card}>
    <View style={styles.handle} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgForm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
});

export default FormCard;
