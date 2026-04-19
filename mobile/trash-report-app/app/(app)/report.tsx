import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { getToken, API_URL } from '../../services/api';
import MapPicker from '../../components/MapPicker';

const GREEN = '#3DBFA0';

function formatDate(date: Date) {
  return date.toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ReportScreen() {
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photos, setPhotos] = useState<{ uri: string; base64: string }[]>([]);
  const [fecha] = useState(formatDate(new Date()));
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // El botón se habilita solo si todos los campos están completos
  const canSubmit =
    locationName.trim().length > 0 &&
    latitude.trim().length > 0 &&
    longitude.trim().length > 0 &&
    photos.length >= 1;

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para agregar evidencias.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsMultipleSelection: false,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos((prev) => [...prev, { uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` }]);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar evidencias.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos((prev) => [...prev, { uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` }]);
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function getMyLocation() {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos tu ubicación para registrar el reporte.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude.toFixed(6));
      setLongitude(loc.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Introdúcela manualmente.');
    } finally {
      setLoadingLocation(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const token = await getToken();

      const evidencias = photos.map((p) => p.base64);

      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationName: locationName.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          fecha,
          evidencias,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al enviar el reporte');
      }

      Alert.alert('¡Reporte enviado!', 'Tu reporte fue registrado exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar el reporte');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Reporte</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Nombre de ubicación */}
        <Text style={styles.label}>Nombre de Ubicación <Text style={styles.required}>*</Text></Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>📍</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Parque Central, Calle 5 Norte..."
            placeholderTextColor="#AAAAAA"
            value={locationName}
            onChangeText={setLocationName}
          />
        </View>

        {/* Ubicación */}
        <Text style={styles.label}>Ubicación (Coordenadas) <Text style={styles.required}>*</Text></Text>

        <View style={styles.locationBtns}>
          <TouchableOpacity style={[styles.locationBtn, { flex: 1, marginRight: 8 }]} onPress={getMyLocation} disabled={loadingLocation}>
            {loadingLocation
              ? <ActivityIndicator size="small" color={GREEN} />
              : <Text style={styles.locationBtnText}>📡 GPS</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.locationBtn, { flex: 1 }]} onPress={() => setShowMapPicker(true)}>
            <Text style={styles.locationBtnText}>🗺️ Mapa</Text>
          </TouchableOpacity>
        </View>

        <MapPicker
          visible={showMapPicker}
          initial={latitude && longitude ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) } : undefined}
          onConfirm={(coords) => {
            setLatitude(coords.latitude.toFixed(6));
            setLongitude(coords.longitude.toFixed(6));
          }}
          onClose={() => setShowMapPicker(false)}
        />

        <View style={styles.coordsRow}>
          <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputIcon}>↕</Text>
            <TextInput
              style={styles.input}
              placeholder="Latitud"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              value={latitude}
              onChangeText={setLatitude}
            />
          </View>
          <View style={[styles.inputWrap, { flex: 1 }]}>
            <Text style={styles.inputIcon}>↔</Text>
            <TextInput
              style={styles.input}
              placeholder="Longitud"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              value={longitude}
              onChangeText={setLongitude}
            />
          </View>
        </View>

        {/* Fecha automática */}
        <Text style={styles.label}>Fecha</Text>
        <View style={[styles.inputWrap, styles.fechaWrap]}>
          <Text style={styles.inputIcon}>📅</Text>
          <Text style={styles.fechaText}>{fecha}</Text>
          <View style={styles.autoTag}>
            <Text style={styles.autoTagText}>Automático</Text>
          </View>
        </View>

        {/* Evidencias */}
        <Text style={styles.label}>
          Evidencias <Text style={styles.required}>*</Text>
          <Text style={styles.labelHint}> (mínimo 1 foto)</Text>
        </Text>

        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnEmoji}>📷</Text>
            <Text style={styles.photoBtnText}>Cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
            <Text style={styles.photoBtnEmoji}>🖼️</Text>
            <Text style={styles.photoBtnText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {photos.length === 0 && (
          <View style={styles.noPhotosBox}>
            <Text style={styles.noPhotosText}>No hay evidencias agregadas</Text>
          </View>
        )}

        <View style={styles.photosGrid}>
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(i)}>
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Indicador de campos */}
        {!canSubmit && (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              {!locationName.trim() ? '· Agrega el nombre de ubicación\n' : ''}
              {!latitude || !longitude ? '· Agrega las coordenadas o usa tu ubicación\n' : ''}
              {photos.length === 0 ? '· Agrega al menos 1 foto de evidencia' : ''}
            </Text>
          </View>
        )}

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Enviar Reporte</Text>}
        </TouchableOpacity>

      </ScrollView>
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

  content: { padding: 20, paddingBottom: 48 },

  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  required: { color: '#EF4444' },
  labelHint: { fontWeight: '400', color: '#9CA3AF' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#1F2937' },

  // Ubicación
  locationBtns: { flexDirection: 'row', marginBottom: 10 },
  locationBtn: {
    backgroundColor: '#ECFDF5', borderRadius: 12, borderWidth: 1,
    borderColor: '#A7F3D0', paddingVertical: 13, alignItems: 'center',
  },
  locationBtnText: { color: GREEN, fontWeight: '600', fontSize: 14 },
  coordsRow: { flexDirection: 'row' },

  // Fecha
  fechaWrap: { backgroundColor: '#F9FAFB' },
  fechaText: { flex: 1, paddingVertical: 13, fontSize: 14, color: '#6B7280' },
  autoTag: {
    backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  autoTagText: { color: GREEN, fontSize: 10, fontWeight: '700' },

  // Fotos
  photoActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  photoBtn: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed',
    paddingVertical: 16, alignItems: 'center',
  },
  photoBtnEmoji: { fontSize: 26, marginBottom: 4 },
  photoBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  noPhotosBox: {
    backgroundColor: '#FEF3C7', borderRadius: 10, borderWidth: 1,
    borderColor: '#FDE68A', padding: 12, alignItems: 'center', marginBottom: 12,
  },
  noPhotosText: { color: '#92400E', fontSize: 13 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  photoItem: { position: 'relative' },
  photoThumb: { width: 90, height: 90, borderRadius: 10 },
  removePhoto: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#EF4444', borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Hint
  hintBox: {
    backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1,
    borderColor: '#FED7AA', padding: 12, marginTop: 12,
  },
  hintText: { color: '#9A3412', fontSize: 12, lineHeight: 20 },

  // Submit
  submitBtn: {
    backgroundColor: GREEN, borderRadius: 30, paddingVertical: 16,
    alignItems: 'center', marginTop: 20,
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
});
