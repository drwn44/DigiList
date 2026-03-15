import { View } from 'react-native';
import {Text, TextInput, Button, HelperText} from 'react-native-paper';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { authStyles as styles } from '../styles/authStyles';
import {getAuthErrorMessage} from "../utils/authErrors";

export default function LoginScreen({ navigation }) {
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
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Bejelentkezés
            </Text>

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
        </View>
    );
}
