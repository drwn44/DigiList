import { Portal } from 'react-native-paper';
import CategoryPicker from '../components/CategoryPicker';
import { View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import {Text, TextInput, Button, Card, Checkbox, IconButton} from 'react-native-paper';
import {doc, collection, addDoc, updateDoc, deleteDoc, onSnapshot, Timestamp} from 'firebase/firestore';
import { db } from '../firebase';
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import EmptyState from "../components/EmptyState";

export default function ListItemScreen({ route }) {
    const { listId, listName } = route.params;
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const totalCount = items.length;
    const doneCount = items.filter(item => item.done).length;
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

    useEffect(() => {
        const q = collection(db, 'lists', listId, 'items');

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(data);
            if (data.length === 0) {
                await updateDoc(doc(db, 'lists', listId), {
                    completed: false,
                });
                return;
            }
            const allDone = data.every(item => item.done === true);
            await updateDoc(doc(db, 'lists', listId), {
                completed: allDone,
            });
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
                <Text
                    variant="bodyMedium"
                    style={{
                        paddingHorizontal: 16,
                        marginBottom: 8,
                        opacity: 0.7,
                        color: doneCount === totalCount && totalCount > 0 ? '#2E7D32' : undefined,
                    }}
                >
                    {doneCount} / {totalCount} elem a kosárban
                </Text>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        { padding: 16 },
                        items.length === 0 && { flexGrow: 1 },
                    ]}
                    ListEmptyComponent={
                        <EmptyState
                            title="Ez a lista még üres"
                            subtitle="Adj hozzá egy elemet alul"
                        />
                    }

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
                        </Card>
                    )}
                />
                <ConfirmDeleteDialog
                    visible={deleteVisible}
                    onCancel={() => setDeleteVisible(false)}
                    onConfirm={confirmDeleteItem}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 8 }}>
                    <TextInput
                        label="Új elem"
                        value={itemName}
                        onChangeText={setItemName}
                        style={{ flex: 1 }}
                    />
                    <IconButton
                        icon="view-grid"
                        mode="contained"
                        onPress={() => setCategoryPickerVisible(true)}
                    />
                </View>
                <Button mode="contained" onPress={addItem}>
                    Hozzáadás
                </Button>

                <Portal>
                    <CategoryPicker
                        visible={categoryPickerVisible}
                        onCancel={() => setCategoryPickerVisible(false)}
                        onSelectProduct={(name) => {
                            setItemName(name);
                            setCategoryPickerVisible(false);
                        }}
                    />
                </Portal>
            </View>
        </SafeAreaView>
    );
}
