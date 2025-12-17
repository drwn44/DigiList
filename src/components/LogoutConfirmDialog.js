import { Portal, Dialog, Button, Text } from 'react-native-paper';

export default function LogoutConfirmDialog({ visible, onCancel, onConfirm }) {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onCancel}>
                <Dialog.Title>Kijelentkezés</Dialog.Title>
                <Dialog.Content>
                    <Text>Biztosan ki szeretnél jelentkezni?</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onCancel}>Mégse</Button>
                    <Button onPress={onConfirm} textColor="red">
                        Kijelentkezés
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}
