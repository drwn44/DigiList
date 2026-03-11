import { useState, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, ActivityIndicator, IconButton, Searchbar, Button, Dialog, Portal, RadioButton, Snackbar } from 'react-native-paper';
import { collection, addDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { TextInput } from 'react-native-paper';
import { auth, db } from '../firebase';
import AppHeader from '../components/AppHeader';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import useProductData from '../hooks/useExcelPriceSheet';
import { CATEGORY_GROUPS } from '../data/categoryGroups';
import EmptyState from "../components/EmptyState";

const formatPrice = (val) => `${Math.round(val).toLocaleString('hu-HU')} Ft`;

export default function PriceScreen() {
    const { products, loading, error } = useProductData();
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [addToListVisible, setAddToListVisible] = useState(false);
    const [selectedStoreItem, setSelectedStoreItem] = useState(null);
    const [lists, setLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState(null);
    const [newListName, setNewListName] = useState('');
    const [creatingNew, setCreatingNew] = useState(false);

    const formatQuantities = (quantities, unit) => {
        return [...quantities]
            .map(q => parseFloat(String(q).replace(',', '.')))
            .filter(q => !isNaN(q) && q > 0)
            .sort((a, b) => a - b)
            .map(q => Number.isInteger(q) ? `${q}` : `${q}`)
            .join(', ') + ` ${unit}`;
    };

    useState(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, 'lists'),
            where('members', 'array-contains', auth.currentUser.uid)
        );
        return onSnapshot(q, (snapshot) => {
            setLists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
    }, []);

    const filteredGroups = useMemo(() => {
        if (!search.trim()) return CATEGORY_GROUPS;
        const lower = search.toLowerCase();
        return CATEGORY_GROUPS
            .map(group => {
                const groupMatches = group.name.toLowerCase().includes(lower);
                const matchingSubcategories = group.subcategories.filter(s =>
                    s.toLowerCase().includes(lower)
                );
                if (groupMatches) return group;
                if (matchingSubcategories.length > 0) {
                    return { ...group, subcategories: matchingSubcategories };
                }
                return null;
            })
            .filter(Boolean);
    }, [search]);

    const subCategories = useMemo(() => {
        if (!selectedGroup) return [];
        return [
            ...new Map(
                products
                    .filter(p => p.categoryId && selectedGroup.categoryIds.includes(p.categoryId))
                    .map(p => [p.categoryId, { id: p.categoryId, name: p.categoryName }])
            ).values()
        ].sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedGroup, products]);

    const storeComparison = useMemo(() => {
        if (!selectedCategory) return [];
        return Object.values(
            products
                .filter(p => p.categoryId === selectedCategory.id && p.minUnitPrice > 0)
                .reduce((acc, p) => {
                    if (!acc[p.store]) {
                        acc[p.store] = {
                            store: p.store,
                            minPrice: p.minPrice,
                            maxPrice: p.maxPrice,
                            minUnitPrice: p.minUnitPrice,
                            maxUnitPrice: p.maxUnitPrice,
                            unit: p.unit,
                            quantities: new Set([p.quantity]),
                        };
                    } else {
                        acc[p.store].minPrice = Math.min(acc[p.store].minPrice, p.minPrice);
                        acc[p.store].maxPrice = Math.max(acc[p.store].maxPrice, p.maxPrice);
                        acc[p.store].minUnitPrice = Math.min(acc[p.store].minUnitPrice, p.minUnitPrice);
                        acc[p.store].maxUnitPrice = Math.max(acc[p.store].maxUnitPrice, p.maxUnitPrice);
                        acc[p.store].quantities.add(p.quantity);
                    }
                    return acc;
                }, {})
        ).sort((a, b) => a.minUnitPrice - b.minUnitPrice);
    }, [selectedCategory, products]);

    const cheapestStore = storeComparison[0]?.store;

    const handleBack = () => {
        if (selectedCategory) {
            setSelectedCategory(null);
        } else if (selectedGroup) {
            setSelectedGroup(null);
            setSearch('');
        }
    };

    const openAddToList = (storeItem) => {
        setSelectedStoreItem(storeItem);
        setSelectedListId(lists[0]?.id ?? null);
        setCreatingNew(false);
        setNewListName('');
        setAddToListVisible(true);
    };

    const confirmAddToList = async () => {
        if (!selectedCategory) return;

        let targetListId = selectedListId;

        if (creatingNew) {
            if (!newListName.trim()) return;
            const newList = await addDoc(collection(db, 'lists'), {
                name: newListName,
                userId: auth.currentUser.uid,
                members: [auth.currentUser.uid],
                createdAt: Timestamp.now(),
                completed: false,
            });
            targetListId = newList.id;
        }

        if (!targetListId) return;

        await addDoc(collection(db, 'lists', targetListId, 'items'), {
            name: `${selectedCategory.name} (${selectedStoreItem.store})`,
            done: false,
            quantity: 1,
            unit: 'db',
            createdAt: Timestamp.now(),
        });

        setAddToListVisible(false);
        const listName = creatingNew ? newListName : lists.find(l => l.id === targetListId)?.name;
        setSnackbarMessage(`${selectedCategory.name} (${selectedStoreItem.store}) hozzáadva a(z) ${listName} listához!`);
        setSnackbarVisible(true);
        setSelectedStoreItem(null);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <AppHeader
                title="Árak összehasonlítása"
                onLogoutPress={() => setLogoutVisible(true)}
            />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
                    <ActivityIndicator size="large" />
                    <Text variant="bodyMedium" style={{ opacity: 0.5 }}>
                        Áradatok betöltése...
                    </Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>
                    <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {(selectedGroup || selectedCategory) && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: '#eee',
                        }}>
                            <IconButton icon="arrow-left" onPress={handleBack} />
                            <Text variant="bodyMedium" style={{ opacity: 0.6, flex: 1 }}>
                                {selectedGroup?.icon} {selectedGroup?.name}
                                {selectedCategory ? ` › ${selectedCategory.name}` : ''}
                            </Text>
                        </View>
                    )}

                    {!selectedGroup && (
                        <>
                            <Searchbar
                                placeholder="Keresés kategóriában..."
                                value={search}
                                onChangeText={setSearch}
                                style={{ margin: 16 }}
                            />
                            <FlatList
                                data={filteredGroups}
                                keyExtractor={(item) => item.name}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1}}
                                ListEmptyComponent={
                                    <EmptyState
                                        title="Nincs találat"
                                        subtitle="Próbálj másra keresni"
                                    />
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSelectedGroup(item);
                                            setSearch('');
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: '#fff',
                                            borderRadius: 12,
                                            padding: 16,
                                            marginBottom: 8,
                                            elevation: 1,
                                        }}>

                                        <Text style={{ fontSize: 28, marginRight: 16 }}>{item.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text variant="titleMedium">{item.name}</Text>
                                            {search.trim() && item.subcategories && (
                                                <Text variant="bodySmall" style={{ opacity: 0.5 }}>
                                                    {item.subcategories.slice(0, 3).join(', ')}
                                                    {item.subcategories.length > 3 ? '...' : ''}
                                                </Text>
                                            )}
                                        </View>
                                        <IconButton icon="chevron-right" size={20} />
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    )}

                    {selectedGroup && !selectedCategory && (
                        <FlatList
                            data={subCategories}
                            keyExtractor={(item) => String(item.id)}
                            contentContainerStyle={{ padding: 16 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => setSelectedCategory(item)}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#fff',
                                        borderRadius: 12,
                                        padding: 16,
                                        marginBottom: 8,
                                        elevation: 1,
                                    }}>

                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyLarge">{item.name}</Text>
                                    </View>
                                    <IconButton icon="chevron-right" size={20} />
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    {selectedCategory && (
                        <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1}}>
                            <Text variant="titleLarge" style={{ marginBottom: 16, fontWeight: 'bold' }}>
                                {selectedCategory.name}
                            </Text>
                            {storeComparison.length === 0 ? (
                                    <EmptyState
                                        title="Jelenleg egy üzletben sem elérhető"
                                        subtitle="Próbálkozz később, az adatok naponta frissülnek"
                                    />
                            ) : storeComparison.map((item, index) => (
                                <Card
                                    key={item.store}
                                    style={{
                                        marginBottom: 8,
                                        backgroundColor: item.store === cheapestStore ? '#E8F5E9' : '#fff',
                                    }}>

                                    <Card.Content>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                    {index === 0 && <Text style={{ fontSize: 16 }}>🥇</Text>}
                                                    <Text
                                                        variant="titleMedium"
                                                        style={{
                                                            fontWeight: item.store === cheapestStore ? 'bold' : 'normal',
                                                            color: item.store === cheapestStore ? '#2E7D32' : '#000',
                                                        }}>
                                                        {item.store}
                                                    </Text>
                                                </View>

                                                <Text variant="bodySmall" style={{ opacity: 0.5 }}>
                                                    {formatQuantities(item.quantities, item.unit)}
                                                </Text>

                                                <Text
                                                    variant="bodySmall"
                                                    style={{ color: item.store === cheapestStore ? '#2E7D32' : '#666' }}
                                                >
                                                    {item.minUnitPrice === item.maxUnitPrice
                                                        ? `${formatPrice(item.minUnitPrice)}/${item.unit}`
                                                        : `${formatPrice(item.minUnitPrice)}–${formatPrice(item.maxUnitPrice)}/${item.unit}`
                                                    }
                                                </Text>
                                            </View>

                                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                                <Text
                                                    variant="titleMedium"
                                                    style={{
                                                        color: item.store === cheapestStore ? '#2E7D32' : '#000',
                                                        fontWeight: item.store === cheapestStore ? 'bold' : 'normal',
                                                    }}>

                                                    {item.minPrice === item.maxPrice
                                                        ? formatPrice(item.minPrice)
                                                        : `${formatPrice(item.minPrice)}–${formatPrice(item.maxPrice)}`
                                                    }
                                                </Text>

                                                <IconButton
                                                    icon="cart-plus"
                                                    size={20}
                                                    onPress={() => openAddToList(item)}
                                                />
                                            </View>
                                        </View>
                                    </Card.Content>
                                </Card>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

            <Portal>
                <Dialog visible={addToListVisible} onDismiss={() => setAddToListVisible(false)}>
                    <Dialog.Title>
                        Hozzáadás listához
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium" style={{ marginBottom: 12, opacity: 0.7 }}>
                            {selectedCategory?.name} ({selectedStoreItem?.store})
                        </Text>

                        {!creatingNew ? (
                            <>
                                <ScrollView style={{ maxHeight: 200 }}>
                                    {lists.map(list => (
                                        <TouchableOpacity
                                            key={list.id}
                                            onPress={() => setSelectedListId(list.id)}
                                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}
                                        >
                                            <RadioButton
                                                value={list.id}
                                                status={selectedListId === list.id ? 'checked' : 'unchecked'}
                                                onPress={() => setSelectedListId(list.id)}
                                            />
                                            <Text>{list.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <Button
                                    mode="text"
                                    icon="plus"
                                    onPress={() => setCreatingNew(true)}
                                    style={{ marginTop: 8 }}
                                >
                                    Új lista létrehozása
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    mode="text"
                                    icon="arrow-left"
                                    onPress={() => setCreatingNew(false)}
                                    style={{ alignSelf: 'flex-start' }}
                                >
                                    Vissza
                                </Button>
                                <TextInput
                                    label="Új lista neve"
                                    value={newListName}
                                    onChangeText={setNewListName}
                                    style={{ marginTop: 8 }}
                                />
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setAddToListVisible(false)}>Mégse</Button>
                        <Button onPress={confirmAddToList} mode="contained">
                            Hozzáadás
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <LogoutConfirmDialog
                visible={logoutVisible}
                onCancel={() => setLogoutVisible(false)}
                onConfirm={async () => {
                    setLogoutVisible(false);
                    await auth.signOut();
                }}/>

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}>
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}