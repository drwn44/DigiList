import { View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { authStyles as styles } from '../styles/authStyles';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const register = async () => {
        if (!email || !password) {
            alert('Minden mező kitöltése kötelező');
            return;
        }
        try {
            setLoading(true);
            await createUserWithEmailAndPassword(auth, email, password);
            navigation.replace('Home');
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Regisztráció
            </Text>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
            />

            <TextInput
                label="Jelszó"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />

            <Button
                mode="contained"
                onPress={register}
                loading={loading}
                style={styles.button}
            >
                Regisztráció
            </Button>

            <Button
                mode="text"
                onPress={() => navigation.goBack()}
            >
                Vissza a belépéshez
            </Button>
        </View>
    );
}
