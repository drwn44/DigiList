import { View } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import {auth, db} from '../firebase';
import { authStyles as styles } from '../styles/authStyles';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState('');

    const register = async () => {
        if (!displayName || !email || !password) {
            alert('Minden mező kitöltése kötelező');
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
