// 1. IMPORTS
// React e Hooks essenciais (useState para memória, useEffect para conexão)
import React, { useState, useEffect } from 'react';
// Componentes visuais do React Native (View, Texto, Alertas)
import { StyleSheet, View, Text, Alert } from 'react-native';
// Biblioteca de Mapas
import MapView, { Marker } from 'react-native-maps';
// Biblioteca de comunicação MQTT (Protocolo de IoT)
import Paho from 'paho-mqtt';

// --- 2. CONFIGURAÇÕES (CONSTANTES) ---
// Essas variáveis não mudam, por isso ficam fora da função App.
// Aqui você coloca as chaves que pegou no site do Adafruit IO.
const ADAFRUIT_USER = 'SEU_USUARIO_AQUI'; 
const ADAFRUIT_KEY = 'SUA_KEY_AQUI';
const FEED_NAME = 'localizacao-onibus'; 

// Endereço do servidor do Adafruit e a porta segura (WSS - WebSockets Secure)
const MQTT_HOST = 'io.adafruit.com';
const MQTT_PORT = 443;
const MQTT_PATH = '/mqtt';

// --- 3. O APLICATIVO (COMPONENTE PRINCIPAL) ---
export default function App() {

  // --- ESTADOS (MEMÓRIA DO APP) ---
  
  // 'busLocation': guarda onde o ônibus está agora.
  // 'setBusLocation': é a função que usamos para atualizar essa posição.
  const [busLocation, setBusLocation] = useState({
    latitude: -5.057488,  // Começa na UFPI (padrão)
    longitude: -42.797920,
  });

  // 'isConnected': guarda se estamos online ou offline para mostrar na tela.
  const [isConnected, setIsConnected] = useState(false);

  // Região inicial da câmera do mapa (Zoom e Centro)
  const initialRegion = {
    latitude: -5.057488,
    longitude: -42.797920,
    latitudeDelta: 0.015, // Nível de Zoom
    longitudeDelta: 0.015,
  };

  // --- LÓGICA DE CONEXÃO (RODA AO INICIAR) ---
  useEffect(() => {
    // Tudo aqui dentro roda apenas UMA vez, quando o App abre.

    // Gera um ID aleatório pro seu celular. O servidor precisa saber quem é quem.
    const clientID = 'client-' + Math.floor(Math.random() * 10000);
    
    // Cria o objeto 'client' que vai gerenciar a conexão
    const client = new Paho.Client(MQTT_HOST, MQTT_PORT, MQTT_PATH, clientID);

    // --- CONFIGURANDO O QUE FAZER QUANDO ALGO ACONTECE ---

    // 1. Se a internet cair:
    client.onConnectionLost = (responseObject: any) => {
      if (responseObject.errorCode !== 0) {
        console.log("Conexão perdida: " + responseObject.errorMessage);
        setIsConnected(false); // Muda o status para Offline
      }
    };

    // 2. Se CHEGAR uma mensagem nova do ônibus:
    client.onMessageArrived = (message: any) => {
      console.log("Chegou mensagem:", message.payloadString);
      
      try {
        const payload = message.payloadString; // Pega o texto da mensagem
        let newLat, newLng;

        // Verifica se veio em formato JSON (ex: {"lat": -5, "lng": -42})
        if (payload.includes('{')) {
           const data = JSON.parse(payload);
           newLat = parseFloat(data.lat); // Converte texto pra número
           newLng = parseFloat(data.lng);
        } else {
           // Ou se veio separado por vírgula (ex: -5.05, -42.79)
           const parts = payload.split(',');
           newLat = parseFloat(parts[0]);
           newLng = parseFloat(parts[1]);
        }

        // A MÁGICA ACONTECE AQUI:
        // Atualizamos a memória (State). O React percebe isso e move o pino no mapa sozinho.
        setBusLocation({
          latitude: newLat,
          longitude: newLng
        });

      } catch (e) {
        console.log("Erro ao ler coordenadas. O formato está errado?", e);
      }
    };

    // --- CONECTANDO DE FATO ---
    client.connect({
      useSSL: true, // Segurança (obrigatório para Adafruit via Web)
      userName: ADAFRUIT_USER, // Seu login
      password: ADAFRUIT_KEY,  // Sua senha/key
      
      // Se conectar com sucesso:
      onSuccess: () => {
        console.log("Conectado ao Adafruit!");
        setIsConnected(true); // Muda o status para Online
        
        // Se inscreve no tópico para começar a escutar as mensagens
        // A estrutura é: usuario/feeds/nome-do-feed
        const topic = `${ADAFRUIT_USER}/feeds/${FEED_NAME}`;
        client.subscribe(topic);
      },
      
      // Se falhar (senha errada ou sem internet):
      onFailure: (e: any) => {
        console.log("Falha na conexão:", e);
        Alert.alert("Erro", "Não foi possível conectar ao servidor.");
      }
    });

    // Função de limpeza: Roda se o usuário fechar o app
    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []); // Os colchetes vazios [] garantem que isso só rode 1 vez.

  // --- 4. A TELA (O QUE O USUÁRIO VÊ) ---
  return (
    <View style={styles.container}>
      {/* O MAPA */}
      <MapView style={styles.map} initialRegion={initialRegion}>
        
        {/* O PINO (MARCADOR) */}
        <Marker
          coordinate={busLocation} // A posição do pino vem do Estado
          title="Fantasmão"
          description={isConnected ? "Rastreamento Ativo" : "Desconectado..."}
          pinColor="blue"
        />
      </MapView>

      {/* PAINEL DE STATUS (QUADRADO BRANCO) */}
      <View style={styles.statusPanel}>
        <Text style={styles.statusText}>
          {/* Operador ternário: Se conectado mostra verde, senão vermelho */}
          Status: {isConnected ? '🟢 Online' : '🔴 Offline'}
        </Text>
      </View>
    </View>
  );
}

// --- ESTILOS (CSS DO REACT NATIVE) ---
const styles = StyleSheet.create({
  container: { flex: 1 }, // Ocupa a tela toda
  map: { width: '100%', height: '100%' }, // Mapa ocupa tudo
  statusPanel: {
    position: 'absolute', // Flutua em cima do mapa
    top: 50, // Distância do topo
    left: 20, // Distância da esquerda
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8, // Bordas arredondadas
    elevation: 5, // Sombra
  },
  statusText: { fontWeight: 'bold' }
});