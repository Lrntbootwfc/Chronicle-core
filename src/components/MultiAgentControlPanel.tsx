import React, { useState } from "react";
import { Brain, Film, Users, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Terminal, Sparkles, ShieldCheck } from "lucide-react";

interface MultiAgentControlPanelProps {
    storyUnderstanding?: {
        genre?: string;
        emotion_curve?: string[];
        characters?: Array<{ id: string; role: string; gender?: string; age?: string }>;
        locations?: string[];
        important_events?: string[];
    };
    characterSheets?: Record<string, string>;
    qualityControlLogs?: Array<{
        page: number;
        panel: number;
        verdict: string;
        reason: string;
        prompt_used?: string;
    }>;
    comicPages?: Array<{
        page_number: number;
        panels: any[];
    }>;
}

export const MultiAgentControlPanel: React.FC<MultiAgentControlPanelProps> = ({
    storyUnderstanding,
    characterSheets,
    qualityControlLogs,
    comicPages,
}) => {
    const [activeTab, setActiveTab] = useState<"agent1" | "agent2" | "agent3" | "agent4">("agent1");
    const [expandedSection, setExpandedSection] = useState<boolean>(true);

    // If no trace is available yet, display an elegant placeholder explaining how the Multi-Agent engine functions.
    const hasData = storyUnderstanding || characterSheets || qualityControlLogs || comicPages;

    if (!hasData) {
        return (
            <div className="p-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 text-center space-y-3" id="multi-agent-empty">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-zinc-800/40 text-orange-400">
                    <Terminal className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-widest">Multi-Agent AI Control Center</h4>
                <p className="text-[11px] text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    The pipeline acts as a four-agent sequence. Once you trigger a generation, the story analyst, the scenic director, the character illustrator, and the quality inspector will stream their live analytics here.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-2xl overflow-hidden" id="multi-agent-control-panel">
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 bg-zinc-950/60 border-b border-zinc-800/50 cursor-pointer select-none"
                onClick={() => setExpandedSection(!expandedSection)}
            >
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400 animate-pulse" />
                    <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
                        Multi-Agent AI Control Center
                        <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] px-1.5 py-0.5 rounded font-normal uppercase tracking-normal">
                            Active Traces
                        </span>
                    </h4>
                </div>
                <button className="text-zinc-400 hover:text-zinc-200">
                    {expandedSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {expandedSection && (
                <div className="p-4 space-y-4">
                    {/* Custom Tabs */}
                    <div className="grid grid-cols-4 gap-1.5 bg-zinc-950/50 p-1 rounded-xl border border-zinc-800/80">
                        <button
                            onClick={() => setActiveTab("agent1")}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${activeTab === "agent1"
                                    ? "bg-zinc-800 text-orange-400 font-bold border border-zinc-700/50"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            <Brain className="w-4 h-4" />
                            <span className="text-[8px] font-mono tracking-tighter uppercase">Story Analyser</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("agent2")}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${activeTab === "agent2"
                                    ? "bg-zinc-800 text-orange-400 font-bold border border-zinc-700/50"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            <Film className="w-4 h-4" />
                            <span className="text-[8px] font-mono tracking-tighter uppercase">Comic Director</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("agent3")}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${activeTab === "agent3"
                                    ? "bg-zinc-800 text-orange-400 font-bold border border-zinc-700/50"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            <span className="text-[8px] font-mono tracking-tighter uppercase">Char Sheet</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("agent4")}
                            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${activeTab === "agent4"
                                    ? "bg-zinc-800 text-orange-400 font-bold border border-zinc-700/50"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[8px] font-mono tracking-tighter uppercase">Vision QA</span>
                        </button>
                    </div>

                    {/* Active Content */}
                    <div className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/40 min-h-[160px]">
                        {/* Agent 1 Tab */}
                        {activeTab === "agent1" && (
                            <div className="space-y-3 animate-fadeIn text-xs" id="agent1-content">
                                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Agent 1: Story Understanding AI</span>
                                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] uppercase">{storyUnderstanding?.genre || "Slice of life"}</span>
                                </div>

                                {storyUnderstanding?.emotion_curve && storyUnderstanding.emotion_curve.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-500 font-mono block">EMOTION CURVE TIMELINE:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {storyUnderstanding.emotion_curve.map((emotion, idx) => (
                                                <div key={idx} className="flex items-center gap-1">
                                                    {idx > 0 && <span className="text-zinc-600">→</span>}
                                                    <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] font-mono border border-orange-500/20">
                                                        {emotion}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {storyUnderstanding?.important_events && storyUnderstanding.important_events.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-500 font-mono block">CHRONOLOGICAL EVENT EXTRACTION:</span>
                                        <ul className="space-y-1 pl-1">
                                            {storyUnderstanding.important_events.map((event, idx) => (
                                                <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                                                    <span className="text-orange-500/80 font-mono text-[9px] mt-0.5">{idx + 1}.</span>
                                                    <span>{event}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Agent 2 Tab */}
                        {activeTab === "agent2" && (
                            <div className="space-y-3 animate-fadeIn text-xs" id="agent2-content">
                                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Agent 2: Comic Director / Storyboard</span>
                                    <span className="text-zinc-400 font-mono text-[9px]">{comicPages?.length || 1} Page Storyboard</span>
                                </div>

                                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                                    {comicPages?.map((page) => (
                                        <div key={page.page_number} className="space-y-2">
                                            <div className="text-[9px] font-mono text-orange-400 bg-orange-500/5 border border-orange-500/15 py-0.5 px-2 rounded">
                                                PAGE {page.page_number} STORYBOARD
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {page.panels?.map((panel, pidx) => (
                                                    <div key={pidx} className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800 space-y-1">
                                                        <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                                                            <span>PANEL {panel.panel_number}</span>
                                                            <span className="text-[8px] bg-zinc-800 px-1 py-0.2 rounded text-zinc-300 uppercase">{panel.camera || "Medium"}</span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-300 font-sans line-clamp-2 leading-snug">{panel.action}</p>
                                                        {panel.caption && (
                                                            <div className="text-[9px] text-zinc-500 italic bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800/40 line-clamp-1">
                                                                Caption: "{panel.caption}"
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Agent 3 Tab */}
                        {activeTab === "agent3" && (
                            <div className="space-y-3 animate-fadeIn text-xs" id="agent3-content">
                                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Agent 3: Consistent Character Sheet</span>
                                    <span className="px-1.5 py-0.2 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-mono">Anime Style</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 max-h-52 overflow-y-auto pr-1">
                                    {characterSheets && Object.entries(characterSheets).map(([charName, profile]) => (
                                        <div key={charName} className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-start gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-400 shrink-0 uppercase font-mono">
                                                {charName.slice(0, 2)}
                                            </div>
                                            <div className="space-y-0.5 w-full">
                                                <h5 className="text-[11px] font-bold text-zinc-200 font-mono">{charName}</h5>
                                                {profile && typeof profile === "object" ? (
                                                    <div className="space-y-1 mt-1 text-[10px]">
                                                        {Object.entries(profile).map(([key, val]) => (
                                                            <div key={key} className="flex gap-1.5 items-start">
                                                                <span className="font-mono text-zinc-500 font-medium shrink-0">{key}:</span>
                                                                <span className="text-zinc-300 font-sans leading-normal">
                                                                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{profile ? String(profile) : ""}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(!characterSheets || Object.keys(characterSheets).length === 0) && (
                                        <p className="text-zinc-500 text-[10px] font-mono text-center py-4">No characters generated.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Agent 4 Tab */}
                        {activeTab === "agent4" && (
                            <div className="space-y-3 animate-fadeIn text-xs" id="agent4-content">
                                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-1.5">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Agent 4: Vision QA Checker</span>
                                    <span className="px-1.5 py-0.2 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-mono">Real-time Verify</span>
                                </div>

                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {qualityControlLogs?.map((log, idx) => (
                                        <div key={idx} className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-[9px] font-mono">
                                                <span className="text-zinc-400">Page {log.page} — Panel {log.panel}</span>
                                                {log.verdict === "PASS" ? (
                                                    <span className="flex items-center gap-0.5 text-green-400 bg-green-500/10 border border-green-500/20 px-1 py-0.2 rounded uppercase">
                                                        <CheckCircle className="w-2.5 h-2.5" /> Pass
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded uppercase animate-pulse">
                                                        <AlertTriangle className="w-2.5 h-2.5" /> Regenerated
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-300 font-sans leading-normal">
                                                <span className="text-zinc-500 font-mono block text-[9px]">OBSERVATION LOG:</span>
                                                {log.reason}
                                            </p>
                                        </div>
                                    ))}
                                    {(!qualityControlLogs || qualityControlLogs.length === 0) && (
                                        <p className="text-zinc-500 text-[10px] font-mono text-center py-4">Verification logs pending active generation.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
