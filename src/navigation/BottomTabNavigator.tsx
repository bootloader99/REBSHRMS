import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppController } from '../hooks/useAppController';
import { HomeScreen } from '../screens/HomeScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { LeaveScreen } from '../screens/LeaveScreen';

type AppController = ReturnType<typeof useAppController>;

type BottomTabNavigatorProps = {
  controller: AppController;
};

const Tab = createBottomTabNavigator();

export function BottomTabNavigator({ controller }: BottomTabNavigatorProps) {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#245C4A',
        tabBarInactiveTintColor: '#87958D',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 3 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7ECE7',
          paddingTop: 7,
          paddingBottom: 5,
          height: 58,
          elevation: 0,
        },
      }}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeScreen
            employee={controller.employee}
            attendance={controller.attendance}
            leave={controller.leave}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Attendance">
        {() => (
          <AttendanceScreen
            attendance={controller.attendance}
            handleAttendance={controller.handleAttendance}
            online={controller.online}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Leave">
        {() => (
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
      </Tab.Screen>
    </Tab.Navigator>
  );
}
