import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RosterScreen from './src/screens/RosterScreen';
import ManagePlayersScreen from './src/screens/ManagePlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import RefereesScreen from './src/screens/RefereesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function RosterStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: '#f4ea26' },
            headerTintColor: '#0c0c0c',
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="RosterList" component={RosterScreen} options={{ title: 'Team Roster' }} />
            <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player Detail' }} />
        </Stack.Navigator>
    );
}

function ManageStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: '#f4ea26' },
            headerTintColor: '#0c0c0c',
            headerTitleStyle: { fontWeight: 'bold' }
        }}>
            <Stack.Screen name="ManageList" component={ManagePlayersScreen} options={{ title: 'Manage Requests' }} />
            <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player Detail' }} />
        </Stack.Navigator>
    );
}

function MainTabs({ setToken }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerStyle: { backgroundColor: '#f4ea26' },
                headerTintColor: '#0c0c0c',
                headerTitleStyle: { fontWeight: 'bold' },
                tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
                tabBarActiveTintColor: '#f4ea26',
                tabBarInactiveTintColor: '#a1a1aa',
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'home';
                    else if (route.name === 'Roster') iconName = 'users';
                    else if (route.name === 'Manage') iconName = 'inbox';
                    else if (route.name === 'Referees') iconName = 'gavel';
                    else if (route.name === 'Settings') iconName = 'cog';
                    return <FontAwesome name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Roster" component={RosterStack} options={{ headerShown: false }} />
            <Tab.Screen name="Manage" component={ManageStack} options={{ headerShown: false }} />
            <Tab.Screen name="Referees" component={RefereesScreen} />
            <Tab.Screen name="Settings">
                {props => <SettingsScreen {...props} setToken={setToken} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}

export default function App() {
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                setToken(storedToken);
            } catch (e) { }
            setLoading(false);
        };
        checkToken();
    }, [token]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#1a1a1a' }}>
                <ActivityIndicator size="large" color="#f4ea26" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
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
    );
}
