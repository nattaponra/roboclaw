# Home Assistant Integration Example

Full-featured RoboClaw robot with Home Assistant integration via MQTT.

## Features

- ✅ Voice interaction (Whisper STT + Piper TTS)
- ✅ Computer vision (YOLO object detection + face recognition)
- ✅ MQTT communication
- ✅ Home Assistant auto-discovery
- ✅ Automated tasks (scheduled actions)
- ✅ Camera support

## Prerequisites

1. MQTT broker running (e.g., Mosquitto)
2. Home Assistant with MQTT integration configured
3. Whisper.cpp and Piper installed for voice
4. YOLOv8 installed for vision

## Setup

### 1. Install MQTT Broker

```bash
# On Raspberry Pi
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

### 2. Configure Home Assistant

In Home Assistant, add MQTT integration:
- Settings → Devices & Services → Add Integration → MQTT
- Broker: `localhost` (or your Pi's IP)
- Port: `1883`

### 3. Install Voice Dependencies

```bash
# Install Whisper.cpp
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make
./models/download-ggml-model.sh base

# Install Piper
pip install piper-tts
```

### 4. Install Vision Dependencies

```bash
# Install YOLOv8
pip install ultralytics
```

### 5. Set Environment Variables

```bash
export OPENAI_API_KEY=your-api-key
# Optional: export MQTT_USERNAME=your-username
# Optional: export MQTT_PASSWORD=your-password
```

### 6. Run the Robot

```bash
npx roboclaw start
```

## Home Assistant Entities

Once running, the robot will automatically appear in Home Assistant with:

- **Sensor**: Robot status
- **Switch**: Enable/disable voice
- **Switch**: Enable/disable vision
- **Camera**: Live camera feed (if available)
- **Button**: Trigger greeting
- **Button**: Take photo

## Automation Examples

### Wake Up Routine

```yaml
# Home Assistant automation
automation:
  - alias: "Morning Robot Greeting"
    trigger:
      - platform: time
        at: "08:00:00"
    action:
      - service: mqtt.publish
        data:
          topic: "roboclaw/home-robot/command"
          payload: "good_morning"
```

### Security Alert

```yaml
automation:
  - alias: "Robot Security Scan"
    trigger:
      - platform: state
        entity_id: binary_sensor.motion_sensor
        to: "on"
    action:
      - service: mqtt.publish
        data:
          topic: "roboclaw/home-robot/vision/scan"
          payload: "security"
```

## Custom Skills

Add custom skills in `./skills/` directory. Example:

```typescript
// skills/home-control-skill.ts
import { BaseSkill } from '@nattaponra/roboclaw-core';

export class HomeControlSkill extends BaseSkill {
  // Control smart home devices via Home Assistant
}
```

## Troubleshooting

**MQTT not connecting:**
- Check broker is running: `systemctl status mosquitto`
- Verify network connectivity
- Check credentials if authentication is enabled

**Voice not working:**
- Ensure Whisper and Piper are installed
- Check audio devices: `aplay -l` and `arecord -l`
- Test microphone: `arecord -d 5 test.wav`

**Vision not working:**
- Ensure YOLOv8 is installed: `pip list | grep ultralytics`
- Test camera: `libcamera-still -o test.jpg`

## Next Steps

- Create custom skills for home automation
- Add more sensors and actuators
- Set up dashboards in Home Assistant
- Configure voice wake word detection
