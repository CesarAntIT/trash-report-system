import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView, ActivityIndicator,
  Platform, StatusBar,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';

const GREEN = '#3DBFA0';

interface Coords {
  latitude: number;
  longitude: number;
}

interface MapPickerProps {
  visible: boolean;
  initial?: Coords;
  onConfirm: (coords: Coords) => void;
  onClose: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: 20.9674,
  longitude: -89.5926,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapPicker({ visible, initial, onConfirm, onClose }: MapPickerProps) {
  const [selected, setSelected] = useState<Coords | null>(initial || null);
  const [region, setRegion] = useState<Region>(
    initial
      ? { ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 }
      : DEFAULT_REGION,
  );
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Auto-locate when the modal opens (only if no initial coord provided)
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      setSelected(initial);
      setRegion({ ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      return;
    }
    autoLocate();
  }, [visible]);

  async function autoLocate() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: Coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const newRegion: Region = { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setSelected(coords);
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
    } catch {
      // silently fail — user can tap manually
    } finally {
      setLocating(false);
    }
  }

  function handlePress(e: MapPressEvent) {
    setSelected(e.nativeEvent.coordinate);
  }

  function handleConfirm() {
    if (selected) {
      onConfirm(selected);
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Seleccionar Ubicación</Text>
          <TouchableOpacity onPress={handleConfirm} disabled={!selected}>
            <Text style={[styles.confirmText, !selected && styles.confirmDisabled]}>
              Confirmar
            </Text>
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onPress={handlePress}
        >
          {selected && <Marker coordinate={selected} pinColor={GREEN} />}
        </MapView>

        <View style={styles.footer}>
          {locating ? (
            <View style={styles.locatingRow}>
              <ActivityIndicator size="small" color={GREEN} style={{ marginRight: 8 }} />
              <Text style={styles.hintText}>Obteniendo tu ubicación…</Text>
            </View>
          ) : selected ? (
            <View style={styles.coordsRow}>
              <Text style={styles.coordsText}>
                📍 {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity onPress={autoLocate} style={styles.relocateBtn}>
                <Text style={styles.relocateText}>📡 Mi ubicación</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.coordsRow}>
              <Text style={styles.hintText}>Toca el mapa para ajustar la ubicación</Text>
              <TouchableOpacity onPress={autoLocate} style={styles.relocateBtn}>
                <Text style={styles.relocateText}>📡 Mi ubicación</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 14,
    paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cancelText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  confirmText: { color: GREEN, fontSize: 15, fontWeight: '700' },
  confirmDisabled: { opacity: 0.3 },
  map: { flex: 1 },
  footer: {
    padding: 12, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  locatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  coordsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coordsText: { color: '#374151', fontSize: 13, fontFamily: 'monospace', flex: 1 },
  hintText: { color: '#9CA3AF', fontSize: 13, flex: 1 },
  relocateBtn: {
    backgroundColor: '#ECFDF5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  relocateText: { color: GREEN, fontSize: 12, fontWeight: '600' },
});
