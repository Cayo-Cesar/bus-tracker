import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions, Platform, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importação condicional do Mapa
let MapView: any, Polyline: any, Marker: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Polyline = Maps.Polyline;
  Marker = Maps.Marker;
}

// --- CONFIGURAÇÕES ---
// --- CONFIGURAÇÕES ---
const AIO_USERNAME =  process.env.EXPO_PUBLIC_AIO_USERNAME || "";
const AIO_KEY = process.env.EXPO_PUBLIC_AIO_KEY || ""; 
const FEED_KEY = "localizacao"; 

export default function History() {
  const router = useRouter();
  
  // Estado da Data e dos Dados
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Região inicial (Teresina)
  const [region, setRegion] = useState({
    latitude: -5.092011,
    longitude: -42.803760,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Busca dados toda vez que a data mudar
  useEffect(() => {
    fetchHistoryRoute(date);
  }, [date]);

  const fetchHistoryRoute = async (selectedDate: Date) => {
    setLoading(true);
    setRouteCoordinates([]); // Limpa mapa anterior

    try {
      // 1. Configurar Inicio e Fim do dia selecionado (em UTC)
      // Ajuste simples para garantir que pegamos o dia todo
      const startTime = new Date(selectedDate);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(23, 59, 59, 999);

      // Converter para ISO String que a API aceita
      const startISO = startTime.toISOString();
      const endISO = endTime.toISOString();

      console.log(`Buscando de ${startISO} até ${endISO}`);

      // 2. Fazer a requisição filtrada por data
      const response = await axios.get(
        `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${FEED_KEY}/data`, 
        { 
            headers: { 'X-AIO-Key': AIO_KEY },
            params: {
                start_time: startISO,
                end_time: endISO,
                limit: 1000 // Pega até 1000 pontos (bastante coisa)
            }
        }
      );

      const points: any[] = [];

      // 3. Processar os dados
      // O Adafruit retorna do mais novo para o mais antigo. Vamos inverter para desenhar a linha corretamente.
      const rawData = response.data.reverse();

      rawData.forEach((item: any) => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (lat !== 0 && lon !== 0 && !isNaN(lat)) {
          points.push({ latitude: lat, longitude: lon });
        }
      });

      if (points.length > 0) {
        setRouteCoordinates(points);
        // Centraliza no meio do trajeto
        const middleIndex = Math.floor(points.length / 2);
        setRegion({
          latitude: points[middleIndex].latitude,
          longitude: points[middleIndex].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } else {
          Alert.alert("Sem dados", "Nenhuma rota encontrada para este dia.");
      }

    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      Alert.alert("Erro", "Falha ao baixar histórico.");
    } finally {
      setLoading(false);
    }
  };

  // Função chamada quando escolhe a data no calendário
  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false); // Fecha o calendário
    if (selectedDate) {
      setDate(selectedDate); // Atualiza estado (vai disparar o useEffect)
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Rota</Text>
      </View>

      {/* BARRA DE SELEÇÃO DE DATA */}
      <View style={styles.filterBar}>
          <Text style={styles.filterLabel}>Data Selecionada:</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <Text style={styles.dateText}>{date.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>
      </View>

      {/* COMPONENTE DE DATA (INVISÍVEL ATÉ CLICAR) */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()} // Não deixa selecionar futuro
        />
      )}

      {/* MAPA */}
      {Platform.OS !== 'web' ? (
        <MapView style={styles.map} region={region}>
           {/* A LINHA DA ROTA */}
           {routeCoordinates.length > 0 && (
             <Polyline
               coordinates={routeCoordinates}
               strokeColor="#2196F3"
               strokeWidth={4}
             />
           )}

           {/* Marcador INICIO (Verde) */}
           {routeCoordinates.length > 0 && (
             <Marker 
                coordinate={routeCoordinates[0]} 
                title="Início do Dia" 
                pinColor="green" 
             />
           )}

           {/* Marcador FIM (Vermelho) */}
           {routeCoordinates.length > 0 && (
             <Marker 
                coordinate={routeCoordinates[routeCoordinates.length - 1]} 
                title="Fim do Dia" 
                pinColor="red" 
             />
           )}
        </MapView>
      ) : (
        <View style={styles.webMessage}><Text>Histórico indisponível na Web</Text></View>
      )}

      {/* LOADING */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Carregando trajeto...</Text>
        </View>
      )}
      
      {/* RODAPÉ INFORMATIVO */}
      {!loading && routeCoordinates.length > 0 && (
          <View style={styles.footerInfo}>
              <Text style={styles.footerText}>{routeCoordinates.length} pontos registrados</Text>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20,
    backgroundColor: '#2196F3', flexDirection: 'row', alignItems: 'center',
    elevation: 4
  },
  backButton: { marginRight: 15 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  
  // Barra de Filtro
  filterBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: 15, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderColor: '#e0e0e0'
  },
  filterLabel: { fontSize: 16, color: '#555' },
  dateButton: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
      paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20,
      borderWidth: 1, borderColor: '#ddd', gap: 8
  },
  dateText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

  map: { width: Dimensions.get('window').width, flex: 1 },
  
  loadingOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)',
      zIndex: 10
  },
  loadingText: { marginTop: 10, fontWeight: 'bold', color: '#555' },
  webMessage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  footerInfo: {
      position: 'absolute', bottom: 30, alignSelf: 'center',
      backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 8,
      borderRadius: 20, elevation: 5
  },
  footerText: { fontWeight: 'bold', color: '#2196F3' }
});