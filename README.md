# 🧘 ErgoVision — AI Real-Time Desk Ergonomics & Posture Guardian

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com)
[![MediaPipe](https://img.shields.io/badge/AI-MediaPipe_Pose-orange.svg)](https://developers.google.com/mediapipe)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-purple.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A full-stack, 100% free, privacy-first computer vision assistant that monitors desk posture in real-time, calculates cervical spine strain, and provides gentle procedural audio cues before "tech neck" causes chronic pain.

---

## 🎯 The Real-World Problem
Desk workers, software engineers, and students spend 8–12 hours daily hunched over laptops. Chronic poor posture causes **cervical spine load to quadruple** (from 5 kg upright to 27 kg at a 45° forward tilt). Most people are unaware they are slouching until muscle fatigue or tension headaches set in. Commercial posture correctors require expensive wearables; ErgoVision turns any standard laptop webcam into an intelligent ergonomic sensor with **zero paid hardware or subscription costs**.

---

## 🧠 How the AI / Computer Vision Works
1. **Keypoint Extraction (MediaPipe Pose):** Tracks 33 skeletal landmarks in 3D space directly inside the browser using WebAssembly.
2. **Cervical Angle Vector Math:**
   Calculates the forward head tilt relative to vertical alignment:
   $$\theta_{\text{neck}} = \arctan\left(\frac{|\text{Ear}_{\text{mid}}.x - \text{Shoulder}_{\text{mid}}.x|}{|\text{Shoulder}_{\text{mid}}.y - \text{Ear}_{\text{mid}}.y|}\right) \times \frac{180}{\pi}$$
3. **Lateral Shoulder Asymmetry:**
   Detects slouching sideways on one arm by calculating the angle between left and right shoulders.
4. **Adaptive Personal Calibration:**
   Allows the user to click *"Calibrate Posture"* to save their unique chair height, distance, and camera angle as their baseline.
5. **Procedural Audio Synthesis:**
   Uses the **Web Audio API** to generate harmonic sine-wave chimes locally—no external audio files or internet access needed.
6. **100% Privacy Guarantee:** Video frames are processed entirely on-device; video never leaves the client.

---

## 🏗️ Architecture

```
Free/
├── backend/                  # FastAPI Python backend
│   ├── main.py              # REST API endpoints (Sessions, Settings, Telemetry)
│   ├── database.py          # SQLite database connection & migrations
│   ├── schemas.py           # Pydantic data models
│   ├── test_api.py          # Backend database unit tests
│   └── requirements.txt     # Python dependencies (FastAPI, Uvicorn, Pydantic)
│
├── frontend/                 # Modern React 19 + Vite 8 App
│   ├── src/
│   │   ├── components/
│   │   │   ├── WebcamMonitor.jsx      # Live video + Canvas skeletal joint overlay
│   │   │   ├── PostureGauge.jsx       # Circular SVG health dial & angle metrics
│   │   │   ├── SessionStats.jsx       # Active timer, upright %, slouch counter
│   │   │   ├── AnalyticsDashboard.jsx # Historical sessions table & aggregated stats
│   │   │   └── SettingsModal.jsx      # Sensitivity thresholds & audio toggles
│   │   ├── utils/
│   │   │   ├── poseCalculations.js    # Trigonometric posture deviation engine
│   │   │   └── audioAlert.js          # Web Audio API harmonic sound generator
│   │   ├── App.jsx                    # Root application layout
│   │   └── index.css                  # Tailwind CSS styling
│   └── index.html                     # Pre-configured MediaPipe Pose CDN
│
└── run_dev.bat               # 1-Click launcher for Windows
```

---

## 🚀 Quickstart (Running Locally)

### Option A: 1-Click Launch (Windows)
Double-click `run_dev.bat` in the root folder. It will launch both the backend and frontend in separate terminals.

### Option B: Manual Command Line

#### 1. Start Backend:
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Start Frontend:
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌟 Resume Bullet Points
* **Developed `ErgoVision`**, a privacy-first computer vision web platform that tracks real-time upper-body ergonomics and calculates cervical spine strain angles at 30+ FPS using MediaPipe and React.
* **Built a full-stack REST telemetry service** using FastAPI and SQLite, logging session duration, posture scores, and violation intervals.
* **Implemented on-device procedural audio cues** with the Web Audio API and custom trigonometric vector algorithms to alert users of "tech neck" with zero cloud latency.
