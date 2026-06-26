import React, { useState } from "react";
import { ShieldAlert, Key, User, ArrowRight, CheckCircle, Sparkles, Mail, ShieldCheck, Check } from "lucide-react";
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

  // Streamlined SignUp Wizard States
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpOtp, setSignUpOtp] = useState("");
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [testOtpHint, setTestOtpHint] = useState(""); // Facilitates sandbox verification copy-pasting

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failure");
      }

      onLoginSuccess({
        username: data.username,
        fs_tree: data.fs_tree || [],
        avatar_desc: data.avatar_desc || ""
      });
    } catch (err: any) {
      setError(err.message || "Failed to reach security ledger database");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signUpEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate verification");
      }

      setSuccessMsg(data.message);
      if (data.otp) {
        setTestOtpHint(data.otp);
      }
      setSignUpStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signUpEmail, code: signUpOtp })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccessMsg(data.message);
      setSignUpStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Register Identity
  const handleRegisterIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register-identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpEmail,
          username: signUpUsername,
          password: signUpPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to register profile");
      }

      // Automatically sign the user in!
      onLoginSuccess({
        username: data.username,
        fs_tree: data.fs_tree || [],
        avatar_desc: data.avatar_desc || ""
      });
    } catch (err: any) {
      setError(err.message || "Error finalizing secure credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-hub" className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#0b0c10] via-[#1f1225] to-[#0c0a1a] text-slate-100 w-full">
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
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-pink-500/10 border-2 border-pink-500/30 items-center justify-center text-pink-500 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-white uppercase">
            {isLogin ? "Unseal Comic Diary" : "Streamlined Registration"}
          </h2>
          <p className="text-xs text-pink-400 font-mono tracking-widest uppercase font-semibold">
            {isLogin ? "AES-256 SECURE VAULT CONTAINER" : `STEP ${signUpStep} OF 3: ONBOARDING VERIFICATION`}
          </p>
        </div>

        {/* Progress indicators for sign up */}
        {!isLogin && (
          <div className="flex items-center justify-between mb-6 px-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-pink-500">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep >= 1 ? "bg-pink-500 text-black" : "bg-zinc-800 text-slate-400"}`}>
                {signUpStep > 1 ? <Check className="w-3 h-3" /> : "1"}
              </span>
              <span className={signUpStep === 1 ? "text-pink-400 font-bold" : "text-slate-500"}>Email</span>
            </div>
            <div className="w-8 h-0.5 bg-zinc-800" />
            <div className="flex items-center gap-1.5 font-semibold">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep >= 2 ? "bg-pink-500 text-black" : "bg-zinc-800 text-slate-400"}`}>
                {signUpStep > 2 ? <Check className="w-3 h-3" /> : "2"}
              </span>
              <span className={signUpStep === 2 ? "text-pink-400 font-bold" : "text-slate-500"}>OTP</span>
            </div>
            <div className="w-8 h-0.5 bg-zinc-800" />
            <div className="flex items-center gap-1.5 font-semibold">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${signUpStep >= 3 ? "bg-pink-500 text-black" : "bg-zinc-800 text-slate-400"}`}>
                3
              </span>
              <span className={signUpStep === 3 ? "text-pink-400 font-bold" : "text-slate-500"}>Identity</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 flex items-start gap-3 text-red-300 text-xs mb-6">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-xs mb-6 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* 1. LOGIN MODE */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
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
                  placeholder="•••••••••••••"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
                />
              </div>
              <span className="text-[10px] text-zinc-500 block leading-tight pt-1">
                Demo access available: Use <span className="text-zinc-300 font-mono">admin</span> & <span className="text-zinc-300 font-mono">password123</span>
              </span>
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
                  UNSEAL MY COMIC VAULT
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. SIGNUP WIZARD MODES */
          <div className="space-y-5">
            {/* STEP 1: INPUT EMAIL */}
            {signUpStep === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Welcome to the secure diary pipeline. Enter your active email address. We will dispatch a secure verification OTP to authorize your ledger space.
                  </p>
                  <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
                    Secure Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. pilot@secure-vault.io"
                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !signUpEmail.includes("@")}
                  className="w-full py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      DISPATCH OTP CODE
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY OTP CODE */}
            {signUpStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A One-Time Password has been dispatched. Enter the 6-digit numeric security code below to verify ownership.
                  </p>

                  {testOtpHint && (
                    <div className="p-3 bg-pink-950/20 border-2 border-dashed border-pink-500/30 rounded-xl text-center">
                      <p className="text-[10px] font-mono text-pink-400 uppercase tracking-widest font-bold">
                        🔒 Dev-Server Mail Intercepted
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Testing OTP Code: <strong className="text-white font-mono text-base tracking-wider bg-black/60 px-2 py-0.5 rounded border border-zinc-800 ml-1">{testOtpHint}</strong>
                      </p>
                    </div>
                  )}

                  <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={signUpOtp}
                      onChange={(e) => setSignUpOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="Enter 6-digit code..."
                      className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all text-center tracking-[0.4em] font-mono text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpStep(1);
                      setSuccessMsg("");
                      setError("");
                    }}
                    className="flex-1 py-3.5 rounded-xl border-2 border-zinc-800 hover:bg-zinc-900 text-xs text-slate-400 font-bold transition-all cursor-pointer"
                  >
                    BACK
                  </button>
                  <button
                    type="submit"
                    disabled={loading || signUpOtp.length < 6}
                    className="flex-[2] py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        VERIFY SECURITY CODE
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CONFIGURE UNIQUE USERNAME & PASSCODE */}
            {signUpStep === 3 && (
              <form onSubmit={handleRegisterIdentity} className="space-y-4">
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your email is successfully authorized! Now, select your globally unique public username and high-entropy master passcode.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
                      Globally Unique Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={signUpUsername}
                        onChange={(e) => setSignUpUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                        placeholder="Select dynamic username..."
                        className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      This serves as your public messenger ID and cannot contain spaces.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-pink-300 uppercase font-semibold block">
                      Secure Entry Passcode
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="•••••••••••••"
                        className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-zinc-600 outline-none focus:border-pink-500 focus:bg-zinc-900/95 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !signUpUsername || !signUpPassword}
                  className="w-full py-3.5 rounded-xl bg-pink-500 hover:bg-pink-600 disabled:bg-zinc-800 disabled:text-slate-500 text-black font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-pink-500/15"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      UNSEAL SECURE VAULT
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSignUpStep(1);
              setError("");
              setSuccessMsg("");
              setTestOtpHint("");
            }}
            className="text-xs text-pink-400 hover:text-pink-300 font-bold transition-all"
          >
            {isLogin ? "Join the ledger space (Sign Up OTP)" : "Registered before? Unseal Space here"}
          </button>
        </div>
      </div>
    </div>
  );
}
