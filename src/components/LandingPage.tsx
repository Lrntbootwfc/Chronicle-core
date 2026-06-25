import { motion } from "motion/react";
import { BookOpen, Shield, Sparkles, Feather, Image as ImageIcon, FileText, ArrowRight, Star } from "lucide-react";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  const testimonials = [
    {
      name: "Sienna Vance",
      role: "Creative Novelist",
      quote: "The combination of dual-layer AES-256 encryption and comic strip visualization is pure genius. Chronicle Core completely redefined how I organize my plot ideas and illustrations.",
      avatar: "✍️",
      stars: 5,
    },
    {
      name: "Elijah Chen",
      role: "Lead Software Architect",
      quote: "The built-in sketchpad and Developer mode with Markdown rendering fits my brain perfectly. Absolute masterpiece in design and engineering notes synchronization.",
      avatar: "💻",
      stars: 5,
    },
  ];

  return (
    <div id="landing-page" className="min-h-screen bg-[#0b0c0e] text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-display font-bold text-xl text-black shadow-lg shadow-orange-500/20">
            C
          </div>
          <div>
            <span className="font-display font-bold tracking-tight text-lg text-white">Chronicle Core</span>
            <span className="text-xs block text-orange-400 font-mono tracking-widest uppercase">Premium Studio Pad</span>
          </div>
        </div>
        <button
          onClick={onEnterApp}
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 font-medium text-sm text-white transition-all flex items-center gap-2 group cursor-pointer shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35"
        >
          Unseal Studio Pad
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-orange-400">
            <Sparkles className="w-3.5 h-3.5" /> SECURE DECRYPTION GRAPHIC JOURNAL
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
            Your secure logs, <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              visualized in panel cells.
            </span>
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-lg leading-relaxed">
            Write securely, doodle sketches, select daily moods, and use Gemini-optimized prompt pipelines to generate high-fidelity retro graphic novel panels. Compile your logs into sequential PDF comic books securely.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={onEnterApp}
              className="px-8 py-4 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-semibold text-base transition-all text-center flex items-center justify-center gap-2 group cursor-pointer shadow-xl shadow-orange-500/10 hover:shadow-orange-500/20"
            >
              Initialize My Vault
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-slate-300 font-medium text-base transition-all text-center"
            >
              Explore Capabilities
            </a>
          </div>

          <div className="flex items-center gap-6 pt-6 border-t border-zinc-900">
            <div>
              <div className="text-2xl font-bold font-display text-white">100%</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Client-Side Encrypted</div>
            </div>
            <div className="w-px h-8 bg-zinc-900" />
            <div>
              <div className="text-2xl font-bold font-display text-white">40+</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Visual Print Layouts</div>
            </div>
            <div className="w-px h-8 bg-zinc-900" />
            <div>
              <div className="text-2xl font-bold font-display text-white">Sequential</div>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Comic book outputs</div>
            </div>
          </div>
        </motion.div>

        {/* Visual Presentation Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent blur-3xl rounded-full" />
          <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-2xl shadow-black">
            {/* Window control layout */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-900">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/40" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <span className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <div className="px-3 py-1 rounded bg-zinc-900 text-[10px] font-mono text-zinc-500 select-none">
                CHRONICLE_MATRIX_SECURE.SH
              </div>
            </div>

            <div className="space-y-4">
              {/* Slate Pad Mockup */}
              <div className="p-4 rounded-xl bg-amber-50/5 text-amber-900/85 border border-amber-500/10 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-500/50 font-mono">
                  <span>Created: 24/06/2026</span>
                  <span>Mood: 💻 (Code)</span>
                </div>
                <h4 className="font-serif text-lg font-bold text-amber-200">Reflective Dev Log #14</h4>
                <p className="font-mono text-xs text-amber-100/60 leading-relaxed">
                  [ENCRYPTED BLOCKS SECURED] <br />
                  AES-256 local decryption in progress... <br />
                  Decrypted content: Refactoring the sequential compiler tree structure and adding MS Word toolbar shortcuts.
                </p>
              </div>

              {/* Generated Comic panel Mockup */}
              <div className="p-4 rounded-xl bg-black border-2 border-zinc-800 text-center space-y-3 shadow-lg">
                <div className="text-xs text-zinc-500 font-mono flex items-center justify-between">
                  <span>COMIC CELL OUTPUT</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 text-orange-400">100% Client Rendering</span>
                </div>
                {/* Simulated comic SVG */}
                <div className="w-full h-44 rounded-lg bg-zinc-900 flex flex-col items-center justify-center p-4 border border-zinc-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-orange-500/5 glow-active" />
                  <div className="text-3xl mb-2">👤 🎨 ⚡</div>
                  <div className="text-xs font-mono text-zinc-400">Comic Avatar: Programmer, hoodie, specs</div>
                  <div className="text-[10px] text-zinc-600 font-serif italic mt-1">"Synthesizing prompt layouts..."</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 py-20 border-t border-zinc-900/80">
        <div className="text-center space-y-4 mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            Comprehensive Workspace Features
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Every layer designed to support private engineering and creative prose writing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-4 hover:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white">Dual-Layer Encryption</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AES-256 client-side protection. Lock folders or individual files. Content decrypts exclusively in browser memory.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-4 hover:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white">MS Word Ribbon Kit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              A comprehensive Word Ribbon with text layout settings, font pairing, highlighter pickers, print margins, and bullet sets.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-4 hover:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white">Prompt Pipeline</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gemini model prompts merge character profile, text log, and selected mood vectors into high-fidelity custom comic panels.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all space-y-4 hover:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg text-white">Sequential Compiler</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Compile monthly images into continuous compiled printable PDF documents, seamlessly skipping encrypted nodes.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-zinc-950/40 border-t border-b border-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            {testimonials.map((test, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-zinc-900 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800">{test.avatar}</span>
                    <div>
                      <h4 className="font-display font-bold text-sm text-white">{test.name}</h4>
                      <p className="text-xs text-slate-500 font-mono uppercase">{test.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(test.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-400 italic leading-relaxed">
                  "{test.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-950 py-10 text-center text-xs text-slate-600 font-mono">
        <p>&copy; 2026 Chronicle Core Studio Inc. Fully Client-Side AES-256 Encrypted Memory Space.</p>
      </footer>
    </div>
  );
}
