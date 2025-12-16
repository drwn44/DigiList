import { Portal, Dialog, Button, Text } from 'react-native-paper';

export default function ConfirmDeleteDialog({visible, onCancel, onConfirm, title = 'Törlés', message = 'Biztosan törölni szeretnéd?',}) {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onCancel}>
                <Dialog.Title>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text>{message}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onCancel}>Mégse</Button>
                    <Button onPress={onConfirm} textColor="red">
                        Törlés
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}
