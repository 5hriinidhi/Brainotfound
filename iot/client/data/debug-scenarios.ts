import { Scene } from '@/types/game';

const backgrounds = ['lab1.jpg', 'lab2.jpg', 'lab3.jpg', 'lab4.jpg'];
const bg = () => backgrounds[Math.floor(Math.random() * backgrounds.length)];

export const debugScenarios: Scene[] = [
    // ─── Q1: ESP32 Restarts During Wi-Fi ─────────────────────────────────────
    {
        id: 'debug-1',
        background: bg(),
        character: 'LAB INSTRUCTOR',
        dialogue:
            'An ESP32 connected to GPIO 14 keeps restarting whenever it tries to connect to Wi-Fi. The serial monitor shows "Brownout detector was triggered." The board is powered via a 3.3V pin from an external 500mA supply. What is the most likely cause?',
        timer: 25,
        choices: [
            {
                text: '⚡ The 500mA supply is insufficient — ESP32 Wi-Fi draws up to 300mA peak, causing voltage dips and brownout resets',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Switch to a 5V 2A supply through the USB port to provide adequate current headroom',
                effects: { reasoning: 10, efficiency: 5, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 The Wi-Fi library is outdated and needs a firmware update',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🛠 Replace the ESP32 board — it is likely defective',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q2: LED Not Lighting ────────────────────────────────────────────────
    {
        id: 'debug-2',
        background: bg(),
        character: 'CIRCUIT ANALYST',
        dialogue:
            'An LED wired to GPIO 27 with a 10kΩ resistor does not light up. The pin is set HIGH in code and reads 3.3V with a multimeter. The LED is rated for 20mA forward current at 2.1V. The ground connection runs through a breadboard rail. What is wrong?',
        timer: 22,
        choices: [
            {
                text: '💡 The 10kΩ resistor limits current to ~0.12mA — far below the LED\'s 20mA rating. Replace with a 220Ω resistor',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Check if the breadboard ground rail is actually connected to the ESP32 GND — broken rails are common',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 The LED polarity might be reversed — flip the anode and cathode',
                effects: { reasoning: -5, efficiency: 0, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚙️ Change the GPIO pin mode to OUTPUT in code',
                effects: { reasoning: -10, efficiency: -5, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q3: ESP32 Not Detected by PC ───────────────────────────────────────
    {
        id: 'debug-3',
        background: bg(),
        character: 'USB DIAGNOSTICS',
        dialogue:
            'Your ESP32 DevKit V1 is not appearing in the Arduino IDE port list when plugged via USB. Other USB devices work on the same port. The board\'s power LED is ON. You\'re running macOS. What should you check first?',
        timer: 22,
        choices: [
            {
                text: '🔌 Verify you\'re using a data-capable USB cable — many cables are charge-only and lack D+/D- data lines',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 5, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '💻 Install the CP2102/CH340 USB-to-serial driver for macOS — the board\'s USB bridge chip needs a driver',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Restart the Arduino IDE and rescan ports',
                effects: { reasoning: -5, efficiency: 0, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ The board is damaged — the USB connector needs resoldering',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q4: Code Upload Fails "Timed Out" ──────────────────────────────────
    {
        id: 'debug-4',
        background: bg(),
        character: 'FIRMWARE ENGINEER',
        dialogue:
            'Uploading code to an ESP32-WROOM-32 fails with "A fatal error occurred: Timed out waiting for packet header." The correct board and port are selected. The serial monitor was open during upload. What should you do?',
        timer: 22,
        choices: [
            {
                text: '🔘 Hold the BOOT button while clicking upload, release after "Connecting..." appears — this forces download mode',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 10, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📟 Close the serial monitor first — it may be locking the COM port and preventing upload',
                effects: { reasoning: 10, efficiency: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Change the baud rate from 115200 to 9600 in the IDE settings',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Use a different USB hub — the current one has insufficient bandwidth',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q5: Sensor Outputs Erratic ──────────────────────────────────────────
    {
        id: 'debug-5',
        background: bg(),
        character: 'SENSOR TECH',
        dialogue:
            'An MQ-135 gas sensor connected to GPIO 36 (ADC1) is giving wildly fluctuating readings between 0 and 4095. The sensor VCC is 5V, GND is connected, and the analog output goes to the ESP32 ADC pin. A 100Ω pull-down resistor is used. What is causing the erratic output?',
        timer: 25,
        choices: [
            {
                text: '📡 GPIO 36 is input-only with no internal pull-up. The ADC input is floating — add a proper voltage divider to scale 5V sensor output to 3.3V range',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 The SDA and SCL lines may be swapped in the wiring harness — verify with the datasheet pinout',
                effects: { reasoning: 5, efficiency: 5, powerAwareness: 10, stability: 5, score: 15 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ The sensor needs a longer warm-up time — wait 24 hours before taking readings',
                effects: { reasoning: -5, efficiency: -10, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Reset the ESP32 to factory firmware to fix the ADC calibration',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q6: Board Erratic on Wi-Fi — Power Issue ───────────────────────────
    {
        id: 'debug-6',
        background: bg(),
        character: 'POWER SYSTEMS',
        dialogue:
            'An ESP32 with a DHT22 sensor and 0.96" OLED display behaves erratically when connecting to Wi-Fi — the display flickers and sensor readings freeze. Everything works fine without Wi-Fi. The board is powered by a 3.3V/150mA LDO regulator. What power supply issue should you investigate?',
        timer: 22,
        choices: [
            {
                text: '⚡ The 150mA LDO is insufficient — ESP32 Wi-Fi peaks at 300mA. Use a 3.3V/1A regulator or power via USB with onboard regulator',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔋 Add a 100µF decoupling capacitor near the ESP32 power pins to absorb current spikes during Wi-Fi transmission',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 15, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '📡 Switch to a different Wi-Fi channel to reduce interference',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Downgrade the ESP32 core library to an older version',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q7: DHT Sensor Invalid Values ──────────────────────────────────────
    {
        id: 'debug-7',
        background: bg(),
        character: 'SENSOR CALIBRATION',
        dialogue:
            'A DHT11 sensor on GPIO 4 returns "nan" for both temperature and humidity. The wiring shows VCC→3.3V, GND→GND, DATA→GPIO 4. No external components are added. The code uses the DHT library with DHT11 type. What is the most likely fix?',
        timer: 22,
        choices: [
            {
                text: '🔌 Add a 4.7kΩ pull-up resistor between the DATA line and VCC — DHT sensors require an external pull-up for reliable one-wire communication',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 10, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '⏱ Add a 2-second delay between consecutive reads — DHT11 has a minimum sampling period of 1 second',
                effects: { reasoning: 10, efficiency: 5, powerAwareness: 5, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Switch from 3.3V to 5V power for the DHT11',
                effects: { reasoning: -5, efficiency: 0, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '💻 Use a different GPIO pin — GPIO 4 does not support digital input',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q8: High Power Consumption ─────────────────────────────────────────
    {
        id: 'debug-8',
        background: bg(),
        character: 'POWER AUDITOR',
        dialogue:
            'Your IoT prototype draws 420mA at idle — way above the expected 80mA. The circuit includes an ESP32, two LEDs with 68Ω resistors, an MQ-2 gas sensor, and a relay module. The relay is in NO (open) state. What steps would you take to isolate the power draw?',
        timer: 25,
        choices: [
            {
                text: '🔍 Disconnect modules one-by-one while measuring current — the MQ-2 heater alone draws ~150mA, and the 68Ω LED resistors pass ~18mA each at 3.3V',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 Use a USB power meter to measure total draw, then remove the relay and MQ-2 to compare baseline consumption',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '💤 Put the ESP32 in deep sleep mode to see if current drops',
                effects: { reasoning: -5, efficiency: -5, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔋 Replace the batteries — they might be depleted and causing high resistance',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q9: Firmware Resets Randomly ────────────────────────────────────────
    {
        id: 'debug-9',
        background: bg(),
        character: 'FIRMWARE DEBUG',
        dialogue:
            'An ESP32 running a sensor polling loop resets every 10–15 minutes. The reset reason in serial is "Task watchdog got triggered." The main loop reads from 3 I2C sensors and publishes to MQTT without any delay() calls. Heap free memory decreases over time. What is the likely cause?',
        timer: 25,
        choices: [
            {
                text: '🧠 The tight loop without delay() starves the watchdog and RTOS idle task. Add delay(10) or vTaskDelay() to yield CPU time, and fix the memory leak from unreleased MQTT buffers',
                effects: { reasoning: 20, efficiency: 10, powerAwareness: 5, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 Add heap monitoring with ESP.getFreeHeap() and identify which sensor read leaks memory — likely a String concatenation in the publish function',
                effects: { reasoning: 15, efficiency: 5, powerAwareness: 5, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 The I2C bus is locking up — add external pull-up resistors to SDA/SCL',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Increase the watchdog timeout to 30 seconds in menuconfig',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q10: Brownout Under WiFi Load ──────────────────────────────────────
    {
        id: 'debug-10',
        background: bg(),
        character: 'POWER SYSTEMS',
        dialogue:
            'An ESP32 soil moisture monitor works perfectly during standalone sensor reads. However, as soon as WiFi connects and begins uploading data, the board randomly restarts. Serial monitor shows "Brownout detector was triggered." Power supply is a 5V 500mA USB wall adapter. WiFi RSSI reads -70 dBm. What is the root cause?',
        timer: 25,
        choices: [
            {
                text: '⚡ WiFi transmission spikes ESP32 current to ~400–500mA. The 500mA supply leaves zero headroom → voltage dips below brownout threshold. Upgrade to a 5V 2A supply or add a 1000µF decoupling capacitor near VIN',
                effects: { reasoning: 20, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔋 Add a large electrolytic capacitor (470µF+) across the power rails to absorb WiFi transmission current spikes and prevent voltage dips',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 15, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '📡 The WiFi signal is too weak (-70 dBm), causing the radio to boost power. Move closer to the router',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Flash a different WiFi library — the current one has a bug causing excessive current draw',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q11: LED Glows Dim but Board Runs Fine ─────────────────────────────
    {
        id: 'debug-11',
        background: bg(),
        character: 'CIRCUIT ANALYST',
        dialogue:
            'A simple LED circuit: GPIO set as OUTPUT HIGH (3.3V). LED is connected with a 10kΩ series resistor. The LED glows extremely dim — barely visible. The board itself is operating normally, and the multimeter confirms 3.3V at the GPIO pin. LED forward voltage is 2.1V. What is wrong?',
        timer: 20,
        choices: [
            {
                text: '💡 10kΩ limits current to only (3.3V - 2.1V) / 10000Ω ≈ 0.12mA. LEDs need 10–20mA. Replace the resistor with 220Ω–330Ω to get proper brightness',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Use a MOSFET driver to boost the current from the GPIO — the pin cannot source enough current for the LED',
                effects: { reasoning: 5, efficiency: 5, powerAwareness: 10, stability: 5, score: 15 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 The LED is dying — replace it with a new one',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Increase GPIO voltage to 5V using a level shifter',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q12: Analog Sensor Always Reads 1023 ───────────────────────────────
    {
        id: 'debug-12',
        background: bg(),
        character: 'SENSOR TECH',
        dialogue:
            'An analog LDR (light-dependent resistor) circuit always reads 1023 on the ADC — the maximum value — regardless of ambient light conditions. The LDR is connected in a voltage divider configuration. When you check with a multimeter, the ADC pin measures 3.3V. The LDR resistance varies from 200Ω (bright) to 10kΩ (dark). What is wrong with the circuit?',
        timer: 22,
        choices: [
            {
                text: '📊 The voltage divider is miswired — the LDR is likely connected directly between VCC and the ADC pin (top position) without a proper series resistor to GND. The midpoint always reads near VCC. Rewire: LDR from VCC to ADC, fixed 10kΩ from ADC to GND',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 The ADC reference voltage might be set incorrectly — configure the attenuation to 11dB for full 3.3V range',
                effects: { reasoning: 10, efficiency: 5, powerAwareness: 5, stability: 5, score: 15 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 The LDR is defective — replace it with a phototransistor',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚙️ Change the ADC resolution from 10-bit to 12-bit in code',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q13: I2C Sensor Not Responding ──────────────────────────────────────
    {
        id: 'debug-13',
        background: bg(),
        character: 'BUS DIAGNOSTICS',
        dialogue:
            'An SSD1306 OLED display on I2C is not detected. SDA is on GPIO21, SCL on GPIO22 — correct per the datasheet. Pull-up resistors (4.7kΩ) are installed. The board detects address 0x3C in the I2C scanner. However, you also have a BME280 sensor that also uses address 0x3C. The OLED screen stays black. What is the root cause?',
        timer: 25,
        choices: [
            {
                text: '🔍 I2C address conflict — both devices claim 0x3C. The bus arbitration fails silently. Solution: Change the BME280 address to 0x77 (via SDO pin) OR use an I2C multiplexer (TCA9548A)',
                effects: { reasoning: 15, efficiency: 15, powerAwareness: 10, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📟 Run the I2C scanner with each device individually to confirm addresses, then reassign using address select pins if available',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔌 Try different GPIO pins for SDA/SCL',
                effects: { reasoning: -5, efficiency: -5, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Increase pull-up resistor value to 10kΩ — the 4.7kΩ is too strong',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q14: Random Noise in Ultrasonic Readings ───────────────────────────
    {
        id: 'debug-14',
        background: bg(),
        character: 'EMI SPECIALIST',
        dialogue:
            'An HC-SR04 ultrasonic distance sensor gives wildly fluctuating readings (jumping ±30cm) even when measuring a stationary wall at 50cm. The readings were accurate on the lab bench but became erratic after deployment. The sensor is now mounted 10cm from a DC motor driver (L298N). PWM frequency is 1kHz. What is causing the noise?',
        timer: 25,
        choices: [
            {
                text: '⚡ Electromagnetic interference (EMI) from the motor driver is coupling into the sensor trigger/echo lines. Add 100nF decoupling capacitors at the sensor power pins, use shielded cables, and separate motor and sensor ground paths (star grounding)',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📏 Physically separate the sensor from the motor driver — maintain at least 30cm distance and add a metal shield plate between them',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 10, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Switch to a different ultrasonic sensor model',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '📡 The sensor echo pin needs pull-up resistors',
                effects: { reasoning: -10, efficiency: -10, stability: -10, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q15: Board Freezes After Few Minutes ───────────────────────────────
    {
        id: 'debug-15',
        background: bg(),
        character: 'MEMORY ANALYST',
        dialogue:
            'An ESP32 logs data every second to serial and sends via HTTP POST. After approximately 5 minutes of operation, the board completely freezes. No serial output, no response. ESP.getFreeHeap() shows memory decreasing from 160KB to 10KB over 5 minutes. The code builds HTTP payloads using Arduino String concatenation in a loop. What is happening?',
        timer: 25,
        choices: [
            {
                text: '🧠 Heap fragmentation from dynamic String allocation. Each String concatenation creates new heap objects, and freed memory becomes fragmented small blocks that cannot be reused. Solution: Use fixed-size char[] buffers with snprintf() instead of String',
                effects: { reasoning: 20, efficiency: 10, powerAwareness: 5, stability: 15, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '📊 The HTTP client is not properly closing connections, leaking socket handles and associated buffers. Add http.end() after each request',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '⏱ Add a delay between logs to give the system time to reclaim memory',
                effects: { reasoning: -5, efficiency: -5, stability: -5, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Increase the PSRAM allocation to prevent memory issues',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q16: Touch Sensor Triggers Randomly ────────────────────────────────
    {
        id: 'debug-16',
        background: bg(),
        character: 'INPUT SYSTEMS',
        dialogue:
            'A capacitive touch input on GPIO 15 triggers randomly even without any physical contact. The touch threshold is set to 40 in code. Long jumper wires (~20cm) connect the touch pad to the ESP32. The setup is on a plastic desk. No pull-down resistor is used. What is causing the false triggers?',
        timer: 22,
        choices: [
            {
                text: '📡 The long unshielded wires act as antennas, picking up ambient EMI that exceeds the touch threshold. The floating input has no reference voltage. Solution: Add a 1MΩ pull-down resistor, use shorter shielded wires, and increase the touch threshold to 50-60',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 15, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔧 Enable the ESP32 internal pull-down on the touch pin and add software debouncing (require 3 consecutive reads below threshold)',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 5, stability: 10, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 Use a different GPIO pin — GPIO 15 has special boot behavior',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '⚡ Lower the touch threshold to 20 for stronger detection',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },

    // ─── Q17: ESP32 Gets Warm Without Load ──────────────────────────────────
    {
        id: 'debug-17',
        background: bg(),
        character: 'VOLTAGE ANALYST',
        dialogue:
            'An ESP32 DevKit board is noticeably warm to the touch even with no peripherals connected and no code running. No sensors, no WiFi active. A student connected 5V directly to the 3.3V pin (not VIN). The multimeter reads 4.8V on the 3.3V rail. The onboard AMS1117 regulator is bypassed. What is happening?',
        timer: 22,
        choices: [
            {
                text: '🔥 Overvoltage damage — the ESP32 operates at 3.3V with absolute max 3.6V. Feeding 5V directly into the 3.3V pin bypasses the onboard voltage regulator, overstressing the chip\'s internal circuitry and causing excessive heat. Must use the VIN pin or USB port for 5V',
                effects: { reasoning: 15, efficiency: 10, powerAwareness: 20, stability: 10, score: 30 },
                nextScene: 'NEXT',
            },
            {
                text: '🔋 The 5V is overdriving the internal LDO. Route power through the VIN pin instead, which feeds the AMS1117 3.3V regulator before the chip',
                effects: { reasoning: 10, efficiency: 10, powerAwareness: 15, stability: 5, score: 20 },
                nextScene: 'NEXT',
            },
            {
                text: '🔄 The ESP32 chip is defective — some batches run hot by default',
                effects: { reasoning: -5, efficiency: -5, stability: -10, score: 5 },
                nextScene: 'NEXT',
            },
            {
                text: '📡 WiFi may be enabled by default in the bootloader, drawing power',
                effects: { reasoning: -10, efficiency: -10, stability: -15, score: 0 },
                nextScene: 'NEXT',
            },
        ],
    },
];
