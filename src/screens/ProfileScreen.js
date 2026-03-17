import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {Text, Button, TextInput, Divider, Snackbar, HelperText, useTheme} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {getAuthErrorMessage} from "../utils/authErrors";
import { Switch } from 'react-native-paper';
import {useAppTheme} from "../styles/themeContext";

export default function ProfileScreen({ onClose }) {
    const user = auth.currentUser;

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [currentPasswordError, setCurrentPasswordError] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');

    const theme = useTheme();
    const { isDark, toggleTheme } = useAppTheme();

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    const saveName = async () => {
        if (!displayName.trim()) return;
        setNameLoading(true);
        try {
            await updateProfile(user, { displayName: displayName.trim() });
            await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() });
            showSnackbar('Név sikeresen frissítve!');
        } catch (exc) {
            showSnackbar('Hiba történt: ' + exc.message);
        } finally {
            setNameLoading(false);
        }
    };

    const changePassword = async () => {
        setCurrentPasswordError('');
        setNewPasswordError('');

        if (!currentPassword || !newPassword) {
            showSnackbar('Minden mező kitöltése kötelező!');
            return;
        }
        if(newPassword === currentPassword) {
            showSnackbar('Az új és a régi jelszó nem egyezhet meg!')
            return;
        }
        setPasswordLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            showSnackbar('Jelszó sikeresen megváltoztatva!');
        } catch (exc) {
            if (exc.code === 'auth/wrong-password' || exc.code === 'auth/invalid-credential') {
                setCurrentPasswordError('Hibás jelenlegi jelszó');
            } else if (exc.code === 'auth/weak-password') {
                setNewPasswordError(getAuthErrorMessage(exc.code));
            } else {
                setCurrentPasswordError(getAuthErrorMessage(exc.code));
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor:theme.colors.background }}>
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 15,
                paddingBottom: 15,
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.surfaceVariant,
            }}>
                <Text variant="headlineSmall" style={{ flex: 1, fontWeight: 'bold' }}>
                    Profil
                </Text>
                <Button onPress={onClose}>Bezárás</Button>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>

                <View>
                    <Text variant="bodySmall" style={{ opacity: 0.5, marginBottom: 4 }}>
                        Email
                    </Text>
                    <Text variant="bodyLarge">{user?.email}</Text>
                </View>

                <Divider/>

                <View style={{ gap: 8 }}>
                    <Text variant="titleMedium">Megjelenített név</Text>
                    <TextInput
                        label="Név"
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="words"
                    />
                    <Button
                        mode="contained"
                        onPress={saveName}
                        loading={nameLoading}
                        disabled={nameLoading || displayName.trim() === user?.displayName}
                    >
                        Név mentése
                    </Button>
                </View>

                <Divider/>

                <View style={{ gap: 8 }}>
                    <Text variant="titleMedium">Jelszó megváltoztatása</Text>
                    <TextInput
                        label="Jelenlegi jelszó"
                        value={currentPassword}
                        onChangeText={(val) => { setCurrentPassword(val); setCurrentPasswordError(''); }}
                        secureTextEntry
                        importantForAutofill="no"
                        error={!!currentPasswordError}
                    />

                    <HelperText type="error" visible={!!currentPasswordError}>
                        {currentPasswordError}
                    </HelperText>

                    <TextInput
                        label="Új jelszó"
                        value={newPassword}
                        onChangeText={(val) => { setNewPassword(val); setNewPasswordError(''); }}
                        secureTextEntry
                        importantForAutofill="no"
                        error={!!newPasswordError}

                    />
                    <HelperText type="error" visible={!!newPasswordError}>
                        {newPasswordError}
                    </HelperText>

                    <Button
                        mode="contained"
                        onPress={changePassword}
                        loading={passwordLoading}
                        disabled={passwordLoading}
                    >
                        Jelszó megváltoztatása
                    </Button>
                </View>

                <Divider/>

                <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    icon="logout"
                    onPress={() => auth.signOut()}
                >
                    Kijelentkezés
                </Button>

                <Divider/>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                    <Text variant="titleMedium">Sötét mód</Text>
                    <Switch value={isDark} onValueChange={toggleTheme} />
                </View>


            </ScrollView>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}