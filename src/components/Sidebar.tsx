import React, { useState } from "react";
import { Folder, File, ShieldAlert, Lock, Unlock, ChevronDown, ChevronRight, Edit2, Trash2, Plus, Scissors, Clipboard, LogOut, Download, Sliders, Palette, Type, Users, Menu, X } from "lucide-react";
import { JournalNode, JournalFolder, JournalFile, Personalization } from "../types";

interface SidebarProps {
  vFileSystem: JournalNode[];
  currentFileId: string | null;
  personalization: Personalization;
  clipboardNode: JournalNode | null;
  onSelectFile: (id: string) => void;
  onAddFolder: (parentId?: string) => void;
  onAddFile: (parentId: string) => void;
  onRenameNode: (id: string, name: string) => void;
  onDeleteNode: (id: string) => void;
  onCutNode: (id: string) => void;
  onPasteNode: (parentId: string) => void;
  onLockNode: (id: string, password?: string, type?: "folder" | "file") => void;
  onUnlockNode: (id: string, password?: string, type?: "folder" | "file") => void;
  onUpdatePersonalization: (updates: Partial<Personalization>) => void;
  onExportFolderBook: (folderId: string) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  username: string;
}

export default function Sidebar({
  vFileSystem,
  currentFileId,
  personalization,
  clipboardNode,
  onSelectFile,
  onAddFolder,
  onAddFile,
  onRenameNode,
  onDeleteNode,
  onCutNode,
  onPasteNode,
  onLockNode,
  onUnlockNode,
  onUpdatePersonalization,
  onExportFolderBook,
  onLogout,
  collapsed,
  onToggleCollapsed,
  username,
}: SidebarProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ "fold_demo": true });
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<"self" | "father" | "mother" | "others">("self");

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFolderLock = (folder: JournalFolder) => {
    if (folder.isLocked) {
      const pass = prompt("Enter password to unlock folder:");
      if (pass !== null) {
        onUnlockNode(folder.id, pass, "folder");
      }
    } else {
      const pass = prompt("Set password to lock folder:");
      if (pass) {
        onLockNode(folder.id, pass, "folder");
      }
    }
  };

  const handleFileLock = (file: JournalFile) => {
    if (file.isLocked) {
      const pass = prompt("Enter password to unlock file content:");
      if (pass !== null) {
        onUnlockNode(file.id, pass, "file");
      }
    } else {
      const pass = prompt("Set password to lock this file's contents:");
      if (pass) {
        onLockNode(file.id, pass, "file");
      }
    }
  };

  const handleRename = (id: string, currentName: string) => {
    const newName = prompt("Rename to:", currentName);
    if (newName) {
      onRenameNode(id, newName);
    }
  };

  const handleExport = (folderId: string) => {
    onExportFolderBook(folderId);
  };

  // Recurse filesystem and render nodes
  const renderNodes = (nodes: JournalNode[]) => {
    return nodes.map((node) => {
      const isFolder = node.type === "folder";

      if (isFolder) {
        const folder = node as JournalFolder;
        const isOpen = !!openFolders[folder.id];

        return (
          <div key={folder.id} className="space-y-1 my-1 pl-2 select-none relative group">
            {/* Folder element */}
            <div
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-sm group ${
                folder.isLocked ? "bg-red-950/10 hover:bg-red-950/20 border border-red-900/10" : "hover:bg-zinc-900 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => toggleFolder(folder.id)}>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                <Folder className={`w-4 h-4 shrink-0 ${folder.isLocked ? "text-red-400" : "text-amber-400"}`} />
                <span className="truncate font-medium">
                  {folder.isLocked ? "🔒 Locked Folder" : folder.name}
                </span>
              </div>

              {/* Folder Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                {!folder.isLocked && (
                  <>
                    <button onClick={() => onAddFile(folder.id)} title="Add File" className="p-1 rounded text-slate-400 hover:text-orange-400 hover:bg-zinc-800">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => onAddFolder(folder.id)} title="Add Sub-Folder" className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-zinc-800 font-mono text-[10px] leading-none px-1">
                      +F
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleFolderLock(folder)}
                  title={folder.isLocked ? "Unlock Folder" : "Lock Folder"}
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-zinc-800"
                >
                  {folder.isLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3" />}
                </button>
                {!folder.isLocked && (
                  <>
                    <button onClick={() => handleRename(folder.id, folder.name)} title="Rename" className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-zinc-800">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {clipboardNode && (
                      <button onClick={() => onPasteNode(folder.id)} title="Paste Here" className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-zinc-800">
                        <Clipboard className="w-3 h-3" />
                      </button>
                    )}
                    <button onClick={() => handleExport(folder.id)} title="Compile PDF" className="p-1 rounded text-slate-400 hover:text-green-400 hover:bg-zinc-800">
                      <Download className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteNode(folder.id)} title="Delete" className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-zinc-800">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Folder Children */}
            {isOpen && !folder.isLocked && (
              <div className="pl-3 border-l border-zinc-800/80 ml-4 space-y-1">
                {folder.children && folder.children.length > 0 ? (
                  renderNodes(folder.children)
                ) : (
                  <div className="text-[10px] text-zinc-600 font-mono py-1">Folder is empty</div>
                )}
              </div>
            )}
          </div>
        );
      } else {
        const file = node as JournalFile;
        const isActive = currentFileId === file.id;

        return (
          <div
            key={file.id}
            className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs group select-none transition-all ${
              isActive
                ? "bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold"
                : "text-slate-400 hover:bg-zinc-900/60 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => onSelectFile(file.id)}>
              <File className={`w-3.5 h-3.5 shrink-0 ${file.isLocked ? "text-red-400" : "text-sky-400"}`} />
              <span className="truncate">{file.isLocked ? `🔒 [Locked] ${file.name}` : file.name}</span>
              {file.mood && <span className="text-[10px] opacity-75">{file.mood}</span>}
            </div>

            {/* File Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
              <button
                onClick={() => handleFileLock(file)}
                title={file.isLocked ? "Unlock Content" : "Lock Content"}
                className="p-1 rounded hover:text-red-400 hover:bg-zinc-800"
              >
                {file.isLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3" />}
              </button>
              <button onClick={() => onCutNode(file.id)} title="Cut File" className="p-1 rounded hover:text-slate-200 hover:bg-zinc-800">
                <Scissors className="w-3 h-3" />
              </button>
              <button onClick={() => handleRename(file.id, file.name)} title="Rename" className="p-1 rounded hover:text-slate-200 hover:bg-zinc-800">
                <Edit2 className="w-3 h-3" />
              </button>
              <button onClick={() => onDeleteNode(file.id)} title="Delete" className="p-1 rounded hover:text-red-500 hover:bg-zinc-800">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      }
    });
  };

  if (collapsed) {
    return (
      <div className="w-16 bg-zinc-950 border-r border-zinc-900 flex flex-col items-center py-4 h-full shrink-0 select-none text-slate-300">
        <button
          onClick={onToggleCollapsed}
          title="Expand Sidebar Navigation"
          className="p-2 mb-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-orange-400 hover:text-orange-300 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col gap-4 items-center">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-display font-bold text-black text-xs shadow-lg shadow-orange-500/10">
            C
          </div>

          <button
            onClick={() => onAddFolder()}
            title="Create Root Folder"
            className="p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-orange-400 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onLogout}
          title="Terminate Vault Session"
          className="p-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-900 flex flex-col h-full shrink-0 select-none text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-display font-bold text-black text-base shadow-lg shadow-orange-500/10">
            C
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-white block">Chronicle Core</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Studio Workspace</span>
          </div>
        </div>

        <button
          onClick={onToggleCollapsed}
          title="Collapse Sidebar"
          className="p-1.5 rounded-lg hover:bg-zinc-900 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Aesthetic Options Dashboard */}
      <div className="p-4 border-b border-zinc-900/60 bg-zinc-950/40 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono uppercase tracking-widest font-semibold">
          <Palette className="w-3.5 h-3.5" /> Workspace Aesthetics
        </div>

        {/* Wallpaper Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-medium text-slate-500 uppercase">
            Workspace Wallpaper
          </label>
          <select
            value={personalization.outerWallpaper}
            onChange={(e) => onUpdatePersonalization({ outerWallpaper: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs py-2 px-2.5 outline-none focus:border-orange-500"
          >
            <optgroup label="Signature Canvas Themes">
              <option value="chai-code">Orange Matte Accent</option>
              <option value="futuristic">Neo-Futuristic Quantum</option>
            </optgroup>
            <optgroup label="Core Textures">
              <option value="wood">Reclaimed Wood Grain 🪵</option>
              <option value="meadow">Fresh Grass Meadow 🌿</option>
              <option value="ocean">Deep Sea Blue Surf 🌊</option>
              <option value="linen">Woven Slate Linen 🧵</option>
              <option value="cork">Editorial Corkboard 📌</option>
            </optgroup>
            <optgroup label="Premium Gradients">
              <option value="sunset">Cyber Sunset Glow 🌅</option>
              <option value="aurora">Northern Aurora 🌌</option>
              <option value="cosmic">Space Dark Nebula 🚀</option>
              <option value="blossom">Sakura Blossom Rain 🌸</option>
              <option value="lavender">Lavender Mist 🪻</option>
              <option value="monsoon">Thunder Monsoon ⛈️</option>
            </optgroup>
          </select>
        </div>

        {/* Notepad Page Background Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono font-medium text-slate-500 uppercase">
            Journal Slate Surface (Prints)
          </label>
          <select
            value={personalization.padStyle}
            onChange={(e) => onUpdatePersonalization({ padStyle: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs py-2 px-2.5 outline-none focus:border-orange-500"
          >
            <optgroup label="Classic Sheets">
              <option value="clean-white">Pristine Sheet (Plain White)</option>
              <option value="legal-yellow">Rules Pad (Legal Yellow Margins)</option>
              <option value="parchment">Antique Log (Parchment Tan)</option>
              <option value="ivory-smooth">Smooth Minimalist Sheet (Ivory)</option>
            </optgroup>
            <optgroup label="Matrix Grid Architectures">
              <option value="grid-graph">Mathematical Logic Grid (Graph Paper)</option>
              <option value="dotted-bullet">Creative Bullet Journal (Dotted)</option>
              <option value="vintage-ledger">Double Boundary Ledger lines</option>
              <option value="isometric-dot">Structural Perspective (Isometric)</option>
            </optgroup>
            <optgroup label="Matte Executive Choices">
              <option value="midnight-graphite">Executive Charcoal Shield</option>
              <option value="corporate-navy">Classic Professional Desk (Navy)</option>
              <option value="sage-mint">Serene Editorial Canvas (Sage)</option>
            </optgroup>
            <optgroup label="Developer High Contrast Modules">
              <option value="dark-terminal">Hacker Console (Terminal Green)</option>
              <option value="cyber-magenta">Synthwave Neon Grid</option>
              <option value="blueprint">Engineering Blueprint Base</option>
              <option value="monochrome-noir">Stark Noir (Black Sheet)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Directory Ledger Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono uppercase tracking-widest font-semibold px-1">
          <span>Ledger Files</span>
          <button
            onClick={() => onAddFolder()}
            title="Create Root Folder"
            className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-orange-400"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {clipboardNode && (
          <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/25 flex items-center justify-between text-[11px] text-orange-400 font-mono">
            <span className="truncate flex items-center gap-1.5">
              <Scissors className="w-3 h-3 shrink-0" /> Moving: {clipboardNode.name}
            </span>
            <span className="shrink-0 text-[10px] bg-orange-500/10 px-1.5 py-0.5 rounded">Cut state</span>
          </div>
        )}

        <div className="space-y-1">
          {vFileSystem.length > 0 ? (
            renderNodes(vFileSystem)
          ) : (
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/20 text-center text-xs text-slate-600 font-mono">
              No directories found. <br /> Create a root folder.
            </div>
          )}
        </div>
      </div>

      {/* Character Profiles Tab System */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono uppercase tracking-widest font-semibold">
          <Users className="w-3.5 h-3.5" /> Character Alignments
        </div>

        {/* Small tabs for each profile */}
        <div className="grid grid-cols-4 gap-1 pb-1">
          {(["self", "father", "mother", "others"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveProfileTab(tab)}
              className={`py-1 text-[9px] font-mono font-semibold rounded uppercase tracking-wider text-center transition-all cursor-pointer ${
                activeProfileTab === tab
                  ? "bg-orange-500 text-black font-bold"
                  : "bg-zinc-900 text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "self" ? "Self" : tab}
            </button>
          ))}
        </div>

        {activeProfileTab === "self" && (
          <textarea
            value={personalization.avatarDesc || ""}
            onChange={(e) => onUpdatePersonalization({ avatarDesc: e.target.value })}
            placeholder="Describe yourself (hair, clothes, style) for 2D illustration fidelity..."
            className="w-full h-18 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-orange-500 placeholder-zinc-700 text-slate-300 font-sans"
          />
        )}

        {activeProfileTab === "father" && (
          <textarea
            value={personalization.fatherDesc || ""}
            onChange={(e) => onUpdatePersonalization({ fatherDesc: e.target.value })}
            placeholder="Describe your father character (tall, beard, sweater, glasses)..."
            className="w-full h-18 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-orange-500 placeholder-zinc-700 text-slate-300 font-sans"
          />
        )}

        {activeProfileTab === "mother" && (
          <textarea
            value={personalization.motherDesc || ""}
            onChange={(e) => onUpdatePersonalization({ motherDesc: e.target.value })}
            placeholder="Describe your mother character (kind eyes, scarf, hair style)..."
            className="w-full h-18 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-orange-500 placeholder-zinc-700 text-slate-300 font-sans"
          />
        )}

        {activeProfileTab === "others" && (
          <textarea
            value={personalization.othersDesc || ""}
            onChange={(e) => onUpdatePersonalization({ othersDesc: e.target.value })}
            placeholder="Describe other recurring characters or background guidelines..."
            className="w-full h-18 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-orange-500 placeholder-zinc-700 text-slate-300 font-sans"
          />
        )}
      </div>

      {/* User Session Footer */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span className="truncate">Unsealed: {username || "Admin"}</span>
        <button
          onClick={onLogout}
          title="Terminate Vault Session"
          className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors font-medium shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </div>
  );
}
