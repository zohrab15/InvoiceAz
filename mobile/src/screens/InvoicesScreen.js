import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import apiClient from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';

const InvoicesScreen = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInvoices = async () => {
        try {
            const response = await apiClient.get('/invoices/');
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchInvoices();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return '#10b981'; // green-500
            case 'pending': return '#f59e0b'; // amber-500
            case 'overdue': return '#ef4444'; // red-500
            case 'draft': return '#6b7280'; // gray-500
            default: return '#6b7280';
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.clientName}>{item.client_name || item.client?.name}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View>
                    <Text style={styles.label}>Faktura №</Text>
                    <Text style={styles.value}>{item.invoice_number}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.label}>Məbləğ</Text>
                    <Text style={styles.amount}>{item.total_amount} ₼</Text>
                </View>
            </View>
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
                <Text style={styles.headerTitle}>Hesab-fakturalar</Text>
            </View>
            <FlatList
                data={invoices}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Heç bir hesab-faktura tapılmadı.</Text>
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clientName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    value: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 24,
    },
});

export default InvoicesScreen;
