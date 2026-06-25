import React, { useRef, useState, useEffect } from "react";
import { Paintbrush, Eraser, Trash2, CheckCircle, Sparkles, Download, ArrowUpRight } from "lucide-react";

interface DoodleCanvasProps {
  onSaveDoodle: (base64: string) => void;
  onClose: () => void;
  initialDataUrl?: string;
}

export default function DoodleCanvas({ onSaveDoodle, onClose, initialDataUrl }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#00ffcc"); // Neon blue/cyan by default
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");

  // Colors designed for a blackboard / sketching visual
  const colors = [
    { name: "Cyan", val: "#00ffcc" },
    { name: "Green", val: "#39ff14" },
    { name: "Pink", val: "#ff007f" },
    { name: "Amber", val: "#ffb703" },
    { name: "White", val: "#ffffff" },
    { name: "Red", val: "#ef4444" },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill the canvas with a dark chalkboard color initially
    ctx.fillStyle = "#12131a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If initial data is present, draw it on the canvas
    if (initialDataUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialDataUrl;
    }
  }, [initialDataUrl]);

  // Handle drawing movements
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    const coords = getEventCoords(e, canvas);
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = tool === "eraser" ? "#12131a" : brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getEventCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#12131a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/png");
    onSaveDoodle(base64);
    alert("Doodle doodle canvas saved and attached to current journal page! ✨");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-3xl p-6 shadow-2xl shadow-black space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="font-display font-bold text-base text-white">Integrated Whiteboard Studio</h3>
            <span className="text-[9px] font-mono bg-zinc-900 text-slate-500 px-1.5 py-0.5 rounded uppercase">Drawing Canvas</span>
          </div>
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">
            Cancel
          </button>
        </div>

        {/* Control toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-4">
            {/* Tool picker */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setTool("brush")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs ${
                  tool === "brush" ? "bg-orange-500 text-black font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" /> Draw
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`p-1.5 rounded-md flex items-center gap-1.5 text-xs ${
                  tool === "eraser" ? "bg-orange-500 text-black font-semibold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eraser className="w-3.5 h-3.5" /> Eraser
              </button>
            </div>

            {/* Neon colors */}
            {tool === "brush" && (
              <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800/60">
                {colors.map((c) => (
                  <button
                    key={c.val}
                    onClick={() => setBrushColor(c.val)}
                    style={{ backgroundColor: c.val }}
                    className={`w-5 h-5 rounded-full transition-all border-2 ${
                      brushColor === c.val ? "border-slate-100 scale-110" : "border-transparent"
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Brush size slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Size</span>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24 accent-orange-500 cursor-pointer h-1 rounded bg-zinc-800"
              />
              <span className="text-xs font-mono text-slate-400 w-4">{brushSize}px</span>
            </div>

            {/* Clear board */}
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-zinc-900 transition-colors"
              title="Clear Blackboard"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HTML5 Canvas Area */}
        <div className="relative border-4 border-zinc-900 rounded-xl overflow-hidden shadow-inner bg-[#12131a] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={380}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="cursor-crosshair max-w-full block"
          />
        </div>

        {/* Save button overlays */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
          <div className="text-xs text-slate-500 font-mono">
            * This vector draft can be optionally passed as an image-to-image base layer!
          </div>
          <button
            onClick={saveCanvas}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-black font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
          >
            <CheckCircle className="w-4 h-4" /> Save & Attach to Pad
          </button>
        </div>

      </div>
    </div>
  );
}
