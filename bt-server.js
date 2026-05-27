const WebSocket = require('ws');
const noble = require('@abandonware/noble');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Bluetooth Gateway started on port ${PORT}`);

let peripherals = {}; // Хранилище найденных устройств

noble.on('stateChange', (state) => {
    console.log(`Bluetooth state: ${state}`);
    if (state === 'poweredOn') {
        noble.startScanning([], true); // true = allow duplicates
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', (peripheral) => {
    const deviceInfo = {
        id: peripheral.id,
        name: peripheral.advertisement.localName || 'Unknown',
        rssi: peripheral.rssi,
        address: peripheral.address
    };

    // Сохраняем ссылку на периферию для последующего подключения
    peripherals[peripheral.id] = peripheral;

    // Отправляем всем клиентам
    broadcast({ type: 'DEVICE_FOUND', data: deviceInfo });
});

function broadcast(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

wss.on('connection', (ws) => {
    console.log('✅ Client connected');

    ws.on('message', (message) => {
        try {
            const cmd = JSON.parse(message);
            console.log('⚡ Command:', cmd.type);

            if (cmd.type === 'CONNECT') {
                const deviceId = cmd.deviceId;
                const peripheral = peripherals[deviceId];

                if (peripheral) {
                    peripheral.connect((error) => {
                        if (error) {
                            ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
                        } else {
                            ws.send(JSON.stringify({ type: 'CONNECTED', deviceId }));

                            // Пример: чтение сервисов после подключения
                            peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
                                if (!err) {
                                    ws.send(JSON.stringify({
                                        type: 'SERVICES_FOUND',
                                        services: services.map(s => s.uuid)
                                    }));
                                }
                            });
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Device not found in scan cache' }));
                }
            }

            // Добавьте обработку DISCONNECT, READ, WRITE здесь

        } catch (e) {
            console.error('Parse error:', e);
        }
    });
});