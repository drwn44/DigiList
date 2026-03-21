import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {Text, Button, TextInput, Divider, Snackbar, HelperText, useTheme, Dialog, Portal} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    updateProfile,
    GoogleAuthProvider
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, updateDoc, query, where, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {getAuthErrorMessage} from "../utils/authErrors";
import { Switch } from 'react-native-paper';
import {useAppTheme} from "../styles/themeContext";
import {GoogleSignin} from "@react-native-google-signin/google-signin";
import Constants from 'expo-constants';

export default function ProfileScreen({ onClose }) {
    const user = auth.currentUser;
    const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [nameLoading, setNameLoading] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [currentPasswordError, setCurrentPasswordError] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');
    const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deletePasswordError, setDeletePasswordError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    const deleteAccount = async () => {
        setDeletePasswordError('');
        if(!isGoogleUser && !deletePassword){
            setDeletePasswordError('Jelszó megadása kötelező!')
            return;
        }
        setDeleteLoading(true);
        try {
            if (isGoogleUser) {
                await GoogleSignin.signIn();
                const userInfo = await GoogleSignin.getTokens();
                const credential = GoogleAuthProvider.credential(userInfo.idToken);
                await reauthenticateWithCredential(user, credential);
            } else {
                const credential = EmailAuthProvider.credential(user.email, deletePassword);
                await reauthenticateWithCredential(user, credential);
            }

            const cardsRef = collection(db, 'users', user.uid, 'loyaltyCards');
            const cardsSnapshot = await getDocs(cardsRef);
            await Promise.all(cardsSnapshot.docs.map(d => deleteDoc(d.ref)));

            const recipesRef = collection(db, 'users', user.uid, 'recipes');
            const recipesSnapshot = await getDocs(recipesRef);
            await Promise.all(recipesSnapshot.docs.map(d => deleteDoc(d.ref)));

            const sharedListsRef = query(collection(db, 'lists'), where('members', 'array-contains', user.uid));
            const sharedListsSnapshot = await getDocs(sharedListsRef);
            await Promise.all(sharedListsSnapshot.docs.map(d =>
                updateDoc(d.ref, { members: arrayRemove(user.uid) })
            ));

            await deleteDoc(doc(db, 'users', user.uid));
            await user.delete();
            if(isGoogleUser){
                await GoogleSignin.signOut();
            }
        }catch(exc){
            if (exc.code === 'auth/wrong-password' || exc.code === 'auth/invalid-credential') {
                setDeletePasswordError('Hibás jelszó');
            } else {
                setDeletePasswordError(getAuthErrorMessage(exc.code));
            }
        } finally {
            setDeleteLoading(false);
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

                {!isGoogleUser && (
                    <>
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
                                mode="contained-tonal"
                                onPress={changePassword}
                                loading={passwordLoading}
                                disabled={passwordLoading}
                            >
                                Jelszó megváltoztatása
                            </Button>
                        </View>
                    </>
                )}

                <Divider/>

                <Button
                    mode="outlined"
                    textColor={theme.colors.error}
                    icon="account-remove"
                    style={{ borderColor: theme.colors.error }}
                    onPress={() => setDeleteAccountVisible(true)}
                >
                    Fiók törlése
                </Button>

                <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    textColor="#ffffff"
                    icon="logout"
                    onPress={async () =>{
                        await GoogleSignin.signOut();
                        await auth.signOut();
                    }}
                >
                    Kijelentkezés
                </Button>

                <Divider/>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                    <Text variant="titleMedium">Sötét mód</Text>
                    <Switch value={isDark} onValueChange={toggleTheme} />
                </View>

                <Text variant="bodySmall" style={{ textAlign: 'center', opacity: 0.3, marginTop: 8}}>
                    DigiList v{Constants.expoConfig.version}
                </Text>
            </ScrollView>

            <Portal>
                <Dialog visible={deleteAccountVisible} onDismiss={() => setDeleteAccountVisible(false)} style={{ backgroundColor: theme.colors.surface }}>
                    <Dialog.Title>Fiók törlése</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{marginBottom: 12, opacity: 0.7}}>
                            Ez a művelet visszafordíthatatlan!
                        </Text>
                        {!isGoogleUser && (
                            <>
                                <TextInput
                                    label="Jelszó"
                                    value={deletePassword}
                                    onChangeText={(val) => {setDeletePassword(val); setDeletePasswordError(''); }}
                                    secureTextEntry
                                    importantForAutofill="no"
                                    error={!!deletePasswordError}
                                />
                                <HelperText type="error" visible={!!deletePasswordError}>
                                    {deletePasswordError}
                                </HelperText>
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setDeleteAccountVisible(false);
                            setDeletePassword('');
                            setDeletePasswordError('');
                        }}>
                            Mégse
                        </Button>
                        <Button
                            textColor={theme.colors.error}
                            loading={deleteLoading}
                            onPress={deleteAccount}
                        >
                            Törlés
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

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