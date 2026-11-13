import React from 'react';
import Icon from '@react-native-vector-icons/material-design-icons';
import { ScrollView } from 'react-native';
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          const iconNames: Record<string, React.ComponentProps<typeof Icon>['name']> = {
            Home: focused ? 'home' : 'home-outline',
            Attendance: focused ? 'calendar-check' : 'calendar-check-outline',
            Leave: focused ? 'calendar-edit' : 'calendar-edit-outline',
          };
          return <Icon name={iconNames[route.name] ?? 'circle-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#245C4A',
        tabBarInactiveTintColor: '#87958D',
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Inter-Medium', marginBottom: 3 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7ECE7',
          paddingTop: 7,
          paddingBottom: 5,
          height: 58,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
            <HomeScreen
              employee={controller.employee}
              attendance={controller.attendance}
              leave={controller.leave}
              online={controller.online}
            />
          </ScrollView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Attendance">
        {() => (
          <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
            <AttendanceScreen
              attendance={controller.attendance}
              handleAttendance={controller.handleAttendance}
              online={controller.online}
            />
          </ScrollView>
        )}
      </Tab.Screen>
      <Tab.Screen name="Leave">
        {() => (
          <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = {
  screenContent: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
};
