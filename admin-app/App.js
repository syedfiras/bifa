import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Animated, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RosterScreen from './src/screens/RosterScreen';
import ManagePlayersScreen from './src/screens/ManagePlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import RefereesScreen from './src/screens/RefereesScreen';
import DlicenseScreen from './src/screens/DlicenseScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 6;

const tabs = [
  { name: 'Dashboard', icon: 'home', label: 'Home' },
  { name: 'Roster', icon: 'users', label: 'Roster' },
  { name: 'Manage', icon: 'inbox', label: 'Manage' },
  { name: 'Referees', icon: 'gavel', label: 'Officials' },
  { name: 'D-License', icon: 'id-card', label: 'D-License' },
  { name: 'Settings', icon: 'cog', label: 'Settings' },
];

function CustomTabBar({ state, descriptors, navigation }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={[tabStyles.container, { paddingBottom: insets.bottom + 4 }]}>
      <View style={tabStyles.indicatorContainer}>
        <Animated.View style={[tabStyles.activeIndicator, { transform: [{ translateX }] }]} />
      </View>
      <View style={tabStyles.tabsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = tabs[index] || {};

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={tabStyles.tab}>
              <FontAwesome name={tab.icon} size={isFocused ? 20 : 18} color={isFocused ? colors.yellow : colors.textMuted} />
              <Text style={[tabStyles.tabLabel, isFocused && tabStyles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.yellow,
  },
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
