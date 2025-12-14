import {FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {auth, db} from '../firebase.js';
import {addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, where} from 'firebase/firestore';
import {useEffect, useState} from "react";
import {Button, Card, Dialog, FAB, IconButton, Modal, Portal, Text, TextInput} from "react-native-paper";

export default function HomeScreen({ navigation }) {

    const [lists, setLists] = useState([]);
    const [visible, setVisible] = useState(false);
    const [listName, setListName] = useState('');
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedListId, setSelectedListId] = useState(null);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'lists'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setLists(data);
        });

        return unsubscribe;
    }, []);

    const createList = async () => {
        if (!listName.trim()) return;
        await addDoc(collection(db, 'lists'), {
            name: listName,
            userId: auth.currentUser.uid,
            createdAt: Timestamp.now(),
        });

        setListName('');
        setVisible(false);
    };

    const confirmDelete = async () => {
        await deleteDoc(doc(db, 'lists', selectedListId));
        setDeleteVisible(false);
        setSelectedListId(null);
    };



    return (
        <SafeAreaView style={{flex: 1}}>
            <Text variant="headlineMedium" style={{ paddingLeft: 16, marginBottom: 16 }}>
                Bevásárlólisták:
            </Text>
            <FlatList
                contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
                data={lists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card style={{ marginBottom: 8 }}>
                        <Card.Title
                            title={item.name}
                            right={(props) => (
                                <IconButton
                                    {...props}
                                    icon="delete"
                                    onPress={() => {
                                        setSelectedListId(item.id);
                                        setDeleteVisible(true);
                                    }}
                                />
                            )}
                        />
                    </Card>
                )}
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
                <Dialog
                    visible={deleteVisible}
                    onDismiss={() => setDeleteVisible(false)}
                >
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
            <FAB
                icon="plus"
                style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 16,
                }}
                onPress={() => setVisible(true)}
            />
        </SafeAreaView>
    );
}