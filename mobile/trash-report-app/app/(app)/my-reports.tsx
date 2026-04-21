import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Platform, StatusBar,
  Modal, ScrollView, Alert, Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getToken, API_URL } from '../../services/api';

const GREEN = '#3DBFA0';

interface Report {
  _id: string;
  reportId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  fecha: string;
  evidencias: string[];
  status: 'Recibido' | 'Pendiente' | 'Cancelado' | 'Completado';
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Recibido:   { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' },
  Pendiente:  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  Cancelado:  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  Completado: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
};

// Muestra los primeros 8 chars del UUID para la UI
function shortId(reportId: string) {
  if (!reportId) return '#--------';
  return '#' + reportId.slice(0, 8).toUpperCase();
}

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Report | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function fetchReports() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/reports/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // Ya vienen ordenados desc desde el backend, pero garantizamos el orden
      const sorted = (data as Report[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setReports(sorted);
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

  async function handleCancel(report: Report) {
    Alert.alert(
      'Cancelar reporte',
      `¿Estás seguro de cancelar el reporte ${shortId(report._id)}?`,
      [
        { text: 'Volver atrás', style: 'cancel' },
        {
          text: 'Cancelar',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              const token = await getToken();
              const res = await fetch(`${API_URL}/reports/${report._id}/cancel`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message);
              // Actualizar lista localmente
              setReports((prev) =>
                prev.map((r) => r._id === report._id ? { ...r, status: 'Cancelado' } : r)
              );
              // Si el modal está abierto, actualizarlo también
              if (selected?._id === report._id) {
                setSelected((prev) => prev ? { ...prev, status: 'Cancelado' } : null);
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'No se pudo cancelar el reporte');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  function StatusBadge({ status }: { status: string }) {
    const colors = STATUS_COLORS[status] ?? STATUS_COLORS.Recibido;
    return (
      <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{status}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
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
            <Text style={styles.count}>
              {reports.length} reporte{reports.length !== 1 ? 's' : ''} · ordenados por fecha
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* ID + Status */}
              <View style={styles.cardTop}>
                <Text style={styles.reportId}>{shortId(item.reportId ?? item._id)}</Text>
                <StatusBadge status={item.status} />
              </View>

              {/* Dirección */}
              <Text style={styles.cardTitle} numberOfLines={2}>{item.locationName}</Text>

              {/* Fecha */}
              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>📅 {item.fecha}</Text>
                <Text style={styles.cardPhotos}>📷 {item.evidencias.length} foto{item.evidencias.length !== 1 ? 's' : ''}</Text>
              </View>

              {/* Botones */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.infoBtn}
                  onPress={() => setSelected(item)}
                >
                  <Text style={styles.infoBtnText}>ℹ️  Información</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelBtn, item.status !== 'Pendiente' && styles.cancelBtnDisabled]}
                  onPress={() => handleCancel(item)}
                  disabled={item.status !== 'Pendiente' || cancelling}
                >
                  <Text style={[styles.cancelBtnText, item.status !== 'Pendiente' && styles.cancelBtnTextDisabled]}>
                    {item.status === 'Cancelado' ? 'Cancelado' : item.status === 'Completado' ? 'Completado' : item.status === 'Recibido' ? 'Recibido' : '✕  Cancelar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* ── Modal de Información ── */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Información del Reporte</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* ID */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID de Reporte</Text>
                  <Text style={[styles.infoValue, { fontSize: 11 }]}>{selected.reportId ?? selected._id}</Text>
                </View>

                {/* Status */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado</Text>
                  <StatusBadge status={selected.status} />
                </View>

                {/* Dirección */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dirección</Text>
                  <Text style={styles.infoValue}>{selected.locationName}</Text>
                </View>

                {/* Fecha */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha</Text>
                  <Text style={styles.infoValue}>{selected.fecha}</Text>
                </View>

                {/* Coordenadas */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Coordenadas</Text>
                  <Text style={[styles.infoValue, { fontFamily: 'monospace' }]}>
                    {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
                  </Text>
                </View>

                {/* Mapa de ubicación */}
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                  <Text style={styles.infoLabel}>Ubicación en Mapa</Text>
                  <MapView
                    style={styles.mapView}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    initialRegion={{
                      latitude: selected.latitude,
                      longitude: selected.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker coordinate={{ latitude: selected.latitude, longitude: selected.longitude }} />
                  </MapView>
                </View>

                {/* Evidencias */}
                {selected.evidencias.length > 0 && (
                  <View style={styles.evidenciasSection}>
                    <Text style={styles.infoLabel}>Evidencias ({selected.evidencias.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {selected.evidencias.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.evidenciaThumb} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Botón cancelar desde modal — solo si está Pendiente */}
                {selected.status === 'Pendiente' && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { marginTop: 20 }]}
                    onPress={() => handleCancel(selected)}
                    disabled={cancelling}
                  >
                    {cancelling
                      ? <ActivityIndicator color="#EF4444" size="small" />
                      : <Text style={styles.cancelBtnText}>✕  Cancelar este reporte</Text>}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 70 },
  backText: { color: GREEN, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: GREEN, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: GREEN, fontWeight: '600' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  newBtn: { backgroundColor: GREEN, borderRadius: 25, paddingHorizontal: 24, paddingVertical: 12 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  list: { padding: 16, paddingBottom: 40 },
  count: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 14 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06,
    shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reportId: { fontSize: 12, fontWeight: '700', color: '#6B7280', fontFamily: 'monospace' },
  badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  cardMeta: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  cardDate: { fontSize: 12, color: '#6B7280' },
  cardPhotos: { fontSize: 12, color: '#6B7280' },

  // Botones de la card
  cardActions: { flexDirection: 'row', gap: 8 },
  infoBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  infoBtnText: { color: '#1D4ED8', fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    alignItems: 'center',
  },
  cancelBtnDisabled: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  cancelBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  cancelBtnTextDisabled: { color: '#9CA3AF' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalClose: { fontSize: 18, color: '#9CA3AF', fontWeight: '600', paddingLeft: 8 },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', flex: 1 },
  infoValue: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 2, textAlign: 'right' },

  evidenciasSection: { paddingTop: 12 },
  evidenciaThumb: { width: 90, height: 90, borderRadius: 10, marginRight: 8 },
  mapView: { width: '100%', height: 160, borderRadius: 12, marginTop: 8 },
});
