/**
 * Circuit Debug Scenarios — 9 circuit-builder challenges.
 *
 * Each scenario is a CircuitScenarioTemplate with randomizableValues.
 * The randomizer resolves templates into playable CircuitScenario instances.
 *
 * These REPLACE the old MCQ debug-scenarios.ts for Circuit Debug mode.
 * Crisis Mode continues to use crisis-scenarios.ts (VN/decision-based).
 */
import { CircuitScenarioTemplate } from '@/types/circuit';

const backgrounds = ['lab1.jpg', 'lab2.jpg', 'lab3.jpg', 'lab4.jpg'];
const bg = () => backgrounds[Math.floor(Math.random() * backgrounds.length)];

export const circuitScenarioTemplates: CircuitScenarioTemplate[] = [
    // ─── 1. LED Blink — Basic GPIO + Resistor + LED ──────────────────────────
    {
        id: 'circuit-1',
        background: bg(),
        title: 'LED Blink Circuit',
        description:
            'ESP32 brownout! Build a basic LED circuit on {GPIO}. Connect ESP32 → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → LED → GND.',
        difficulty: 'easy',
        requiredConnections: [
            { from: 'esp32', to: 'resistor' },
            { from: 'resistor', to: 'led' },
            { from: 'led', to: 'gnd' },
        ],
        resistorRange: [100, 1000],
        requiredGPIO: 'GPIO2',
        requiredPower: { minVoltage: 3.3, minCurrent: 20 },
        randomizableValues: {
            gpioPins: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO15', 'GPIO16', 'GPIO17'],
            resistorBounds: [100, 330, 470, 1000],
        },
        hint: 'An LED needs a current-limiting resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) on {GPIO}.',
    },

    // ─── 2. LED Not Lighting — Wrong Resistor Value ──────────────────────────
    {
        id: 'circuit-2',
        background: bg(),
        title: 'Dim LED Fix',
        description:
            'An LED on {GPIO} is too dim with a 10kΩ resistor. Replace with the correct value ({RESISTOR_MIN}–{RESISTOR_MAX}) for 20mA forward current.',
        difficulty: 'easy',
        requiredConnections: [
            { from: 'esp32', to: 'resistor' },
            { from: 'resistor', to: 'led' },
            { from: 'led', to: 'gnd' },
        ],
        resistorRange: [100, 470],
        requiredGPIO: 'GPIO27',
        requiredPower: { minVoltage: 3.3, minCurrent: 20 },
        randomizableValues: {
            gpioPins: ['GPIO27', 'GPIO26', 'GPIO25', 'GPIO14', 'GPIO13'],
            resistorBounds: [100, 220, 330, 470],
        },
        hint: 'V=IR: at 3.3V with 2.1V LED drop, you need ~60mA headroom. Use {RESISTOR_MIN}–{RESISTOR_MAX}.',
    },

    // ─── 3. DHT Sensor Pull-up — Sensor + Resistor ──────────────────────────
    {
        id: 'circuit-3',
        background: bg(),
        title: 'DHT Sensor Pull-Up',
        description:
            'A {SENSOR} on {GPIO} returns NaN. Add a pull-up resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) between Power and Sensor, then wire Sensor → ESP32 → GND.',
        difficulty: 'medium',
        requiredConnections: [
            { from: 'power', to: 'resistor' },
            { from: 'resistor', to: 'sensor' },
            { from: 'sensor', to: 'esp32' },
            { from: 'esp32', to: 'gnd' },
        ],
        resistorRange: [4700, 10000],
        requiredGPIO: 'GPIO4',
        requiredPower: { minVoltage: 3.3, minCurrent: 100 },
        randomizableValues: {
            gpioPins: ['GPIO4', 'GPIO5', 'GPIO16', 'GPIO17'],
            resistorBounds: [4700, 4700, 10000, 10000],
            sensorTypes: ['DHT11'],
        },
        hint: '{SENSOR} needs a {RESISTOR_MIN}–{RESISTOR_MAX} pull-up resistor on its data line ({GPIO}).',
    },

    // ─── 4. Sensor Erratic Voltage Divider ───────────────────────────────────
    {
        id: 'circuit-4',
        background: bg(),
        title: 'ADC Voltage Divider',
        description:
            'A gas sensor outputs 5V but ESP32 ADC is 3.3V max. Build a voltage divider on {GPIO}: Power → Sensor → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → GND, with Sensor → ESP32.',
        difficulty: 'medium',
        requiredConnections: [
            { from: 'power', to: 'sensor' },
            { from: 'sensor', to: 'resistor' },
            { from: 'resistor', to: 'gnd' },
            { from: 'sensor', to: 'esp32' },
        ],
        resistorRange: [10000, 47000],
        requiredGPIO: 'GPIO36',
        requiredPower: { minVoltage: 3.3, minCurrent: 50 },
        randomizableValues: {
            gpioPins: ['GPIO36', 'GPIO39', 'GPIO34', 'GPIO35'],
            resistorBounds: [10000, 10000, 47000, 47000],
            sensorTypes: ['LDR'],
        },
        hint: 'Use ADC input-only pins ({GPIO}). Voltage divider: {RESISTOR_MIN}–{RESISTOR_MAX} to scale 5V → 3.3V.',
    },

    // ─── 5. Power Supply Brownout ────────────────────────────────────────────
    {
        id: 'circuit-5',
        background: bg(),
        title: 'Brownout Protection',
        description:
            'ESP32 with Wi-Fi + OLED display causes brownout. Build a stable power path: Power → ESP32 ({GPIO}) → LED with Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → GND. Ensure adequate power supply.',
        difficulty: 'medium',
        requiredConnections: [
            { from: 'power', to: 'esp32' },
            { from: 'esp32', to: 'resistor' },
            { from: 'resistor', to: 'led' },
            { from: 'led', to: 'gnd' },
        ],
        resistorRange: [220, 1000],
        requiredGPIO: 'GPIO14',
        requiredPower: { minVoltage: 3.3, minCurrent: 500 },
        randomizableValues: {
            gpioPins: ['GPIO14', 'GPIO12', 'GPIO13', 'GPIO27'],
            resistorBounds: [220, 330, 470, 1000],
        },
        hint: 'ESP32 Wi-Fi peaks at 300mA. Ensure your power supply can deliver ≥500mA. Use {GPIO} for the LED.',
    },

    // ─── 6. LDR Light Sensor ─────────────────────────────────────────────────
    {
        id: 'circuit-6',
        background: bg(),
        title: 'LDR Light Sensor',
        description:
            'Build an {SENSOR}-based light sensor circuit on {GPIO}. Wire Power → Sensor → junction → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → GND. Connect junction to ESP32.',
        difficulty: 'hard',
        requiredConnections: [
            { from: 'power', to: 'sensor' },
            { from: 'sensor', to: 'resistor' },
            { from: 'resistor', to: 'gnd' },
            { from: 'sensor', to: 'esp32' },
        ],
        resistorRange: [10000, 47000],
        requiredGPIO: 'GPIO34',
        requiredPower: { minVoltage: 3.3, minCurrent: 50 },
        randomizableValues: {
            gpioPins: ['GPIO34', 'GPIO35', 'GPIO32', 'GPIO33'],
            resistorBounds: [10000, 10000, 47000, 47000],
            sensorTypes: ['LDR'],
        },
        hint: 'Voltage divider: Power → {SENSOR} → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → GND. Read junction on ADC pin {GPIO}.',
    },

    // ─── 7. Ultrasonic Distance Sensor ───────────────────────────────────────
    {
        id: 'circuit-7',
        background: bg(),
        title: 'Ultrasonic Ranging',
        description:
            'Wire an {SENSOR} sensor: Power → Sensor → ESP32 ({GPIO}), with a pull-up Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) and GND.',
        difficulty: 'medium',
        requiredConnections: [
            { from: 'power', to: 'sensor' },
            { from: 'sensor', to: 'esp32' },
            { from: 'esp32', to: 'gnd' },
            { from: 'power', to: 'resistor' },
            { from: 'resistor', to: 'sensor' },
        ],
        resistorRange: [4700, 10000],
        requiredGPIO: 'GPIO18',
        requiredPower: { minVoltage: 3.3, minCurrent: 100 },
        randomizableValues: {
            gpioPins: ['GPIO18', 'GPIO19', 'GPIO21', 'GPIO22'],
            resistorBounds: [4700, 4700, 10000, 10000],
            sensorTypes: ['Ultrasonic'],
        },
        hint: '{SENSOR} trigger/echo on {GPIO}. Pull-up {RESISTOR_MIN}–{RESISTOR_MAX} on the echo line.',
    },

    // ─── 8. High Power Draw Isolation ────────────────────────────────────────
    {
        id: 'circuit-8',
        background: bg(),
        title: 'Power Draw Audit',
        description:
            'Prototype draws 420mA at idle. Build the test circuit: Power → ESP32 ({GPIO}) → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → LED → GND. Isolate the power hungry component.',
        difficulty: 'hard',
        requiredConnections: [
            { from: 'power', to: 'esp32' },
            { from: 'esp32', to: 'resistor' },
            { from: 'resistor', to: 'led' },
            { from: 'led', to: 'gnd' },
        ],
        resistorRange: [100, 330],
        requiredGPIO: 'GPIO23',
        requiredPower: { minVoltage: 3.3, minCurrent: 500 },
        randomizableValues: {
            gpioPins: ['GPIO23', 'GPIO22', 'GPIO21', 'GPIO19'],
            resistorBounds: [100, 100, 220, 330],
        },
        hint: 'Use {RESISTOR_MIN}–{RESISTOR_MAX} for proper LED current. Ensure ≥500mA power budget on {GPIO}.',
    },

    // ─── 9. Full IoT Sensor Pipeline ─────────────────────────────────────────
    {
        id: 'circuit-9',
        background: bg(),
        title: 'Full Sensor Pipeline',
        description:
            'Build a complete IoT sensor pipeline: Power → {SENSOR} → Resistor ({RESISTOR_MIN}–{RESISTOR_MAX}) → ESP32 ({GPIO}) → LED → GND. This tests your full circuit design skills.',
        difficulty: 'hard',
        requiredConnections: [
            { from: 'power', to: 'sensor' },
            { from: 'sensor', to: 'resistor' },
            { from: 'resistor', to: 'esp32' },
            { from: 'esp32', to: 'led' },
            { from: 'led', to: 'gnd' },
        ],
        resistorRange: [4700, 10000],
        requiredGPIO: 'GPIO4',
        requiredPower: { minVoltage: 3.3, minCurrent: 200 },
        randomizableValues: {
            gpioPins: ['GPIO4', 'GPIO5', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19'],
            resistorBounds: [1000, 4700, 10000, 47000],
            sensorTypes: ['DHT11', 'Ultrasonic', 'LDR'],
        },
        hint: 'Full pipeline: Power → {SENSOR} → {RESISTOR_MIN}–{RESISTOR_MAX} → ESP32 ({GPIO}) → LED → GND.',
    },
];
