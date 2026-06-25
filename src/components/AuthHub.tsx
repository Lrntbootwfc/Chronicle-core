import React, { useState } from "react";
import { ShieldAlert, Key, User, ArrowRight, Lock, CheckCircle, Sparkles } from "lucide-react";
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
    <div id="auth-hub" className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-tr from-[#03050c] to-[#0e121f] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 shadow-2xl shadow-black">
        {/* Header logo / details */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 items-center justify-center text-orange-400 mb-2 glow-active">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white">
            {isLogin ? "Unseal Secure Vault" : "Initialize Container"}
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            {isLogin ? "AES-256 Ledger Memory Space" : "Register Credentials"}
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
            <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold block">
              Identity Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter identity alias..."
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-orange-500 focus:bg-zinc-900/95 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-semibold block">
              Ledger Security Key
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-orange-500 focus:bg-zinc-900/95 transition-all font-mono"
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
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Unseal Secure Vault" : "Create Vault Space"}
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
            className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-all"
          >
            {isLogin ? "Need a separate container? Sign Up" : "Already registered? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
