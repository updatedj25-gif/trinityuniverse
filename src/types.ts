export interface Tenant {
  id: string;
  name: string;
  headerTitle: string;
  pillLabel: string;
  activePillBg: string;
  activePillText: string;
  activePillBorder: string;
  newChatBtnText: string;
  clearHistoryBtnText: string;
  subtitle?: string;
  emptyStateTitle: string;
  placeholderText: string;
  systemInstruction: string;
  fontStyle: 'sans' | 'serif';
  canvasBg: string;
  accentColor: string;
  avatarBg: string;
  suggestedPrompts: string[];
  activityCategory: string;
  primaryModel?: string;
  visionModel?: string;
  coderModel?: string;
}

export interface ActivityItem {
  id: string;
  tenantId: string;
  title: string;
  type: string;
  timestamp: string;
  details?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  dataUrl?: string;
  content?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  tenantId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  signedIn: boolean;
}
