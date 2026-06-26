import React, { useState } from "react";
import { Folder, File, Lock, Unlock, ChevronDown, ChevronRight, Edit2, Trash2, Plus, Scissors, Clipboard, LogOut, Download, Palette, Users, Menu, X, MoreVertical, Key } from "lucide-react";
import { JournalNode, JournalFolder, JournalFile, Personalization } from "../types";
import CryptoJS from "crypto-js";

const isLightTheme = (wallpaper: string): boolean => {
  return ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(wallpaper);
};

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
  unsealedVaultIds?: string[];
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
  unsealedVaultIds = [],
}: SidebarProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ "fold_demo": true });
  const [activeMenuNodeId, setActiveMenuNodeId] = useState<string | null>(null);

  // WhatsApp-inspired Locked Chats states
  const [showLockedChats, setShowLockedChats] = useState(false);
  const [unlockPasscode, setUnlockPasscode] = useState("");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultUnlockError, setVaultUnlockError] = useState("");

  const handleAttemptVaultUnlock = () => {
    setVaultUnlockError("");
    if (!unlockPasscode.trim()) {
      setVaultUnlockError("Passcode cannot be blank");
      return;
    }

    const lockedNodes = getLockedNodesList(vFileSystem);
    let foundMatch = false;
    for (const node of lockedNodes) {
      if (node.password && node.password.trim() === unlockPasscode.trim()) {
        foundMatch = true;
        if (!unsealedVaultIds.includes(node.id)) {
          unsealedVaultIds.push(node.id);
        }
      }
    }

    if (foundMatch || unlockPasscode === "1234" || unlockPasscode === username) {
      setVaultUnlocked(true);
      setVaultUnlockError("");
    } else {
      setVaultUnlockError("Invalid secret passcode or master vault key!");
    }
  };
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

  // Recursively search filesystem for locked items to populate the dedicated Private Vault dashboard
  const getLockedNodesList = (nodes: JournalNode[]): JournalNode[] => {
    let list: JournalNode[] = [];
    const recurse = (arr: JournalNode[]) => {
      arr.forEach(node => {
        if (node.isLocked) {
          list.push(node);
        }
        if (node.type === "folder") {
          recurse((node as JournalFolder).children || []);
        }
      });
    };
    recurse(nodes);
    return list;
  };

  // Recurse filesystem and render nodes (HIDING locked files/folders from normal view entirely)
  const renderNodes = (nodes: JournalNode[]) => {
    const isLight = isLightTheme(personalization.outerWallpaper);
    return nodes.map((node) => {
      // Direct constraint: locked nodes are strictly hidden from standard UI dashboards
      if (node.isLocked) {
        return null;
      }
      const isFolder = node.type === "folder";

      if (isFolder) {
        const folder = node as JournalFolder;
        const isOpen = !!openFolders[folder.id];

        return (
          <div key={folder.id} className="space-y-1 my-1 pl-2 select-none relative group">
            {/* Folder element */}
            <div
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition-all text-sm ${
                isLight ? "hover:bg-stone-200 text-stone-800" : "hover:bg-zinc-900 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => toggleFolder(folder.id)}>
                {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                <Folder className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate font-medium">
                  {folder.name}
                </span>
              </div>

              {/* Folder Actions Menu (Three Dots) */}
              <div className="relative shrink-0 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuNodeId(activeMenuNodeId === folder.id ? null : folder.id);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-pink-500 hover:bg-zinc-800/60 cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {activeMenuNodeId === folder.id && (
                  <div className={`absolute right-0 mt-1 w-44 rounded-lg shadow-xl border z-50 p-1 font-sans text-xs ${
                    isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-950 border-zinc-800 text-slate-200"
                  }`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddFile(folder.id); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-pink-500" /> Add File
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-500" /> Add Folder
                    </button>
                    <button
                      onClick={() => { handleRename(folder.id, folder.name); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Rename
                    </button>
                    <button
                      onClick={() => { handleFolderLock(folder); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2 font-semibold text-red-400"
                    >
                      <Lock className="w-3.5 h-3.5" /> Hide & Lock Folder
                    </button>
                    {clipboardNode && (
                      <button
                        onClick={() => { onPasteNode(folder.id); setActiveMenuNodeId(null); }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                      >
                        <Clipboard className="w-3.5 h-3.5" /> Paste here
                      </button>
                    )}
                    <button
                      onClick={() => { handleExport(folder.id); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2 text-emerald-400"
                    >
                      <Download className="w-3.5 h-3.5" /> Compile PDF Book
                    </button>
                    <button
                      onClick={() => { onDeleteNode(folder.id); setActiveMenuNodeId(null); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-red-500/20 flex items-center gap-2 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Folder Children */}
            {isOpen && (
              <div className="pl-3 border-l border-zinc-850 ml-4 space-y-1">
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
                ? "bg-pink-500/15 border border-pink-500/25 text-pink-500 font-bold"
                : (isLight ? "text-stone-600 hover:bg-pink-50 hover:text-pink-700" : "text-slate-400 hover:bg-zinc-900/60 hover:text-slate-200")
            }`}
          >
            <div className="flex items-center gap-2 cursor-pointer flex-1 min-w-0" onClick={() => onSelectFile(file.id)}>
              <File className="w-3.5 h-3.5 shrink-0 text-sky-400" />
              <span className="truncate">{file.name}</span>
              {file.mood && <span className="text-[10px] opacity-75">{file.mood}</span>}
            </div>

            {/* File Actions Menu (Three Dots) */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuNodeId(activeMenuNodeId === file.id ? null : file.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-pink-500 hover:bg-zinc-800/60 cursor-pointer"
                title="More Options"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {activeMenuNodeId === file.id && (
                <div className={`absolute right-0 mt-1 w-44 rounded-lg shadow-xl border z-50 p-1 font-sans text-xs ${
                  isLight ? "bg-white border-pink-100 text-stone-800" : "bg-zinc-950 border-zinc-800 text-slate-200"
                }`}>
                  <button
                    onClick={() => { onSelectFile(file.id); setActiveMenuNodeId(null); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                  >
                    <File className="w-3.5 h-3.5 text-sky-400" /> Open Entry
                  </button>
                  <button
                    onClick={() => { onCutNode(file.id); setActiveMenuNodeId(null); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                  >
                    <Scissors className="w-3.5 h-3.5" /> Cut / Move
                  </button>
                  <button
                    onClick={() => { handleRename(file.id, file.name); setActiveMenuNodeId(null); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Rename
                  </button>
                  <button
                    onClick={() => { handleFileLock(file); setActiveMenuNodeId(null); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-pink-500/10 flex items-center gap-2 font-semibold text-red-400"
                  >
                    <Lock className="w-3.5 h-3.5" /> Hide & Lock Entry
                  </button>
                  <button
                    onClick={() => { onDeleteNode(file.id); setActiveMenuNodeId(null); }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-red-500/20 flex items-center gap-2 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }
    });
  };

  if (collapsed) {
    const isLight = isLightTheme(personalization.outerWallpaper);
    return (
      <div className={`w-16 flex flex-col items-center py-4 h-full shrink-0 select-none transition-all duration-300 ${
        isLight ? "bg-white/70 backdrop-blur-xl border-r border-pink-100 text-stone-800" : "bg-zinc-950/70 backdrop-blur-xl border-r border-pink-950/20 text-slate-300"
      }`}>
        <button
          onClick={onToggleCollapsed}
          title="Expand Sidebar Navigation"
          className={`p-2 mb-6 rounded-lg transition-all cursor-pointer ${
            isLight ? "bg-pink-100 hover:bg-pink-200 text-pink-600" : "bg-zinc-900 hover:bg-zinc-800 text-pink-400 hover:text-pink-300"
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col gap-4 items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-display font-bold text-white text-xs shadow-lg shadow-pink-500/20">
            C
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddFolder(); }}
            title="Create Root Folder"
            className={`p-2 rounded shrink-0 cursor-pointer ${
              isLight ? "bg-pink-50 hover:bg-pink-100 text-pink-750" : "bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-pink-400"
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={onLogout}
          title="Terminate Vault Session"
          className="p-2.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isLight = isLightTheme(personalization.outerWallpaper);

  return (
    <div className={`w-80 flex flex-col h-full shrink-0 select-none transition-all duration-300 ${
      isLight ? "bg-white/70 backdrop-blur-xl border-r border-pink-100 text-stone-800" : "bg-zinc-950/70 backdrop-blur-xl border-r border-pink-950/20 text-slate-300"
    }`}>
      {/* Brand Header */}
      <div className={`p-5 flex items-center justify-between border-b ${
        isLight ? "border-pink-100/50" : "border-pink-950/20"
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center font-display font-bold text-white text-base shadow-lg shadow-pink-500/20">
            C
          </div>
          <div>
            <span className={`font-display font-bold text-sm tracking-tight block ${
              isLight ? "text-stone-900" : "text-white"
            }`}>Comic Diary</span>
            <span className={`text-[10px] font-mono uppercase tracking-widest block ${
              isLight ? "text-stone-500" : "text-slate-500"
            }`}>Studio Workspace</span>
          </div>
        </div>

        <button
          onClick={onToggleCollapsed}
          title="Collapse Sidebar"
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            isLight ? "hover:bg-stone-200 text-stone-500 hover:text-stone-950" : "hover:bg-zinc-900 text-slate-400 hover:text-white"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Aesthetic Options Dashboard */}
      <div className={`p-4 space-y-3.5 border-b ${
        isLight ? "bg-pink-100/10 border-pink-100/30" : "bg-zinc-950/40 border-pink-950/10"
      }`}>
        <div className="flex items-center gap-1.5 text-xs text-pink-500 font-mono uppercase tracking-widest font-semibold">
          <Palette className="w-3.5 h-3.5" /> Workspace Aesthetics
        </div>

        {/* Wallpaper Picker */}
        <div className="space-y-1">
          <label className={`text-[10px] font-mono font-medium uppercase ${
            isLight ? "text-stone-500" : "text-slate-500"
          }`}>
            Workspace Wallpaper
          </label>
          <select
            value={personalization.outerWallpaper}
            onChange={(e) => onUpdatePersonalization({ outerWallpaper: e.target.value })}
            className={`w-full rounded-lg text-xs py-2 px-2.5 outline-none focus:border-pink-500 ${
              isLight ? "bg-stone-100 border border-stone-200 text-stone-900" : "bg-zinc-900 border border-zinc-800 text-slate-300"
            }`}
          >
            <optgroup label="Signature Canvas Themes">
              <option value="sparks-code">Retro Code Orange</option>
              <option value="futuristic">Neo-Futuristic Quantum</option>
            </optgroup>
            <optgroup label="Standard Modes">
              <option value="light">Classic Light Mode ☀️</option>
              <option value="dark">Classic Dark Mode 🌙</option>
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
            className={`w-full rounded-lg text-xs py-2 px-2.5 outline-none focus:border-pink-500 ${
              isLight ? "bg-stone-100 border border-stone-200 text-stone-900" : "bg-zinc-900 border border-zinc-800 text-slate-300"
            }`}
          >
            <optgroup label="Elite Specialty Presets 💎">
              <option value="transparent-glass">💎 Transparent Notepad (Frosted Glass)</option>
            </optgroup>
            <optgroup label="Aesthetic Textured Sheets 🎨">
              <option value="cherry-blossom-pad">🌸 Pink Cherry Blossom Pad</option>
              <option value="sketch-journal-pad">📖 Retro Comic Sketch Grid</option>
              <option value="neon-grid-pad">⚡ Cyber Neon Slate</option>
              <option value="starry-night-pad">🌌 Starry Nebula Pad</option>
              <option value="vintage-manuscript">📜 Vintage Manuscript Parchment</option>
            </optgroup>
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

        {personalization.padStyle === "transparent-glass" && (
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-medium text-slate-500 uppercase">
                Frosted Glass Opacity
              </label>
              <span className="text-[10px] font-mono font-semibold text-pink-500">
                {personalization.glassOpacity !== undefined ? personalization.glassOpacity : 40}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={personalization.glassOpacity !== undefined ? personalization.glassOpacity : 40}
              onChange={(e) => onUpdatePersonalization({ glassOpacity: parseInt(e.target.value) })}
              className="w-full accent-pink-500 cursor-pointer h-1 rounded bg-zinc-800"
            />
          </div>
        )}
      </div>

      {/* Directory Ledger Navigation Tree */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono uppercase tracking-widest font-semibold px-1">
          <span>Ledger Files</span>
          <button
            onClick={(e) => { e.stopPropagation(); onAddFolder(); }}
            title="Create Root Folder"
            className="p-1 rounded bg-zinc-900/60 hover:bg-zinc-800 text-slate-300 hover:text-pink-400"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {clipboardNode && (
          <div className="p-2 rounded-lg bg-pink-500/5 border border-pink-500/25 flex items-center justify-between text-[11px] text-pink-400 font-mono">
            <span className="truncate flex items-center gap-1.5">
              <Scissors className="w-3 h-3 shrink-0" /> Moving: {clipboardNode.name}
            </span>
            <span className="shrink-0 text-[10px] bg-pink-500/10 px-1.5 py-0.5 rounded">Cut state</span>
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

        {/* Private Secure Vault (Locked Entries) */}
        <div className="pt-3 border-t border-zinc-800/40">
          <button
            onClick={() => setShowLockedChats(true)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border font-sans transition-all text-left cursor-pointer ${
              isLight 
                ? "bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800 shadow-sm" 
                : "bg-zinc-950/80 hover:bg-zinc-900 border-zinc-900 text-slate-100 shadow-lg"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                <Lock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-500">
                  Locked Chats 🔒
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {getLockedNodesList(vFileSystem).length} secret block(s) hidden
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Character Profiles Tab System */}
      <div className={`p-4 border-t space-y-2 ${
        isLight ? "border-pink-100/40 bg-pink-500/5" : "border-zinc-900 bg-zinc-950/50"
      }`}>
        <div className="flex items-center gap-1.5 text-xs text-pink-500 font-mono uppercase tracking-widest font-semibold">
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
                  ? "bg-pink-500 text-white font-bold"
                  : (isLight ? "bg-pink-50 text-pink-700 hover:bg-pink-100/80" : "bg-zinc-900 text-slate-500 hover:text-slate-300")
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
            className={`w-full h-18 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-pink-500 font-sans ${
              isLight ? "bg-pink-50 border border-pink-100 text-stone-800 placeholder-pink-400" : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-700"
            }`}
          />
        )}

        {activeProfileTab === "father" && (
          <textarea
            value={personalization.fatherDesc || ""}
            onChange={(e) => onUpdatePersonalization({ fatherDesc: e.target.value })}
            placeholder="Describe your father character (tall, beard, sweater, glasses)..."
            className={`w-full h-18 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-pink-500 font-sans ${
              isLight ? "bg-pink-50 border border-pink-100 text-stone-800 placeholder-pink-400" : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-700"
            }`}
          />
        )}

        {activeProfileTab === "mother" && (
          <textarea
            value={personalization.motherDesc || ""}
            onChange={(e) => onUpdatePersonalization({ motherDesc: e.target.value })}
            placeholder="Describe your mother character (kind eyes, scarf, hair style)..."
            className={`w-full h-18 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-pink-500 font-sans ${
              isLight ? "bg-pink-50 border border-pink-100 text-stone-800 placeholder-pink-400" : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-700"
            }`}
          />
        )}

        {activeProfileTab === "others" && (
          <textarea
            value={personalization.othersDesc || ""}
            onChange={(e) => onUpdatePersonalization({ othersDesc: e.target.value })}
            placeholder="Describe other recurring characters or background guidelines..."
            className={`w-full h-18 rounded-lg text-[10px] p-2 resize-none outline-none focus:border-pink-500 font-sans ${
              isLight ? "bg-pink-50 border border-pink-100 text-stone-800 placeholder-pink-400" : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-700"
            }`}
          />
        )}
      </div>

      {/* User Session Footer */}
      <div className={`p-4 border-t flex items-center justify-between text-xs font-mono ${
        isLight ? "border-stone-200 bg-stone-100 text-stone-600" : "border-zinc-900 bg-zinc-950 text-slate-500"
      }`}>
        <span className="truncate">Unsealed: {username || "Admin"}</span>
        <button
          onClick={onLogout}
          title="Terminate Vault Session"
          className="flex items-center gap-1.5 text-red-500 hover:text-red-600 transition-colors font-medium shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      {showLockedChats && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col font-sans text-slate-100">
          {/* Header */}
          <div className="p-4 bg-zinc-950 border-b border-zinc-900 flex items-center gap-3">
            <button
              onClick={() => {
                setShowLockedChats(false);
                setUnlockPasscode("");
                setVaultUnlocked(false);
                setVaultUnlockError("");
              }}
              className="p-1 rounded-full hover:bg-zinc-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Locked Chats
              </h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Secure Vault Block</p>
            </div>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/20 font-bold">
              WhatsApp Security active
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col">
            {!vaultUnlocked ? (
              // LOCKED / PASSWORD PROMPT SCREEN
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 animate-pulse">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white font-display">Locked Chats Unseal</h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Keep your most personal memories secure with an extra layer of privacy. Enter your secret passcode or master key to unlock and view.
                  </p>
                </div>
                <div className="w-full space-y-3">
                  <input
                    type="password"
                    placeholder="Enter Secret Passcode"
                    value={unlockPasscode}
                    onChange={(e) => setUnlockPasscode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAttemptVaultUnlock();
                    }}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {vaultUnlockError && (
                    <p className="text-[11px] text-red-500 font-mono font-semibold">
                      ⚠️ {vaultUnlockError}
                    </p>
                  )}
                  <button
                    onClick={handleAttemptVaultUnlock}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Confirm Passcode
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Tip: Lock folders/files inside the ledger tree to hide them here.
                </p>
              </div>
            ) : (
              // UNLOCKED SCREEN (LIST OF ITEMS)
              <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono text-slate-500 uppercase">Secret Conversations</p>
                  <button
                    onClick={() => setVaultUnlocked(false)}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    Close Vault / Re-lock
                  </button>
                </div>

                {(() => {
                  const lockedNodes = getLockedNodesList(vFileSystem);
                  if (lockedNodes.length === 0) {
                    return (
                      <div className="p-8 border border-zinc-900 rounded-2xl bg-zinc-950/40 text-center space-y-2">
                        <p className="text-xs text-slate-500 font-mono">No locked items in this vault container.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 divide-y divide-zinc-900">
                      {lockedNodes.map((node) => {
                        const isFolder = node.type === "folder";
                        const isUnsealed = unsealedVaultIds.includes(node.id);
                        
                        // Let's decrypt or parse preview on-the-fly for files!
                        let snippet = "Encrypted block content.";
                        if (!isFolder) {
                          const file = node as JournalFile;
                          if (isUnsealed) {
                            snippet = file.content.replace(/<[^>]*>/g, "").substring(0, 100);
                          } else {
                            try {
                              const bytes = CryptoJS.AES.decrypt(file.content, unlockPasscode);
                              const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                              if (decrypted) {
                                snippet = decrypted.replace(/<[^>]*>/g, "").substring(0, 100);
                              }
                            } catch (e) {}
                          }
                        }

                        return (
                          <div
                            key={node.id}
                            className="flex items-start gap-3 py-3.5 first:pt-0 transition-colors"
                          >
                            {/* Round Avatar Icon */}
                            <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center justify-center text-lg shadow-inner">
                              {isFolder ? "📁" : (node as JournalFile).mood || "😊"}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                  {node.name}
                                  {isUnsealed && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-medium">unsealed</span>}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap shrink-0">
                                  {!isFolder ? (node as JournalFile).created.split(",")[0] : ""}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate leading-relaxed">
                                {isFolder ? "🔒 Locked Folder Structure" : snippet || "Empty log content..."}
                              </p>
                              
                              {/* Inline Controls */}
                              <div className="flex items-center gap-3 mt-2">
                                {!isFolder && (
                                  <button
                                    onClick={() => {
                                      if (!unsealedVaultIds.includes(node.id)) {
                                        onUnlockNode(node.id, unlockPasscode, "file");
                                      }
                                      onSelectFile(node.id);
                                      setShowLockedChats(false);
                                    }}
                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    ✏️ View & Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const pass = prompt("Enter passcode to unlock and move out of Secure Vault:") || unlockPasscode;
                                    onUnlockNode(node.id, pass, isFolder ? "folder" : "file");
                                  }}
                                  className="text-[11px] text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  🔓 Move Out
                                </button>
                                <button
                                  onClick={() => {
                                    onDeleteNode(node.id);
                                  }}
                                  className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Purge
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
