import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput, Button, Card, ActivityIndicator, Portal, Dialog, RadioButton, Snackbar, IconButton, Divider } from 'react-native-paper';
import { collection, addDoc, query, where, onSnapshot, Timestamp, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AppHeader from '../components/AppHeader';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import Constants from 'expo-constants';

const GROQ_API_KEY = Constants.expoConfig.extra.groqApiKey;

export default function RecipeScreen() {
    const [dishName, setDishName] = useState('');
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [addToListVisible, setAddToListVisible] = useState(false);
    const [lists, setLists] = useState([]);
    const [selectedListId, setSelectedListId] = useState(null);
    const [newListName, setNewListName] = useState('');
    const [creatingNew, setCreatingNew] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [savedRecipes, setSavedRecipes] = useState([]);
    const [savedRecipesExpanded, setSavedRecipesExpanded] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;
        const q = query(
            collection(db, 'lists'),
            where('members', 'array-contains', auth.currentUser.uid)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLists(data);
            if (data.length > 0) setSelectedListId(data[0].id);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsubscribe = onSnapshot(
            collection(db, 'users', auth.currentUser.uid, 'recipes'),
            (snapshot) => {
                const data = snapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => b.savedAt?.seconds - a.savedAt?.seconds);
                setSavedRecipes(data);
            }
        );
        return () => unsubscribe();
    }, []);

    const generateRecipe = async () => {
        if (!dishName.trim()) return;
        setLoading(true);
        setError('');
        setRecipe(null);

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'user',
                            content: `Készíts egy részletes magyar nyelvű receptet ehhez az ételhez: "${dishName}".
                        
                                    Válaszolj CSAK valid JSON formátumban, semmi mást ne írj, még backtick-eket sem. A JSON struktúra:
                                    {
                                      "name": "Az étel neve",
                                      "servings": 4,
                                      "prepTime": "15 perc",
                                      "cookTime": "30 perc",
                                      "ingredients": [
                                        { "name": "Csirkemell", "quantity": "500", "unit": "g", "purchaseQuantity": "500", "purchaseUnit": "g" },
                                        { "name": "Hagyma", "quantity": "2", "unit": "db", "purchaseQuantity": "1", "purchaseUnit": "háló" }
                                      ],
                                      "steps": [
                                        "Első lépés leírása",
                                        "Második lépés leírása"
                                      ]
                                    }`
                        }
                    ],
                    temperature: 0.7,
                }),
            });

            const data = await response.json();
            const text = data.choices[0].message.content.trim();
            const parsed = JSON.parse(text);
            setRecipe(parsed);
        } catch (e) {
            console.error(e);
            setError('Nem sikerült a recept generálása. Próbáld újra!');
        } finally {
            setLoading(false);
        }
    };

    const saveRecipe = async () => {
        if (!recipe || !auth.currentUser) return;
        const recipeId = recipe.name.toLowerCase().replace(/\s+/g, '_');
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'recipes', recipeId), {
            ...recipe,
            savedAt: Timestamp.now(),
        });

        setSnackbarMessage(`"${recipe.name}" elmentve!`);
        setSnackbarVisible(true);
    };

    const deleteSavedRecipe = async (recipeId) => {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'recipes', recipeId));
    };

    const addIngredientsToList = async () => {
        if (!recipe) return;

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

        await Promise.all(
            recipe.ingredients.map(ingredient =>
                addDoc(collection(db, 'lists', targetListId, 'items'), {
                    name: ingredient.name,
                    done: false,
                    quantity: parseFloat(ingredient.purchaseQuantity) || 1,
                    unit: ingredient.purchaseUnit || 'db',
                    createdAt: Timestamp.now(),
                })
            )
        );

        const listName = creatingNew
            ? newListName
            : lists.find(l => l.id === targetListId)?.name;

        setAddToListVisible(false);
        setSnackbarMessage(`${recipe.ingredients.length} hozzávaló hozzáadva a(z) "${listName}" listához!`);
        setSnackbarVisible(true);
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <AppHeader title="Recept generátor" onLogoutPress={() => setLogoutVisible(true)} />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

                {savedRecipes.length > 0 && (
                    <Card style={{ marginBottom: 16 }}>
                        <TouchableOpacity
                            onPress={() => setSavedRecipesExpanded(e => !e)}
                            style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
                        >
                            <Text variant="titleMedium" style={{ flex: 1 }}>
                                💾 Mentett receptek ({savedRecipes.length})
                            </Text>
                            <IconButton
                                icon={savedRecipesExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                            />
                        </TouchableOpacity>

                        {savedRecipesExpanded && (
                            <>
                                <Divider />
                                {savedRecipes.map((r, index) => (
                                    <View key={r.id}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setRecipe(r);
                                                setDishName(r.name);
                                                setSavedRecipesExpanded(false);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingHorizontal: 16,
                                                paddingVertical: 12,
                                            }}
                                        >
                                            <Text variant="bodyMedium" style={{ flex: 1 }}>{r.name}</Text>
                                            <Text variant="bodySmall" style={{ opacity: 0.4, marginRight: 4 }}>
                                                {r.servings} adag
                                            </Text>
                                            <IconButton
                                                icon="trash-can-outline"
                                                size={18}
                                                onPress={() => deleteSavedRecipe(r.id)}
                                            />
                                        </TouchableOpacity>
                                        {index < savedRecipes.length - 1 && <Divider />}
                                    </View>
                                ))}
                            </>
                        )}
                    </Card>
                )}

                <TextInput
                    label="Milyen ételt szeretnél főzni?"
                    value={dishName}
                    onChangeText={setDishName}
                    style={{ marginBottom: 12 }}
                />
                <Button
                    mode="contained"
                    onPress={generateRecipe}
                    loading={loading}
                    disabled={loading || !dishName.trim()}
                    icon="chef-hat"
                >
                    Recept generálása
                </Button>

                {error ? (
                    <Text style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>
                        {error}
                    </Text>
                ) : null}

                {loading && (
                    <View style={{ alignItems: 'center', marginTop: 32, gap: 12 }}>
                        <ActivityIndicator size="large" />
                        <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                            Recept generálása folyamatban...
                        </Text>
                    </View>
                )}

                {recipe && !loading && (
                    <View style={{ marginTop: 24 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text variant="headlineMedium" style={{ fontWeight: 'bold', flex: 1 }}>
                                {recipe.name}
                            </Text>
                            <IconButton
                                icon="content-save"
                                size={24}
                                onPress={saveRecipe}
                            />
                        </View>
                        <Text variant="bodySmall" style={{ opacity: 0.5, marginBottom: 16 }}>
                            {recipe.servings} adag · Előkészítés: {recipe.prepTime} · Főzés: {recipe.cookTime}
                        </Text>

                        <Card style={{ marginBottom: 16 }}>
                            <Card.Title title="Hozzávalók" />
                            <Card.Content>
                                {recipe.ingredients.map((ing, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'space-between',
                                            paddingVertical: 6,
                                            borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                                            borderBottomColor: '#f0f0f0',
                                        }}
                                    >
                                        <Text variant="bodyMedium">{ing.name}</Text>
                                        <Text variant="bodyMedium" style={{ opacity: 0.6 }}>
                                            {ing.quantity} {ing.unit}
                                        </Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>

                        <Button
                            mode="contained"
                            icon="cart-plus"
                            onPress={() => {
                                setCreatingNew(false);
                                setNewListName('');
                                setAddToListVisible(true);
                            }}
                            style={{ marginBottom: 16 }}
                        >
                            Hozzávalók listához adása
                        </Button>

                        <Card>
                            <Card.Title title="Elkészítés" />
                            <Card.Content>
                                {recipe.steps.map((step, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            marginBottom: 12,
                                            gap: 12,
                                        }}
                                    >
                                        <View style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 14,
                                            backgroundColor: '#6200ee',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                                                {index + 1}
                                            </Text>
                                        </View>
                                        <Text variant="bodyMedium" style={{ flex: 1, paddingTop: 4 }}>
                                            {step}
                                        </Text>
                                    </View>
                                ))}
                            </Card.Content>
                        </Card>
                    </View>
                )}
            </ScrollView>

            <Portal>
                <Dialog visible={addToListVisible} onDismiss={() => setAddToListVisible(false)}>
                    <Dialog.Title>Hozzávalók listához adása</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodySmall" style={{ marginBottom: 12, opacity: 0.6 }}>
                            {recipe?.ingredients.length} hozzávaló kerül a listára
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
                        <Button mode="contained" onPress={addIngredientsToList}>
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
                }}
            />

            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
            >
                {snackbarMessage}
            </Snackbar>
        </SafeAreaView>
    );
}