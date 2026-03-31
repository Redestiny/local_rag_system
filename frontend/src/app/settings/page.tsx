"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "@/components/MainLayout";
import TopBar from "@/components/TopBar";
import { useApp } from "@/contexts/AppContext";
import type { ApiProvider, Engine, LLMSettings } from "@/lib/api";
import {
  DEFAULT_LLM_SETTINGS,
  canUseEngine,
  cloneLLMSettings,
  getActiveModel,
  getActiveProviderLabel,
  getProviderCatalogEntry,
} from "@/lib/llm";

export default function SettingsPage() {
  const {
    llmSettings,
    providerCatalog,
    ollamaModels,
    settingsLoaded,
    settingsLoading,
    settingsSaving,
    settingsError,
    saveLLMSettings,
    refreshOllamaModels,
    clearSettingsError,
  } = useApp();
  const [draftSettings, setDraftSettings] =
    useState<LLMSettings>(DEFAULT_LLM_SETTINGS);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false);

  useEffect(() => {
    if (settingsLoaded) {
      setDraftSettings(cloneLLMSettings(llmSettings));
      setFeedbackMessage(null);
      setOllamaError(null);
    }
  }, [llmSettings, settingsLoaded]);

  const handleRefreshOllamaModels = useCallback(async () => {
    setLoadingOllamaModels(true);
    setOllamaError(null);

    try {
      await refreshOllamaModels();
    } catch (err) {
      setOllamaError(err instanceof Error ? err.message : "刷新 Ollama 模型失败");
    } finally {
      setLoadingOllamaModels(false);
    }
  }, [refreshOllamaModels]);

  useEffect(() => {
    if (
      settingsLoaded &&
      draftSettings.engine === "ollama" &&
      ollamaModels.length === 0 &&
      !loadingOllamaModels &&
      !ollamaError
    ) {
      void handleRefreshOllamaModels();
    }
  }, [
    draftSettings.engine,
    handleRefreshOllamaModels,
    loadingOllamaModels,
    ollamaError,
    ollamaModels.length,
    settingsLoaded,
  ]);

  const activeProviderEntry = getProviderCatalogEntry(
    providerCatalog,
    draftSettings.apiProvider
  );
  const activeProviderConfig = draftSettings.providers[draftSettings.apiProvider];
  const isOllamaSelectionAvailable = ollamaModels.some(
    (model) => model.id === draftSettings.ollama.model
  );
  const ollamaModelOptions = useMemo(() => {
    if (
      draftSettings.ollama.model &&
      !ollamaModels.some((model) => model.id === draftSettings.ollama.model)
    ) {
      return [
        {
          id: draftSettings.ollama.model,
          name: `${draftSettings.ollama.model}（当前配置，未在本机发现）`,
        },
        ...ollamaModels,
      ];
    }

    return ollamaModels;
  }, [draftSettings.ollama.model, ollamaModels]);
  const isDraftDirty =
    JSON.stringify(draftSettings) !== JSON.stringify(llmSettings);
  const isApiReady = canUseEngine(draftSettings, "api");
  const isOllamaReady =
    Boolean(draftSettings.ollama.model.trim()) &&
    isOllamaSelectionAvailable &&
    !loadingOllamaModels &&
    !ollamaError;
  const formDisabled = !settingsLoaded || settingsSaving;
  const canSaveDraft =
    !formDisabled &&
    !settingsSaving &&
    isDraftDirty &&
    (draftSettings.engine === "api" ? isApiReady : isOllamaReady);
  const currentProviderLabel = getActiveProviderLabel(
    llmSettings,
    providerCatalog
  );
  const currentModelLabel = getActiveModel(llmSettings);

  const updateEngine = (engine: Engine) => {
    clearSettingsError();
    setFeedbackMessage(null);
    setOllamaError(null);
    setDraftSettings((prev) => ({
      ...prev,
      engine,
    }));
  };

  const updateProvider = (provider: ApiProvider) => {
    clearSettingsError();
    setFeedbackMessage(null);
    setDraftSettings((prev) => ({
      ...prev,
      apiProvider: provider,
    }));
  };

  const updateActiveProviderConfig = (
    field: "apiKey" | "model",
    value: string
  ) => {
    clearSettingsError();
    setFeedbackMessage(null);
    setDraftSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [prev.apiProvider]: {
          ...prev.providers[prev.apiProvider],
          [field]: value,
        },
      },
    }));
  };

  const updateOllamaModel = (value: string) => {
    clearSettingsError();
    setFeedbackMessage(null);
    setDraftSettings((prev) => ({
      ...prev,
      ollama: {
        model: value,
      },
    }));
  };

  const handleSave = async () => {
    clearSettingsError();
    setFeedbackMessage(null);

    try {
      await saveLLMSettings(draftSettings);
      setFeedbackMessage("模型配置已保存，后续对话会自动使用当前选择。");
    } catch (err) {
      if (!(err instanceof Error)) {
        setFeedbackMessage("保存失败，请稍后重试。");
      }
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <TopBar
          title="模型与系统配置"
          subtitle="统一管理全局 LLM Provider、API Key 与模型选择"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          actions={
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSaveDraft}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {settingsSaving ? "保存中..." : "保存配置"}
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100/30">
          <div className="max-w-4xl mx-auto space-y-6">
            {(settingsError || feedbackMessage || ollamaError) && (
              <div className="space-y-3">
                {settingsError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {settingsError}
                  </div>
                )}
                {feedbackMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {feedbackMessage}
                  </div>
                )}
                {ollamaError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {ollamaError}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                推理引擎配置
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                选择后续所有对话默认使用的推理引擎
              </p>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50">
                  <input
                    type="radio"
                    name="engine"
                    value="api"
                    checked={draftSettings.engine === "api"}
                    onChange={() => updateEngine("api")}
                    disabled={formDisabled}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-800">API 引擎</div>
                    <div className="text-xs text-slate-500">
                      使用 GLM、DeepSeek 或 MiniMax 云端推理
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                    云端
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50">
                  <input
                    type="radio"
                    name="engine"
                    value="ollama"
                    checked={draftSettings.engine === "ollama"}
                    onChange={() => updateEngine("ollama")}
                    disabled={formDisabled}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-800">
                      本地引擎 (Ollama)
                    </div>
                    <div className="text-xs text-slate-500">
                      使用本机已安装的 Ollama 模型推理
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {draftSettings.engine === "api" ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">
                    API Provider 选择
                  </h2>
                  <p className="text-sm text-slate-600">
                    每个 Provider 会分别保存 API Key 和默认模型，切换后自动回填。
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {providerCatalog.map((provider) => {
                    const isActive = draftSettings.apiProvider === provider.id;
                    const savedConfig = draftSettings.providers[provider.id];

                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => updateProvider(provider.id)}
                        disabled={formDisabled}
                        className={`text-left rounded-xl border p-4 transition-all ${
                          isActive
                            ? "border-indigo-500 bg-indigo-50/70 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-slate-800">
                            {provider.label}
                          </span>
                          {savedConfig.apiKey.trim() && (
                            <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-100 text-emerald-700">
                              已配置
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                          {provider.description}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {provider.base_url}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      {activeProviderEntry?.label ?? "API"} Key
                    </label>
                    <input
                      type="password"
                      value={activeProviderConfig.apiKey}
                      onChange={(e) =>
                        updateActiveProviderConfig("apiKey", e.target.value)
                      }
                      disabled={formDisabled}
                      placeholder={`输入 ${activeProviderEntry?.label ?? "当前 Provider"} 的 API Key`}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <p className="text-xs text-slate-400">
                      仅保存在服务器端的 `Data/llm_settings.json`，不会写入浏览器
                      localStorage。
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">
                      默认模型
                    </label>
                    <select
                      value={activeProviderConfig.model}
                      onChange={(e) =>
                        updateActiveProviderConfig("model", e.target.value)
                      }
                      disabled={formDisabled}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {(activeProviderEntry?.models ?? []).map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400">
                      保存后，后续所有对话都会自动使用该 Provider 与模型。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">
                      Ollama 模型选择
                    </h2>
                    <p className="text-sm text-slate-600">
                      从本机 Ollama 服务读取已安装模型，只允许保存当前可用模型。
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRefreshOllamaModels()}
                    disabled={formDisabled || loadingOllamaModels}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {loadingOllamaModels ? "刷新中..." : "刷新模型列表"}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    本地模型
                  </label>
                  <select
                    value={draftSettings.ollama.model}
                    onChange={(e) => updateOllamaModel(e.target.value)}
                    disabled={formDisabled}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {ollamaModelOptions.length === 0 ? (
                      <option value="">暂无可用模型</option>
                    ) : (
                      ollamaModelOptions.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-slate-400">
                    当前选择必须存在于本机 Ollama 已安装模型中，否则无法保存。
                  </p>
                </div>

                {!isOllamaSelectionAvailable && draftSettings.ollama.model && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    当前配置的模型不在本机 Ollama 列表中，请刷新后重新选择。
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                系统信息
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">向量数据库</span>
                  <span className="text-sm font-medium text-slate-800">
                    ChromaDB
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">嵌入模型</span>
                  <span className="text-sm font-medium text-slate-800">
                    bge-small-zh-v1.5
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">当前引擎</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {llmSettings.engine === "api"
                      ? `${currentProviderLabel} API`
                      : "Ollama 本地引擎"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">当前模型</span>
                  <span className="text-sm font-medium text-slate-800">
                    {currentModelLabel}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-600">后端服务</span>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {settingsLoading && !settingsLoaded ? "加载配置中" : "运行中"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">关于</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nexus RAG
                是一个基于检索增强生成（RAG）技术的本地知识库系统，现在支持统一配置
                GLM、DeepSeek、MiniMax 与 Ollama，让您可以按场景切换不同的大模型能力。
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">Version 1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
