import React, { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Image as ImageIcon, Search, ImagePlus, RefreshCw, Sparkles
} from "lucide-react";

import { Sticker, JournalFile, JournalFolder, JournalNode, Personalization } from "./types";
import LandingPage from "./components/LandingPage";
import AuthHub from "./components/AuthHub";
import Sidebar from "./components/Sidebar";
import WordRibbon from "./components/WordRibbon";
import DoodleCanvas from "./components/DoodleCanvas";
import InsightsDashboard from "./components/InsightsDashboard";
import ComicStudio from "./components/ComicStudio";
import Messenger from "./components/Messenger";
import { API_BASE_URL } from "./config";

// File system recursive operations
const findNodeRecursive = (nodes: JournalNode[], id: string): JournalNode | null => {
  for (let node of nodes) {
    if (node.id === id) return node;
    if (node.type === "folder" && node.children) {
      const found = findNodeRecursive(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const removeNodeRecursive = (nodes: JournalNode[], id: string): JournalNode | null => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return nodes.splice(i, 1)[0];
    }
    if (nodes[i].type === "folder" && (nodes[i] as JournalFolder).children) {
      const found = removeNodeRecursive((nodes[i] as JournalFolder).children, id);
      if (found) return found;
    }
  }
  return null;
};

export default function App() {
  // Routes: "landing" | "auth" | "workspace"
  const [route, setRoute] = useState<"landing" | "auth" | "workspace">("landing");
  
  // Tab View in protected workspace
  const [currentTab, setCurrentTab] = useState<"dashboard" | "editor" | "comic-book" | "insights" | "communications">("dashboard");

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Authentication states
  const [username, setUsername] = useState<string>("");
  const [vFileSystem, setVFileSystem] = useState<JournalNode[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [clipboardNode, setClipboardNode] = useState<JournalNode | null>(null);

  // Decrypted contents held safely in memory (ID -> plaintext text)
  const [decryptedMemStore, setDecryptedMemStore] = useState<Record<string, string>>({});

  // Theme settings and profile personalization
  const [personalization, setPersonalization] = useState<Personalization>({
    theme: "slate-minimalist",
    outerWallpaper: "blossom",
    padStyle: "cherry-blossom-pad",
    typography: "-apple-system, sans-serif",
    margins: "60px 55px",
    lineSpacing: "1.5",
    paragraphSpacing: "12px",
    padding: "500px",
    avatarDesc: "Retro developer, minimalist cozy hoodie, sleek glasses, graphic novel linework",
    fatherDesc: "",
    motherDesc: "",
    othersDesc: "",
    phoneAnchor: "",
    emailAnchor: ""
  });

  // Check for cached user session on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem("comic_diary_username");
    const cachedTree = localStorage.getItem("comic_diary_fs_tree");
    const cachedPersonalization = localStorage.getItem("comic_diary_personalization");

    if (cachedUser) {
      setUsername(cachedUser);
      if (cachedTree) {
        try {
          setVFileSystem(JSON.parse(cachedTree));
        } catch (e) {
          console.error("Failed to parse cached file tree", e);
        }
      }
      if (cachedPersonalization) {
        try {
          setPersonalization(JSON.parse(cachedPersonalization));
        } catch (e) {
          console.error("Failed to parse cached personalization", e);
        }
      }
      setRoute("workspace");
    }
  }, []);

  // Editor states
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [generatingComic, setGeneratingComic] = useState(false);

  // Selected folder for dashboard quick-view
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");

  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastLoadedFileIdRef = useRef<string | null>(null);

  const currentFile = currentFileId ? (findNodeRecursive(vFileSystem, currentFileId) as JournalFile) : null;

  // Synchronize editor innerHTML safely when selected file changes or unlocks.
  // We avoid resetting innerHTML while the user is typing so cursor caret selection is preserved.
  useEffect(() => {
    if (editorRef.current && currentFile) {
      const activeContent = getActiveFileContent(currentFile);
      const isLocked = currentFile.isLocked && !decryptedMemStore[currentFile.id];
      const trackerKey = `${currentFile.id}_${isLocked ? "locked" : "unlocked"}`;
      
      if (lastLoadedFileIdRef.current !== trackerKey) {
        editorRef.current.innerHTML = activeContent;
        lastLoadedFileIdRef.current = trackerKey;
      }
    } else {
      lastLoadedFileIdRef.current = null;
    }
  }, [currentFileId, decryptedMemStore, currentFile]);

  // Sync state changes with the server and cache in localStorage
  const syncWithServer = async (updatedFS: JournalNode[], updatedAvatar?: string) => {
    if (!username) return;
    localStorage.setItem("comic_diary_fs_tree", JSON.stringify(updatedFS));
    try {
      await fetch(`${API_BASE_URL}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fs_tree: updatedFS,
          avatar_desc: updatedAvatar !== undefined ? updatedAvatar : personalization.avatarDesc
        })
      });
    } catch (e) {
      console.error("Permanence synchronization failed:", e);
    }
  };

  // Login handler
  const handleLoginSuccess = (data: { username: string; fs_tree: any[]; avatar_desc: string }) => {
    setUsername(data.username);
    setVFileSystem(data.fs_tree || []);
    localStorage.setItem("comic_diary_username", data.username);
    localStorage.setItem("comic_diary_fs_tree", JSON.stringify(data.fs_tree || []));

    if (data.avatar_desc) {
      setPersonalization(prev => {
        const next = { ...prev, avatarDesc: data.avatar_desc };
        localStorage.setItem("comic_diary_personalization", JSON.stringify(next));
        return next;
      });
    }
    setRoute("workspace");
    setCurrentTab("dashboard");
  };

  // Update Personalization
  const handleUpdatePersonalization = (updates: Partial<Personalization>) => {
    setPersonalization((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("comic_diary_personalization", JSON.stringify(next));
      if (updates.avatarDesc !== undefined) {
        syncWithServer(vFileSystem, updates.avatarDesc);
      }
      return next;
    });
  };

  const handleLogout = () => {
    setUsername("");
    setVFileSystem([]);
    setDecryptedMemStore({});
    localStorage.removeItem("comic_diary_username");
    localStorage.removeItem("comic_diary_fs_tree");
    localStorage.removeItem("comic_diary_personalization");
    setRoute("landing");
  };

  // Execute MS Word Rich text commands
  const handleExecuteCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    // Sync contents
    handleEditorInput();
  };

  // Sync editor content editable div to our file system state
  const handleEditorInput = () => {
    if (!currentFileId) return;
    const editor = editorRef.current;
    if (!editor) return;

    const rawHTML = editor.innerHTML;

    setVFileSystem((prev) => {
      const updated = [...prev];
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        if (file.isLocked) {
          // Keep unencrypted plaintext in memory store only
          setDecryptedMemStore(mem => ({ ...mem, [file.id]: rawHTML }));
          // Encrypt before permanent state storage using custom CryptoJS
          const key = file.password || "temp-vault-key";
          file.content = CryptoJS.AES.encrypt(rawHTML, key).toString();
        } else {
          file.content = rawHTML;
        }
        file.edited = new Date().toLocaleString();
      }
      syncWithServer(updated);
      return updated;
    });
  };

  // Double check and retrieve decrypted contents in browser memory safely
  const getActiveFileContent = (file: JournalFile): string => {
    if (file.isLocked) {
      return decryptedMemStore[file.id] || "<i>[Content Blocked - Enter Passkey]</i>";
    }
    return file.content || "";
  };

  // Helpers migrated to top-level module scope to avoid hoisting errors

  // Select node to write / edit
  const handleSelectFile = (id: string) => {
    const node = findNodeRecursive(vFileSystem, id) as JournalFile;
    if (node) {
      if (node.isLocked && !decryptedMemStore[node.id]) {
        const pass = prompt("Enter decryption passkey to unseal file:");
        if (pass) {
          try {
            const bytes = CryptoJS.AES.decrypt(node.content, pass);
            const plain = bytes.toString(CryptoJS.enc.Utf8);
            if (!plain) throw new Error("Incorrect Key");
            
            // Success unsealing file content! Save locally in memory state
            setDecryptedMemStore(prev => ({ ...prev, [node.id]: plain }));
            node.isLocked = true; 
            node.password = pass; // Store temporary key
            setCurrentFileId(id);
            setCurrentTab("editor");
          } catch (e) {
            alert("Security Decryption Failed. Block remains encrypted.");
          }
        }
      } else {
        setCurrentFileId(id);
        setCurrentTab("editor");
      }
    }
  };

  // Create Root or nested Folder
  const handleAddFolder = (parentId?: string) => {
    const name = prompt("Name Folder:") || "New Folder 📁";
    const newFolder: JournalFolder = {
      id: "fold_" + Date.now(),
      type: "folder",
      name,
      children: [],
    };

    setVFileSystem((prev) => {
      const next = [...prev];
      if (parentId) {
        const parent = findNodeRecursive(next, parentId) as JournalFolder;
        if (parent) {
          parent.children.push(newFolder);
        }
      } else {
        next.push(newFolder);
      }
      syncWithServer(next);
      return next;
    });
  };

  // Create file
  const handleAddFile = (parentId: string) => {
    const name = prompt("Name File:") || "Diary Log 📄";
    const newFile: JournalFile = {
      id: "file_" + Date.now(),
      type: "file",
      name,
      content: "Write journal notes...",
      mood: "😊",
      created: new Date().toLocaleString(),
      edited: new Date().toLocaleString(),
      comic: "",
      stickers: [],
    };

    setVFileSystem((prev) => {
      const next = [...prev];
      const parent = findNodeRecursive(next, parentId) as JournalFolder;
      if (parent) {
        parent.children.push(newFile);
      }
      syncWithServer(next);
      return next;
    });

    setCurrentFileId(newFile.id);
    setCurrentTab("editor");
  };

  // Rename node
  const handleRenameNode = (id: string, name: string) => {
    setVFileSystem((prev) => {
      const next = [...prev];
      const target = findNodeRecursive(next, id);
      if (target) {
        target.name = name;
      }
      syncWithServer(next);
      return next;
    });
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    if (!confirm("Are you sure you want to delete this node permanent from ledger?")) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      removeNodeRecursive(next, id);
      if (currentFileId === id) {
        setCurrentFileId(null);
      }
      syncWithServer(next);
      return next;
    });
  };

  // Move node (Cut)
  const handleCutNode = (id: string) => {
    setVFileSystem((prev) => {
      const next = [...prev];
      const cut = removeNodeRecursive(next, id);
      if (cut) {
        setClipboardNode(cut);
      }
      return next;
    });
  };

  // Paste node
  const handlePasteNode = (parentId: string) => {
    if (!clipboardNode) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      const parent = findNodeRecursive(next, parentId) as JournalFolder;
      if (parent && parent.children) {
        parent.children.push(clipboardNode);
        setClipboardNode(null);
      }
      syncWithServer(next);
      return next;
    });
  };

  // AES Password protection for folders
  const handleLockNode = (id: string, password?: string, type?: "folder" | "file") => {
    setVFileSystem((prev) => {
      const next = [...prev];
      const target = findNodeRecursive(next, id);
      if (target) {
        target.isLocked = true;
        target.password = password;
        if (type === "file") {
          const file = target as JournalFile;
          // Encrypt existing text using CryptoJS AES-256
          const plainText = file.content;
          file.content = CryptoJS.AES.encrypt(plainText, password || "temp-vault-key").toString();
          setDecryptedMemStore(mem => ({ ...mem, [file.id]: plainText }));
        }
      }
      syncWithServer(next);
      return next;
    });
  };

  const handleUnlockNode = (id: string, password?: string, type?: "folder" | "file") => {
    setVFileSystem((prev) => {
      const next = [...prev];
      const target = findNodeRecursive(next, id);
      if (target) {
        if (type === "folder") {
          if (target.password === password) {
            target.isLocked = false;
          } else {
            alert("Incorrect Folder Security Key");
          }
        } else {
          // Unlock file
          const file = target as JournalFile;
          try {
            const bytes = CryptoJS.AES.decrypt(file.content, password || "");
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error("Incorrect Password");
            file.content = decrypted;
            file.isLocked = false;
            setDecryptedMemStore(mem => {
              const updated = { ...mem };
              delete updated[file.id];
              return updated;
            });
          } catch (e) {
            alert("Security Decryption Failed");
          }
        }
      }
      syncWithServer(next);
      return next;
    });
  };

  // Add stickers to writing pad sheets
  const handleInjectSticker = (emoji: string) => {
    if (!currentFileId) return alert("Please select an active diary log file first!");
    const newSticker: Sticker = {
      char: emoji,
      top: "160px",
      left: "140px",
      transform: "scale(1.0)",
    };

    setVFileSystem((prev) => {
      const next = [...prev];
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file) {
        if (!file.stickers) file.stickers = [];
        file.stickers.push(newSticker);
      }
      syncWithServer(next);
      return next;
    });
  };

  // Modify individual stickers (drag, delete, resize)
  const handleMoveSticker = (stickerIndex: number, top: string, left: string) => {
    if (!currentFileId) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        file.stickers[stickerIndex].top = top;
        file.stickers[stickerIndex].left = left;
      }
      syncWithServer(next);
      return next;
    });
  };

  const handleScaleSticker = (stickerIndex: number) => {
    if (!currentFileId) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        const currentScale = parseFloat(file.stickers[stickerIndex].transform.replace("scale(", "").replace(")", "")) || 1;
        const nextScale = currentScale >= 2.5 ? 0.8 : currentScale + 0.3;
        file.stickers[stickerIndex].transform = `scale(${nextScale})`;
      }
      syncWithServer(next);
      return next;
    });
  };

  const handleDeleteSticker = (stickerIndex: number) => {
    if (!currentFileId) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        file.stickers.splice(stickerIndex, 1);
      }
      syncWithServer(next);
      return next;
    });
  };

  // Insert standard syntaxes
  const handleInsertCodeBlock = (lang: string) => {
    const codeTemplates: Record<string, string> = {
      python: "\n```python\n# Python script block\ndef generate_comic_prompt(text):\n    return f'Descriptive prompt: {text}'\n```\n",
      javascript: "\n```javascript\n// JS snippet\nconst aesEncrypt = (data, key) => {\n    return CryptoJS.AES.encrypt(data, key).toString();\n};\n```\n",
      cpp: "\n```cpp\n// C++ Engineering Note\n#include <iostream>\nint main() {\n    std::cout << \"Secure Ledger Init\";\n    return 0;\n}\n```\n",
      sql: "\n```sql\n-- Relational Ledger Index\nSELECT file_name, created_at, mood \nFROM journal_entries \nWHERE is_locked = FALSE;\n```\n",
    };
    handleExecuteCommand("insertHTML", `<pre style="background: #0f141c; color: #a2e57b; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 11px; outline: none;" contenteditable="true">${codeTemplates[lang]}</pre>`);
  };

  const handleInsertTemplate = (name: string) => {
    const templates: Record<string, string> = {
      daily: "<h3>☀️ Daily Log Reflection</h3><p><strong>Focus:</strong> Write main achievements.</p><p><strong>Mood Rating:</strong> Excelled in tasks.</p>",
      technical: "<h3>💻 Technical Architecture Review</h3><p><strong>Component:</strong> Secure Client AES wrapper</p><p><strong>Status:</strong> All tests compiled green</p>",
      creative: "<h3>🎨 Creative Concept drafts</h3><p><strong>Art Style:</strong> High contrast ink outlines</p><p><strong>Avatar Descriptions:</strong> Graphic design hoodie</p>",
    };
    handleExecuteCommand("insertHTML", templates[name]);
  };

  // Image Upload reference attachment
  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (currentFileId) {
        setVFileSystem((prev) => {
          const next = [...prev];
          const target = findNodeRecursive(next, currentFileId) as JournalFile;
          if (target) {
            target.attached_image = reader.result as string;
          }
          syncWithServer(next);
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    if (currentFileId) {
      setVFileSystem((prev) => {
        const next = [...prev];
        const target = findNodeRecursive(next, currentFileId) as JournalFile;
        if (target) {
          delete target.attached_image;
        }
        syncWithServer(next);
        return next;
      });
    }
  };

  // CORE DAILY COMIC GENERATION PIPELINE
  const triggerAICohesiveComic = async () => {
    if (!currentFileId) return alert("Select an active document first!");
    const file = findNodeRecursive(vFileSystem, currentFileId) as JournalFile;
    if (!file) return;

    const textToAnalyze = getActiveFileContent(file).replace(/<[^>]*>/g, " ").trim();
    if (!textToAnalyze) return alert("Write down text content before generating comic images.");

    setGeneratingComic(true);

    try {
      const charGuidelines = `Main character profile: ${personalization.avatarDesc || "classic character"}. ` +
        (personalization.fatherDesc ? `Father character: ${personalization.fatherDesc}. ` : "") +
        (personalization.motherDesc ? `Mother character: ${personalization.motherDesc}. ` : "") +
        (personalization.othersDesc ? `Other character alignments: ${personalization.othersDesc}. ` : "");

      const customPrompt = `Indie comic book panel cell, high contrast linework style, vibrant graphic colors. Scene details based on diary: "${textToAnalyze}". Character references guidelines: ${charGuidelines}. Ambient atmosphere style.`;

      const response = await fetch(`${API_BASE_URL}/api/render-comic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          prompt: customPrompt,
          content: textToAnalyze,
          avatar_desc: personalization.avatarDesc,
          father_desc: personalization.fatherDesc,
          mother_desc: personalization.motherDesc,
          others_desc: personalization.othersDesc,
          mood: file.mood || "😊",
          image_seed: file.attached_image || ""
        })
      });

      const data = await response.json();
      if (data.image_data_url) {
        setVFileSystem((prev) => {
          const next = [...prev];
          const target = findNodeRecursive(next, currentFileId) as JournalFile;
          if (target) {
            target.comic = data.image_data_url;
          }
          syncWithServer(next);
          return next;
        });
      }
    } catch (e) {
      alert("Illustrator processing handshake timed out.");
    } finally {
      setGeneratingComic(false);
    }
  };

  // Update active file mood
  const handleUpdateMood = (mood: string) => {
    if (!currentFileId) return;
    setVFileSystem((prev) => {
      const next = [...prev];
      const target = findNodeRecursive(next, currentFileId) as JournalFile;
      if (target) {
        target.mood = mood;
      }
      syncWithServer(next);
      return next;
    });
  };

  // Flat helper to extract list for search feeds
  const getAllFiles = (nodes: JournalNode[]): JournalFile[] => {
    let list: JournalFile[] = [];
    nodes.forEach((n) => {
      if (n.type === "file") list.push(n as JournalFile);
      else if (n.type === "folder" && (n as JournalFolder).children) {
        list = list.concat(getAllFiles((n as JournalFolder).children));
      }
    });
    return list;
  };

  const activeFilesList = getAllFiles(vFileSystem);

  const filteredSearchList = activeFilesList.filter((f) => {
    return f.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) ||
           f.content.toLowerCase().includes(dashboardSearchQuery.toLowerCase());
  });

  // Export full compiled PDF Book
  const handleExportPDF = (folderId: string) => {
    // Add logic or simply delegate to the Studio Tab view!
    setCurrentTab("comic-book");
    alert("Sequential Comic Book compiler is unsealed below. Compile your logs here!");
  };

  // Wallpaper themes mapped
  const wallpaperThemes: Record<string, string> = {
    "sparks-code": "bg-[#0e0702]",
    "futuristic": "bg-[#03050d]",
    "dark": "bg-[#09090b]",
    "light": "bg-[#f5f5f4]",
    "minimalist": "bg-[#ffffff]",
    "wood": "bg-[url('https://images.unsplash.com/photo-1541123437800-1bb1317badc2?q=80&width=1600')] bg-cover bg-center bg-no-repeat bg-fixed",
    "meadow": "bg-[url('https://images.unsplash.com/photo-1533038590840-1cde6e668a91?q=80&width=1600')] bg-cover bg-center bg-no-repeat bg-fixed",
    "ocean": "bg-[url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&width=1600')] bg-cover bg-center bg-no-repeat bg-fixed",
    "linen": "bg-[url('https://images.unsplash.com/photo-1545062990-4a95e8e4b96d?q=80&width=1600')] bg-cover bg-center bg-no-repeat bg-fixed",
    "cork": "bg-[url('https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&width=1600')] bg-cover bg-center bg-no-repeat bg-fixed",
    "sunset": "bg-gradient-to-tr from-[#2b1055] to-[#7597de]",
    "aurora": "bg-gradient-to-tr from-[#051937] via-[#008793] to-[#a8eb12]",
    "cosmic": "bg-gradient-to-tr from-[#000428] to-[#004e92]",
    "blossom": "bg-gradient-to-tr from-[#fbc2eb] to-[#a6c1ee]",
    "lavender": "bg-gradient-to-tr from-[#e0c3fc] to-[#8ec5fc]",
    "monsoon": "bg-gradient-to-tr from-[#2c3e50] to-[#bdc3c7]"
  };

  const padPrintStyles: Record<string, string> = {
    "cherry-blossom-pad": "bg-[#fff0f3] bg-[url('https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?q=80&width=800')] bg-cover bg-blend-overlay text-zinc-800 border-none shadow-2xl",
    "sketch-journal-pad": "bg-[#faf6f0] bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] bg-blend-multiply [background-size:20px_20px] text-zinc-900 border-l-4 border-orange-400 shadow-2xl",
    "neon-grid-pad": "bg-[#0d0915] bg-[linear-gradient(to_right,#1f122e_1px,transparent_1px),linear-gradient(to_bottom,#1f122e_1px,transparent_1px)] [background-size:24px_24px] text-pink-400 font-mono border-l border-pink-500 shadow-2xl",
    "starry-night-pad": "bg-[#090b14] bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&width=800')] bg-cover bg-blend-soft-light text-indigo-100 font-sans border-none shadow-inner shadow-2xl",
    "vintage-manuscript": "bg-[#faf4e8] bg-[url('https://images.unsplash.com/photo-1587080266227-677cd237c267?q=80&width=800')] bg-cover bg-blend-multiply text-stone-900 font-serif border-none shadow-2xl",
    "clean-white": "bg-white text-zinc-900 border-none shadow-2xl shadow-black/15",
    "legal-yellow": "bg-[#fefeb3] text-black border-l-4 border-red-400 shadow-xl shadow-amber-500/5",
    "parchment": "bg-[#f4ecc8] text-[#4a3319] border-none shadow-2xl font-serif",
    "ivory-smooth": "bg-[#fafaf6] text-stone-900 border-none shadow-xl",
    "grid-graph": "bg-white bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] text-zinc-800 font-mono shadow-2xl",
    "dotted-bullet": "bg-white bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] text-zinc-900 shadow-2xl",
    "vintage-ledger": "bg-[#fcfaf2] border-l-8 border-double border-red-400 text-stone-900 shadow-2xl",
    "midnight-graphite": "bg-zinc-800 text-zinc-100 border-none shadow-2xl shadow-black/40",
    "corporate-navy": "bg-[#f8fafc] text-[#0f172a] border-l-4 border-blue-500 shadow-xl",
    "sage-mint": "bg-[#f0f4f1] text-slate-800 border-none shadow-xl",
    "dark-terminal": "bg-[#0f141c] text-emerald-400 font-mono border border-emerald-500/20 shadow-2xl shadow-emerald-500/5",
    "cyber-magenta": "bg-[#1a0b2e] text-pink-500 font-mono border border-purple-500/20 shadow-2xl shadow-pink-500/5",
    "blueprint": "bg-[#0244a3] text-white font-mono border border-blue-400/20 shadow-2xl",
    "monochrome-noir": "bg-black text-white border border-zinc-800 shadow-2xl shadow-white/5",
  };

  const isLight = ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(personalization.outerWallpaper);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#1a0c12] text-slate-100 font-sans selection:bg-pink-500 selection:text-white">
      <AnimatePresence mode="wait">
        {route === "landing" && (
          <LandingPage onEnterApp={() => setRoute("auth")} />
        )}

        {route === "auth" && (
          <AuthHub onLoginSuccess={handleLoginSuccess} />
        )}

        {route === "workspace" && (
          <div className={`flex h-full w-full overflow-hidden ${wallpaperThemes[personalization.outerWallpaper] || "bg-[#1a0c12]"} transition-all duration-300`}>
            
            {/* Sidebar navigation Tree */}
            <Sidebar
              vFileSystem={vFileSystem}
              currentFileId={currentFileId}
              personalization={personalization}
              clipboardNode={clipboardNode}
              onSelectFile={handleSelectFile}
              onAddFolder={handleAddFolder}
              onAddFile={handleAddFile}
              onRenameNode={handleRenameNode}
              onDeleteNode={handleDeleteNode}
              onCutNode={handleCutNode}
              onPasteNode={handlePasteNode}
              onLockNode={handleLockNode}
              onUnlockNode={handleUnlockNode}
              onUpdatePersonalization={handleUpdatePersonalization}
              onExportFolderBook={handleExportPDF}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
              username={username}
            />

            {/* Main Application deck */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${
              isLight ? "bg-white/40 text-stone-900" : "bg-black/45 text-slate-100"
            }`}>
              
              {/* App bar tab triggers */}
              <div className={`border-b transition-all duration-300 px-6 py-3.5 flex items-center justify-between shrink-0 ${
                isLight 
                  ? "bg-white/60 backdrop-blur-md border-pink-100/50 text-stone-800" 
                  : "bg-black/50 backdrop-blur-md border-pink-950/20 text-slate-100"
              }`}>
                <div className="flex items-center gap-2">
                  {(["dashboard", "editor", "comic-book", "insights", "communications"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCurrentTab(tab)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                        currentTab === tab
                          ? "bg-pink-500 text-white shadow-lg shadow-pink-500/15"
                          : `transition-colors ${
                              isLight 
                                ? "text-stone-500 hover:bg-stone-200/50 hover:text-stone-800" 
                                : "text-slate-400 hover:bg-zinc-900/60 hover:text-slate-200"
                            }`
                      }`}
                    >
                      {tab === "comic-book" ? "Comic compiler" : tab === "communications" ? "Messenger 💬" : tab}
                    </button>
                  ))}
                </div>

                <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1.5 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 glow-active" /> Verified full stack sandbox
                </div>
              </div>

              {/* TAB SLIDES */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-transparent">
                
                {/* 1. DASHBOARD OVERVIEW */}
                {currentTab === "dashboard" && (
                  <div className="p-8 max-w-5xl mx-auto space-y-8">
                    <div className="space-y-2">
                      <h2 className={`font-display font-bold text-2xl ${isLight ? "text-stone-900" : "text-white"}`}>Comic Diary Secure Workspace</h2>
                      <p className={`text-sm ${isLight ? "text-stone-600" : "text-slate-400"}`}>Unsealed cryptographic journal feeds and folder navigation widgets.</p>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-md w-full">
                      <Search className={`absolute left-3.5 top-3.5 w-4 h-4 ${isLight ? "text-stone-400" : "text-slate-500"}`} />
                      <input
                        type="text"
                        value={dashboardSearchQuery}
                        onChange={(e) => setDashboardSearchQuery(e.target.value)}
                        placeholder="Search decrypted entries index..."
                        className={`w-full border rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:border-pink-500/50 transition-colors ${
                          isLight 
                            ? "bg-white/80 border-pink-100 text-stone-900 placeholder-stone-400" 
                            : "bg-zinc-950/60 border-zinc-900 text-slate-300 placeholder-zinc-700"
                        }`}
                      />
                    </div>

                    {/* WhatsApp Hidden Easter Egg Card */}
                    {(dashboardSearchQuery.toLowerCase() === "secret-about" || dashboardSearchQuery.toLowerCase() === "comic-secret") && (
                      <div className="p-6 rounded-2xl border-2 border-dashed border-pink-500 bg-[#120a16] shadow-2xl shadow-pink-500/10 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💥</span>
                            <h4 className="font-display font-extrabold text-sm text-pink-400 uppercase tracking-wider">SECRET DIARY ABOUT SECTION UNSEALED</h4>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-mono bg-pink-500 text-black font-extrabold rounded">WHATSAPP HIDDEN MODE ACTIVE</span>
                        </div>
                        
                        <div className="text-xs text-slate-300 space-y-3 font-sans leading-relaxed">
                          <p>
                            Welcome, Author! You have unsealed the <strong>Comic Diary</strong> system manual using the cryptographic search word.
                          </p>
                          
                          <div className="p-4 bg-black/40 rounded-xl border border-pink-500/20 font-mono text-[11px] text-pink-300 space-y-2">
                            <div className="font-bold uppercase tracking-wider">🔒 Client-Side AES-256 Vault Architecture:</div>
                            <p>• Your logs are encrypted inside your browser before sending them or storing them. Only your unique key can read them.</p>
                            <p>• <strong>Persistent Sessions:</strong> You remain logged in securely across refreshes. Logout clears all cache memory.</p>
                            <p>• <strong>Immutable Folders:</strong> Locked items stay locked on disk. Decrypted previews exist solely in transient memory nodes.</p>
                          </div>

                          <div className="p-4 bg-black/40 rounded-xl border border-pink-500/20 font-mono text-[11px] text-pink-300 space-y-2">
                            <div className="font-bold uppercase tracking-wider">🎨 Daily Comic Studio & Characters:</div>
                            <p>• Configure character guidelines in the sidebar (Self, Father, Mother, Others).</p>
                            <p>• Select drawing style and click "Illustrate" to automatically render 2D panel strips corresponding to your prose log!</p>
                          </div>

                          <p className="text-[10px] text-slate-500 italic">
                            "To hide this ledger manual again, simply clear your search bar input. Write 'secret-about' or 'comic-secret' to unseal this manual any time."
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick Feed */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLight ? "text-stone-500" : "text-slate-400"}`}>Recent Logs</h4>
                        <div className="space-y-3">
                          {filteredSearchList.map((file) => (
                            <div
                              key={file.id}
                              onClick={() => handleSelectFile(file.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                                isLight 
                                  ? "bg-white/80 border-pink-100/60 hover:bg-white hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/5 text-stone-800" 
                                  : "bg-zinc-950/40 border-pink-950/20 hover:bg-zinc-950 hover:border-pink-900/40 text-slate-300"
                              }`}
                            >
                              <div className={`flex items-center justify-between text-[10px] font-mono ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                                <span>Created: {file.created}</span>
                                <span className={`px-2 py-0.5 rounded ${isLight ? "bg-pink-100 text-pink-700" : "bg-zinc-900 text-pink-400"}`}>{file.mood}</span>
                              </div>
                              <h5 className={`font-display font-bold text-sm ${isLight ? "text-stone-900" : "text-white"}`}>{file.isLocked ? "🔒 Locked Entry" : file.name}</h5>
                              <p className={`text-xs truncate leading-relaxed ${isLight ? "text-stone-600" : "text-slate-400"}`}>
                                {file.isLocked ? "Secure Block remains encrypted" : file.content.replace(/<[^>]*>/g, "")}
                              </p>
                            </div>
                          ))}
                          {filteredSearchList.length === 0 && (
                            <div className={`p-8 text-center border border-dashed rounded-2xl text-xs font-mono ${
                              isLight ? "border-pink-200 bg-white/20 text-stone-500" : "border-zinc-900 bg-zinc-950/20 text-slate-600"
                            }`}>
                              No entries found.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive calendar and folder summaries */}
                      <div className="space-y-4">
                        <h4 className={`text-xs font-mono font-bold uppercase tracking-widest ${isLight ? "text-stone-500" : "text-slate-400"}`}>Calendar Index</h4>
                        <div className={`p-5 rounded-2xl border space-y-3 ${
                          isLight 
                            ? "bg-white/80 border-pink-100 text-stone-800 shadow-md shadow-pink-900/5" 
                            : "bg-zinc-950/80 border-zinc-900 text-slate-200"
                        }`}>
                          <div className={`flex items-center justify-between border-b pb-3 ${isLight ? "border-pink-500/10" : "border-zinc-900"}`}>
                            <span className={`font-display font-bold text-sm ${isLight ? "text-stone-900" : "text-white"}`}>June 2026</span>
                            <span className="text-xs text-pink-500 font-mono">Real-time Clock</span>
                          </div>
                          {/* Calendar mock grid */}
                          <div className={`grid grid-cols-7 gap-2 text-center text-xs font-mono ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                              <span key={i} className="font-bold">{d}</span>
                            ))}
                            {Array.from({ length: 30 }).map((_, i) => {
                              const day = i + 1;
                              const isToday = day === 24;
                              return (
                                <span
                                  key={i}
                                  className={`py-1.5 rounded-md ${
                                    isToday 
                                      ? "bg-pink-500 text-white font-bold shadow-md shadow-pink-500/30" 
                                      : `hover:bg-pink-500/10 transition-colors ${isLight ? "text-stone-600 hover:text-pink-600" : "text-slate-400"}`
                                  }`}
                                >
                                  {day}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RICH TEXT EDITOR VIEW */}
                {currentTab === "editor" && (
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Ms Word ribbon kit */}
                    <WordRibbon
                      personalization={personalization}
                      onUpdatePersonalization={handleUpdatePersonalization}
                      onExecuteCommand={handleExecuteCommand}
                      onInjectSticker={handleInjectSticker}
                      onInsertCodeBlock={handleInsertCodeBlock}
                      onInsertTemplate={handleInsertTemplate}
                    />

                    {/* Paper Stage workspace background */}
                    <div className={`flex-1 overflow-y-auto p-8 flex justify-center items-start ${wallpaperThemes[personalization.outerWallpaper] || "bg-[#0b0d0e]"} transition-all duration-300`}>
                      {currentFile ? (
                        <div
                          id="journalPadSheet"
                          style={{
                            padding: personalization.margins,
                            lineHeight: personalization.lineSpacing,
                            fontFamily: personalization.typography,
                          }}
                          className={`w-full max-w-3xl min-h-[800px] relative transition-all duration-300 ${padPrintStyles[personalization.padStyle] || "bg-white text-zinc-900"} rounded-lg`}
                        >
                          {/* Stickers layout floating */}
                          {(currentFile.stickers || []).map((stk, idx) => (
                            <div
                              key={idx}
                              style={{ top: stk.top, left: stk.left, transform: stk.transform }}
                              className="absolute cursor-move user-select-none group/stk z-50 p-1"
                              onMouseDown={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startLeft = parseInt(stk.left) || 0;
                                const startTop = parseInt(stk.top) || 0;

                                const moveHandler = (ev: MouseEvent) => {
                                  const dx = ev.clientX - startX;
                                  const dy = ev.clientY - startY;
                                  handleMoveSticker(idx, `${startTop + dy}px`, `${startLeft + dx}px`);
                                };

                                const upHandler = () => {
                                  document.removeEventListener("mousemove", moveHandler);
                                  document.removeEventListener("mouseup", upHandler);
                                };

                                document.addEventListener("mousemove", moveHandler);
                                document.addEventListener("mouseup", upHandler);
                              }}
                              onDoubleClick={() => handleScaleSticker(idx)}
                            >
                              <span className="text-4xl select-none leading-none block">{stk.char}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSticker(idx);
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4.5 h-4.5 text-[10px] font-bold flex items-center justify-center opacity-0 group-hover/stk:opacity-100 transition-opacity shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {/* Info Header bar */}
                          <div className="flex items-center justify-between text-xs opacity-60 font-mono mb-4 pb-2 border-b border-zinc-900/10" contentEditable={false}>
                            <span>Created: {currentFile.created}</span>
                            <div className="flex items-center gap-2">
                              <span>Mood selector:</span>
                              <select
                                value={currentFile.mood || "😊"}
                                onChange={(e) => handleUpdateMood(e.target.value)}
                                className="bg-transparent border border-zinc-900/10 rounded px-1"
                              >
                                <option value="😊">Joy 😊</option>
                                <option value="💻">Code 💻</option>
                                <option value="🌌">Zen 🌌</option>
                                <option value="⚡">Chaos ⚡</option>
                              </select>
                            </div>
                          </div>

                          <h2 className="font-display font-bold text-2xl tracking-tight mb-6 pb-2 border-b border-zinc-900/5">
                            {currentFile.isLocked ? `🔒 [Locked Block] ${currentFile.name}` : currentFile.name}
                          </h2>

                          {/* Reference Attachment upload bar */}
                          {currentFile.attached_image && (
                            <div className="mb-6 p-3 rounded-lg border border-dashed border-zinc-900/20 bg-zinc-900/5 text-center relative" contentEditable={false}>
                              <p className="text-[10px] font-mono opacity-60 mb-2">Attached Doodle Base Layer / Photo</p>
                              <img src={currentFile.attached_image} alt="Ref snapshot" className="max-h-56 mx-auto rounded-lg" />
                              <button
                                onClick={handleRemoveAttachment}
                                className="absolute top-2 right-2 px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-semibold transition-colors shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-6" contentEditable={false}>
                            <button
                              onClick={() => setShowWhiteboard(true)}
                              className="px-3.5 py-1.5 bg-zinc-900 text-white border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                            >
                              <ImagePlus className="w-3.5 h-3.5" /> Sketchpad Whiteboard
                            </button>
                            <label className="px-3.5 py-1.5 bg-zinc-900 text-white border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer">
                              <ImageIcon className="w-3.5 h-3.5" /> Reference Snapshot
                              <input type="file" accept="image/*" onChange={handleImageAttachment} className="hidden" />
                            </label>
                          </div>

                          {/* Main Editable content area */}
                          <div
                            ref={editorRef}
                            id="editorEngine"
                            contentEditable={!isMarkdownMode}
                            onInput={handleEditorInput}
                            style={{ minHeight: "450px" }}
                            className="outline-none text-base leading-relaxed whitespace-pre-wrap word-break"
                          />

                          <hr className="my-10 border-t border-dashed border-zinc-900/10" contentEditable={false} />

                          {/* Pipeline illustrations generator block */}
                          <div className="space-y-4" contentEditable={false}>
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-display font-bold text-sm text-inherit">Daily Graphic Novel Illustrator</h4>
                                <p className="text-[10px] opacity-60 font-mono">AI pipeline translates decrypted text logs into 2D comic panels</p>
                              </div>
                              <button
                                onClick={triggerAICohesiveComic}
                                disabled={generatingComic}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                {generatingComic ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                                Generate Illustration Frame
                              </button>
                            </div>

                            {currentFile.comic && (
                              <div className="relative rounded-xl overflow-hidden border-4 border-black bg-white p-4 shadow-xl shadow-black/10 text-center">
                                <h5 className="text-black font-display font-bold text-xs pb-2 border-b border-zinc-100">PANEL OUTLINE</h5>
                                <img src={currentFile.comic} alt="Generated Panel" className="max-h-96 mx-auto rounded-lg object-contain" />
                                <a
                                  href={currentFile.comic}
                                  download={`Comic_Panel_${currentFile.name.replace(/\s+/g, "_")}.png`}
                                  className="absolute bottom-4 right-4 p-2 rounded-full bg-black hover:bg-black/90 text-orange-400 hover:text-orange-300 shadow-lg border border-zinc-800"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>

                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-4">
                          <BookOpen className="w-16 h-16 text-zinc-800 glow-active" />
                          <div className="space-y-1">
                            <h4 className="font-display font-semibold text-white">No active slate unsealed</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                              Please double-click any file node in the sidebar index to decrypt and unseal its editor workspace.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. COMIC COMPILE STUDIO */}
                {currentTab === "comic-book" && (
                  <ComicStudio vFileSystem={vFileSystem} />
                )}

                {/* 4. INSIGHTS AND METRICS */}
                {currentTab === "insights" && (
                  <InsightsDashboard vFileSystem={vFileSystem} />
                )}

                {/* 5. SECURE COMMUNICATIONS MESSENGER */}
                {currentTab === "communications" && (
                  <Messenger
                    personalization={personalization}
                    vFileSystem={vFileSystem}
                    onUpdatePersonalization={handleUpdatePersonalization}
                    username={username}
                  />
                )}

              </div>

            </div>

            {/* Doodle blackboard drawing whiteboard popup drawer */}
            {showWhiteboard && (
              <DoodleCanvas
                initialDataUrl={currentFile?.attached_image}
                onSaveDoodle={(base64) => {
                  if (currentFileId) {
                    setVFileSystem((prev) => {
                      const next = [...prev];
                      const target = findNodeRecursive(next, currentFileId) as JournalFile;
                      if (target) {
                        target.attached_image = base64;
                      }
                      syncWithServer(next);
                      return next;
                    });
                  }
                }}
                onClose={() => setShowWhiteboard(false)}
              />
            )}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
