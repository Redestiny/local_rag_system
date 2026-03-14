"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/chat");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
          R
        </div>
        <p className="text-slate-600 text-sm">正在跳转到对话页面...</p>
      </div>
    </div>
  );
}
