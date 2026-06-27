import React, { useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Clipboard, Code, Quote, Sliders, Sparkles, Smile, Undo, Redo, Save, RefreshCw
} from "lucide-react";
import { Personalization } from "../types";

interface WordRibbonProps {
  personalization: Personalization;
  onUpdatePersonalization: (updates: Partial<Personalization>) => void;
  onExecuteCommand: (command: string, value?: string) => void;
  onInjectSticker: (emoji: string) => void;
  onInsertCodeBlock: (lang: string) => void;
  onInsertTemplate: (name: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  saveStatus?: string;
}

export default function WordRibbon({
  personalization,
  onUpdatePersonalization,
  onExecuteCommand,
  onInjectSticker,
  onInsertCodeBlock,
  onInsertTemplate,
  onUndo,
  onRedo,
  onSave,
  saveStatus,
}: WordRibbonProps) {
  const [activeTab, setActiveTab] = useState<"home" | "insert" | "layout" | "developer" | "stickers">("home");

  // Determine light mode based on wallpaper theme
  const isLight = ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(personalization.outerWallpaper);

  // Font selections
  const fonts = [
    { name: "Default System (Sans)", val: "-apple-system, sans-serif" },
    { name: "Georgia Editorial", val: "Georgia, serif" },
    { name: "Monospace Code", val: "'Courier New', monospace" },
    { name: "Space Grotesk", val: "'Space Grotesk', sans-serif" },
    { name: "Playfair Display", val: "'Playfair Display', serif" },
    { name: "JetBrains Mono", val: "'JetBrains Mono', monospace" },
  ];

  const stickers = {
    faces: ["😊", "🐱", "💻", "🎨", "🚀", "🔥", "💖", "⚡", "🌌", "🎉", "🐼", "🦊", "✨", "🌟", "💡", "🍀", "💎", "🧩"],
    objects: ["📱", "⌨️", "🖥️", "📚", "🖊️", "☕", "🍕", "🎮", "🎸", "🎧", "📷", "🎒", "🛠️", "🔑", "📦", "⏰", "🍕", "🛸"],
    symbols: ["⭐", "❤️", "📍", "🔔", "📎", "📁", "💬", "💭", "❌", "✔️", "⚠️", "🌀", "🐾", "🌈", "🏁", "🎯", "👑", "🔮"]
  };

  const codeLanguages = [
    { name: "Python", val: "python" },
    { name: "JavaScript", val: "javascript" },
    { name: "C++", val: "cpp" },
    { name: "SQL", val: "sql" },
  ];

  const templates = [
    { name: "Daily Reflection ☀️", val: "daily" },
    { name: "Technical Log 💻", val: "technical" },
    { name: "Creative Brainstorm 🎨", val: "creative" },
  ];

  return (
    <div className={`w-full flex flex-col shrink-0 transition-all duration-300 ${
      isLight 
        ? "bg-white/20 border-b border-pink-200/20 text-stone-900 backdrop-blur-md" 
        : "bg-black/15 border-b border-zinc-900/30 text-slate-100 backdrop-blur-md"
    }`}>
      {/* Ribbon Tab Bar */}
      <div className={`flex items-center justify-between px-4 pt-1 border-b text-xs transition-colors ${
        isLight ? "bg-white/5 border-pink-200/10" : "bg-black/5 border-zinc-900/10"
      }`}>
        <div className="flex">
          {(["home", "insert", "layout", "developer", "stickers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-medium border-t-2 capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? isLight
                    ? "border-pink-500 text-pink-600 bg-white/40 font-semibold"
                    : "border-orange-500 text-orange-400 bg-zinc-900/40 font-semibold"
                  : isLight
                    ? "border-transparent text-stone-500 hover:text-stone-800"
                    : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "layout" ? "Page Layout" : tab}
            </button>
          ))}
        </div>

        {/* Quick Save Action */}
        <button
          onClick={onSave}
          className={`flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-md text-xs font-semibold shadow-sm cursor-pointer transition-all ${
            saveStatus === "saving"
              ? "bg-amber-500 text-black animate-pulse"
              : saveStatus === "saved"
                ? "bg-green-500 text-white"
                : isLight
                  ? "bg-pink-600 hover:bg-pink-500 text-white"
                  : "bg-orange-500 hover:bg-orange-400 text-black"
          }`}
        >
          {saveStatus === "saving" ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : saveStatus === "saved" ? (
            <>
              <span>✓</span>
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Entry (Ctrl+S)</span>
            </>
          )}
        </button>
      </div>

      {/* Ribbon Control Deck */}
      <div className={`p-3 flex items-center gap-6 overflow-x-auto h-[74px] ${
        isLight ? "bg-white/5" : "bg-zinc-900/10"
      }`}>
        
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className={`flex items-center gap-6 divide-x ${isLight ? "divide-pink-100/50" : "divide-zinc-800"}`}>
            {/* Font Pairings */}
            <div className="flex items-center gap-2 pr-4">
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Font Family</span>
                <select
                  value={personalization.typography}
                  onChange={(e) => {
                    onUpdatePersonalization({ typography: e.target.value });
                    onExecuteCommand("fontName", e.target.value);
                  }}
                  className={`border rounded px-2 py-1 text-xs outline-none focus:border-pink-500 max-w-[140px] ${
                    isLight 
                      ? "bg-white border-pink-100 text-stone-800" 
                      : "bg-zinc-900 border-zinc-800 text-slate-300"
                  }`}
                >
                  {fonts.map((f) => (
                    <option key={f.val} value={f.val}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Character styling */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Styles</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onExecuteCommand("bold")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("italic")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="Italic">
                  <Italic className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("underline")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="Underline">
                  <Underline className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("strikeThrough")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="StrikeThrough">
                  <Strikethrough className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Undo / Redo Operations */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>History</span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={onUndo} 
                  className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} 
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button 
                  onClick={onRedo} 
                  className={`p-1.5 rounded transition-all cursor-pointer flex items-center justify-center ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} 
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Text and highlight colors */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Ink Palette</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1" title="Font Color">
                  <span className="text-[11px] font-mono">A:</span>
                  <input
                    type="color"
                    onChange={(e) => onExecuteCommand("foreColor", e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                </div>
                <div className="flex items-center gap-1" title="Highlight Color">
                  <span className="text-[11px] font-mono">Marker:</span>
                  <input
                    type="color"
                    defaultValue="#ffff00"
                    onChange={(e) => onExecuteCommand("hiliteColor", e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Paragraph alignments */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Alignments</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onExecuteCommand("justifyLeft")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`}>
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("justifyCenter")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`}>
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("justifyRight")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`}>
                  <AlignRight className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("justifyFull")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`}>
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Indenting / Lists */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Lists</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onExecuteCommand("insertUnorderedList")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="Bullet List">
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => onExecuteCommand("insertOrderedList")} className={`p-1.5 rounded transition-all cursor-pointer ${isLight ? "hover:bg-pink-100/60 text-stone-700" : "hover:bg-zinc-800 text-slate-300"}`} title="Numbered List">
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INSERT TAB */}
        {activeTab === "insert" && (
          <div className={`flex items-center gap-6 divide-x ${isLight ? "divide-pink-100/50" : "divide-zinc-800"}`}>
            {/* Quick objects */}
            <div className="flex flex-col gap-1 pr-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Add Layout Blocks</span>
              <div className="flex items-center gap-2">
                <button onClick={() => onExecuteCommand("insertHorizontalRule")} className={`px-3 py-1 rounded border hover:bg-pink-100/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer ${isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800"}`}>
                  <Sliders className="w-3.5 h-3.5" /> Horizontal Rule
                </button>
                <button
                  onClick={() => {
                    const blockquote = `<blockquote>"${window.getSelection()?.toString() || 'Add editorial blockquote here'}"</blockquote>`;
                    onExecuteCommand("insertHTML", blockquote);
                  }}
                  className={`px-3 py-1 rounded border hover:bg-pink-100/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer ${isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800"}`}
                >
                  <Quote className="w-3.5 h-3.5" /> Blockquote
                </button>
              </div>
            </div>

            {/* Copy Clipboard block */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Copy Utility</span>
              <button
                onClick={() => {
                  const contentText = document.getElementById("editorEngine")?.innerText || "";
                  navigator.clipboard.writeText(contentText);
                  alert("Copied raw text to clipboard!");
                }}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Clipboard className="w-4 h-4" /> Copy Entire Pad
              </button>
            </div>
          </div>
        )}

        {/* PAGE LAYOUT TAB */}
        {activeTab === "layout" && (
          <div className={`flex items-center gap-6 divide-x ${isLight ? "divide-pink-100/50" : "divide-zinc-800"}`}>
            {/* Print Margins */}
            <div className="flex flex-col gap-1 pr-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Pad Margin</span>
              <select
                value={personalization.margins}
                onChange={(e) => onUpdatePersonalization({ margins: e.target.value })}
                className={`border rounded px-2 py-1 text-xs outline-none focus:border-pink-500 ${
                  isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-900 border-zinc-800 text-slate-300"
                }`}
              >
                <option value="60px 55px">Standard Layout (Default)</option>
                <option value="30px 20px">Narrow Print Margins</option>
                <option value="80px 75px">Generous Wide Spaces</option>
              </select>
            </div>

            {/* Line spacing */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Line Height</span>
              <select
                value={personalization.lineSpacing}
                onChange={(e) => onUpdatePersonalization({ lineSpacing: e.target.value })}
                className={`border rounded px-2 py-1 text-xs outline-none focus:border-pink-500 ${
                  isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-900 border-zinc-800 text-slate-300"
                }`}
              >
                <option value="1.5">Compact Single Spacing (1.5)</option>
                <option value="1.8">Editorial Double Spacing (1.8)</option>
                <option value="2.2">Wide Review Spacing (2.2)</option>
              </select>
            </div>

            {/* Custom page padding */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Pad Orientation</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdatePersonalization({ padding: "500px" })}
                  className={`px-2.5 py-1 border rounded text-[11px] hover:bg-pink-100/10 cursor-pointer ${
                    isLight ? "bg-white border-pink-100 text-stone-700" : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800"
                  }`}
                >
                  Portrait Sheet
                </button>
                <button
                  onClick={() => onUpdatePersonalization({ padding: "100%" })}
                  className={`px-2.5 py-1 border rounded text-[11px] hover:bg-pink-100/10 cursor-pointer ${
                    isLight ? "bg-white border-pink-100 text-stone-700" : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800"
                  }`}
                >
                  Landscape Sheet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEVELOPER TAB */}
        {activeTab === "developer" && (
          <div className={`flex items-center gap-6 divide-x ${isLight ? "divide-pink-100/50" : "divide-zinc-800"}`}>
            {/* Code syntax blocks */}
            <div className="flex flex-col gap-1 pr-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Markdown Code Blocks</span>
              <div className="flex items-center gap-1.5">
                {codeLanguages.map((lang) => (
                  <button
                    key={lang.val}
                    onClick={() => onInsertCodeBlock(lang.val)}
                    className={`px-2.5 py-1 rounded border text-xs font-mono font-medium cursor-pointer ${
                      isLight 
                        ? "bg-white border-pink-100 text-stone-700 hover:bg-pink-100/15 hover:text-pink-600" 
                        : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800 hover:text-orange-400"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates block */}
            <div className="flex flex-col gap-1 px-4">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Prose Layout Templates</span>
              <div className="flex items-center gap-1.5">
                {templates.map((temp) => (
                  <button
                    key={temp.val}
                    onClick={() => onInsertTemplate(temp.val)}
                    className={`px-2.5 py-1 border rounded text-xs cursor-pointer ${
                      isLight 
                        ? "bg-white border-pink-100 text-stone-700 hover:bg-pink-100/10" 
                        : "bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800"
                    }`}
                  >
                    {temp.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STICKERS DRAW PORT */}
        {activeTab === "stickers" && (
          <div className="flex items-center gap-4 w-full overflow-hidden">
            <div className="flex flex-col gap-1 shrink-0">
              <span className={`text-[10px] font-mono uppercase font-semibold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Drop Interactive Badges</span>
              <span className={`text-[10px] font-mono ${isLight ? "text-pink-600" : "text-orange-400/80"}`}>Click to insert on canvas:</span>
            </div>
            
            <div className="flex items-center gap-4 overflow-x-auto pb-1 max-w-full">
              {/* Combine stickers categories */}
              <div className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                isLight ? "bg-pink-50/50 border-pink-100" : "bg-zinc-900/40 border-zinc-800/80"
              }`}>
                {stickers.faces.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onInjectSticker(s)}
                    className="text-lg hover:scale-130 transition-transform cursor-pointer p-0.5"
                  >
                    {s}
                  </button>
                ))}
                {stickers.objects.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onInjectSticker(s)}
                    className="text-lg hover:scale-130 transition-transform cursor-pointer p-0.5"
                  >
                    {s}
                  </button>
                ))}
                {stickers.symbols.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onInjectSticker(s)}
                    className="text-lg hover:scale-130 transition-transform cursor-pointer p-0.5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
