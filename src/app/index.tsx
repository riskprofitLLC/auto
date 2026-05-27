import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';

// ВАЖНО: Если на телефоне - замените на реальный IP VM
const WS_URL = 'ws://10.0.2.2:8080';

interface Device {
  id: string;
  name: string;
  rssi: number;
}

export default function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [status, setStatus] = useState<string>('Отключено');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // ID устройства, к которому пытаемся подключиться прямо сейчас
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws?.close();
  }, []);

  const connectWebSocket = () => {
    const websocket = new WebSocket(WS_URL);
    websocket.onopen = () => {
      console.log('✅ WebSocket Connected');
      setStatus('Подключено к серверу');
    };
    websocket.onmessage = (e) => handleMessage(JSON.parse(e.data));
    websocket.onerror = () => setStatus('Ошибка подключения');
    websocket.onclose = () => {
      setStatus('Отключено');
      setIsScanning(false);
      setConnectingId(null);
    };
    setWs(websocket);
  };

  const handleMessage = (msg: any) => {
    switch (msg.type) {
      case 'DEVICE_FOUND':
        setDevices(prev => {
          const index = prev.findIndex(d => d.id === msg.data.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = msg.data;
            return updated;
          }
          return [...prev, msg.data];
        });
        break;
      case 'CONNECTED':
        Alert.alert('Успех', `Подключено к ${msg.deviceId}`);
        setConnectingId(null); // Сброс ID
        setStatus('Подключено к устройству');
        break;
      case 'SERVICES_FOUND':
        Alert.alert('Информация', `Найдено ${msg.services.length} сервисов`);
        break;
      case 'SCAN_STOPPED':
        setIsScanning(false);
        setStatus('Поиск остановлен');
        break;
      case 'CANCELLED':
        // Сервер подтвердил отмену
        setConnectingId(null);
        setStatus('Подключение отменено');
        break;
      case 'ERROR':
        Alert.alert('Ошибка', msg.message);
        setConnectingId(null); // Сброс при ошибке
        break;
    }
  };

  const startScan = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      Alert.alert('Ошибка', 'Нет связи с сервером');
      return;
    }
    setDevices([]);
    setIsScanning(true);
    setStatus('Поиск устройств...');
    ws.send(JSON.stringify({ type: 'START_SCAN' }));
  };

  // Универсальная функция для кнопки "Остановить / Отмена"
  const handleStopOrCancel = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (connectingId) {
      // Если идет подключение -> Отменяем его
      ws.send(JSON.stringify({ type: 'CANCEL_CONNECT', deviceId: connectingId }));
      setConnectingId(null); // Сразу снимаем блокировку в UI
      setStatus('Отмена подключения...');
    } else {
      // Если просто сканирование -> Останавливаем поиск
      ws.send(JSON.stringify({ type: 'STOP_SCAN' }));
    }
  };

  const connectToDevice = (deviceId: string) => {
    if (!ws) return;
    setConnectingId(deviceId); // Запоминаем, что подключаемся к этому ID
    setStatus('Подключение...');
    ws.send(JSON.stringify({ type: 'CONNECT', deviceId }));
  };

  return (
      <View style={styles.container}>
        <Text style={styles.status}>Статус: {status}</Text>

        <View style={styles.buttons}>
          {/* Логика кнопки меняется в зависимости от состояния */}
          {!isScanning && !connectingId ? (
              <Button title="Начать поиск" onPress={startScan} />
          ) : (
              <Button
                  title={connectingId ? "Отмена" : "Остановить поиск"}
                  onPress={handleStopOrCancel}
                  color="#ff4444"
              />
          )}
        </View>

        <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isConnectingThis = connectingId === item.id;

              return (
                  <View style={styles.deviceItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deviceName}>
                        {item.name && item.name !== 'Unknown' ? item.name : 'Неизвестное устройство'}
                      </Text>
                      <Text style={styles.deviceId}>{item.id}</Text>
                      <Text style={styles.rssi}>Сигнал: {item.rssi}</Text>
                    </View>

                    {/* Кнопка Connect блокируется, если идет любое действие, кроме подключения к ЭТОМУ устройству */}
                    <Button
                        title={isConnectingThis ? "..." : "Подключить"}
                        onPress={() => connectToDevice(item.id)}
                        disabled={!!connectingId && !isConnectingThis}
                    />
                  </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {isScanning ? 'Сканирование...' : 'Устройства не найдены.'}
              </Text>
            }
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  status: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  buttons: { marginBottom: 16 },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  deviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  deviceId: { fontSize: 12, color: '#666' },
  rssi: { fontSize: 12, color: '#999' },
  empty: { textAlign: 'center', padding: 20, color: '#999', fontSize: 16 },
});