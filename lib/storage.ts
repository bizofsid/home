import { ChatSession, SearchResult } from "@/app/types";

const STORAGE_KEY = "itinerant_sessions";

export function getSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: ChatSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function searchSessions(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const session of getSessions()) {
    for (const message of session.messages) {
      const lower = message.content.toLowerCase();
      const idx = lower.indexOf(q);
      if (idx === -1) continue;

      const start = Math.max(0, idx - 60);
      const end = Math.min(message.content.length, idx + q.length + 60);
      const highlight = message.content.slice(start, end);

      results.push({
        sessionId: session.id,
        sessionTitle: session.title,
        messageId: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        highlight: (start > 0 ? "…" : "") + highlight + (end < message.content.length ? "…" : ""),
      });
    }
  }

  return results.slice(0, 50);
}
