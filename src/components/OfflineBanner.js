import { useTheme, Text } from 'react-native-paper';
import { View } from 'react-native';
import useNetworkStatus from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
    const isConnected = useNetworkStatus();
    const theme = useTheme();

    if (isConnected) return null;

    return (
        <View style={{
            backgroundColor: theme.colors.errorContainer,
            padding: 12,
            paddingHorizontal: 16,
        }}>
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, fontWeight: 'bold', marginBottom: 2 }}>
                Nincs internetkapcsolat
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.8 }}>
                Az offline módban létrehozott listák és hűségkártyák szinkronizálódnak, amint visszaáll a kapcsolat. A vonalkód és recept generálás nem elérhető offline módban.
            </Text>
        </View>
    );
}