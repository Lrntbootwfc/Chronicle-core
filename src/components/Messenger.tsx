import React, { useState, useEffect } from "react";
import {
    Send, MessageSquare, Phone, Mail, Share2, Shield, CheckCheck,
    Plus, Users, Sparkles, Smile, Image as ImageIcon, Clock, X, Heart, Trash2, Search, Check, Smartphone, Key
} from "lucide-react";
import { Personalization, JournalNode, JournalFile, JournalFolder } from "../types";

interface Message {
    id: string;
    sender: string;
    senderName: string;
    text: string;
    timestamp: string;
    sharedLog?: {
        name: string;
        content: string;
    };
    sticker?: string;
}

interface StatusItem {
    id: string;
    type: "text" | "comic" | "media";
    content: string;
    bgStyle?: string; // For text-only statuses (gradient or color class)
    createdAt: string;
}

interface StatusUpdate {
    creatorId: string;
    creatorName: string;
    creatorAvatar: string;
    items: StatusItem[];
}

interface Contact {
    id: string;
    name: string;
    username: string;
    phone: string;
    email: string;
    avatar: string;
    status: string;
    type: "individual" | "group" | "bot";
}

interface MessengerProps {
    personalization: Personalization;
    vFileSystem: JournalNode[];
    onUpdatePersonalization: (updates: Partial<Personalization>) => void;
    username: string;
}

// Circular SVG renderer that breaks the border ring into N segments based on WhatsApp's status rings
function StatusRingAvatar({
    items,
    size = 48,
    avatar,
    onClick
}: {
    items: StatusItem[];
    size: number;
    avatar: string;
    onClick?: () => void
}) {
    const count = items.length;
    if (count === 0) {
        return (
            <div onClick={onClick} className="relative cursor-pointer shrink-0" style={{ width: size, height: size }}>
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-lg select-none">
                    {avatar}
                </div>
            </div>
        );
    }

    // If 1 status, simple continuous ring
    if (count === 1) {
        return (
            <div
                onClick={onClick}
                className="relative cursor-pointer shrink-0 p-0.5 rounded-full border-2 border-emerald-500 transition-transform hover:scale-105 active:scale-95"
                style={{ width: size, height: size }}
            >
                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-lg overflow-hidden select-none">
                    {avatar}
                </div>
            </div>
        );
    }

    // Calculate SVG arc parameters for multiple segments
    const radius = (size - 4) / 2;
    const circumference = 2 * Math.PI * radius;
    const gap = 3; // Gap size in pixels
    const totalGapLength = count * gap;
    const activeCircumference = circumference - totalGapLength;
    const segmentLength = activeCircumference / count;
    const strokeDash = `${segmentLength} ${gap}`;

    return (
        <div
            onClick={onClick}
            className="relative cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
            style={{ width: size, height: size }}
        >
            <svg className="absolute inset-0 rotate-[-90deg]" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke="#10b981" // emerald-500
                    strokeWidth="2.5"
                    strokeDasharray={strokeDash}
                />
            </svg>
            <div className="absolute inset-1 rounded-full bg-zinc-800 flex items-center justify-center text-lg overflow-hidden select-none">
                {avatar}
            </div>
        </div>
    );
}

