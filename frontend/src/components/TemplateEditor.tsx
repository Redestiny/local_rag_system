"use client";

import { useState, useEffect } from "react";
import { TemplateInfo, DocumentInfo, fetchAllDocuments, updateTemplate } from "@/lib/api";

interface TemplateEditorProps {
  template: TemplateInfo | null;
  onUpdated: () => void;
}

export default function TemplateEditor({ template, onUpdated }: TemplateEditorProps) {
  const [name, setName] = useState("");
  const [availableDocs, setAvailableDocs] = useState<DocumentInfo[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setSelectedDocIds(template.documents.map(d => d.id));
    } else {
      setName("");
      setSelectedDocIds([]);
    }
  }, [template]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await fetchAllDocuments();
      setAvailableDocs(data.documents || []);
    } catch (err) {
      console.error("获取文档列表失败", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSave = async () => {
    if (!template || !name.trim()) return;
    setSaving(true);
    try {
      await updateTemplate(template.id, {
        name: name.trim(),
        document_ids: selectedDocIds
      });
      onUpdated();
    } catch (err) {
      console.error("保存失败", err);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const toggleDoc = (docId: number) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  if (!template) {
    return (
      <div className="p-6 text-center text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">请从左侧选择一个模板进行编辑</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">模板名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          关联文档 ({selectedDocIds.length} 个)
        </label>

        {loadingDocs ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        ) : availableDocs.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3">
            {availableDocs.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <label
                  key={doc.id}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleDoc(doc.id)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-slate-800">{doc.filename}</p>
                    <p className="text-xs text-slate-500">{doc.chunk_count} 个片段</p>
                  </div>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 border border-dashed border-slate-300 rounded-lg">
            <p className="text-sm">暂无可用文档，请先上传文档</p>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? "保存中..." : "保存修改"}
      </button>
    </div>
  );
}