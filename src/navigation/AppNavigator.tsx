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
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>REBS HRMS</Text>
          <Text style={styles.heading}>Hello, {controller.employee.name.split(' ')[0]}</Text>
        </View>
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
  navigator: { flex: 1 },
  error: { color: '#B42318', fontSize: 12, textAlign: 'center' },
});
