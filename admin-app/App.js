import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Animated, TouchableOpacity, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RosterScreen from './src/screens/RosterScreen';
import ManagePlayersScreen from './src/screens/ManagePlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import StatsScreen from './src/screens/StatsScreen';
import AttendanceScreen from './src/screens/AttendanceScreen';
import RefereesScreen from './src/screens/RefereesScreen';
import DlicenseScreen from './src/screens/DlicenseScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 5;

const PRIMARY_TABS = [
  { name: 'Dashboard', icon: 'home', label: 'Home' },
  { name: 'Roster', icon: 'people', label: 'Roster' },
  { name: 'Stats', icon: 'trophy', label: 'Stats' },
  { name: 'Attendance', icon: 'calendar', label: 'Attendance' },
];

const MORE_TABS = [
  { name: 'Manage', icon: 'file-tray', label: 'Manage' },
  { name: 'Referees', icon: 'whistle', label: 'Officials' },
  { name: 'D-License', icon: 'id-card', label: 'D-License' },
  { name: 'Settings', icon: 'settings', label: 'Settings' },
];

const MORE_INDEX = PRIMARY_TABS.length;

function CustomTabBar({ state, navigation }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = state.index >= MORE_INDEX;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: Math.min(state.index, MORE_INDEX) * TAB_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.index]);

  const primaryRoutes = state.routes.slice(0, MORE_INDEX);

  const navigateToTab = (routeName) => {
    setMoreOpen(false);
    navigation.navigate(routeName);
  };

  return (
    <>
      <View style={[tabStyles.container, { paddingBottom: insets.bottom + 4 }]}>
        <View style={tabStyles.indicatorContainer}>
          <Animated.View style={[tabStyles.activeIndicator, { transform: [{ translateX }] }]} />
        </View>
        <View style={tabStyles.tabsRow}>
          {primaryRoutes.map((route, index) => {
            const isFocused = state.index === index;
            const tab = PRIMARY_TABS[index] || {};

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={tabStyles.tab}>
                <Ionicons name={tab.icon} size={isFocused ? 21 : 19} color={isFocused ? colors.yellow : colors.textMuted} />
                <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setMoreOpen(true)} activeOpacity={0.7} style={tabStyles.tab}>
            <Ionicons
              name={isMoreActive ? 'grid' : 'ellipsis-horizontal'}
              size={isMoreActive ? 20 : 21}
              color={isMoreActive ? colors.yellow : colors.textMuted}
            />
            <Text style={[tabStyles.tabLabel, isMoreActive && tabStyles.tabLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={moreOpen} transparent animationType="fade">
        <TouchableOpacity style={tabStyles.moreOverlay} activeOpacity={1} onPress={() => setMoreOpen(false)}>
          <View style={tabStyles.moreCard}>
            <View style={tabStyles.moreHeader}>
              <Text style={tabStyles.moreTitle}>More</Text>
              <TouchableOpacity onPress={() => setMoreOpen(false)} style={tabStyles.moreClose} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={tabStyles.moreGrid}>
              {MORE_TABS.map(tab => {
                const isFocused = state.index === state.routes.findIndex(r => r.name === tab.name);
                return (
                  <TouchableOpacity
                    key={tab.name}
                    style={[tabStyles.moreItem, isFocused && tabStyles.moreItemActive]}
                    activeOpacity={0.7}
                    onPress={() => navigateToTab(tab.name)}
                  >
                    <View style={[tabStyles.moreIconWrap, isFocused && tabStyles.moreIconWrapActive]}>
                      <Ionicons name={tab.icon} size={22} color={isFocused ? colors.textDark : colors.yellow} />
                    </View>
                    <Text style={[tabStyles.moreItemLabel, isFocused && tabStyles.moreItemLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  indicatorContainer: {
    height: 2,
    backgroundColor: 'transparent',
  },
  activeIndicator: {
    width: TAB_WIDTH,
    height: 2,
    backgroundColor: colors.yellow,
    borderRadius: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingTop: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.yellow,
  },
  moreOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  moreCard: {
    backgroundColor: colors.bgLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  moreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moreTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  moreClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 16,
    gap: 12,
  },
  moreItem: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreItemActive: { borderColor: colors.yellow },
  moreIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.yellowDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moreIconWrapActive: { backgroundColor: colors.yellow },
  moreItemLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  moreItemLabelActive: { color: colors.text },
});

const stackHeader = {
  headerStyle: { backgroundColor: colors.bgLight },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function RosterStack() {
  return (
    <Stack.Navigator screenOptions={stackHeader}>
      <Stack.Screen name="RosterList" component={RosterScreen} options={{ title: 'Team Roster' }} />
      <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player Detail' }} />
    </Stack.Navigator>
  );
}

function StatsStack() {
  return (
    <Stack.Navigator screenOptions={stackHeader}>
      <Stack.Screen name="StatsList" component={StatsScreen} options={{ title: 'Player Stats' }} />
      <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player Detail' }} />
    </Stack.Navigator>
  );
}

function ManageStack() {
  return (
    <Stack.Navigator screenOptions={stackHeader}>
      <Stack.Screen name="ManageList" component={ManagePlayersScreen} options={{ title: 'Manage Requests' }} />
      <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player Detail' }} />
    </Stack.Navigator>
  );
}

function MainTabs({ setToken }) {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Roster" component={RosterStack} />
      <Tab.Screen name="Stats" component={StatsStack} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Manage" component={ManageStack} />
      <Tab.Screen name="Referees" component={RefereesScreen} />
      <Tab.Screen name="D-License" component={DlicenseScreen} />
      <Tab.Screen name="Settings">
        {props => <SettingsScreen {...props} setToken={setToken} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (e) { }
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    };
    checkToken();
  }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
          {!token ? (
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} setToken={setToken} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main">
              {props => <MainTabs {...props} setToken={setToken} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}
