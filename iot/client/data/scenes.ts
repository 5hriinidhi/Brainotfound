import { Scene } from '@/types/game';

export const scenes: Record<string, Scene> = {
    'scene-1': {
        id: 'scene-1',
        background: 'lab1.jpg',
        character: 'SYSTEM ALERT',
        dialogue:
            'Critical anomaly detected in Sector 7 IoT cluster. Sensor nodes are reporting inconsistent temperature readings. Energy consumption has spiked 340% above baseline. How do you respond?',
        timer: 20,
        choices: [
            {
                text: '🔍 Isolate Sector 7 and run diagnostics',
                effects: { reasoning: +15, efficiency: +5, stability: -10, score: 20 },
                nextScene: 'scene-2',
            },
            {
                text: '⚡ Cut power to the sector immediately',
                effects: { reasoning: -5, efficiency: +15, powerAwareness: +10, stability: +5, score: 10 },
                nextScene: 'scene-2',
            },
        ],
    },

    'scene-2': {
        id: 'scene-2',
        background: 'lab2.jpg',
        character: 'FIELD AGENT',
        dialogue:
            'Diagnostics reveal a rogue firmware update has corrupted 12 edge devices. They are now transmitting garbage data and consuming bandwidth. The network is degrading. Every second counts.',
        timer: 18,
        choices: [
            {
                text: '🛠 Push emergency rollback firmware OTA',
                effects: { reasoning: +10, efficiency: +10, stability: +15, score: 25 },
                nextScene: 'scene-3',
            },
            {
                text: '🔌 Physically pull the affected nodes offline',
                effects: { reasoning: +5, efficiency: -10, powerAwareness: +15, stability: +20, score: 15 },
                nextScene: 'scene-3',
            },
        ],
    },

    'scene-3': {
        id: 'scene-3',
        background: 'lab3.jpg',
        character: 'POWER MONITOR',
        dialogue:
            'The grid stabilizer is reporting cascading overload from the compromised nodes. If not resolved in 15 seconds, the entire facility will trigger a safety shutdown. The backup generator is at 60% capacity.',
        timer: 15,
        choices: [
            {
                text: '⚙️ Reroute load to backup generator circuits',
                effects: { reasoning: +10, powerAwareness: +20, stability: +10, score: 30 },
                nextScene: 'scene-4',
            },
            {
                text: '💡 Activate demand-response and shed non-critical loads',
                effects: { efficiency: +20, powerAwareness: +10, stability: +5, score: 20 },
                nextScene: 'scene-4',
            },
        ],
    },

    'scene-4': {
        id: 'scene-4',
        background: 'lab4.jpg',
        character: 'CHIEF ENGINEER',
        dialogue:
            'Crisis contained. The compromised nodes are isolated and power is stable. Now you must decide how to harden the system against future attacks. Resources are limited — choose wisely.',
        timer: 22,
        choices: [
            {
                text: '🧠 Deploy AI-driven anomaly detection across all nodes',
                effects: { reasoning: +20, efficiency: +10, score: 40 },
                nextScene: 'COMPLETE',
            },
            {
                text: '🔒 Implement hardware attestation and encrypted comms',
                effects: { powerAwareness: +10, stability: +20, efficiency: +5, score: 35 },
                nextScene: 'COMPLETE',
            },
        ],
    },
};

export const SCENE_ORDER = ['scene-1', 'scene-2', 'scene-3', 'scene-4'];
export const INITIAL_SCENE = 'scene-1';
