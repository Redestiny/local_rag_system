"use client";

import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import TopBar from "@/components/TopBar";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import DocumentManager from "@/components/DocumentManager";

export default function KnowledgeGraphPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<"vectors" | "documents">("vectors");

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <TopBar
          title="知识图谱"
          subtitle="向量数据库可视化与检索"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
          }
          actions={
            activeTab === "vectors" ? (
              <div className="relative w-80">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="搜索向量库... (按 Enter 搜索)"
                  className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            ) : null
          }
        />

        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("vectors")}
                  className={`px-6 py-3 font-medium transition-all ${
                    activeTab === "vectors"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  向量数据
                </button>
                <button
                  onClick={() => setActiveTab("documents")}
                  className={`px-6 py-3 font-medium transition-all ${
                    activeTab === "documents"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  文档管理
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              {activeTab === "vectors" ? (
                <KnowledgeGraph searchQuery={searchQuery} />
              ) : (
                <DocumentManager />
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
