"use client";

import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import TopBar from "@/components/TopBar";
import TemplateList from "@/components/TemplateList";
import TemplateEditor from "@/components/TemplateEditor";
import { TemplateInfo } from "@/lib/api";

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTemplateSelect = (template: TemplateInfo) => {
    setSelectedTemplate(template);
  };

  const handleTemplateCreated = (template: TemplateInfo) => {
    setSelectedTemplate(template);
    setRefreshKey(k => k + 1);
  };

  const handleTemplateUpdated = () => {
    setRefreshKey(k => k + 1);
  };

  const handleTemplateDeleted = () => {
    setSelectedTemplate(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <MainLayout>
      <div className="flex h-full min-h-0 flex-col">
        <TopBar
          title="预设模板"
          subtitle="管理RAG知识库模板，快速切换文档组合"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />

        <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-800">模板列表</h2>
                  <p className="text-sm text-slate-500 mt-1">点击模板进行编辑</p>
                </div>
                <TemplateList
                  key={refreshKey}
                  onSelect={handleTemplateSelect}
                  onCreated={handleTemplateCreated}
                  onDeleted={handleTemplateDeleted}
                  selectedId={selectedTemplate?.id}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="font-semibold text-slate-800">模板配置</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedTemplate ? `编辑: ${selectedTemplate.name}` : "请选择或创建一个模板"}
                  </p>
                </div>
                <TemplateEditor
                  template={selectedTemplate}
                  onUpdated={handleTemplateUpdated}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}