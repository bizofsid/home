"use client";

import { useState } from "react";
import { ChatSession, SearchResult } from "@/app/types";
import { searchSessions } from "@/lib/storage";

interface Props {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSearchNavigate: (sessionId: string) => void;
}

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onSearchNavigate,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  function handleSearch(q: string) {
    setQuery(q);
    setResults(q.trim() ? searchSessions(q) : []);
  }

  function handleResultClick(r: SearchResult) {
    setQuery("");
    setResults([]);
    onSearchNavigate(r.sessionId);
  }

  return (
    <div className="w-72 bg-gray-900 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✈️</span>
          <h1 className="font-bold text-lg">Itinerant</h1>
        </div>
        <button
          onClick={onNew}
          className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          + New Trip Plan
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-700">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search chats…"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {query && results.length === 0 && (
        <div className="flex-1 p-4">
          <p className="text-xs text-gray-500 text-center mt-4">
            No messages match &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          <p className="text-xs text-gray-500 px-2 mb-2">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((r) => (
            <button
              key={`${r.sessionId}-${r.messageId}`}
              onClick={() => handleResultClick(r)}
              className="w-full text-left p-2 rounded-lg hover:bg-gray-700 mb-1 group"
            >
              <p className="text-xs text-indigo-400 truncate font-medium">
                {r.sessionTitle}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 group-hover:text-gray-300">
                {r.highlight}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Sessions list */}
      {!query && (
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-500 text-center mt-8 px-4">
              Start a new trip plan to get going!
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex items-center gap-1 rounded-lg mb-1 ${
                  activeId === s.id ? "bg-gray-700" : "hover:bg-gray-800"
                }`}
              >
                <button
                  onClick={() => onSelect(s.id)}
                  className="flex-1 text-left p-2 min-w-0"
                >
                  <p className="text-sm truncate font-medium">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
