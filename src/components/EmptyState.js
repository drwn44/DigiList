import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function EmptyState({ title, subtitle }) {
    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: 0.6,
                padding: 24,
            }}
        >
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                {title}
            </Text>
            {subtitle && (
                <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
}