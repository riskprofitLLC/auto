const WebSocket = require('ws');
const noble = require('@abandonware/noble');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });
const peripherals = {};

console.log(`🚀 Bluetooth Gateway запущен на порту ${PORT}`);

let isScanning = false;
let pendingConnectionId = null;

// --- Управление состоянием адаптера ---
noble.on('stateChange', (state) => {
    console.log(`📡 Состояние Bluetooth: ${state}`);

    if (state === 'poweredOn') {
        console.log('Адаптер включен. Запуск сканирования...');
        if (!isScanning) {
            noble.startScanning([], true);
            isScanning = true;
        }
    } else {
        console.log('Адаптер выключен или недоступен.');
        if (isScanning) {
            noble.stopScanning();
            isScanning = false;
        }
    }
});

// --- Функция перезапуска сканирования ---
function performScanStart() {
    console.log('🔄 Перезапуск сканирования...');
    noble.stopScanning();

    setTimeout(() => {
        noble.startScanning([], true);
        isScanning = true;
        console.log('▶️ Сканирование запущено.');
    }, 100);
}

// --- Остановка сканирования ---
function stopScan() {
    if (isScanning) {
        noble.stopScanning();
        isScanning = false;
        console.log('⏹ Сканирование остановлено.');
    }
}

// --- Обнаружение BLE-устройств ---
noble.on('discover', (peripheral) => {
    const id = peripheral.id;
    const name = peripheral.advertisement.localName || 'Unknown';
    const rssi = peripheral.rssi;

    console.log(`🔍 Найдено: ${name} (${id}) RSSI: ${rssi}`);

    // Сохраняем устройство в кэш
    peripherals[id] = peripheral;

    // Отправляем всем подключенным клиентам
    broadcast({
        type: 'DEVICE_FOUND',
        data: {
            id,
            name,
            rssi
        }
    });
});

// --- Отправка сообщения всем клиентам ---
function broadcast(message) {
    const msgStr = JSON.stringify(message);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msgStr);
        }
    });
}

// --- Обработка подключений клиентов ---
wss.on('connection', (ws) => {
    console.log('✅ Клиент подключен');

    ws.on('message', (data) => {
        try {
            const cmd = JSON.parse(data.toString());
            console.log(`⚙️ Получена команда: ${cmd.type}`);

            switch (cmd.type) {
                case 'START_SCAN':
                    performScanStart();
                    break;

                case 'STOP_SCAN':
                    stopScan();
                    ws.send(JSON.stringify({ type: 'SCAN_STOPPED' }));
                    break;

                case 'CONNECT':
                    handleConnect(ws, cmd.deviceId);
                    break;

                case 'CANCEL_CONNECT':
                    handleCancelConnect(ws, cmd.deviceId);
                    break;

                default:
                    console.warn(`⚠️ Неизвестная команда: ${cmd.type}`);
                    ws.send(JSON.stringify({ type: 'ERROR', message: `Неизвестная команда: ${cmd.type}` }));
            }
        } catch (e) {
            console.error('❌ Ошибка парсинга сообщения:', e);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Неверный формат JSON' }));
        }
    });

    ws.on('close', () => {
        console.log('🔌 Клиент отключен');
    });

    ws.on('error', (err) => {
        console.error('❌ Ошибка WebSocket:', err);
    });
});

// --- Подключение к устройству ---
function handleConnect(ws, deviceId) {
    const peripheral = peripherals[deviceId];

    if (!peripheral) {
        console.log(`❌ Устройство ${deviceId} не найдено в кэше`);
        return ws.send(JSON.stringify({ type: 'ERROR', message: 'Устройство не найдено' }));
    }

    console.log(`🔗 Подключение к устройству: ${deviceId}`);
    pendingConnectionId = deviceId;
    stopScan();

    peripheral.connect((err) => {
        // Если pendingConnectionId изменился (отмена), игнорируем ошибку
        if (pendingConnectionId !== deviceId) {
            console.log(`🛑 Подключение к ${deviceId} проигнорировано (отменено пользователем)`);
            return;
        }

        if (err) {
            console.error('❌ Ошибка подключения:', err);
            ws.send(JSON.stringify({ type: 'ERROR', message: `Не удалось подключиться: ${err.message}` }));
            pendingConnectionId = null;
            performScanStart();
            return;
        }

        console.log('✅ Успешно подключено! Поиск сервисов...');
        ws.send(JSON.stringify({ type: 'CONNECTED', deviceId }));
        pendingConnectionId = null;

        peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
            if (err) {
                console.error('❌ Ошибка поиска сервисов:', err);
                ws.send(JSON.stringify({ type: 'ERROR', message: 'Не удалось обнаружить сервисы' }));
            } else {
                console.log(`📋 Найдено ${services.length} сервисов`);
                const serviceData = services.map(s => ({
                    uuid: s.uuid,
                    characteristics: s.characteristics.map(c => c.uuid)
                }));

                ws.send(JSON.stringify({
                    type: 'SERVICES_FOUND',
                    deviceId,
                    services: serviceData
                }));
            }
        });
    });
}

// --- Отмена подключения ---
function handleCancelConnect(ws, deviceId) {
    console.log(`🛑 Отмена подключения к: ${deviceId}`);

    const peripheral = peripherals[deviceId];

    // Если устройство уже подключено, отключаем его
    if (peripheral && peripheral.state === 'connected') {
        peripheral.disconnect(() => {
            console.log('🔌 Устройство отключено');
        });
    }

    // Сбрасываем pendingConnectionId, чтобы игнорировать ошибку подключения
    pendingConnectionId = null;

    // Отправляем подтверждение клиенту
    ws.send(JSON.stringify({ type: 'CANCELLED' }));

    // Возобновляем сканирование
    performScanStart();
}

// --- Запуск сервера ---
console.log('⏳ Ожидание включения Bluetooth адаптера...');