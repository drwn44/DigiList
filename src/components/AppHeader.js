import { Appbar } from 'react-native-paper';

export default function AppHeader({ title, onLogoutPress }) {
    return (
        <Appbar.Header>
            <Appbar.Content title={title} />
            <Appbar.Action
                icon="logout"
                onPress={onLogoutPress}
            />
        </Appbar.Header>
    );
}
