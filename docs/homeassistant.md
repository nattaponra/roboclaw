# Home Assistant Integration Guide

Complete guide for integrating RoboClaw robots with Home Assistant via MQTT.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [MQTT Broker Setup](#mqtt-broker-setup)
- [Robot Configuration](#robot-configuration)
- [MQTT Discovery](#mqtt-discovery)
- [Available Entities](#available-entities)
- [Automations](#automations)
- [Custom Commands](#custom-commands)
- [Troubleshooting](#troubleshooting)

## Overview

RoboClaw integrates with Home Assistant using:
- **MQTT** for bidirectional communication
- **MQTT Discovery** for automatic entity creation
- **Sensors** for robot status, distance, battery, etc.
- **Switches** for enabling/disabling features
- **Commands** for controlling the robot

### Architecture

```
┌─────────────────┐         MQTT         ┌─────────────────┐
│  RoboClaw Robot │ <-------------------> │ MQTT Broker     │
│  (Raspberry Pi) │                       │ (Mosquitto)     │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                                   │ MQTT
                                                   │
                                          ┌────────▼────────┐
                                          │ Home Assistant  │
                                          │                 │
                                          │ - Auto-discover │
                                          │ - Sensors       │
                                          │ - Controls      │
                                          │ - Automations   │
                                          └─────────────────┘
```

## Prerequisites

### Home Assistant

- **Home Assistant** installed (Core, Supervised, or OS)
- **MQTT Integration** installed and configured
- **Network access** between robot and HA

### MQTT Broker

You need an MQTT broker. Options:

1. **Mosquitto Add-on** (recommended for HA OS/Supervised)
2. **Standalone Mosquitto** (for HA Core or separate server)
3. **Other brokers** (HiveMQ, EMQX, etc.)

## MQTT Broker Setup

### Option 1: Mosquitto Add-on (Home Assistant OS/Supervised)

1. **Install Mosquitto Add-on:**
   - Open Home Assistant
   - Navigate to **Settings** > **Add-ons** > **Add-on Store**
   - Search for "Mosquitto broker"
   - Click **Install**

2. **Configure the add-on:**
   ```yaml
   logins:
     - username: robot
       password: your_secure_password
   anonymous: false
   customize:
     active: false
   certfile: fullchain.pem
   keyfile: privkey.pem
   ```

3. **Start the add-on:**
   - Click **Start**
   - Enable **Start on boot**
   - Enable **Watchdog**

4. **Note the connection details:**
   - **Host**: `homeassistant.local` or your HA IP
   - **Port**: `1883` (default)
   - **Username**: `robot` (from config above)
   - **Password**: Your password

### Option 2: Standalone Mosquitto (Separate Server)

```bash
# Install Mosquitto
sudo apt update
sudo apt install -y mosquitto mosquitto-clients

# Create password file
sudo mosquitto_passwd -c /etc/mosquitto/passwd robot

# Configure Mosquitto
sudo nano /etc/mosquitto/conf.d/default.conf
```

Add configuration:
```conf
# Listener
listener 1883
protocol mqtt

# Security
allow_anonymous false
password_file /etc/mosquitto/passwd

# Persistence
persistence true
persistence_location /var/lib/mosquitto/
```

Restart Mosquitto:
```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
```

### Test MQTT Connection

```bash
# Subscribe to test topic
mosquitto_sub -h homeassistant.local -p 1883 -u robot -P password -t test/topic &

# Publish test message
mosquitto_pub -h homeassistant.local -p 1883 -u robot -P password -t test/topic -m "Hello MQTT"

# You should see "Hello MQTT" printed
```

### Configure Home Assistant MQTT Integration

1. **Add MQTT Integration:**
   - Navigate to **Settings** > **Devices & Services**
   - Click **+ Add Integration**
   - Search for "MQTT"
   - Click **MQTT**

2. **Configure connection:**
   - **Broker**: `homeassistant.local` (or IP address)
   - **Port**: `1883`
   - **Username**: `robot`
   - **Password**: Your password
   - Click **Submit**

3. **Verify connection:**
   - Integration should show "Connected"
   - Navigate to **Developer Tools** > **MQTT**
   - Try listening to topic `#` (all topics)

## Robot Configuration

Configure your RoboClaw robot to connect to MQTT and enable Home Assistant discovery.

### Basic MQTT Configuration

Create or edit `config.yaml`:

```yaml
robot:
  name: "LivingRoomRobot"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"

communication:
  mqtt:
    enabled: true
    broker: "mqtt://homeassistant.local"  # Or IP: mqtt://192.168.1.100
    port: 1883
    client_id: "livingroom_robot"
    username: "robot"
    password: "${MQTT_PASSWORD}"
    
    topics:
      command: "roboclaw/livingroom/command"
      status: "roboclaw/livingroom/status"
      sensor: "roboclaw/livingroom/sensor"
    
    homeassistant:
      discovery: true
      prefix: "homeassistant"
```

### Environment Variables

Create `.env` file with credentials:

```bash
# .env
OPENAI_API_KEY=sk-...
MQTT_PASSWORD=your_secure_password
```

### Full Configuration with Features

```yaml
robot:
  name: "SmartRobot"
  description: "AI robot with voice, vision, and mobility"
  platform: "raspberry-pi-4"

llm:
  provider: "openai"
  model: "gpt-4"
  api_key: "${OPENAI_API_KEY}"

features:
  voice:
    enabled: true
    # ... voice config
  
  vision:
    enabled: true
    # ... vision config
  
  movement:
    enabled: true
    # ... movement config
  
  sensors:
    distance:
      enabled: true
      type: "hcsr04"
      trigger_pin: 23
      echo_pin: 24

communication:
  mqtt:
    enabled: true
    broker: "mqtt://homeassistant.local"
    port: 1883
    client_id: "smart_robot"
    username: "${MQTT_USERNAME}"
    password: "${MQTT_PASSWORD}"
    topics:
      command: "robot/command"
      status: "robot/status"
      sensor: "robot/sensor"
    homeassistant:
      discovery: true
      prefix: "homeassistant"

memory:
  type: "sqlite"
  path: "./robot-memory.db"

skills:
  builtin:
    - "greeting"
```

## MQTT Discovery

RoboClaw automatically creates Home Assistant entities using MQTT Discovery.

### Discovery Process

When the robot starts with `homeassistant.discovery: true`:

1. Robot publishes discovery messages to:
   ```
   homeassistant/sensor/roboclaw_<id>/<entity>/config
   homeassistant/switch/roboclaw_<id>/<entity>/config
   homeassistant/button/roboclaw_<id>/<entity>/config
   ```

2. Home Assistant automatically creates entities

3. Robot publishes state updates to:
   ```
   roboclaw/<id>/status
   roboclaw/<id>/sensor
   ```

4. Commands are received on:
   ```
   roboclaw/<id>/command
   ```

### Discovery Messages

Example discovery message for distance sensor:

```json
{
  "name": "Robot Distance",
  "unique_id": "roboclaw_livingroom_distance",
  "state_topic": "roboclaw/livingroom/sensor",
  "value_template": "{{ value_json.distance }}",
  "unit_of_measurement": "cm",
  "device_class": "distance",
  "device": {
    "identifiers": ["roboclaw_livingroom"],
    "name": "Living Room Robot",
    "model": "RoboClaw Robot",
    "manufacturer": "RoboClaw"
  }
}
```

## Available Entities

### Sensors

RoboClaw automatically creates these sensors:

| Entity | Type | Description |
|--------|------|-------------|
| `sensor.robot_status` | Text | Robot state (idle, moving, busy) |
| `sensor.robot_distance` | Distance | Distance sensor reading (cm) |
| `sensor.robot_battery` | Battery | Battery level (%) |
| `sensor.robot_cpu_temp` | Temperature | Pi CPU temperature (°C) |
| `sensor.robot_last_message` | Text | Last chat message |
| `sensor.robot_uptime` | Duration | Time since robot started |

### Switches

Control robot features:

| Entity | Description |
|--------|-------------|
| `switch.robot_voice` | Enable/disable voice capabilities |
| `switch.robot_vision` | Enable/disable vision processing |
| `switch.robot_movement` | Enable/disable motor control |
| `switch.robot_automation` | Enable/disable scheduled tasks |

### Buttons

Trigger robot actions:

| Entity | Description |
|--------|-------------|
| `button.robot_restart` | Restart the robot |
| `button.robot_snapshot` | Take camera snapshot |
| `button.robot_stop` | Emergency stop (motors) |

## Automations

### Example 1: Motion Detection Alert

Robot detects motion and notifies you:

```yaml
# automation.yaml
- alias: "Robot Motion Alert"
  trigger:
    - platform: mqtt
      topic: "robot/sensor"
  condition:
    - condition: template
      value_template: "{{ trigger.payload_json.motion_detected == true }}"
  action:
    - service: notify.mobile_app
      data:
        title: "Motion Detected"
        message: "Robot detected motion in {{ trigger.payload_json.location }}"
    - service: mqtt.publish
      data:
        topic: "robot/command"
        payload: '{"action": "take_snapshot"}'
```

### Example 2: Obstacle Warning

Alert when robot detects close obstacle:

```yaml
- alias: "Robot Obstacle Warning"
  trigger:
    - platform: state
      entity_id: sensor.robot_distance
  condition:
    - condition: numeric_state
      entity_id: sensor.robot_distance
      below: 20  # Less than 20cm
  action:
    - service: notify.mobile_app
      data:
        title: "Obstacle Alert"
        message: "Robot is {{ states('sensor.robot_distance') }}cm from obstacle"
    - service: mqtt.publish
      data:
        topic: "robot/command"
        payload: '{"action": "stop"}'
```

### Example 3: Scheduled Patrol

Robot patrols at scheduled times:

```yaml
- alias: "Robot Night Patrol"
  trigger:
    - platform: time
      at: "22:00:00"
  action:
    - service: mqtt.publish
      data:
        topic: "robot/command"
        payload: '{"action": "start_patrol", "duration": 3600}'
```

### Example 4: Voice Control

Ask robot questions via Home Assistant:

```yaml
- alias: "Ask Robot Question"
  trigger:
    - platform: event
      event_type: mobile_app_notification_action
      event_data:
        action: "ask_robot"
  action:
    - service: mqtt.publish
      data:
        topic: "robot/command"
        payload: >
          {"action": "chat", "message": "{{ trigger.event.data.message }}"}
    - wait_template: "{{ states('sensor.robot_last_message') != 'Processing...' }}"
      timeout: 30
    - service: notify.mobile_app
      data:
        title: "Robot Response"
        message: "{{ states('sensor.robot_last_message') }}"
```

### Example 5: Auto-Disable Features at Night

Save battery by disabling vision at night:

```yaml
- alias: "Robot Night Mode"
  trigger:
    - platform: time
      at: "23:00:00"
  action:
    - service: switch.turn_off
      entity_id: switch.robot_vision
    - service: switch.turn_off
      entity_id: switch.robot_voice

- alias: "Robot Day Mode"
  trigger:
    - platform: time
      at: "07:00:00"
  action:
    - service: switch.turn_on
      entity_id: switch.robot_vision
    - service: switch.turn_on
      entity_id: switch.robot_voice
```

## Custom Commands

Send custom commands to your robot via MQTT.

### Command Format

Publish JSON to `robot/command` topic:

```json
{
  "action": "command_name",
  "parameters": {
    "key": "value"
  }
}
```

### Built-in Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `chat` | `message` | Send message to LLM |
| `move` | `direction`, `speed`, `duration` | Control movement |
| `stop` | - | Emergency stop |
| `take_snapshot` | - | Capture image |
| `speak` | `text` | Text-to-speech |
| `enable_feature` | `feature` | Enable voice/vision/etc. |
| `disable_feature` | `feature` | Disable voice/vision/etc. |

### Example: Chat Command

```bash
mosquitto_pub -h homeassistant.local -u robot -P password \
  -t robot/command \
  -m '{"action":"chat","message":"What is the weather?"}'
```

In Home Assistant automation:

```yaml
- service: mqtt.publish
  data:
    topic: "robot/command"
    payload: '{"action":"chat","message":"Tell me a joke"}'
```

### Example: Movement Command

```yaml
- service: mqtt.publish
  data:
    topic: "robot/command"
    payload: >
      {
        "action": "move",
        "direction": "forward",
        "speed": 150,
        "duration": 5000
      }
```

### Example: Speak Command

```yaml
- service: mqtt.publish
  data:
    topic: "robot/command"
    payload: >
      {
        "action": "speak",
        "text": "Welcome home! The temperature is {{ states('sensor.living_room_temperature') }} degrees."
      }
```

## Troubleshooting

### Robot Not Appearing in Home Assistant

**Check MQTT connection:**

```bash
# On robot, check if MQTT is publishing
mosquitto_sub -h homeassistant.local -u robot -P password -t 'homeassistant/#' -v
```

You should see discovery messages when robot starts.

**Verify configuration:**

```yaml
# Ensure discovery is enabled
communication:
  mqtt:
    homeassistant:
      discovery: true  # Must be true
      prefix: "homeassistant"  # Must match HA config
```

**Check Home Assistant logs:**

Settings > System > Logs

Look for MQTT-related errors.

### Entities Not Updating

**Check state topics:**

```bash
# Subscribe to status topic
mosquitto_sub -h homeassistant.local -u robot -P password -t 'robot/+/status' -v
```

Robot should publish updates every few seconds.

**Verify robot is running:**

```bash
# On robot
roboclaw status
```

### Commands Not Working

**Test command manually:**

```bash
# Publish test command
mosquitto_pub -h homeassistant.local -u robot -P password \
  -t 'robot/command' \
  -m '{"action":"chat","message":"hello"}'
```

**Check robot logs:**

```bash
# On robot, check logs
journalctl -u roboclaw -f
# Or if running manually:
roboclaw start --verbose
```

**Verify JSON format:**

Commands must be valid JSON. Use a JSON validator if unsure.

### Connection Issues

**Firewall blocking:**

```bash
# Allow MQTT port
sudo ufw allow 1883/tcp
```

**Authentication failing:**

```bash
# Test credentials
mosquitto_pub -h homeassistant.local -u robot -P password \
  -t test -m "test"
```

If fails, check username/password in broker config.

**Network issues:**

```bash
# Ping Home Assistant from robot
ping homeassistant.local

# Or use IP
ping 192.168.1.100
```

### Discovery Not Working

**Check discovery prefix:**

In Home Assistant MQTT integration settings, verify discovery prefix is `homeassistant`.

**Manually trigger discovery:**

Restart the robot to republish discovery messages:

```bash
# On robot
sudo systemctl restart roboclaw
```

**Check retained messages:**

Discovery messages should be retained. If broker loses them, entities disappear.

```bash
# Subscribe and check retained flag
mosquitto_sub -h homeassistant.local -u robot -P password \
  -t 'homeassistant/#' -v
```

---

**Next Steps:**
- [Voice Setup Guide](./voice-setup.md) - Enable voice interaction
- [Vision Setup Guide](./vision-setup.md) - Add camera capabilities
- [Skill Development Guide](./SKILL_DEVELOPMENT.md) - Create custom automations
- [Configuration Reference](./configuration.md) - All MQTT options

**Example Projects:**
- [examples/homeassistant/](../examples/homeassistant/) - Complete HA integration example

**Resources:**
- [Home Assistant MQTT](https://www.home-assistant.io/integrations/mqtt/)
- [MQTT Discovery](https://www.home-assistant.io/integrations/mqtt/#mqtt-discovery)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
