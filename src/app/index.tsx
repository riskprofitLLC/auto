import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, Button, FlatList, StyleSheet, Platform, PermissionsAndroid,
  TouchableOpacity, Animated
} from 'react-native';
import { BleManager, BleError, BleErrorCode } from 'react-native-ble-plx';

interface BleDevice {
  id: string;
  name: string;
  rssi: number;
}

// 🍞 Компонент всплывающего уведомления (Toast)
const Toast = ({ message, visible, type = 'info' }: { message: string; visible: boolean; type?: 'success' | 'error' | 'info' }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 60, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!message && !visible) return null;

  const bgColor = type === 'error' ? '#E53935' : type === 'success' ? '#43A047' : '#1E88E5';

  return (
    <Animated.View style={[styles.toast, { opacity: fadeAnim, transform: [{ translateY }], backgroundColor: bgColor }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// 📡 Компонент индикатора сигнала
const SignalStrength = ({ rssi }: { rssi: number }) => {
  const getBarsCount = (rssiValue: number): number => {
    if (rssiValue >= -50) return 4;
    if (rssiValue >= -60) return 3;
    if (rssiValue >= -70) return 2;
    if (rssiValue >= -80) return 1;
    return 0;
  };

  const getSignalColor = (rssiValue: number): string => {
    if (rssiValue >= -60) return '#4CAF50';
    if (rssiValue >= -75) return '#FFC107';
    return '#F44336';
  };

  const barsCount = getBarsCount(rssi);
  const color = getSignalColor(rssi);

  return (
    <View style={styles.signalContainer}>
      {[1, 2, 3, 4].map((bar) => (
        <View
          key={bar}
          style={[
            styles.signalBar,
            { backgroundColor: bar <= barsCount ? color : '#E0E0E0', height: 4 + bar * 3 }
          ]}
        />
      ))}
      <Text style={styles.rssiText}>{rssi} дБм</Text>
    </View>
  );
};

export default function App() {
  const [bleManager] = useState(() => new BleManager());
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [status, setStatus] = useState<string>('Отключено');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info'
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  useEffect(() => {
    initBluetooth();
    return () => {
      bleManager.destroy();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const initBluetooth = async () => {
    try {
      const state = await bleManager.state();
      if (state === 'PoweredOn') {
        setStatus('Готов к работе');
        await requestPermissions();
      } else {
        showToast(`Bluetooth выключен: ${state}`, 'error');
      }
    } catch {
      showToast('Ошибка инициализации Bluetooth', 'error');
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch {
      return false;
    }
  };

  const startScan = async (forceRestart = false) => {
    if (isScanning && !forceRestart) return;

    try {
      const state = await bleManager.state();
      if (state !== 'PoweredOn') {
        showToast('Bluetooth выключен', 'error');
        return;
      }
      if (!(await requestPermissions())) {
        showToast('Нет разрешений для работы с Bluetooth', 'error');
        return;
      }

      if (connectedDeviceId) {
        try {
          await bleManager.cancelDeviceConnection(connectedDeviceId);
          setConnectedDeviceId(null);
          await new Promise(res => setTimeout(res, 300));
        } catch {
          setConnectedDeviceId(null);
        }
      }

      setDevices([]);
      setIsScanning(true);
      setStatus('Поиск устройств...');

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          handleError(error);
          setIsScanning(false);
          return;
        }
        if (device?.name || device?.id) {
          setDevices(prev => {
            if (prev.find(d => d.id === device.id)) return prev;
            return [...prev, {
              id: device.id,
              name: device.name || 'Неизвестное',
              rssi: device.rssi !== null ? device.rssi : 0
            }];
          });
        }
      });

      setTimeout(() => { if (isScanning) stopScan(); }, 15000);
    } catch {
      showToast('Не удалось запустить сканирование', 'error');
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
    setStatus('Поиск остановлен');
  };

  const rescan = async () => {
    bleManager.stopDeviceScan();
    setDevices([]);
    await new Promise(res => setTimeout(res, 200));
    await startScan(true);
  };

  // ✅ НОВАЯ ФУНКЦИЯ: Отмена подключения и запуск поиска
  const cancelConnectionAndStartScan = async () => {
    if (connectingId) {
      try {
        await bleManager.cancelDeviceConnection(connectingId);
      } catch {}
    }
    if (connectedDeviceId) {
      try {
        await bleManager.cancelDeviceConnection(connectedDeviceId);
      } catch {}
    }
    setConnectingId(null);
    setConnectedDeviceId(null);
    setIsScanning(false);
    await new Promise(res => setTimeout(res, 300));
    await startScan(false);
  };

  const connectToDevice = async (deviceId: string) => {
    try {
      setConnectingId(deviceId);
      setStatus('Подключение...');
      bleManager.stopDeviceScan();
      setIsScanning(false);

      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      setConnectedDeviceId(deviceId);
      setConnectingId(null);
      setStatus('Подключено');

      const services = await device.services();
      showToast(`Успешно подключено к ${device.name || deviceId} (${services.length} сервисов)`, 'success');
    } catch (error) {
      handleError(error);
      setConnectingId(null);
      if (!connectedDeviceId) {
        setIsScanning(false);
        setStatus('Готов к работе');
      }
    }
  };

  const cancelConnection = async (deviceId: string) => {
    setConnectingId(null);
    setStatus('Отмена...');
    try { await bleManager.cancelDeviceConnection(deviceId); } catch {}
    setStatus('Готов к работе');
  };

  const disconnect = async (deviceId: string) => {
    if (!deviceId || deviceId !== connectedDeviceId) return;

    try {
      await bleManager.cancelDeviceConnection(deviceId);
      setConnectedDeviceId(null);
      setStatus('Отключено');
      showToast('Устройство успешно отключено', 'info');
    } catch (error: any) {
      const isBenign =
        error?.errorCode === BleErrorCode.DeviceDisconnected ||
        error?.errorCode === BleErrorCode.OperationCancelled ||
        error?.message?.toLowerCase().includes('disconnected') ||
        error?.message?.toLowerCase().includes('cancelled') ||
        error?.message?.toLowerCase().includes('not connected');

      if (!isBenign) {
        console.error('Критическая ошибка отключения:', error);
        showToast('Не удалось отключить устройство', 'error');
      } else {
        setConnectedDeviceId(null);
        setStatus('Отключено');
      }
    }
  };

  const handleError = (error: any) => {
    if (error instanceof BleError) {
      switch (error.errorCode) {
        case BleErrorCode.BluetoothUnsupported:
          showToast('Bluetooth не поддерживается на этом устройстве', 'error'); break;
        case BleErrorCode.BluetoothUnauthorized:
          showToast('Отсутствует разрешение на использование Bluetooth', 'error'); break;
        case BleErrorCode.BluetoothPoweredOff:
          showToast('Bluetooth адаптер выключен', 'error'); break;
        case BleErrorCode.DeviceNotFound:
          showToast('Устройство не найдено в зоне действия', 'error'); break;
        case BleErrorCode.DeviceDisconnected:
          showToast('Соединение с устройством разорвано', 'error'); break;
        default:
          showToast(error.message || 'Произошла ошибка BLE', 'error');
      }
    } else {
      showToast(String(error), 'error');
    }
  };

  const sortedDevices = useMemo(() => {
    const sortedByRssi = [...devices].sort((a, b) => b.rssi - a.rssi);

    if (!connectedDeviceId) return sortedByRssi;

    const connected = sortedByRssi.find(d => d.id === connectedDeviceId);
    if (!connected) return sortedByRssi;

    const others = sortedByRssi.filter(d => d.id !== connectedDeviceId);
    return [connected, ...others];
  }, [devices, connectedDeviceId]);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Статус: {status}</Text>

      <View style={styles.buttonContainer}>
        {!isScanning && !connectingId ? (
          <Button title="Начать поиск" onPress={() => startScan(false)} />
        ) : connectingId ? (
          // ✅ КНОПКА ИЗМЕНЕНА: "Начать поиск" вместо "Отмена подключения"
          <Button title="Начать поиск" onPress={cancelConnectionAndStartScan} color="#2196F3" />
        ) : (
          <View style={styles.scanButtonsRow}>
            <Button title="Остановить" onPress={stopScan} color="#ff4444" />
            <Button title="Перезапуск" onPress={rescan} color="#2196F3" />
          </View>
        )}
      </View>

      <FlatList
        data={sortedDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isThisConnected = item.id === connectedDeviceId;
          const isThisConnecting = connectingId === item.id;

          return (
            <View style={styles.deviceItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>
                  {item.name && item.name !== 'Unknown' ? item.name : 'Неизвестное устройство'}
                </Text>
                <Text style={styles.deviceId}>{item.id}</Text>
              </View>

              <SignalStrength rssi={item.rssi} />

              <View style={styles.rightActions}>
                {isThisConnected ? (
                  <>
                    <View style={styles.greenCircle} />
                    <TouchableOpacity style={styles.disconnectBtn} onPress={() => disconnect(item.id)}>
                      <Text style={styles.disconnectText}>Откл.</Text>
                    </TouchableOpacity>
                  </>
                ) : isThisConnecting ? (
                  // ✅ КНОПКА "Отмена" ОСТАЛАСЬ НА МЕСТЕ
                  <Button title="Отмена" onPress={() => cancelConnection(item.id)} color="#ff4444" />
                ) : (
                  <Button
                    title="Подключить"
                    onPress={() => connectToDevice(item.id)}
                    disabled={!!connectingId || !!connectedDeviceId}
                  />
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {isScanning ? 'Выполняется сканирование...' : 'Устройства не найдены. Нажмите "Начать поиск".'}
          </Text>
        }
      />

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  status: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  buttonContainer: { marginBottom: 16 },
  scanButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  deviceItem: {
    flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'white',
    marginBottom: 8, borderRadius: 8, elevation: 2, gap: 8,
  },
  deviceName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  deviceId: { fontSize: 12, color: '#666' },
  signalContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  signalBar: { width: 4, borderRadius: 1 },
  rssiText: { fontSize: 10, color: '#666', marginLeft: 4, textAlign: 'center' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 80, justifyContent: 'flex-end' },
  greenCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50' },
  disconnectBtn: { backgroundColor: '#FF5252', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  disconnectText: { color: 'white', fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 20, color: '#999', fontSize: 16 },
  toast: {
    position: 'absolute', bottom: 30, left: 16, right: 16, paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.25,
    shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, zIndex: 999,
  },
  toastText: { color: '#fff', fontSize: 15, fontWeight: '500', textAlign: 'center' },
});