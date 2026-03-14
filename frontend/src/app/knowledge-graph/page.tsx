"use client";

import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import TopBar from "@/components/TopBar";
import KnowledgeGraph from "@/components/KnowledgeGraph";

export default function KnowledgeGraphPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

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
          }
        />
        <KnowledgeGraph searchQuery={searchQuery} />
      </div>
    </MainLayout>
  );
}
