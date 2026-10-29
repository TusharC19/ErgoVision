import React, { useEffect, useRef, useState, useCallback } from 'react';
import { calculatePostureMetrics } from '../utils/poseCalculations';
import { playAlertChime } from '../utils/audioAlert';
import { Camera, CheckCircle2, AlertTriangle, RefreshCw, Eye, Sparkles, SlidersHorizontal, VideoOff } from 'lucide-react';

export default function WebcamMonitor({
  onMetricsUpdate,
  onSlouchDetected,
  soundEnabled = true,
  slouchGraceSeconds = 3
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const isProcessingFrameRef = useRef(false);

  const [mode, setMode] = useState('webcam'); // 'webcam' | 'simulator'
  const [cameraActive, setCameraActive] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [currentMetrics, setCurrentMetrics] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Simulator controls
  const [simNeckAngle, setSimNeckAngle] = useState(10);
  const [simShoulderTilt, setSimShoulderTilt] = useState(2);
  const [simDistance, setSimDistance] = useState(1.0);

  // Slouch debounce timer
  const slouchStartTimeRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // Calibration handler
  const handleCalibrate = () => {
    if (currentMetrics && currentMetrics.isValid) {
      setBaseline({
        rawNeckAngle: currentMetrics.rawNeckAngle,
        rawShoulderTilt: currentMetrics.rawShoulderTilt,
        shoulderWidth: currentMetrics.shoulderWidth
      });
      playAlertChime('good');
    }
  };

  const handleResetCalibration = () => {
    setBaseline(null);
  };

  // Drawing the pose on Canvas
  const drawPose = useCallback((landmarks, metrics) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!showSkeleton || !landmarks || !metrics.isValid) return;

    const isGood = !metrics.isSlouching;
    const primaryColor = isGood ? '#10b981' : '#f43f5e';
    const accentColor = isGood ? '#34d399' : '#fb7185';

    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Shoulder bar
    ctx.strokeStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(leftShoulder.x * width, leftShoulder.y * height);
    ctx.lineTo(rightShoulder.x * width, rightShoulder.y * height);
    ctx.stroke();

    // Ear to shoulder neck lines
    ctx.strokeStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(leftEar.x * width, leftEar.y * height);
    ctx.lineTo(leftShoulder.x * width, leftShoulder.y * height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEar.x * width, rightEar.y * height);
    ctx.lineTo(rightShoulder.x * width, rightShoulder.y * height);
    ctx.stroke();

    // Spine guide line (mid-shoulder downwards)
    const midSx = ((leftShoulder.x + rightShoulder.x) / 2) * width;
    const midSy = ((leftShoulder.y + rightShoulder.y) / 2) * height;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(midSx, midSy);
    ctx.lineTo(midSx, midSy + 110);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw landmark joints
    const points = [nose, leftEar, rightEar, leftShoulder, rightShoulder];
    points.forEach((pt) => {
      if (!pt) return;
      const px = pt.x * width;
      const py = pt.y * height;

      ctx.beginPath();
      ctx.arc(px, py, 7, 0, 2 * Math.PI);
      ctx.fillStyle = primaryColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  }, [showSkeleton]);

  // Handle evaluation of posture metrics & audio alert trigger
  const evaluateMetrics = useCallback((metrics) => {
    setCurrentMetrics(metrics);
    onMetricsUpdate?.(metrics);

    const now = Date.now();
    if (metrics.isSlouching) {
      if (!slouchStartTimeRef.current) {
        slouchStartTimeRef.current = now;
      } else {
        const elapsed = (now - slouchStartTimeRef.current) / 1000;
        if (elapsed >= slouchGraceSeconds && now - lastAlertTimeRef.current > 6000) {
          lastAlertTimeRef.current = now;
          if (soundEnabled) {
            playAlertChime('slouch');
          }
          onSlouchDetected?.(metrics);
        }
      }
    } else {
      slouchStartTimeRef.current = null;
    }
  }, [onMetricsUpdate, onSlouchDetected, slouchGraceSeconds, soundEnabled]);

  // Handle MediaPipe results
  const onResults = useCallback((results) => {
    if (!results || !results.poseLandmarks) {
      const fallback = {
        isValid: false,
        status: 'No person detected',
        score: 0,
        isSlouching: false,
        reasons: ['Position head & shoulders in frame']
      };
      setCurrentMetrics(fallback);
      onMetricsUpdate?.(fallback);
      return;
    }

    const metrics = calculatePostureMetrics(results.poseLandmarks, baseline);
    evaluateMetrics(metrics);
    drawPose(results.poseLandmarks, metrics);
  }, [baseline, drawPose, evaluateMetrics, onMetricsUpdate]);

  // Native webcam frame processor loop
  const processWebcamFrame = useCallback(async () => {
    if (
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      poseInstanceRef.current &&
      !isProcessingFrameRef.current
    ) {
      isProcessingFrameRef.current = true;
      try {
        await poseInstanceRef.current.send({ image: videoRef.current });
      } catch (e) {
        console.warn('Pose processing error:', e);
      }
      isProcessingFrameRef.current = false;
    }

    if (cameraActive) {
      animFrameRef.current = requestAnimationFrame(processWebcamFrame);
    }
  }, [cameraActive]);

  // Start native webcam
  const startCamera = async () => {
    setErrorMsg(null);
    setModelLoading(true);

    try {
      // 1. Initialize MediaPipe Pose if not ready
      if (!poseInstanceRef.current) {
        if (!window.Pose) {
          throw new Error('MediaPipe script is still loading. Please check internet connection.');
        }

        const pose = new window.Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
        });

        pose.setOptions({
          modelComplexity: 0, // Lite model for instant startup & high FPS
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);
        poseInstanceRef.current = pose;
        setModelReady(true);
      }

      // 2. Request native webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setModelLoading(false);
    } catch (err) {
      console.error('Camera startup error:', err);
      setModelLoading(false);
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access in browser URL bar, or use Simulator Mode below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No webcam hardware detected. Switch to "Simulator Mode" below to test all AI features!');
      } else {
        setErrorMsg(err.message || 'Failed to start camera. Switch to "Simulator Mode" to test instantly.');
      }
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive) {
      animFrameRef.current = requestAnimationFrame(processWebcamFrame);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [cameraActive, processWebcamFrame]);

  // Simulator loop: Updates synthetic landmarks based on sliders
  useEffect(() => {
    if (mode !== 'simulator') return;

    // Generate synthetic landmarks from sliders
    const midX = 0.5;
    const shoulderY = 0.65;
    const baseShoulderHalfWidth = 0.16 * simDistance;
    const tiltRadians = (simShoulderTilt * Math.PI) / 180;
    const neckRadians = (simNeckAngle * Math.PI) / 180;

    const shoulderTiltDy = Math.sin(tiltRadians) * baseShoulderHalfWidth;
    const shoulderTiltDx = Math.cos(tiltRadians) * baseShoulderHalfWidth;

    const leftShoulder = {
      x: midX - shoulderTiltDx,
      y: shoulderY - shoulderTiltDy,
      visibility: 0.99
    };
    const rightShoulder = {
      x: midX + shoulderTiltDx,
      y: shoulderY + shoulderTiltDy,
      visibility: 0.99
    };

    // Neck / Ear positioning
    const neckLength = 0.28 / simDistance;
    const earMidX = midX + Math.sin(neckRadians) * neckLength;
    const earMidY = shoulderY - Math.cos(neckRadians) * neckLength;

    const earHalfWidth = 0.06;
    const leftEar = { x: earMidX - earHalfWidth, y: earMidY, visibility: 0.99 };
    const rightEar = { x: earMidX + earHalfWidth, y: earMidY, visibility: 0.99 };
    const nose = { x: earMidX, y: earMidY - 0.05, visibility: 0.99 };

    const syntheticLandmarks = [];
    syntheticLandmarks[0] = nose;
    syntheticLandmarks[7] = leftEar;
    syntheticLandmarks[8] = rightEar;
    syntheticLandmarks[11] = leftShoulder;
    syntheticLandmarks[12] = rightShoulder;

    const metrics = calculatePostureMetrics(syntheticLandmarks, baseline);
    evaluateMetrics(metrics);
    drawPose(syntheticLandmarks, metrics);
  }, [mode, simNeckAngle, simShoulderTilt, simDistance, baseline, drawPose, evaluateMetrics]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
      {/* Mode Switch Header */}
      <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Vision Mode:</span>
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setMode('webcam');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                mode === 'webcam'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Live Webcam
            </button>
            <button
              onClick={() => {
                stopCamera();
                setMode('simulator');
              }}
              className={`px-3 py-1 rounded-md text-xs font-medium transition flex items-center gap-1 ${
                mode === 'simulator'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" /> Interactive Simulator
            </button>
          </div>
        </div>

        {/* Skeleton toggle */}
        <button
          onClick={() => setShowSkeleton(!showSkeleton)}
          className={`px-2.5 py-1 rounded-lg border text-xs transition flex items-center gap-1.5 ${
            showSkeleton
              ? 'bg-slate-800 border-slate-700 text-indigo-300'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
          title="Toggle Skeleton Landmarks"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Skeleton</span>
        </button>
      </div>

      {/* Video & Canvas Viewport */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {mode === 'webcam' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none z-10"
            />
          </>
        ) : (
          /* Simulator Canvas with Ambient Grid */
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(#312e81_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
            />
          </div>
        )}

        {/* Inactive Camera Prompt (Webcam Mode) */}
        {mode === 'webcam' && !cameraActive && (
          <div className="z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Live Camera Ready</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-5">
              100% on-device AI. Video is processed locally in your browser and is never recorded or uploaded.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={startCamera}
                disabled={modelLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {modelLoading ? 'Initializing AI Engine...' : 'Start Camera'}
              </button>
              <button
                onClick={() => setMode('simulator')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition border border-slate-700 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Test in Simulator
              </button>
            </div>
            {errorMsg && (
              <div className="mt-4 text-xs text-rose-300 bg-rose-950/70 border border-rose-800/80 px-4 py-2 rounded-xl max-w-md text-left">
                <strong>Camera Notice:</strong> {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Live Status Badge */}
        {currentMetrics && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border flex items-center gap-1.5 shadow-md ${
                !currentMetrics.isValid
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : currentMetrics.isSlouching
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}
            >
              {!currentMetrics.isValid ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              ) : currentMetrics.isSlouching ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {currentMetrics.status}
            </span>

            {baseline && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 backdrop-blur-md">
                Calibrated
              </span>
            )}

            {mode === 'simulator' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-500/20 border border-purple-500/30 text-purple-300 backdrop-blur-md">
                Simulator
              </span>
            )}
          </div>
        )}

        {/* Slouch Warning Banner */}
        {currentMetrics && currentMetrics.isSlouching && (
          <div className="absolute bottom-4 inset-x-4 z-20 bg-rose-950/85 border border-rose-500/40 backdrop-blur-md rounded-xl p-2.5 text-center text-xs text-rose-200 shadow-xl">
            <span className="font-semibold text-rose-100">Correction: </span>
            {currentMetrics.reasons.join(' • ')}
          </div>
        )}
      </div>

      {/* Simulator Interactive Control Panel */}
      {mode === 'simulator' && (
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Interactive Slouch & Ergonomics Controls
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setSimNeckAngle(6);
                  setSimShoulderTilt(1);
                  setSimDistance(1.0);
                }}
                className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]"
              >
                Upright Posture
              </button>
              <button
                onClick={() => {
                  setSimNeckAngle(28);
                  setSimShoulderTilt(3);
                }}
                className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px]"
              >
                Simulate Slouch
              </button>
              <button
                onClick={() => {
                  setSimNeckAngle(12);
                  setSimShoulderTilt(15);
                }}
                className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[11px]"
              >
                Simulate Lean
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Head / Neck Tilt:</span>
                <span className="font-mono text-indigo-400">{simNeckAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={simNeckAngle}
                onChange={(e) => setSimNeckAngle(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Shoulder Tilt (Lean):</span>
                <span className="font-mono text-indigo-400">{simShoulderTilt}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={simShoulderTilt}
                onChange={(e) => setSimShoulderTilt(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Proximity / Hunch:</span>
                <span className="font-mono text-indigo-400">{simDistance.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={simDistance}
                onChange={(e) => setSimDistance(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Control Action Bar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {mode === 'webcam' && (
            cameraActive ? (
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Stop Camera
              </button>
            ) : (
              <button
                onClick={startCamera}
                disabled={modelLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
              >
                {modelLoading ? 'Loading AI...' : 'Start Camera'}
              </button>
            )
          )}
        </div>

        {/* Calibration buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCalibrate}
            disabled={!currentMetrics?.isValid}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Calibrate your upright posture as baseline"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Calibrate Posture
          </button>
          {baseline && (
            <button
              onClick={handleResetCalibration}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition"
              title="Reset calibration to default thresholds"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
