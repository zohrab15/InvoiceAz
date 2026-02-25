import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import apiClient from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CURRENCY_SYMBOLS } from '../utils/currency';

const DashboardScreen = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/dashboard/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <Text style={styles.headerTitle}>Panel</Text>

                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                        <Text style={styles.statLabel}>Ümumi Məbləğ</Text>
                        <Text style={styles.statValue}>
                            {stats?.total_amount || 0} {CURRENCY_SYMBOLS[stats?.currency] || '₼'}
                        </Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                        <Text style={styles.statLabel}>Ödənilmiş</Text>
                        <Text style={styles.statValue}>
                            {stats?.paid_amount || 0} {CURRENCY_SYMBOLS[stats?.currency] || '₼'}
                        </Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                        <Text style={styles.statLabel}>Gözlənilən</Text>
                        <Text style={styles.statValue}>
                            {stats?.pending_amount || 0} {CURRENCY_SYMBOLS[stats?.currency] || '₼'}
                        </Text>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
                        <Text style={styles.statLabel}>Gecikmiş</Text>
                        <Text style={styles.statValue}>
                            {stats?.overdue_amount || 0} {CURRENCY_SYMBOLS[stats?.currency] || '₼'}
                        </Text>
                    </View>
                </View>

                {stats?.recent_invoices?.length > 0 && (
                    <View style={styles.recentSection}>
                        <Text style={styles.sectionTitle}>Son Fakturalar</Text>
                        {stats.recent_invoices.map((inv, index) => (
                            <View key={index} style={styles.recentItem}>
                                <View>
                                    <Text style={styles.recentClient}>{inv.client_name}</Text>
                                    <Text style={styles.recentDate}>{inv.issue_date}</Text>
                                </View>
                                <Text style={styles.recentAmount}>{inv.total_amount} {CURRENCY_SYMBOLS[inv.currency] || '₼'}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6', // gray-100
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827', // gray-900
        marginBottom: 20,
    },
    statsContainer: {
        gap: 12,
    },
    statCard: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 14,
        color: '#6b7280', // gray-500
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937', // gray-800
    },
    recentSection: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    recentItem: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    recentClient: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    recentDate: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    recentAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
});

export default DashboardScreen;
