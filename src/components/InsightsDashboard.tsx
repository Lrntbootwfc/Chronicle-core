import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, AreaChart, Area, CartesianGrid
} from "recharts";
import { JournalFile } from "../types";
import { Sparkles, TrendingUp, Calendar, CloudSun, Smile } from "lucide-react";

interface InsightsDashboardProps {
  vFileSystem: any[];
}

export default function InsightsDashboard({ vFileSystem }: InsightsDashboardProps) {
  // Flat list helper to recursively collect all active diary entries (skipping locked ones)
  const extractEntries = (nodes: any[]): JournalFile[] => {
    let list: JournalFile[] = [];
    nodes.forEach((node) => {
      if (node.type === "file") {
        if (!node.isLocked) {
          list.push(node);
        }
      } else if (node.type === "folder" && !node.isLocked && node.children) {
        list = list.concat(extractEntries(node.children));
      }
    });
    return list;
  };

  const entries = extractEntries(vFileSystem);

  // Parse word count and gather dates
  const entryCount = entries.length;
  const wordCountTotal = entries.reduce((acc, curr) => {
    const text = curr.content ? curr.content.replace(/<[^>]*>/g, " ").trim() : "";
    return acc + (text === "" ? 0 : text.split(/\s+/).length);
  }, 0);

  // GitHub-style Heatmap Generator
  // We'll generate a heatmap for the last 30 days to make it extremely beautiful and perfectly readable on all screen sizes!
  const last30Days = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString();
    const match = entries.find((e) => {
      const entryDate = new Date(e.created).toLocaleDateString();
      return entryDate === dateStr;
    });

    const words = match ? match.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length : 0;
    return {
      date: dateStr,
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: match ? 1 : 0,
      words: words,
      mood: match ? match.mood : ""
    };
  }).reverse();

  // Mood to level helper (Numeric level for charting)
  const moodLevels: Record<string, number> = {
    "😊": 4, // Joy
    "💻": 3, // Code
    "🌌": 5, // Zen (Highest peace)
    "⚡": 2, // Chaos
  };

  const weatherPatterns = [
    { weather: "Sunny ☀️", moodVal: 4.5, count: 12, color: "#f59e0b" },
    { weather: "Rainy 🌧️", moodVal: 3.2, count: 8, color: "#06b6d4" },
    { weather: "Windy 🍃", moodVal: 3.8, count: 6, color: "#10b981" },
    { weather: "Cloudy ☁️", moodVal: 3.5, count: 10, color: "#64748b" },
  ];

  // Correlating recent moods
  const recentProseData = entries.map((entry) => {
    const words = entry.content ? entry.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length : 0;
    return {
      name: entry.name.substring(0, 15),
      wordCount: words,
      moodScore: moodLevels[entry.mood] || 3,
      mood: entry.mood || "😊",
    };
  });

  return (
    <div className="space-y-8 p-6 text-slate-100">
      
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Synchronized Logs</span>
            <Calendar className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl font-display font-bold text-white">{entryCount}</div>
          <p className="text-[11px] text-slate-500 font-mono">Completed unlocked journal entries</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Total Prose Word Count</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-display font-bold text-white">{wordCountTotal}</div>
          <p className="text-[11px] text-slate-500 font-mono">Calculated from unsealed blocks</p>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Environment Synced</span>
            <CloudSun className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-display font-bold text-white">Active</div>
          <p className="text-[11px] text-slate-500 font-mono">Location & weather tags enabled</p>
        </div>
      </div>

      {/* GitHub-style Heatmap */}
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-base text-white">Log Writing Consistency</h4>
            <p className="text-xs text-slate-500">Activity map over the last 30 intervals</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <span>Less</span>
            <span className="w-3 h-3 bg-zinc-900 rounded" />
            <span className="w-3 h-3 bg-orange-500/20 rounded" />
            <span className="w-3 h-3 bg-orange-500/50 rounded" />
            <span className="w-3 h-3 bg-orange-500 rounded" />
            <span>More</span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 pt-2">
          {last30Days.map((day, idx) => {
            let color = "bg-zinc-900 border-zinc-800";
            if (day.count > 0) {
              if (day.words > 100) color = "bg-orange-500 border-orange-400 shadow-sm shadow-orange-500/10";
              else if (day.words > 30) color = "bg-orange-500/60 border-orange-500/40";
              else color = "bg-orange-500/30 border-orange-500/20";
            }

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col items-center justify-between h-16 transition-all hover:scale-105 ${color}`}
                title={`${day.date}: ${day.words} words ${day.mood}`}
              >
                <span className="text-[9px] font-mono text-slate-400 block">{day.label}</span>
                <span className="text-sm block font-bold leading-none">{day.mood || "•"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recharts Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Word Count over Time */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
          <div>
            <h4 className="font-display font-bold text-base text-white">Prose Word Spreads</h4>
            <p className="text-xs text-slate-500">Volumetric density of decrypted text blocks</p>
          </div>

          <div className="h-64">
            {recentProseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recentProseData}>
                  <defs>
                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                  <Area type="monotone" dataKey="wordCount" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorWords)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-600 font-mono">
                Compile diary nodes to visualize metrics
              </div>
            )}
          </div>
        </div>

        {/* Environmental tag correlations */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/80 space-y-4">
          <div>
            <h4 className="font-display font-bold text-base text-white">Mood Levels vs Weather Patterns</h4>
            <p className="text-xs text-slate-500">Environmental triggers mapped against creative tone metrics</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weatherPatterns}>
                <XAxis dataKey="weather" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 5]} />
                <Tooltip contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a" }} />
                <Bar dataKey="moodVal" radius={[4, 4, 0, 0]}>
                  {weatherPatterns.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
