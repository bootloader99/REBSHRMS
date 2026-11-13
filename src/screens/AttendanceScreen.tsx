import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { appConfig } from '../config/appConfig';
import { useAppController } from '../hooks/useAppController';

type Controller = ReturnType<typeof useAppController>;
type Props = Pick<Controller, 'attendance' | 'handleAttendance' | 'online'>;

function formatTime(value: string | null): string {
  if (!value) return '--:--';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: appConfig.companyTimeZone,
  });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '--';
  const minutes = Math.max(0, Math.floor((new Date(end ?? Date.now()).getTime() - new Date(start).getTime()) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function AttendanceScreen({ attendance, handleAttendance, online }: Props) {
  const status = attendance.today?.status ?? 'not_checked_in';
  const statusLabel = status === 'checked_in'
    ? 'You are currently checked in'
    : status === 'checked_out' ? 'Attendance completed for today' : 'You have not checked in yet';
  const actionLabel = status === 'not_checked_in' ? 'Check in' : 'Check out';
  const isComplete = status === 'checked_out';

  return (
    <View>
      <Text style={styles.heading}>Attendance</Text>
      <Text style={styles.subtitle}>Record your workday and review your recent attendance.</Text>

      <View style={styles.mainCard}>
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.cardLabel}>TODAY'S STATUS</Text>
            <Text style={styles.status}>{status === 'checked_in' ? 'Checked in' : isComplete ? 'Completed' : 'Not checked in'}</Text>
          </View>
          <View style={[styles.statusMark, status === 'checked_in' ? styles.markActive : isComplete ? styles.markComplete : styles.markIdle]} />
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.muted}>Check in</Text>
            <Text style={styles.metricValue}>{formatTime(attendance.today?.checkInAt ?? null)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.muted}>Check out</Text>
            <Text style={styles.metricValue}>{formatTime(attendance.today?.checkOutAt ?? null)}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.muted}>Duration</Text>
            <Text style={styles.metricValue}>{formatDuration(attendance.today?.checkInAt ?? null, attendance.today?.checkOutAt ?? null)}</Text>
          </View>
        </View>
        <Text style={styles.statusDescription}>{statusLabel}</Text>
        <TouchableOpacity
          disabled={attendance.working || isComplete}
          onPress={handleAttendance}
          style={[styles.actionButton, (attendance.working || isComplete) && styles.disabledButton]}
        >
          {attendance.working
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.actionText}>{isComplete ? 'Attendance completed' : actionLabel}</Text>}
        </TouchableOpacity>
        <Text style={styles.note}>Your location is checked before an attendance event is saved. Records are stored on this device and synced when a connection is available.</Text>
      </View>

      <View style={styles.syncCard}>
        <View style={styles.syncInfo}>
          <Text style={styles.syncTitle}>Sync status</Text>
          <Text style={styles.syncDescription}>
            {!online
              ? 'Offline · changes are saved on this device.'
              : attendance.events.some(event => event.syncStatus === 'pending')
                ? `${attendance.events.filter(event => event.syncStatus === 'pending').length} attendance event(s) waiting to sync.`
                : 'Your attendance is up to date.'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => attendance.syncNow().catch(() => undefined)}
          disabled={!online || attendance.syncing}
          style={[styles.syncButton, (!online || attendance.syncing) && styles.disabledSyncButton]}
        >
          <Text style={styles.syncButtonText}>{attendance.syncing ? 'Syncing…' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Attendance history</Text>
        <TouchableOpacity onPress={() => attendance.refresh()}>
          <Text style={styles.link}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {attendance.loading && attendance.recent.length === 0
        ? <ActivityIndicator color="#245C4A" />
        : attendance.recent.length === 0
          ? <View style={styles.empty}><Text style={styles.muted}>No attendance records yet.</Text></View>
          : attendance.recent.map(record => {
            const checkInEvent = attendance.events.find(event => event.attendanceId === record.id && event.type === 'check_in');
            const checkOutEvent = attendance.events.find(event => event.attendanceId === record.id && event.type === 'check_out');
            const renderEventStatus = (event: typeof checkInEvent) => event ? (
              <Text style={[
                styles.eventStatus,
                event.syncStatus === 'synced' ? styles.eventSynced :
                  event.syncStatus === 'rejected' ? styles.eventRejected : styles.eventPending,
              ]}>
                {event.syncStatus === 'synced' ? 'Synced' : event.syncStatus === 'rejected' ? 'Rejected' : 'Pending sync'}
              </Text>
            ) : null;

            return (
              <View key={record.id} style={styles.listRow}>
                <View style={styles.historyHeader}>
                  <Text style={styles.rowTitle}>{record.workDate}</Text>
                  <Text style={styles.rowStatus}>
                    {record.status === 'checked_out' ? 'Complete' : record.status === 'checked_in' ? 'In progress' : 'Not started'}
                  </Text>
                </View>
                <View style={styles.historyEvent}>
                  <Text style={styles.historyEventText}>Check in · {formatTime(record.checkInAt)}</Text>
                  {renderEventStatus(checkInEvent)}
                </View>
                {record.checkOutAt ? (
                  <View style={styles.historyEvent}>
                    <Text style={styles.historyEventText}>Check out · {formatTime(record.checkOutAt)}</Text>
                    {renderEventStatus(checkOutEvent)}
                  </View>
                ) : null}
                {checkInEvent?.syncStatus === 'rejected' && checkInEvent.rejectionReason ? (
                  <Text style={styles.rejection}>{checkInEvent.rejectionReason}</Text>
                ) : null}
                {checkOutEvent?.syncStatus === 'rejected' && checkOutEvent.rejectionReason ? (
                  <Text style={styles.rejection}>{checkOutEvent.rejectionReason}</Text>
                ) : null}
              </View>
            );
          })}

      {attendance.error && <Text style={styles.error}>{attendance.error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: '#253A30', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#7C8B83', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 18 },
  mainCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E8EDE8' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: '#8A9990', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  status: { color: '#245C4A', fontSize: 21, fontWeight: '700', marginTop: 7 },
  statusMark: { width: 11, height: 11, borderRadius: 6 },
  markActive: { backgroundColor: '#2F8A60' },
  markComplete: { backgroundColor: '#6D87A4' },
  markIdle: { backgroundColor: '#C2CBC4' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EEF1EE', borderBottomWidth: 1, borderBottomColor: '#EEF1EE', marginTop: 18, paddingVertical: 15 },
  metric: { flex: 1 },
  muted: { color: '#7C8B83', fontSize: 12, marginTop: 4 },
  metricValue: { color: '#263A30', fontSize: 17, fontWeight: '700', marginTop: 5 },
  statusDescription: { color: '#64766C', fontSize: 12, marginTop: 15 },
  actionButton: { backgroundColor: '#245C4A', borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 15 },
  disabledButton: { opacity: 0.45 },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  note: { color: '#718078', fontSize: 12, lineHeight: 18, marginTop: 13 },
  syncCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 15, marginBottom: 22, borderWidth: 1, borderColor: '#E8EDE8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  syncInfo: { flex: 1, paddingRight: 12 },
  syncTitle: { color: '#253A30', fontSize: 14, fontWeight: '700' },
  syncDescription: { color: '#718078', fontSize: 11, lineHeight: 16, marginTop: 4 },
  sectionTitle: { color: '#253A30', fontSize: 16, fontWeight: '700' },
  syncButton: { backgroundColor: '#E7F0E9', borderRadius: 9, paddingHorizontal: 16, paddingVertical: 11, alignItems: 'center' },
  disabledSyncButton: { opacity: 0.5 },
  syncButtonText: { color: '#245C4A', fontSize: 12, fontWeight: '700' },
  eventStatus: { fontSize: 10, fontWeight: '700', marginLeft: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  eventPending: { color: '#94600F', backgroundColor: '#FBF1DD' },
  eventSynced: { color: '#28734F', backgroundColor: '#E5F2E9' },
  eventRejected: { color: '#B42318', backgroundColor: '#FCE9E7' },
  rejection: { color: '#B42318', fontSize: 11, marginTop: 4 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  historyEvent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  historyEventText: { color: '#7C8B83', fontSize: 12, marginTop: 4, flex: 1, flexShrink: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  link: { color: '#245C4A', fontSize: 12, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, marginBottom: 12 },
  listRow: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 9 },
  rowTitle: { color: '#304238', fontSize: 13, fontWeight: '600' },
  rowStatus: { color: '#688174', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  error: { color: '#B42318', fontSize: 12, lineHeight: 18, marginTop: 10 },
});
