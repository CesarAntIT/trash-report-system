import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getToken } from '../../services/api';
import { getNotifications, markNotificationRead } from '../../services/api';

const GREEN = '#3DBFA0';

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchNotifications() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getNotifications(token);
      setNotifications(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchNotifications(); }, []);

  async function handleTap(notif: Notification) {
    if (notif.read) return;
    try {
      const token = await getToken();
      if (!token) return;
      await markNotificationRead(notif._id, token);
      // Desaparece al tocarla (criterio: "desaparecen al tocarlas")
      setNotifications(prev => prev.filter(n => n._id !== notif._id));
    } catch {}
  }

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 70 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={[...unread, ...read]}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              colors={[GREEN]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptyDesc}>Aquí aparecerán los cambios de estado de tus reportes</Text>
            </View>
          }
          ListHeaderComponent={
            unread.length > 0 ? (
              <Text style={styles.sectionLabel}>Toca una notificación para marcarla como leída</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, item.read && styles.cardRead]}
              onPress={() => handleTap(item)}
              activeOpacity={item.read ? 1 : 0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{item.read ? '✓' : '🔔'}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardMessage, item.read && styles.cardMessageRead]}>
                  {item.message}
                </Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleString('es-MX')}
                </Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
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
    backgroundColor: '#FFFFFF', paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 70 },
  backText: { color: GREEN, fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 10, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: GREEN,
  },
  cardRead: { borderLeftColor: '#E5E7EB', opacity: 0.6 },
  cardLeft: { marginRight: 12 },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardMessage: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  cardMessageRead: { fontWeight: '400', color: '#6B7280' },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: GREEN, marginLeft: 8,
  },
});
