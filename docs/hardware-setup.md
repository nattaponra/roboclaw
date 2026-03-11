# Hardware Setup Guide

Complete guide for connecting and configuring hardware components with RoboClaw on Raspberry Pi.

## Table of Contents

- [GPIO Basics](#gpio-basics)
- [Motor Controllers](#motor-controllers)
  - [L298N Motor Driver](#l298n-motor-driver)
  - [TB6612FNG Motor Driver](#tb6612fng-motor-driver)
- [Distance Sensors](#distance-sensors)
  - [HC-SR04 Ultrasonic Sensor](#hc-sr04-ultrasonic-sensor)
  - [VL53L0X ToF Sensor](#vl53l0x-tof-sensor)
- [Camera Setup](#camera-setup)
  - [Pi Camera](#pi-camera)
  - [USB Camera](#usb-camera)
- [Power Management](#power-management)
- [Safety Considerations](#safety-considerations)
- [Troubleshooting](#troubleshooting)

## GPIO Basics

### Raspberry Pi GPIO Pinout

Raspberry Pi 4/5 has 40 GPIO pins. Use **BCM numbering** (Broadcom chip pin numbers) in your configuration, not physical pin numbers.

**Important GPIO Pins:**
- **3.3V Power**: Pins 1, 17
- **5V Power**: Pins 2, 4
- **Ground (GND)**: Pins 6, 9, 14, 20, 25, 30, 34, 39
- **GPIO Pins**: BCM 2-27 (various physical locations)

**Reference:** [Official Pinout Diagram](https://pinout.xyz/)

### Enable GPIO Access

```bash
# Add your user to gpio group
sudo usermod -a -G gpio $USER

# Log out and back in for changes to take effect
```

### Install GPIO Libraries

```bash
# Install Node.js GPIO library
npm install onoff

# Install system GPIO tools (optional, for testing)
sudo apt install -y gpiod
```

### Test GPIO (Optional)

```bash
# List GPIO chips
gpioinfo

# Set GPIO 17 high
gpioset gpiochip0 17=1

# Set GPIO 17 low
gpioset gpiochip0 17=0
```

## Motor Controllers

### L298N Motor Driver

The L298N is a dual H-bridge motor driver that can control two DC motors.

#### Specifications

- **Voltage**: 5-35V DC (motor power)
- **Current**: Up to 2A per channel
- **Logic**: 5V (safe with 3.3V GPIO via current limiting)
- **PWM**: Supports speed control

#### Wiring Diagram

```
L298N          Raspberry Pi          Motors/Power
------         ------------          ------------
ENA      <-->  GPIO 12 (PWM)
IN1      <-->  GPIO 17
IN2      <-->  GPIO 27
IN3      <-->  GPIO 22
IN4      <-->  GPIO 23
ENB      <-->  GPIO 13 (PWM)

12V      <-->  12V Battery +
GND      <-->  Pi GND + Battery -
5V OUT   <-->  (Optional) Pi 5V if jumper removed

OUT1/OUT2 <--> Left Motor
OUT3/OUT4 <--> Right Motor
```

#### Important Notes

1. **Shared Ground**: Pi GND and battery GND must be connected
2. **Separate Power**: Use external battery for motors (6-12V), not Pi power
3. **5V Regulator**: Remove jumper on L298N if powering Pi from its 5V out
4. **PWM Pins**: Use hardware PWM pins (GPIO 12, 13, 18, 19)

#### Configuration

```yaml
features:
  movement:
    enabled: true
    motor_driver: "l298n"
    motors:
      left:
        pwm_pin: 12    # ENA
        in1_pin: 17    # IN1
        in2_pin: 27    # IN2
        max_speed: 255
      right:
        pwm_pin: 13    # ENB
        in1_pin: 22    # IN3
        in2_pin: 23    # IN4
        max_speed: 255
```

#### Testing

```typescript
import { L298NDriver } from '@nattaponra/roboclaw/hardware';

const driver = new L298NDriver({
  left: { pwm: 12, in1: 17, in2: 27 },
  right: { pwm: 13, in1: 22, in2: 23 }
});

await driver.init();

// Move forward at 50% speed for 2 seconds
await driver.setSpeed(127, 127);
await new Promise(resolve => setTimeout(resolve, 2000));

// Stop
await driver.setSpeed(0, 0);
await driver.cleanup();
```

### TB6612FNG Motor Driver

Smaller, more efficient alternative to L298N.

#### Specifications

- **Voltage**: 4.5-13.5V DC
- **Current**: Up to 1.2A per channel (3.2A peak)
- **Logic**: 3.3V/5V compatible
- **PWM**: Higher frequency support

#### Wiring Diagram

```
TB6612         Raspberry Pi          Motors/Power
------         ------------          ------------
PWMA     <-->  GPIO 12 (PWM)
AIN1     <-->  GPIO 17
AIN2     <-->  GPIO 27
BIN1     <-->  GPIO 22
BIN2     <-->  GPIO 23
PWMB     <-->  GPIO 13 (PWM)
STBY     <-->  3.3V (or GPIO)

VM       <-->  Battery + (6-12V)
VCC      <-->  3.3V
GND      <-->  Pi GND + Battery -

A01/A02  <-->  Left Motor
B01/B02  <-->  Right Motor
```

#### Configuration

```yaml
features:
  movement:
    enabled: true
    motor_driver: "tb6612"
    motors:
      left:
        pwm_pin: 12
        in1_pin: 17
        in2_pin: 27
      right:
        pwm_pin: 13
        in1_pin: 22
        in2_pin: 23
```

## Distance Sensors

### HC-SR04 Ultrasonic Sensor

Low-cost ultrasonic distance sensor (2cm - 400cm range).

#### Specifications

- **Voltage**: 5V
- **Range**: 2-400 cm
- **Accuracy**: ±3mm
- **Angle**: 15° cone

#### Wiring Diagram

```
HC-SR04        Raspberry Pi
-------        ------------
VCC      <-->  5V (Pin 2 or 4)
TRIG     <-->  GPIO 23
ECHO     <-->  GPIO 24 (via voltage divider!)
GND      <-->  GND
```

**CRITICAL - Voltage Divider for ECHO Pin:**

The ECHO pin outputs 5V, but Pi GPIO is 3.3V max. Use a voltage divider:

```
ECHO (5V) ---[1kΩ]--- GPIO 24
                  |
                [2kΩ]
                  |
                 GND
```

This reduces 5V to 3.3V: `5V * (2kΩ / (1kΩ + 2kΩ)) = 3.33V`

#### Configuration

```yaml
features:
  sensors:
    distance:
      enabled: true
      type: "hcsr04"
      trigger_pin: 23
      echo_pin: 24
      max_distance: 400
```

#### Testing

```typescript
import { HCSR04SensorDriver } from '@nattaponra/roboclaw/hardware';

const sensor = new HCSR04SensorDriver({ trigger: 23, echo: 24 });
await sensor.init();

const distance = await sensor.read();
console.log(`Distance: ${distance.distance} cm`);

await sensor.cleanup();
```

### VL53L0X ToF Sensor

I2C time-of-flight laser ranging sensor (more accurate than HC-SR04).

#### Specifications

- **Voltage**: 3.3V
- **Range**: 3-200 cm
- **Accuracy**: ±3%
- **Interface**: I2C

#### Wiring Diagram

```
VL53L0X        Raspberry Pi
-------        ------------
VIN      <-->  3.3V (Pin 1 or 17)
SCL      <-->  GPIO 3 (SCL, Pin 5)
SDA      <-->  GPIO 2 (SDA, Pin 3)
GND      <-->  GND
```

#### Enable I2C

```bash
# Enable I2C interface
sudo raspi-config
# Navigate to: Interface Options > I2C > Enable

# Install I2C tools
sudo apt install -y i2c-tools

# Test I2C (sensor should appear at 0x29)
i2cdetect -y 1
```

#### Configuration

```yaml
features:
  sensors:
    distance:
      enabled: true
      type: "vl53l0x"
      max_distance: 200
```

## Camera Setup

### Pi Camera

Official Raspberry Pi Camera Module v2 or v3.

#### Connection

1. **Locate Camera Port**: On Pi 4/5, between HDMI and audio jack
2. **Open Port**: Pull up on black connector edges
3. **Insert Cable**: Blue side facing audio jack, contacts facing HDMI
4. **Close Port**: Push down gently until it clicks

#### Enable Camera

```bash
# Enable camera interface
sudo raspi-config
# Navigate to: Interface Options > Camera > Enable

# Reboot
sudo reboot
```

#### Test Camera

```bash
# Install libcamera tools (pre-installed on newer Raspberry Pi OS)
sudo apt install -y libcamera-apps

# Take a test photo
libcamera-still -o test.jpg

# Test video preview (5 seconds)
libcamera-vid -t 5000
```

#### Configuration

```yaml
features:
  vision:
    enabled: true
    camera:
      type: "picamera"
      resolution: [1280, 720]
      fps: 30
```

### USB Camera

Any USB webcam compatible with V4L2 (Video4Linux2).

#### Connection

1. Plug USB camera into any USB port
2. Wait for device to be recognized

#### Identify Camera

```bash
# List video devices
ls -l /dev/video*

# Check camera details
v4l2-ctl --list-devices

# Test camera
ffplay /dev/video0  # Ctrl+C to exit
```

#### Configuration

```yaml
features:
  vision:
    enabled: true
    camera:
      type: "usb"
      device: 0  # /dev/video0
      resolution: [640, 480]
      fps: 30
```

## Power Management

### Power Requirements

**Raspberry Pi:**
- Pi 4: 5V @ 3A (15W)
- Pi 5: 5V @ 5A (25W)

**Motors (typical):**
- Small DC motors: 6-12V @ 1-2A each
- Servos: 5-6V @ 0.5-2A each

**Sensors/Peripherals:**
- Camera: +200mA
- USB devices: Variable
- GPIO sensors: Minimal (<50mA each)

### Power Solutions

#### Option 1: Separate Power Supplies (Recommended)

```
┌──────────────┐
│ Pi Power     │ 5V 3A USB-C
│ Supply       │────────────> Raspberry Pi
└──────────────┘

┌──────────────┐
│ Battery Pack │ 7.4-12V LiPo
│ (for motors) │────────────> Motor Driver
└──────────────┘                    |
                                   GND ──> Pi GND (shared ground)
```

#### Option 2: Buck Converter (Mobile Robots)

```
┌──────────────┐
│ 12V Battery  │
│ (LiPo/Li-Ion)│
└──┬───────┬───┘
   │       │
   │       └────────────> Motor Driver (12V)
   │
┌──▼──────────┐
│ Buck 12V→5V │
│ Converter   │
└──┬──────────┘
   │
   └────────────────────> Raspberry Pi (5V)
```

#### Option 3: Power Bank (Testing/Light Use)

```
┌──────────────┐
│ USB Power    │ 5V 3A
│ Bank         │────────────> Raspberry Pi
└──────────────┘
                          (Motors use separate battery)
```

### Battery Recommendations

**For Motors:**
- **LiPo 2S-3S** (7.4V - 11.1V): Best power-to-weight
- **Li-Ion 3S** (11.1V nominal): Safer, heavier
- **NiMH 8-cell** (9.6V): Budget option

**For Pi (if using buck converter):**
- **Capacity**: 5000mAh+ for several hours runtime
- **Output**: Continuous 3A+ for Pi 4, 5A+ for Pi 5

### Safety

1. **Fuse Protection**: Add 5A fuse to battery output
2. **Reverse Protection**: Use diode or MOSFET circuit
3. **Low Voltage Cutoff**: LiPo alarm or BMS
4. **Heat Sinks**: On motor drivers and buck converters
5. **Secure Connections**: Use connectors, not bare wires

## Safety Considerations

### Electrical Safety

- **Never exceed 3.3V on GPIO pins** (except 5V-tolerant power pins)
- **Use voltage dividers** for 5V sensors on 3.3V GPIO
- **Limit current** to 16mA per GPIO pin, 50mA total
- **Shared ground** required between all power supplies

### Motor Safety

- **Flyback diodes** on motor coils (usually built into drivers)
- **Emergency stop** button for mobile robots
- **Obstacle detection** to prevent collisions
- **Speed limits** in software (use `max_speed` config)

### Thermal Management

- **Ventilation** for Pi and motor drivers
- **Heat sinks** on motor driver chips
- **Temperature monitoring** with software

```typescript
// Example: Monitor CPU temperature
import { readFileSync } from 'fs';

const temp = parseInt(readFileSync('/sys/class/thermal/thermal_zone0/temp', 'utf8')) / 1000;
console.log(`CPU Temperature: ${temp}°C`);

if (temp > 80) {
  console.warn('High temperature! Reducing performance...');
  // Slow down or stop motors
}
```

## Troubleshooting

### GPIO Not Working

**Symptom**: "Permission denied" or "GPIO not found"

**Solution**:
```bash
# Add user to gpio group
sudo usermod -a -G gpio $USER

# Reboot or re-login
sudo reboot
```

### Motors Not Moving

**Checklist**:
1. ✓ Shared ground between Pi and motor driver?
2. ✓ Motor driver powered (check LED)?
3. ✓ Correct GPIO pins in config?
4. ✓ Enable pins (ENA/ENB) set high or connected to PWM?
5. ✓ Battery charged (measure voltage)?

**Test**:
```bash
# Manually set GPIO high
gpioset gpiochip0 17=1

# Check GPIO state
gpioget gpiochip0 17
```

### HC-SR04 Returns Inconsistent Values

**Common causes**:
1. **No voltage divider on ECHO**: Must use 3.3V voltage divider
2. **Timing issues**: Kernel not real-time (normal for Linux)
3. **Interference**: Keep wires short, add 1µF capacitor on VCC
4. **Out of range**: Object too close (<2cm) or too far (>400cm)

**Solution**: Use VL53L0X for more reliable readings

### Camera Not Detected

**Symptom**: "Cannot open /dev/video0" or similar

**Solution**:
```bash
# Check camera is connected
vcgencmd get_camera

# Should show: supported=1 detected=1

# If not detected, check cable connection
# Ensure camera interface enabled in raspi-config

# For USB camera, check with:
lsusb
v4l2-ctl --list-devices
```

### I2C Device Not Found

**Symptom**: i2cdetect shows no device

**Solution**:
```bash
# Enable I2C
sudo raspi-config
# Interface Options > I2C > Enable

# Check I2C is loaded
lsmod | grep i2c

# Scan for devices
i2cdetect -y 1

# Check connections (SDA, SCL, 3.3V, GND)
```

### Power Issues

**Symptom**: Pi reboots when motors start, undervoltage warnings

**Solution**:
1. **Use separate power** for motors and Pi
2. **Larger power supply** (Pi 4 needs 3A, Pi 5 needs 5A)
3. **Check connections** for voltage drop
4. **Add capacitors** near motor driver (1000µF electrolytic)

**Monitor power**:
```bash
# Check for undervoltage
vcgencmd get_throttled
# 0x0 = OK
# 0x50000 or 0x50005 = undervoltage detected
```

---

**Next Steps:**
- [Voice Setup Guide](./voice-setup.md) - Install Whisper and Piper
- [Vision Setup Guide](./vision-setup.md) - Install YOLO and face recognition
- [Configuration Reference](./configuration.md) - Complete config options
- [Home Assistant Integration](./homeassistant.md) - MQTT and auto-discovery

**Additional Resources:**
- [Pinout.xyz](https://pinout.xyz/) - Interactive GPIO pinout
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
- [RoboClaw Examples](../examples/) - Complete project examples