export default function Messenger({ personalization, vFileSystem, onUpdatePersonalization, username }: MessengerProps) {
    // Onboarding verification steps state:
    // 0 -> fully verified / setup bypassed, 1 -> Email signup, 2 -> OTP validation, 3 -> claim unique username
    const [verificationStep, setVerificationStep] = useState<number>(() => {
        // If we have an email and phone saved, we can skip onboarding. Otherwise guide user!
        if (personalization.emailAnchor && personalization.phoneAnchor) {
            return 0;
        }
        return 1; // start with onboarding
    });

    const [onboardEmail, setOnboardEmail] = useState("");
    const [onboardOTP, setOnboardOTP] = useState("");
    const [onboardUsername, setOnboardUsername] = useState(username || "");
    const [onboardPhone, setOnboardPhone] = useState("");
    const [otpSentCode, setOtpSentCode] = useState("");
    const [otpError, setOtpError] = useState("");
    const [usernameError, setUsernameError] = useState("");

    // Search states
    const [searchQuery, setSearchQuery] = useState("");

    // Active conversation state
    const [activeChannel, setActiveChannel] = useState<string>("bot");
    const [inputText, setInputText] = useState("");
    const [showStickerTray, setShowStickerTray] = useState(false);
    const stickersList = ["🦊", "🦁", "🚀", "🛸", "👾", "🎨", "💥", "💖", "🦄", "🎭", "🧁", "🌟", "📚", "🔮"];

    // New custom direct connection state
    const [showDirectConnect, setShowDirectConnect] = useState(false);
    const [directSearchKey, setDirectSearchKey] = useState("");

    // Create Status States
    const [showStatusCreator, setShowStatusCreator] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [statusBg, setStatusBg] = useState("bg-gradient-to-r from-teal-500 to-emerald-600");
    const [statusMediaUrl, setStatusMediaUrl] = useState("");
    const [statusComicPanel, setStatusComicPanel] = useState("");

    // Immersive story slideshow states
    const [activeStoryGroup, setActiveStoryGroup] = useState<StatusUpdate | null>(null);
    const [activeStoryIndex, setActiveStoryIndex] = useState(0);

    // Default seeded contacts list
    const [contacts, setContacts] = useState<Contact[]>([
        { id: "bot", name: "Quantum AI Assistant", username: "ai_quantum", phone: "+1 (800) 555-0199", email: "quantum@assistant.ai", avatar: "🤖", status: "System Core fully unsealed", type: "bot" },
        { id: "father", name: "Father", username: "father_narrator", phone: "+1 (555) 304-9182", email: "father@diarydomain.org", avatar: "👨", status: personalization.fatherDesc || "Checking sketches", type: "individual" },
        { id: "mother", name: "Mother", username: "mother_editor", phone: "+1 (555) 304-9285", email: "mother@diarydomain.org", avatar: "👩", status: personalization.motherDesc || "Cheering you on", type: "individual" },
        { id: "writers", name: "Comic Guild Group", username: "guild_writers", phone: "+1 (555) 999-3829", email: "guild@comicworkspace.com", avatar: "✍️", status: "Decentralized workspace stream", type: "group" }
    ]);

    // Messages logs
    const [conversations, setConversations] = useState<Record<string, Message[]>>({
        bot: [
            { id: "b1", sender: "bot", senderName: "Quantum AI Assistant", text: "Identity authenticated. I am fully integrated into your comic workspace stream. Send me your text outlines or ask for writing prompts!", timestamp: "9:00 AM" }
        ],
        father: [
            { id: "f1", sender: "father", senderName: "Father", text: "Hi Divya, I am tracking your sketch panel updates in the storyboard tree. It is looking gorgeous. Keep drawing!", timestamp: "8:30 AM" }
        ],
        mother: [
            { id: "m1", sender: "mother", senderName: "Mother", text: "Lovely story progress dear! Let me know if you need fresh ideas for today's entry.", timestamp: "8:45 AM" }
        ],
        writers: [
            { id: "w1", sender: "system", senderName: "System", text: "Decentralized workspace node unsealed. Share your narrative layouts directly into this channel.", timestamp: "7:15 AM" }
        ]
    });

    // Multiple statuses wrapped in a list
    const [statusesList, setStatusesList] = useState<StatusUpdate[]>([
        {
            creatorId: "father",
            creatorName: "Father",
            creatorAvatar: "👨",
            items: [
                { id: "sf1", type: "text", content: "Just read chapter 4 layout. Outstanding plot twist! 🚀", bgStyle: "bg-gradient-to-tr from-indigo-600 to-blue-500", createdAt: "10m ago" },
                { id: "sf2", type: "text", content: "Working on some watercolor sketches in the studio today.", bgStyle: "bg-gradient-to-tr from-purple-600 to-indigo-500", createdAt: "5m ago" }
            ]
        },
        {
            creatorId: "mother",
            creatorName: "Mother",
            creatorAvatar: "👩",
            items: [
                { id: "sm1", type: "text", content: "Baking cinnamon rolls for the comic guild tonight! 🥐☕", bgStyle: "bg-gradient-to-r from-pink-500 to-rose-400", createdAt: "1h ago" }
            ]
        },
        {
            creatorId: "bot",
            creatorName: "Quantum Assistant",
            creatorAvatar: "🤖",
            items: [
                { id: "sb1", type: "text", content: "Deep learning comic style layout engine optimized.", bgStyle: "bg-gradient-to-r from-slate-800 to-zinc-900", createdAt: "2h ago" }
            ]
        }
    ]);

    // Helper to pull all drawings/comics from vFileSystem
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
    const filesWithComics = filesList.filter(f => f.comic);

    // Story Auto-Advance Timer
    useEffect(() => {
        if (!activeStoryGroup) return;
        const currentItems = activeStoryGroup.items;

        const interval = setTimeout(() => {
            if (activeStoryIndex < currentItems.length - 1) {
                setActiveStoryIndex(prev => prev + 1);
            } else {
                setActiveStoryGroup(null);
                setActiveStoryIndex(0);
            }
        }, 4500); // 4.5 seconds per status slide

        return () => clearTimeout(interval);
    }, [activeStoryGroup, activeStoryIndex]);

    // 1. Send OTP simulation
    const handleRequestOTP = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onboardEmail.trim() || !onboardEmail.includes("@")) {
            setOtpError("Please specify a valid email address.");
            return;
        }
        setOtpError("");
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setOtpSentCode(code);
        alert(`🔐 [SECURE MAIL SERVICES] OTP Verification code dispatched to ${onboardEmail}: \n\nVerification Code: ${code}\n\n(Copy & Paste into Step 2 verification field)`);
        setVerificationStep(2);
    };

    // 2. Verify OTP simulation
    const handleVerifyOTP = (e: React.FormEvent) => {
        e.preventDefault();
        if (onboardOTP === otpSentCode && otpSentCode !== "") {
            setOtpError("");
            setVerificationStep(3);
        } else {
            setOtpError("Incorrect One-Time Password. Please check your simulated code.");
        }
    };

    // 3. Claim username & Finish Onboarding
    const handleFinishOnboarding = (e: React.FormEvent) => {
        e.preventDefault();
        if (!onboardUsername.trim() || onboardUsername.length < 3) {
            setUsernameError("Username must be at least 3 characters.");
            return;
        }
        if (!onboardPhone.trim()) {
            setUsernameError("Phone number is required for WhatsApp sync.");
            return;
        }

        // Check uniqueness (simulate check)
        const exists = contacts.some(c => c.username.toLowerCase() === onboardUsername.toLowerCase().replace("@", ""));
        if (exists) {
            setUsernameError("This unique username is already taken by another contact.");
            return;
        }

        setUsernameError("");
        const claimedUser = onboardUsername.startsWith("@") ? onboardUsername : `@${onboardUsername}`;

        // Save to personalization
        onUpdatePersonalization({
            emailAnchor: onboardEmail,
            phoneAnchor: onboardPhone
        });

        setVerificationStep(0);
    };

    // Reset verification to bypass / showcase
    const handleBypassOnboarding = () => {
        onUpdatePersonalization({
            emailAnchor: "divya@diariostudio.com",
            phoneAnchor: "+91 98765 43210"
        });
        setVerificationStep(0);
    };

    // Direct connection from search or manual connector
    const handleConnectUser = () => {
        if (!directSearchKey.trim()) return;

        // Search contact by name, email, phone, or username
        const alreadyConnected = contacts.find(c =>
            c.username.toLowerCase() === directSearchKey.toLowerCase().replace("@", "") ||
            c.phone === directSearchKey ||
            c.email.toLowerCase() === directSearchKey.toLowerCase()
        );

        if (alreadyConnected) {
            setActiveChannel(alreadyConnected.id);
            setDirectSearchKey("");
            setShowDirectConnect(false);
            return;
        }

        // Create new contact
        const randomSeed = Date.now().toString().slice(-4);
        const newUsername = directSearchKey.includes("@") ? directSearchKey.replace("@", "") : `user_${randomSeed}`;
        const cleanId = `contact_${Date.now()}`;
        const newContact: Contact = {
            id: cleanId,
            name: directSearchKey.split("@")[0] || `Contact ${randomSeed}`,
            username: newUsername,
            phone: directSearchKey.includes("+") ? directSearchKey : `+1 (555) 012-${randomSeed}`,
            email: directSearchKey.includes("@") ? directSearchKey : `${newUsername}@workspace.net`,
            avatar: "👤",
            status: "Connected & Verified",
            type: "individual"
        };

        setContacts(prev => [...prev, newContact]);
        setConversations(prev => ({
            ...prev,
            [cleanId]: [
                {
                    id: `welcome_${Date.now()}`,
                    sender: cleanId,
                    senderName: newContact.name,
                    text: `Hi! Connected securely. I noticed you searched for my identity. Let's collaborate!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
            ]
        }));

        setActiveChannel(cleanId);
        setDirectSearchKey("");
        setShowDirectConnect(false);
        setSearchQuery("");
    };

    // Handle direct message dispatch
    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            sender: "user",
            senderName: onboardUsername || username || "Divya",
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setConversations(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), newMessage]
        }));

        const query = inputText;
        setInputText("");

        // Send dynamic responses from contacts or AI bot
        setTimeout(() => {
            let replyText = "";
            let senderName = "";
            const matchedChan = contacts.find(c => c.id === activeChannel);
            senderName = matchedChan ? matchedChan.name : "Contact";

            if (activeChannel === "bot") {
                const queryLower = query.toLowerCase();
                if (queryLower.includes("plot") || queryLower.includes("outline")) {
                    replyText = `📚 **Story Sequence Outline Proposal:**\n\n1. Introduce a secret key into the Search Bar vault.\n2. Create a suspenseful climax around unsealing encrypted diary entries.\n3. The character profiles sync seamlessly back to the illustrator grid.`;
                } else {
                    replyText = `Secured message package received. Analyzing metrics... Your custom writing style guidelines look cohesive. Let's keep sketching!`;
                }
            } else if (activeChannel === "father") {
                replyText = personalization.fatherDesc
                    ? `That aligns perfectly with my alignment parameters: "${personalization.fatherDesc}". Make sure to auto-save page updates.`
                    : `That sounds exciting! By the way, remember to configure my description in the Character Alignments tab in the sidebar so my 2D comic rendering stays accurate!`;
            } else if (activeChannel === "mother") {
                replyText = personalization.motherDesc
                    ? `Wonderful! Guided by my character profile: "${personalization.motherDesc}", I am always proud of your comic creations.`
                    : `I am cheering you on! Let me know if you need some help.`;
            } else {
                replyText = `Encrypted node received. Handshaking complete. Message successfully synced.`;
            }

            const botReply: Message = {
                id: `reply_${Date.now()}`,
                sender: activeChannel,
                senderName: senderName,
                text: replyText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setConversations(prev => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), botReply]
            }));
        }, 1100);
    };

    // Handle Sticker send
    const handleSendSticker = (stk: string) => {
        const newMessage: Message = {
            id: `stk_${Date.now()}`,
            sender: "user",
            senderName: onboardUsername || username || "Divya",
            text: "Sent an artistic sticker:",
            sticker: stk,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setConversations(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), newMessage]
        }));
        setShowStickerTray(false);
    };

    // Handle Journal file share
    const handleShareLog = (file: JournalFile) => {
        const textSnippet = file.content.replace(/<[^>]*>/g, " ").substring(0, 140) + "...";
        const shareMessage: Message = {
            id: `share_${Date.now()}`,
            sender: "user",
            senderName: onboardUsername || username || "Divya",
            text: `I shared a secure journal node with you: "${file.name}"`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            sharedLog: {
                name: file.name,
                content: textSnippet
            }
        };

        setConversations(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), shareMessage]
        }));
    };

    // Create a new custom status (text or media, supports comic frames!)
    const handleCreateStatus = (e: React.FormEvent) => {
        e.preventDefault();
        if (!statusText.trim() && !statusComicPanel && !statusMediaUrl) return;

        const newItem: StatusItem = {
            id: `my_stat_${Date.now()}`,
            type: statusComicPanel ? "comic" : statusMediaUrl ? "media" : "text",
            content: statusComicPanel || statusMediaUrl || statusText,
            bgStyle: statusBg,
            createdAt: "Just now"
        };

        // Find if user already has a status group
        const existingIndex = statusesList.findIndex(s => s.creatorId === "me");
        if (existingIndex >= 0) {
            const updated = [...statusesList];
            updated[existingIndex].items = [newItem, ...updated[existingIndex].items];
            setStatusesList(updated);
        } else {
            const newGroup: StatusUpdate = {
                creatorId: "me",
                creatorName: "My Status",
                creatorAvatar: "✨",
                items: [newItem]
            };
            setStatusesList(prev => [newGroup, ...prev]);
        }

        setStatusText("");
        setStatusComicPanel("");
        setStatusMediaUrl("");
        setShowStatusCreator(false);
    };

    const activeChannelDetails = contacts.find(c => c.id === activeChannel);
    const currentChannelMessages = conversations[activeChannel] || [];

    // Filter contacts based on search query (username, phone, email, name)
    const filteredContacts = contacts.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(query) ||
            c.username.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.email.toLowerCase().includes(query)
        );
    });

    const isLight = ["light", "minimalist", "blossom", "lavender", "meadow", "linen"].includes(personalization.outerWallpaper);

    // If we are in verification flow, render the beautiful 3-Step Verification card
    if (verificationStep > 0) {
        return (
            <div className={`h-full flex items-center justify-center p-4 md:p-8 select-none transition-all ${isLight ? "bg-stone-50 text-stone-850" : "bg-zinc-950 text-slate-100"
                }`}>
                <div className={`w-full max-w-md p-6 md:p-8 rounded-2xl border shadow-2xl flex flex-col space-y-6 ${isLight ? "bg-white border-pink-100" : "bg-zinc-900 border-zinc-800"
                    }`}>
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 mx-auto">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold font-display">Messenger Verification</h2>
                        <p className={`text-xs ${isLight ? "text-stone-500" : "text-slate-400"}`}>
                            Unlock the WhatsApp secure ecosystem in 3 quick steps.
                        </p>
                    </div>

                    {/* Progress Indicators */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className={`h-1.5 rounded-full ${verificationStep >= 1 ? "bg-pink-500" : "bg-zinc-800"}`} />
                        <div className={`h-1.5 rounded-full ${verificationStep >= 2 ? "bg-pink-500" : "bg-zinc-800"}`} />
                        <div className={`h-1.5 rounded-full ${verificationStep >= 3 ? "bg-pink-500" : "bg-zinc-800"}`} />
                    </div>

                    {/* Step Contents */}
                    {verificationStep === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono text-pink-500 uppercase font-semibold">Step 1: Sign Up Email</span>
                                <label className="block text-xs font-semibold">Enter your Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={onboardEmail}
                                        onChange={(e) => setOnboardEmail(e.target.value)}
                                        placeholder="name@gsuite.com"
                                        className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-pink-500 border ${isLight ? "bg-stone-50 border-stone-200" : "bg-zinc-950 border-zinc-800 text-white"
                                            }`}
                                    />
                                </div>
                                {otpError && <p className="text-[10px] text-red-500 font-mono">{otpError}</p>}
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 cursor-pointer"
                                >
                                    Generate Security OTP
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBypassOnboarding}
                                    className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 hover:bg-zinc-800/10 text-xs text-slate-400 font-semibold cursor-pointer"
                                >
                                    Bypass Verification (Fast Entry)
                                </button>
                            </div>
                        </form>
                    )}

                    {verificationStep === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-mono text-pink-500 uppercase font-semibold">Step 2: OTP Validation</span>
                                <label className="block text-xs font-semibold">Verification Code</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        value={onboardOTP}
                                        onChange={(e) => setOnboardOTP(e.target.value)}
                                        placeholder="Enter 6-digit OTP code"
                                        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-pink-500 border bg-zinc-950 border-zinc-800 text-white font-mono tracking-widest text-center"
                                    />
                                </div>
                                {otpError && <p className="text-[10px] text-red-500 font-mono">{otpError}</p>}
                                <p className={`text-[10px] ${isLight ? "text-stone-500" : "text-slate-500"} italic`}>
                                    Check your alert popups for the dispatched 6-digit passcode.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setVerificationStep(1)}
                                    className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-slate-400 text-xs font-semibold cursor-pointer"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 cursor-pointer"
                                >
                                    Verify OTP
                                </button>
                            </div>
                        </form>
                    )}

                    {verificationStep === 3 && (
                        <form onSubmit={handleFinishOnboarding} className="space-y-4">
                            <div className="space-y-3">
                                <span className="text-[10px] font-mono text-pink-500 uppercase font-semibold">Step 3: Identity Setup</span>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold">Globally Unique Username</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-2.5 text-xs text-pink-500 font-bold">@</span>
                                        <input
                                            type="text"
                                            required
                                            value={onboardUsername}
                                            onChange={(e) => setOnboardUsername(e.target.value.replace(/\s+/g, ""))}
                                            placeholder="divya_sharma"
                                            className="w-full rounded-xl pl-8 pr-4 py-2 text-xs outline-none focus:border-pink-500 border bg-zinc-950 border-zinc-800 text-white font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold">WhatsApp Sync Phone Number</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="tel"
                                            required
                                            value={onboardPhone}
                                            onChange={(e) => setOnboardPhone(e.target.value)}
                                            placeholder="+91 98765 43210"
                                            className="w-full rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-pink-500 border bg-zinc-950 border-zinc-800 text-white font-mono"
                                        />
                                    </div>
                                </div>

                                {usernameError && <p className="text-[10px] text-red-500 font-mono">{usernameError}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 cursor-pointer"
                            >
                                Claim Identity & Launch Messenger
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // Active fully verified premium view
    return (
        <div className={`h-full flex flex-col md:flex-row bg-transparent overflow-hidden ${isLight ? "text-stone-850" : "text-slate-100"
            }`}>
            {/* 1. WHATSAPP & MESSENGER HYBRID SIDEBAR */}
            <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r flex flex-col shrink-0 transition-colors ${isLight
                    ? "bg-white/60 backdrop-blur-md border-pink-100"
                    : "bg-zinc-950/60 backdrop-blur-md border-zinc-900"
                }`}>
                {/* Header with identity search buttons */}
                <div className={`p-4 border-b space-y-3 ${isLight ? "border-pink-100" : "border-zinc-900"}`}>
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold ${isLight ? "text-pink-600" : "text-pink-400"
                            }`}>
                            <Shield className="w-3.5 h-3.5 animate-pulse" /> Secure Messenger
                        </div>

                        <button
                            onClick={() => setShowDirectConnect(!showDirectConnect)}
                            className="p-1.5 rounded bg-zinc-900/40 hover:bg-zinc-800 text-slate-400 hover:text-pink-400 transition-colors cursor-pointer flex items-center gap-1"
                            title="Add Direct Connection"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono">Connect</span>
                        </button>
                    </div>

                    {/* Direct connection manual input */}
                    {showDirectConnect && (
                        <div className="p-2.5 rounded-lg bg-pink-500/5 border border-pink-500/20 space-y-2 animate-fadeIn">
                            <span className="text-[9px] font-mono uppercase text-pink-400 block font-semibold">Connect New Identity</span>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    placeholder="Username, Mail, or Mobile Number..."
                                    value={directSearchKey}
                                    onChange={(e) => setDirectSearchKey(e.target.value)}
                                    className="flex-1 text-xs px-2.5 py-1 rounded bg-zinc-900 text-white outline-none border border-zinc-800 font-mono"
                                />
                                <button
                                    onClick={handleConnectUser}
                                    className="px-2.5 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded text-xs font-bold cursor-pointer"
                                >
                                    Sync
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Integrated Universal Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by username, mobile, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full text-xs rounded-xl pl-8 pr-2.5 py-1.5 outline-none font-mono transition-all ${isLight
                                    ? "bg-white border border-pink-100 text-stone-800 placeholder-stone-400 focus:border-pink-400"
                                    : "bg-zinc-900 border border-zinc-800 text-slate-200 placeholder-zinc-700 focus:border-pink-500"
                                }`}
                        />
                    </div>
                </div>

                {/* Contacts chat thread stream */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                    <span className="px-2.5 py-1 text-[9px] font-mono uppercase text-slate-500 tracking-wider block font-bold">Active Connections</span>
                    {filteredContacts.length > 0 ? (
                        filteredContacts.map((chan) => {
                            const isActive = activeChannel === chan.id;
                            // Check if contact has active statuses
                            const statusGroup = statusesList.find(s => s.creatorId === chan.id);
                            const hasStatuses = statusGroup && statusGroup.items.length > 0;

                            return (
                                <div
                                    key={chan.id}
                                    onClick={() => setActiveChannel(chan.id)}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${isActive
                                            ? isLight ? "bg-pink-100/70 border-pink-200 text-pink-750 font-bold" : "bg-pink-500/10 border-pink-500/20 text-pink-400 font-bold"
                                            : isLight ? "bg-transparent border-transparent hover:bg-pink-50/50 text-stone-600" : "bg-transparent border-transparent hover:bg-zinc-900 text-slate-400"
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Render status-ring-wrapped avatar if there are active statuses */}
                                        {hasStatuses ? (
                                            <StatusRingAvatar
                                                items={statusGroup!.items}
                                                size={40}
                                                avatar={chan.avatar}
                                                onClick={() => {
                                                    setActiveStoryGroup(statusGroup!);
                                                    setActiveStoryIndex(0);
                                                }}
                                            />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${isLight ? "bg-pink-50 text-pink-600" : "bg-zinc-900 text-slate-300"
                                                }`}>
                                                {chan.avatar}
                                            </div>
                                        )}

                                        <div className="truncate">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`block text-xs font-semibold truncate ${isLight ? "text-stone-900" : "text-white"}`}>
                                                    {chan.name}
                                                </span>
                                                <span className="text-[9px] font-mono opacity-50 truncate">@{chan.username}</span>
                                            </div>
                                            <span className={`block text-[9px] font-mono opacity-60 truncate ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                                                {chan.status}
                                            </span>
                                        </div>
                                    </div>

                                    {chan.type === "bot" && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow shadow-emerald-500/45 shrink-0 ml-1.5" />
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-4 text-center text-xs text-slate-500 font-mono italic">
                            No contacts match search query. <br />
                            <button
                                onClick={() => {
                                    setDirectSearchKey(searchQuery);
                                    setShowDirectConnect(true);
                                }}
                                className="mt-2 text-pink-500 underline font-bold"
                            >
                                + Create & Verify "{searchQuery}"
                            </button>
                        </div>
                    )}
                </div>

                {/* Identity Anchor Status indicators bar */}
                <div className={`p-4 border-t space-y-2.5 ${isLight ? "bg-pink-100/15 border-pink-100" : "bg-zinc-950/40 border-zinc-900"
                    }`}>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="uppercase tracking-wider font-semibold text-slate-500">Your Identity Verified</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Fully Synced
                        </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border space-y-1.5 font-mono text-[10px] ${isLight ? "bg-white border-pink-100/80" : "bg-zinc-900 border-zinc-850"
                        }`}>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Username:</span>
                            <span className="text-pink-400 font-bold">@{onboardUsername || "divya_sharma"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Registered:</span>
                            <span className="truncate max-w-[140px] text-right">{onboardEmail || "divya@diariostudio.com"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Sync Phone:</span>
                            <span>{onboardPhone || "+91 98765 43210"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CHAT FEED & IMMERSIVE STATUS BAR MODULE */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isLight ? "bg-white/40" : "bg-[#070911]/60"
                }`}>
                {/* WHATSAPP-STYLE HORIZONTAL STATUS CLUSTERS SLIDESHOW */}
                <div className={`px-4 py-3 border-b flex items-center gap-3 overflow-x-auto shrink-0 select-none ${isLight ? "bg-pink-50/40 border-pink-100" : "bg-zinc-950/30 border-zinc-900"
                    }`}>
                    {/* Add Status Action Ring */}
                    <div className="flex flex-col items-center shrink-0">
                        <button
                            onClick={() => setShowStatusCreator(true)}
                            className="w-10 h-10 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center border-2 border-pink-500/20 relative shadow cursor-pointer transition-transform hover:scale-105"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <span className="text-[9px] font-mono text-zinc-500 mt-1">Status</span>
                    </div>

                    {/* Render All Active Status Segment Circles */}
                    {statusesList.map((stat) => (
                        <div
                            key={stat.creatorId}
                            onClick={() => {
                                setActiveStoryGroup(stat);
                                setActiveStoryIndex(0);
                            }}
                            className="flex flex-col items-center shrink-0 cursor-pointer"
                        >
                            <StatusRingAvatar
                                items={stat.items}
                                size={40}
                                avatar={stat.creatorAvatar}
                            />
                            <span className="text-[9px] font-mono text-zinc-400 mt-1 truncate max-w-[65px]">
                                {stat.creatorId === "me" ? "My Status" : stat.creatorName}
                            </span>
                        </div>
                    ))}
                </div>

                {/* WhatsApp Slideshow Story Viewer (Immersive Slide) */}
                {activeStoryGroup && (
                    <div className="fixed inset-0 z-99 flex flex-col items-center justify-center bg-black/95 p-6 backdrop-blur-md animate-fadeIn">
                        <div className="w-full max-w-md relative space-y-5">

                            {/* Segmented timing indicator bars */}
                            <div className="flex gap-1.5 w-full">
                                {activeStoryGroup.items.map((it, idx) => {
                                    const isPast = idx < activeStoryIndex;
                                    const isCurrent = idx === activeStoryIndex;
                                    return (
                                        <div key={it.id} className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-emerald-500 transition-all ${isPast ? "w-full" : isCurrent ? "w-full duration-[4500ms] ease-linear" : "w-0"
                                                    }`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Header metadata */}
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm">
                                        {activeStoryGroup.creatorAvatar}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold font-sans">
                                            {activeStoryGroup.creatorName} status
                                        </h4>
                                        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" /> {activeStoryGroup.items[activeStoryIndex]?.createdAt}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setActiveStoryGroup(null); setActiveStoryIndex(0); }}
                                    className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Status Graphic Frame Container */}
                            <div className={`aspect-square w-full rounded-2xl border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl ${activeStoryGroup.items[activeStoryIndex]?.type === "text"
                                    ? activeStoryGroup.items[activeStoryIndex]?.bgStyle || "bg-zinc-900"
                                    : "bg-zinc-950 border-zinc-850"
                                }`}>
                                {activeStoryGroup.items[activeStoryIndex]?.type === "comic" ? (
                                    <div className="w-full h-full flex flex-col justify-between">
                                        <span className="text-[9px] font-mono uppercase text-pink-400 mb-2 tracking-widest block">SHARED WORKSPACE COMIC FRAME</span>
                                        <img
                                            referrerPolicy="no-referrer"
                                            src={activeStoryGroup.items[activeStoryIndex].content}
                                            alt="Status Story comic frame"
                                            className="max-h-[280px] mx-auto rounded-lg object-contain border border-zinc-800 shadow"
                                        />
                                    </div>
                                ) : activeStoryGroup.items[activeStoryIndex]?.type === "media" ? (
                                    <div className="w-full h-full flex flex-col justify-between">
                                        <span className="text-[9px] font-mono uppercase text-emerald-400 mb-2 tracking-widest block">MEDIA ATTACHMENT</span>
                                        <img
                                            referrerPolicy="no-referrer"
                                            src={activeStoryGroup.items[activeStoryIndex].content}
                                            alt="Status Story media update"
                                            className="max-h-[280px] mx-auto rounded-lg object-contain border border-zinc-850 shadow"
                                        />
                                    </div>
                                ) : (
                                    <p className="text-base font-medium font-sans text-white leading-relaxed italic px-4 select-none">
                                        "{activeStoryGroup.items[activeStoryIndex]?.content}"
                                    </p>
                                )}

                                {/* Left/Right manual slide triggers */}
                                <div
                                    className="absolute left-0 top-0 bottom-0 w-1/4 cursor-w-resize"
                                    onClick={() => {
                                        if (activeStoryIndex > 0) {
                                            setActiveStoryIndex(prev => prev - 1);
                                        }
                                    }}
                                />
                                <div
                                    className="absolute right-0 top-0 bottom-0 w-1/4 cursor-e-resize"
                                    onClick={() => {
                                        if (activeStoryIndex < activeStoryGroup.items.length - 1) {
                                            setActiveStoryIndex(prev => prev + 1);
                                        } else {
                                            setActiveStoryGroup(null);
                                            setActiveStoryIndex(0);
                                        }
                                    }}
                                />
                            </div>

                            {/* Manual navigation controls */}
                            <div className="flex justify-between text-xs text-zinc-500 px-1 font-mono">
                                <span>← tap left to go back</span>
                                <span>tap right to advance →</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATUS CREATOR DRAWER/MODAL */}
                {showStatusCreator && (
                    <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-2xl text-slate-200">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                                <span className="text-xs font-bold font-mono text-pink-500 flex items-center gap-1.5 uppercase tracking-widest">
                                    <Plus className="w-4 h-4" /> Dispatch Status Update
                                </span>
                                <button
                                    onClick={() => setShowStatusCreator(false)}
                                    className="text-zinc-500 hover:text-white cursor-pointer text-lg"
                                >
                                    ×
                                </button>
                            </div>

                            <form onSubmit={handleCreateStatus} className="space-y-4 text-xs">
                                {/* 1. Text Status Content */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-zinc-500 uppercase">Textual update</label>
                                    <input
                                        type="text"
                                        value={statusText}
                                        onChange={(e) => setStatusText(e.target.value)}
                                        placeholder="E.g. Feeling inspired sketching today! 🎨✨"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 outline-none text-white focus:border-pink-500"
                                    />
                                </div>

                                {/* 2. Text background selector */}
                                {!statusComicPanel && !statusMediaUrl && (
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">Status Background Palette</label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { id: "bg-gradient-to-r from-teal-500 to-emerald-600", name: "Teal 🌿" },
                                                { id: "bg-gradient-to-r from-indigo-500 to-indigo-700", name: "Indigo 🌌" },
                                                { id: "bg-gradient-to-r from-pink-500 to-rose-400", name: "Blossom 🌸" },
                                                { id: "bg-gradient-to-tr from-amber-500 to-red-500", name: "Sunset 🌅" }
                                            ].map((bg) => (
                                                <button
                                                    type="button"
                                                    key={bg.id}
                                                    onClick={() => setStatusBg(bg.id)}
                                                    className={`py-1.5 px-1 rounded text-[9px] font-mono font-medium truncate ${bg.id} text-white border ${statusBg === bg.id ? "border-white" : "border-transparent"
                                                        }`}
                                                >
                                                    {bg.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Direct Comic Upload Selector */}
                                {filesWithComics.length > 0 && (
                                    <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                                        <label className="text-[10px] font-mono text-zinc-500 uppercase">OR: Select Decrypted Comic Frame</label>
                                        <select
                                            value={statusComicPanel}
                                            onChange={(e) => {
                                                setStatusComicPanel(e.target.value);
                                                setStatusMediaUrl("");
                                            }}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white outline-none focus:border-pink-500"
                                        >
                                            <option value="">-- Choose panel --</option>
                                            {filesWithComics.map((file) => (
                                                <option key={file.id} value={file.comic}>{file.name} comic panel</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* 4. Custom Media URL Input */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-mono text-zinc-500 uppercase">OR: Enter Media / Video / Image URL</label>
                                    <input
                                        type="url"
                                        value={statusMediaUrl}
                                        onChange={(e) => {
                                            setStatusMediaUrl(e.target.value);
                                            setStatusComicPanel("");
                                        }}
                                        placeholder="https://images.unsplash.com/... or any video link"
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 outline-none text-white focus:border-pink-500 font-mono"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 text-xs pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatusCreator(false)}
                                        className="px-3 py-1.5 text-zinc-400 hover:text-white font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold"
                                    >
                                        Publish Status
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Active conversation details header */}
                <div className={`border-b px-6 py-4 flex items-center justify-between shrink-0 ${isLight ? "bg-white/60 border-pink-100" : "bg-zinc-950/60 border-zinc-900"
                    }`}>
                    <div>
                        <h3 className={`font-display font-semibold text-sm ${isLight ? "text-stone-900" : "text-white"}`}>
                            {activeChannelDetails?.name || "Secure Connection Node"}
                        </h3>
                        <p className={`text-[10px] font-mono uppercase tracking-wider ${isLight ? "text-stone-500" : "text-slate-500"}`}>
                            Synced Session Stream • Decrypting End-to-End
                        </p>
                    </div>

                    <div className={`text-[9px] font-mono px-2.5 py-1 rounded border ${isLight ? "bg-pink-50 border-pink-100 text-pink-600" : "bg-zinc-900 border-zinc-800 text-pink-400"
                        }`}>
                        Synced UID: {onboardUsername || username || "divya_sharma"}
                    </div>
                </div>

                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
                    {currentChannelMessages.map((msg) => {
                        const isMe = msg.sender === "user";
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                                <span className="text-[10px] font-mono text-slate-500">{msg.senderName}</span>
                                <div
                                    className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 relative group/msg ${isMe
                                            ? "bg-pink-500 text-white font-medium rounded-tr-none shadow-lg shadow-pink-500/15"
                                            : isLight
                                                ? "bg-white text-stone-850 rounded-tl-none border border-pink-100 shadow-sm"
                                                : "bg-zinc-900 text-slate-200 rounded-tl-none border border-zinc-800/60"
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>

                                    {/* Sticker Display */}
                                    {msg.sticker && (
                                        <div className="text-5xl select-none leading-none block p-2 animate-bounce cursor-pointer">
                                            {msg.sticker}
                                        </div>
                                    )}

                                    {msg.sharedLog && (
                                        <div className={`p-3 rounded-lg border text-[10px] leading-relaxed mt-2 ${isMe
                                                ? "bg-black/10 border-black/20 text-zinc-900"
                                                : isLight ? "bg-pink-50/50 border-pink-100 text-stone-700" : "bg-black/35 border-zinc-800/80 text-slate-300"
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

                {/* Quick share journal pages tray */}
                {filesList.length > 0 && (
                    <div className={`border-t px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 select-none ${isLight ? "bg-white/50 border-pink-100" : "bg-zinc-950/70 border-zinc-900"
                        }`}>
                        <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 mr-1.5 ${isLight ? "text-stone-500" : "text-slate-500"
                            }`}>
                            Quick Share Node:
                        </span>
                        {filesList.map((file) => (
                            <button
                                key={file.id}
                                onClick={() => handleShareLog(file)}
                                title={`Share "${file.name}" to this channel`}
                                className={`px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer shrink-0 border transition-all ${isLight
                                        ? "bg-pink-50 hover:bg-pink-100 border-pink-100 text-pink-600"
                                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-pink-400 hover:text-pink-300"
                                    }`}
                            >
                                + Share {file.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* AI Bot writing helper panel */}
                {activeChannel === "bot" && (
                    <div className="px-4 py-2 border-t flex items-center gap-2 shrink-0 overflow-x-auto bg-zinc-900/40">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 shrink-0">AI Assistant suggestions:</span>
                        <button
                            onClick={() => setInputText("Give me a plot twist outline suggestion for my next sketch diary.")}
                            className="px-2.5 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-[10px] border border-pink-500/20 cursor-pointer shrink-0"
                        >
                            🎭 Plot Twist outline
                        </button>
                        <button
                            onClick={() => setInputText("Suggest character alignment details matching the family narrative.")}
                            className="px-2.5 py-1 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-[10px] border border-pink-500/20 cursor-pointer shrink-0"
                        >
                            👥 Character guidelines
                        </button>
                    </div>
                )}

                {/* Chat message input system */}
                <div className={`p-4 border-t flex flex-col gap-3 shrink-0 relative ${isLight ? "bg-white/60 border-pink-100" : "bg-zinc-950 border-zinc-900"
                    }`}>
                    {/* Sticker drawer */}
                    {showStickerTray && (
                        <div className="absolute bottom-16 left-4 right-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur shadow-2xl flex flex-wrap gap-3 z-50 animate-slideUp">
                            <div className="w-full flex items-center justify-between pb-1 border-b border-zinc-900 mb-2">
                                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Express sticker emojis</span>
                                <button onClick={() => setShowStickerTray(false)} className="text-zinc-500 hover:text-white">×</button>
                            </div>
                            {stickersList.map((stk) => (
                                <button
                                    key={stk}
                                    onClick={() => handleSendSticker(stk)}
                                    className="text-4xl hover:scale-125 transition-transform p-1 cursor-pointer"
                                >
                                    {stk}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full">
                        <button
                            onClick={() => setShowStickerTray(!showStickerTray)}
                            className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-pink-400 flex items-center justify-center transition-all cursor-pointer shrink-0"
                            title="Attach sticker emojis"
                        >
                            <Smile className="w-5 h-5" />
                        </button>

                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder={`Write cryptographically signed message securely to ${activeChannelDetails?.name}...`}
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
        </div>
    );
}
