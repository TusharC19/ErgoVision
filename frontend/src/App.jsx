import React, { useState, useEffect, useCallback } from 'react';
import WebcamMonitor from './components/WebcamMonitor';
import PostureGauge from './components/PostureGauge';
import SessionStats from './components/SessionStats';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsModal from './components/SettingsModal';
import { Shield, Settings as SettingsIcon, HeartPulse, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [slouchCount, setSlouchCount] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const [settings, setSettings] = useState({
    slouch_angle_threshold: 22.0,
    slouch_grace_seconds: 3,
    sound_alert_enabled: true,
    break_reminder_mins: 30
  });

  // Fetch settings & history from backend or localStorage
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        setBackendOnline(true);
      } else {
        throw new Error('API unavailable');
      }

      const settingsRes = await fetch(`${API_BASE}/settings`);
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setSettings(sData);
      }
    } catch {
      // Fallback to localStorage
      setBackendOnline(false);
      const local = localStorage.getItem('ergovision_sessions');
      if (local) {
        setSessions(JSON.parse(local));
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle live posture update
  const handleMetricsUpdate = useCallback((newMetrics) => {
    setMetrics(newMetrics);
  }, []);

  // Handle slouch detection event
  const handleSlouchDetected = useCallback(() => {
    if (isSessionActive) {
      setSlouchCount((prev) => prev + 1);
    }
  }, [isSessionActive]);

  // Session lifecycle
  const handleStartSession = () => {
    setIsSessionActive(true);
    setSlouchCount(0);
  };

  const handlePauseSession = () => {
    setIsSessionActive(false);
  };

  const handleEndSession = async (sessionData) => {
    setIsSessionActive(false);

    const payload = {
      started_at: new Date(Date.now() - sessionData.durationSeconds * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: sessionData.durationSeconds,
      good_posture_seconds: sessionData.goodSeconds,
      slouch_seconds: sessionData.slouchSeconds,
      slouch_count: sessionData.slouchCount,
      average_score: sessionData.goodPercentage,
      status: 'completed'
    };

    if (backendOnline) {
      try {
        const res = await fetch(`${API_BASE}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          loadData();
          return;
        }
      } catch (err) {
        console.warn('Failed to save to backend, using localStorage:', err);
      }
    }

    // Local fallback
    const updated = [payload, ...sessions];
    setSessions(updated);
    localStorage.setItem('ergovision_sessions', JSON.stringify(updated));
  };

  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings);
    if (backendOnline) {
      try {
        await fetch(`${API_BASE}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings)
        });
      } catch (err) {
        console.warn('Failed to update backend settings:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">ErgoVision</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Powered
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Real-Time Desk Ergonomics & Posture Guardian</p>
          </div>
        </div>

        {/* Status & Settings */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-400 text-[11px]">
              {backendOnline ? 'SQLite Sync: Active' : 'Offline Mode (Local)'}
            </span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
            title="Open Settings"
          >
            <SettingsIcon className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Info Banner */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-900/30 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Protect your spine while coding & working</h2>
              <p className="text-xs text-slate-400">
                Position your camera at eye level. Sit naturally, click <strong>Calibrate Posture</strong>, and ErgoVision will guide your posture in real-time.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% On-Device AI • Zero Video Uploaded</span>
          </div>
        </div>

        {/* Core Live Interaction Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: AI Camera & Skeleton Stream (7 cols) */}
          <div className="lg:col-span-7">
            <WebcamMonitor
              onMetricsUpdate={handleMetricsUpdate}
              onSlouchDetected={handleSlouchDetected}
              soundEnabled={settings.sound_alert_enabled}
              slouchGraceSeconds={settings.slouch_grace_seconds}
            />
          </div>

          {/* Right Column: Posture Gauge & Session Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <PostureGauge metrics={metrics} />
            <SessionStats
              isSessionActive={isSessionActive}
              onStartSession={handleStartSession}
              onPauseSession={handlePauseSession}
              onEndSession={handleEndSession}
              metrics={metrics}
              slouchCount={slouchCount}
            />
          </div>
        </div>

        {/* Historical Analytics & Records */}
        <AnalyticsDashboard sessions={sessions} />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
