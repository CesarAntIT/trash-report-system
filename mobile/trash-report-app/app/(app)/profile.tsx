import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { getToken, getUserProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const GREEN = '#3DBFA0';

interface UserProfile {
  id: string;
  nombre_completo: string;
  correo_electronico: string;
  numero_telefono: string;
  direccion_personal: string;
  ubicacion: { latitud: number; longitud: number } | null;
}

export default function ProfileScreen() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const t = await getToken();
        if (!t) return;
        const decoded = jwtDecode<{ userId: string }>(t);
        const data = await getUserProfile(decoded.userId, t);
        if (data.success) setProfile(data.usuario);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={{ color: '#EF4444' }}>No se pudo cargar el perfil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(app)/edit-profile', params: { userId: profile.id } })}
          style={styles.editBtn}
        >
          <Text style={styles.editBtnText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.nombre_completo.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profile.nombre_completo}</Text>
        </View>

        {/* Datos */}
        <View style={styles.card}>
          <InfoRow label="ID de Usuario" value={profile.id} mono />
          <InfoRow label="Nombre Completo" value={profile.nombre_completo} />
          <InfoRow label="Correo Electrónico" value={profile.correo_electronico} />
          <InfoRow label="Teléfono" value={profile.numero_telefono || '—'} />
          <InfoRow label="Dirección Personal" value={profile.direccion_personal || '—'} />
        </View>

        {/* Mapa de domicilio */}
        {profile.ubicacion && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación Personal</Text>
            <MapView
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              initialRegion={{
                latitude: profile.ubicacion.latitud,
                longitude: profile.ubicacion.longitud,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker coordinate={{ latitude: profile.ubicacion.latitud, longitude: profile.ubicacion.longitud }} />
            </MapView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, mono && rowStyles.mono]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  label: { fontSize: 13, color: '#6B7280', fontWeight: '600', flex: 1 },
  value: { fontSize: 13, color: '#1F2937', fontWeight: '500', flex: 2, textAlign: 'right' },
  mono: { fontFamily: 'monospace', fontSize: 11 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6F9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  editBtn: { width: 70, alignItems: 'flex-end' },
  editBtnText: { color: GREEN, fontSize: 15, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 30, color: '#fff', fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    marginBottom: 16, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 10 },
  map: { width: '100%', height: 180, borderRadius: 12, marginTop: 4 },
});
