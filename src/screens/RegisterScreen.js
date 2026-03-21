import {Text, TextInput, Button, HelperText, Divider, useTheme} from 'react-native-paper';
import { View } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { setDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { authStyles as styles } from '../styles/authStyles';
import { getAuthErrorMessage } from "../utils/authErrors";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

GoogleSignin.configure({
    webClientId: Constants.expoConfig.extra.googleWebClientId,
});

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const theme = useTheme();

    const register = async () => {
        setError('');
        if (!displayName || !email || !password || !confirmPassword) {
            setError('Minden mező kitöltése kötelező!')
            return;
        }

        if (password !== confirmPassword) {
            setError('A két jelszó nem egyezik meg!');
            return;
        }

        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: displayName.trim() });

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                displayName: displayName.trim(),
                email: userCredential.user.email.toLowerCase(),
                createdAt: Timestamp.now(),
            });
        } catch (exc) {
            setError(getAuthErrorMessage(exc.code));
        } finally {
            setLoading(false);
        }
    };

    const googleRegister = async () => {
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

    return (
        <KeyboardAwareScrollView
            contentContainerStyle={styles.container}
            enableOnAndroid={true}
            keyboardShouldPersistTaps="handled"
        >
            <Text variant="headlineMedium" style={styles.title}>
                Regisztráció
            </Text>

            <TextInput
                label="Név"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                style={styles.input}
            />

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

            <TextInput
                label="Jelszó megerősítése"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
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
                onPress={register}
                loading={loading}
                style={styles.button}
            >
                Regisztráció
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
                onPress={googleRegister}
                disabled={googleLoading}
            />

            <Button
                mode="text"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 16 }}
                textColor={theme.colors.onBackground}
            >
                Vissza a belépéshez
            </Button>
        </KeyboardAwareScrollView>
    );
}