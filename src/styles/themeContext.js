import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const darkColors = {
    primary: '#3DAA70',
    onPrimary: '#1E6B45',
    primaryContainer: '#1E6B45',
    onPrimaryContainer: '#B7EFD0',
    secondary: '#56C68A',
    onSecondary: '#141414',
    secondaryContainer: '#1A3328',
    onSecondaryContainer: '#B7EFD0',
    background: '#141414',
    onBackground: '#E0E0E0',
    surface: '#1E1E1E',
    onSurface: '#E0E0E0',
    surfaceVariant: '#2A2A2A',
    onSurfaceVariant: '#B0B0B0',
    outline: '#3DAA70',
    error: '#CF6679',
    onError: '#690024',
};

const lightColors = {
    primary: '#2D8A55',
    onPrimary: '#FFFFFF',
    primaryContainer: '#B7EFD0',
    onPrimaryContainer: '#1E6B45',
    secondary: '#3DAA70',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D4F5E2',
    onSecondaryContainer: '#1E6B45',
    background: '#F5F5F5',
    onBackground: '#1A1A1A',
    surface: '#FFFFFF',
    onSurface: '#1A1A1A',
    surfaceVariant: '#E8F5EE',
    onSurfaceVariant: '#444444',
    outline: '#2D8A55',
    error: '#B00020',
    onError: '#FFFFFF',
};

export const darkTheme = { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, ...darkColors } };
export const lightTheme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...lightColors } };

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('theme_preference').then(val => {
            if (val !== null) setIsDark(val === 'dark');
        });
    }, []);

    const toggleTheme = async () => {
        const newVal = !isDark;
        setIsDark(newVal);
        await AsyncStorage.setItem('theme_preference', newVal ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, theme: isDark ? darkTheme : lightTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useAppTheme = () => useContext(ThemeContext);