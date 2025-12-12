import {View, Text, Button, FlatList} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import {useState} from "react";
import {Card, FAB, IconButton} from "react-native-paper";

export default function HomeScreen({ navigation }) {
    const [items, setItems] = useState([
        { id: '1', name: 'Tej' },
        { id: '2', name: 'Kenyér' },
        { id: '3', name: 'Tojás' },
    ]);
    return (
        <View>
            <Text variant="titleLarge" style={{ marginBottom: 16 }}>
                Bevásárlólista
            </Text>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card style={{ marginBottom: 8 }}>
                        <Card.Title
                            title={item.name}
                            right={(props) => (
                                <IconButton {...props} icon="delete" onPress={() => {}} />
                            )}
                        />
                    </Card>
                )}
            />

            <FAB
                icon="plus"
                style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                }}
                onPress={() => {}}
            />
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