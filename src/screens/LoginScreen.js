import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const login = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigation.replace('Home');
        } catch (e) {
            alert(e.message);
        }
    };

    return (
        <View>
            <Text>Email</Text>
            <TextInput onChangeText={setEmail} />
            <Text>Password</Text>
            <TextInput secureTextEntry onChangeText={setPassword} />

            <Button title="Login" onPress={login} />
            <Button title="Register" onPress={() => navigation.navigate('Register')} />
        </View>
    );
}