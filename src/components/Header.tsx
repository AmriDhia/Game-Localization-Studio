import React from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Terminal,
  Upload,
  Sparkles,
  FileCode,
  Table as TableIcon,
  FileText,
} from 'lucide-react';
import { FilterCategory, FilterStatus, ViewMode, FileType } from '../types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  category: FilterCategory;
  onCategoryChange: (c: FilterCategory) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (s: FilterStatus) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  totalCount: number;
  translatedCount: number;
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onBatchAiTranslate: () => void;
  isAiTranslating: boolean;
  onCopyAll: () => void;
  isCopied: boolean;
  currentFileName?: string;
  currentFileType?: FileType;
  onResetToDefault?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  totalCount,
  translatedCount,
  onOpenExportModal,
  onOpenImportModal,
  onBatchAiTranslate,
  isAiTranslating,
  onCopyAll,
  isCopied,
  currentFileName,
  currentFileType,
  onResetToDefault,
}) => {
  const percentage = totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;

  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-neutral-100 tracking-tight">
                  برنامج ترجمة نصوص الألعاب
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {percentage}% معرب
                </span>
                {currentFileType && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-neutral-800 text-amber-400 border border-neutral-700 uppercase">
                    {currentFileType}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                مترجم متكامل يدعم ملفات <strong className="text-neutral-300">TXT</strong> و{' '}
                <strong className="text-neutral-300">JSON</strong> و{' '}
                <strong className="text-neutral-300">XLS / XLSX / CSV</strong> مع صون وسوم المحركات
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {currentFileName && currentFileName !== 'mole_raw_strings.txt' && (
              <div className="flex items-center gap-1.5 bg-neutral-800/80 border border-neutral-700 px-2.5 py-1.5 rounded-lg text-xs">
                <span className="text-neutral-300 font-medium truncate max-w-[140px]">
                  {currentFileName}
                </span>
                {onResetToDefault && (
                  <button
                    onClick={onResetToDefault}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline mr-1 cursor-pointer"
                    title="الرجوع إلى نصوص M.O.L.E. الافتراضية"
                  >
                    استعادة
                  </button>
                )}
              </div>
            )}

            {/* Import Button */}
            <button
              id="open-import-modal-btn"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 hover:border-amber-500/40 transition cursor-pointer"
              title="فتح أو استيراد ملف نصوص جديد (TXT / JSON / XLS)"
            >
              <Upload className="w-4 h-4" />
              <span>استيراد ملف (TXT / JSON / XLS)</span>
            </button>

            {/* AI Batch Translate Button */}
            <button
              id="batch-ai-translate-btn"
              onClick={onBatchAiTranslate}
              disabled={isAiTranslating || translatedCount === totalCount}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 transition cursor-pointer disabled:opacity-50"
              title="ترجمة النصوص المتبقية آلياً بالذكاء الاصطناعي مع الحفاظ على وسوم اللعبة"
            >
              <Sparkles className={`w-4 h-4 ${isAiTranslating ? 'animate-spin' : ''}`} />
              <span>{isAiTranslating ? 'جاري الترجمة...' : 'ترجمة بالـ AI (Gemini)'}</span>
            </button>

            {/* Copy Button */}
            <button
              id="copy-all-btn"
              onClick={onCopyAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
              title="نسخ الملف المعرب بالكامل"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-neutral-400" />
                  <span>نسخ</span>
                </>
              )}
            </button>

            {/* Export / Download Button */}
            <button
              id="open-export-modal-btn"
              onClick={onOpenExportModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير وتحميل ({totalCount})</span>
            </button>
          </div>
        </div>

        {/* Filters, Status, Search, and Controls */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث في النصوص أو المفاتيح..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Status Tabs (All / Translated / Untranslated) */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 text-xs shrink-0">
            <button
              onClick={() => onStatusFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-neutral-800 text-neutral-100 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              الكل ({totalCount})
            </button>
            <button
              onClick={() => onStatusFilterChange('translated')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'translated'
                  ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              المعربة ({translatedCount})
            </button>
            <button
              onClick={() => onStatusFilterChange('untranslated')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                statusFilter === 'untranslated'
                  ? 'bg-amber-500/20 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              غير المعربة ({totalCount - translatedCount})
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-neutral-500 ml-1 shrink-0" />
            {(['all', 'story', 'gameplay', 'ui', 'credits', 'system'] as FilterCategory[]).map(
              (cat) => {
                const labels: Record<FilterCategory, string> = {
                  all: 'كافة الأقسام',
                  story: 'حوارات وقصة',
                  gameplay: 'أنظمة اللعب',
                  ui: 'واجهة وتحكم',
                  credits: 'فريق العمل',
                  system: 'أكواد وأخرى',
                };
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-filter-${cat}`}
                    onClick={() => onCategoryChange(cat)}
                    className={`px-2 py-1 rounded-md transition whitespace-nowrap cursor-pointer text-[11px] ${
                      active
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {labels[cat]}
                  </button>
                );
              }
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800 shrink-0 text-xs">
            <button
              id="view-table-btn"
              onClick={() => onViewModeChange('table')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              جدول المقارنة
            </button>
            <button
              id="view-raw-translated-btn"
              onClick={() => onViewModeChange('raw_translated')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'raw_translated'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>النص المعرب</span>
            </button>
            <button
              id="view-raw-original-btn"
              onClick={() => onViewModeChange('raw_original')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                viewMode === 'raw_original'
                  ? 'bg-neutral-800 text-amber-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              الأصل (EN)
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
