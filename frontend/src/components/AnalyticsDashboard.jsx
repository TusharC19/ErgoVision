import React from 'react';
import { Calendar, CheckCircle2, Clock, Award, BarChart3, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard({ sessions = [] }) {
  // Aggregate stats
  const totalSessions = sessions.length;
  const totalDurationSeconds = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const totalHours = (totalDurationSeconds / 3600).toFixed(1);
  const totalSlouches = sessions.reduce((acc, s) => acc + (s.slouch_count || 0), 0);
  const avgScore =
    totalSessions > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.average_score || 0), 0) / totalSessions
        )
      : 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-100 text-base">Ergonomic History & Insights</h3>
        </div>
        <span className="text-xs text-slate-400">
          {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'} Recorded
        </span>
      </div>

      {/* Aggregate Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Overall Posture Avg</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400">{avgScore}%</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Time Monitored</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{totalHours}</span>
            <span className="text-xs text-slate-500">hours</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Slouch Alerts</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-rose-400">{totalSlouches}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium block mb-1">Spine Strain Prevented</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-indigo-400">
              {Math.round(totalSlouches * 0.85)}
            </span>
            <span className="text-xs text-slate-500">incidents</span>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-950 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Session Date</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Posture Score</th>
              <th className="px-4 py-3">Slouch Count</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No sessions recorded yet. Start tracking above to populate your ergonomic analytics!
                </td>
              </tr>
            ) : (
              sessions.map((session, idx) => {
                const durationMins = Math.round((session.duration_seconds || 0) / 60);
                const score = Math.round(session.average_score || 0);

                return (
                  <tr key={session.id || idx} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-medium text-slate-200 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      {new Date(session.started_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                      {durationMins > 0 ? `${durationMins} mins` : `${session.duration_seconds}s`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          score >= 85
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : score >= 65
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {score}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-rose-400">
                      {session.slouch_count}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
