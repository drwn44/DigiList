import { Text, TextInput, Button, HelperText, useTheme } from 'react-native-paper';
import { View } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { authStyles as styles } from '../styles/authStyles';
import {getAuthErrorMessage} from "../utils/authErrors";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


export default function LoginScreen({ navigation }) {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const login = async () => {
        setError('')
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

            <Button
                mode="text"
                onPress={() => navigation.navigate('Register')}
            >
                Nincs még fiókod? Regisztráció
            </Button>
        </KeyboardAwareScrollView>
    );
}