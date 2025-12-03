# 🚌 Rastreador de Ônibus IoT (Project Fantasmão)

Um sistema completo de monitoramento de transporte público em tempo real, integrando hardware (IoT) e aplicação mobile. O sistema rastreia a localização via GPS, conta passageiros automaticamente via sensores ultrassônicos e exibe todas as métricas em um aplicativo mobile moderno e intuitivo.

## 🛠️ Funcionalidades

### 📡 Hardware (ESP32)

- **Geolocalização:** Envio de coordenadas (Latitude/Longitude) em tempo real via módulo GPS NEO-6M.
- **Contagem de Passageiros:** Sensor ultrassônico monitora a entrada de pessoas e atualiza o contador de lotação na nuvem.
- **Feedback Visual:**  
  - LED Verde → conexão GPS estabilizada  
  - LED Vermelho → buscando sinal  
- **Display OLED:** Exibição local de IP, status da conexão e contagem de passageiros para o motorista.

---

### 📱 Aplicativo Mobile (React Native)

- **Rastreamento em Tempo Real:** Mapa interativo mostrando a posição exata do ônibus com atualização a cada 3 segundos.
- **Status de Conexão:** Indicadores de Online/Offline e qualidade do sinal GPS (número de satélites).
- **Histórico de Rotas:** Calendário integrado que permite selecionar dias anteriores e visualizar o trajeto percorrido (breadcrumbs).
- **Modo Híbrido:** Suporte para Android/iOS (mapas nativos).

---

## 🧰 Tecnologias Utilizadas

### Mobile
- React Native (Expo SDK 52)  
- TypeScript  
- react-native-maps  
- axios  
- react-native-vector-icons  
- expo-router  
- @react-native-community/datetimepicker  

### Backend / Cloud
- **Adafruit IO**
- Protocolo: REST API (HTTPS)
- Feeds utilizados:  
  - `localizacao` (GPS + Satélites)  
  - `lotacao` (Contador de passageiros)

### Hardware (Firmware)
- ESP32 DevKit V1  
- C++ (Arduino IDE)  
- TinyGPS++  
- Adafruit_SSD1306  
- ArduinoHttpClient  

---

## 🔌 Esquema de Ligação (Pinout)

| Componente     | Pino ESP32 | Descrição                                      |
|----------------|------------|------------------------------------------------|
| GPS RX         | GPIO 16    | Recebimento de dados NMEA do GPS              |
| GPS TX         | GPIO 17    | Envio de comandos (opcional)                  |
| Trigger        | GPIO 5     | Gatilho do sensor ultrassônico                |
| Echo           | GPIO 18    | Leitura do retorno do sensor                  |
| SDA (OLED)     | GPIO 21    | Dados do Display I2C                           |
| SCL (OLED)     | GPIO 22    | Clock do Display I2C                           |
| LED Verde      | GPIO 27    | Indicador de GPS Fixado                        |
| LED Vermelho   | GPIO 14    | Indicador de Busca de Sinal                    |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- Node.js (v18 ou superior)  
- Conta no Adafruit IO (com feeds `localizacao` e `lotacao` criados)  
- App Expo Go instalado no celular  

---

### 1. Clonar o Repositório

```bash
git clone https://github.com/SEU-USUARIO/bus-tracker.git
cd bus-tracker/rastreamento-fantasmao
```
### 2. Configurar Variáveis de Ambiente

Crie um arquivo **.env** na raiz do projeto (mesma pasta do `package.json`) e adicione suas credenciais do Adafruit IO:

```env
EXPO_PUBLIC_AIO_USERNAME=seu_usuario_adafruit
EXPO_PUBLIC_AIO_KEY=sua_chave_aio_aqui
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Rodar o App

```bash
npx expo start --tunnel --clear
```
