export interface Sticker {
  char: string;
  top: string;
  left: string;
  transform: string;
}

export interface JournalFile {
  id: string;
  type: "file";
  name: string;
  content: string;
  mood: string;
  weather?: string;
  created: string;
  edited: string;
  comic: string;
  stickers: Sticker[];
  attached_image?: string;
  password?: string; // AES password or individual file lock password
  isLocked?: boolean;
  canvasPaths?: string; // base64 doodle overlay canvas state
  starRating?: number; // star rating assigned by user: 1 to 5
  oneLiner?: string; // high-impact review summary sentence
  characters?: Array<{ id: string; name: string; role: string; desc: string }>; // character universe mappings
}

export interface JournalFolder {
  id: string;
  type: "folder";
  name: string;
  children: (JournalFile | JournalFolder)[];
  password?: string; // folder lock password
  isLocked?: boolean;
}

export type JournalNode = JournalFile | JournalFolder;

export interface Personalization {
  theme: "slate-minimalist" | "neo-futuristic" | "pristine-light" | "cyber-sunset" | "northern-aurora" | "sakura-blossom" | "classic-professional";
  outerWallpaper: string;
  padStyle: string;
  typography: string;
  margins: string;
  lineSpacing: string;
  paragraphSpacing: string;
  padding: string;
  avatarDesc: string;
  fatherDesc?: string;
  motherDesc?: string;
  othersDesc?: string;
  phoneAnchor?: string;
  emailAnchor?: string;
  glassOpacity?: number; // Frosted Glass Notepad Opacity level (10 - 100)
}
