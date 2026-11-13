import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { appConfig } from '../config/appConfig';
import { formatCompanyTime, formatDuration } from '../core/date/dateFormatters';
import { useAppController } from '../hooks/useAppController';

type Controller = ReturnType<typeof useAppController>;
type Props = Pick<Controller, 'employee' | 'attendance' | 'leave' | 'online'>;

export function HomeScreen({ employee, attendance, leave, online }: Props) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const status = attendance.today?.status ?? 'not_checked_in';
  const checkInAt = attendance.today?.checkInAt ?? null;
  const checkOutAt = attendance.today?.checkOutAt ?? null;

  useEffect(() => {
    if (status !== 'checked_in' || !checkInAt) return undefined;
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [status, checkInAt]);
  const statusLabel = status === 'checked_in'
    ? 'Checked in'
    : status === 'checked_out' ? 'Checked out' : 'Not checked in';

  return (
    <View>
      {!online && (
        <View style={styles.offlineNotice}>
          <Text style={styles.offlineNoticeText}>You're offline. Showing saved data from this device.</Text>
        </View>
      )}
      <View style={styles.employeeCard}>
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
            <Text style={styles.time}>{formatCompanyTime(attendance.today?.checkInAt ?? null, appConfig.companyTimeZone)}</Text>
          </View>
          <View>
            <Text style={styles.muted}>Check out</Text>
            <Text style={styles.time}>{formatCompanyTime(attendance.today?.checkOutAt ?? null, appConfig.companyTimeZone)}</Text>
          </View>
        </View>
        <View style={styles.durationRow}>
          <Text style={styles.muted}>Elapsed working duration</Text>
          <Text style={styles.duration}>
            {formatDuration(checkInAt, checkOutAt ?? currentTime)}
          </Text>
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
          : attendance.recent.slice(0, 5).map(record => (
            <View key={record.id} style={styles.listRow}>
              <View>
                <Text style={styles.rowTitle}>{record.workDate}</Text>
                <Text style={styles.muted}>{formatCompanyTime(record.checkInAt, appConfig.companyTimeZone)} – {formatCompanyTime(record.checkOutAt, appConfig.companyTimeZone)}</Text>
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
  offlineNotice: {
    backgroundColor: '#F1EEE4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  offlineNoticeText: {
    color: '#75633A',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter-Regular',
  },
  employeeCard: {
    backgroundColor: '#E8F0EA',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    color: '#253A30',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  muted: {
    color: '#7C8B83',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  cardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: '#8A9990',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusActive: {
    backgroundColor: '#E4EFE8',
  },
  statusComplete: {
    backgroundColor: '#E8EDF4',
  },
  statusIdle: {
    backgroundColor: '#F2F3F1',
  },
  statusPillText: {
    color: '#426452',
    fontSize: 10,
    fontFamily: 'Inter-Medium',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF1EE',
    marginTop: 18,
    paddingTop: 15,
    paddingRight: 28,
  },
  time: {
    color: '#263A30',
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 5,
  },
  durationRow: {
    borderTopWidth: 1,
    borderTopColor: '#EEF1EE',
    marginTop: 15,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    color: '#245C4A',
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionTitle: {
    color: '#253A30',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  balanceValue: {
    color: '#245C4A',
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 7,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  link: {
    color: '#245C4A',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  listRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 17,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    color: '#304238',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  rowStatus: {
    color: '#688174',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontFamily: 'Inter-Regular',
  },
});
