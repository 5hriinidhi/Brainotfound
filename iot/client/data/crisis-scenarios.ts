import { Scene } from '@/types/game';

const backgrounds = ['lab1.jpg', 'lab2.jpg', 'lab3.jpg', 'lab4.jpg'];
const bg = () => backgrounds[Math.floor(Math.random() * backgrounds.length)];

export const crisisScenarios: Scene[] = [
    // ─── Q10: MQTT Connection Failure ────────────────────────────────────────
    {
        id: 'crisis-1',
        background: bg(),
        character: 'NETWORK OPS',
        dialogue:
            'An ESP32 running MQTT over TLS connects to Wi-Fi successfully but fails to connect to the MQTT broker at mqtt.iot-server.local:8883. The error log shows "MQTT connection failed, rc=-2." The broker is accessible from a laptop on the same network. What should you investigate?',
        timer: 22,
        choices: [
            {
                text: '📡 rc=-2 means network unreachable — verify the broker hostname resolves on the ESP32. Use the IP address directly, and check that port 8883 (TLS) is open and the root CA certificate is loaded',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔒 Check that the MQTT topic subscription string matches the broker\'s ACL — a wrong topic prefix with wildcards causes silent rejection',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reboot the MQTT broker service on the server',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '📶 The Wi-Fi signal is too weak — move the ESP32 closer to the router',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q11: No Sensor Messages in Code ─────────────────────────────────────
    {
        id: 'crisis-2',
        background: bg(),
        character: 'CODE REVIEW',
        dialogue:
            'An I2C BMP280 pressure sensor connected to SDA (GPIO 21) and SCL (GPIO 22) returns 0 for all readings. The I2C scanner sketch finds the device at address 0x76. The code initializes with bmp.begin(0x77). No error messages appear in serial. Where should you debug first?',
        timer: 22,
        choices: [
            {
                text: '🔍 The I2C address mismatch — bmp.begin(0x77) but scanner found 0x76. Change initialization to bmp.begin(0x76) to match the actual hardware address',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 5, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📟 Add Serial.println() after each sensor read call to trace where values become zero — check if begin() returns false silently',
                effects: { reasoning: 10, efficiency: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 The SDA and SCL wires are probably swapped',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ The BMP280 needs 5V, not 3.3V — use a level shifter',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q12: Why Print Intermediate Values ──────────────────────────────────
    {
        id: 'crisis-3',
        background: bg(),
        character: 'DEBUG MENTOR',
        dialogue:
            'A junior developer\'s IoT code reads a soil moisture sensor, applies a calibration formula, and sends the value to ThingSpeak. The final published value is always 0, but the raw ADC reads 2847. There are no print statements in the code. What debugging approach should be recommended?',
        timer: 22,
        choices: [
            {
                text: '📊 Add Serial.println() for the raw ADC value, the post-calibration value, and the API response — this reveals exactly where the data pipeline breaks (likely integer division truncation)',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 5, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔢 Print the calibration formula\'s intermediate variables — suspect integer overflow or wrong type casting in the math',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🌐 Check the ThingSpeak API key — it might be expired',
                effects: { reasoning: -5, efficiency: -5, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Replace the soil moisture sensor with a new one',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q13: Devices Stop Sending Data ──────────────────────────────────────
    {
        id: 'crisis-4',
        background: bg(),
        character: 'SYSTEM ALERT',
        dialogue:
            'A fleet of 24 ESP32 sensor nodes deployed across a warehouse suddenly stop sending data to the MQTT broker. The broker is online. Network monitoring shows all devices lost Wi-Fi association within a 2-minute window. The warehouse recently installed new 2.4GHz wireless security cameras. What network factors are responsible?',
        timer: 25,
        choices: [
            {
                text: '📡 The new 2.4GHz cameras are causing RF interference on the same channel. Run a Wi-Fi spectrum analysis, switch IoT devices to a non-overlapping channel (1, 6, or 11), and check for IP address conflicts from DHCP exhaustion',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Check if the access point has a max client limit — 24 new camera connections may have pushed existing IoT devices off the association table',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reboot all 24 ESP32 nodes simultaneously via hard reset',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '💾 The MQTT broker ran out of disk space and stopped accepting connections',
                effects: { reasoning: -10, efficiency: -5, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q14: Loss of Connectivity Scenarios ─────────────────────────────────
    {
        id: 'crisis-5',
        background: bg(),
        character: 'FIELD ENGINEER',
        dialogue:
            'An agricultural IoT deployment with LoRa-connected soil sensors experiences intermittent data loss. Sensors 200m from the gateway work fine, but those 400m+ away drop packets 60% of the time. The LoRa gateway uses a 3dBi antenna at 1.5m height. The terrain has growing corn crops (~2m tall). What is causing the connectivity loss?',
        timer: 25,
        choices: [
            {
                text: '📡 The corn canopy at 2m is blocking line-of-sight. Raise the gateway antenna to 4m+ height, increase spreading factor (SF10→SF12) for distant nodes, and consider adding a repeater node at 300m',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔋 The distant sensors may have depleted batteries causing insufficient TX power — check battery voltage and increase the LoRa TX power to +20dBm',
                effects: { reasoning: 10, efficiency: 5, powerAwareness: 15, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Switch from LoRa to Wi-Fi for all sensors for better throughput',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reduce the data packet size to improve reliability',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q15: Industrial Sensor Producing Spikes ─────────────────────────────
    {
        id: 'crisis-6',
        background: bg(),
        character: 'INDUSTRIAL OPS',
        dialogue:
            'A PT100 temperature sensor in a factory reads a steady 85°C, then suddenly spikes to 450°C for 2-3 readings before returning to normal. This happens every 15-30 minutes. The sensor is mounted near a 3-phase motor that starts periodically. Calibration was done 2 weeks ago. What is causing the spikes?',
        timer: 22,
        choices: [
            {
                text: '⚡ The 3-phase motor generates electromagnetic interference (EMI) during startup that couples into the sensor wiring. Shield the sensor cables with grounded braided sleeve and add a software median filter to reject outlier readings',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🌡 The sensor may have a loose wire connection — vibration from the motor causes intermittent open-circuit which the RTD reader interprets as high resistance (= high temp)',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 The sensor has drifted and needs recalibration',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Replace the PT100 with a thermocouple — they are more resistant to noise',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q16: Cloud Authentication Failure ───────────────────────────────────
    {
        id: 'crisis-7',
        background: bg(),
        character: 'CLOUD SECURITY',
        dialogue:
            'IoT devices using TLS 1.2 to connect to AWS IoT Core suddenly fail with error "NET - Connection reset by peer." The certificates were provisioned 13 months ago. Other services on the same network work fine. The device clock shows January 2024 (actual: February 2026). What should you check?',
        timer: 22,
        choices: [
            {
                text: '🔒 Two issues: (1) The device certificates may have expired after 12 months — regenerate and reprovision them. (2) The device clock is wrong — TLS validation fails with incorrect time. Sync via NTP before TLS handshake',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📜 Check if AWS rotated their root CA — download the new Amazon Root CA and flash it to the device trust store',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Downgrade to TLS 1.1 — the server might not support 1.2 anymore',
                effects: { reasoning: -10, efficiency: -5, stability: -15, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🌐 The network firewall is blocking port 8883 — ask IT to open it',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q17: Spectrum Interference ──────────────────────────────────────────
    {
        id: 'crisis-8',
        background: bg(),
        character: 'RF ENGINEER',
        dialogue:
            'In a smart building, 50 Zigbee sensors (2.4GHz, channel 15), 30 Wi-Fi devices (channel 1), and 10 Bluetooth BLE beacons all operate simultaneously. Users report Zigbee sensors dropping off the network during peak Wi-Fi hours (9 AM–5 PM). What interference problems are occurring?',
        timer: 25,
        choices: [
            {
                text: '📡 Zigbee channel 15 (2.425 GHz) overlaps with Wi-Fi channel 1 (2.412–2.432 GHz). Move Zigbee to channel 25 (2.475 GHz) which falls between Wi-Fi channels 6 and 11, and reduce Bluetooth advertising frequency to minimize collisions',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Enable Zigbee frequency agility so the coordinator can automatically hop to cleaner channels when interference is detected',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Increase Zigbee TX power to overpower the Wi-Fi interference',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Add more Zigbee coordinators to the building to increase coverage',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q18: Gateway Failure — Fault Isolation ──────────────────────────────
    {
        id: 'crisis-9',
        background: bg(),
        character: 'CHIEF ENGINEER',
        dialogue:
            'The central IoT gateway in a factory has stopped forwarding sensor data to the cloud. 40 sensors connect via Modbus RTU to the gateway, which runs Node-RED and publishes to Azure IoT Hub. The gateway\'s LED indicators show power ON but no network activity. What sequence of steps would you perform to isolate the fault?',
        timer: 30,
        choices: [
            {
                text: '🔍 Systematic isolation: (1) Ping gateway locally — if alive, network stack OK. (2) Check Node-RED dashboard — if flows stopped, restart service. (3) Test Modbus with a standalone query to verify sensor bus. (4) Curl Azure endpoint to verify cloud auth. This isolates sensor vs. gateway vs. cloud',
                effects: { reasoning: 20, efficiency: 15, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 SSH into the gateway, check system logs (journalctl), memory usage, and disk space. If Node-RED OOM-killed, increase swap space and restart',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Power cycle the entire gateway and all 40 sensors',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '☁️ Contact Azure support — the IoT Hub subscription might have expired',
                effects: { reasoning: -10, efficiency: -5, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q19: MQTT Broker Connected But No Data ─────────────────────────────
    {
        id: 'crisis-10',
        background: bg(),
        character: 'PROTOCOL ENGINEER',
        dialogue:
            'An ESP32 shows "Connected to MQTT broker" in serial output, and the broker logs confirm an active client session. However, the dashboard shows zero incoming data. The device publishes to "sensors/temp/device1" and the dashboard subscribes to "sensor/temp/device1". The QoS is 0. What is wrong?',
        timer: 22,
        choices: [
            {
                text: '📡 Topic mismatch — "sensors/temp/device1" (plural) vs "sensor/temp/device1" (singular). MQTT topics are case-sensitive and exact-match. Fix the topic string on either publisher or subscriber to match exactly',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔍 Use an MQTT client like mosquitto_sub with wildcard "sensors/#" to verify what the device is actually publishing, then align dashboard subscription',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Restart the MQTT broker — it may have a stale session',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Increase QoS to 2 for guaranteed delivery',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q20: Factory Sensors Drop Simultaneously ───────────────────────────
    {
        id: 'crisis-11',
        background: bg(),
        character: 'NETWORK OPS',
        dialogue:
            'In a smart factory, 15 ESP32 sensor nodes all go offline within a 30-second window. They were functioning normally for weeks. The MQTT broker is online and accepting connections from your laptop. The factory\'s network switch shows all ports active. The nodes are on DHCP. A new batch of IP cameras was deployed on the same subnet yesterday. What happened?',
        timer: 25,
        choices: [
            {
                text: '🔍 Not a sensor issue — network failure. The new IP cameras likely exhausted the DHCP pool, causing IP conflicts. When leases renewed, IoT nodes couldn\'t get addresses. Check DHCP pool → expand range → assign static IPs to IoT nodes in a separate subnet',
                effects: { reasoning: 20, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📡 Check the network switch\'s MAC address table — it may have overflowed with the new camera devices, causing broadcast storms that knocked IoT nodes offline',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reboot all 15 sensor nodes one by one',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Update the firmware on all nodes — there may be a WiFi stack bug',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q21: Data Spikes in Sensor Readings ────────────────────────────────
    {
        id: 'crisis-12',
        background: bg(),
        character: 'DATA QUALITY',
        dialogue:
            'A temperature monitoring system shows a sudden spike to 500°C for exactly 2 readings, then returns to the normal 25°C range. This happens once every few hours. The sensor (DS18B20) is calibrated and the wiring is solid. The readings are logged directly to a database with no filtering. How should this be handled?',
        timer: 22,
        choices: [
            {
                text: '📊 These are outlier noise readings — not real temperature. Implement a moving average filter with outlier rejection: if a reading deviates >50% from the rolling average, discard it. Also add range validation (flag readings outside physical bounds like -40°C to 200°C)',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 The one-wire bus may have momentary interference. Add a 4.7kΩ pull-up and use a median-of-three sampling strategy (read 3 times, take middle value)',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Replace the DS18B20 sensor — it is providing unreliable readings',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚙️ Increase the sampling rate to catch more spikes for debugging',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q22: High Latency in Dashboard Updates ─────────────────────────────
    {
        id: 'crisis-13',
        background: bg(),
        character: 'LATENCY ANALYST',
        dialogue:
            'A real-time IoT dashboard shows sensor data with a consistent 8–12 second delay. Sensors publish readings every second via MQTT. The broker is running locally (same LAN). Network ping to broker is <1ms. Investigation shows the MQTT client uses QoS 2 (exactly-once delivery) for all messages. The broker has 200 connected clients. What is causing the latency?',
        timer: 22,
        choices: [
            {
                text: '📡 QoS 2 requires a 4-step handshake (PUBLISH → PUBREC → PUBREL → PUBCOMP) per message. With 200 clients publishing every second, the broker is bottlenecked processing acknowledgments. Switch to QoS 0 (fire-and-forget) or QoS 1 for sensor telemetry — exact-once semantics are unnecessary for periodic readings',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 10, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Reduce the number of active subscriptions per client and implement topic-based batching to reduce broker message processing load',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Upgrade the broker server hardware — it needs more CPU and RAM',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reduce sensor publish frequency to every 10 seconds',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q23: Cloud Auth Failure After Firmware Update ──────────────────────
    {
        id: 'crisis-14',
        background: bg(),
        character: 'SECURITY OPS',
        dialogue:
            'After an OTA firmware update, IoT devices fail to connect to the cloud platform. Error: "TLS handshake failed: certificate expired." The previous firmware connected fine. The new firmware binary was built from a branch that was 3 months old. The TLS root CA bundle in the firmware was last updated 14 months ago. Device clock shows correct time. What is the issue?',
        timer: 25,
        choices: [
            {
                text: '🔒 The 3-month-old branch contains an expired TLS root CA certificate (older than 12 months). The firmware build baked in stale certificates. Solution: Update the CA certificate bundle in the firmware source, rebuild from the main branch, and re-deploy via OTA',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📜 Check if the cloud provider rotated their intermediate CA — download the current certificate chain and embed it in the firmware trust store',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Disable TLS certificate validation as a temporary workaround',
                effects: { reasoning: -10, efficiency: -5, stability: -15, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Rollback to the previous firmware version',
                effects: { reasoning: -5, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q24: Random Node Resets at Night ────────────────────────────────────
    {
        id: 'crisis-15',
        background: bg(),
        character: 'TEMPORAL ANALYST',
        dialogue:
            'Several IoT sensor nodes reset randomly between midnight and 2 AM. During the day they operate flawlessly. Logs show the reset reason as "software reset" (not brownout or watchdog). The nodes have an OTA update check scheduled via cron at 00:30. The OTA server sends a 4MB binary. The nodes have 520KB SRAM. What is causing the midnight resets?',
        timer: 25,
        choices: [
            {
                text: '🌙 The scheduled OTA update downloads a 4MB binary that exceeds available heap memory during the update process, causing an out-of-memory software reset. Solution: Stagger OTA updates across nodes (not all at 00:30), implement chunked download with memory checks, and add a pre-update free-heap validation',
                effects: { reasoning: 20, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 Add detailed logging around the OTA process with timestamps and free heap monitoring to confirm the correlation between OTA downloads and resets',
                effects: { reasoning: 10, efficiency: 10, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ The power supply voltage drops at night due to lower grid load — add a voltage monitor',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Increase watchdog timeout — the nodes are resetting from slow network responses at night',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q25: Smart Factory BLE Interference ────────────────────────────────
    {
        id: 'crisis-16',
        background: bg(),
        character: 'SPECTRUM ENGINEER',
        dialogue:
            'A smart factory uses 20 BLE beacon nodes for asset tracking. In one area of the factory floor, 6 nodes intermittently lose connection and fail to report positions. These nodes are near a WiFi 6 access point and several 2.4GHz wireless handheld scanners used by workers. Other areas of the factory work fine. What is causing the localized failures?',
        timer: 25,
        choices: [
            {
                text: '📡 2.4GHz channel congestion — BLE, WiFi 6, and wireless scanners all share the 2.4GHz ISM band. The BLE advertising channels (37, 38, 39) overlap with WiFi channels. Solution: Switch BLE to adaptive frequency hopping, move WiFi AP to 5GHz band, and consider migrating asset tracking to UWB or LoRa for better coexistence',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Increase BLE TX power on the affected nodes and reduce advertising interval to improve connection reliability through the interference',
                effects: { reasoning: 10, efficiency: 5, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Replace the BLE beacons with newer BLE 5.0 modules',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '📶 Add more BLE gateway receivers in that area for redundancy',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },
];
