import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

const ClientsScreen = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchClients = async () => {
        try {
            const response = await apiClient.get('/clients/');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchClients();
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.clientName}>{item.name}</Text>

            {item.email && (
                <Text style={styles.clientDetail}>✉️ {item.email}</Text>
            )}

            {item.phone && (
                <Text style={styles.clientDetail}>📞 {item.phone}</Text>
            )}

            {item.address && (
                <Text style={styles.clientDetail}>📍 {item.address}</Text>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Müştərilər</Text>
            </View>
            <FlatList
                data={clients}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Heç bir müştəri tapılmadı.</Text>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    clientName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    clientDetail: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 24,
    },
});

export default ClientsScreen;
