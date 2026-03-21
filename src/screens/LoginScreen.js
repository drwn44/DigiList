import { Text, TextInput, Button, HelperText, useTheme, Divider } from 'react-native-paper';
import { View } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../firebase';
import { authStyles as styles } from '../styles/authStyles';
import { getAuthErrorMessage } from "../utils/authErrors";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import {doc, setDoc, Timestamp} from "firebase/firestore";
import {Portal, Dialog} from 'react-native-paper'

GoogleSignin.configure({
    webClientId: Constants.expoConfig.extra.googleWebClientId,
});

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotCredVisible, setForgotCredVisible] = useState(false);
    const [forgotCredEmail, setForgotCredEmail] = useState('');
    const [forgotCredLoading, setForgotCredLoading] = useState(false);
    const [forgotCredError, setForgotCredError] = useState('');
    const [forgotCredSuccess, setForgotCredSuccess] = useState(false);
    const theme = useTheme();

    const login = async () => {
        setError('');
        if (!email || !password) {
            setError('Email és jelszó megadása kötelező!');
            return;
        }

        try {
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (exc) {
            setError(getAuthErrorMessage(exc.code));
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                displayName: userCredential.user.displayName || userInfo.data.user.name || '',
                email: (userCredential.user.email || userInfo.data.user.email || '').toLowerCase(),
                createdAt: Timestamp.now(),
            }, { merge: true });

        } catch (exc) {
            if (exc.code === 'auth/account-exists-with-different-credential') {
                setError(getAuthErrorMessage(exc.code));
            } else {
                setError('Google bejelentkezés sikertelen. Próbáld újra!');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const resetPassword = async () => {
        setForgotCredError('');
        if (!forgotCredEmail.trim()) {
            setForgotCredError('Add meg az email címed!');
            return;
        }

        setForgotCredLoading(true);
        try {
            await sendPasswordResetEmail(auth, forgotCredEmail.trim());
            setForgotCredSuccess(true);
        } catch (exc) {
            setForgotCredError(getAuthErrorMessage(exc.code));
        } finally {
            setForgotCredLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
        >
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    backgroundColor: theme.colors.primaryContainer,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <Text style={{ fontSize: 36 }}>🛒</Text>
                </View>
                <Text variant="headlineLarge" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                    DigiList
                </Text>
                <Text variant="bodyMedium" style={{ opacity: 0.5, marginTop: 4 }}>
                    Okos bevásárlás, egyszerűen
                </Text>
            </View>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                error={!!error}
            />

            <TextInput
                label="Jelszó"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                importantForAutofill="no"
                style={styles.input}
                error={!!error}
            />

            <HelperText type="error" visible={!!error}>
                {error}
            </HelperText>

            <Button
                mode="contained"
                onPress={login}
                loading={loading}
                style={styles.button}
            >
                Belépés
            </Button>

            <Button mode="text" onPress={() => setForgotCredVisible(true)} textColor={theme.colors.onBackground}>
                Elfelejtetted a jelszavad?
            </Button>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8 }}>
                <Divider style={{ flex: 1 }} />
                <Text variant="bodySmall" style={{ opacity: 0.5 }}>vagy</Text>
                <Divider style={{ flex: 1 }} />
            </View>

            <GoogleSigninButton
                style={{ width: '100%', height: 48 }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={googleLogin}
                disabled={googleLoading}
            />

            <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
                style={{ marginTop: 16 }}
                textColor={theme.colors.onBackground}
            >
                Nincs még fiókod? Regisztráció
            </Button>
            <Portal>
                <Dialog visible={forgotCredVisible} onDismiss={() => {
                    setForgotCredVisible(false);
                    setForgotCredEmail('');
                    setForgotCredError('');
                    setForgotCredSuccess(false);
                }} style={{ backgroundColor: theme.colors.surface }}
                >
                    <Dialog.Title>Jelszó visszaállítása</Dialog.Title>
                    <Dialog.Content>
                        {forgotCredSuccess ? (
                            <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                                Elküldtük a jelszó visszaállítási linket az email címedre!
                            </Text>
                        ) : (
                            <>
                                <Text variant="bodySmall" style={{ marginBottom: 12, opacity: 0.7 }}>
                                    Add meg az email címed és küldünk egy visszaállítási linket.
                                </Text>
                                <TextInput
                                    label="Email cím"
                                    value={forgotCredEmail}
                                    onChangeText={(val) => { setForgotCredEmail(val); setForgotCredError(''); }}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    error={!!forgotCredError}
                                />
                                <HelperText type="error" visible={!!forgotCredError}>
                                    {forgotCredError}
                                </HelperText>
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => {
                            setForgotCredVisible(false);
                            setForgotCredEmail('');
                            setForgotCredError('');
                            setForgotCredSuccess(false);
                        }}>
                            {forgotCredSuccess ? 'Bezárás' : 'Mégse'}
                        </Button>
                        {!forgotCredSuccess && (
                            <Button mode="contained" loading={forgotCredLoading} onPress={resetPassword}>
                                Küldés
                            </Button>
                        )}
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </KeyboardAwareScrollView>
    );
}