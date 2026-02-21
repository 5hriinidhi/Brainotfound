/**
 * Circuit Builder Types — definitions for the drag & drop circuit builder.
 *
 * All 9 Circuit Debug scenarios use this schema.
 * Crisis Mode remains VN/decision-based (separate system).
 */

// ─── Core Component Types ────────────────────────────────────────────────────

/** Available electronic component types */
export type ComponentType = 'esp32' | 'resistor' | 'led' | 'sensor' | 'power' | 'gnd';

/** Sensor subtypes */
export type SensorType = 'DHT11' | 'Ultrasonic' | 'LDR';

/** All possible resistor values (ohms) */
export const RESISTOR_VALUES = [10, 100, 220, 330, 470, 1000, 4700, 10000, 47000, 100000] as const;

/** All ESP32 GPIO pins */
export const GPIO_PINS = [
    'GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14',
    'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19',
    'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27',
    'GPIO32', 'GPIO33', 'GPIO34', 'GPIO35', 'GPIO36', 'GPIO39',
] as const;

// ─── Canvas / Connection ─────────────────────────────────────────────────────

/** A component placed on the canvas */
export interface PlacedComponent {
    id: string;
    type: ComponentType;
    label: string;
    gridX: number;
    gridY: number;
    resistorValue?: number;
    sensorType?: SensorType;
    gpioPin?: string;
}

/** A logical connection between two placed components */
export interface Connection {
    id: string;
    fromId: string;
    toId: string;
    fromPin: string;
    toPin: string;
}

/** Full circuit builder runtime state */
export interface CircuitState {
    components: PlacedComponent[];
    connections: Connection[];
    powerSupply: { voltage: number; current: number };
}

// ─── Palette ─────────────────────────────────────────────────────────────────

export interface PaletteItem {
    type: ComponentType;
    label: string;
    icon: string;
    description: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
    { type: 'esp32', label: 'ESP32', icon: '🔲', description: 'Microcontroller' },
    { type: 'resistor', label: 'Resistor', icon: '⏛', description: 'Current limiter' },
    { type: 'led', label: 'LED', icon: '💡', description: 'Light emitter' },
    { type: 'sensor', label: 'Sensor', icon: '📡', description: 'DHT11 / Ultrasonic / LDR' },
    { type: 'power', label: 'Power (3.3V)', icon: '🔋', description: 'Voltage source' },
    { type: 'gnd', label: 'GND', icon: '⏚', description: 'Ground reference' },
];

// ═══════════════════════════════════════════════════════════════════════════
// SCENARIO SCHEMA — used by all 9 Circuit Debug challenges
// ═══════════════════════════════════════════════════════════════════════════

/** Expected logical connection between component types */
export interface ExpectedConnection {
    from: ComponentType;
    to: ComponentType;
}

/** Which values can be randomized per scenario */
export interface RandomizableValues {
    /** Pool of valid GPIO pins to pick from */
    gpioPins?: readonly string[];
    /** [minLow, maxLow, minHigh, maxHigh] — defines the valid range boundaries */
    resistorBounds?: [number, number, number, number];
    /** Pool of sensor types to pick from */
    sensorTypes?: readonly SensorType[];
}

/**
 * A circuit scenario definition (template).
 * Stored in data/circuit-scenarios.ts.
 * The randomizer creates a resolved instance at game start.
 */
export interface CircuitScenarioTemplate {
    id: string;
    background: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    /** The required logical connection path */
    requiredConnections: ExpectedConnection[];
    /** Static resistor range (overridden if randomizable) */
    resistorRange: [number, number];
    /** Static required GPIO (overridden if randomizable) */
    requiredGPIO: string;
    /** Power supply requirements */
    requiredPower: { minVoltage: number; minCurrent: number };
    /** Which values get randomized each play */
    randomizableValues: RandomizableValues;
    /** Hint shown to the player */
    hint: string;
}

/**
 * A resolved (randomized) scenario — ready for validation.
 * Created by randomizeScenario() at game start.
 */
export interface CircuitScenario {
    id: string;
    background: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    requiredConnections: ExpectedConnection[];
    resistorRange: [number, number];
    requiredGPIO: string;
    requiredPower: { minVoltage: number; minCurrent: number };
    requiredSensorType?: SensorType;
    hint: string;
}

/** Validation result returned by the engine */
export interface ValidationResult {
    success: boolean;
    reasoningScore: number;
    efficiencyScore: number;
    powerScore: number;
    feedback: string;
    errors: string[];
}
