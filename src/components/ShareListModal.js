import { useEffect, useState } from 'react';
import { View } from 'react-native';
import {Modal, Card, Text, TextInput, IconButton, ActivityIndicator, useTheme} from 'react-native-paper';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function ShareListModal({ visible, onDismiss, listId, members = [] }) {
    const [email, setEmail] = useState('');
    const [memberDetails, setMemberDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const theme = useTheme();

    useEffect(() => {
        if (!visible || members.length === 0) return;

        const fetchMembers = async () => {
            const results = await Promise.all(
                members.map(async (uid) => {
                    const q = query(collection(db, 'users'), where('__name__', '==', uid));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        const data = snapshot.docs[0].data();
                        return { uid, email: data.email, displayName: data.displayName };
                    }
                    return { uid, email: 'Ismeretlen felhasználó' };
                })
            );
            setMemberDetails(results);
        };

        void fetchMembers();
    }, [visible, members]);

    const handleAdd = async () => {
        setAddError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;

        if (trimmed === auth.currentUser.email.toLowerCase()) {
            setAddError('Saját magaddal nem oszthatod meg.');
            return;
        }

        const alreadyMember = memberDetails.some(m => m.email === trimmed);
        if (alreadyMember) {
            setAddError('Ez a felhasználó már tag.');
            return;
        }

        try {
            setLoading(true);

            const q = query(collection(db, 'users'), where('email', '==', trimmed));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setAddError('Nem található felhasználó ezzel az email címmel.');
                return;
            }

            const newMemberUid = snapshot.docs[0].id;
            await updateDoc(doc(db, 'lists', listId), {
                members: arrayUnion(newMemberUid),
            });

            setEmail('');
        } catch (e) {
            setAddError('Hiba történt, próbáld újra.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (uid) => {
        try {
            await updateDoc(doc(db, 'lists', listId), {
                members: arrayRemove(uid),
            });
        } catch (e) {
        }
    };

    const handleDismiss = () => {
        setEmail('');
        setAddError('');
        onDismiss();
    };

    const ownerUid = members[0];

    return (
        <Modal visible={visible} onDismiss={handleDismiss}>
            <Card style={{ margin: 16, padding: 16 , backgroundColor: theme.colors.surface}}>
                <Text variant="titleMedium" style={{ marginBottom: 16 }}>
                    Lista megosztása
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <TextInput
                        label="Email cím"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setAddError('');
                        }}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{ flex: 1, marginRight: 8 }}
                    />
                    {loading
                        ? <ActivityIndicator style={{ marginLeft: 8 }} />
                        : <IconButton icon="send" onPress={handleAdd} />
                    }
                </View>

                {addError ? (
                    <Text style={{ color: theme.colors.error, marginBottom: 8, fontSize: 12 }}>
                        {addError}
                    </Text>
                ) : null}

                <Text variant="labelLarge" style={{ marginTop: 12, marginBottom: 8 }}>
                    Megosztva velük:
                </Text>

                {memberDetails.map((member) => (
                    <View
                        key={member.uid}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingVertical: 4,
                        }}
                    >
                        <Text style={{ flex: 1 }}>
                            {member.displayName ? `${member.displayName} (${member.email})` : member.email}
                            {member.uid === ownerUid ? '  👑' : ''}
                        </Text>

                        {member.uid !== ownerUid && member.uid !== auth.currentUser.uid && (
                            <IconButton
                                icon="close"
                                size={18}
                                onPress={() => handleRemove(member.uid)}
                            />
                        )}
                    </View>
                ))}
            </Card>
        </Modal>
    );
}