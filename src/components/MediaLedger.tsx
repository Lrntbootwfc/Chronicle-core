import React, { useState, useEffect } from "react";
import {
    BookOpen, Film, Star, Trash2, Plus, Search, ChevronRight, X, Sparkles, Smile, Users, Heart, Bookmark, Eye, Edit2, Check
} from "lucide-react";
import { Personalization } from "../types";

interface MediaItem {
    id: string;
    title: string;
    creator: string; // Author or Director
    type: "book" | "movie";
    year: string;
    coverUrl: string;
    rating: number; // 1-5
    oneLiner: string;
    detailedNotes: string;
    mood: string;
    characters: string[]; // Linked characters
    createdDate: string;
    dateRead?: string; // date completed/read
}

interface MediaLedgerProps {
    personalization: Personalization;
    vFileSystem?: any[];
}

export default function MediaLedger({ personalization }: MediaLedgerProps) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "book" | "movie">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

    // Form states
    const [newTitle, setNewTitle] = useState("");
    const [newCreator, setNewCreator] = useState("");
    const [newType, setNewType] = useState<"book" | "movie">("book");
    const [newYear, setNewYear] = useState("");
    const [newCoverUrl, setNewCoverUrl] = useState("");
    const [newRating, setNewRating] = useState(5);
    const [newOneLiner, setNewOneLiner] = useState("");
    const [newDetailedNotes, setNewDetailedNotes] = useState("");
    const [newMood, setNewMood] = useState("✨");
    const [newCharacters, setNewCharacters] = useState<string[]>([]);
    const [newDateRead, setNewDateRead] = useState(() => {
        return new Date().toISOString().split("T")[0];
    });

    // List of pre-installed characters for mapping (or they can enter custom ones)
    const availableCharacters = ["Self", "Father", "Mother", "Best Friend", "Rival", "Mentor"];

    // Predefined mood options
    const moodOptions = ["✨", "❤️", "😊", "🤯", "😭", "🕵️", "🚀", "🎨", "🍀", "👻", "🔥", "💤", "🍕"];

    // Determine light mode based on wallpaper theme
    const isLight = ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(personalization.outerWallpaper);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("comic_diary_media_ledger");
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse media items", e);
            }
        } else {
            // Seed some starter media items for an immediate rich experience
            const starterItems: MediaItem[] = [
                {
                    id: "m_1",
                    title: "Dune: Part Two",
                    creator: "Denis Villeneuve",
                    type: "movie",
                    year: "2024",
                    coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=300",
                    rating: 5,
                    oneLiner: "A towering cinematic masterpiece of prophecy and desert power!",
                    detailedNotes: "The sound design was absolutely thunderous. Timothée Chalamet gives a haunting performance showing the tragic trap of prophecy. The black and white gladiatorial sequence is visually breathtaking.",
                    mood: "🤯",
                    characters: ["Self", "Mentor"],
                    createdDate: new Date().toLocaleDateString(),
                    dateRead: "2026-01-15"
                },
                {
                    id: "m_2",
                    title: "Tomorrow, and Tomorrow, and Tomorrow",
                    creator: "Gabrielle Zevin",
                    type: "book",
                    year: "2022",
                    coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=300",
                    rating: 5,
                    oneLiner: "A gorgeous, heartbreaking tribute to creative collaboration and game design.",
                    detailedNotes: "Follows Sam and Sadie over 30 years as they become superstar video game developers. It captures the pure magic of game development, coding, and the complex tragedy of human friendship perfectly.",
                    mood: "🎨",
                    characters: ["Self", "Best Friend"],
                    createdDate: new Date().toLocaleDateString(),
                    dateRead: "2026-02-10"
                }
            ];
            setItems(starterItems);
            localStorage.setItem("comic_diary_media_ledger", JSON.stringify(starterItems));
        }
    }, []);

    // Save to localStorage
    const saveItems = (updated: MediaItem[]) => {
        setItems(updated);
        localStorage.setItem("comic_diary_media_ledger", JSON.stringify(updated));
    };

    const handleCreateMedia = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newCreator.trim()) {
            alert("Please enter a title and creator/director.");
            return;
        }

        const newItem: MediaItem = {
            id: "media_" + Date.now(),
            title: newTitle.trim(),
            creator: newCreator.trim(),
            type: newType,
            year: newYear.trim() || new Date().getFullYear().toString(),
            coverUrl: newCoverUrl.trim() || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=300",
            rating: newRating,
            oneLiner: newOneLiner.trim() || "An interesting piece of art.",
            detailedNotes: newDetailedNotes.trim(),
            mood: newMood,
            characters: newCharacters,
            createdDate: new Date().toLocaleDateString(),
            dateRead: newDateRead || new Date().toISOString().split("T")[0]
        };

        const next = [newItem, ...items];
        saveItems(next);

        // Reset Form
        setNewTitle("");
        setNewCreator("");
        setNewYear("");
        setNewCoverUrl("");
        setNewRating(5);
        setNewOneLiner("");
        setNewDetailedNotes("");
        setNewMood("✨");
        setNewCharacters([]);
        setNewDateRead(new Date().toISOString().split("T")[0]);
        setShowAddForm(false);
    };

    const handleDeleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletePendingId(id);
    };

    const executeDeleteItem = (id: string) => {
        const next = items.filter(item => item.id !== id);
        saveItems(next);
        if (selectedItem?.id === id) {
            setSelectedItem(null);
        }
        setDeletePendingId(null);
    };

    const toggleCharacterLink = (char: string) => {
        if (newCharacters.includes(char)) {
            setNewCharacters(newCharacters.filter(c => c !== char));
        } else {
            setNewCharacters([...newCharacters, char]);
        }
    };

    // Filter and search
    const filteredItems = items.filter(item => {
        const matchesTab = activeFilter === "all" || item.type === activeFilter;
        const matchesSearch = searchQuery.trim() === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.oneLiner.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.detailedNotes.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">

            {/* Header and Add Trigger */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/20 pb-6">
                <div>
                    <h2 className={`font-display font-black text-2xl tracking-tight flex items-center gap-2 ${isLight ? "text-stone-950" : "text-white"
                        }`}>
                        <BookOpen className="w-6 h-6 text-pink-500" />
                        Media Review Ledger
                    </h2>
                    <p className={`text-xs mt-1 font-sans ${isLight ? "text-stone-600" : "text-slate-400"}`}>
                        Track and rate watched films, cinematic spectacles, and literary adventures. Link with characters and diary moods.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${showAddForm
                            ? "bg-zinc-800 text-white"
                            : "bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/25"
                        }`}
                >
                    {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showAddForm ? "Close Form" : "Log Book / Movie"}
                </button>
            </div>

            {/* Form Area */}
            {showAddForm && (
                <form onSubmit={handleCreateMedia} className={`p-6 rounded-2xl border transition-all ${isLight ? "bg-white border-pink-100 shadow-md" : "bg-zinc-950/60 border-zinc-900 shadow-xl"
                    }`}>
                    <div className="flex items-center gap-2 mb-4 border-b pb-3 border-zinc-850">
                        <Sparkles className="w-4 h-4 text-pink-500" />
                        <h3 className={`font-display font-bold text-sm ${isLight ? "text-stone-900" : "text-white"}`}>
                            Log New Book or Cinematic Spectacle
                        </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* Type Switcher */}
                            <div className="space-y-1">
                                <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Media Class</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewType("book")}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${newType === "book"
                                                ? "bg-pink-500 text-white shadow"
                                                : isLight ? "bg-stone-100 hover:bg-stone-200 text-stone-700" : "bg-zinc-900 hover:bg-zinc-800 text-slate-300"
                                            }`}
                                    >
                                        <BookOpen className="w-3.5 h-3.5" /> Book
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewType("movie")}
                                        className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${newType === "movie"
                                                ? "bg-pink-500 text-white shadow"
                                                : isLight ? "bg-stone-100 hover:bg-stone-200 text-stone-700" : "bg-zinc-900 hover:bg-zinc-800 text-slate-300"
                                            }`}
                                    >
                                        <Film className="w-3.5 h-3.5" /> Movie
                                    </button>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={newType === "book" ? "E.g. Neuromancer" : "E.g. Blade Runner 2049"}
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                />
                            </div>

                            {/* Creator / Author */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                                    {newType === "book" ? "Author / Novelist" : "Director / Filmmaker"}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder={newType === "book" ? "E.g. William Gibson" : "E.g. Denis Villeneuve"}
                                    value={newCreator}
                                    onChange={(e) => setNewCreator(e.target.value)}
                                    className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Year */}
                                <div className="space-y-1">
                                    <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Release Year</label>
                                    <input
                                        type="text"
                                        placeholder="E.g. 1984"
                                        value={newYear}
                                        onChange={(e) => setNewYear(e.target.value)}
                                        className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                            }`}
                                    />
                                </div>

                                {/* Rating */}
                                <div className="space-y-1">
                                    <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Star Score</label>
                                    <select
                                        value={newRating}
                                        onChange={(e) => setNewRating(parseInt(e.target.value))}
                                        className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                            }`}
                                    >
                                        <option value={5}>⭐⭐⭐⭐⭐ (Masterpiece)</option>
                                        <option value={4}>⭐⭐⭐⭐ (Great Watch/Read)</option>
                                        <option value={3}>⭐⭐⭐ (Enjoyable / Solid)</option>
                                        <option value={2}>⭐⭐ (Mediocre)</option>
                                        <option value={1}>⭐ (Disappointing)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cover URL */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Cover Poster Image URL</label>
                                <input
                                    type="url"
                                    placeholder="E.g. https://images.unsplash.com/... or leave empty"
                                    value={newCoverUrl}
                                    onChange={(e) => setNewCoverUrl(e.target.value)}
                                    className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                />
                            </div>

                            {/* Date Read / Watched */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>When was this Read / Watched?</label>
                                <input
                                    type="date"
                                    value={newDateRead}
                                    onChange={(e) => setNewDateRead(e.target.value)}
                                    className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Mood selector */}
                            <div className="space-y-1.5">
                                <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Linked Story Mood</span>
                                <div className="flex flex-wrap gap-1.5 p-2 bg-black/10 rounded-xl border border-zinc-800/40">
                                    {moodOptions.map((mood) => (
                                        <button
                                            key={mood}
                                            type="button"
                                            onClick={() => setNewMood(mood)}
                                            className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${newMood === mood
                                                    ? "bg-pink-500 text-white scale-110 shadow"
                                                    : "hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            {mood}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Link character */}
                            <div className="space-y-1.5">
                                <span className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Linked Character Alliances</span>
                                <div className="flex flex-wrap gap-2">
                                    {availableCharacters.map((char) => {
                                        const isLinked = newCharacters.includes(char);
                                        return (
                                            <button
                                                key={char}
                                                type="button"
                                                onClick={() => toggleCharacterLink(char)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1 border ${isLinked
                                                        ? "bg-pink-500/25 border-pink-500 text-pink-400 font-bold"
                                                        : isLight
                                                            ? "bg-stone-100 border-stone-200 text-stone-600 hover:bg-stone-200"
                                                            : "bg-zinc-900/40 border-zinc-800 text-slate-400 hover:bg-zinc-800/60"
                                                    }`}
                                            >
                                                {isLinked && <Check className="w-3 h-3" />}
                                                {char}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* One-Liner */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>One-Liner Hook Review</label>
                                <input
                                    type="text"
                                    placeholder="E.g. Deeply philosophical and visually spectacular!"
                                    value={newOneLiner}
                                    onChange={(e) => setNewOneLiner(e.target.value)}
                                    className={`w-full text-xs rounded-xl py-2.5 px-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                />
                            </div>

                            {/* Detailed review */}
                            <div className="space-y-1">
                                <label className={`text-[10px] font-mono uppercase font-bold ${isLight ? "text-stone-500" : "text-slate-500"}`}>Detailed Thoughts / Journal Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Draft your full aesthetic summary, emotional notes, and creative takeaways..."
                                    value={newDetailedNotes}
                                    onChange={(e) => setNewDetailedNotes(e.target.value)}
                                    className={`w-full text-xs rounded-xl p-3 outline-none border resize-none focus:border-pink-500/50 transition-colors ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-900/60 border-zinc-800 text-slate-300"
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800/20">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${isLight ? "bg-stone-100 hover:bg-stone-200 text-stone-700" : "bg-zinc-900 hover:bg-zinc-800 text-slate-400"
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-pink-500/20"
                        >
                            Post Media Log
                        </button>
                    </div>
                </form>
            )}

            {/* Main Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Toggle Filters */}
                <div className={`p-1 rounded-xl flex items-center gap-1 border ${isLight ? "bg-stone-100 border-pink-100/50" : "bg-zinc-950/40 border-zinc-900"
                    }`}>
                    {(["all", "book", "movie"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeFilter === tab
                                    ? "bg-pink-500 text-white shadow-md shadow-pink-500/15"
                                    : isLight ? "text-stone-500 hover:text-stone-800" : "text-slate-400 hover:text-slate-200"
                                }`}
                        >
                            {tab === "all" ? "All Media" : tab === "book" ? "Books 📚" : "Movies 🎬"}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative max-w-xs w-full">
                    <Search className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${isLight ? "text-stone-400" : "text-slate-500"}`} />
                    <input
                        type="text"
                        placeholder="Search media titles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full text-xs rounded-xl py-2 pl-9 pr-3 outline-none border focus:border-pink-500/50 transition-colors ${isLight
                                ? "bg-white/80 border-pink-100 text-stone-900 placeholder-stone-400"
                                : "bg-zinc-950/60 border-zinc-900 text-slate-300 placeholder-zinc-700"
                            }`}
                    />
                </div>
            </div>

            {/* Bento Grid layout sorted chronologically by month (January to December) */}
            {(() => {
                const MONTH_NAMES = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];

                const formatDateNice = (dateStr?: string) => {
                    if (!dateStr) return "Unknown Date";
                    try {
                        const d = new Date(dateStr + "T00:00:00");
                        if (isNaN(d.getTime())) return dateStr;
                        return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                    } catch (e) {
                        return dateStr;
                    }
                };

                const groupedByMonth: Record<string, MediaItem[]> = {};
                MONTH_NAMES.forEach((m) => {
                    groupedByMonth[m] = [];
                });
                groupedByMonth["Other Logs"] = [];

                filteredItems.forEach((item) => {
                    let monthName = "Other Logs";
                    if (item.dateRead) {
                        try {
                            const d = new Date(item.dateRead + "T00:00:00");
                            if (!isNaN(d.getTime())) {
                                monthName = MONTH_NAMES[d.getMonth()];
                            }
                        } catch (e) { }
                    }
                    groupedByMonth[monthName].push(item);
                });

                const sortedMonthKeys = [
                    ...MONTH_NAMES,
                    "Other Logs"
                ].filter((m) => groupedByMonth[m] && groupedByMonth[m].length > 0);

                if (filteredItems.length === 0) {
                    return (
                        <div className={`p-12 text-center col-span-full border border-dashed rounded-3xl text-xs font-mono ${isLight ? "border-pink-200 bg-white/30 text-stone-500" : "border-zinc-900 bg-zinc-950/20 text-slate-600"
                            }`}>
                            <BookOpen className="w-12 h-12 mx-auto text-zinc-800 mb-3" />
                            No logged books or movies match your filter or search query.
                        </div>
                    );
                }

                return (
                    <div className="space-y-12">
                        {sortedMonthKeys.map((month) => (
                            <div key={month} className="space-y-5 text-left">
                                <div className="flex items-center gap-3 border-b border-zinc-800/20 pb-2">
                                    <span className="text-lg font-black font-display text-white tracking-tight">{month} Logs</span>
                                    <span className="text-[10px] font-mono bg-zinc-900 text-pink-400 px-2.5 py-0.5 rounded-full border border-zinc-800 font-bold">
                                        {groupedByMonth[month].length} {groupedByMonth[month].length === 1 ? "Item" : "Items"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedByMonth[month].map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`group rounded-2xl overflow-hidden border cursor-pointer relative flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl ${isLight
                                                    ? "bg-white border-pink-150/40 hover:border-pink-400 shadow-md shadow-pink-900/5 text-stone-800"
                                                    : "bg-zinc-950/40 border-zinc-900/60 hover:border-pink-900/40 text-slate-200"
                                                }`}
                                        >
                                            {/* Media type banner overlay */}
                                            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-zinc-800/50">
                                                {item.type === "book" ? (
                                                    <BookOpen className="w-3 h-3 text-pink-400" />
                                                ) : (
                                                    <Film className="w-3 h-3 text-orange-400" />
                                                )}
                                                <span className="text-[9px] font-mono font-bold text-slate-200 uppercase tracking-widest">{item.type}</span>
                                            </div>

                                            {/* Delete button */}
                                            <button
                                                onClick={(e) => handleDeleteItem(item.id, e)}
                                                className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 hover:bg-red-500/20 hover:text-red-400 border border-zinc-800/40 text-slate-400 transition-colors"
                                                title="Remove entry"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Cover Artwork Header */}
                                            <div className="h-44 overflow-hidden relative bg-zinc-900 shrink-0">
                                                <img
                                                    src={item.coverUrl}
                                                    alt={item.title}
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                                {/* Title and year Overlay */}
                                                <div className="absolute bottom-3 left-4 right-4 text-left">
                                                    <span className="text-[10px] font-mono text-pink-400 font-bold">{item.year}</span>
                                                    <h4 className="font-display font-black text-sm text-white tracking-tight line-clamp-1 group-hover:text-pink-400 transition-colors">
                                                        {item.title}
                                                    </h4>
                                                </div>
                                            </div>

                                            {/* Body Details */}
                                            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                                <div className="space-y-1 text-left">
                                                    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500">
                                                        <span>By:</span>
                                                        <span className="text-zinc-400 font-semibold truncate">{item.creator}</span>
                                                    </div>

                                                    {/* Date description */}
                                                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
                                                        <span>Completed:</span>
                                                        <span>{formatDateNice(item.dateRead)}</span>
                                                    </div>

                                                    <p className={`text-xs italic leading-relaxed line-clamp-2 mt-1.5 ${isLight ? "text-stone-600" : "text-slate-400"
                                                        }`}>
                                                        "{item.oneLiner}"
                                                    </p>
                                                </div>

                                                {/* Rating stars, mood and tags footer */}
                                                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/25 text-xs shrink-0">
                                                    <div className="flex items-center gap-0.5">
                                                        {Array.from({ length: 5 }).map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-3 h-3 ${i < item.rating
                                                                        ? "fill-amber-400 text-amber-400"
                                                                        : "text-zinc-700"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {item.characters.length > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-slate-300">
                                                                👤 {item.characters[0]}
                                                            </span>
                                                        )}
                                                        <span className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center text-xs">
                                                            {item.mood}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Details Lightbox Overlay Drawer */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div
                        className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative border ${isLight ? "bg-white border-pink-100 text-stone-900" : "bg-zinc-950 border-zinc-900 text-slate-100"
                            }`}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="grid md:grid-cols-5 h-full">
                            {/* Cover layout */}
                            <div className="col-span-2 bg-zinc-900 relative min-h-[250px] md:h-full">
                                <img
                                    src={selectedItem.coverUrl}
                                    alt={selectedItem.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                                <div className="absolute bottom-4 left-4 z-10">
                                    <div className="flex items-center gap-1.5 bg-pink-500 text-white px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-black mb-1 w-max">
                                        {selectedItem.type}
                                    </div>
                                    <span className="text-xs font-mono text-zinc-400">{selectedItem.year}</span>
                                </div>
                            </div>

                            {/* Review details */}
                            <div className="col-span-3 p-6 flex flex-col justify-between space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className={`font-display font-black text-xl tracking-tight leading-tight ${isLight ? "text-stone-950" : "text-white"}`}>
                                            {selectedItem.title}
                                        </h3>
                                        <p className="text-xs text-zinc-400 font-semibold font-mono mt-1">
                                            {selectedItem.type === "book" ? "Written by:" : "Directed by:"} {selectedItem.creator}
                                        </p>
                                    </div>

                                    {/* Rating Stars */}
                                    <div className="flex items-center gap-1.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < selectedItem.rating
                                                        ? "fill-amber-400 text-amber-400"
                                                        : "text-zinc-700"
                                                    }`}
                                            />
                                        ))}
                                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold ml-1">
                                            ({selectedItem.rating}/5 stars)
                                        </span>
                                    </div>

                                    {/* Completed On read/watch date */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Completed On:</span>
                                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                                            {selectedItem.dateRead ? new Date(selectedItem.dateRead + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Unknown Date"}
                                        </span>
                                    </div>

                                    {/* One Liner review */}
                                    <div className="p-3 rounded-xl border border-dashed border-zinc-800/40 bg-zinc-900/10 italic text-xs leading-relaxed">
                                        "{selectedItem.oneLiner}"
                                    </div>

                                    {/* Detailed notes */}
                                    {selectedItem.detailedNotes && (
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold tracking-wider">Detailed Journal Thoughts</span>
                                            <p className={`text-xs leading-relaxed max-h-48 overflow-y-auto pr-1 ${isLight ? "text-stone-700" : "text-slate-300"
                                                }`}>
                                                {selectedItem.detailedNotes}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Meta details footer */}
                                <div className="pt-4 border-t border-zinc-800/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    {/* Linked characters */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Characters:</span>
                                        {selectedItem.characters.length === 0 ? (
                                            <span className="text-[9px] text-zinc-600 font-mono">None linked</span>
                                        ) : (
                                            selectedItem.characters.map((char) => (
                                                <span key={char} className="px-2 py-0.5 rounded bg-zinc-900 text-pink-400 font-semibold font-mono text-[9px] border border-zinc-800">
                                                    👤 {char}
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    {/* Mood */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Diary Mood:</span>
                                        <span className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-sm border border-zinc-800">
                                            {selectedItem.mood}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deletePendingId && (() => {
                const targetItem = items.find(item => item.id === deletePendingId);
                return (
                    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999]">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                            <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                                ⚠️ Remove Media Entry
                            </h3>
                            <p className="text-xs text-slate-400 font-sans leading-relaxed">
                                Are you sure you want to remove <span className="text-pink-400 font-semibold">"{targetItem?.title || "this item"}"</span> from your journal review log?
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
                                            executeDeleteItem(deletePendingId);
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
}
