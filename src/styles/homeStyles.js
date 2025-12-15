import { StyleSheet } from 'react-native';

export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.6,
    },
    card: {
        marginBottom: 8,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 80
    },
});