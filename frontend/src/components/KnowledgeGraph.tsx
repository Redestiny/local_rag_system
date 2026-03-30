"use client";

import { useState, useEffect, useImperativeHandle, forwardRef, useEffectEvent } from "react";
import { fetchVectors, searchVectors as searchVectorDocuments } from "@/lib/api";
import type { VectorMetadata } from "@/lib/api";

export interface VectorDocument {
  id: string;
  content: string;
  metadata?: VectorMetadata;
  distance?: number;
}

export interface KnowledgeGraphRef {
  refresh: () => void;
}

interface KnowledgeGraphProps {
  searchQuery?: string;
}

const KnowledgeGraph = forwardRef<KnowledgeGraphRef, KnowledgeGraphProps>(({ searchQuery }, ref) => {
  const [documents, setDocuments] = useState<VectorDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchVectors();
      setDocuments(data);
    } catch (err) {
      console.error("获取向量数据失败", err);
    } finally {
      setLoading(false);
    }
  };

  const searchVectors = useEffectEvent(async (query: string) => {
    if (!query.trim()) {
      await fetchDocuments();
      return;
    }

    setLoading(true);
    try {
      const data = await searchVectorDocuments(query, 10);
      setDocuments(data);
    } catch (err) {
      console.error("搜索向量失败", err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Trigger search when searchQuery prop changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      void searchVectors(searchQuery);
    }
  }, [searchQuery]);

  useImperativeHandle(ref, () => ({
    refresh: fetchDocuments
  }));

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc, idx) => (
            <div
              key={doc.id || idx}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all"
            >
              <p className="text-sm text-slate-700 line-clamp-4 mb-3 leading-relaxed">
                {doc.content}
              </p>

              {doc.distance !== undefined && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-xs text-slate-600 font-medium">
                    相似度: {(1 - doc.distance).toFixed(3)}
                  </span>
                </div>
              )}

              {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(doc.metadata).map(([key, value]) => (
                    <div key={key} className="text-xs text-slate-500 flex items-start gap-2">
                      <span className="font-medium text-slate-600 min-w-[60px]">{key}:</span>
                      <span className="flex-1 truncate">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <svg
              className="w-20 h-20 mx-auto mb-4 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-bold text-slate-700 mb-2">暂无向量数据</h3>
            <p className="text-slate-500 mb-4">向量数据库中还没有数据</p>
            <button
              onClick={fetchDocuments}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
            >
              重新加载
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

KnowledgeGraph.displayName = "KnowledgeGraph";

export default KnowledgeGraph;
