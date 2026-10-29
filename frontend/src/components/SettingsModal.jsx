import React from 'react';
import { X, Volume2, VolumeX, Sliders, BellRing, ShieldCheck } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Ergonomic Preferences</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Audio Chime Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-slate-200 block mb-0.5">Auditory Feedback</label>
              <p className="text-xs text-slate-400">Play gentle harmonic chime when slouching</p>
            </div>
            <button
              onClick={() =>
                onUpdateSettings({ ...settings, sound_alert_enabled: !settings.sound_alert_enabled })
              }
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                settings.sound_alert_enabled
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-500'
              }`}
            >
              {settings.sound_alert_enabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium">On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="text-xs font-medium">Muted</span>
                </>
              )}
            </button>
          </div>

          {/* Slouch Angle Threshold */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-slate-200">Slouch Angle Sensitivity</label>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {settings.slouch_angle_threshold}° tilt
              </span>
            </div>
            <input
              type="range"
              min="12"
              max="35"
              step="1"
              value={settings.slouch_angle_threshold}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  slouch_angle_threshold: parseFloat(e.target.value)
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Strict (12°)</span>
              <span>Moderate (22°)</span>
              <span>Relaxed (35°)</span>
            </div>
          </div>

          {/* Grace Period */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-slate-200">Alert Grace Period</label>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {settings.slouch_grace_seconds}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.slouch_grace_seconds}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  slouch_grace_seconds: parseInt(e.target.value, 10)
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Allows brief head movements before triggering an alert.
            </p>
          </div>

          {/* Break reminder */}
          <div>
            <label className="font-medium text-slate-200 block mb-2">Micro-Break Interval</label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() =>
                    onUpdateSettings({ ...settings, break_reminder_mins: mins })
                  }
                  className={`py-1.5 rounded-lg text-xs font-medium border transition ${
                    settings.break_reminder_mins === mins
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
