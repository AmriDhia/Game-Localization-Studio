import React, { useState } from 'react';
import { TranslationItem } from '../types';
import { Copy, Check, ArrowLeftRight, Edit3, Sparkles, CheckCheck, Undo2 } from 'lucide-react';

interface TranslationViewerProps {
  items: TranslationItem[];
  searchQuery: string;
  onUpdateItem?: (id: number, newTranslation: string) => void;
  onTranslateItemWithAI?: (item: TranslationItem) => Promise<string | void>;
}

export const TranslationViewer: React.FC<TranslationViewerProps> = ({
  items,
  searchQuery,
  onUpdateItem,
  onTranslateItemWithAI,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEditing = (item: TranslationItem) => {
    setEditingId(item.id);
    setEditText(item.translated);
  };

  const saveEditing = (id: number) => {
    if (onUpdateItem) {
      onUpdateItem(id, editText);
    }
    setEditingId(null);
  };

  const handleAiTranslate = async (item: TranslationItem) => {
    if (!onTranslateItemWithAI) return;
    setTranslatingId(item.id);
    try {
      await onTranslateItemWithAI(item);
    } finally {
      setTranslatingId(null);
    }
  };

  // Render text with highlighting and special tag badges
  const renderFormattedText = (text: string, isRTL: boolean) => {
    if (!text) return <span className="text-neutral-600 italic">فارغ</span>;

    // Split by <cf>
    if (text.includes('<cf>')) {
      const parts = text.split('<cf>');
      return (
        <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {parts.map((part, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-1">
              {idx > 0 && (
                <span className="inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 select-none">
                  &lt;cf&gt;
                </span>
              )}
              <span>{part || ' '}</span>
            </div>
          ))}
        </div>
      );
    }

    if (text.includes('{/n}')) {
      const parts = text.split('{/n}');
      return (
        <div className={`space-y-1 ${isRTL ? 'text-right' : 'text-left'}`}>
          {parts.map((part, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-1">
              {idx > 0 && (
                <span className="inline-block text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 select-none">
                  {'{/n}'}
                </span>
              )}
              <span>{part || ' '}</span>
            </div>
          ))}
        </div>
      );
    }

    return <span>{text}</span>;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-500">
        <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium text-neutral-400">لا توجد نتائج مطابقة لبحثك</p>
        <p className="text-xs mt-1">جرب كلمات بحث أخرى أو قم بتغيير التصنيف المختار</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-neutral-950/90 px-4 py-3 border-b border-neutral-800 text-xs font-semibold text-neutral-400">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5 text-left pl-2">النص الأصلي (English / Source)</div>
          <div className="col-span-5 text-right pr-2">الترجمة العربية (Arabic)</div>
          <div className="col-span-1 text-center">إجراءات</div>
        </div>

        {/* List of Strings */}
        <div className="divide-y divide-neutral-800/60 max-h-[calc(100vh-280px)] overflow-y-auto">
          {items.map((item) => {
            const isCopied = copiedId === item.id;
            const isEditing = editingId === item.id;
            const isTranslating = translatingId === item.id;

            return (
              <div
                key={item.id}
                id={`translation-row-${item.id}`}
                className={`grid grid-cols-12 px-4 py-3 text-xs hover:bg-neutral-800/40 transition group items-start ${
                  isEditing ? 'bg-amber-500/5' : ''
                }`}
              >
                {/* Line number & metadata */}
                <div className="col-span-1 text-center font-mono text-neutral-500 pt-0.5 select-none space-y-1">
                  <div>{item.id}</div>
                  {item.key && !item.key.startsWith('line_') && (
                    <div
                      className="text-[9px] bg-neutral-800 text-neutral-400 px-1 py-0.2 rounded truncate max-w-[50px] mx-auto"
                      title={`المفتاح: ${item.key}`}
                    >
                      {item.key}
                    </div>
                  )}
                </div>

                {/* Original English String */}
                <div
                  className="col-span-5 text-left text-neutral-300 font-mono pl-2 pr-4 break-words leading-relaxed select-text"
                  dir="ltr"
                >
                  {item.context && (
                    <div className="text-[10px] text-amber-500/80 mb-0.5 font-sans flex items-center gap-1">
                      <span className="px-1.5 py-0.2 bg-amber-500/10 rounded border border-amber-500/20">
                        {item.context}
                      </span>
                    </div>
                  )}
                  {renderFormattedText(item.original, false)}
                </div>

                {/* Arabic Translated String */}
                <div
                  className="col-span-5 text-right pr-2 pl-4 break-words leading-relaxed select-text"
                  dir="rtl"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-neutral-950 border border-amber-500 rounded-lg p-2 text-xs text-neutral-100 font-sans focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[11px] text-neutral-400 hover:text-neutral-200 rounded bg-neutral-800"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => saveEditing(item.id)}
                          className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded"
                        >
                          حفظ التعديل
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDoubleClick={() => startEditing(item)}
                      className={`cursor-pointer group/text min-h-[22px] flex items-center justify-end ${
                        item.isTranslated ? 'text-neutral-100 font-medium' : 'text-neutral-500 font-mono'
                      }`}
                      title="انقر مرتين للتعديل اليدوي"
                    >
                      {item.translated ? (
                        renderFormattedText(item.translated, true)
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg hover:bg-amber-500/20 transition">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>بانتظار التعريب (انقر مرتين للكتابة أو استخدم الذكاء الاصطناعي)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions: Copy, Edit, AI Translate */}
                <div className="col-span-1 flex items-center justify-center gap-1 pt-0.5">
                  <button
                    onClick={() => handleCopy(item.translated, item.id)}
                    className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition cursor-pointer"
                    title="نسخ الترجمة"
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => startEditing(item)}
                    className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="تعديل يدوي"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {onTranslateItemWithAI && (
                    <button
                      onClick={() => handleAiTranslate(item)}
                      disabled={isTranslating}
                      className={`p-1.5 rounded-md hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 ${
                        !item.isTranslated
                          ? 'text-amber-400 hover:text-amber-300 opacity-100 bg-amber-500/10 hover:bg-amber-500/20'
                          : 'text-neutral-400 hover:text-cyan-400 opacity-0 group-hover:opacity-100'
                      }`}
                      title="ترجمة هذا السطر بالذكاء الاصطناعي (Gemini)"
                    >
                      <Sparkles
                        className={`w-3.5 h-3.5 ${isTranslating ? 'animate-spin text-amber-400' : ''}`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-neutral-950/90 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>يتم عرض {items.length} نصاً</span>
          <span className="hidden sm:inline">
            يمكنك النقر مرتين على أي ترجمة لتعديلها يدوياً أو استخدام أيقونة القلم بجانبها
          </span>
        </div>
      </div>
    </div>
  );
};
