import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { auth } from './src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from "react";
import AppTabs from "./src/navigation/AppTabs";
import AuthStack from "./src/navigation/AuthStack";

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
    }, []);

    if (loading) return null;

    return (
        <PaperProvider>
            <NavigationContainer>
                {user ? <AppTabs /> : <AuthStack />}
            </NavigationContainer>
        </PaperProvider>
    );
}