/**
 * Circuit Validator — scenario-based validation engine.
 *
 * Validates the player's circuit against a resolved CircuitScenario:
 *   1. Required logical connection path exists
 *   2. Resistor value within randomized range
 *   3. Power supply meets minimum voltage/current
 *   4. Correct GPIO pin configured
 *   5. Correct sensor type (if required)
 *   6. No floating components
 *
 * Returns reasoning / efficiency / power scores and contextual feedback.
 * Does NOT simulate voltage physics — only logical connections.
 */
import {
    PlacedComponent,
    Connection,
    CircuitScenario,
    ValidationResult,
    ComponentType,
} from '@/types/circuit';
import { formatResistor } from '@/utils/scenarioRandomizer';

// ── Config (extracted from store state) ──────────────────────────────────────
export interface CircuitConfig {
    components: PlacedComponent[];
    connections: Connection[];
    powerSupply: { voltage: number; current: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasConnectionBetweenTypes(
    fromType: ComponentType,
    toType: ComponentType,
    components: PlacedComponent[],
    connections: Connection[],
): boolean {
    const fromIds = new Set(components.filter((c) => c.type === fromType).map((c) => c.id));
    const toIds = new Set(components.filter((c) => c.type === toType).map((c) => c.id));
    return connections.some(
        (conn) =>
            (fromIds.has(conn.fromId) && toIds.has(conn.toId)) ||
            (fromIds.has(conn.toId) && toIds.has(conn.fromId)),
    );
}

// ── Main Validator ───────────────────────────────────────────────────────────

export function validateCircuit(
    config: CircuitConfig,
    scenario: CircuitScenario,
): ValidationResult {
    const { components, connections, powerSupply } = config;
    const errors: string[] = [];
    let reasoningScore = 0;
    let efficiencyScore = 0;
    let powerScore = 0;

    // ── 1. LOGICAL CONNECTION PATH ─────────────────────────────────────────
    let pathCount = 0;
    const totalPaths = scenario.requiredConnections.length;

    for (const expected of scenario.requiredConnections) {
        if (hasConnectionBetweenTypes(expected.from, expected.to, components, connections)) {
            pathCount++;
        } else {
            errors.push(`Missing connection: ${expected.from.toUpperCase()} → ${expected.to.toUpperCase()}`);
        }
    }

    if (totalPaths > 0) {
        reasoningScore = Math.round((pathCount / totalPaths) * 100);
    }

    // ── 2. RESISTOR VALUE ──────────────────────────────────────────────────
    const resistors = components.filter((c) => c.type === 'resistor');
    const [rMin, rMax] = scenario.resistorRange;

    if (resistors.length === 0) {
        errors.push('No resistor placed — circuit needs current limiting');
    } else {
        let bestScore = 0;
        for (const r of resistors) {
            const val = r.resistorValue ?? 0;
            if (val >= rMin && val <= rMax) {
                bestScore = 100;
            } else if (val > 0) {
                const mid = (rMin + rMax) / 2;
                const dist = Math.abs(val - mid);
                const range = rMax - rMin || 1;
                bestScore = Math.max(bestScore, Math.round(Math.max(0, 1 - dist / (range * 3)) * 60));
                if (val < rMin) {
                    errors.push(`Resistor ${formatResistor(val)} too low — need ≥ ${formatResistor(rMin)}`);
                } else {
                    errors.push(`Resistor ${formatResistor(val)} too high — need ≤ ${formatResistor(rMax)}`);
                }
            }
        }
        efficiencyScore = bestScore;
    }

    // ── 3. POWER SUPPLY ────────────────────────────────────────────────────
    const hasPower = components.some((c) => c.type === 'power');
    const hasGnd = components.some((c) => c.type === 'gnd');

    if (!hasPower) errors.push('Missing power supply component');
    if (!hasGnd) errors.push('Missing GND component');

    if (hasPower && hasGnd) {
        let pScore = 0;
        if (powerSupply.voltage >= scenario.requiredPower.minVoltage) {
            pScore += 50;
        } else {
            errors.push(`Supply ${powerSupply.voltage}V below ${scenario.requiredPower.minVoltage}V minimum`);
        }
        if (powerSupply.current >= scenario.requiredPower.minCurrent) {
            pScore += 50;
        } else {
            errors.push(`Supply ${powerSupply.current}mA below ${scenario.requiredPower.minCurrent}mA minimum`);
        }
        powerScore = pScore;
    }

    // ── 4. GPIO PIN ────────────────────────────────────────────────────────
    const esp32s = components.filter((c) => c.type === 'esp32');
    if (esp32s.length === 0) {
        errors.push('No ESP32 placed — microcontroller required');
        reasoningScore = Math.max(0, reasoningScore - 20);
    } else {
        const hasCorrectGPIO = esp32s.some((e) => e.gpioPin === scenario.requiredGPIO);
        if (hasCorrectGPIO) {
            reasoningScore = Math.min(100, reasoningScore + 10);
        } else {
            const actual = esp32s.map((e) => e.gpioPin).join(', ');
            errors.push(`GPIO ${actual} incorrect — scenario requires ${scenario.requiredGPIO}`);
            reasoningScore = Math.max(0, reasoningScore - 10);
        }
    }

    // ── 5. SENSOR TYPE ─────────────────────────────────────────────────────
    if (scenario.requiredSensorType) {
        const sensors = components.filter((c) => c.type === 'sensor');
        if (sensors.length === 0) {
            errors.push(`No sensor placed — ${scenario.requiredSensorType} required`);
        } else {
            const hasCorrect = sensors.some((s) => s.sensorType === scenario.requiredSensorType);
            if (!hasCorrect) {
                const actual = sensors.map((s) => s.sensorType).join(', ');
                errors.push(`Sensor type ${actual} incorrect — need ${scenario.requiredSensorType}`);
            } else {
                reasoningScore = Math.min(100, reasoningScore + 5);
            }
        }
    }

    // ── 6. FLOATING COMPONENTS ─────────────────────────────────────────────
    for (const comp of components) {
        const isConnected = connections.some((c) => c.fromId === comp.id || c.toId === comp.id);
        if (!isConnected) {
            errors.push(`${comp.label} is floating — not connected`);
        }
    }

    // ── 7. FEEDBACK ────────────────────────────────────────────────────────
    const success = errors.length === 0;
    let feedback: string;

    if (success) {
        feedback = `🎉 Perfect! All connections correct, resistor ${formatResistor(resistors[0]?.resistorValue ?? 0)} is optimal, and ${scenario.requiredGPIO} is properly configured.`;
    } else if (errors.length <= 2) {
        feedback = `⚡ Almost! ${errors.length} issue${errors.length > 1 ? 's' : ''} remaining. ${scenario.hint}`;
    } else {
        feedback = `🔧 ${errors.length} issues. ${scenario.hint}`;
    }

    // Clamp
    reasoningScore = Math.max(0, Math.min(100, reasoningScore));
    efficiencyScore = Math.max(0, Math.min(100, efficiencyScore));
    powerScore = Math.max(0, Math.min(100, powerScore));

    return { success, reasoningScore, efficiencyScore, powerScore, feedback, errors };
}
