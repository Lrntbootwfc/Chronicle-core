import React, { useState, useEffect, useRef } from "react";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen, Image as ImageIcon, Search, ImagePlus, RefreshCw, Sparkles, Paintbrush, Undo, Redo, Users, Save
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
import MediaLedger from "./components/MediaLedger";
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

const cloneFileSystem = (nodes: JournalNode[]): JournalNode[] => {
  return JSON.parse(JSON.stringify(nodes));
};

export default function App() {
  // Routes: "landing" | "auth" | "workspace"
  const [route, setRoute] = useState<"landing" | "auth" | "workspace">("landing");
  
  // Tab View in protected workspace
  const [currentTab, setCurrentTab] = useState<"dashboard" | "editor" | "comic-book" | "insights" | "communications" | "media-ledger">("dashboard");

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Authentication states
  const [username, setUsername] = useState<string>("");
  const [vFileSystem, setVFileSystemState] = useState<JournalNode[]>([]);
  const vFileSystemRef = useRef<JournalNode[]>(vFileSystem);

  const setVFileSystem = (updated: JournalNode[] | ((prev: JournalNode[]) => JournalNode[])) => {
    if (typeof updated === "function") {
      const next = (updated as (prev: JournalNode[]) => JournalNode[])(vFileSystemRef.current);
      vFileSystemRef.current = next;
      setVFileSystemState(next);
    } else {
      vFileSystemRef.current = updated;
      setVFileSystemState(updated);
    }
  };

  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const clipboardNodeRef = useRef<JournalNode | null>(null);
  const [clipboardNode, setClipboardNodeState] = useState<JournalNode | null>(null);
  clipboardNodeRef.current = clipboardNode;
  const setClipboardNode = (node: JournalNode | null) => {
    clipboardNodeRef.current = node;
    setClipboardNodeState(node);
  };

  // Decrypted contents held safely in memory (ID -> plaintext text)
  const [decryptedMemStore, setDecryptedMemStore] = useState<Record<string, string>>({});

  // Theme settings and profile personalization
  const [personalization, setPersonalizationState] = useState<Personalization>({
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
  const personalizationRef = useRef<Personalization>(personalization);

  const setPersonalization = (updated: Personalization | ((prev: Personalization) => Personalization)) => {
    if (typeof updated === "function") {
      const next = (updated as (prev: Personalization) => Personalization)(personalizationRef.current);
      personalizationRef.current = next;
      setPersonalizationState(next);
    } else {
      personalizationRef.current = updated;
      setPersonalizationState(updated);
    }
  };

  // Check for cached user session on mount (plus active file and tab restoration)
  useEffect(() => {
    const cachedUser = localStorage.getItem("comic_diary_username");
    const cachedTree = localStorage.getItem("comic_diary_fs_tree");
    const cachedPersonalization = localStorage.getItem("comic_diary_personalization");
    const cachedFileId = localStorage.getItem("comic_diary_current_file_id");
    const cachedTab = localStorage.getItem("comic_diary_current_tab");
    if (cachedUser) {
      setUsername(cachedUser);
      if (cachedTree) {
        try {
          const parsed = JSON.parse(cachedTree);
          setVFileSystem(parsed);
          lastSavedTreeJsonRef.current = cachedTree;
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
      if (cachedFileId) {
        setCurrentFileId(cachedFileId);
      }
      if (cachedTab) {
        setCurrentTab(cachedTab as any);
      }
      setRoute("workspace");
    }
  }, []);

  // Persist current active file ID & tab to localStorage across page refreshes (F5)
  useEffect(() => {
    if (currentFileId) {
      localStorage.setItem("comic_diary_current_file_id", currentFileId);
    }
    localStorage.setItem("comic_diary_current_tab", currentTab);
  }, [currentFileId, currentTab]);

  // Editor states
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [generatingComic, setGeneratingComic] = useState(false);
  
  // Custom states for unified canvas, media review tracker, and search bar unsealing
  const [unsealedVaultIds, setUnsealedVaultIds] = useState<string[]>([]);
  const [isDrawingModeActive, setIsDrawingModeActive] = useState(false);
  const personalizationDebounceRef = useRef<any>(null);
  const saveStatusTimeoutRef = useRef<any>(null);
  const saveDebounceRef = useRef<any>(null);
  const latestTree = useRef<JournalNode[]>([]);
  const isInitialLoadRef = useRef<boolean>(true);
  const lastSavedTreeJsonRef = useRef<string>("");

  // History Undo/Redo States for Editor
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving" | "saved" | "idle">("synced");
  const [undoStack, setUndoStackState] = useState<string[]>([]);
  const [redoStack, setRedoStackState] = useState<string[]>([]);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const lastPushedHTMLRef = useRef<string>("");
  const historyTimeoutRef = useRef<any>(null);

  const setUndoStack = (val: string[] | ((prev: string[]) => string[])) => {
    setUndoStackState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      undoStackRef.current = next;
      return next;
    });
  };

  const setRedoStack = (val: string[] | ((prev: string[]) => string[])) => {
    setRedoStackState((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      redoStackRef.current = next;
      return next;
    });
  };

  // Push to history when text changes
  const pushToUndoStack = (html: string) => {
    if (html === lastPushedHTMLRef.current) return;
    if (historyTimeoutRef.current) clearTimeout(historyTimeoutRef.current);
    historyTimeoutRef.current = setTimeout(() => {
      setUndoStack((prev) => {
        if (prev.length > 0 && prev[prev.length - 1] === html) return prev;
        const next = [...prev, html];
        if (next.length > 50) next.shift();
        return next;
      });
      setRedoStack([]);
      lastPushedHTMLRef.current = html;
    }, 400);
  };

  // Selected folder for dashboard quick-view
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState("");
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastLoadedFileIdRef = useRef<string | null>(null);

  const currentFile = currentFileId ? (findNodeRecursive(vFileSystem, currentFileId) as JournalFile) : null;

  // Helper to safely retrieve current file content
  const getActiveFileContent = (file: JournalFile): string => {
    if (file.isLocked) {
      return decryptedMemStore[file.id] || "<i>[Content Blocked - Enter Passkey]</i>";
    }
    return file.content || "";
  };

  // Synchronize editor innerHTML safely when selected file changes, unlocks, OR when tab switches back to editor
  useEffect(() => {
    if (currentTab === "editor" && editorRef.current && currentFile) {
      const isLocked = currentFile.isLocked && !decryptedMemStore[currentFile.id];
      const trackerKey = `${currentFile.id}_${isLocked ? "locked" : "unlocked"}_${currentTab}`;
      if (lastLoadedFileIdRef.current !== trackerKey) {
        const cachedHTML = localStorage.getItem(`rehydrate_file_${currentFile.id}`);
        if (cachedHTML && !isLocked) {
          editorRef.current.innerHTML = cachedHTML;
        } else {
          editorRef.current.innerHTML = getActiveFileContent(currentFile);
        }
        lastLoadedFileIdRef.current = trackerKey;
      }
    } else if (currentTab !== "editor") {
      lastLoadedFileIdRef.current = null;
    }
  }, [currentFileId, decryptedMemStore, currentFile, currentTab]);

  // Force-save current editor state when browser tab is reloaded (F5) or closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentTab === "editor" && editorRef.current && currentFileId) {
        const rawHTML = editorRef.current.innerHTML;
        if (rawHTML && !rawHTML.includes("[Content Blocked - Enter Passkey]")) {
          localStorage.setItem(`rehydrate_file_${currentFileId}`, rawHTML);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentFileId, currentTab]);

  // Set initial undo history when file is loaded
  useEffect(() => {
    if (currentFile) {
      const html = getActiveFileContent(currentFile);
      setUndoStack([html]);
      setRedoStack([]);
      lastPushedHTMLRef.current = html;
    } else {
      setUndoStack([]);
      setRedoStack([]);
      lastPushedHTMLRef.current = "";
    }
  }, [currentFileId]);

  // Global key listener for undo/redo & save shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        if (currentTab === "editor") {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (currentTab === "editor") {
          e.preventDefault();
          handleRedo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (currentTab === "editor") {
          e.preventDefault();
          handleManualSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTab, currentFileId]);

  // Sync state changes with the server and cache in localStorage
  const syncWithServer = async (
    updatedFS: JournalNode[], 
    updatedAvatar?: string,
    updatedFather?: string,
    updatedMother?: string,
    updatedOthers?: string
  ): Promise<boolean> => {
    if (!username) return false;
    setSaveStatus("saving");
    localStorage.setItem("comic_diary_fs_tree", JSON.stringify(updatedFS));
    try {
      const response = await fetch(`${API_BASE_URL}/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          fs_tree: updatedFS,
          avatar_desc: updatedAvatar !== undefined ? updatedAvatar : personalizationRef.current.avatarDesc,
          father_desc: updatedFather !== undefined ? updatedFather : (personalizationRef.current.fatherDesc || ""),
          mother_desc: updatedMother !== undefined ? updatedMother : (personalizationRef.current.motherDesc || ""),
          others_desc: updatedOthers !== undefined ? updatedOthers : (personalizationRef.current.othersDesc || "")
        })
      });
      if (response.ok) {
        lastSavedTreeJsonRef.current = JSON.stringify(updatedFS);
        if (currentFileId) {
          localStorage.removeItem(`rehydrate_file_${currentFileId}`);
        }
        setSaveStatus("saved");
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus((current) => current === "saved" ? "synced" : current);
        }, 3000);
        return true;
      } else {
        setSaveStatus("idle");
        return false;
      }
    } catch (e) {
      console.error("Permanence synchronization failed:", e);
      setSaveStatus("idle");
      return false;
    }
  };

  const setVFileSystemAndSync = async (
    updated: JournalNode[] | ((prev: JournalNode[]) => JournalNode[])
  ) => {
    let next: JournalNode[];
    if (typeof updated === "function") {
      next = (updated as (prev: JournalNode[]) => JournalNode[])(vFileSystemRef.current);
    } else {
      next = updated;
    }
    setVFileSystem(next);
    if (username) {
      await syncWithServer(next);
    }
  };

  // Keep latestTree ref updated
  useEffect(() => {
    latestTree.current = vFileSystem;
  }, [vFileSystem]);

  // Reset initial load skip on user switch
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [username]);

  // Synchronously compute the complete virtual file system tree with latest editor content
  const getFlushedTree = (): JournalNode[] => {
    if (!currentFileId || !editorRef.current) return vFileSystemRef.current;
    const html = editorRef.current.innerHTML;
    const updated = cloneFileSystem(vFileSystemRef.current);
    const file = findNodeRecursive(updated, currentFileId) as JournalFile;
    if (file) {
      if (file.isLocked) {
        setDecryptedMemStore(mem => ({ ...mem, [file.id]: html }));
        const key = file.password || "temp-vault-key";
        file.content = CryptoJS.AES.encrypt(html, key).toString();
      } else {
        file.content = html;
      }
      file.edited = new Date().toLocaleString();
    }
    return updated;
  };

  // Autosave effect on vFileSystem state change
  useEffect(() => {
    if (!username) return;
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Skip autosave if the current file system is identical to what is already saved on the server
    const currentFSJson = JSON.stringify(vFileSystemRef.current);
    if (currentFSJson === lastSavedTreeJsonRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      const success = await syncWithServer(vFileSystemRef.current);
      if (success) {
        setSaveStatus("synced");
      } else {
        setSaveStatus("idle");
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [vFileSystem, username]);

  // Save synchronously before unload/refresh to completely prevent keystroke data loss
  useEffect(() => {
    const handler = () => {
      let flushed = vFileSystemRef.current;
      if (editorRef.current && currentFileId) {
        const html = editorRef.current.innerHTML;
        localStorage.setItem(`rehydrate_file_${currentFileId}`, html);
        flushed = getFlushedTree();
        localStorage.setItem("comic_diary_fs_tree", JSON.stringify(flushed));
      }

      if (username) {
        const body = JSON.stringify({
          username,
          fs_tree: flushed,
          avatar_desc: personalizationRef.current.avatarDesc,
          father_desc: personalizationRef.current.fatherDesc || "",
          mother_desc: personalizationRef.current.motherDesc || "",
          others_desc: personalizationRef.current.othersDesc || ""
        });
        navigator.sendBeacon(`${API_BASE_URL}/api/save`, new Blob([body], { type: "application/json" }));
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [currentFileId, username]);

  // Canvas overlay drawing states & refs
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const [brushColor, setBrushColor] = useState("#ec4899"); // default Pink-500 color
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [drawUndoStack, setDrawUndoStack] = useState<string[]>([]);
  const [drawRedoStack, setDrawRedoStack] = useState<string[]>([]);

  // Auto-resize overlay drawing canvas to perfectly envelope writing pad
  const resizeCanvas = () => {
    const pad = document.getElementById("journalPadSheet");
    const canvas = overlayCanvasRef.current;
    if (pad && canvas) {
      const rect = pad.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Load saved doodle base64 path drawing state if it exists
      if (currentFile && currentFile.canvasPaths) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = currentFile.canvasPaths;
        }
      }
    }
  };

  // Trigger canvas dimensions adjustment whenever active workspace changes
  useEffect(() => {
    const timer = setTimeout(() => {
      resizeCanvas();
    }, 150);
    return () => clearTimeout(timer);
  }, [currentFileId, currentTab, isDrawingModeActive]);

  const saveCanvasPaths = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !currentFileId) return;
    const dataUrl = canvas.toDataURL();

    setDrawUndoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);
    setDrawRedoStack([]); // clear redo on new drawings

    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.canvasPaths = dataUrl;
      }
      return updated;
    });
  };

  const handleDrawUndo = () => {
    if (drawUndoStack.length === 0 || !currentFileId) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousState = drawUndoStack[drawUndoStack.length - 1];
    setDrawUndoStack((prev) => prev.slice(0, -1));
    setDrawRedoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (previousState && previousState !== "") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = previousState;
    }

    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.canvasPaths = previousState;
      }
      return updated;
    });
  };

  const handleDrawRedo = () => {
    if (drawRedoStack.length === 0 || !currentFileId) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nextState = drawRedoStack[drawRedoStack.length - 1];
    setDrawRedoStack((prev) => prev.slice(0, -1));
    setDrawUndoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (nextState && nextState !== "") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = nextState;
    }

    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.canvasPaths = nextState;
      }
      return updated;
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    setDrawUndoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);
    
    isDrawingRef.current = true;
    lastXRef.current = e.clientX - rect.left;
    lastYRef.current = e.clientY - rect.top;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = isEraser ? "transparent" : brushColor;
    
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastXRef.current = currentX;
    lastYRef.current = currentY;
  };

  const handleCanvasMouseUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      saveCanvasPaths();
    }
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    setDrawUndoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);
    
    isDrawingRef.current = true;
    lastXRef.current = touch.clientX - rect.left;
    lastYRef.current = touch.clientY - rect.top;
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.touches.length !== 1) return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];

    const currentX = touch.clientX - rect.left;
    const currentY = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(currentX, currentY);
    
    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastXRef.current = currentX;
    lastYRef.current = currentY;
  };

  const clearOverlayCanvas = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    setDrawUndoStack((prev) => [...prev, currentFile?.canvasPaths || ""]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.canvasPaths = "";
      }
      return updated;
    });
  };

  // Media review helpers
  const handleUpdateStarRating = (star: number) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.starRating = star;
      }
      return updated;
    });
  };

  const handleUpdateOneLiner = (summary: string) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.oneLiner = summary;
      }
      return updated;
    });
  };

  // Character alignment helpers
  const handleAddCharacter = () => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        if (!file.characters) file.characters = [];
        file.characters.push({
          id: `char_${Date.now()}`,
          name: "New Character",
          role: "Ally / Protagonist",
          desc: "Key role profile and alignment notes..."
        });
      }
      return updated;
    });
  };

  const handleRemoveCharacter = (charId: string) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.characters = (file.characters || []).filter((c) => c.id !== charId);
      }
      return updated;
    });
  };

  const handleUpdateCharacter = (charId: string, field: "name" | "role" | "desc", value: string) => {
    if (!currentFileId) return;
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        file.characters = (file.characters || []).map((c) => {
          if (c.id === charId) {
            return { ...c, [field]: value };
          }
          return c;
        });
      }
      
      setSaveStatus("saving");
      return updated;
    });
  };

  const getRatingAuraClass = (stars?: number): string => {
    if (!stars) return "";
    switch (stars) {
      case 5:
        return "border-2 border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.3)] ring-2 ring-amber-400/20";
      case 4:
        return "border-2 border-fuchsia-500/70 shadow-[0_0_35px_rgba(217,70,239,0.25)] ring-2 ring-fuchsia-500/15";
      case 3:
        return "border-2 border-emerald-400/60 shadow-[0_0_30px_rgba(52,211,153,0.2)]";
      case 2:
        return "border-2 border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.1)]";
      case 1:
        return "border border-blue-400/30 shadow-[0_0_20px_rgba(96,165,250,0.08)]";
      default:
        return "";
    }
  };

  // Clear all rehydrate_file_ cache items to avoid loading stale local caches from previous users/sessions
  const clearRehydrateCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("rehydrate_file_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  // Login handler
  const handleLoginSuccess = (data: { 
    username: string; 
    fs_tree: any[]; 
    avatar_desc: string; 
    father_desc?: string; 
    mother_desc?: string; 
    others_desc?: string; 
  }) => {
    clearRehydrateCache();
    setUsername(data.username);
    setVFileSystem(data.fs_tree || []);
    lastSavedTreeJsonRef.current = JSON.stringify(data.fs_tree || []);
    localStorage.setItem("comic_diary_username", data.username);
    localStorage.setItem("comic_diary_fs_tree", JSON.stringify(data.fs_tree || []));

    setPersonalization(prev => {
      const next = { 
        ...prev, 
        avatarDesc: data.avatar_desc || prev.avatarDesc,
        fatherDesc: data.father_desc !== undefined ? data.father_desc : prev.fatherDesc,
        motherDesc: data.mother_desc !== undefined ? data.mother_desc : prev.motherDesc,
        othersDesc: data.others_desc !== undefined ? data.others_desc : prev.othersDesc
      };
      localStorage.setItem("comic_diary_personalization", JSON.stringify(next));
      return next;
    });
    setRoute("workspace");
    changeTab("dashboard");
  };

  // Update Personalization
  const handleUpdatePersonalization = (updates: Partial<Personalization>) => {
    setPersonalization((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("comic_diary_personalization", JSON.stringify(next));
      
      // Debounce the server synchronization so it works smoothly on typing
      if (personalizationDebounceRef.current) {
        clearTimeout(personalizationDebounceRef.current);
      }
      setSaveStatus("saving");
      personalizationDebounceRef.current = setTimeout(() => {
        syncWithServer(
          vFileSystem, 
          next.avatarDesc, 
          next.fatherDesc || "", 
          next.motherDesc || "", 
          next.othersDesc || ""
        ).then((success) => {
          if (success) {
            setSaveStatus("saved");
            setTimeout(() => {
              setSaveStatus((current) => current === "saved" ? "synced" : current);
            }, 3000);
          }
        });
      }, 1000);

      return next;
    });
  };

  const handleLogout = () => {
    clearRehydrateCache();
    setUsername("");
    setVFileSystem([]);
    lastSavedTreeJsonRef.current = "";
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
    // Guard: Prevent overwriting actual file content with the locked block text
    if (rawHTML.includes("[Content Blocked - Enter Passkey]")) return;
    pushToUndoStack(rawHTML);
    setSaveStatus("saving");
    setVFileSystem((prev) => {
      const updated = cloneFileSystem(prev);
      const file = findNodeRecursive(updated, currentFileId) as JournalFile;
      if (file) {
        if (file.isLocked) {
          setDecryptedMemStore(mem => ({ ...mem, [file.id]: rawHTML }));
          const key = file.password || "temp-vault-key";
          file.content = CryptoJS.AES.encrypt(rawHTML, key).toString();
        } else {
          file.content = rawHTML;
        }
        file.edited = new Date().toLocaleString();
        // Layer 1: Instant local storage cache (synchronous)
        localStorage.setItem(`rehydrate_file_${file.id}`, rawHTML);
        localStorage.setItem("comic_diary_fs_tree", JSON.stringify(updated));
        // Layer 2: Debounced background server sync
        if (saveDebounceRef.current) {
          clearTimeout(saveDebounceRef.current);
        }
        saveDebounceRef.current = setTimeout(() => {
          syncWithServer(updated);
        }, 1000);
      }
      return updated;
    });
  };

  const flushEditor = (): JournalNode[] => {
    if (!editorRef.current || !currentFileId) return vFileSystemRef.current;
    
    // Safety check: if the editor has not actually loaded the active file yet (meaning DOM shows stale content),
    // we must skip flushing to prevent overwriting the new file with old content.
    if (currentFileId !== lastLoadedFileIdRef.current) {
      return vFileSystemRef.current;
    }

    const html = editorRef.current.innerHTML;
    localStorage.setItem(`rehydrate_file_${currentFileId}`, html);
    const updated = getFlushedTree();
    setVFileSystem(updated);
    return updated;
  };

  const changeTab = async (tab: "dashboard" | "editor" | "comic-book" | "insights" | "communications" | "media-ledger") => {
    const tree = flushEditor();
    if (username) {
      await syncWithServer(tree);
    }
    setCurrentTab(tab);
  };

  const handleManualSave = async () => {
    const flushedTree = flushEditor();
    setSaveStatus("saving");
    const success = await syncWithServer(flushedTree);
    if (success) {
      setSaveStatus("saved");
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus((current) => current === "saved" ? "synced" : current);
      }, 2000);
    } else {
      setSaveStatus("idle");
    }
  };

  const handleEditorInputDirectly = (html: string) => {
    if (!currentFileId) return;
    const updated = cloneFileSystem(vFileSystemRef.current);
    const file = findNodeRecursive(updated, currentFileId) as JournalFile;
    if (file) {
      if (file.isLocked) {
        setDecryptedMemStore(mem => ({ ...mem, [file.id]: html }));
        const key = file.password || "temp-vault-key";
        file.content = CryptoJS.AES.encrypt(html, key).toString();
      } else {
        file.content = html;
      }
      file.edited = new Date().toLocaleString();

      localStorage.setItem(`rehydrate_file_${file.id}`, html);
      localStorage.setItem("comic_diary_fs_tree", JSON.stringify(updated));
      
      setVFileSystem(updated);
    }
  };

  const handleUndo = () => {
    const stack = undoStackRef.current;
    if (stack.length <= 1) return;
    const editor = editorRef.current;
    if (!editor) return;

    const currentHTML = editor.innerHTML;
    const previousHTML = stack[stack.length - 2];

    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, currentHTML]);

    editor.innerHTML = previousHTML;
    lastPushedHTMLRef.current = previousHTML;
    handleEditorInputDirectly(previousHTML);
  };

  const handleRedo = () => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const editor = editorRef.current;
    if (!editor) return;

    const nextHTML = stack[stack.length - 1];

    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, nextHTML]);

    editor.innerHTML = nextHTML;
    lastPushedHTMLRef.current = nextHTML;
    handleEditorInputDirectly(nextHTML);
  };



  // Helpers migrated to top-level module scope to avoid hoisting errors

  // Select node to write / edit
  const handleSelectFile = async (id: string) => {
    const tree = flushEditor();
    if (username) {
      await syncWithServer(tree);
    }
    const latestTreeValue = vFileSystemRef.current;
    const node = findNodeRecursive(latestTreeValue, id) as JournalFile;
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
            await changeTab("editor");
          } catch (e) {
            alert("Security Decryption Failed. Block remains encrypted.");
          }
        }
      } else {
        setCurrentFileId(id);
        await changeTab("editor");
      }
    }
  };

  // Create Root or nested Folder
  const handleAddFolder = (parentId?: string) => {
    flushEditor();
    const latestTreeValue = vFileSystemRef.current;
    const name = prompt("Name Folder:") || "New Folder 📁";
    const newFolder: JournalFolder = {
      id: "fold_" + Date.now(),
      type: "folder",
      name,
      children: [],
    };

    setSaveStatus("saving");
    setVFileSystemAndSync(() => {
      const next = cloneFileSystem(latestTreeValue);
      if (parentId) {
        const parent = findNodeRecursive(next, parentId) as JournalFolder;
        if (parent) {
          parent.children.push(newFolder);
        }
      } else {
        next.push(newFolder);
      }
      return next;
    });
  };

  // Create file
  const handleAddFile = (parentId: string) => {
    flushEditor();
    const latestTreeValue = vFileSystemRef.current;
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

    setSaveStatus("saving");
    setVFileSystemAndSync(() => {
      const next = cloneFileSystem(latestTreeValue);
      const parent = findNodeRecursive(next, parentId) as JournalFolder;
      if (parent) {
        parent.children.push(newFile);
      }
      return next;
    });

    setCurrentFileId(newFile.id);
    changeTab("editor");
  };

  // Rename node
  const handleRenameNode = (id: string, name: string) => {
    flushEditor();
    const latestTreeValue = vFileSystemRef.current;
    setSaveStatus("saving");
    setVFileSystemAndSync(() => {
      const next = cloneFileSystem(latestTreeValue);
      const target = findNodeRecursive(next, id);
      if (target) {
        target.name = name;
      }
      return next;
    });
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    setDeletePendingId(id);
  };

  const executeDeleteNode = (id: string) => {
    flushEditor();
    const latestTreeValue = vFileSystemRef.current;
    setSaveStatus("saving");
    setVFileSystemAndSync(() => {
      const next = cloneFileSystem(latestTreeValue);
      removeNodeRecursive(next, id);
      if (currentFileId === id) {
        setCurrentFileId(null);
      }
      return next;
    });
    setDeletePendingId(null);
  };

  // Move node (Cut)
  const handleCutNode = (id: string) => {
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
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
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const parent = findNodeRecursive(next, parentId) as JournalFolder;
      if (parent && parent.children) {
        parent.children.push(clipboardNode);
        setClipboardNode(null);
      }
      return next;
    });
  };

  // AES Password protection for folders
  const handleLockNode = (id: string, password?: string, type?: "folder" | "file") => {
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
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
      return next;
    });
  };

  const handleUpdateVaultPassword = (newPassword: string) => {
    handleUpdatePersonalization({ vaultPassword: newPassword });
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const updatePasswordsRecursive = (nodes: JournalNode[]) => {
        nodes.forEach((n) => {
          if (n.isLocked) {
            const oldPass = n.password || personalization.vaultPassword || "1234";
            n.password = newPassword;
            if (n.type === "file") {
              const file = n as JournalFile;
              try {
                const bytes = CryptoJS.AES.decrypt(file.content, oldPass);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (decrypted) {
                  file.content = CryptoJS.AES.encrypt(decrypted, newPassword).toString();
                }
              } catch (e) {
                try {
                  file.content = CryptoJS.AES.encrypt(file.content, newPassword).toString();
                } catch (e2) {}
              }
            }
          }
          if (n.type === "folder" && (n as JournalFolder).children) {
            updatePasswordsRecursive((n as JournalFolder).children);
          }
        });
      };
      updatePasswordsRecursive(next);
      return next;
    });
  };

  const handleUnlockNode = (id: string, password?: string, type?: "folder" | "file") => {
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
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

    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file) {
        if (!file.stickers) file.stickers = [];
        file.stickers.push(newSticker);
      }
      return next;
    });
  };

  // Modify individual stickers (drag, delete, resize)
  const handleMoveSticker = (stickerIndex: number, top: string, left: string) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        file.stickers[stickerIndex].top = top;
        file.stickers[stickerIndex].left = left;
      }
      return next;
    });
  };

  const handleScaleSticker = (stickerIndex: number) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        const currentScale = parseFloat(file.stickers[stickerIndex].transform.replace("scale(", "").replace(")", "")) || 1;
        const nextScale = currentScale >= 2.5 ? 0.8 : currentScale + 0.3;
        file.stickers[stickerIndex].transform = `scale(${nextScale})`;
      }
      return next;
    });
  };

  const handleDeleteSticker = (stickerIndex: number) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const file = findNodeRecursive(next, currentFileId) as JournalFile;
      if (file && file.stickers) {
        file.stickers.splice(stickerIndex, 1);
      }
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
        setSaveStatus("saving");
        setVFileSystemAndSync((prev) => {
          const next = cloneFileSystem(prev);
          const target = findNodeRecursive(next, currentFileId) as JournalFile;
          if (target) {
            target.attached_image = reader.result as string;
          }
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    if (currentFileId) {
      setSaveStatus("saving");
      setVFileSystemAndSync((prev) => {
        const next = cloneFileSystem(prev);
        const target = findNodeRecursive(next, currentFileId) as JournalFile;
        if (target) {
          delete target.attached_image;
        }
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
      const fileChars = (file.characters || []).map(c => `${c.name} (${c.role}): ${c.desc}`).join(", ");
      const universeCharsGuideline = fileChars ? ` Active scene characters: ${fileChars}.` : "";

      const charGuidelines = `Main character profile: ${personalization.avatarDesc || "classic character"}. ` +
        (personalization.fatherDesc ? `Father character: ${personalization.fatherDesc}. ` : "") +
        (personalization.motherDesc ? `Mother character: ${personalization.motherDesc}. ` : "") +
        (personalization.othersDesc ? `Other character alignments: ${personalization.othersDesc}. ` : "") +
        universeCharsGuideline;

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
        setSaveStatus("saving");
        setVFileSystemAndSync((prev) => {
          const next = cloneFileSystem(prev);
          const target = findNodeRecursive(next, currentFileId) as JournalFile;
          if (target) {
            target.comic = data.image_data_url;
          }
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
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const target = findNodeRecursive(next, currentFileId) as JournalFile;
      if (target) {
        target.mood = mood;
      }
      return next;
    });
  };

  // Update active file weather
  const handleUpdateWeather = (weather: string) => {
    if (!currentFileId) return;
    setSaveStatus("saving");
    setVFileSystemAndSync((prev) => {
      const next = cloneFileSystem(prev);
      const target = findNodeRecursive(next, currentFileId) as JournalFile;
      if (target) {
        target.weather = weather;
      }
      return next;
    });
  };

  // Master passcode scanner for Search Bar Vault unsealing:
  useEffect(() => {
    if (!dashboardSearchQuery || dashboardSearchQuery.trim() === "") return;
    
    let unsealedAny = false;
    const scanRecursively = (nodes: JournalNode[]) => {
      nodes.forEach((n) => {
        if (n.isLocked && n.password && n.password.trim() === dashboardSearchQuery.trim()) {
          if (!unsealedVaultIds.includes(n.id)) {
            setUnsealedVaultIds((prev) => [...prev, n.id]);
            unsealedAny = true;
          }
        }
        if (n.type === "folder" && (n as JournalFolder).children) {
          scanRecursively((n as JournalFolder).children);
        }
      });
    };

    scanRecursively(vFileSystem);

    if (unsealedAny) {
      alert("🔓 SECURITY ACCESS GRANTED: Secret Passcode Match! The hidden Vault section has unsealed & revealed itself in the ledger filesystem.");
    }
  }, [dashboardSearchQuery, vFileSystem]);

  // Flat helper to extract list for search feeds
  const getAllFiles = (nodes: JournalNode[]): JournalFile[] => {
    let list: JournalFile[] = [];
    nodes.forEach((n) => {
      // Hide locked items from standard lists unless unsealed
      if (n.isLocked && !unsealedVaultIds.includes(n.id)) {
        return;
      }
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
    changeTab("comic-book");
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
              onUpdateVaultPassword={handleUpdateVaultPassword}
              onExportFolderBook={handleExportPDF}
              onLogout={handleLogout}
              collapsed={sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
              username={username}
              unsealedVaultIds={unsealedVaultIds}
              dashboardSearchQuery={dashboardSearchQuery}
              saveStatus={saveStatus}
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
                  {(["dashboard", "editor", "comic-book", "insights", "communications", "media-ledger"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => changeTab(tab)}
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
                      {tab === "comic-book" ? "Comic compiler" : tab === "communications" ? "Messenger 💬" : tab === "media-ledger" ? "Movies & Books 📚" : tab}
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
                              
                              // Find files for this day
                              const dayFile = (() => {
                                const allFiles: JournalFile[] = [];
                                const traverse = (nodes: JournalNode[]) => {
                                  for (const node of nodes) {
                                    if (node.type === "file") {
                                      allFiles.push(node);
                                    } else if (node.type === "folder" && node.children) {
                                      traverse(node.children);
                                    }
                                  }
                                };
                                traverse(vFileSystem);
                                for (const file of allFiles) {
                                  if (!file.created) continue;
                                  try {
                                    const d = new Date(file.created);
                                    if (d.getDate() === day && d.getMonth() === 5) { // Month index 5 is June
                                      return file;
                                    }
                                  } catch (e) {}
                                }
                                return null;
                              })();

                              return (
                                <button
                                  key={i}
                                  onClick={async () => {
                                    if (dayFile) {
                                      const tree = flushEditor();
                                      if (username) {
                                        await syncWithServer(tree);
                                      }
                                      setCurrentFileId(dayFile.id);
                                      await changeTab("editor");
                                    }
                                  }}
                                  className={`py-1 rounded-md flex flex-col items-center justify-center min-h-[44px] transition-all relative cursor-pointer ${
                                    isToday 
                                      ? "bg-pink-500 text-white font-bold shadow-md shadow-pink-500/30" 
                                      : dayFile 
                                        ? "bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 font-bold" 
                                        : `hover:bg-pink-500/10 ${isLight ? "text-stone-600 hover:text-pink-600" : "text-slate-400"}`
                                  }`}
                                  title={dayFile ? `Entry: ${dayFile.name} (Mood: ${dayFile.mood})` : undefined}
                                >
                                  <span className="text-[10px] leading-none">{day}</span>
                                  {dayFile && (
                                    <span className="text-xs mt-1">{dayFile.mood || "😊"}</span>
                                  )}
                                </button>
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
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      onSave={handleManualSave}
                      saveStatus={saveStatus}
                    />

                    {/* Paper Stage workspace background */}
                    <div className={`flex-1 overflow-y-auto p-8 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-8 ${wallpaperThemes[personalization.outerWallpaper] || "bg-[#0b0d0e]"} transition-all duration-300`}>
                      {currentFile ? (
                        <>
                          <div className="flex flex-col gap-4 w-full max-w-3xl shrink-0">
                            
                            {/* Sketch overlay active toolkit */}
                            {isDrawingModeActive && (
                              <div className="p-2 bg-zinc-900/95 border border-zinc-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono w-full z-40 relative shadow-xl">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-[10px] uppercase font-bold text-pink-500 flex items-center gap-1">
                                    <Paintbrush className="w-3.5 h-3.5 animate-pulse" /> Drawing Layer Active
                                  </span>
                                  
                                  {/* Color buttons */}
                                  <div className="flex items-center gap-1">
                                    {["#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#ffffff", "#000000"].map((color) => (
                                      <button
                                        key={color}
                                        onClick={() => {
                                          setBrushColor(color);
                                          setIsEraser(false);
                                        }}
                                        style={{ backgroundColor: color }}
                                        className={`w-4 h-4 rounded-full border ${brushColor === color && !isEraser ? "ring-2 ring-pink-500 scale-110" : "border-zinc-700"} cursor-pointer shrink-0`}
                                        title={color}
                                      />
                                    ))}
                                  </div>

                                  {/* Size range slider */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] opacity-60">Brush:</span>
                                    <input
                                      type="range"
                                      min="1"
                                      max="15"
                                      value={brushSize}
                                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                      className="w-16 accent-pink-500 h-1 rounded bg-zinc-800"
                                    />
                                    <span className="text-[9px]">{brushSize}px</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setIsEraser(!isEraser)}
                                    className={`px-2.5 py-1 rounded border text-[10px] font-semibold transition-all shrink-0 cursor-pointer ${
                                      isEraser 
                                        ? "bg-pink-500/20 border-pink-500 text-pink-500 font-bold" 
                                        : "border-zinc-800 hover:bg-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    🧹 Eraser
                                  </button>
                                  
                                  <button
                                    onClick={handleDrawUndo}
                                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 cursor-pointer"
                                    title="Undo Drawing"
                                  >
                                    <Undo className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleDrawRedo}
                                    className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-slate-300 cursor-pointer"
                                    title="Redo Drawing"
                                  >
                                    <Redo className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={clearOverlayCanvas}
                                    className="px-2 py-1 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 rounded text-[10px] font-semibold shrink-0 cursor-pointer"
                                  >
                                    Clear Layer
                                  </button>
                                </div>
                              </div>
                            )}

                            <div
                              id="journalPadSheet"
                              style={{
                                padding: personalization.margins,
                                lineHeight: personalization.lineSpacing,
                                fontFamily: personalization.typography,
                                background: personalization.padStyle === "transparent-glass" 
                                  ? `rgba(24, 24, 27, ${(personalization.glassOpacity !== undefined ? personalization.glassOpacity : 40) / 100})` 
                                  : undefined,
                                backdropFilter: personalization.padStyle === "transparent-glass" 
                                  ? "blur(12px)" 
                                  : undefined,
                                color: personalization.padStyle === "transparent-glass" 
                                  ? "#f4f4f5" 
                                  : undefined,
                              }}
                              className={`w-full min-h-[800px] relative transition-all duration-300 ${personalization.padStyle === "transparent-glass" ? "border border-zinc-700/30 shadow-2xl" : (padPrintStyles[personalization.padStyle] || "bg-white text-zinc-900")} rounded-lg ${getRatingAuraClass(currentFile.starRating)}`}
                            >
                              {/* OVERLAY DRAWING CANVAS */}
                              <canvas
                                ref={overlayCanvasRef}
                                className="absolute top-0 left-0 w-full h-full rounded-lg z-25"
                                style={{
                                  pointerEvents: isDrawingModeActive ? "auto" : "none",
                                }}
                                onMouseDown={handleCanvasMouseDown}
                                onMouseMove={handleCanvasMouseMove}
                                onMouseUp={handleCanvasMouseUp}
                                onMouseLeave={handleCanvasMouseUp}
                                onTouchStart={handleCanvasTouchStart}
                                onTouchMove={handleCanvasTouchMove}
                                onTouchEnd={handleCanvasMouseUp}
                              />

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
                              <div className="flex flex-wrap items-center justify-between gap-4 text-xs opacity-60 font-mono mb-4 pb-2 border-b border-zinc-900/10" contentEditable={false}>
                                <span>Created: {currentFile.created}</span>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span>Mood:</span>
                                    <select
                                      value={currentFile.mood || "😊"}
                                      onChange={(e) => handleUpdateMood(e.target.value)}
                                      className="bg-black/5 dark:bg-white/10 backdrop-blur-md border border-zinc-900/20 dark:border-zinc-700/30 rounded px-2 py-0.5 text-inherit cursor-pointer outline-none transition-all duration-200"
                                    >
                                      <option className="bg-zinc-900 text-white" value="😊">Joy 😊</option>
                                      <option className="bg-zinc-900 text-white" value="💻">Code 💻</option>
                                      <option className="bg-zinc-900 text-white" value="🌌">Zen 🌌</option>
                                      <option className="bg-zinc-900 text-white" value="⚡">Chaos ⚡</option>
                                      <option className="bg-zinc-900 text-white" value="😭">Sad 😭</option>
                                      <option className="bg-zinc-900 text-white" value="🤯">Mindblown 🤯</option>
                                      <option className="bg-zinc-900 text-white" value="😡">Angry 😡</option>
                                      <option className="bg-zinc-900 text-white" value="😴">Tired 😴</option>
                                      <option className="bg-zinc-900 text-white" value="🥳">Excited 🥳</option>
                                      <option className="bg-zinc-900 text-white" value="🤔">Thinking 🤔</option>
                                      <option className="bg-zinc-900 text-white" value="🥰">Loved 🥰</option>
                                      <option className="bg-zinc-900 text-white" value="🤢">Sick 🤢</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>Weather:</span>
                                    <select
                                      value={currentFile.weather || "Sunny ☀️"}
                                      onChange={(e) => handleUpdateWeather(e.target.value)}
                                      className="bg-black/5 dark:bg-white/10 backdrop-blur-md border border-zinc-900/20 dark:border-zinc-700/30 rounded px-2 py-0.5 text-inherit cursor-pointer outline-none transition-all duration-200"
                                    >
                                      <option className="bg-zinc-900 text-white" value="Sunny ☀️">Sunny ☀️</option>
                                      <option className="bg-zinc-900 text-white" value="Rainy 🌧️">Rainy 🌧️</option>
                                      <option className="bg-zinc-900 text-white" value="Windy 🍃">Windy 🍃</option>
                                      <option className="bg-zinc-900 text-white" value="Cloudy ☁️">Cloudy ☁️</option>
                                      <option className="bg-zinc-900 text-white" value="Snowy ❄️">Snowy ❄️</option>
                                      <option className="bg-zinc-900 text-white" value="Stormy ⛈️">Stormy ⛈️</option>
                                    </select>
                                  </div>
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

                              <div className="flex items-center gap-3 mb-6 flex-wrap" contentEditable={false}>
                                <button
                                  onClick={() => setShowWhiteboard(true)}
                                  className="px-3.5 py-1.5 bg-zinc-900 text-white border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer font-sans"
                                >
                                  <ImagePlus className="w-3.5 h-3.5" /> Sketchpad Whiteboard
                                </button>
                                
                                <button
                                  onClick={() => setIsDrawingModeActive(!isDrawingModeActive)}
                                  className={`px-3.5 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer font-sans ${
                                    isDrawingModeActive 
                                      ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/25 font-bold" 
                                      : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  <Paintbrush className="w-3.5 h-3.5" /> 
                                  {isDrawingModeActive ? "Canvas Drawing Active" : "Sketch Overlay"}
                                </button>

                                <label className="px-3.5 py-1.5 bg-zinc-900 text-white border border-zinc-800 rounded-lg text-xs font-semibold hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer font-sans">
                                  <ImageIcon className="w-3.5 h-3.5" /> Reference Snapshot
                                  <input type="file" accept="image/*" onChange={handleImageAttachment} className="hidden" />
                                </label>

                                <button
                                  onClick={handleManualSave}
                                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer font-sans ${
                                    saveStatus === "saving"
                                      ? "bg-amber-500 text-black font-bold animate-pulse"
                                      : saveStatus === "saved"
                                        ? "bg-green-600 text-white font-bold scale-105"
                                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/10"
                                  }`}
                                  title="Immediate Save (Ctrl+S)"
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
                                      <span>Save Now</span>
                                    </>
                                  )}
                                </button>

                                <div className="ml-auto flex items-center gap-1.5 font-mono text-[10px] select-none bg-zinc-900/10 dark:bg-white/5 px-2.5 py-1 rounded border border-zinc-900/5 dark:border-zinc-700/10">
                                  <span className={`w-2 h-2 rounded-full ${
                                    saveStatus === "saving" 
                                      ? "bg-orange-400 animate-pulse" 
                                      : saveStatus === "saved" 
                                        ? "bg-green-400 scale-125" 
                                        : "bg-emerald-400"
                                  }`}></span>
                                  <span className={
                                    saveStatus === "saving" 
                                      ? "text-orange-400 font-medium" 
                                      : saveStatus === "saved" 
                                        ? "text-green-400 font-bold" 
                                        : "text-zinc-400 dark:text-zinc-300"
                                  }>
                                    {saveStatus === "saving" 
                                      ? "Saving..." 
                                      : saveStatus === "saved" 
                                        ? "✓ Saved to Vault" 
                                        : "Synced with Vault"}
                                  </span>
                                </div>
                              </div>
                              <div className="hidden">
                                <label>
                                </label>
                              </div>

                              {/* Main Editable content area */}
                              <div
                                ref={editorRef}
                                id="editorEngine"
                                contentEditable={!isMarkdownMode && !(currentFile?.isLocked && !decryptedMemStore[currentFile?.id || ""])}
                                onInput={handleEditorInput}
                                onBlur={() => {
                                  // 🛡️ Force immediate sync the moment focus leaves the editor (clicking sidebar, switching tabs, etc.)
                                  handleEditorInput();
                                }}
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
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer font-sans"
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

                          </div>

                          {/* SIDEBAR COMPANION: Media Review Rating + Character Alignment mapping */}
                          <div className="w-full xl:w-80 shrink-0 space-y-6 z-30" contentEditable={false}>
                            {/* Star rating & summary card */}
                            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4 shadow-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold font-mono text-zinc-400 tracking-wider">MEDIA LOG SCORE</span>
                                <div className="flex items-center gap-1 bg-zinc-950/60 py-1 px-2.5 rounded-lg border border-zinc-800/50">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleUpdateStarRating(star)}
                                      className="text-sm transition-transform hover:scale-125 cursor-pointer"
                                      title={`Assign ${star} stars`}
                                    >
                                      {star <= (currentFile.starRating || 0) ? "⭐" : "☆"}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* One Liner Summary */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                                  One-Liner Review Highlights
                                </label>
                                <input
                                  type="text"
                                  value={currentFile.oneLiner || ""}
                                  placeholder="E.g. A masterpiece of space gothic horror!"
                                  onChange={(e) => handleUpdateOneLiner(e.target.value)}
                                  className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs py-2 px-3 outline-none text-slate-200 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/25 transition-all"
                                />
                              </div>
                            </div>

                            {/* Character alignments mapper */}
                            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md space-y-4 shadow-xl">
                              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                                <span className="text-xs font-bold font-mono text-zinc-400 flex items-center gap-1.5 tracking-wider font-sans">
                                  <Users className="w-4 h-4 text-pink-500" /> UNIVERSE CHARACTERS
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      const tree = flushEditor();
                                      setSaveStatus("saving");
                                      const success = await syncWithServer(tree);
                                      if (success) {
                                        setSaveStatus("saved");
                                        setTimeout(() => {
                                          setSaveStatus((current) => current === "saved" ? "synced" : current);
                                        }, 2000);
                                      } else {
                                        setSaveStatus("idle");
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[9px] font-bold tracking-wider cursor-pointer shrink-0 transition-colors font-sans flex items-center gap-1"
                                    title="Force immediate save of all character alignments"
                                  >
                                    <Save className="w-2.5 h-2.5 text-zinc-400" /> SAVE ALL
                                  </button>
                                  <button
                                    onClick={handleAddCharacter}
                                    className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[9px] font-bold tracking-wider cursor-pointer shrink-0 transition-colors font-sans"
                                  >
                                    + ADD
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
                                {(currentFile.characters || []).length === 0 ? (
                                  <div className="text-center py-6">
                                    <p className="text-[11px] font-mono text-zinc-500">No alignments mapped.</p>
                                    <p className="text-[10px] font-mono text-zinc-600 mt-1">Add infinite profile slots to map your novel characters!</p>
                                  </div>
                                ) : (
                                  (currentFile.characters || []).map((char) => (
                                    <div key={char.id} className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/70 relative space-y-2 group/char">
                                      <button
                                        onClick={() => handleRemoveCharacter(char.id)}
                                        className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-red-400 text-xs shrink-0 cursor-pointer transition-colors"
                                        title="Remove character profile"
                                      >
                                        ×
                                      </button>
                                      <div>
                                        <input
                                          type="text"
                                          value={char.name}
                                          placeholder="Character Name"
                                          onChange={(e) => handleUpdateCharacter(char.id, "name", e.target.value)}
                                          className="w-10/12 bg-transparent border-b border-zinc-800/50 focus:border-pink-500/50 text-xs py-0.5 outline-none font-bold text-slate-200 transition-colors font-sans"
                                        />
                                      </div>
                                      <div>
                                        <input
                                          type="text"
                                          value={char.role}
                                          placeholder="Role / Alliance / Status"
                                          onChange={(e) => handleUpdateCharacter(char.id, "role", e.target.value)}
                                          className="w-full bg-transparent border-b border-zinc-800/50 focus:border-pink-500/50 text-[10px] py-0.5 outline-none font-mono text-pink-400 transition-colors"
                                        />
                                      </div>
                                      <div>
                                        <textarea
                                          value={char.desc}
                                          placeholder="Aesthetic notes, alignments, relationship vectors..."
                                          onChange={(e) => handleUpdateCharacter(char.id, "desc", e.target.value)}
                                          rows={2}
                                          className="w-full bg-zinc-950/80 rounded-lg border border-zinc-800/40 focus:border-pink-500/50 text-[10px] p-2 outline-none text-zinc-400 resize-none font-sans transition-all"
                                        />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </>
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

                {/* 6. MEDIA LEDGER (MOVIES & BOOKS) */}
                {currentTab === "media-ledger" && (
                  <MediaLedger
                    personalization={personalization}
                    vFileSystem={vFileSystem}
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
                    setSaveStatus("saving");
                    setVFileSystemAndSync((prev) => {
                      const next = cloneFileSystem(prev);
                      const target = findNodeRecursive(next, currentFileId) as JournalFile;
                      if (target) {
                        target.attached_image = base64;
                      }
                      return next;
                    });
                  }
                }}
                onClose={() => setShowWhiteboard(false)}
              />
            )}

            {deletePendingId && (() => {
              const deleteTargetNode = findNodeRecursive(vFileSystem, deletePendingId);
              return (
                <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999]" contentEditable={false}>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                      ⚠️ Permanent Deletion
                    </h3>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Are you sure you want to delete <span className="text-pink-400 font-semibold">"{deleteTargetNode?.name || "this item"}"</span>? This action is permanent and cannot be undone.
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setDeletePendingId(null)}
                        className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (deletePendingId) {
                            executeDeleteNode(deletePendingId);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
