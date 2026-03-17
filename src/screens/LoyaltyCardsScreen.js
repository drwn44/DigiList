import { useState, useEffect } from 'react';
import { View, FlatList, Modal as RNModal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, FAB, Card, Button, TextInput, Portal, Dialog, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import BarcodeDisplay from '../components/BarcodeDisplay';
import { auth, db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, Timestamp } from 'firebase/firestore';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';

import { useTheme } from 'react-native-paper';

export default function LoyaltyCardsScreen() {
    const [cards, setCards] = useState([]);
    const [addVisible, setAddVisible] = useState(false);
    const [scanVisible, setScanVisible] = useState(false);
    const [deleteVisible, setDeleteVisible] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [viewCard, setViewCard] = useState(null);
    const [cardName, setCardName] = useState('');
    const [barcodeValue, setBarcodeValue] = useState('');
    const [barcodeFormat, setBarcodeFormat] = useState('');
    const [fabOpen, setFabOpen] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = collection(db, 'users', auth.currentUser.uid, 'loyaltyCards');
        return onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCards(data);
        });
    }, []);

    const theme = useTheme();

    const normalizeFormat = (format) => {
        if (!format) return 'CODE128';
        const map = {
            'org.iso.EAN-13': 'EAN13',
            'org.iso.EAN-8': 'EAN8',
            'com.intermec.Code128': 'CODE128',
            'org.iso.Code39': 'CODE39',
            'org.gs1.UPC-A': 'UPC',
            'org.iso.QRCode': 'QR',
        };
        return map[format] || 'CODE128';
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        setScannedData({ type, data });
    };

    const saveCard = async () => {
        if (!cardName.trim() || !barcodeValue.trim()) return;

        await addDoc(collection(db, 'users', auth.currentUser.uid, 'loyaltyCards'), {
            name: cardName,
            barcodeValue,
            barcodeFormat,
            createdAt: Timestamp.now(),
        });

        setCardName('');
        setBarcodeValue('');
        setBarcodeFormat('');
        setAddVisible(false);
    };

    const confirmDelete = async () => {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'loyaltyCards', selectedCardId));
        setDeleteVisible(false);
        setSelectedCardId(null);
    };

    const openScanner = async () => {
        if (!permission?.granted) {
            await requestPermission();
        }
        setFabOpen(false);
        setScanVisible(true);
    };

    const openManual = () => {
        setFabOpen(false);
        setBarcodeValue('');
        setBarcodeFormat('CODE128');  // default format for manual entry
        setAddVisible(true);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <AppHeader title="Hűségkártyák"/>
            <FlatList
                contentContainerStyle={{ padding: 16, paddingBottom: 96, flexGrow: cards.length === 0 ? 1 : 0 }}
                data={cards}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <EmptyState
                        title="Nincs még hűségkártyád"
                        subtitle="Adj hozzá egyet a + gombbal"
                    />
                }
                renderItem={({ item }) => (
                    <Card
                        style={{ marginBottom: 8, backgroundColor: theme.colors.surface }}
                        onPress={() => setViewCard(item)}
                        onLongPress={() => {
                            setSelectedCardId(item.id);
                            setDeleteVisible(true);
                        }}
                    >
                        <Card.Title
                            title={item.name}
                            subtitle={item.barcodeValue}
                            right={(props) => (
                                <IconButton
                                    {...props}
                                    icon="delete"
                                    onPress={() => {
                                        setSelectedCardId(item.id);
                                        setDeleteVisible(true);
                                    }}
                                />
                            )}
                        />
                    </Card>
                )}
            />

            <RNModal
                visible={!!viewCard}
                animationType="slide"
                onRequestClose={() => setViewCard(null)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background}}>
                    <View style={{ padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant}}>
                        <Text variant="headlineMedium">{viewCard?.name}</Text>
                    </View>

                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                        {viewCard && viewCard.barcodeValue ? (
                            <BarcodeDisplay
                                value={viewCard.barcodeValue}
                                format={viewCard.barcodeFormat || 'CODE128'}
                                height={160}
                            />
                        ) : (
                            <Text>Érvénytelen vonalkód</Text>
                        )}
                    </View>

                    <View style={{ padding: 24 }}>
                        <Button mode="contained" onPress={() => setViewCard(null)}>
                            Bezárás
                        </Button>
                    </View>
                </SafeAreaView>
            </RNModal>

            <RNModal
                visible={scanVisible}
                animationType="slide"
                onRequestClose={() => {
                    setScanVisible(false);
                    setScanned(false);
                    setScannedData(null);
                }}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
                    <CameraView
                        style={{ flex: 1 }}
                        facing="back"
                        onBarcodeScanned={handleBarCodeScanned}
                    />
                        <View style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            justifyContent: 'space-between',
                            padding: 24,
                        }}>

                            <View style={{
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: 12,
                                padding: 12,
                                alignItems: 'center',
                            }}>
                                <Text style={{ color: 'white', fontSize: 16 }}>
                                    Irányítsd a kamerát a vonalkódra
                                </Text>
                            </View>

                            <View style={{ alignItems: 'center' }}>
                                <View style={{
                                    width: 260,
                                    height: 240,
                                    borderWidth: 4,
                                    borderColor: scanned ? theme.colors.primary : 'white',
                                    borderRadius: 8,
                                    backgroundColor: 'transparent',
                                }} />
                            </View>

                            <View>
                                {scanned && scannedData ? (
                                    <View style={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        borderRadius: 12,
                                        padding: 16,
                                        alignItems: 'center',
                                        gap: 12,
                                    }}>
                                        <Text style={{ color: '#4CAF50', fontSize: 16, fontWeight: 'bold' }}>
                                            ✓ Vonalkód beolvasva
                                        </Text>
                                        <Text style={{ color: 'white', opacity: 0.8 }}>
                                            {scannedData.data}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <Button
                                                mode="outlined"
                                                textColor="white"
                                                style={{ borderColor: 'white' }}
                                                onPress={() => {
                                                    setScanned(false);
                                                    setScannedData(null);
                                                }}
                                            >
                                                Újra
                                            </Button>
                                            <Button
                                                mode="contained"
                                                onPress={() => {
                                                    setBarcodeValue(scannedData.data);
                                                    setBarcodeFormat(normalizeFormat(scannedData.type));
                                                    setScanned(false);
                                                    setScannedData(null);
                                                    setScanVisible(false);
                                                    setAddVisible(true);
                                                }}
                                            >
                                                Tovább
                                            </Button>
                                        </View>
                                    </View>
                                ) : (
                                    <Button
                                        mode="contained"
                                        buttonColor="rgba(0,0,0,0.6)"
                                        onPress={() => {
                                            setScanVisible(false);
                                            setScanned(false);
                                            setScannedData(null);
                                        }}
                                    >
                                        Mégse
                                    </Button>
                                )}
                            </View>
                        </View>
                </SafeAreaView>
            </RNModal>

            <Portal>
                <Dialog visible={addVisible} onDismiss={() => setAddVisible(false)}>
                    <Dialog.Title>Kártya hozzáadása</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Kártya neve (pl. Tesco)"
                            value={cardName}
                            onChangeText={setCardName}
                            style={{ marginBottom: 12 }}
                        />
                        <TextInput
                            label="Vonalkód szám"
                            value={barcodeValue}
                            onChangeText={setBarcodeValue}
                            keyboardType="number-pad"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setAddVisible(false)}>Mégse</Button>
                        <Button onPress={saveCard}>Mentés</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
                    <Dialog.Title>Kártya törlése</Dialog.Title>
                    <Dialog.Content>
                        <Text>Biztosan törölni szeretnéd ezt a kártyát?</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDeleteVisible(false)}>Mégse</Button>
                        <Button onPress={confirmDelete} textColor={theme.colors.primary}>Törlés</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB.Group
                open={fabOpen}
                visible
                icon={fabOpen ? 'close' : 'plus'}
                actions={[
                    {
                        icon: 'camera',
                        label: 'Beolvasás',
                        onPress: openScanner,
                    },
                    {
                        icon: 'keyboard',
                        label: 'Manuális',
                        onPress: openManual,
                    },
                ]}
                onStateChange={({ open }) => setFabOpen(open)}
            />
        </SafeAreaView>
    );
}