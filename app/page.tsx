"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatSession } from "./types";
import { deleteSession, getSessions, saveSession } from "@/lib/storage";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

function newSession(): ChatSession {
  const now = Date.now();
  return {
    id: uuidv4(),
    title: "New Trip Plan",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = getSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setActiveId(stored[0].id);
    } else {
      const s = newSession();
      setSessions([s]);
      setActiveId(s.id);
    }
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  function handleNew() {
    const s = newSession();
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setMobileOpen(false);
  }

  function handleSelect(id: string) {
    setActiveId(id);
    setMobileOpen(false);
  }

  function handleDelete(id: string) {
    deleteSession(id);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        if (next.length > 0) {
          setActiveId(next[0].id);
        } else {
          const s = newSession();
          saveSession(s);
          setActiveId(s.id);
          return [s];
        }
      }
      return next;
    });
  }

  const handleUpdate = useCallback((updated: ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  }, []);

  function handleSearchNavigate(sessionId: string) {
    setActiveId(sessionId);
    setMobileOpen(false);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-30 md:z-auto h-full transition-transform duration-200`}
      >
        <Sidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
          onSearchNavigate={handleSearchNavigate}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="font-semibold text-gray-800">✈️ Itinerant</span>
        </div>

        {activeSession && (
          <ChatArea session={activeSession} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}
