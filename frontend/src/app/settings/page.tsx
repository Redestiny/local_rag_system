"use client";

import MainLayout from "@/components/MainLayout";
import TopBar from "@/components/TopBar";
import { useApp } from "@/contexts/AppContext";

export default function SettingsPage() {
  const { engine, setEngine } = useApp();

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <TopBar
          title="模型与系统配置"
          subtitle="系统设置与模型管理"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100/30">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Engine Configuration */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                推理引擎配置
              </h2>
              <p className="text-sm text-slate-600 mb-4">选择用于对话的 LLM 推理引擎</p>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50">
                  <input
                    type="radio"
                    name="engine"
                    value="api"
                    checked={engine === "api"}
                    onChange={(e) => setEngine(e.target.value as "api" | "ollama")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-800">API 引擎</div>
                    <div className="text-xs text-slate-500">使用 DeepSeek API 云端推理</div>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full">
                    推荐
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50">
                  <input
                    type="radio"
                    name="engine"
                    value="ollama"
                    checked={engine === "ollama"}
                    onChange={(e) => setEngine(e.target.value as "api" | "ollama")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-slate-800">本地引擎 (Ollama)</div>
                    <div className="text-xs text-slate-500">使用本地 Ollama 模型推理</div>
                  </div>
                </label>
              </div>
            </div>

            {/* System Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <span className="text-sm font-medium text-slate-800">ChromaDB</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">嵌入模型</span>
                  <span className="text-sm font-medium text-slate-800">text-embedding-3-small</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">当前引擎</span>
                  <span className="text-sm font-medium text-indigo-600">
                    {engine === "api" ? "API 引擎" : "本地引擎"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-slate-600">后端服务</span>
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    运行中
                  </span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">关于</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Nexus RAG 是一个基于检索增强生成（RAG）技术的本地知识库系统。
                结合向量数据库和大语言模型，为您提供智能、准确的知识检索与对话服务。
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
