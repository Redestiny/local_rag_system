"use client";

import { useState, useEffect } from "react";

interface Document {
  id: number;
  filename: string;
  status: string;
  chunk_count: number;
  uploaded_at: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/documents/list");
      const data = await response.json();
      if (data.status === "success") {
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("获取文档列表失败", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.status === "success") {
        await fetchDocuments();
        e.target.value = "";
      }
    } catch (err) {
      console.error("上传失败", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个文档吗？")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/documents/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status === "success") {
        await fetchDocuments();
      }
    } catch (err) {
      console.error("删除失败", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <label className="cursor-pointer">
            <span className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all inline-block font-medium">
              {uploading ? "上传中..." : "选择文件上传"}
            </span>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <p className="text-sm text-slate-600 mt-3">支持 PDF 和 Word 文档</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <p className="font-medium text-slate-800">{doc.filename}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {doc.chunk_count} 个片段 · {doc.status === "completed" ? "已完成" : doc.status}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>暂无文档</p>
        </div>
      )}
    </div>
  );
}
