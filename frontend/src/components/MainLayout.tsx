"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import type { Engine } from "@/lib/api";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const {
    engine,
    settingsLoading,
    settingsSaving,
    switchEngine,
    canUseEngine,
    clearSettingsError,
  } = useApp();
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleEngineSwitch = async (targetEngine: Engine) => {
    setSwitchError(null);
    clearSettingsError();

    try {
      await switchEngine(targetEngine);
    } catch (err) {
      setSwitchError(err instanceof Error ? err.message : "切换推理引擎失败");
    }
  };

  const navItems = [
    {
      href: "/chat",
      label: "对话探索",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
    {
      href: "/knowledge-graph",
      label: "知识图谱",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      href: "/settings",
      label: "模型与系统配置",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Left Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm z-20">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            R
          </div>
          <span className="ml-3 font-bold text-lg hidden lg:block tracking-wide text-slate-800">
            Nexus RAG
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-xl transition-colors font-medium ${
                  isActive
                    ? "text-indigo-600 bg-indigo-50/80 border border-indigo-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {item.icon}
                <span className="ml-3 hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Engine Switcher */}
        <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 mb-3 px-2 uppercase tracking-widest text-center">
            推理引擎切换
          </p>
          <div className="bg-white p-1 rounded-xl flex gap-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => void handleEngineSwitch("api")}
              disabled={
                settingsLoading ||
                settingsSaving ||
                (engine !== "api" && !canUseEngine("api"))
              }
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                engine === "api"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent"
              }`}
            >
              API
            </button>
            <button
              onClick={() => void handleEngineSwitch("ollama")}
              disabled={
                settingsLoading ||
                settingsSaving ||
                (engine !== "ollama" && !canUseEngine("ollama"))
              }
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                engine === "ollama"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 disabled:text-slate-300 disabled:hover:bg-transparent"
              }`}
            >
              本地
            </button>
          </div>
          {(settingsLoading || settingsSaving) && (
            <p className="mt-3 text-[11px] text-center text-slate-400">
              {settingsLoading ? "正在同步配置..." : "正在保存配置..."}
            </p>
          )}
          {switchError && (
            <p className="mt-3 text-[11px] text-center text-rose-500">{switchError}</p>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
