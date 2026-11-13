import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useAppController } from '../hooks/useAppController';
import { formatDateInput } from '../core/date/dateFormatters';
import type { LeaveType } from '../types/domain';

type Controller = ReturnType<typeof useAppController>;
type Props = Pick<Controller, 'leave' | 'online' | 'leaveType' | 'setLeaveType' | 'leaveStart' | 'setLeaveStart' | 'leaveEnd' | 'setLeaveEnd' | 'leaveReason' | 'setLeaveReason' | 'submitLeave'>;

export function LeaveScreen({
  leave, online, leaveType, setLeaveType, leaveStart, setLeaveStart,
  leaveEnd, setLeaveEnd, leaveReason, setLeaveReason, submitLeave,
}: Props) {
  return (
    <View>
      <Text style={styles.heading}>Leave management</Text>
      <Text style={styles.subtitle}>Check your available leave and manage your requests.</Text>

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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Apply for leave</Text>
        <Text style={styles.inputLabel}>Leave type</Text>
        <View style={styles.leaveTypeRow}>
          {(['casual', 'sick'] as LeaveType[]).map(type => (
            <TouchableOpacity key={type} onPress={() => setLeaveType(type)} style={[styles.leaveType, leaveType === type && styles.leaveTypeActive]}>
              <Text style={[styles.leaveTypeText, leaveType === type && styles.leaveTypeTextActive]}>{type === 'casual' ? 'Casual leave' : 'Sick leave'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Start date</Text>
        <TextInput value={leaveStart} onChangeText={value => setLeaveStart(formatDateInput(value))} placeholder="DD-MM-YYYY" placeholderTextColor="#8A9990" keyboardType="number-pad" maxLength={10} style={styles.input} />
        <Text style={styles.inputLabel}>End date</Text>
        <TextInput value={leaveEnd} onChangeText={value => setLeaveEnd(formatDateInput(value))} placeholder="DD-MM-YYYY" placeholderTextColor="#8A9990" keyboardType="number-pad" maxLength={10} style={styles.input} />
        <Text style={styles.inputLabel}>Reason</Text>
        <TextInput value={leaveReason} onChangeText={setLeaveReason} placeholder="At least 10 characters" style={[styles.input, styles.reasonInput]} multiline />

        <TouchableOpacity
          disabled={leave.submitting || leave.loading || !online}
          onPress={submitLeave}
          style={[styles.actionButton, (leave.submitting || leave.loading || !online) && styles.disabledButton]}
        >
          {leave.submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.actionText}>Submit leave request</Text>}
        </TouchableOpacity>
        {!online && <Text style={styles.note}>You can view cached requests offline. Connect to submit a new request.</Text>}
        {leave.error && <Text style={styles.error}>{leave.error}</Text>}
        {leave.success && <Text style={styles.success}>{leave.success}</Text>}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Previous requests</Text>
        <TouchableOpacity onPress={() => leave.refresh()}>
          <Text style={styles.link}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {leave.loading && leave.requests.length === 0
        ? <ActivityIndicator color="#245C4A" />
        : leave.requests.length === 0
          ? <View style={styles.empty}><Text style={styles.muted}>No leave requests yet.</Text></View>
          : leave.requests.map(request => (
            <View key={request.id} style={styles.listRow}>
              <View style={styles.requestInfo}>
                <Text style={styles.rowTitle}>{request.type === 'casual' ? 'Casual leave' : 'Sick leave'} · {request.startDate} to {request.endDate}</Text>
                <Text style={styles.muted}>{request.reason}</Text>
              </View>
              <Text style={styles.rowStatus}>{request.status}</Text>
            </View>
          ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    color: '#253A30',
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    color: '#7C8B83',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 18,
    fontFamily: 'Inter-Regular',
  },
  balanceRow: {
    flexDirection: 'row',
    marginBottom: 18,
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
  cardLabel: {
    color: '#8A9990',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 1,
  },
  balanceValue: {
    color: '#245C4A',
    fontSize: 26,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 7,
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
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E8EDE8',
  },
  sectionTitle: {
    color: '#253A30',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#50645A',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 6,
    marginTop: 9,
  },
  leaveTypeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  leaveType: {
    borderWidth: 1,
    borderColor: '#DCE5DE',
    borderRadius: 9,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  leaveTypeActive: {
    backgroundColor: '#E4EFE8',
    borderColor: '#245C4A',
  },
  leaveTypeText: {
    color: '#718078',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  leaveTypeTextActive: {
    color: '#245C4A',
  },
  input: {
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E1E8E2',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#263A30',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  reasonInput: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  actionButton: {
    backgroundColor: '#245C4A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.45,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  note: {
    color: '#718078',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    fontFamily: 'Inter-Regular',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontFamily: 'Inter-Regular',
  },
  success: {
    color: '#28734F',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    fontFamily: 'Inter-Regular',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  link: {
    color: '#245C4A',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
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
    padding: 15,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestInfo: {
    flex: 1,
    paddingRight: 8,
  },
  rowTitle: {
    color: '#304238',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter-SemiBold',
  },
  rowStatus: {
    color: '#688174',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
  },
});
