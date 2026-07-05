export interface VirtualFile {
  id: string;
  name: string;
  content: string;
  language: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  latency?: number;
  files?: Array<{
    name: string;
    content: string;
    language: string;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  files: VirtualFile[];
  createdAt: string;
  lastActiveAt: string;
}
