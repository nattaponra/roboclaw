# Vision Setup Guide

Complete guide for setting up vision capabilities (object detection, face recognition, scene understanding) with RoboClaw.

## Table of Contents

- [Overview](#overview)
- [Camera Setup](#camera-setup)
- [Object Detection (YOLO)](#object-detection-yolo)
- [Face Recognition](#face-recognition)
- [Scene Understanding (Vision LLM)](#scene-understanding-vision-llm)
- [Motion Detection](#motion-detection)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

RoboClaw vision capabilities include:
- **Object Detection**: YOLO v8 for real-time object detection
- **Face Recognition**: Deep learning face embeddings and matching
- **Scene Understanding**: Vision LLM (GPT-4 Vision, Claude 3) for image analysis
- **Motion Detection**: Frame-differencing motion detection

### Vision Pipeline

```
Camera → Image Capture → Processing (YOLO/Face/LLM) → Results → Actions
```

## Camera Setup

See the [Hardware Setup Guide - Camera Section](./hardware-setup.md#camera-setup) for:
- Pi Camera connection and configuration
- USB camera setup and testing
- Camera interface enabling

**Quick summary:**

```bash
# Enable camera
sudo raspi-config
# Interface Options > Camera > Enable

# Install camera tools
sudo apt install -y libcamera-apps python3-opencv

# Test camera
libcamera-still -o test.jpg
```

## Object Detection (YOLO)

RoboClaw uses YOLOv8 for fast, accurate object detection.

### Install Dependencies

```bash
# Update system
sudo apt update

# Install Python dependencies
sudo apt install -y python3-pip python3-opencv

# Install build tools (needed for some packages)
sudo apt install -y build-essential cmake

# Install YOLOv8 (Ultralytics)
pip3 install ultralytics

# Install additional dependencies
pip3 install opencv-python pillow numpy
```

### Download YOLO Models

YOLOv8 models vary in size and speed:

| Model | Size | Speed | mAP | Use Case |
|-------|------|-------|-----|----------|
| yolov8n | 6 MB | Fastest | 37.3 | Raspberry Pi (recommended) |
| yolov8s | 22 MB | Fast | 44.9 | Pi 5 or edge devices |
| yolov8m | 52 MB | Medium | 50.2 | Powerful SBCs |
| yolov8l | 88 MB | Slow | 52.9 | Desktop/server |
| yolov8x | 136 MB | Slowest | 53.9 | Maximum accuracy |

**Recommended for Raspberry Pi 4/5: yolov8n (nano)**

Models download automatically on first use, or pre-download:

```bash
# Download nano model
python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Test YOLO

```bash
# Take a test photo
libcamera-still -o test.jpg

# Run detection with Python
python3 << EOF
from ultralytics import YOLO
import cv2

# Load model
model = YOLO('yolov8n.pt')

# Run inference
results = model('test.jpg')

# Print detections
for r in results:
    for box in r.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        name = model.names[cls]
        print(f"Detected: {name} ({conf:.2f})")

# Save annotated image
results[0].save('detected.jpg')
print("Saved annotated image: detected.jpg")
EOF
```

Check `detected.jpg` to see detected objects with bounding boxes.

### Available Object Classes

YOLO can detect 80 COCO classes including:
- People: person
- Vehicles: car, truck, bus, motorcycle, bicycle
- Animals: dog, cat, bird, horse, cow, etc.
- Furniture: chair, couch, table, bed
- Electronics: tv, laptop, mouse, keyboard
- Kitchen: cup, fork, knife, bowl, bottle
- [Full list](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/coco.yaml)

## Face Recognition

RoboClaw uses deep learning embeddings for accurate face recognition.

### Install Dependencies

```bash
# Install face recognition library
pip3 install face-recognition

# Install dlib (face recognition backend)
# This may take 30+ minutes on Raspberry Pi
pip3 install dlib

# Alternative: Install from apt (faster, but older version)
sudo apt install -y python3-dlib
```

**Note**: Building dlib takes significant time. Consider using pre-built wheels or cross-compilation for faster setup.

### Create Face Database

```bash
# Create directory for known faces
mkdir -p ~/robot-faces
```

Add photos of people to recognize:

```bash
# Take a photo of a person
libcamera-still -o ~/robot-faces/john.jpg

# Repeat for each person (one clear face per photo)
```

### Test Face Recognition

```python
import face_recognition
import cv2

# Load known face
john_image = face_recognition.load_image_file("robot-faces/john.jpg")
john_encoding = face_recognition.face_encodings(john_image)[0]

# Load test image
test_image = face_recognition.load_image_file("test.jpg")
test_encodings = face_recognition.face_encodings(test_image)

# Compare faces
for encoding in test_encodings:
    matches = face_recognition.compare_faces([john_encoding], encoding)
    if matches[0]:
        print("Found John in the image!")
    else:
        print("Unknown person detected")
```

### Performance Optimization

Face recognition is CPU-intensive. Optimize:

1. **Reduce image resolution:**
   ```python
   small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
   ```

2. **Process every Nth frame:**
   ```python
   if frame_count % 5 == 0:  # Process every 5th frame
       face_locations = face_recognition.face_locations(frame)
   ```

3. **Use faster model:**
   ```python
   face_locations = face_recognition.face_locations(frame, model="hog")  # Faster than "cnn"
   ```

## Scene Understanding (Vision LLM)

Use GPT-4 Vision or Claude 3 to understand and describe images.

### Supported Vision LLMs

| Provider | Model | API Key Env Var |
|----------|-------|----------------|
| OpenAI | gpt-4-vision-preview, gpt-4o | OPENAI_API_KEY |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku | ANTHROPIC_API_KEY |

### Install Dependencies

```bash
# Already included if you installed LLM dependencies
pip3 install openai anthropic pillow
```

### Test Vision LLM

```python
import base64
from openai import OpenAI

# Load API key from environment
client = OpenAI()

# Read and encode image
with open("test.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# Create vision request
response = client.chat.completions.create(
    model="gpt-4-vision-preview",
    messages=[
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "What do you see in this image?"},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_data}"
                    }
                }
            ]
        }
    ],
    max_tokens=300
)

print(response.choices[0].message.content)
```

## Motion Detection

Simple motion detection using frame differencing.

### Install OpenCV (if not already installed)

```bash
sudo apt install -y python3-opencv
# Or
pip3 install opencv-python
```

### Test Motion Detection

```python
import cv2
import numpy as np

# Open camera
cap = cv2.VideoCapture(0)

# Read first frame
ret, frame1 = cap.read()
gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
gray1 = cv2.GaussianBlur(gray1, (21, 21), 0)

while True:
    # Read next frame
    ret, frame2 = cap.read()
    if not ret:
        break
    
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.GaussianBlur(gray2, (21, 21), 0)
    
    # Compute difference
    diff = cv2.absdiff(gray1, gray2)
    thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)[1]
    
    # Count non-zero pixels
    motion_pixels = np.count_nonzero(thresh)
    motion_percent = (motion_pixels / thresh.size) * 100
    
    if motion_percent > 1.0:  # 1% threshold
        print(f"Motion detected! ({motion_percent:.2f}%)")
    
    # Update previous frame
    gray1 = gray2
    
    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
```

## Configuration

### Basic Vision Configuration

```yaml
features:
  vision:
    enabled: true
    
    camera:
      type: "picamera"  # Or "usb"
      resolution: [640, 480]
      fps: 30
    
    capabilities:
      object_detection:
        enabled: true
        model: "yolov8n"
        confidence: 0.5
```

### Full Vision Configuration

```yaml
features:
  vision:
    enabled: true
    
    # Camera configuration
    camera:
      type: "picamera"  # "picamera", "usb", or "mock"
      device: 0  # For USB cameras: 0 = /dev/video0
      resolution: [1280, 720]  # [width, height]
      fps: 30
      rotation: 0  # 0, 90, 180, 270
      flip_horizontal: false
      flip_vertical: false
    
    # Vision capabilities
    capabilities:
      
      # Object detection with YOLO
      object_detection:
        enabled: true
        model: "yolov8n"  # yolov8n, yolov8s, yolov8m
        confidence: 0.5  # 0.0-1.0, detection threshold
        iou: 0.45  # Intersection over Union threshold
        max_detections: 100
        classes: []  # Empty = all classes, or [0, 1, 2] for specific
      
      # Face recognition
      face_recognition:
        enabled: true
        model: "hog"  # "hog" (faster) or "cnn" (accurate)
        tolerance: 0.6  # 0.0-1.0, lower = stricter matching
        face_database_path: "/home/pi/robot-faces"
        min_face_size: 20  # Minimum face size in pixels
      
      # Scene understanding with Vision LLM
      scene_understanding:
        enabled: true
        provider: "openai"  # "openai" or "anthropic"
        model: "gpt-4-vision-preview"  # Or claude-3-opus-20240229
        max_tokens: 300
        detail: "auto"  # "auto", "low", "high"
      
      # Motion detection
      motion_detection:
        enabled: true
        sensitivity: 0.8  # 0.0-1.0, lower = more sensitive
        min_area: 500  # Minimum motion area in pixels
        blur_size: 21  # Gaussian blur kernel size (odd number)
```

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Testing

### Test Complete Vision Pipeline

Create `test-vision.js`:

```javascript
import { RobotAgent } from '@nattaponra/roboclaw';

const robot = await RobotAgent.fromConfig('./config.yaml');
await robot.start();

// Capture and analyze image
const snapshot = await robot.captureImage();

// Object detection
const objects = await robot.detectObjects(snapshot);
console.log('Detected objects:', objects);

// Face recognition
const faces = await robot.recognizeFaces(snapshot);
console.log('Recognized faces:', faces);

// Scene understanding
const description = await robot.describeScene(snapshot);
console.log('Scene description:', description);

await robot.stop();
```

### Test Individual Components

**Test object detection:**

```javascript
import { YOLODetector } from '@nattaponra/roboclaw/vision';

const detector = new YOLODetector({
  model: 'yolov8n',
  confidence: 0.5
});

await detector.init();
const objects = await detector.detect(imageBuffer);
console.log('Objects:', objects);
```

**Test face recognition:**

```javascript
import { FaceRecognizer } from '@nattaponra/roboclaw/vision';

const recognizer = new FaceRecognizer({
  tolerance: 0.6,
  databasePath: '/home/pi/robot-faces'
});

await recognizer.init();
const faces = await recognizer.recognize(imageBuffer);
console.log('Faces:', faces);
```

### CLI Testing

```bash
# Start robot with vision
roboclaw start

# In another terminal
roboclaw vision snapshot  # Take snapshot
roboclaw vision detect    # Detect objects
roboclaw vision faces     # Recognize faces
```

## Troubleshooting

### Camera Not Working

See [Hardware Setup Guide - Camera Troubleshooting](./hardware-setup.md#camera-not-detected).

**Quick checks:**

```bash
# Check camera interface enabled
vcgencmd get_camera
# Should show: supported=1 detected=1

# Test camera
libcamera-still -o test.jpg

# For USB camera
ls -l /dev/video*
v4l2-ctl --list-devices
```

### YOLO Installation Errors

**"No module named 'ultralytics'":**

```bash
pip3 install ultralytics
# Or with sudo if needed
sudo pip3 install ultralytics
```

**Import errors:**

```bash
# Install missing dependencies
pip3 install opencv-python pillow numpy torch torchvision
```

**Slow inference:**

- Use `yolov8n` (nano) model
- Reduce image resolution
- Process fewer frames per second
- Consider Pi 5 or add active cooling

### Face Recognition Installation Errors

**dlib build fails:**

```bash
# Install build dependencies
sudo apt install -y build-essential cmake libopenblas-dev liblapack-dev

# Increase swap (dlib needs lots of RAM to compile)
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo systemctl restart dphys-swapfile

# Try installing again
pip3 install dlib
```

**Alternative: Use pre-built wheel:**

```bash
# Download pre-built dlib (check compatibility)
pip3 install dlib --no-build-isolation
```

### Vision LLM Errors

**"Invalid API key":**

Check environment variables:

```bash
cat .env
# Verify OPENAI_API_KEY or ANTHROPIC_API_KEY present

# Source .env if needed
export $(cat .env | xargs)
```

**"Image too large":**

Resize images before sending:

```javascript
import sharp from 'sharp';

const resized = await sharp(imageBuffer)
  .resize(1024, 1024, { fit: 'inside' })
  .toBuffer();
```

**Rate limits:**

- Add delays between requests
- Use caching for similar images
- Consider using cheaper models (claude-3-haiku, gpt-4o-mini)

### Performance Issues

**Low FPS:**

```yaml
# Reduce resolution
camera:
  resolution: [320, 240]  # Lower resolution
  fps: 15  # Lower FPS
```

**High CPU usage:**

- Process every Nth frame instead of every frame
- Disable unused capabilities
- Use lighter models (yolov8n, hog for faces)

**Memory issues:**

```bash
# Check memory usage
free -h

# Increase swap if needed
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo systemctl restart dphys-swapfile
```

### Motion Detection False Positives

**Adjust sensitivity:**

```yaml
motion_detection:
  sensitivity: 0.9  # Higher = less sensitive
  min_area: 1000  # Larger area required
```

**Environmental factors:**
- Lighting changes trigger motion (use consistent lighting)
- Camera shake (mount securely)
- Moving shadows (position camera away from windows)

---

**Next Steps:**
- [Configuration Reference](./configuration.md) - Complete vision options
- [Skill Development Guide](./SKILL_DEVELOPMENT.md) - Create vision-based skills
- [Hardware Setup Guide](./hardware-setup.md) - Camera wiring and setup
- [Home Assistant Integration](./homeassistant.md) - Send camera snapshots to HA

**Resources:**
- [Ultralytics YOLO](https://github.com/ultralytics/ultralytics)
- [Face Recognition Library](https://github.com/ageitgey/face_recognition)
- [OpenCV Documentation](https://docs.opencv.org/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Anthropic Vision](https://docs.anthropic.com/claude/docs/vision)

**Example Projects:**
- [examples/homeassistant/](../examples/homeassistant/) - Full vision integration with HA
