"use client";

import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  Engine,
  LLMSettings,
  LLMSettingsResponse,
  ModelOption,
  ProviderCatalogEntry,
} from "@/lib/api";
import {
  deleteChatSession,
  fetchLLMSettings,
  fetchOllamaModels,
  updateLLMSettings,
} from "@/lib/api";
import {
  DEFAULT_LLM_SETTINGS,
  canUseEngine as canUseEngineForSettings,
} from "@/lib/llm";

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

interface AppState {
  sessions: Session[];
  currentSessionId: string;
  llmSettings: LLMSettings;
  providerCatalog: ProviderCatalogEntry[];
  ollamaModels: ModelOption[];
  engine: Engine;
  latency: number;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsLoaded: boolean;
  settingsError: string | null;
  sessionError: string | null;

  createSession: () => void;
  deleteSession: (id: string) => Promise<void>;
  switchSession: (id: string) => void;
  updateLatency: (ms: number) => void;
  addMessage: (sessionId: string, message: Message) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  refreshLLMSettings: () => Promise<void>;
  saveLLMSettings: (settings: LLMSettings) => Promise<LLMSettings>;
  refreshOllamaModels: () => Promise<ModelOption[]>;
  switchEngine: (engine: Engine) => Promise<void>;
  clearSettingsError: () => void;
  clearSessionError: () => void;
  canUseEngine: (engine: Engine, candidateSettings?: LLMSettings) => boolean;
}

interface StoredSession extends Omit<Session, "createdAt"> {
  createdAt: string;
}

interface InitialAppState {
  sessions: Session[];
  currentSessionId: string;
}

const AppContext = createContext<AppState | undefined>(undefined);

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
    };
  }

  const savedSessions = localStorage.getItem("rag_sessions");
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

  const currentSessionId =
    savedCurrentId && sessions.some((session) => session.id === savedCurrentId)
      ? savedCurrentId
      : sessions[0]?.id ?? "";

  return {
    sessions,
    currentSessionId,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState<InitialAppState>(() => loadInitialAppState());
  const [sessions, setSessions] = useState<Session[]>(initialState.sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    initialState.currentSessionId
  );
  const [llmSettings, setLlmSettings] =
    useState<LLMSettings>(DEFAULT_LLM_SETTINGS);
  const [providerCatalog, setProviderCatalog] = useState<ProviderCatalogEntry[]>(
    []
  );
  const [ollamaModels, setOllamaModels] = useState<ModelOption[]>([]);
  const [latency, setLatency] = useState<number>(0);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("rag_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("rag_current_session", currentSessionId);
    }
  }, [currentSessionId]);

  const applySettingsResponse = useCallback((data: LLMSettingsResponse) => {
    setLlmSettings(data.settings);
    setProviderCatalog(data.provider_catalog);
    setSettingsLoaded(true);
    setSettingsError(null);
  }, []);

  const refreshLLMSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await fetchLLMSettings();
      applySettingsResponse(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "加载模型配置失败";
      setSettingsError(message);
    } finally {
      setSettingsLoading(false);
    }
  }, [applySettingsResponse]);

  useEffect(() => {
    void refreshLLMSettings();
  }, [refreshLLMSettings]);

  useEffect(() => {
    if (settingsLoaded || settingsLoading) {
      return;
    }

    const retryTimer = window.setTimeout(() => {
      void refreshLLMSettings();
    }, 2000);

    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [refreshLLMSettings, settingsLoaded, settingsLoading]);

  const saveLLMSettings = useCallback(
    async (settings: LLMSettings) => {
      setSettingsSaving(true);
      try {
        const data = await updateLLMSettings(settings);
        applySettingsResponse(data);
        return data.settings;
      } catch (err) {
        const message = err instanceof Error ? err.message : "保存模型配置失败";
        setSettingsError(message);
        throw err;
      } finally {
        setSettingsSaving(false);
      }
    },
    [applySettingsResponse]
  );

  const refreshOllamaModels = useCallback(async () => {
    const data = await fetchOllamaModels();
    setOllamaModels(data.models);
    return data.models;
  }, []);

  const clearSettingsError = useCallback(() => {
    setSettingsError(null);
  }, []);

  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  const canUseEngine = useCallback(
    (targetEngine: Engine, candidateSettings: LLMSettings = llmSettings) =>
      canUseEngineForSettings(candidateSettings, targetEngine),
    [llmSettings]
  );

  const switchEngine = useCallback(
    async (targetEngine: Engine) => {
      if (targetEngine === llmSettings.engine) {
        return;
      }

      if (!canUseEngineForSettings(llmSettings, targetEngine)) {
        const message =
          targetEngine === "api"
            ? "请先在设置页完成 API Provider、API Key 和模型配置"
            : "请先在设置页选择可用的 Ollama 模型";
        setSettingsError(message);
        throw new Error(message);
      }

      await saveLLMSettings({
        ...llmSettings,
        engine: targetEngine,
      });
    },
    [llmSettings, saveLLMSettings]
  );

  const createSession = () => {
    setSessionError(null);
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

  const deleteSession = useCallback(
    async (id: string) => {
      setSessionError(null);

      try {
        await deleteChatSession(id);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "删除会话失败，请稍后重试。";
        setSessionError(message);
        return;
      }

      setSessions((prev) => {
        const filtered = prev.filter((session) => session.id !== id);
        if (id === currentSessionId && filtered.length > 0) {
          setCurrentSessionId(filtered[0].id);
        }
        return filtered;
      });
    },
    [currentSessionId]
  );

  const switchSession = (id: string) => {
    setSessionError(null);
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
            lastMessage:
              message.role === "user" ? message.content : session.lastMessage,
          };
        }
        return session;
      })
    );
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, title } : session
      )
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
        llmSettings,
        providerCatalog,
        ollamaModels,
        engine: llmSettings.engine,
        latency,
        settingsLoading,
        settingsSaving,
        settingsLoaded,
        settingsError,
        sessionError,
        createSession,
        deleteSession,
        switchSession,
        updateLatency,
        addMessage,
        updateSessionTitle,
        refreshLLMSettings,
        saveLLMSettings,
        refreshOllamaModels,
        switchEngine,
        clearSettingsError,
        clearSessionError,
        canUseEngine,
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
