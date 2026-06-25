import React, { useState, useEffect } from "react";
import { Send, MessageSquare, Phone, Mail, Share2, Shield, CheckCheck } from "lucide-react";
import { Personalization, JournalNode, JournalFile, JournalFolder } from "../types";

interface Message {
    id: string;
    sender: "user" | "father" | "mother" | "bot" | "writers";
    senderName: string;
    text: string;
    timestamp: string;
    sharedLog?: {
        name: string;
        content: string;
    };
}

interface MessengerProps {
    personalization: Personalization;
    vFileSystem: JournalNode[];
    onUpdatePersonalization: (updates: Partial<Personalization>) => void;
    username: string;
}

export default function Messenger({ personalization, vFileSystem, onUpdatePersonalization, username }: MessengerProps) {
    const [activeChannel, setActiveChannel] = useState<"father" | "mother" | "bot" | "writers">("bot");
    const [inputText, setInputText] = useState("");
    const [phoneInput, setPhoneInput] = useState(personalization.phoneAnchor || "");
    const [emailInput, setEmailInput] = useState(personalization.emailAnchor || "");
    const [isLinking, setIsLinking] = useState(false);

    // Default initial message logs
    const [conversations, setConversations] = useState<Record<string, Message[]>>({
        bot: [
            {
                id: "b1",
                sender: "bot",
                senderName: "Quantum AI Assistant",
                text: "System unsealed. I am ready to process your narrative inputs and secure log hashes. Feel free to draft, query, or share anything from your journal!",
                timestamp: "6/25/2026, 9:00 AM"
            }
        ],
        father: [
            {
                id: "f1",
                sender: "father",
                senderName: "Father",
                text: "Hey, just read your latest comic sketch. Keep writing, it's looking like a masterpiece! How's your comic diary progress?",
                timestamp: "6/25/2026, 8:30 AM"
            }
        ],
        mother: [
            {
                id: "m1",
                sender: "mother",
                senderName: "Mother",
                text: "Make sure you log your daily memories today. Don't forget your warm tea! Let me know if you need any inspiration.",
                timestamp: "6/25/2026, 8:45 AM"
            }
        ],
        writers: [
            {
                id: "w1",
                sender: "writers",
                senderName: "Comic Writers Guild",
                text: "Welcome to the unsealed workspace node! Here we share raw ideas, doodles, and prompt configurations.",
                timestamp: "6/25/2026, 7:15 AM"
            }
        ]
    });

    // Flat helper to extract all files
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

    const filesList = getAllFiles(vFileSystem);

    const handleLinkIdentities = () => {
        onUpdatePersonalization({
            phoneAnchor: phoneInput,
            emailAnchor: emailInput
        });
        setIsLinking(true);
        setTimeout(() => setIsLinking(false), 1200);
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: "msg_" + Date.now(),
            sender: "user",
            senderName: username || "Explorer",
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        // Update active channel conversations
        setConversations((prev) => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), newMessage]
        }));

        const queryText = inputText;
        setInputText("");

        // Trigger simulated reply after a brief offset
        setTimeout(() => {
            let replyText = "";
            let senderName = "";

            if (activeChannel === "bot") {
                senderName = "Quantum AI Assistant";
                replyText = `Understood. Analyzing narrative node parameters. Based on your profile guidelines "${personalization.avatarDesc}", this aligns with your graphic novel aesthetic! Let's continue journaling.`;
            } else if (activeChannel === "father") {
                senderName = "Father";
                replyText = personalization.fatherDesc
                    ? `That sounds aligned with how you described me: "${personalization.fatherDesc}". Keep sketching and saving those daily blocks!`
                    : `Interesting! Tell me more. By the way, make sure you configure your father character description in the comic profile panel so my avatar remains cohesive in the comic studio.`;
            } else if (activeChannel === "mother") {
                senderName = "Mother";
                replyText = personalization.motherDesc
                    ? `I'm proud of you! As per my avatar description "${personalization.motherDesc}", I am always cheering you on in your entries.`
                    : `That is delightful to hear! Be sure to add my character guidelines so we can generate cohesive visual panels together in the Daily illustrator.`;
            } else {
                senderName = "Comic Writers Guild";
                replyText = "Great entry update! Sharing and storing these records in our decentralized vault indices secures the storyline timeline.";
            }

            const botReply: Message = {
                id: "reply_" + Date.now(),
                sender: activeChannel,
                senderName: senderName,
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setConversations((prev) => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), botReply]
            }));
        }, 1000);
    };

    const handleShareLog = (file: JournalFile) => {
        const rawText = file.content.replace(/<[^>]*>/g, " ").substring(0, 150) + "...";
        const shareMsg: Message = {
            id: "share_" + Date.now(),
            sender: "user",
            senderName: username || "Explorer",
            text: `I just unsealed and shared a secure journal node: "${file.name}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            sharedLog: {
                name: file.name,
                content: rawText
            }
        };

        setConversations((prev) => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), shareMsg]
        }));

        // Bot automatic congratulations
        setTimeout(() => {
            const replyMsg: Message = {
                id: "msg_reply_" + Date.now(),
                sender: activeChannel,
                senderName: activeChannel === "bot" ? "Quantum AI Assistant" : activeChannel === "father" ? "Father" : activeChannel === "mother" ? "Mother" : "Guild Bot",
                text: `Secure ledger node shared. Verified log block integrity for "${file.name}". This adds invaluable weight to our comic sequence!`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };
            setConversations((prev) => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), replyMsg]
            }));
        }, 1200);
    };

    const currentChannelMessages = conversations[activeChannel] || [];

    const isLight = ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(personalization.outerWallpaper);

    return (
        <div className={`h-full flex flex-col md:flex-row bg-transparent overflow-hidden ${isLight ? "text-stone-850" : "text-slate-100"}`}>
            {/* 1. SECURE MESSENGER SIDEBAR */}
            <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col shrink-0 transition-colors ${isLight
                    ? "bg-white/60 backdrop-blur-md border-pink-100"
                    : "bg-zinc-950/60 backdrop-blur-md border-zinc-900"
                }`}>
                <div className={`p-4 border-b space-y-2 ${isLight ? "border-pink-100" : "border-zinc-900"}`}>
                    <div className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold ${isLight ? "text-pink-600" : "text-pink-400"}`}>
                        <Shield className="w-3.5 h-3.5" /> Secure Messenger Channels
                    </div>
                    <p className={`text-[10px] ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                        Communicate with your family and AI models to keep alignment with the diary sequence.
                    </p>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5">
                    <button
                        onClick={() => setActiveChannel("bot")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${activeChannel === "bot"
                                ? (isLight ? "bg-pink-100/80 border-pink-200 text-pink-750" : "bg-pink-500/10 border-pink-500/20 text-pink-400")
                                : (isLight ? "bg-transparent border-transparent hover:bg-pink-50/50 text-stone-600" : "bg-transparent border-transparent hover:bg-zinc-900 text-slate-400")
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono ${isLight ? "bg-pink-100 text-pink-700" : "bg-pink-500/20 text-pink-400"}`}>
                                🤖
                            </div>
                            <div className="truncate">
                                <span className={`block text-xs font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Quantum AI Assistant</span>
                                <span className={`block text-[9px] font-mono opacity-60 ${isLight ? "text-stone-500" : "text-slate-500"}`}>System Core unsealed</span>
                            </div>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1" />
                    </button>

                    <button
                        onClick={() => setActiveChannel("father")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${activeChannel === "father"
                                ? (isLight ? "bg-pink-100/80 border-pink-200 text-pink-750" : "bg-pink-500/10 border-pink-500/20 text-pink-400")
                                : (isLight ? "bg-transparent border-transparent hover:bg-pink-50/50 text-stone-600" : "bg-transparent border-transparent hover:bg-zinc-900 text-slate-400")
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 text-xs font-mono">
                                👨
                            </div>
                            <div className="truncate">
                                <span className={`block text-xs font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Father</span>
                                <span className={`block text-[9px] font-mono opacity-60 ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                                    {personalization.fatherDesc ? "Guidelines saved" : "Awaiting profile setup"}
                                </span>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveChannel("mother")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${activeChannel === "mother"
                                ? (isLight ? "bg-pink-100/80 border-pink-200 text-pink-750" : "bg-pink-500/10 border-pink-500/20 text-pink-400")
                                : (isLight ? "bg-transparent border-transparent hover:bg-pink-50/50 text-stone-600" : "bg-transparent border-transparent hover:bg-zinc-900 text-slate-400")
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 text-xs font-mono">
                                👩
                            </div>
                            <div className="truncate">
                                <span className={`block text-xs font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Mother</span>
                                <span className={`block text-[9px] font-mono opacity-60 ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                                    {personalization.motherDesc ? "Guidelines saved" : "Awaiting profile setup"}
                                </span>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveChannel("writers")}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer border ${activeChannel === "writers"
                                ? (isLight ? "bg-pink-100/80 border-pink-200 text-pink-750" : "bg-pink-500/10 border-pink-500/20 text-pink-400")
                                : (isLight ? "bg-transparent border-transparent hover:bg-pink-50/50 text-stone-600" : "bg-transparent border-transparent hover:bg-zinc-900 text-slate-400")
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-mono">
                                ✍️
                            </div>
                            <div className="truncate">
                                <span className={`block text-xs font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Comic Guild</span>
                                <span className={`block text-[9px] font-mono opacity-60 ${isLight ? "text-stone-500" : "text-slate-500"}`}>Decentralized peer node</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Verification Credentials Anchor */}
                <div className={`p-4 border-t space-y-3 ${isLight ? "bg-pink-100/20 border-pink-100" : "bg-zinc-950/40 border-zinc-900"}`}>
                    <div className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${isLight ? "text-pink-600" : "text-pink-400"}`}>
                        Secure Sign-In Anchors
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-[9px] font-mono uppercase ${isLight ? "text-stone-500" : "text-slate-500"}`}>Linked Phone Verification</label>
                        <div className="relative">
                            <Phone className="absolute left-2.5 top-2 w-3 h-3 text-slate-500" />
                            <input
                                type="text"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                placeholder="+1 (555) 019-2831"
                                className={`w-full rounded-lg text-[10px] pl-8 pr-2 py-1.5 outline-none font-mono ${isLight
                                        ? "bg-white border border-pink-100 text-stone-800 placeholder-stone-400 focus:border-pink-500"
                                        : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-750 focus:border-pink-500"
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className={`text-[9px] font-mono uppercase ${isLight ? "text-stone-500" : "text-slate-500"}`}>Gmail Address Anchor</label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2 w-3 h-3 text-slate-500" />
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="identity@gmail.com"
                                className={`w-full rounded-lg text-[10px] pl-8 pr-2 py-1.5 outline-none font-mono ${isLight
                                        ? "bg-white border border-pink-100 text-stone-800 placeholder-stone-400 focus:border-pink-500"
                                        : "bg-zinc-900 border border-zinc-800 text-slate-300 placeholder-zinc-750 focus:border-pink-500"
                                    }`}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleLinkIdentities}
                        disabled={isLinking}
                        className={`w-full py-1.5 text-[10px] font-mono uppercase tracking-widest rounded-lg border font-bold cursor-pointer flex items-center justify-center gap-1.5 ${isLight
                                ? "bg-pink-100 hover:bg-pink-200 text-pink-700 border-pink-200"
                                : "bg-zinc-900 hover:bg-zinc-800 text-slate-300 border-zinc-850"
                            }`}
                    >
                        {isLinking ? "Anchored..." : "Save Identity Anchors"}
                    </button>
                </div>
            </div>

            {/* 2. MAIN ACTIVE CONVERSATION CONTEXT */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isLight ? "bg-white/40" : "bg-[#070911]/60"}`}>
                {/* Active Header */}
                <div className={`border-b px-6 py-4 flex items-center justify-between shrink-0 ${isLight ? "bg-white/60 border-pink-100" : "bg-zinc-950/60 border-zinc-900"}`}>
                    <div>
                        <h3 className={`font-display font-semibold text-sm ${isLight ? "text-stone-900" : "text-white"}`}>
                            {activeChannel === "bot" ? "Quantum AI Assistant" : activeChannel === "father" ? "Father" : activeChannel === "mother" ? "Mother" : "Comic Guild Group"}
                        </h3>
                        <p className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                            Channel Stream secure • Decrypting End-to-End
                        </p>
                    </div>

                    <div className={`text-[9px] font-mono px-2.5 py-1 rounded border ${isLight ? "bg-pink-50 border-pink-100 text-pink-600" : "bg-zinc-900 border-zinc-800 text-pink-400"}`}>
                        UID: {username || "anonymous_vault"}
                    </div>
                </div>

                {/* Conversation Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {currentChannelMessages.map((msg) => {
                        const isMe = msg.sender === "user";
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                                <span className="text-[10px] font-mono text-slate-500">{msg.senderName}</span>
                                <div
                                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${isMe
                                            ? "bg-pink-500 text-white font-medium rounded-tr-none shadow-lg shadow-pink-500/15"
                                            : (isLight ? "bg-white text-stone-850 rounded-tl-none border border-pink-100 shadow-sm" : "bg-zinc-900 text-slate-200 rounded-tl-none border border-zinc-800/60")
                                        }`}
                                >
                                    <p>{msg.text}</p>
                                    {msg.sharedLog && (
                                        <div className={`p-3 rounded-lg border text-[10px] leading-relaxed mt-2 ${isMe
                                                ? "bg-black/10 border-black/20 text-zinc-900"
                                                : (isLight ? "bg-pink-50/50 border-pink-100 text-stone-700" : "bg-black/35 border-zinc-800/80 text-slate-300")
                                            }`}>
                                            <div className="font-bold flex items-center gap-1.5 uppercase font-mono tracking-wide mb-1">
                                                <Share2 className="w-3 h-3" /> Shared Journal: {msg.sharedLog.name}
                                            </div>
                                            <p className="italic font-serif">"{msg.sharedLog.content}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-600">
                                    <span>{msg.timestamp}</span>
                                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-pink-500/80" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. QUICK JOURNAL SHARING FLAP */}
                {filesList.length > 0 && (
                    <div className={`border-t px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 select-none ${isLight ? "bg-white/50 border-pink-100" : "bg-zinc-950/70 border-zinc-900"}`}>
                        <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 mr-1.5 ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                            Quick Share Node:
                        </span>
                        {filesList.map((file) => (
                            <button
                                key={file.id}
                                onClick={() => handleShareLog(file)}
                                title={`Share "${file.name}" to this channel`}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer shrink-0 border ${isLight
                                        ? "bg-pink-50 hover:bg-pink-100 border-pink-100 text-pink-600"
                                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-pink-400 hover:text-pink-300"
                                    }`}
                            >
                                + Share {file.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Message Input Box */}
                <div className={`p-4 border-t flex items-center gap-3 shrink-0 ${isLight ? "bg-white/60 border-pink-100" : "bg-zinc-950 border-zinc-900"}`}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder={`Send cryptographically signed message to ${activeChannel}...`}
                        className={`flex-1 rounded-xl py-3 px-4 text-xs outline-none focus:border-pink-500/50 ${isLight
                                ? "bg-stone-50 border border-pink-100 text-stone-850 placeholder-stone-400"
                                : "bg-zinc-900 border border-zinc-800 text-slate-200 placeholder-zinc-700"
                            }`}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 rounded-xl bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition-all shadow-md shadow-pink-500/10 cursor-pointer shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
