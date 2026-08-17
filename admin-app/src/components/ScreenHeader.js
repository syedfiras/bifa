import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';

const ScreenHeader = ({ title, subtitle, action }) => (
  <View style={styles.row}>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {action}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  textWrap: { flex: 1, paddingRight: spacing.md },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, color: '#6b6b72', marginTop: 2 },
});

export default ScreenHeader;
