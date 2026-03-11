import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ListStack from './ListStack';
import LoyaltyCardsScreen from '../screens/LoyaltyCardsScreen';
import PriceScreen from "../screens/PriceScreen";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#6200ee',
            }}
        >
            <Tab.Screen
                name="Listák"
                component={ListStack}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cart" color={color} size={size} />
                    ),
                }}
            />

            <Tab.Screen
                name="Árak"
                component={PriceScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="tag-search" color={color} size={size} />
                    ),
                }}
            />

            <Tab.Screen
                name="Kártyák"
                component={LoyaltyCardsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="card-account-details" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}