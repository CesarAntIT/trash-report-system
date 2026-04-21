import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getToken, getUserProfile, updateUserProfile } from '../../services/api';
import MapPicker from '../../components/MapPicker';

const GREEN = '#3DBFA0';

export default function EditProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [addressText, setAddressText] = useState('');
  const [coords, setCoords]           = useState<{ latitude: number; longitude: number } | null>(null);
  const [showMap, setShowMap]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token || !userId) return;
        const data = await getUserProfile(userId, token);
        if (data.success) {
          setPhone(data.usuario.numero_telefono || '');
          setEmail(data.usuario.correo_electronico || '');
          setAddressText(data.usuario.direccion_personal || '');
          if (data.usuario.ubicacion) {
            setCoords({ latitude: data.usuario.ubicacion.latitud, longitude: data.usuario.ubicacion.longitud });
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token || !userId) return;

      const body: any = {};
      if (phone.trim()) body.phone = phone.trim();
      if (email.trim()) body.email = email.trim();
      if (addressText.trim() || coords) {
        body.address = {};
        if (addressText.trim()) body.address.text = addressText.trim();
        if (coords) {
          body.address.latitude = coords.latitude;
          body.address.longitude = coords.longitude;
        }
      }

      await updateUserProfile(userId, token, body);
      Alert.alert('Perfil actualizado', 'Tus datos han sido guardados.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}><ActivityIndicator size="large" color={GREEN} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>Los campos en blanco no modifican el dato actual.</Text>

        <Text style={styles.label}>Número de Teléfono</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>📱</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            placeholderTextColor="#AAAAAA"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.label}>Correo Electrónico</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>✉</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#AAAAAA"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Dirección Personal (texto)</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🏠</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Calle 5 #123, Colonia Centro"
            placeholderTextColor="#AAAAAA"
            value={addressText}
            onChangeText={setAddressText}
          />
        </View>

        <Text style={styles.label}>Ubicación en Mapa</Text>
        <TouchableOpacity style={styles.mapBtn} onPress={() => setShowMap(true)}>
          <Text style={styles.mapBtnIcon}>🗺️</Text>
          <Text style={styles.mapBtnText}>
            {coords
              ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
              : 'Seleccionar ubicación en mapa'}
          </Text>
        </TouchableOpacity>

        <MapPicker
          visible={showMap}
          initial={coords ?? undefined}
          onConfirm={(c) => setCoords(c)}
          onClose={() => setShowMap(false)}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  content: { padding: 20, paddingBottom: 48 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1F2937' },
  mapBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0FDF4', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  mapBtnIcon: { fontSize: 16, marginRight: 10 },
  mapBtnText: { flex: 1, fontSize: 13, color: '#065F46' },
  saveBtn: {
    backgroundColor: GREEN, borderRadius: 30, paddingVertical: 16,
    alignItems: 'center', marginTop: 28,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
