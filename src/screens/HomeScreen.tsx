import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { appConfig } from '../config/appConfig';
import { useAppController } from '../hooks/useAppController';

type Controller = ReturnType<typeof useAppController>;
type Props = Pick<Controller, 'employee' | 'attendance' | 'leave'>;

function formatTime(value: string | null): string {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: appConfig.companyTimeZone,
  });
}

export function HomeScreen({ employee, attendance, leave }: Props) {
  const status = attendance.today?.status ?? 'not_checked_in';
  const statusLabel = status === 'checked_in'
    ? 'Checked in'
    : status === 'checked_out' ? 'Checked out' : 'Not checked in';

  return (
    <View>
      <Text style={styles.greeting}>Your day at a glance</Text>
      <View style={styles.employeeCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {employee.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
          </Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.employeeName}>{employee.name}</Text>
          <Text style={styles.muted}>{employee.id} · {employee.department}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardLabel}>TODAY'S ATTENDANCE</Text>
          <View style={[styles.statusPill, status === 'checked_in' ? styles.statusActive : status === 'checked_out' ? styles.statusComplete : styles.statusIdle]}>
            <Text style={styles.statusPillText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <View>
            <Text style={styles.muted}>Check in</Text>
            <Text style={styles.time}>{formatTime(attendance.today?.checkInAt ?? null)}</Text>
          </View>
          <View>
            <Text style={styles.muted}>Check out</Text>
            <Text style={styles.time}>{formatTime(attendance.today?.checkOutAt ?? null)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Leave balance</Text>
      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>CASUAL LEAVE</Text>
          <Text style={styles.balanceValue}>{leave.balance.casual}</Text>
          <Text style={styles.muted}>days available</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>SICK LEAVE</Text>
          <Text style={styles.balanceValue}>{leave.balance.sick}</Text>
          <Text style={styles.muted}>days available</Text>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Recent attendance</Text>
        <TouchableOpacity onPress={() => attendance.refresh()}>
          <Text style={styles.link}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {attendance.loading && attendance.recent.length === 0
        ? <ActivityIndicator color="#245C4A" />
        : attendance.recent.length === 0
          ? <View style={styles.empty}><Text style={styles.muted}>No attendance records yet.</Text></View>
          : attendance.recent.slice(0, 3).map(record => (
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
      {attendance.error && <Text style={styles.error}>{attendance.error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { color: '#253A30', fontSize: 19, fontWeight: '700', marginBottom: 14 },
  employeeCard: { backgroundColor: '#E8F0EA', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#D2E2D7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#245C4A', fontWeight: '700', fontSize: 15 },
  employeeInfo: { flex: 1 },
  employeeName: { color: '#253A30', fontSize: 15, fontWeight: '700' },
  muted: { color: '#7C8B83', fontSize: 12, marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#E8EDE8' },
  cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#8A9990', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statusPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusActive: { backgroundColor: '#E4EFE8' },
  statusComplete: { backgroundColor: '#E8EDF4' },
  statusIdle: { backgroundColor: '#F2F3F1' },
  statusPillText: { color: '#426452', fontSize: 10, fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF1EE', marginTop: 18, paddingTop: 15, paddingRight: 28 },
  time: { color: '#263A30', fontSize: 20, fontWeight: '700', marginTop: 5 },
  sectionTitle: { color: '#253A30', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  balanceRow: { flexDirection: 'row', marginBottom: 20 },
  balanceCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginRight: 8, borderWidth: 1, borderColor: '#E8EDE8' },
  balanceValue: { color: '#245C4A', fontSize: 26, fontWeight: '700', marginTop: 7 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#245C4A', fontSize: 12, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 12 },
  listRow: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { color: '#304238', fontSize: 13, fontWeight: '600' },
  rowStatus: { color: '#688174', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: 10 },
});
