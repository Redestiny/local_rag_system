"use client";

import MainLayout from "@/components/MainLayout";
import SessionList from "@/components/SessionList";
import TopBar from "@/components/TopBar";
import ChatInterface from "@/components/ChatInterface";
import { useApp } from "@/contexts/AppContext";

export default function ChatPage() {
  const { sessions, currentSessionId, switchSession, deleteSession, createSession, engine, latency } = useApp();

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <TopBar
          title="对话探索"
          subtitle="基于 RAG 的智能对话系统"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          }
          statusIndicator={
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600">
                  {engine === "api" ? "API" : "本地"}
                </span>
              </div>
              {latency > 0 && (
                <>
                  <div className="w-px h-4 bg-slate-300"></div>
                  <span className="text-xs text-slate-500">{latency}ms</span>
                </>
              )}
            </div>
          }
        />
        <div className="flex flex-1 overflow-hidden">
          <SessionList
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={switchSession}
            onDeleteSession={deleteSession}
            onNewSession={createSession}
          />
          <ChatInterface />
        </div>
      </div>
    </MainLayout>
  );
}
