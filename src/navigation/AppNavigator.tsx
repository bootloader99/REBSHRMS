import React from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppController } from '../hooks/useAppController';
import { BottomTabNavigator } from './BottomTabNavigator';

export function AppNavigator() {
  const controller = useAppController();

  if (!controller.ready) {
    return (
      <SafeAreaView style={styles.loading}>
        {controller.startupError
          ? <Text style={styles.error}>{controller.startupError}</Text>
          : <ActivityIndicator size="large" color="#245C4A" />}
        <Text style={styles.loadingText}>Preparing your workspace…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F4" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>REBS HRMS</Text>
          <Text style={styles.heading}>Hello, {controller.employee.name.split(' ')[0]}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {controller.employee.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.connectionDot, { backgroundColor: controller.online ? '#2F8A60' : '#D18A32' }]} />
        <Text style={styles.connectionText}>
          {controller.online ? 'Internet connected' : 'Offline'} · {controller.attendance.syncCounts.pending} pending · {controller.attendance.syncCounts.synced} synced · {controller.attendance.syncCounts.rejected} rejected
        </Text>
        {controller.online && (
          <Text
            accessibilityRole="button"
            onPress={() => controller.attendance.syncNow().catch(() => undefined)}
            style={styles.syncText}
          >
            {controller.attendance.syncing ? 'Syncing…' : 'Sync now'}
          </Text>
        )}
      </View>

      <View style={styles.navigator}>
        <NavigationContainer>
          <BottomTabNavigator controller={controller} />
        </NavigationContainer>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F4' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F4', padding: 24 },
  loadingText: { color: '#7C8B83', fontSize: 12, marginTop: 12 },
  header: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#688174', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  heading: { color: '#1C3028', fontSize: 25, fontWeight: '700', marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DCE9E1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#245C4A', fontWeight: '700' },
  connectionRow: { marginHorizontal: 22, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  connectionText: { color: '#77857D', fontSize: 10, flex: 1 },
  syncText: { color: '#245C4A', fontSize: 11, fontWeight: '700', marginLeft: 8 },
  navigator: { flex: 1 },
  error: { color: '#B42318', fontSize: 12, textAlign: 'center' },
});
