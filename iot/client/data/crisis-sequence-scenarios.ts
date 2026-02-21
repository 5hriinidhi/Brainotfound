/**
 * Crisis Sequence Scenarios — 9 troubleshooting sequence challenges.
 *
 * Each scenario presents a crisis situation where the user must
 * arrange diagnostic steps in the correct order.
 *
 * Directly mapped from the original 9 MCQ crisis scenarios (Q10-Q18).
 */
import { CrisisSequenceScenario } from '@/types/crisis';

export const crisisSequenceScenarios: CrisisSequenceScenario[] = [
    // ─── 1. MQTT Connection Failure ──────────────────────────────────────
    {
        id: 'crisis-seq-1',
        title: 'MQTT Connection Failure',
        description:
            'An ESP32 connects to Wi-Fi but MQTT fails with rc=-2. The broker works from a laptop on the same network. Arrange the correct diagnostic steps.',
        difficulty: 'easy',
        character: 'NETWORK OPS',
        availableActionIds: ['check-wifi', 'ping-gateway', 'verify-mqtt', 'check-certs', 'restart-node', 'replace-sensor'],
        optimalSequence: ['check-wifi', 'ping-gateway', 'verify-mqtt', 'check-certs'],
        sequenceLength: 4,
        explanation: 'First confirm Wi-Fi is up, then ping the broker IP, then test MQTT directly, then verify TLS certificates — systematic network layer isolation.',
        timerSeconds: 60,
        hint: 'rc=-2 means network unreachable. Work from Layer 1 (physical) upward.',
    },

    // ─── 2. I2C Sensor Returns Zero ──────────────────────────────────────
    {
        id: 'crisis-seq-2',
        title: 'Sensor Returns Zero',
        description:
            'A BMP280 on I2C returns 0 for all readings. Scanner finds it at 0x76 but code uses 0x77. No serial errors. Arrange the diagnostic steps.',
        difficulty: 'easy',
        character: 'CODE REVIEW',
        availableActionIds: ['check-i2c', 'check-logs', 'check-firmware', 'restart-node', 'replace-sensor', 'check-power'],
        optimalSequence: ['check-i2c', 'check-logs', 'check-firmware', 'restart-node'],
        sequenceLength: 4,
        explanation: 'First verify I2C address mismatch, then add debug prints, then check library version, then restart to confirm fix.',
        timerSeconds: 60,
        hint: 'The I2C scanner found 0x76 but code says 0x77. Start with the address.',
    },

    // ─── 3. Calibration Pipeline Broken ──────────────────────────────────
    {
        id: 'crisis-seq-3',
        title: 'Zero Published Values',
        description:
            'Soil moisture sensor reads ADC=2847 but published value is always 0. No print statements in code. Fix the data pipeline.',
        difficulty: 'medium',
        character: 'DEBUG MENTOR',
        availableActionIds: ['check-logs', 'check-firmware', 'check-i2c', 'verify-mqtt', 'restart-node', 'replace-sensor'],
        optimalSequence: ['check-logs', 'check-firmware', 'verify-mqtt', 'restart-node'],
        sequenceLength: 4,
        explanation: 'Add Serial.println() at each pipeline stage, check calibration formula for integer division, verify API endpoint, then restart.',
        timerSeconds: 75,
        hint: 'The raw ADC value is fine. The bug is in the calibration formula — likely integer truncation.',
    },

    // ─── 4. Fleet Wi-Fi Dropout ──────────────────────────────────────────
    {
        id: 'crisis-seq-4',
        title: 'Fleet Wi-Fi Dropout',
        description:
            '24 ESP32 nodes lost Wi-Fi within 2 minutes after new 2.4GHz cameras were installed. The MQTT broker is online. Diagnose the interference.',
        difficulty: 'medium',
        character: 'SYSTEM ALERT',
        availableActionIds: ['scan-spectrum', 'check-wifi', 'ping-gateway', 'restart-node', 'check-power', 'replace-sensor'],
        optimalSequence: ['scan-spectrum', 'check-wifi', 'ping-gateway', 'restart-node'],
        sequenceLength: 4,
        explanation: 'Scan for RF interference first, then verify channel overlap, test connectivity, and finally restart nodes on a clean channel.',
        timerSeconds: 75,
        hint: 'New 2.4GHz cameras cause channel overlap. Think RF interference first.',
    },

    // ─── 5. LoRa Packet Loss ─────────────────────────────────────────────
    {
        id: 'crisis-seq-5',
        title: 'LoRa Range Loss',
        description:
            'Agricultural sensors 400m+ away drop 60% of packets. Gateway antenna: 3dBi at 1.5m. 2m tall corn crops blocking line of sight.',
        difficulty: 'medium',
        character: 'FIELD ENGINEER',
        availableActionIds: ['check-antenna', 'check-power', 'scan-spectrum', 'restart-node', 'replace-sensor', 'check-firmware'],
        optimalSequence: ['check-antenna', 'scan-spectrum', 'check-power', 'check-firmware'],
        sequenceLength: 4,
        explanation: 'Raise the antenna above crop canopy, scan for interference, check battery/TX power on distant nodes, then verify spreading factor settings.',
        timerSeconds: 75,
        hint: 'Line of sight is blocked by 2m crops. The gateway antenna is only at 1.5m.',
    },

    // ─── 6. Industrial Sensor Spikes ─────────────────────────────────────
    {
        id: 'crisis-seq-6',
        title: 'EMI Sensor Spikes',
        description:
            'PT100 reads 85°C normally but spikes to 450°C every 15-30 min when a 3-phase motor starts nearby. Calibrated 2 weeks ago.',
        difficulty: 'hard',
        character: 'INDUSTRIAL OPS',
        availableActionIds: ['scan-spectrum', 'check-power', 'check-logs', 'replace-sensor', 'check-firmware', 'restart-node'],
        optimalSequence: ['scan-spectrum', 'check-logs', 'check-power', 'check-firmware'],
        sequenceLength: 4,
        explanation: 'Identify EMI from motor startup, verify spike pattern in logs, check cable shielding/power, then add software median filter.',
        timerSeconds: 90,
        hint: 'The motor generates EMI during startup. Spikes correlate with motor activation.',
    },

    // ─── 7. TLS Certificate Failure ──────────────────────────────────────
    {
        id: 'crisis-seq-7',
        title: 'Cloud Auth Failure',
        description:
            'IoT devices using TLS 1.2 to AWS IoT Core fail with "Connection reset by peer." Certs provisioned 13 months ago. Device clock shows Jan 2024.',
        difficulty: 'hard',
        character: 'CLOUD SECURITY',
        availableActionIds: ['check-certs', 'check-logs', 'check-firmware', 'verify-mqtt', 'restart-node', 'check-wifi'],
        optimalSequence: ['check-certs', 'check-logs', 'check-firmware', 'verify-mqtt'],
        sequenceLength: 4,
        explanation: 'Check expired certificates first, verify device clock in logs, update firmware with NTP sync, then test MQTT connection.',
        timerSeconds: 90,
        hint: 'Certificates expire after 12 months. The device clock is 2 years behind.',
    },

    // ─── 8. Zigbee Interference ──────────────────────────────────────────
    {
        id: 'crisis-seq-8',
        title: 'Zigbee Interference',
        description:
            '50 Zigbee sensors (ch15), 30 Wi-Fi devices (ch1), 10 BLE beacons in a smart building. Zigbee drops off during peak Wi-Fi hours.',
        difficulty: 'hard',
        character: 'RF ENGINEER',
        availableActionIds: ['scan-spectrum', 'check-wifi', 'check-firmware', 'restart-node', 'check-power', 'check-antenna'],
        optimalSequence: ['scan-spectrum', 'check-wifi', 'check-firmware', 'check-antenna'],
        sequenceLength: 4,
        explanation: 'Analyze spectrum overlap, identify Zigbee ch15 overlapping Wi-Fi ch1, update Zigbee to ch25, then optimize antenna placement.',
        timerSeconds: 90,
        hint: 'Zigbee ch15 (2.425GHz) overlaps with Wi-Fi ch1 (2.412-2.432GHz).',
    },

    // ─── 9. Gateway Fault Isolation ──────────────────────────────────────
    {
        id: 'crisis-seq-9',
        title: 'Gateway Down',
        description:
            'Central IoT gateway stopped forwarding data. 40 Modbus sensors, Node-RED on gateway, publishes to Azure IoT Hub. Power LED ON, no network activity.',
        difficulty: 'hard',
        character: 'CHIEF ENGINEER',
        availableActionIds: ['ping-gateway', 'check-logs', 'verify-mqtt', 'check-power', 'restart-node', 'check-firmware'],
        optimalSequence: ['ping-gateway', 'check-logs', 'verify-mqtt', 'restart-node'],
        sequenceLength: 4,
        explanation: 'Ping to verify network stack, check logs for OOM/crash, test Azure auth, then restart Node-RED if needed — systematic fault isolation.',
        timerSeconds: 100,
        hint: 'Systematic isolation: network → logs → cloud → restart. Don\'t restart first.',
    },
];
