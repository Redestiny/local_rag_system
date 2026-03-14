"use client";

import { useState } from "react";

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  lastMessage?: string;
}

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function SessionList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSession,
}: SessionListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-slate-100">
        <button
          onClick={onNewSession}
          className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            onMouseEnter={() => setHoveredId(session.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative group p-3 rounded-lg cursor-pointer transition-all ${
              currentSessionId === session.id
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-slate-50 border border-transparent"
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-sm font-medium truncate ${
                    currentSessionId === session.id ? "text-indigo-700" : "text-slate-700"
                  }`}
                >
                  {session.title}
                </h3>
                {session.lastMessage && (
                  <p className="text-xs text-slate-400 truncate mt-1">{session.lastMessage}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(session.createdAt).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {hoveredId === session.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            暂无对话
          </div>
        )}
      </div>
    </div>
  );
}
