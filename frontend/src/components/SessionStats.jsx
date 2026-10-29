import React, { useState, useEffect } from 'react';
import { Timer, AlertOctagon, TrendingUp, Play, Pause, Square, Coffee } from 'lucide-react';

export default function SessionStats({
  isSessionActive,
  onStartSession,
  onPauseSession,
  onEndSession,
  metrics,
  slouchCount = 0
}) {
  const [seconds, setSeconds] = useState(0);
  const [goodSeconds, setGoodSeconds] = useState(0);
  const [slouchSeconds, setSlouchSeconds] = useState(0);

  // Timer loop
  useEffect(() => {
    let interval = null;
    if (isSessionActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
        if (metrics?.isValid) {
          if (metrics.isSlouching) {
            setSlouchSeconds((prev) => prev + 1);
          } else {
            setGoodSeconds((prev) => prev + 1);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, metrics]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? `${hrs.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const goodPercentage =
    seconds > 0 ? Math.round((goodSeconds / seconds) * 100) : 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      {/* Header with Session Control */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Active Session</h3>
        </div>

        <div className="flex items-center gap-1.5">
          {!isSessionActive ? (
            <button
              onClick={onStartSession}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Start Tracking
            </button>
          ) : (
            <>
              <button
                onClick={onPauseSession}
                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
              <button
                onClick={() => {
                  onEndSession({
                    durationSeconds: seconds,
                    goodSeconds,
                    slouchSeconds,
                    slouchCount,
                    goodPercentage
                  });
                  setSeconds(0);
                  setGoodSeconds(0);
                  setSlouchSeconds(0);
                }}
                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5 fill-rose-300" /> Save & Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Total Time */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Duration</span>
          <span className="text-xl font-bold tracking-tight text-white font-mono">
            {formatTime(seconds)}
          </span>
        </div>

        {/* Upright Ratio */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Upright Time</span>
          <span className="text-xl font-bold tracking-tight text-emerald-400">
            {goodPercentage}%
          </span>
        </div>

        {/* Slouch Count */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Slouch Events</span>
          <span className="text-xl font-bold tracking-tight text-rose-400">
            {slouchCount}
          </span>
        </div>
      </div>

      {/* Progress Bar of Good vs Slouch time */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" /> Healthy: {formatTime(goodSeconds)}
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <AlertOctagon className="w-3.5 h-3.5" /> Slouch: {formatTime(slouchSeconds)}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${goodPercentage}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${100 - goodPercentage}%` }}
          />
        </div>
      </div>

      {/* 20-20-20 Ergonomic Rule Tip */}
      <div className="mt-4 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2.5 text-xs text-indigo-300">
        <Coffee className="w-4 h-4 flex-shrink-0 text-indigo-400" />
        <span>
          <strong>20-20-20 Rule:</strong> Every 20 mins, look at an object 20 feet away for 20 seconds to prevent ocular & neck strain.
        </span>
      </div>
    </div>
  );
}
