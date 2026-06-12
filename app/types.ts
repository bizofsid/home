export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  destination?: string;
}

export interface SearchResult {
  sessionId: string;
  sessionTitle: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  highlight: string;
}
