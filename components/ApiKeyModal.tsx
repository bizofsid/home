"use client";

import { useState } from "react";
import { setApiKey } from "@/lib/anthropic";

interface Props {
  onSaved: () => void;
  onClose?: () => void;
}

export default function ApiKeyModal({ onSaved, onClose }: Props) {
  const [value, setValue] = useState("");

  function save() {
    if (!value.trim()) return;
    setApiKey(value);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold text-gray-800">
            🔑 Anthropic API Key
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Your key is stored only in this browser&apos;s local storage and sent
          directly to Anthropic — never to any other server.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="sk-ant-…"
          autoFocus
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
        />
        <button
          onClick={save}
          disabled={!value.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Save &amp; Start Planning
        </button>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Get a key at{" "}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-500 underline"
          >
            console.anthropic.com
          </a>{" "}
          (account needs credits)
        </p>
      </div>
    </div>
  );
}
