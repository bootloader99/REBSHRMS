import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppController, type WorkspaceTab } from './src/hooks/useAppController';
import { HomeScreen } from './src/screens/HomeScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';
import { LeaveScreen } from './src/screens/LeaveScreen';

function App() {
  const controller = useAppController();
  const {
    activeTab, setActiveTab, ready, startupError, employee, online,
    attendance,
  } = controller;

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        {startupError
          ? <Text style={styles.error}>{startupError}</Text>
          : <ActivityIndicator size="large" color="#245C4A" />}
        <Text style={styles.loadingText}>Preparing your workspace…</Text>
      </SafeAreaView>
    );
  }

  const tabs: { key: WorkspaceTab; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '⌂' },
    { key: 'attendance', label: 'Attendance', icon: '◷' },
    { key: 'leave', label: 'Leave', icon: '▤' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F4" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>REBS HRMS</Text>
          <Text style={styles.heading}>Hello, {employee.name.split(' ')[0]}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {employee.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.connectionDot, { backgroundColor: online ? '#2F8A60' : '#D18A32' }]} />
        <Text style={styles.connectionText}>
          {online ? 'Internet connected' : 'Offline'} · {attendance.syncCounts.pending} pending · {attendance.syncCounts.synced} synced · {attendance.syncCounts.rejected} rejected
        </Text>
        {online && (
          <TouchableOpacity onPress={() => attendance.syncNow().catch(() => undefined)} disabled={attendance.syncing}>
            <Text style={styles.syncText}>{attendance.syncing ? 'Syncing…' : 'Sync now'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'home' && (
          <HomeScreen
            employee={controller.employee}
            attendance={controller.attendance}
            leave={controller.leave}
          />
        )}
        {activeTab === 'attendance' && (
          <AttendanceScreen
            attendance={controller.attendance}
            handleAttendance={controller.handleAttendance}
            online={controller.online}
          />
        )}
        {activeTab === 'leave' && (
          <LeaveScreen
            leave={controller.leave}
            online={controller.online}
            leaveType={controller.leaveType}
            setLeaveType={controller.setLeaveType}
            leaveStart={controller.leaveStart}
            setLeaveStart={controller.setLeaveStart}
            leaveEnd={controller.leaveEnd}
            setLeaveEnd={controller.setLeaveEnd}
            leaveReason={controller.leaveReason}
            setLeaveReason={controller.setLeaveReason}
            submitLeave={controller.submitLeave}
          />
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {tabs.map(tab => {
          const selected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveTab(tab.key)}
              style={styles.navItem}
            >
              <View style={[styles.navIconWrap, selected && styles.navIconWrapActive]}>
                <Text style={[styles.navIcon, selected && styles.navIconActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
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
  connectionRow: { marginHorizontal: 22, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  connectionText: { color: '#77857D', fontSize: 10, flex: 1 },
  syncText: { color: '#245C4A', fontSize: 11, fontWeight: '700', marginLeft: 8 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E7ECE7', paddingTop: 9, paddingBottom: 5 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
  navIconWrap: { width: 42, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: '#E4EFE8' },
  navIcon: { color: '#87958D', fontSize: 21, lineHeight: 24 },
  navIconActive: { color: '#245C4A' },
  navLabel: { color: '#87958D', fontSize: 10, fontWeight: '600', marginTop: 3 },
  navLabelActive: { color: '#245C4A' },
  error: { color: '#B42318', fontSize: 12, textAlign: 'center' },
});

export default App;
