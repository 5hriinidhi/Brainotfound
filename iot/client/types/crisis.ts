/**
 * Crisis Sequence Types — defines the schema for the Sequence Builder mode.
 */

/** A single troubleshooting action the user can drag */
export interface TroubleshootAction {
    id: string;
    label: string;
    icon: string;
    description: string;
}

/** Master action pool — all possible troubleshooting steps */
export const ACTION_POOL: TroubleshootAction[] = [
    { id: 'ping-gateway', label: 'Ping Gateway', icon: '📡', description: 'Test network connectivity to gateway' },
    { id: 'check-wifi', label: 'Check Wi-Fi', icon: '📶', description: 'Verify Wi-Fi connection and signal' },
    { id: 'restart-node', label: 'Restart Node', icon: '🔄', description: 'Power-cycle the IoT device' },
    { id: 'verify-mqtt', label: 'Verify MQTT', icon: '🔌', description: 'Test MQTT broker connectivity' },
    { id: 'replace-sensor', label: 'Replace Sensor', icon: '🔧', description: 'Swap out the sensor hardware' },
    { id: 'check-power', label: 'Check Power Supply', icon: '⚡', description: 'Measure voltage and current draw' },
    { id: 'check-certs', label: 'Check TLS Certs', icon: '🔒', description: 'Verify SSL/TLS certificates' },
    { id: 'scan-spectrum', label: 'Scan RF Spectrum', icon: '📻', description: 'Analyze wireless interference' },
    { id: 'check-logs', label: 'Check System Logs', icon: '📋', description: 'Read serial/system log output' },
    { id: 'check-i2c', label: 'Check I2C Bus', icon: '🔍', description: 'Scan I2C addresses and wiring' },
    { id: 'check-firmware', label: 'Check Firmware', icon: '💾', description: 'Verify firmware version and state' },
    { id: 'check-antenna', label: 'Check Antenna', icon: '📡', description: 'Inspect antenna height and LOS' },
];

/** A crisis scenario with the optimal diagnostic sequence */
export interface CrisisSequenceScenario {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    /** Character name for flavor */
    character: string;
    /** The available actions for this scenario (subset of ACTION_POOL) */
    availableActionIds: string[];
    /** The optimal order of action IDs (correct sequence) */
    optimalSequence: string[];
    /** Number of steps the user must fill */
    sequenceLength: number;
    /** Explanation of why this order is optimal */
    explanation: string;
    /** Time limit in seconds */
    timerSeconds: number;
    /** Hint for the player */
    hint: string;
}

/** Validation result from the crisis validator */
export interface CrisisValidationResult {
    success: boolean;
    /** 0-100: how many positions are exactly correct */
    orderScore: number;
    /** 0-100: reasoning quality */
    reasoningScore: number;
    /** Time bonus */
    timeBonus: number;
    /** Total score */
    totalScore: number;
    /** Stability preserved (negative if wrong) */
    stabilityDelta: number;
    /** XP earned */
    xpEarned: number;
    /** Feedback message */
    feedback: string;
    /** Per-slot correctness */
    slotResults: ('correct' | 'partial' | 'wrong')[];
    /** The correct sequence for reveal */
    correctSequence: string[];
}
