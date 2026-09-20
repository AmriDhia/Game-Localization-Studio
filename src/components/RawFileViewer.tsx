import React, { useState } from 'react';
import { Copy, Check, Download, FileText } from 'lucide-react';

interface RawFileViewerProps {
  title: string;
  subtitle: string;
  content: string;
  fileName: string;
  isArabic?: boolean;
}

export const RawFileViewer: React.FC<RawFileViewerProps> = ({
  title,
  subtitle,
  content,
  fileName,
  isArabic = false
}) => {
  const [copied, setCopied] = useState(false);
  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Header Toolbar */}
        <div className="px-5 py-3.5 bg-neutral-950/90 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100">{title}</h2>
              <p className="text-[11px] text-neutral-400">{subtitle} ({lines.length} سطراً)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم نسخ الملف</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>نسخ المحتوى</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل ({fileName})</span>
            </button>
          </div>
        </div>

        {/* Code View with Line Numbers */}
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto bg-neutral-950 p-4 font-mono text-xs text-neutral-300">
          <div className="space-y-1">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 hover:bg-neutral-900/60 px-2 py-0.5 rounded"
              >
                <span className="w-12 text-neutral-600 text-right select-none shrink-0 font-mono text-[11px]">
                  {idx + 1}
                </span>
                <span
                  className={`break-all leading-relaxed ${isArabic ? 'text-right w-full text-neutral-200' : 'text-left w-full'}`}
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  {line || <span className="text-neutral-700 italic">{'<empty>'}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-5 py-2.5 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-500 flex justify-between items-center">
          <span>ترميز الملف: UTF-8</span>
          <span>جاهز للاستبدال المباشر في مجلد اللعبة</span>
        </div>

      </div>
    </div>
  );
};
