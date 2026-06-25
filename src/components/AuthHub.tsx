import React, { useState } from "react";
import { ShieldAlert, Key, User, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { API_BASE_URL } from "../config";

interface AuthHubProps {
  onLoginSuccess: (data: { username: string; fs_tree: any[]; avatar_desc: string }) => void;
}

export default function AuthHub({ onLoginSuccess }: AuthHubProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/signup";

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failure");
      }

      if (isLogin) {
        onLoginSuccess({
          username: data.username,
          fs_tree: data.fs_tree || [],
          avatar_desc: data.avatar_desc || ""
        });
      } else {
        setSuccessMsg(data.message || "Account registered! Unseal the vault.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach security ledger database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-hub" className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#0b0c10] via-[#1f1225] to-[#0c0a1a] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Comic speech bubble accent */}
      <div className="mb-6 relative max-w-sm animate-bounce">
        <div className="bg-white text-zinc-900 text-xs px-4 py-2.5 rounded-2xl font-bold border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
          💭 "Shhh... Keep your secret comic drawings and daily journals 100% encrypted from nosey readers!"
        </div>
        <div className="w-4 h-4 bg-white border-r-2 border-b-2 border-zinc-900 absolute left-8 -bottom-2 rotate-45 z-0" />
      </div>

      <div className="relative max-w-md w-full rounded-2xl border-2 border-zinc-900 bg-zinc-950 p-8 shadow-[8px_8px_0px_0px_rgba(236,72,153,0.3)]">
        {/* Header logo / details */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-pink-500/10 border-2 border-pink-500/30 items-center justify-center text-pink-500 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white uppercase">
            {isLogin ? "Unseal Comic Diary" : "Create Diary Space"}
          </h2>
          <p className="text-xs text-pink-400 font-mono tracking-widest uppercase font-semibold">
            {isLogin ? "AES-256 SECURE VAULT CONTAINER" : "REGISTER LEDGER CREDENTIALS"}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 flex items-start gap-3 text-red-300 text-xs mb-6">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-xs mb-6">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
              Diary Profile Username (Unique ID)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter unique username..."
                className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
              AES-256 Ledger Key Passcode
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
              />
            </div>
            {isLogin && (
              <span className="text-[10px] text-zinc-500 block leading-tight pt-1">
                Demo access available: Use <span className="text-zinc-300 font-mono">admin</span> & <span className="text-zinc-300 font-mono">password123</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/15"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "UNSEAL MY COMIC VAULT" : "INITIALIZE SECURE LEDGER"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMsg("");
            }}
            className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-all"
          >
            {isLogin ? "Create custom separate container Space" : "Registered before? Unseal Space here"}
          </button>
        </div>
      </div>
    </div>
  );
}
