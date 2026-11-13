import { useCallback, useEffect, useRef, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { database } from '../database/connection';
import { initializeDatabase } from '../database/schema';
import { EmployeeRepository } from '../database/repositories/employeeRepository';
import { apiRequest } from '../core/api/apiClient';
import type { Employee, LeaveType } from '../types/domain';
import { useAttendance } from '../features/attendance/hooks/useAttendance';
import { useLeave } from '../features/leave/hooks/useLeave';

const demoEmployee: Employee = {
  id: 'EMP-001',
  name: 'Alex Morgan',
  department: 'Software Developer',
};

export function useAppController() {
  const [ready, setReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee>(demoEmployee);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const network = useNetInfo();
  const online = network.isConnected === true && network.isInternetReachable !== false;
  const attendance = useAttendance(online, ready);
  const leave = useLeave(online, ready);

  useEffect(() => {
    let mounted = true;
    const setup = async () => {
      try {
        await initializeDatabase(database);
        const employeeRepository = new EmployeeRepository(database);
        const cachedEmployee = await employeeRepository.getEmployee();
        const employeeToUse = cachedEmployee?.id === demoEmployee.id
          ? { ...cachedEmployee, department: demoEmployee.department }
          : cachedEmployee ?? demoEmployee;
        if (!cachedEmployee || employeeToUse.department !== cachedEmployee.department) {
          await employeeRepository.saveEmployee(employeeToUse);
        }
        if (mounted) {
          setEmployee(employeeToUse);
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
        const employeeToUse = remoteEmployee.id === demoEmployee.id
          ? { ...remoteEmployee, department: demoEmployee.department }
          : remoteEmployee;
        await new EmployeeRepository(database).saveEmployee(employeeToUse);
        setEmployee(employeeToUse);
      })
      .catch(() => undefined);
  }, [ready, online]);

  const autoSyncAttempted = useRef(false);
  useEffect(() => {
    if (!online) {
      autoSyncAttempted.current = false;
      return;
    }
    if (ready && attendance.events.some(event => event.syncStatus === 'pending') && !autoSyncAttempted.current) {
      autoSyncAttempted.current = true;
      attendance.syncNow().catch(() => undefined);
    }
  }, [ready, online, attendance.events, attendance.syncNow]);

  const status = attendance.today?.status ?? 'not_checked_in';
  const actionType = status === 'not_checked_in' ? 'check_in' : 'check_out';

  const handleAttendance = useCallback(() => {
    void attendance.recordAction(actionType).catch(() => undefined);
  }, [attendance.recordAction, actionType]);

  const submitLeave = useCallback(() => {
    void leave.submit({
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
    }).then(success => {
      if (success) {
        setLeaveStart('');
        setLeaveEnd('');
        setLeaveReason('');
      }
    });
  }, [leave.submit, leaveType, leaveStart, leaveEnd, leaveReason]);

  return {
    ready, startupError, employee, online,
    attendance, leave, leaveType, setLeaveType,
    leaveStart, setLeaveStart, leaveEnd, setLeaveEnd,
    leaveReason, setLeaveReason, handleAttendance, submitLeave,
  };
}
