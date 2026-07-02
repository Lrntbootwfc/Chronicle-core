const isLocalOrPreview = 
  typeof window !== "undefined" && 
  (window.location.hostname === "localhost" || 
   window.location.hostname === "127.0.0.1" || 
   window.location.hostname.includes("run.app") || 
   window.location.hostname.includes("aistudio") ||
   window.location.hostname.includes("webcontainer"));


export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "https://dooo-dah.onrender.com";
