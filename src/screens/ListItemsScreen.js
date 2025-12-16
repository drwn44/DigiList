import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {Text, TextInput, Button, Card, Checkbox, FAB, IconButton} from 'react-native-paper';

import {doc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp} from 'firebase/firestore';
import { db } from '../firebase';

import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";


export default function ListItemScreen({ route }) {
    const { listId, listName } = route.params;
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

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

    const toggleDone = async (item) => {
        await updateDoc(
            doc(db, 'lists', listId, 'items', item.id),
            {
                done: !item.done,
            }
        );
    };

    const confirmDeleteItem = async () => {
        await deleteDoc(
            doc(db, 'lists', listId, 'items', selectedItemId)
        );

        setDeleteVisible(false);
        setSelectedItemId(null);
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
                        <Card style={{
                            marginBottom: 8,
                            backgroundColor: item.done ? '#E8F5E9' : '#FFFFFF',
                            opacity: item.done ? 0.6 : 1, }}>
                            <Card.Title
                                title={item.name}
                                titleStyle={{
                                    textDecorationLine: item.done ? 'line-through' : 'none',
                                }}
                                left={() => (
                                    <Checkbox
                                        status={item.done ? 'checked' : 'unchecked'}
                                        onPress={() => toggleDone(item)}
                                    />
                                )}
                                right={() => (
                                    <IconButton
                                        icon="delete"
                                        onPress={() => {
                                            setSelectedItemId(item.id);
                                            setDeleteVisible(true);
                                        }}
                                    />
                                )}
                            />
                            <ConfirmDeleteDialog
                                visible={deleteVisible}
                                onCancel={() => setDeleteVisible(false)}
                                onConfirm={confirmDeleteItem}
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
