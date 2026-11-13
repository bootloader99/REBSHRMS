import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import { database } from './src/database/connection';
import { initializeDatabase } from './src/database/schema';
import { EmployeeRepository } from './src/database/repositories/employeeRepository';
import { useAttendance } from './src/features/attendance/hooks/useAttendance';
import { appConfig } from './src/config/appConfig';
import { apiRequest } from './src/core/api/apiClient';
import type { Employee, LeaveType } from './src/types/domain';
import { useLeave } from './src/features/leave/hooks/useLeave';

type Tab = 'home' | 'attendance' | 'leave';

// Replace this sample employee with the employee details supplied for the demo.
const demoEmployee: Employee = {
  id: 'EMP-001',
  name: 'Alex Morgan',
  department: 'Product & Engineering',
};

function formatTime(value: string | null): string {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: appConfig.companyTimeZone,
  });
}

function formatDuration(start: string | null, end: string | null, now: number): string {
  if (!start) return '--';
  const elapsedMinutes = Math.max(0, Math.floor((new Date(end ?? now).getTime() - new Date(start).getTime()) / 60000));
  return `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`;
}

function App() {
  const [clockNow, setClockNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee>(demoEmployee);
  const network = useNetInfo();
  const online = network.isConnected === true && network.isInternetReachable !== false;
  const attendance = useAttendance(online, ready);
  const leave = useLeave(online, ready);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setClockNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        await initializeDatabase(database);
        const employeeRepository = new EmployeeRepository(database);
        const cachedEmployee = await employeeRepository.getEmployee();
        if (!cachedEmployee) await employeeRepository.saveEmployee(demoEmployee);
        if (mounted) {
          setEmployee(cachedEmployee ?? demoEmployee);
          setReady(true);
        }
      } catch (error) {
        if (mounted) {
          setStartupError(error instanceof Error ? error.message : 'Unable to prepare the local database.');
        }
      }
    };
    void setup();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready || !online) return;
    apiRequest<Employee>('/employee/me')
      .then(async remoteEmployee => {
        await new EmployeeRepository(database).saveEmployee(remoteEmployee);
        setEmployee(remoteEmployee);
      })
      .catch(() => undefined);
  }, [ready, online]);

  const status = attendance.today?.status ?? 'not_checked_in';
  const statusLabel = status === 'checked_in'
    ? 'Checked in'
    : status === 'checked_out' ? 'Checked out' : 'Not checked in';
  const actionLabel = status === 'not_checked_in' ? 'Check in' : 'Check out';
  const actionType = status === 'not_checked_in' ? 'check_in' : 'check_out';

  const autoSyncAttempted = useRef(false);
  useEffect(() => {
    if (!online) {
      autoSyncAttempted.current = false;
      return;
    }
    if (ready && attendance.pendingCount > 0 && !autoSyncAttempted.current) {
      autoSyncAttempted.current = true;
      attendance.syncNow().catch(() => undefined);
    }
  }, [ready, online, attendance.pendingCount, attendance.syncNow]);

  if (!ready) {
    return (
      <SafeAreaView style={styles.loading}>
        {startupError
          ? <Text style={styles.error}>{startupError}</Text>
          : <ActivityIndicator size="large" color="#245C4A" />}
        <Text style={styles.muted}>Preparing your workspace…</Text>
      </SafeAreaView>
    );
  }

  const handleAttendance = () => {
    attendance.recordAction(actionType).catch(() => undefined);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F4" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>REBS HRMS</Text>
          <Text style={styles.heading}>Hello, {employee.name.split(' ')[0]}</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{employee.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View>
      </View>

      <View style={styles.profile}>
        <Text style={styles.profileName}>{employee.name}</Text>
        <Text style={styles.muted}>{employee.id} · {employee.department}</Text>
      </View>

      <View style={styles.connectionRow}>
        <View style={[styles.connectionDot, { backgroundColor: online ? '#2F8A60' : '#D18A32' }]} />
        <Text style={styles.connectionText}>{online ? 'Internet connected' : 'Offline'} · {attendance.syncCounts.pending} pending · {attendance.syncCounts.synced} synced · {attendance.syncCounts.rejected} rejected</Text>
        {online && <TouchableOpacity onPress={() => attendance.syncNow().catch(() => undefined)} disabled={attendance.syncing}>
          <Text style={styles.refreshText}>{attendance.syncing ? 'Syncing…' : 'Sync now'}</Text>
        </TouchableOpacity>}
      </View>

      <View style={styles.tabs}>
        {(['home', 'attendance', 'leave'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'home' ? 'Home' : tab === 'attendance' ? 'Attendance' : 'Leave'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab !== 'leave' && (
          <>
            <Text style={styles.sectionTitle}>{activeTab === 'home' ? 'Today at a glance' : 'Attendance'}</Text>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>TODAY’S STATUS</Text>
              <Text style={styles.status}>{statusLabel}</Text>
              <View style={styles.timeRow}>
                <View>
                  <Text style={styles.cardLabel}>CHECK IN</Text>
                  <Text style={styles.time}>{formatTime(attendance.today?.checkInAt ?? null)}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>CHECK OUT</Text>
                  <Text style={styles.time}>{formatTime(attendance.today?.checkOutAt ?? null)}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>ELAPSED</Text>
                  <Text style={styles.time}>{formatDuration(attendance.today?.checkInAt ?? null, attendance.today?.checkOutAt ?? null, clockNow)}</Text>
                </View>
              </View>
              <TouchableOpacity
                disabled={attendance.working || status === 'checked_out'}
                onPress={handleAttendance}
                style={[styles.actionButton, (attendance.working || status === 'checked_out') && styles.disabledButton]}
              >
                {attendance.working
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.actionText}>{status === 'checked_out' ? 'Attendance completed' : actionLabel}</Text>}
              </TouchableOpacity>
              <Text style={styles.note}>Location is checked before saving. Attendance is stored locally and queued for sync.</Text>
            </View>

            {activeTab === 'home' && (
              <>
                <Text style={styles.sectionTitle}>Leave balance</Text>
                <View style={styles.balanceRow}>
                  <View style={styles.balanceCard}>
                    <Text style={styles.cardLabel}>CASUAL</Text>
                    <Text style={styles.balanceValue}>{leave.balance.casual}</Text>
                    <Text style={styles.muted}>days available</Text>
                  </View>
                  <View style={styles.balanceCard}>
                    <Text style={styles.cardLabel}>SICK</Text>
                    <Text style={styles.balanceValue}>{leave.balance.sick}</Text>
                    <Text style={styles.muted}>days available</Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent attendance</Text>
              <TouchableOpacity onPress={() => attendance.refresh()}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            </View>
            {attendance.loading && attendance.recent.length === 0
              ? <ActivityIndicator color="#245C4A" />
              : attendance.recent.length === 0
                ? <View style={styles.empty}><Text style={styles.muted}>No attendance records yet.</Text></View>
                : attendance.recent.map(record => (
                  <View key={record.id} style={styles.listRow}>
                    <View>
                      <Text style={styles.rowTitle}>{record.workDate}</Text>
                      <Text style={styles.muted}>{formatTime(record.checkInAt)} – {formatTime(record.checkOutAt)}</Text>
                    </View>
                    <Text style={styles.rowStatus}>
                      {record.status === 'checked_out' ? 'Complete' : record.status === 'checked_in' ? 'In progress' : 'Not started'}
                    </Text>
                  </View>
                ))}
          </>
        )}

        {activeTab === 'leave' && (
          <>
            <Text style={styles.sectionTitle}>Leave balance</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceCard}>
                <Text style={styles.cardLabel}>CASUAL</Text>
                <Text style={styles.balanceValue}>{leave.balance.casual}</Text>
                <Text style={styles.muted}>days available</Text>
              </View>
              <View style={styles.balanceCard}>
                <Text style={styles.cardLabel}>SICK</Text>
                <Text style={styles.balanceValue}>{leave.balance.sick}</Text>
                <Text style={styles.muted}>days available</Text>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Apply for leave</Text>
              <View style={styles.leaveTypeRow}>
                {(['casual', 'sick'] as LeaveType[]).map(type => (
                  <TouchableOpacity key={type} onPress={() => setLeaveType(type)} style={[styles.leaveType, leaveType === type && styles.leaveTypeActive]}>
                    <Text style={[styles.leaveTypeText, leaveType === type && styles.leaveTypeTextActive]}>{type === 'casual' ? 'Casual leave' : 'Sick leave'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Start date</Text>
              <TextInput value={leaveStart} onChangeText={setLeaveStart} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" />
              <Text style={styles.inputLabel}>End date</Text>
              <TextInput value={leaveEnd} onChangeText={setLeaveEnd} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" />
              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput value={leaveReason} onChangeText={setLeaveReason} placeholder="At least 10 characters" style={[styles.input, styles.reasonInput]} multiline />
              <TouchableOpacity
                disabled={leave.submitting || leave.loading || !online}
                onPress={() => {
                  leave.submit({ type: leaveType, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason })
                    .then(success => {
                      if (success) { setLeaveStart(''); setLeaveEnd(''); setLeaveReason(''); }
                    });
                }}
                style={[styles.actionButton, (leave.submitting || leave.loading || !online) && styles.disabledButton]}
              >
                {leave.submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.actionText}>Submit leave request</Text>}
              </TouchableOpacity>
              {!online && <Text style={styles.note}>You can view cached requests offline. Connect to submit a new request.</Text>}
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Previous requests</Text>
              <TouchableOpacity onPress={() => leave.refresh()}><Text style={styles.refreshText}>Refresh</Text></TouchableOpacity>
            </View>
            {leave.loading && leave.requests.length === 0
              ? <ActivityIndicator color="#245C4A" />
              : leave.requests.length === 0
                ? <View style={styles.empty}><Text style={styles.muted}>No leave requests yet.</Text></View>
                : leave.requests.map(request => (
                  <View key={request.id} style={styles.listRow}>
                    <View style={styles.leaveRequestText}>
                      <Text style={styles.rowTitle}>{request.type === 'casual' ? 'Casual leave' : 'Sick leave'} · {request.startDate} to {request.endDate}</Text>
                      <Text style={styles.muted}>{request.reason}</Text>
                    </View>
                    <Text style={styles.rowStatus}>{request.status}</Text>
                  </View>
                ))}
            {leave.error && <Text style={styles.error}>{leave.error}</Text>}
          </>
        )}

        {attendance.error && <Text style={styles.error}>{attendance.error}</Text>}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Offline workspace · Local data is saved on this device</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F4' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7F4', padding: 24 },
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#688174', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  heading: { color: '#1C3028', fontSize: 27, fontWeight: '700', marginTop: 5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DCE9E1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#245C4A', fontWeight: '700' },
  profile: { marginHorizontal: 22, marginTop: 12, marginBottom: 10 },
  profileName: { color: '#253A30', fontSize: 14, fontWeight: '600' },
  muted: { color: '#7C8B83', fontSize: 12, marginTop: 4 },
  connectionRow: { marginHorizontal: 22, marginBottom: 14, flexDirection: 'row', alignItems: 'center' },
  connectionDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  connectionText: { color: '#77857D', fontSize: 11, flex: 1 },
  tabs: { marginHorizontal: 22, padding: 4, backgroundColor: '#E9EEE9', borderRadius: 12, flexDirection: 'row' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 9 },
  activeTab: { backgroundColor: '#FFFFFF' },
  tabText: { color: '#77857D', fontWeight: '600', fontSize: 13 },
  activeTabText: { color: '#245C4A' },
  content: { padding: 22, paddingBottom: 32 },
  sectionTitle: { color: '#253A30', fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refreshText: { color: '#245C4A', fontSize: 12, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 22, borderWidth: 1, borderColor: '#E8EDE8' },
  cardLabel: { color: '#8A9990', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  status: { color: '#245C4A', fontSize: 22, fontWeight: '700', marginTop: 7 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF1EE', marginTop: 18, paddingTop: 16 },
  time: { color: '#263A30', fontSize: 19, fontWeight: '600', marginTop: 5 },
  actionButton: { backgroundColor: '#245C4A', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, marginTop: 20 },
  disabledButton: { opacity: 0.45 },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  note: { color: '#718078', fontSize: 12, lineHeight: 18, marginTop: 14 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 20 },
  listRow: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { color: '#304238', fontSize: 13, fontWeight: '600' },
  rowStatus: { color: '#688174', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  balanceRow: { flexDirection: 'row', marginBottom: 14 },
  balanceCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginRight: 8, borderWidth: 1, borderColor: '#E8EDE8' },
  balanceValue: { color: '#245C4A', fontSize: 26, fontWeight: '700', marginTop: 7 },
  leaveTypeRow: { flexDirection: 'row', marginBottom: 16 },
  leaveType: { borderWidth: 1, borderColor: '#DCE5DE', borderRadius: 9, paddingVertical: 9, paddingHorizontal: 12, marginRight: 8 },
  leaveTypeActive: { backgroundColor: '#E4EFE8', borderColor: '#245C4A' },
  leaveTypeText: { color: '#718078', fontSize: 12, fontWeight: '600' },
  leaveTypeTextActive: { color: '#245C4A' },
  inputLabel: { color: '#50645A', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 9 },
  input: { backgroundColor: '#F8FAF8', borderWidth: 1, borderColor: '#E1E8E2', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 10, color: '#263A30', fontSize: 13 },
  reasonInput: { minHeight: 76, textAlignVertical: 'top' },
  leaveRequestText: { flex: 1, paddingRight: 8 },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: 10 },
  footer: { padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E7ECE7' },
  footerText: { color: '#87958D', fontSize: 11 },
});

export default App;
