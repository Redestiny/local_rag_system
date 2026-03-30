"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  lastMessage?: string;
  messages: Message[];
}

type Engine = "api" | "ollama";

interface AppState {
  sessions: Session[];
  currentSessionId: string;
  engine: Engine;
  latency: number;

  createSession: () => void;
  deleteSession: (id: string) => void;
  switchSession: (id: string) => void;
  setEngine: (engine: Engine) => void;
  updateLatency: (ms: number) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
}

interface StoredSession extends Omit<Session, "createdAt"> {
  createdAt: string;
}

interface InitialAppState {
  sessions: Session[];
  currentSessionId: string;
  engine: Engine;
}

const AppContext = createContext<AppState | undefined>(undefined);

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createInitialSession(): Session {
  return {
    id: generateId(),
    title: "新对话",
    createdAt: new Date(),
    messages: [
      {
        role: "assistant",
        content: "系统初始化完成。LLM 引擎已就绪，ChromaDB 向量库已连接。有什么我可以帮您？",
      },
    ],
  };
}

function loadInitialAppState(): InitialAppState {
  if (typeof window === "undefined") {
    return {
      sessions: [],
      currentSessionId: "",
      engine: "api",
    };
  }

  const savedSessions = localStorage.getItem("rag_sessions");
  const savedEngine = localStorage.getItem("rag_engine") as Engine | null;
  const savedCurrentId = localStorage.getItem("rag_current_session");

  let sessions: Session[] = [];
  if (savedSessions) {
    const parsed = JSON.parse(savedSessions) as StoredSession[];
    sessions = parsed.map((session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
    }));
  }

  if (sessions.length === 0) {
    sessions = [createInitialSession()];
  }

  const currentSessionId = savedCurrentId && sessions.some((session) => session.id === savedCurrentId)
    ? savedCurrentId
    : sessions[0]?.id ?? "";

  return {
    sessions,
    currentSessionId,
    engine: savedEngine ?? "api",
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState<InitialAppState>(() => loadInitialAppState());
  const [sessions, setSessions] = useState<Session[]>(initialState.sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string>(initialState.currentSessionId);
  const [engine, setEngine] = useState<Engine>(initialState.engine);
  const [latency, setLatency] = useState<number>(0);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("rag_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("rag_engine", engine);
  }, [engine]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("rag_current_session", currentSessionId);
    }
  }, [currentSessionId]);

  const createSession = () => {
    const newSession: Session = {
      id: generateId(),
      title: "新对话",
      createdAt: new Date(),
      messages: [
        {
          role: "assistant",
          content: "系统初始化完成。LLM 引擎已就绪，ChromaDB 向量库已连接。有什么我可以帮您？",
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // If deleting current session, switch to first available
      if (id === currentSessionId && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const switchSession = (id: string) => {
    setCurrentSessionId(id);
  };

  const addMessage = (sessionId: string, message: Message) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          const updatedMessages = [...session.messages, message];
          return {
            ...session,
            messages: updatedMessages,
            lastMessage: message.role === "user" ? message.content : session.lastMessage,
          };
        }
        return session;
      })
    );
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, title } : session))
    );
  };

  const updateLatency = (ms: number) => {
    setLatency(ms);
  };

  return (
    <AppContext.Provider
      value={{
        sessions,
        currentSessionId,
        engine,
        latency,
        createSession,
        deleteSession,
        switchSession,
        setEngine,
        updateLatency,
        addMessage,
        updateSessionTitle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
