import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getToken, API_URL } from '../../services/api';

const GREEN = '#3DBFA0';

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const [totalReportes, setTotalReportes] = useState(0);

  useFocusEffect(
    useCallback(() => {
      async function loadCount() {
        try {
          const token = await getToken();
          const res = await fetch(`${API_URL}/reports/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (Array.isArray(data)) setTotalReportes(data.length);
        } catch {}
      }
      loadCount();
    }, [])
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>TrashReport</Text>
          <Text style={styles.headerSub}>Panel principal</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Banner ── */}
        <View style={styles.banner}>
          <View style={styles.bannerCircle1} />
          <View style={styles.bannerCircle2} />
          <Text style={styles.bannerIcon}>🗑️</Text>
          <Text style={styles.bannerTitle}>Reporta basura{'\n'}en tu ciudad</Text>
          <Text style={styles.bannerSub}>Ayuda a mantener limpia tu comunidad{'\n'}reportando puntos de acumulación</Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push('/(app)/report')}
          >
            <Text style={styles.reportBtnText}>+ Nuevo Reporte</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats cards ── */}
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: GREEN }]}>
            <Text style={styles.statNumber}>{totalReportes}</Text>
            <Text style={styles.statLabel}>Mis reportes</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>En proceso</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Resueltos</Text>
          </View>
        </View>

        {/* ── Quick actions ── */}
        <Text style={styles.sectionTitle}>Acciones</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(app)/report')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
            <Text style={styles.actionEmoji}>📍</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Reportar basura</Text>
            <Text style={styles.actionDesc}>Indica un punto con acumulación de basura</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(app)/my-reports')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.actionEmoji}>📋</Text>
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Mis reportes</Text>
            <Text style={styles.actionDesc}>Ver historial de tus reportes</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F9' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  logoutText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  content: { padding: 20, paddingBottom: 40 },

  // Banner
  banner: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
  },
  bannerCircle1: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)', top: -40, right: -40,
  },
  bannerCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: 20,
  },
  bannerIcon: { fontSize: 36, marginBottom: 10 },
  bannerTitle: {
    fontSize: 22, fontWeight: '800', color: '#FFFFFF', lineHeight: 28, marginBottom: 8,
  },
  bannerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, marginBottom: 20,
  },
  reportBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
  },
  reportBtnText: { color: GREEN, fontWeight: '700', fontSize: 14 },

  // Stats
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  // Actions
  actionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  actionEmoji: { fontSize: 22 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  actionDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  actionArrow: { fontSize: 22, color: '#D1D5DB', fontWeight: '300' },
});
