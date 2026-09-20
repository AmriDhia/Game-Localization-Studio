import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Sparkles, Download, Copy, Check } from 'lucide-react';
import { translateFullText } from '../utils/translator';
import { TranslationItem } from '../types';

interface UploadSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranslation: (
    items: TranslationItem[],
    translatedText: string,
    originalText: string,
    fileName: string
  ) => void;
}

export const UploadSyncModal: React.FC<UploadSyncModalProps> = ({
  isOpen,
  onClose,
  onApplyTranslation,
}) => {
  const [pasteContent, setPasteContent] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [processedResult, setProcessedResult] = useState<{
    items: TranslationItem[];
    translatedText: string;
    totalLines: number;
    translatedCount: number;
    fileName: string;
    originalText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessText = (text: string, fileName = 'mole_game_2465.txt') => {
    if (!text.trim()) return;
    const res = translateFullText(text);
    setProcessedResult({
      items: res.items,
      translatedText: res.translatedText,
      totalLines: res.totalLines,
      translatedCount: res.translatedCount,
      fileName,
      originalText: text,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleProcessText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleApply = () => {
    if (!processedResult) return;
    onApplyTranslation(
      processedResult.items,
      processedResult.translatedText,
      processedResult.originalText,
      processedResult.fileName
    );
    onClose();
  };

  const handleDownload = () => {
    if (!processedResult) return;
    const blob = new Blob([processedResult.translatedText], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translated_${processedResult.fileName || 'mole_game_arabic_2465.txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    if (!processedResult) return;
    navigator.clipboard.writeText(processedResult.translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                مزامنة وترجمة ملف اللعبة الأصلي (2,465 سطراً)
              </h2>
              <p className="text-xs text-neutral-400">
                ترجمة فورية سطراً بسطر بنسبة 100% مع الحفاظ الدقيق على ترتيب الأسطر والتكرارات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Explanation Alert */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300/90 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-200">
                لماذا كان ملف الترجمة السابق 1,434 سطراً وملفك الأصلي 2,465 سطراً؟
              </p>
              <p className="text-neutral-300 leading-relaxed">
                ملف اللعبة الكامل يحتوي على <strong>2,465 سطراً</strong> شاملاً تكرارات الحوارات، الفواصل البرمجية، والأسطر الفارغة. عند استخراج نصوص اللعبة سابقاً تم تصفية التكرارات (Deduplication) ودمجها في 1,434 نصاً فريداً ومترجماً بالكامل.
              </p>
              <p className="text-amber-300/80">
                برفع أو لصق ملفك الأصلي هنا، سيقوم المحرك بتطبيق القاموس المترجم الكامل على جميع الـ 2,465 سطراً سطراً بسطر ليطابق محرك اللعبة تماماً!
              </p>
            </div>
          </div>

          {!processedResult ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="w-8 h-8 mx-auto text-amber-400 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-neutral-200">
                  انقر لاختيار ملف اللعبة الأصلي (.txt) أو اسحبه إلى هنا
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  يدعم ملف الـ 2465 سطراً مباشرة أو أي ملف نصوص خاص بلعبة M.O.L.E.
                </p>
              </div>

              {/* Or Paste */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  أو الصق محتوى ملف الـ 2,465 سطراً هنا مباشرة:
                </label>
                <textarea
                  rows={5}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="الصق أسطر الملف الأصلي هنا..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500 transition"
                  dir="ltr"
                />
                <div className="flex justify-end mt-2">
                  <button
                    disabled={!pasteContent.trim()}
                    onClick={() => handleProcessText(pasteContent, 'pasted_2465_lines.txt')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 font-semibold text-xs rounded-lg transition cursor-pointer"
                  >
                    معالجة وترجمة النص الملصق
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Result Summary */
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-100">
                      تمت معالجة وترجمة الملف بنجاح!
                    </h3>
                    <p className="text-xs text-neutral-400">
                      إجمالي الأسطر: <strong className="text-neutral-200">{processedResult.totalLines}</strong> سطراً | 
                      النصوص المعربة: <strong className="text-emerald-400">{processedResult.translatedCount}</strong>
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  {Math.round((processedResult.translatedCount / processedResult.totalLines) * 100)}% تعريب
                </span>
              </div>

              {/* Sample Preview */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                <div className="text-[11px] text-neutral-500 pb-1 border-b border-neutral-800">
                  معاينة أول 10 أسطر مترجمة:
                </div>
                {processedResult.items.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <span className="text-neutral-600 w-8 shrink-0">{item.id}:</span>
                    <span className="text-neutral-200 truncate">{item.translated || '<empty>'}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => setProcessedResult(null)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition"
                >
                  اختيار ملف آخر
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الـ {processedResult.totalLines} سطراً</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الملف المعرب ({processedResult.totalLines} سطراً)</span>
                  </button>

                  <button
                    onClick={handleApply}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition"
                  >
                    تطبيق وعرض في الاستوديو
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
