# Voice Setup Guide

Complete guide for setting up voice capabilities (speech-to-text and text-to-speech) with RoboClaw.

## Table of Contents

- [Overview](#overview)
- [Hardware Requirements](#hardware-requirements)
- [Audio System Setup](#audio-system-setup)
- [Speech-to-Text (Whisper)](#speech-to-text-whisper)
- [Text-to-Speech (Piper)](#text-to-speech-piper)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

RoboClaw voice capabilities include:
- **Speech-to-Text (STT)**: OpenAI Whisper for voice recognition
- **Text-to-Speech (TTS)**: Piper for natural voice synthesis
- **Wake Word Detection**: Optional activation trigger
- **Multi-language Support**: English, Thai, and more

### Voice Pipeline

```
Microphone → ALSA → Audio Recorder → Whisper STT → LLM → Piper TTS → Speaker
```

## Hardware Requirements

### Microphone Options

1. **USB Microphone** (recommended)
   - Any USB microphone compatible with Linux
   - Examples: Blue Snowball, Samson Meteor, generic USB mics
   - Plug and play, no extra drivers needed

2. **I2S Microphone**
   - Digital I2S MEMS microphones
   - Examples: INMP441, SPH0645
   - Requires I2S configuration and wiring

3. **USB Webcam with Microphone**
   - Built-in microphone works as audio input
   - Dual purpose for vision + audio

### Speaker Options

1. **USB Speaker/Headphones**
   - Any USB audio output device
   - Easiest setup

2. **3.5mm Audio Jack**
   - Built-in Raspberry Pi audio out
   - Lower quality than USB/I2S

3. **I2S Speaker/Amplifier**
   - Digital I2S DAC + amplifier + speaker
   - Examples: MAX98357A, PAM8403
   - Best audio quality

### Recommended Setup

**Budget:**
- Generic USB microphone ($10-20)
- 3.5mm speaker ($5-10)

**Quality:**
- USB condenser microphone ($40-80)
- USB speaker or powered speakers ($30-100)

**Professional:**
- I2S MEMS microphone ($5-10)
- I2S DAC + amplifier + speaker ($20-40)
- Better noise isolation and quality

## Audio System Setup

### Install ALSA and Audio Tools

```bash
# Update system
sudo apt update

# Install audio tools
sudo apt install -y alsa-utils libasound2-dev

# Install PortAudio (used by Python audio libraries)
sudo apt install -y portaudio19-dev
```

### Identify Audio Devices

**List audio devices:**

```bash
# List playback (output) devices
aplay -l

# Example output:
# card 0: Headphones [bcm2835 Headphones], device 0: bcm2835 Headphones [bcm2835 Headphones]
# card 1: Device [USB Audio Device], device 0: USB Audio [USB Audio]

# List capture (input) devices
arecord -l

# Example output:
# card 1: Device [USB Audio Device], device 0: USB Audio [USB Audio]
```

**Note the card and device numbers.** You'll use these in configuration.

**List detailed device info:**

```bash
aplay -L | grep plughw
# Output:
# plughw:CARD=Headphones,DEV=0
# plughw:CARD=Device,DEV=0
```

### Test Microphone

```bash
# Record 5 seconds of audio
arecord -D plughw:1,0 -d 5 -f cd test.wav

# Play it back
aplay test.wav
```

If you hear your recording, microphone works!

### Test Speaker

```bash
# Generate test tone
speaker-test -D plughw:0,0 -c 2 -t wav

# Press Ctrl+C to stop
```

If you hear pink noise or tones, speaker works!

### Set Default Audio Devices

Create or edit `~/.asoundrc`:

```bash
nano ~/.asoundrc
```

Add configuration:

```
# Set USB microphone as default capture
pcm.!default {
    type asym
    playback.pcm "plughw:0,0"  # Card 0 for playback (speaker)
    capture.pcm "plughw:1,0"   # Card 1 for capture (microphone)
}

ctl.!default {
    type hw
    card 0
}
```

**Adjust card numbers** based on your `aplay -l` and `arecord -l` output.

### Adjust Volume

```bash
# Open ALSA mixer
alsamixer

# Use arrow keys:
# - F6: Select sound card
# - Left/Right: Navigate
# - Up/Down: Adjust volume
# - M: Mute/unmute

# Set microphone gain high (80-90%)
# Set speaker volume moderate (60-70%)

# Save settings
sudo alsactl store
```

## Speech-to-Text (Whisper)

RoboClaw uses OpenAI Whisper for accurate speech recognition.

### Install Whisper

```bash
# Install Python 3 and pip (if not installed)
sudo apt install -y python3 python3-pip python3-venv

# Create virtual environment for Whisper
python3 -m venv ~/whisper-env
source ~/whisper-env/bin/activate

# Install Whisper
pip install -U openai-whisper

# Install ffmpeg (required by Whisper)
sudo apt install -y ffmpeg
```

### Download Whisper Models

Models vary in size and accuracy:

| Model | Size | RAM | Speed | Accuracy |
|-------|------|-----|-------|----------|
| tiny | 39 MB | ~1 GB | Fastest | Low |
| base | 74 MB | ~1 GB | Fast | Good |
| small | 244 MB | ~2 GB | Medium | Better |
| medium | 769 MB | ~5 GB | Slow | Best |
| large | 1550 MB | ~10 GB | Very Slow | Excellent |

**Recommended for Raspberry Pi 4/5: `base` or `small`**

Models download automatically on first use, or pre-download:

```bash
# Activate environment
source ~/whisper-env/bin/activate

# Download model
python3 -c "import whisper; whisper.load_model('base')"
```

### Test Whisper

```bash
# Record audio
arecord -D plughw:1,0 -d 5 -f cd test-speech.wav
# (speak something)

# Transcribe with Whisper
source ~/whisper-env/bin/activate
whisper test-speech.wav --model base --language en

# You should see your transcribed speech
```

### Install Whisper for Node.js (Alternative)

RoboClaw can use `@chengsokdara/whisper-node` for direct Node.js integration:

```bash
# Install whisper-node
npm install @chengsokdara/whisper-node

# Download C++ Whisper model
npx whisper-node download base
```

## Text-to-Speech (Piper)

Piper provides fast, high-quality TTS optimized for Raspberry Pi.

### Install Piper

```bash
# Download Piper release (ARM64 for Pi 4/5)
cd ~
wget https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_arm64.tar.gz

# Extract
tar -xzf piper_arm64.tar.gz

# Move to /usr/local/bin
sudo mv piper/piper /usr/local/bin/
sudo chmod +x /usr/local/bin/piper

# Test installation
piper --version
```

### Download Piper Voice Models

Available voices: https://github.com/rhasspy/piper/blob/master/VOICES.md

**Popular English voices:**
- `en_US-lessac-medium` (high quality, natural)
- `en_US-amy-medium` (clear, professional)
- `en_GB-alan-medium` (British accent)

**Download voice:**

```bash
# Create voice directory
mkdir -p ~/piper-voices
cd ~/piper-voices

# Download voice + config (example: en_US-lessac-medium)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

### Test Piper

```bash
# Generate speech
echo "Hello, this is a test of Piper text to speech." | \
  piper --model ~/piper-voices/en_US-lessac-medium.onnx \
  --output_file test-speech.wav

# Play it
aplay test-speech.wav
```

If you hear the speech, Piper works!

### Install Multiple Languages

**Thai voice example:**

```bash
cd ~/piper-voices

# Download Thai voice
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/th/th_TH/medium/th_TH-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/th/th_TH/medium/th_TH-medium.onnx.json

# Test
echo "สวัสดีครับ" | piper --model ~/piper-voices/th_TH-medium.onnx --output_file thai-test.wav
aplay thai-test.wav
```

## Configuration

### Basic Voice Configuration

Add to your `config.yaml`:

```yaml
features:
  voice:
    enabled: true
    
    stt:
      engine: "whisper"
      model: "base"
      language: "en"
    
    tts:
      engine: "piper"
      voice: "en_US-lessac-medium"
    
    microphone:
      type: "usb"
      device: "plughw:1,0"
      sample_rate: 16000
    
    speaker:
      type: "usb"
      device: "plughw:0,0"
```

### Advanced Configuration

```yaml
features:
  voice:
    enabled: true
    
    # Speech-to-Text
    stt:
      engine: "whisper"
      model: "small"  # Better accuracy
      language: "en"  # Or "th" for Thai
      model_path: "/home/pi/whisper-env"  # Optional: custom path
    
    # Text-to-Speech
    tts:
      engine: "piper"
      voice: "en_US-lessac-medium"
      model_path: "/home/pi/piper-voices/en_US-lessac-medium.onnx"
      speed: 1.0  # Speech rate (0.5-2.0)
      volume: 0.8  # Volume (0.0-1.0)
    
    # Microphone
    microphone:
      type: "usb"
      device: "plughw:1,0"
      sample_rate: 16000
      channels: 1
      chunk_size: 1024
    
    # Speaker
    speaker:
      type: "usb"
      device: "plughw:0,0"
      sample_rate: 22050
    
    # Wake word (optional)
    wake_word:
      enabled: true
      phrase: "hey robot"  # Or "สวัสดี" for Thai
      sensitivity: 0.5  # 0.0-1.0
```

### I2S Configuration

For I2S microphone/speaker, see [I2S setup guide](https://learn.adafruit.com/adafruit-i2s-mems-microphone-breakout/raspberry-pi-wiring).

## Testing

### Test Voice Pipeline

Create test script `test-voice.js`:

```javascript
import { RobotAgent } from '@nattaponra/roboclaw';

const robot = await RobotAgent.fromConfig('./config.yaml');
await robot.start();

// Test TTS
await robot.speak('Hello! My voice is working.');

// Test listening (records for 5 seconds)
console.log('Listening... (speak now)');
const text = await robot.listen({ duration: 5000 });
console.log('You said:', text);

// Test full voice interaction
const response = await robot.voiceChat();
console.log('Robot response:', response);

await robot.stop();
```

Run test:

```bash
node test-voice.js
```

### Test with CLI

```bash
# Start robot with voice enabled
roboclaw start

# In another terminal, trigger voice chat
roboclaw skill execute greeting --voice
```

### Test Individual Components

**Test STT only:**

```javascript
import { WhisperSTTDriver } from '@nattaponra/roboclaw/voice';

const stt = new WhisperSTTDriver({
  model: 'base',
  language: 'en'
});

await stt.init();
const audioBuffer = /* ... record audio ... */;
const text = await stt.transcribe(audioBuffer);
console.log('Transcribed:', text);
```

**Test TTS only:**

```javascript
import { PiperTTSDriver } from '@nattaponra/roboclaw/voice';

const tts = new PiperTTSDriver({
  voice: 'en_US-lessac-medium',
  modelPath: '/home/pi/piper-voices/en_US-lessac-medium.onnx'
});

await tts.init();
const audioBuffer = await tts.synthesize('Hello world');
// Play audioBuffer through speaker
```

## Troubleshooting

### No Audio Devices Found

**Check USB connections:**

```bash
lsusb
# Should show your USB microphone/speaker

# Check ALSA devices
aplay -l
arecord -l
```

**If devices missing:**
- Re-plug USB devices
- Reboot Raspberry Pi
- Check USB power (may need powered hub)

### Microphone Not Recording

**Test with verbose output:**

```bash
arecord -D plughw:1,0 -d 5 -f cd -v test.wav
```

**Check permissions:**

```bash
# Add user to audio group
sudo usermod -a -G audio $USER

# Reboot
sudo reboot
```

**Increase microphone gain:**

```bash
alsamixer
# Select microphone card
# Increase "Mic" or "Capture" volume to 80-90%
```

### Whisper Errors

**"Model not found":**

Pre-download model:

```bash
source ~/whisper-env/bin/activate
python3 -c "import whisper; whisper.load_model('base')"
```

**"Out of memory":**

Use smaller model:

```yaml
stt:
  model: "tiny"  # Or "base"
```

**Slow transcription:**

- Use `tiny` or `base` model
- Reduce audio length
- Consider upgrading to Pi 5 or adding cooling

### Piper Errors

**"Command not found: piper":**

```bash
# Check installation
which piper

# Reinstall if needed
sudo mv ~/piper/piper /usr/local/bin/
sudo chmod +x /usr/local/bin/piper
```

**"Model file not found":**

Verify model path in config matches downloaded file:

```bash
ls -la ~/piper-voices/
# Should show .onnx and .onnx.json files
```

**Robotic/distorted audio:**

- Check speaker volume (reduce if too high)
- Test different sample rates (16000, 22050, 44100)
- Update speaker drivers

### Audio Delay/Latency

**Reduce buffer sizes:**

```yaml
microphone:
  chunk_size: 512  # Smaller chunks = lower latency
```

**Use hardware with low latency:**
- I2S devices have lowest latency
- USB 2.0 better than USB 3.0 for audio
- Avoid Bluetooth (high latency)

### Audio Quality Issues

**Enable noise suppression** (requires additional setup):

```bash
# Install PulseAudio with noise cancellation
sudo apt install pulseaudio pulseaudio-module-echo-cancel
```

**Use better hardware:**
- Condenser microphone over dynamic
- Directional microphone to reduce background noise
- Pop filter or foam cover

---

**Next Steps:**
- [Vision Setup Guide](./vision-setup.md) - Add camera capabilities
- [Configuration Reference](./configuration.md) - Complete voice options
- [Skill Development Guide](./SKILL_DEVELOPMENT.md) - Create voice-activated skills
- [Home Assistant Integration](./homeassistant.md) - Voice control via HA

**Resources:**
- [Whisper GitHub](https://github.com/openai/whisper)
- [Piper TTS](https://github.com/rhasspy/piper)
- [Piper Voice Samples](https://rhasspy.github.io/piper-samples/)
- [ALSA Documentation](https://www.alsa-project.org/wiki/Main_Page)
