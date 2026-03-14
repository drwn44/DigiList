import {FlatList} from 'react-native';
import ShareListModal from '../components/ShareListModal';
import {SafeAreaView} from 'react-native-safe-area-context';
import {auth, db} from '../firebase.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import {useEffect, useState} from "react";
import {Button, Card, Dialog, FAB, IconButton, Modal, Portal, Text, TextInput} from "react-native-paper";
import {homeStyles as styles} from '../styles/homeStyles';
import EmptyState from "../components/EmptyState";
import AppHeader from '../components/AppHeader';
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";


export default function HomeScreen({ navigation }) {

    const [lists, setLists] = useState([]);
    const [visible, setVisible] = useState(false);
    const [listName, setListName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);

    const [selectedListId, setSelectedListId] = useState(null);
    const [editVisible, setEditVisible] = useState(false);
    const [editingListId, setEditingListId] = useState(null);

    const [logoutVisible, setLogoutVisible] = useState(false);
    const [actionVisible, setActionVisible] = useState(false);

    const [shareVisible, setShareVisible] = useState(false);
    const [sharingList, setSharingList] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'lists'),
            where('members', 'array-contains', auth.currentUser.uid)
        );

        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setLists(data);
        });
    }, []);

    const createList = async () => {
        if (!listName.trim()) return;
        await addDoc(collection(db, 'lists'), {
            name: listName,
            userId: auth.currentUser.uid,
            members: [auth.currentUser.uid],  // 👈 add this
            createdAt: Timestamp.now(),
            completed: false,
        });

        setListName('');
        setVisible(false);
    };

    const confirmDelete = async () => {
        const itemsRef = collection(db, 'lists', selectedListId, 'items');
        const itemsSnapshot = await getDocs(itemsRef);
        await Promise.all(itemsSnapshot.docs.map(d => deleteDoc(d.ref)));
        await deleteDoc(doc(db, 'lists', selectedListId));

        setDeleteVisible(false);
        setSelectedListId(null);
    };

    const updateList = async () => {
        if (!listName.trim())
            return;

        await updateDoc(doc(db, 'lists', editingListId), {
            name: listName,
        });

        setEditVisible(false);
        setEditingListId(null);
        setListName('');
    };

    return (
        <SafeAreaView style={styles.container}>
            <AppHeader title="Bevásárlólisták" onLogoutPress={() => setLogoutVisible(true)}/>
            <FlatList
                contentContainerStyle={{ padding: 16, paddingBottom: 96, flexGrow: lists.length === 0 ? 1 : 0 }}
                data={lists}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <EmptyState
                        title="Nincs még bevásárlólistád"
                        subtitle="Hozz létre egyet a + gombbal"
                    />
                }
                renderItem={({ item }) => (
                    <Card style={{ marginBottom: 8, backgroundColor: item.completed ? '#E8F5E9' : '#FFFFFF', }}
                          onPress={() =>
                              navigation.navigate('ListItemsScreen', {
                                  listId: item.id,
                                  listName: item.name,
                              })
                          }
                          onLongPress={() => {
                              setSelectedListId(item.id);
                              setEditingListId(item.id);
                              setListName(item.name);
                              setActionVisible(true);
                          }}>
                        <Card.Title
                            title={item.name}
                            right={(props) => (
                                <>
                                    {item.completed && (
                                        <IconButton
                                            {...props}
                                            icon="check-circle"
                                            iconColor="#2E7D32"
                                        />
                                    )}
                                </>
                            )}
                        />
                    </Card>

                )}
            />
            <LogoutConfirmDialog
                visible={logoutVisible}
                onCancel={() => setLogoutVisible(false)}
                onConfirm={async () => {
                    setLogoutVisible(false);
                    await auth.signOut();
                }}
            />
            <Portal>
                <Modal visible={visible} onDismiss={() => setVisible(false)}>
                    <Card style={{ margin: 16, padding: 16 }}>
                        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                            Új lista
                        </Text>

                        <TextInput
                            label="Lista neve"
                            value={listName}
                            onChangeText={setListName}
                            style={{ marginBottom: 12 }}
                        />

                        <Button mode="contained" onPress={createList}>
                            Létrehozás
                        </Button>
                    </Card>
                </Modal>
                <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
                    <Dialog.Title>Lista törlése</Dialog.Title>
                    <Dialog.Content>
                        <Text>Biztosan törölni szeretnéd ezt a listát?</Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                        <Button onPress={() => setDeleteVisible(false)}>
                            Mégse
                        </Button>
                        <Button onPress={confirmDelete} textColor="red">
                            Törlés
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Portal>
                <Dialog
                    visible={actionVisible}
                    onDismiss={() => setActionVisible(false)}
                >
                    <Dialog.Title>Lista műveletek</Dialog.Title>
                    <Dialog.Actions>
                        {lists.find(l => l.id === selectedListId)?.userId === auth.currentUser.uid && (

                            <Button
                            onPress={() => {
                                setActionVisible(false);
                                setEditVisible(true);
                            }}
                        >
                            Átnevezés
                        </Button>
                        )}

                        <Button
                            onPress={() => {
                                setActionVisible(false);
                                setSharingList(lists.find(l => l.id === selectedListId));
                                setShareVisible(true);
                            }}
                        >
                            Megosztás
                        </Button>

                        {lists.find(l => l.id === selectedListId)?.userId === auth.currentUser.uid && (
                            <Button
                                textColor="red"
                                onPress={() => {
                                    setActionVisible(false);
                                    setDeleteVisible(true);
                                }}
                            >
                                Törlés
                            </Button>
                        )}
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <Portal>
                <Modal visible={editVisible} onDismiss={() => setEditVisible(false)}>
                    <Card style={{ margin: 16, padding: 16 }}>
                        <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                            Lista átnevezése
                        </Text>

                        <TextInput
                            label="Új név"
                            value={listName}
                            onChangeText={setListName}
                            style={{ marginBottom: 12 }}
                        />

                        <Button mode="contained" onPress={updateList}>
                            Mentés
                        </Button>
                    </Card>
                </Modal>
            </Portal>
            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => setVisible(true)}
            />
            <Portal>
                <ShareListModal
                    visible={shareVisible}
                    onDismiss={() => {
                        setShareVisible(false);
                        setSharingList(null);
                    }}
                    listId={selectedListId}
                    members={lists.find(l => l.id === selectedListId)?.members ?? []}
                />
            </Portal>
        </SafeAreaView>
    );
}