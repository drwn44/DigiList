import { View, FlatList } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, FAB } from 'react-native-paper';
import { useEffect, useState } from 'react';
import {collection, addDoc, onSnapshot, query, orderBy, Timestamp} from 'firebase/firestore';
import { db } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListItemScreen({ route }) {
    const { listId, listName } = route.params;

    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, 'lists', listId, 'items'),
            orderBy('createdAt')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(data);
        });

        return unsubscribe;
    }, [listId]);

    const addItem = async () => {
        if (!itemName.trim()) return;

        await addDoc(collection(db, 'lists', listId, 'items'), {
            name: itemName,
            done: false,
            createdAt: Timestamp.now(),
        });

        setItemName('');
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 16 }}>
                <Text variant="headlineMedium" style={{ marginBottom: 16 }}>
                    {listName}
                </Text>

                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Card style={{ marginBottom: 8 }}>
                            <Card.Title
                                title={item.name}
                                left={() => (
                                    <Checkbox
                                        status={item.done ? 'checked' : 'unchecked'}
                                    />
                                )}
                            />
                        </Card>
                    )}
                />

                <TextInput
                    label="Új elem"
                    value={itemName}
                    onChangeText={setItemName}
                    style={{ marginVertical: 12 }}
                />

                <Button mode="contained" onPress={addItem}>
                    Hozzáadás
                </Button>
            </View>
        </SafeAreaView>
    );
}
