"use client";

import { useState } from "react";
import { useApp, Message } from "@/contexts/AppContext";
import { sendChatMessage } from "@/lib/api";

export default function ChatInterface() {
  const { sessions, currentSessionId, addMessage, updateLatency, updateSessionTitle } =
    useApp();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !currentSessionId) return;

    setIsTyping(true);
    const startTime = Date.now();

    const userMsg: Message = { role: "user", content: input };
    addMessage(currentSessionId, userMsg);

    // Auto-update session title from first user message
    if (currentSession && currentSession.messages.length === 1 && currentSession.title === "新对话") {
      const title = input.slice(0, 30) + (input.length > 30 ? "..." : "");
      updateSessionTitle(currentSessionId, title);
    }

    const currentInput = input;
    setInput("");

    try {
      const data = await sendChatMessage(currentInput);
      updateLatency(Date.now() - startTime);

      if (data.status === "success") {
        const assistantMsg: Message = { role: "assistant", content: data.reply };
        addMessage(currentSessionId, assistantMsg);
      }
    } catch (err) {
      console.error("连接后端失败", err);
      const errorMsg: Message = {
        role: "assistant",
        content:
          err instanceof Error
            ? `抱歉，请求失败：${err.message}`
            : "抱歉，连接后端服务失败。请检查后端服务是否正常运行。",
      };
      addMessage(currentSessionId, errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100/30 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-xs text-slate-500">思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white/80 backdrop-blur-sm p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的问题..."
              disabled={isTyping}
              className="w-full pl-5 pr-32 py-4 border-2 border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 font-medium shadow-inner shadow-slate-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors hidden sm:block"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                发送
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <p className="text-[11px] font-medium text-slate-400">
              Nexus RAG - Powered by 本地大模型 & ChromaDB. 内容由 AI 生成，请注意甄别。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
