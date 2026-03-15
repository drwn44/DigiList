import { useState } from 'react';
import { Modal } from 'react-native';
import { Appbar } from 'react-native-paper';
import ProfileScreen from '../screens/ProfileScreen';

export default function AppHeader({ title }) {
    const [profileVisible, setProfileVisible] = useState(false);

    return(
        <>
            <Appbar.Header>
                <Appbar.Content title={title} />
                <Appbar.Action
                    icon="account-circle"
                    onPress={() => setProfileVisible(true)}
                />
            </Appbar.Header>

            <Modal
                visible={profileVisible}
                animationType="slide"
                onRequestClose={() => setProfileVisible(false)}
            >
                <ProfileScreen onClose={() => setProfileVisible(false)} />
            </Modal>
        </>
    );
}