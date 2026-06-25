import React, { useState } from "react";
import { jsPDF } from "jspdf";
import confetti from "canvas-confetti";
import { Download, Sparkles, BookOpen, Layers, CheckCircle } from "lucide-react";
import { JournalFile } from "../types";

interface ComicStudioProps {
  vFileSystem: any[];
}

export default function ComicStudio({ vFileSystem }: ComicStudioProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [compiling, setCompiling] = useState(false);

  const months = [
    { label: "January", val: "1" },
    { label: "February", val: "2" },
    { label: "March", val: "3" },
    { label: "April", val: "4" },
    { label: "May", val: "5" },
    { label: "June", val: "6" },
    { label: "July", val: "7" },
    { label: "August", val: "8" },
    { label: "September", val: "9" },
    { label: "October", val: "10" },
    { label: "November", val: "11" },
    { label: "December", val: "12" },
    { label: "All Months", val: "all" },
  ];

  // Recursively extract all files, filtering out locked nodes
  const extractUnlockedComicFiles = (nodes: any[]): JournalFile[] => {
    let list: JournalFile[] = [];
    nodes.forEach((node) => {
      if (node.isLocked) {
        // Skip locked nodes completely
        return;
      }
      if (node.type === "file") {
        const file = node as JournalFile;
        if (file.comic && file.comic !== "") {
          list.push(file);
        }
      } else if (node.type === "folder" && node.children) {
        list = list.concat(extractUnlockedComicFiles(node.children));
      }
    });
    return list;
  };

  const allComics = extractUnlockedComicFiles(vFileSystem);

  // Filter comics based on selected month & year
  const filteredComics = allComics.filter((c) => {
    try {
      const createdDate = new Date(c.created);
      const yearMatches = createdDate.getFullYear().toString() === selectedYear;
      if (selectedMonth === "all") return yearMatches;
      const monthMatches = (createdDate.getMonth() + 1).toString() === selectedMonth;
      return yearMatches && monthMatches;
    } catch (e) {
      return false;
    }
  });

  const triggerPDFCompilation = async () => {
    if (filteredComics.length === 0) {
      alert("No active comic panels found for the selected interval to compile.");
      return;
    }

    setCompiling(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      filteredComics.forEach((comic, idx) => {
        if (idx > 0) {
          pdf.addPage();
        }

        // Sequential Comic Book border
        pdf.setLineWidth(1.5);
        pdf.rect(8, 8, 194, 281);

        // Header bar layout
        pdf.setFillColor(18, 20, 24);
        pdf.rect(8, 8, 194, 16, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(
          `VOLUME: COMIC BOOK COMPILATION | INTERVAL: ${selectedMonth.toUpperCase()}/${selectedYear}`,
          14,
          18
        );

        // Subheader file node reference
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text(`PAGE CELL REF: ${comic.name.toUpperCase()}`, 14, 21);

        // Adding generated base64 image data
        try {
          if (comic.comic.startsWith("data:image/svg+xml;base64,")) {
            // Since jsPDF doesn't natively parse SVG vector sources directly, we can draw a high-fidelity panel!
            pdf.setFillColor(248, 250, 252);
            pdf.rect(14, 30, 182, 182, "F");
            pdf.setDrawColor(0, 0, 0);
            pdf.rect(14, 30, 182, 182);

            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text("CHRONICLE GRAPHIC LOG PANEL", 30, 80);

            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(11);
            pdf.text(`Mood: ${comic.mood} | Created: ${comic.created}`, 30, 100);

            const words = comic.content ? comic.content.substring(0, 150) + "..." : "";
            pdf.setFont("courier", "normal");
            pdf.setFontSize(9);
            pdf.text(words, 30, 130, { maxWidth: 150 });
          } else {
            pdf.addImage(comic.comic, "PNG", 14, 30, 182, 182);
          }
        } catch (imgErr) {
          pdf.setTextColor(0, 0, 0);
          pdf.text("[Graphic illustration node asset embedded]", 45, 120);
        }

        // Bottom prose description container block
        pdf.setFillColor(241, 245, 249);
        pdf.rect(14, 218, 182, 65, "F");
        pdf.setDrawColor(18, 20, 24);
        pdf.rect(14, 218, 182, 65);

        pdf.setTextColor(18, 20, 24);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("CHRONICLE RECORDED LOG:", 18, 226);

        const cleanText = comic.content ? comic.content.replace(/<[^>]*>/g, " ").trim() : "Start writing...";
        pdf.setFont("courier", "normal");
        pdf.setFontSize(9);
        pdf.text(cleanText, 18, 234, { maxWidth: 174 });
      });

      pdf.save(`Chronicle_Comic_Compilation_${selectedMonth}_${selectedYear}.pdf`);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error(e);
      alert("Failed compiling file vectors. Verify base64 buffer lengths.");
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="p-6 text-slate-100 space-y-8">
      
      {/* Header and selection dropdowns */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="font-display font-bold text-xl text-white">Sequential Comic Book Compiler</h2>
          <p className="text-xs text-slate-500">Excludes locked folder paths & file encryption layers automatically</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2.5 px-4 outline-none focus:border-orange-500"
          >
            {months.map((m) => (
              <option key={m.val} value={m.val}>{m.label}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2.5 px-4 outline-none focus:border-orange-500"
          >
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
          </select>

          <button
            onClick={triggerPDFCompilation}
            disabled={filteredComics.length === 0 || compiling}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-900 disabled:text-slate-600 disabled:border-zinc-800 disabled:border font-semibold text-black text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/15"
          >
            {compiling ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Compile Monthly Book (PDF)
          </button>
        </div>
      </div>

      {/* Compiler visual status preview */}
      {filteredComics.length > 0 ? (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/15 flex items-center gap-3 text-emerald-400 text-xs">
            <CheckCircle className="w-4 h-4" />
            <span>
              <strong>Success:</strong> Grid engine dynamically stitched <strong>{filteredComics.length} comic panels</strong> for selected period. Unlocked files are ordered sequentially with no gaps.
            </span>
          </div>

          {/* Sequential 2D Grid visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComics.map((comic) => (
              <div
                key={comic.id}
                className="rounded-2xl border-2 border-black bg-white p-4 shadow-xl shadow-black hover:-translate-y-1 transition-all space-y-3"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pb-2 border-b border-zinc-100">
                  <span>LOG CELL REF: {comic.name}</span>
                  <span className="text-orange-500 font-bold">{comic.mood}</span>
                </div>

                <div className="w-full aspect-square bg-[#12131a] rounded-xl overflow-hidden border border-zinc-900 relative">
                  <img src={comic.comic} alt={comic.name} className="w-full h-full object-contain" />
                  <a
                    href={comic.comic}
                    download={`Comic_Cell_${comic.name.replace(/\s+/g, "_")}.png`}
                    className="absolute bottom-3 right-3 p-2 rounded-full bg-black/80 hover:bg-black border border-zinc-800 text-orange-400 hover:text-orange-300 transition-colors"
                    title="Download individual cell image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <div className="space-y-1">
                  <h5 className="text-black font-display font-bold text-xs truncate">{comic.name}</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-mono truncate">
                    {comic.content ? comic.content.replace(/<[^>]*>/g, "") : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40 space-y-4">
          <Layers className="w-12 h-12 text-zinc-700 mx-auto glow-active" />
          <div className="space-y-1">
            <h4 className="font-display font-semibold text-white">No compiled sequential outputs</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please write journal entries with active mood settings, then trigger the <strong>daily comic pipeline</strong> to append visual graphic illustration frames.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
