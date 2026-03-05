"use client";

import { useState } from "react";

export default function Dashboard() {
  const [latency, setLatency] = useState(0);
  const [engine, setEngine] = useState("api");
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState([
    { role: "assistant", content: "系统初始化完成。本地 Ollama 引擎已就绪，ChromaDB 向量库已连接。有什么我可以帮您？" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return; // 如果正在输入则拦截

    setIsTyping(true); // 开启“思考中”状态
    const startTime = Date.now(); // 记录起始时间戳

    // 先把用户消息塞进对话列表
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput(""); // 清空输入框

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          engine: engine // 动态传递当前选中的引擎
        }),
      });

      const data = await response.json();
      setLatency(Date.now() - startTime); // 计算耗时：当前时间 - 起始时间

      if (data.status === "success") {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      console.error("连接后端失败", err);
    } finally {
      setIsTyping(false); // 无论成功失败，关闭“思考中”状态
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. 左侧导航边栏 (Sidebar) */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm z-20">
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
            R
          </div>
          <span className="ml-3 font-bold text-lg hidden lg:block tracking-wide text-slate-800">
            Nexus RAG
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center p-3 text-indigo-600 bg-indigo-50/80 rounded-xl transition-colors font-medium border border-indigo-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            <span className="ml-3 hidden lg:block">对话探索</span>
          </a>
          <a href="#" className="flex items-center p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            <span className="ml-3 font-medium hidden lg:block">知识图谱 (TXT)</span>
          </a>
          <a href="#" className="flex items-center p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="ml-3 font-medium hidden lg:block">模型与系统配置</span>
          </a>
        </nav>

        {/* 底部切换器容器 */}
        {/* mt-auto 配合 flex-col 会将此 div 推到底部 */}
        <div className="mt-auto border-t border-slate-100 p-4 bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 mb-3 px-2 uppercase tracking-widest text-center">
            推理引擎切换
          </p>
          <div className="bg-white p-1 rounded-xl flex gap-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setEngine("api")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${engine === "api"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              云端 API
            </button>
            <button
              onClick={() => setEngine("ollama")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${engine === "ollama"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              本地模型
            </button>
          </div>
        </div>
        
        {/* 用户头像区 */}
        <div className="p-4 border-t border-slate-100 flex justify-center lg:justify-start items-center bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-sm border-2 border-white flex-shrink-0"></div>
          <div className="ml-3 hidden lg:block overflow-hidden">
            <p className="text-sm font-bold text-slate-700 truncate">Dev User</p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-500 block animate-pulse"></span> 本地计算节点
            </p>
          </div>
        </div>
      </aside>

      {/* 2. 主体内容区 */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
        
        {/* 顶部状态栏 */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">工作台 <span className="text-slate-400 font-normal text-base ml-2">/ 控制中心</span></h2>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="font-semibold text-slate-600">{engine === 'api' ? 'DeepSeek 云端' : 'Ollama 本地'} 已就绪</span>
            </div>
          </div>
        </header>

        {/* Dashboard 便当盒网格布局 */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[600px]">
            
            {/* 左侧：数据面板区 (占据 4 列) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* 状态卡片 1 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                <h3 className="text-slate-500 text-sm font-semibold mb-1">推理引擎状态</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{latency}</span>
                  <span className="text-sm font-medium text-slate-500">ms 延迟</span>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-medium">FastAPI 接口</span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md font-semibold text-xs">等待接入</span>
                </div>
              </div>

              {/* 状态卡片 2 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <h3 className="text-slate-500 text-sm font-semibold mb-1">ChromaDB 向量数据</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-slate-800 tracking-tight">0</span>
                  <span className="text-sm font-medium text-slate-500">Chunks</span>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">系统当前配置为纯文本索引模式，不支持 PDF 等复杂文档解析。</p>
                </div>
              </div>

              {/* 视觉重心卡片 */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex-1 min-h-[160px]">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">架构联调准备就绪</h3>
                  <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
                    前端 UI 与交互逻辑已完成挂载。下一步需切换至后端开发，编写 Uvicorn 接口代码。
                  </p>
                  <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-indigo-600 transition-all shadow-sm">
                    查看部署架构
                  </button>
                </div>
                {/* 装饰光晕 */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-20 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* 右侧：核心对话区 (占据 8 列) */}
            <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
              
              {/* 对话区头部 */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm z-10">
                <h3 className="font-bold text-slate-700 flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  智能会话终端
                </h3>
                <div className="flex gap-2">
                   <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                   </button>
                </div>
              </div>
              
              {/* 消息滚动区 */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#f8fafc]/50">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group animate-fade-in-up`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200 flex items-center justify-center mr-3 flex-shrink-0 mt-1 shadow-sm">
                        <span className="text-indigo-600 text-[10px] font-black tracking-tighter">AI</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm font-medium"
                          : "bg-white text-slate-700 border border-slate-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* 极客风输入框 */}
              <div className="p-5 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="relative flex items-center group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入指令，调用本地知识库进行检索与生成..."
                    className="w-full pl-5 pr-36 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder-slate-400 font-medium shadow-inner shadow-slate-50/50"
                  />
                  <div className="absolute right-2 flex items-center gap-2">
                    <button type="button" className="p-2 text-slate-400 hover:text-indigo-500 transition-colors hidden sm:block">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                    >
                      发送
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
                </form>
                <div className="text-center mt-3">
                  <p className="text-[11px] font-medium text-slate-400">Nexus RAG - Powered by 本地大模型 & ChromaDB. 内容由 AI 生成，请注意甄别。</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}