import React from 'react';
import { Activity, Compass, ShieldAlert, Award } from 'lucide-react';

export default function PostureGauge({ metrics }) {
  const score = metrics?.isValid ? metrics.score : 0;
  const isSlouching = metrics?.isSlouching;
  const neckAngle = metrics?.rawNeckAngle || 0;
  const shoulderTilt = metrics?.rawShoulderTilt || 0;

  // Determine score color
  const getScoreColor = (val) => {
    if (val >= 85) return 'text-emerald-400 stroke-emerald-500';
    if (val >= 65) return 'text-amber-400 stroke-amber-500';
    return 'text-rose-400 stroke-rose-500';
  };

  const getScoreBadge = (val) => {
    if (val >= 85) return { label: 'Optimal Alignment', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    if (val >= 65) return { label: 'Mild Fatigue', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    return { label: 'Correction Needed', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  };

  const badge = getScoreBadge(score);

  // SVG Circular Gauge calculations
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Real-Time Ergonomics</h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      {/* Circular Gauge */}
      <div className="flex items-center justify-center py-2 relative">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`transition-all duration-500 ease-out ${getScoreColor(score)}`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score).split(' ')[0]}`}>
            {metrics?.isValid ? score : '--'}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            Ergo Score
          </span>
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* Forward Head / Neck Angle */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Neck Tilt</span>
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-100">{metrics?.isValid ? neckAngle : '--'}</span>
            <span className="text-xs text-slate-500">deg</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                neckAngle > 20 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (neckAngle / 40) * 100)}%` }}
            />
          </div>
        </div>

        {/* Shoulder Level */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Shoulder Lean</span>
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-100">{metrics?.isValid ? shoulderTilt : '--'}</span>
            <span className="text-xs text-slate-500">deg</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                shoulderTilt > 8 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (shoulderTilt / 20) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
