import { useState } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import {Modal, Card, Text, Button, IconButton, useTheme} from 'react-native-paper';
import { CATEGORY_GROUPS } from '../data/categoryGroups';

export default function CategoryPicker({ visible, onCancel, onSelectProduct }) {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const theme = useTheme();

    const handleCancel = () => {
        setSelectedGroup(null);
        onCancel();
    };

    const handleSelect = (name) => {
        onSelectProduct(name);
        setSelectedGroup(null);
        onCancel();
    };

    if (!selectedGroup) {
        return (
            <Modal visible={visible} onDismiss={handleCancel}>
                <Card style={{ margin: 16, padding: 16, maxHeight: '80%', backgroundColor: theme.colors.surface}}>
                    <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                        Válassz kategóriát
                    </Text>
                    <FlatList
                        data={CATEGORY_GROUPS}
                        keyExtractor={(item) => item.name}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => setSelectedGroup(item)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.surfaceVariant,
                                }}>
                                <Text style={{fontSize: 24, marginRight: 12 }}>{item.icon}</Text>
                                <Text variant="bodyLarge" style={{ flex: 1 }}>{item.name}</Text>
                                <IconButton icon="chevron-right" size={20} />
                            </TouchableOpacity>
                        )}
                    />
                    <Button onPress={handleCancel} style={{ marginTop: 8 }}>Mégse</Button>
                </Card>
            </Modal>
        );
    }

    return(
        <Modal visible={visible} onDismiss={handleCancel}>

            <Card style={{ margin: 16, padding: 16, maxHeight: '80%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <IconButton icon="arrow-left" onPress={() => setSelectedGroup(null)} />
                    <Text variant="titleMedium">{selectedGroup.icon} {selectedGroup.name}</Text>
                </View>

                <FlatList
                    data={selectedGroup.subcategories}
                    keyExtractor={(item) => item}
                    renderItem={({ item}) => (
                        <TouchableOpacity
                            onPress={() => handleSelect(item)}
                            style={{paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',}}>
                            <Text variant="bodyLarge">{item}</Text>
                        </TouchableOpacity>
                    )}
                />
                <Button onPress={handleCancel} style={{ marginTop: 8 }}>
                    Mégse
                </Button>
            </Card>
        </Modal>
    );
}