"use client";

import { useState, useEffect } from "react";
import { TemplateInfo, fetchTemplates, createTemplate, deleteTemplate } from "@/lib/api";

interface TemplateListProps {
  onSelect: (template: TemplateInfo) => void;
  onCreated: (template: TemplateInfo) => void;
  onDeleted: () => void;
  selectedId?: number;
}

export default function TemplateList({
  onSelect,
  onCreated,
  onDeleted,
  selectedId
}: TemplateListProps) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("获取模板列表失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await createTemplate(newName.trim());
      if (result.template) {
        setNewName("");
        await loadTemplates();
        onCreated(result.template);
      }
    } catch (err) {
      console.error("创建模板失败", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("确定要删除这个模板吗？")) return;
    try {
      await deleteTemplate(id);
      await loadTemplates();
      onDeleted();
    } catch (err) {
      console.error("删除模板失败", err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="输入新模板名称..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? "创建中..." : "新建"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      ) : templates.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedId === t.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.documents.length} 个文档
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, t.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="删除模板"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">暂无模板，点击上方新建</p>
        </div>
      )}
    </div>
  );
}