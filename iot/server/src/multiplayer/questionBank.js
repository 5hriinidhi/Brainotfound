/**
 * questionBank — Server-side question pool for 1v1 multiplayer.
 *
 * Each question has a scenario, 4 choices, a correctIndex,
 * difficulty, and points. Uses Fisher-Yates to pick 5 random questions.
 */

const questions = [
    // ── Easy ─────────────────────────────────────────────────────────
    {
        id: 'mp-1',
        scenario: 'An ESP32 is not connecting to WiFi. The serial monitor shows "WiFi: DISCONNECTED". What is the most likely cause?',
        choices: [
            'Wrong SSID or password in code',
            'LED is not connected',
            'Motor driver is overheating',
            'I2C address conflict',
        ],
        correctIndex: 0,
        difficulty: 'easy',
        points: 10,
    },
    {
        id: 'mp-2',
        scenario: 'A temperature sensor reads -127°C. What does this usually indicate?',
        choices: [
            'Sensor is working correctly in cold environment',
            'Sensor data pin is not connected or incorrect wiring',
            'Power supply voltage is too high',
            'Serial baud rate mismatch',
        ],
        correctIndex: 1,
        difficulty: 'easy',
        points: 10,
    },
    {
        id: 'mp-3',
        scenario: 'An LED connected to GPIO 2 does not turn on. The code sets GPIO 2 HIGH. What should you check first?',
        choices: [
            'Check if LED is connected with correct polarity and a current-limiting resistor',
            'Replace the microcontroller',
            'Update the WiFi firmware',
            'Change the I2C address',
        ],
        correctIndex: 0,
        difficulty: 'easy',
        points: 10,
    },
    {
        id: 'mp-4',
        scenario: 'MQTT messages are being published but the subscriber receives nothing. Both use the same broker. What is the most likely issue?',
        choices: [
            'Broker is offline',
            'Topic names do not match between publisher and subscriber',
            'WiFi signal is too weak',
            'Sensor is faulty',
        ],
        correctIndex: 1,
        difficulty: 'easy',
        points: 10,
    },

    // ── Medium ───────────────────────────────────────────────────────
    {
        id: 'mp-5',
        scenario: 'An LDR sensor always reads 1023 (max ADC). The room has normal lighting. What is the problem?',
        choices: [
            'LDR is broken and needs replacement',
            'The voltage divider resistor is missing or incorrect',
            'ADC resolution is set too high',
            'WiFi interference is corrupting readings',
        ],
        correctIndex: 1,
        difficulty: 'medium',
        points: 20,
    },
    {
        id: 'mp-6',
        scenario: 'A servo motor jitters continuously at its set position. What is the most likely cause?',
        choices: [
            'Insufficient power supply — servo draws more current than the source can provide',
            'Wrong programming language used',
            'Servo is connected to the wrong GPIO pin type',
            'The servo needs firmware update',
        ],
        correctIndex: 0,
        difficulty: 'medium',
        points: 20,
    },
    {
        id: 'mp-7',
        scenario: 'Dashboard shows temperature spikes of +50°C that last only 1 second before returning to normal. What is this?',
        choices: [
            'Actual temperature spikes from nearby heat source',
            'Sensor noise / outlier data that should be filtered',
            'WiFi packet loss causing data corruption',
            'Browser rendering bug',
        ],
        correctIndex: 1,
        difficulty: 'medium',
        points: 20,
    },
    {
        id: 'mp-8',
        scenario: 'An ESP32 brownouts (resets) every time WiFi connects. The USB serial shows "Brownout detector was triggered". What is wrong?',
        choices: [
            'Code has an infinite loop',
            'GPIO pins are misconfigured',
            'Power supply cannot handle WiFi current draw — use a proper 5V/2A adapter',
            'WiFi library is outdated',
        ],
        correctIndex: 2,
        difficulty: 'medium',
        points: 20,
    },
    {
        id: 'mp-9',
        scenario: 'A touch sensor on ESP32 triggers randomly without being touched. What is the fix?',
        choices: [
            'Add a pull-down resistor or increase the touch threshold',
            'Change WiFi channel',
            'Replace the ESP32 board',
            'Use a different programming language',
        ],
        correctIndex: 0,
        difficulty: 'medium',
        points: 20,
    },

    // ── Hard ─────────────────────────────────────────────────────────
    {
        id: 'mp-10',
        scenario: 'Two I2C devices (OLED display and BME280 sensor) both have address 0x76. The bus shows erratic behavior. How do you resolve this?',
        choices: [
            'Use a longer cable',
            'Change one device to its alternate I2C address (e.g., 0x77) using the SDO pin',
            'Remove pull-up resistors from the bus',
            'Switch to WiFi communication instead',
        ],
        correctIndex: 1,
        difficulty: 'hard',
        points: 30,
    },
    {
        id: 'mp-11',
        scenario: 'A factory\'s DHCP server runs out of IP addresses, causing new IoT sensors to fail to connect. What is the proper solution?',
        choices: [
            'Restart all sensors simultaneously',
            'Assign static IPs to all sensors manually',
            'Expand DHCP pool range or reduce lease time, and implement IP address planning',
            'Switch from WiFi to Bluetooth',
        ],
        correctIndex: 2,
        difficulty: 'hard',
        points: 30,
    },
    {
        id: 'mp-12',
        scenario: 'IoT devices reset at midnight every night. OTA updates are scheduled at 23:55. Memory usage is at 89%. What is the root cause?',
        choices: [
            'Power grid fluctuations at midnight',
            'OTA update process exhausts remaining memory, causing watchdog timer reset',
            'Server maintenance window conflicts',
            'Temperature drops at night affect the processor',
        ],
        correctIndex: 1,
        difficulty: 'hard',
        points: 30,
    },
    {
        id: 'mp-13',
        scenario: 'An ultrasonic distance sensor gives erratic readings when a motor driver is active nearby. What type of interference is this?',
        choices: [
            'Radio frequency interference from WiFi',
            'Electromagnetic interference (EMI) from the motor driver affecting ultrasonic pulses',
            'Power supply voltage fluctuation only',
            'Software timing conflict in the interrupt handler',
        ],
        correctIndex: 1,
        difficulty: 'hard',
        points: 30,
    },
    {
        id: 'mp-14',
        scenario: 'An ESP32 runs out of heap memory after 72 hours, causing crashes. The code creates String objects in a loop. What is the issue?',
        choices: [
            'ESP32 has insufficient flash storage',
            'WiFi library has a known bug',
            'Dynamic String allocation causes heap fragmentation — use fixed char buffers instead',
            'The loop runs too fast and needs a delay',
        ],
        correctIndex: 2,
        difficulty: 'hard',
        points: 30,
    },
    {
        id: 'mp-15',
        scenario: 'BLE devices in a warehouse interfere with each other. Signal quality drops during peak hours. What is the underlying problem?',
        choices: [
            'BLE devices need firmware updates',
            'Warehouse metal structures block all signals',
            '2.4GHz spectrum congestion from overlapping BLE advertising channels',
            'BLE has a maximum device limit of 7',
        ],
        correctIndex: 2,
        difficulty: 'hard',
        points: 30,
    },
];

/**
 * Fisher-Yates shuffle and pick `count` random questions.
 */
function pickRandomQuestions(count = 5) {
    const pool = [...questions];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
}

module.exports = { questions, pickRandomQuestions };
