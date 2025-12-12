import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const register = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
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

            <Button title="Register" onPress={register} />
        </View>
    );
}