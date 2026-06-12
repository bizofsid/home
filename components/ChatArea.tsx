"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatSession, Message } from "@/app/types";
import { saveSession } from "@/lib/storage";
import ChatMessage from "./ChatMessage";

interface Props {
  session: ChatSession;
  onUpdate: (session: ChatSession) => void;
}

const SUGGESTIONS = [
  "Plan a 7-day trip to Japan in spring",
  "Weekend getaway from NYC on a budget",
  "Best places to visit in Southeast Asia",
  "Road trip through the American Southwest",
];

export default function ChatArea({ session, onUpdate }: Props) {
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, streamContent]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    const updated: ChatSession = {
      ...session,
      messages: [...session.messages, userMsg],
      updatedAt: Date.now(),
      title:
        session.messages.length === 0
          ? text.trim().slice(0, 50)
          : session.title,
    };

    onUpdate(updated);
    saveSession(updated);
    setInput("");
    setStreaming(true);
    setStreamContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamContent(full);
      }

      const assistantMsg: Message = {
        id: uuidv4(),
        role: "assistant",
        content: full,
        timestamp: Date.now(),
      };

      const withResponse: ChatSession = {
        ...updated,
        messages: [...updated.messages, assistantMsg],
        updatedAt: Date.now(),
      };

      onUpdate(withResponse);
      saveSession(withResponse);
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
      setStreamContent("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = session.messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="font-semibold text-gray-800 truncate">
          {isEmpty ? "New Trip Plan" : session.title}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {session.messages.length} message{session.messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {isEmpty && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-5xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Where do you want to go?
            </h3>
            <p className="text-gray-500 mb-8 max-w-md">
              Tell me your dream destination and I&apos;ll help you plan the
              perfect itinerary.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="p-3 text-sm text-left border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-gray-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {session.messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            {streaming && streamContent && (
              <ChatMessage
                message={{
                  id: "streaming",
                  role: "assistant",
                  content: streamContent,
                  timestamp: Date.now(),
                }}
              />
            )}
            {streaming && !streamContent && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about destinations, activities, or let me plan your trip…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32 overflow-y-auto"
            style={{ minHeight: "48px" }}
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-11 h-11 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
