import {Button, Card, Checkbox, Chip, IconButton, Portal, Text, TextInput} from 'react-native-paper';
import CategoryPicker from '../components/CategoryPicker';
import {FlatList, ScrollView, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect, useState} from 'react';
import {addDoc, collection, deleteDoc, doc, onSnapshot, Timestamp, updateDoc} from 'firebase/firestore';
import {db} from '../firebase';
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import EmptyState from "../components/EmptyState";

const UNITS = ['db', 'kg', 'g', 'l', 'dl', 'ml', 'csomag', 'karton'];

export default function ListItemScreen({ route }) {
    const { listId, listName } = route.params;
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const totalCount = items.length;
    const doneCount = items.filter(item => item.done).length;
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

    const [itemQuantity, setItemQuantity] = useState('1');
    const [itemUnit, setItemUnit] = useState('db');

    useEffect(() => {
        const q = collection(db, 'lists', listId, 'items');

        return onSnapshot(q, async (snapshot) => {
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
    }, [listId]);

    const addItem = async () => {
        if (!itemName.trim()) return;
        console.log('Adding item with unit:', itemUnit);
        await addDoc(collection(db, 'lists', listId, 'items'), {
            name: itemName,
            done: false,
            quantity: parseFloat(itemQuantity) || 1,
            unit: itemUnit,
            createdAt: Timestamp.now(),
        });

        setItemName('');
        setItemQuantity('1');
        setItemUnit('db');
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


    const formatAmount = (amount) => {
        return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    };


    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 16 }}>
                <Text variant="headlineMedium" style={{ marginBottom: 8 }}>
                    {listName}
                </Text>
                <Text
                    variant="bodyMedium"
                    style={{
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
                        { paddingBottom: 16 },
                        items.length === 0 && { flexGrow: 1 },
                    ]}
                    style={{ maxHeight: '55%' }}
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
                            opacity: item.done ? 0.6 : 1,
                        }}>
                            <Card.Title
                                title={item.name}
                                titleStyle={{
                                    textDecorationLine: item.done ? 'line-through' : 'none',
                                    fontSize: 15,
                                }}
                                left={() => (
                                    <Checkbox
                                        status={item.done ? 'checked' : 'unchecked'}
                                        onPress={() => toggleDone(item)}
                                    />
                                )}
                                right={() => (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text variant="bodyMedium" style={{ marginRight: 8 }}>
                                            {formatAmount(item.quantity || 1)} {item.unit || 'db'}
                                        </Text>
                                        <IconButton
                                            icon="delete"
                                            size={16}
                                            onPress={() => {
                                                setSelectedItemId(item.id);
                                                setDeleteVisible(true);
                                            }}
                                        />
                                    </View>
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

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
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

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <TextInput
                        label="Mennyiség"
                        value={itemQuantity}
                        onChangeText={setItemQuantity}
                        keyboardType="numeric"
                        style={{ marginTop: 8 }}
                    />

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                    >
                        {UNITS.map(unit => (
                            <Chip
                                key={unit}
                                selected={itemUnit === unit}
                                onPress={() => setItemUnit(unit)}
                                style={{ marginRight: 4 }}
                            >
                                {unit}
                            </Chip>
                        ))}
                    </ScrollView>
                </View>

                <Button mode="contained" onPress={addItem} style={{ marginTop: 12 }}>
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
