import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getToken, API_URL } from '../../services/api';

const GREEN = '#3DBFA0';

interface Report {
  _id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  fecha: string;
  evidencias: string[];
  createdAt: string;
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function fetchReports() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/reports/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReports(data);
      setError('');
    } catch (e: any) {
      setError(e.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchReports(); }, []);

  function onRefresh() {
    setRefreshing(true);
    fetchReports();
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Reportes</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReports}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Sin reportes aún</Text>
          <Text style={styles.emptyDesc}>Crea tu primer reporte desde el dashboard</Text>
          <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(app)/report')}>
            <Text style={styles.newBtnText}>+ Nuevo Reporte</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />}
          ListHeaderComponent={
            <Text style={styles.count}>{reports.length} reporte{reports.length !== 1 ? 's' : ''}</Text>
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardNumber}>
                  <Text style={styles.cardNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.locationName}</Text>
                  <Text style={styles.cardDate}>{item.fecha}</Text>
                </View>
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeText}>📷 {item.evidencias.length}</Text>
                </View>
              </View>
              <View style={styles.cardCoords}>
                <Text style={styles.coordsText}>📍 {item.latitude}, {item.longitude}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 70 },
  backText: { color: GREEN, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  retryBtn: {
    borderWidth: 1, borderColor: GREEN, borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  retryText: { color: GREEN, fontWeight: '600' },

  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  newBtn: {
    backgroundColor: GREEN, borderRadius: 25,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, paddingBottom: 32 },
  count: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginBottom: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardNumber: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center',
  },
  cardNumberText: { color: GREEN, fontWeight: '700', fontSize: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  photoBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  photoBadgeText: { fontSize: 12, color: GREEN, fontWeight: '600' },
  cardCoords: {
    backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8,
  },
  coordsText: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
});
