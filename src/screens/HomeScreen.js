import { View, Text, Button } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';

export default function HomeScreen({ navigation }) {
    return (
        <View>
            <Text>Home</Text>
            <Button
                title="Logout"
                onPress={() => {
                    signOut(auth);
                    navigation.replace('Login');
                }}
            />
        </View>
    );
}