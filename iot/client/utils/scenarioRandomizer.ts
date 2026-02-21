/**
 * Scenario Randomizer — resolves a CircuitScenarioTemplate into a
 * playable CircuitScenario with randomized GPIO, resistor range,
 * and sensor type.
 *
 * Called once when a player selects a scenario, producing unique
 * parameters for each play session.
 */
import {
    CircuitScenarioTemplate,
    CircuitScenario,
    SensorType,
    RESISTOR_VALUES,
    GPIO_PINS,
} from '@/types/circuit';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Pick a random element from an array */
function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick a random valid resistor range from the given bounds.
 * bounds = [minLow, maxLow, minHigh, maxHigh]
 * Returns [low, high] where low ∈ [minLow..maxLow] and high ∈ [minHigh..maxHigh]
 * Both values are snapped to the nearest standard resistor value.
 */
function randomResistorRange(bounds: [number, number, number, number]): [number, number] {
    const [minLow, maxLow, minHigh, maxHigh] = bounds;
    const vals = [...RESISTOR_VALUES];

    // Find valid values for low
    const lowCandidates = vals.filter((v) => v >= minLow && v <= maxLow);
    const low = lowCandidates.length > 0 ? pick(lowCandidates) : minLow;

    // Find valid values for high
    const highCandidates = vals.filter((v) => v >= minHigh && v <= maxHigh);
    const high = highCandidates.length > 0 ? pick(highCandidates) : maxHigh;

    return [low, high];
}

/** Format resistor value for display */
export function formatResistor(ohms: number): string {
    if (ohms >= 1000) return `${ohms / 1000}kΩ`;
    return `${ohms}Ω`;
}

// ── Main Randomizer ──────────────────────────────────────────────────────────

/**
 * Resolve a scenario template into a randomized, playable scenario.
 */
export function randomizeScenario(template: CircuitScenarioTemplate): CircuitScenario {
    const { randomizableValues } = template;

    // 1. Randomize GPIO
    let requiredGPIO = template.requiredGPIO;
    if (randomizableValues.gpioPins && randomizableValues.gpioPins.length > 0) {
        requiredGPIO = pick(randomizableValues.gpioPins);
    }

    // 2. Randomize resistor range
    let resistorRange = template.resistorRange;
    if (randomizableValues.resistorBounds) {
        resistorRange = randomResistorRange(randomizableValues.resistorBounds);
    }

    // 3. Randomize sensor type
    let requiredSensorType: SensorType | undefined;
    if (randomizableValues.sensorTypes && randomizableValues.sensorTypes.length > 0) {
        requiredSensorType = pick(randomizableValues.sensorTypes);
    }

    // 4. Build dynamic description with resolved values
    const description = template.description
        .replace(/{GPIO}/g, requiredGPIO)
        .replace(/{RESISTOR_MIN}/g, formatResistor(resistorRange[0]))
        .replace(/{RESISTOR_MAX}/g, formatResistor(resistorRange[1]))
        .replace(/{SENSOR}/g, requiredSensorType ?? 'Sensor');

    const hint = template.hint
        .replace(/{GPIO}/g, requiredGPIO)
        .replace(/{RESISTOR_MIN}/g, formatResistor(resistorRange[0]))
        .replace(/{RESISTOR_MAX}/g, formatResistor(resistorRange[1]))
        .replace(/{SENSOR}/g, requiredSensorType ?? 'Sensor');

    return {
        id: template.id,
        background: template.background,
        title: template.title,
        description,
        difficulty: template.difficulty,
        requiredConnections: template.requiredConnections,
        resistorRange,
        requiredGPIO,
        requiredPower: template.requiredPower,
        requiredSensorType,
        hint,
    };
}

/**
 * Randomize all scenarios from an array of templates.
 */
export function randomizeAllScenarios(
    templates: CircuitScenarioTemplate[],
): CircuitScenario[] {
    return templates.map(randomizeScenario);
}
