import { Button, Card, Checkbox, Chip, FAB, IconButton, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import CategoryPicker from '../components/CategoryPicker';
import {FlatList, ScrollView, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import EmptyState from "../components/EmptyState";
import AppHeader from '../components/AppHeader';

const UNITS = ['db', 'kg', 'g', 'l', 'dl', 'ml', 'csomag', 'karton'];

export default function ListItemScreen({ route }) {
    const { listId, listName } = route.params;
    const [items, setItems] = useState([]);
    const [itemName, setItemName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [addItemVisible, setAddItemVisible] = useState(false);
    const [itemQuantity, setItemQuantity] = useState('1');
    const [itemUnit, setItemUnit] = useState('db');

    const theme = useTheme();

    const totalCount = items.length;
    const doneCount = items.filter(item => item.done).length;

    useEffect(() => {
        const q = collection(db, 'lists', listId, 'items');
        return onSnapshot(q, async (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(data);

            const total = data.length;
            const done = data.filter(item => item.done).length;
            const allDone = total > 0 && done === total;

            await updateDoc(doc(db, 'lists', listId), {
                completed: allDone,
                itemCount: total,
                doneCount: done,
            });
        });
    }, [listId]);

    const addItem = async () => {
        if (!itemName.trim()) return;
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
        setAddItemVisible(false);
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
        await deleteDoc(doc(db, 'lists', listId, 'items', selectedItemId));
        setDeleteVisible(false);
        setSelectedItemId(null);
    };

    const formatAmount = (amount) => {
        return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <AppHeader title={listName} />

            <Text
                variant="bodyMedium"
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    opacity: 0.7,
                    color: doneCount === totalCount && totalCount > 0 ? theme.colors.primary : theme.colors.onSurface,
                }}
            >
                {doneCount} / {totalCount} elem a kosárban
            </Text>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    { padding: 16, paddingBottom: 96 },
                    items.length === 0 && { flexGrow: 1 },
                ]}
                ListEmptyComponent={
                    <EmptyState
                        title="Ez a lista még üres"
                        subtitle="Adj hozzá egy elemet a + gombbal"
                    />
                }
                renderItem={({ item }) => (
                    <Card style={{
                        marginBottom: 8,
                        backgroundColor: item.done ? theme.colors.primaryContainer : theme.colors.surface,
                        opacity: item.done ? 0.7 : 1,
                    }}>
                        <Card.Title
                            title={item.name}
                            titleStyle={{
                                textDecorationLine: item.done ? 'line-through' : 'none',
                                fontSize: 15,
                                color: theme.colors.onSurface,
                            }}
                            left={() => (
                                <Checkbox
                                    status={item.done ? 'checked' : 'unchecked'}
                                    onPress={() => toggleDone(item)}
                                />
                            )}
                            right={() => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text variant="bodyMedium" style={{ marginRight: 8, color: theme.colors.onSurfaceVariant }}>
                                        {formatAmount(item.quantity || 1)} {item.unit || 'db'}
                                    </Text>
                                    <IconButton
                                        icon="delete"
                                        size={16}
                                        iconColor={theme.colors.error}
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

            <FAB
                icon="plus"
                style={{ position: 'absolute', right: 16, bottom: 16 }}
                onPress={() => setAddItemVisible(true)}
            />

            <ConfirmDeleteDialog
                visible={deleteVisible}
                onCancel={() => setDeleteVisible(false)}
                onConfirm={confirmDeleteItem}
            />

            <Portal>
                <Modal
                    visible={addItemVisible}
                    onDismiss={() => setAddItemVisible(false)}
                    contentContainerStyle={{
                        backgroundColor: theme.colors.surface,
                        padding: 16,
                        margin: 24,
                        borderRadius: 16,
                        marginBottom: 320,
                    }}
                >

                        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                            Új elem hozzáadása
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <TextInput
                                label="Elem neve"
                                value={itemName}
                                onChangeText={setItemName}
                                style={{ flex: 1 }}
                                autoFocus
                            />
                            <IconButton
                                icon="view-grid"
                                mode="contained"
                                onPress={() => {
                                    setAddItemVisible(false);
                                    setCategoryPickerVisible(true);
                                }}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <TextInput
                                label="Mennyiség"
                                value={itemQuantity}
                                onChangeText={setItemQuantity}
                                keyboardType="numeric"
                                style={{ width: 100 }}
                            />
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                            >
                                {UNITS.map(unit => (
                                    <Chip
                                        key={unit}
                                        selected={itemUnit === unit}
                                        onPress={() => setItemUnit(unit)}
                                    >
                                        {unit}
                                    </Chip>
                                ))}
                            </ScrollView>
                        </View>

                        <Button mode="contained" onPress={addItem}>
                            Hozzáadás
                        </Button>

                </Modal>

                <CategoryPicker
                    visible={categoryPickerVisible}
                    onCancel={() => {
                        setCategoryPickerVisible(false);
                        setAddItemVisible(true);
                    }}
                    onSelectProduct={(name) => {
                        setItemName(name);
                        setCategoryPickerVisible(false);
                        setAddItemVisible(true);
                    }}
                />
            </Portal>
        </SafeAreaView>
    );
}