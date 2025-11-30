import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, TouchableOpacity, Linking, StatusBar } from 'react-native';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons'; 

// --- TRUQUE PARA WEB ---
let MapView: any; 
let Marker: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

// --- CONFIGURAÇÕES ---
const AIO_USERNAME =  process.env.EXPO_PUBLIC_AIO_USERNAME || "";
const AIO_KEY = process.env.EXPO_PUBLIC_AIO_KEY || ""; 
const API_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

export default function Index() {
  const router = useRouter(); 

  const [location, setLocation] = useState({
    latitude: -5.092011, 
    longitude: -42.803760,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [passengers, setPassengers] = useState('0');
  const [hasSignal, setHasSignal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('--:--');
  // NOVO ESTADO: SATÉLITES
  const [sats, setSats] = useState('0');

  const fetchData = async () => {
    try {
      const locResponse = await axios.get(`${API_URL}/localizacao/data/last`, { headers: { 'X-AIO-Key': AIO_KEY } });
      const lotResponse = await axios.get(`${API_URL}/lotacao/data/last`, { headers: { 'X-AIO-Key': AIO_KEY } });

      if (lotResponse.data) setPassengers(lotResponse.data.value);

      if (locResponse.data) {
        const lat = parseFloat(locResponse.data.lat);
        const lon = parseFloat(locResponse.data.lon);
        
        // NOVO: Lê a "elevação" como número de satélites
        if (locResponse.data.ele) setSats(locResponse.data.ele);

        if (lat !== 0 && lon !== 0) {
          setLocation({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
          setHasSignal(true);
          const now = new Date();
          setLastUpdate(`${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        }
      }
    } catch (error) {
      console.error("Erro na conexão:", error);
    }
  };

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval); 
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* MAPA */}
      {Platform.OS !== 'web' ? (
        <MapView style={styles.map} region={location}>
          {hasSignal && (
            <Marker
              coordinate={location}
              title={"Ônibus 01"}
              description={`Satélites: ${sats} | Lotação: ${passengers}`}
            >
                <View style={styles.markerContainer}>
                    <Ionicons name="bus" size={24} color="white" />
                </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={styles.webContainer}>
            <Ionicons name="warning-outline" size={50} color="#ff9800" />
            <Text style={styles.webTitle}>Modo Web</Text>
            <TouchableOpacity 
                style={styles.webButton}
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`)}
            >
                <Text style={styles.webButtonText}>Abrir Google Maps</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* CARD INFERIOR */}
      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>
            <Text style={styles.appTitle}>Rastreador Fantasmão</Text>
            
            {/* ÁREA DE STATUS (ONLINE + SATÉLITES) */}
            <View style={{flexDirection: 'row', gap: 8}}>
                
                {/* Badge Satélites (NOVO) */}
                <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="planet-outline" size={14} color="#1976D2" />
                    <Text style={[styles.statusText, { color: '#1976D2' }]}>
                        {sats} SAT
                    </Text>
                </View>

                {/* Badge Online */}
                <View style={[styles.statusBadge, { backgroundColor: hasSignal ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Ionicons name={hasSignal ? "wifi" : "wifi-outline"} size={14} color={hasSignal ? '#2E7D32' : '#C62828'} />
                    <Text style={[styles.statusText, { color: hasSignal ? '#2E7D32' : '#C62828' }]}>
                        {hasSignal ? "ON" : "OFF"}
                    </Text>
                </View>
            </View>
        </View>

        <View style={styles.statsContainer}>
            <View style={styles.statBox}>
                <View style={styles.iconCircle}>
                    <Ionicons name="people" size={24} color="#2196F3" />
                </View>
                <View>
                    <Text style={styles.statLabel}>Passageiros</Text>
                    <Text style={styles.statValue}>{passengers}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="time" size={24} color="#EF6C00" />
                </View>
                <View>
                    <Text style={styles.statLabel}>Atualizado</Text>
                    <Text style={styles.statValue}>{lastUpdate}</Text>
                </View>
            </View>
        </View>
        
        {/* BOTÕES DE AÇÃO */}

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#673AB7', marginTop: 10 }]} onPress={() => router.push('/history')}>
            <Text style={styles.actionButtonText}>Histórico de Rotas</Text>
            <Ionicons name="calendar-outline" size={20} color="white" />
        </TouchableOpacity>

        {!hasSignal && Platform.OS !== 'web' && (
             <Text style={styles.connectingText}>Sincronizando satélites...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  markerContainer: { backgroundColor: '#2196F3', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5 },
  bottomCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 20, paddingBottom: 40 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  appTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, gap: 4 },
  statusText: { fontWeight: 'bold', fontSize: 11 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderRadius: 15, padding: 15 },
  statBox: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  divider: { width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 15 },
  connectingText: { textAlign: 'center', color: '#999', marginTop: 15, fontStyle: 'italic', fontSize: 12 },
  webContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  webTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 10, color: '#333' },
  webButton: { marginTop: 20, backgroundColor: '#2196F3', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30 },
  webButtonText: { color: 'white', fontWeight: 'bold' },
  actionButton: { backgroundColor: '#2196F3', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 12, gap: 10, marginTop: 20, shadowColor: "#2196F3", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});