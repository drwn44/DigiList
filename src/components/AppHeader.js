import { useState } from 'react';
import { Modal } from 'react-native';
import {Appbar, PaperProvider, useTheme} from 'react-native-paper';
import ProfileScreen from '../screens/ProfileScreen';

export default function AppHeader({ title }) {
    const [profileVisible, setProfileVisible] = useState(false);
    const theme = useTheme();

    return(
        <>
            <Appbar.Header statusBarHeight={0}>
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
                <PaperProvider theme={theme}>
                    <ProfileScreen onClose={() => setProfileVisible(false)} />
                </PaperProvider>
            </Modal>
        </>
    );
}