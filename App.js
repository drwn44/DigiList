import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { auth } from './src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import AppTabs from './src/navigation/AppTabs';
import AuthStack from './src/navigation/AuthStack';
import { ThemeProvider, useAppTheme } from './src/styles/themeContext';

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme, isDark } = useAppTheme();

    const navTheme = {
        ...(isDark ? NavigationDarkTheme : NavigationLightTheme),
        colors: {
            ...(isDark ? NavigationDarkTheme : NavigationLightTheme).colors,
            primary: theme.colors.primary,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onBackground,
            border: theme.colors.surfaceVariant,
        },
    };

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
    }, []);

    if (loading) return null;

    return (
        <PaperProvider theme={theme}>
            <NavigationContainer theme={navTheme}>
                {user ? <AppTabs /> : <AuthStack />}
            </NavigationContainer>
        </PaperProvider>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}