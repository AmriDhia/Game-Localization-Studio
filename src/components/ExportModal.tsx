import React, { useState } from 'react';
import { Download, Copy, Check, X, FileText, FileCode, Table as TableIcon, CheckCircle2 } from 'lucide-react';
import { TranslationItem, FileMetadata, FileType } from '../types';
import { exportToTxt, exportToJson, exportToWorkbook, exportToCsv } from '../utils/fileHandler';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: TranslationItem[];
  metadata?: FileMetadata;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  metadata,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<FileType>(metadata?.fileType || 'txt');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const baseFileName = metadata?.fileName
    ? metadata.fileName.replace(/\.[^/.]+$/, '')
    : 'game_translation';

  const handleDownload = (format: FileType) => {
    if (format === 'txt') {
      const content = exportToTxt(items);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      triggerDownload(blob, `${baseFileName}_arabic.txt`);
    } else if (format === 'json') {
      const content = exportToJson(items, metadata);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      triggerDownload(blob, `${baseFileName}_arabic.json`);
    } else if (format === 'csv') {
      const content = exportToCsv(items);
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
      triggerDownload(blob, `${baseFileName}_arabic.csv`);
    } else {
      // xlsx or xls
      const uint8 = exportToWorkbook(items, metadata);
      const blob = new Blob([uint8.buffer as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      triggerDownload(blob, `${baseFileName}_arabic.xlsx`);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    let content = '';
    if (selectedFormat === 'json') {
      content = exportToJson(items, metadata);
    } else if (selectedFormat === 'csv') {
      content = exportToCsv(items);
    } else {
      content = exportToTxt(items);
    }
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100">تصدير وتحميل نصوص اللعبة المعربة</h2>
              <p className="text-xs text-neutral-400">
                إجمالي الأسطر: {items.length} | اختر الصيغة المناسبة لمحرك لعبتك
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <label className="block text-xs font-semibold text-neutral-300">
            حدد صيغة التصدير المطلوبة:
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* TXT */}
            <button
              onClick={() => setSelectedFormat('txt')}
              className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                selectedFormat === 'txt'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs font-bold">ملف TXT</span>
              <span className="text-[10px] text-neutral-500">نصي سطراً بسطر</span>
            </button>

            {/* JSON */}
            <button
              onClick={() => setSelectedFormat('json')}
              className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                selectedFormat === 'json'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <FileCode className="w-6 h-6" />
              <span className="text-xs font-bold">ملف JSON</span>
              <span className="text-[10px] text-neutral-500">حفظ هيكلية المفاتيح</span>
            </button>

            {/* XLSX */}
            <button
              onClick={() => setSelectedFormat('xlsx')}
              className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                selectedFormat === 'xlsx' || selectedFormat === 'xls'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <TableIcon className="w-6 h-6" />
              <span className="text-xs font-bold">إكسل Excel</span>
              <span className="text-[10px] text-neutral-500">.xlsx جدول ثنائي اللغة</span>
            </button>

            {/* CSV */}
            <button
              onClick={() => setSelectedFormat('csv')}
              className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                selectedFormat === 'csv'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <TableIcon className="w-6 h-6" />
              <span className="text-xs font-bold">جدول CSV</span>
              <span className="text-[10px] text-neutral-500">مفصول بفواصل</span>
            </button>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-400 flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                اسم الملف عند الحفظ:
              </span>
              <span className="font-mono text-amber-400 text-[11px]">
                {baseFileName}_arabic.{selectedFormat === 'xls' ? 'xlsx' : selectedFormat}
              </span>
            </div>
            {selectedFormat !== 'xlsx' && selectedFormat !== 'xls' && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={() => handleDownload(selectedFormat)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير وتحميل الملف ({selectedFormat.toUpperCase()})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
