import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { TranslationViewer } from './components/TranslationViewer';
import { RawFileViewer } from './components/RawFileViewer';
import { FileImportModal } from './components/FileImportModal';
import { ExportModal } from './components/ExportModal';
import {
  TranslationItem,
  FilterCategory,
  FilterStatus,
  ViewMode,
  Stats,
  FileMetadata,
} from './types';
import rawTranslations from './data/translations.json';
import { exportToTxt } from './utils/fileHandler';

export default function App() {
  const [defaultItems] = useState<TranslationItem[]>(rawTranslations as TranslationItem[]);
  const [items, setItems] = useState<TranslationItem[]>(rawTranslations as TranslationItem[]);
  const [metadata, setMetadata] = useState<FileMetadata>({
    fileName: 'mole_raw_strings.txt',
    fileType: 'txt',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isCopied, setIsCopied] = useState(false);
  const [rawTranslatedContent, setRawTranslatedContent] = useState<string>('');
  const [rawOriginalContent, setRawOriginalContent] = useState<string>('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAiTranslating, setIsAiTranslating] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch for raw M.O.L.E. files
    fetch('/mole_game_translated_ar.txt')
      .then((r) => r.text())
      .then((t) => setRawTranslatedContent(t))
      .catch(() => {
        setRawTranslatedContent(defaultItems.map((i) => i.translated).join('\n'));
      });

    fetch('/mole_game_original.txt')
      .then((r) => r.text())
      .then((t) => setRawOriginalContent(t))
      .catch(() => {
        setRawOriginalContent(defaultItems.map((i) => i.original).join('\n'));
      });
  }, [defaultItems]);

  // Compute stats
  const stats: Stats = useMemo(() => {
    const totalLines = items.length;
    const translatedCount = items.filter((i) => i.isTranslated).length;
    const untranslatedCount = totalLines - translatedCount;
    const storyCount = items.filter((i) => i.category === 'story').length;
    const gameplayCount = items.filter((i) => i.category === 'gameplay').length;
    const uiCount = items.filter((i) => i.category === 'ui').length;
    const creditsCount = items.filter((i) => i.category === 'credits').length;

    return {
      totalLines,
      translatedCount,
      untranslatedCount,
      storyCount,
      gameplayCount,
      uiCount,
      creditsCount,
    };
  }, [items]);

  // Filtered items based on search, category, and status
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter === 'translated' && !item.isTranslated) return false;
      if (statusFilter === 'untranslated' && item.isTranslated) return false;

      // Category filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const origMatch = item.original.toLowerCase().includes(query);
        const transMatch = item.translated.toLowerCase().includes(query);
        const idMatch = String(item.id).includes(query);
        const keyMatch = item.key ? item.key.toLowerCase().includes(query) : false;
        const contextMatch = item.context ? item.context.toLowerCase().includes(query) : false;
        return origMatch || transMatch || idMatch || keyMatch || contextMatch;
      }

      return true;
    });
  }, [items, category, statusFilter, searchQuery]);

  // Handle loading any imported dataset (TXT, JSON, XLS, CSV)
  const handleLoadDataset = (
    newItems: TranslationItem[],
    newMeta: FileMetadata,
    startAiTranslate?: boolean
  ) => {
    setItems(newItems);
    setMetadata(newMeta);
    setRawTranslatedContent(newItems.map((i) => i.translated).join('\n'));
    setRawOriginalContent(newItems.map((i) => i.original).join('\n'));
    setStatusFilter('all');
    setCategory('all');
    setSearchQuery('');
    setAiMessage(
      `تم استيراد ${newItems.length} نصاً بصيغة ${newMeta.fileType.toUpperCase()}${
        newMeta.isUntranslatedFile ? ' (ملف غير معرب جاهز للترجمة)' : ''
      } بنجاح!`
    );
    setTimeout(() => setAiMessage(null), 4000);

    if (startAiTranslate) {
      setTimeout(() => {
        handleBatchAiTranslate(newItems, newMeta);
      }, 350);
    }
  };

  // Reset to default M.O.L.E. dataset
  const handleResetToDefault = () => {
    setItems(defaultItems);
    setMetadata({
      fileName: 'mole_raw_strings.txt',
      fileType: 'txt',
    });
    setRawTranslatedContent(defaultItems.map((i) => i.translated).join('\n'));
    setRawOriginalContent(defaultItems.map((i) => i.original).join('\n'));
    setStatusFilter('all');
    setCategory('all');
    setSearchQuery('');
  };

  // Inline edit an item
  const handleUpdateItem = (id: number, newTranslation: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isTrans = newTranslation !== item.original && newTranslation.trim().length > 0;
          return {
            ...item,
            translated: newTranslation,
            isTranslated: isTrans,
          };
        }
        return item;
      })
    );
  };

  // Single Item AI Translate
  const handleTranslateItemWithAI = async (item: TranslationItem): Promise<string | void> => {
    try {
      const response = await fetch('/api/ai-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.original,
          context: item.context || item.category,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل طلب الترجمة بالذكاء الاصطناعي');
      }

      const data = await response.json();
      if (data.translated) {
        handleUpdateItem(item.id, data.translated);
        return data.translated;
      }
    } catch (err: any) {
      console.error('Error translating with AI:', err);
      alert('تعذر الترجمة بالذكاء الاصطناعي: ' + (err?.message || 'خطأ غير معروف'));
    }
  };

  // Batch AI Translate for untranslated strings
  const handleBatchAiTranslate = async (
    targetItems: TranslationItem[] = items,
    targetMeta: FileMetadata = metadata
  ) => {
    const untranslatedItems = targetItems.filter((i) => !i.isTranslated && i.original.trim().length > 0);
    if (untranslatedItems.length === 0) {
      setAiMessage('كافة النصوص معربة بالفعل!');
      setTimeout(() => setAiMessage(null), 3000);
      return;
    }

    setIsAiTranslating(true);
    setAiMessage(`جاري ترجمة دفعة من النصوص (${Math.min(untranslatedItems.length, 50)} نصاً) بنموذج الذكاء الاصطناعي...`);

    try {
      const batch = untranslatedItems.slice(0, 50).map((i) => ({ id: i.id, text: i.original }));
      const response = await fetch('/api/ai-translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: batch,
          gameContext: targetMeta.fileName || 'Game dialogue, UI, and quests',
        }),
      });

      if (!response.ok) {
        throw new Error('فشل طلب الترجمة التراكمية');
      }

      const data = await response.json();
      const results: Array<{ id: number | string; translated: string }> = data.results || [];

      if (results.length > 0) {
        const resultMap = new Map<number, string>();
        results.forEach((r) => {
          resultMap.set(Number(r.id), r.translated);
        });

        setItems((prev) =>
          prev.map((item) => {
            const trans = resultMap.get(item.id);
            if (trans) {
              return {
                ...item,
                translated: trans,
                isTranslated: true,
              };
            }
            return item;
          })
        );

        setAiMessage(`تمت ترجمة ${results.length} نصاً بالذكاء الاصطناعي بنجاح!`);
      } else {
        setAiMessage('لم يتم استلام نصوص مترجمة من الخادم.');
      }
    } catch (err: any) {
      console.error('Batch translation failed:', err);
      setAiMessage('حدث خطأ أثناء الترجمة بالذكاء الاصطناعي: ' + (err?.message || ''));
    } finally {
      setIsAiTranslating(false);
      setTimeout(() => setAiMessage(null), 5000);
    }
  };

  // Copy full translated file
  const handleCopyAll = () => {
    const contentToCopy = exportToTxt(items);
    navigator.clipboard.writeText(contentToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950 font-sans">
      {/* Sticky Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCount={items.length}
        translatedCount={stats.translatedCount}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onBatchAiTranslate={handleBatchAiTranslate}
        isAiTranslating={isAiTranslating}
        onCopyAll={handleCopyAll}
        isCopied={isCopied}
        currentFileName={metadata.fileName}
        currentFileType={metadata.fileType}
        onResetToDefault={metadata.fileName !== 'mole_raw_strings.txt' ? handleResetToDefault : undefined}
      />

      {/* Floating AI Notification */}
      {aiMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-neutral-900 border border-amber-500/40 text-neutral-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>{aiMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {viewMode === 'table' && (
          <>
            <StatsBar
              stats={stats}
              metadata={metadata}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onBatchAiTranslate={handleBatchAiTranslate}
              isAiTranslating={isAiTranslating}
            />
            <TranslationViewer
              items={filteredItems}
              searchQuery={searchQuery}
              onUpdateItem={handleUpdateItem}
              onTranslateItemWithAI={handleTranslateItemWithAI}
            />
          </>
        )}

        {viewMode === 'raw_translated' && (
          <RawFileViewer
            title={`النص المترجم كاملاً (${items.length} سجلاً)`}
            subtitle="نصوص اللعبة معربة بالكامل مع الحفاظ التام على علامات التنسيق والوسوم <cf> و {/n}"
            content={exportToTxt(items)}
            fileName={`${metadata.fileName.replace(/\.[^/.]+$/, '')}_arabic.txt`}
            isArabic={true}
          />
        )}

        {viewMode === 'raw_original' && (
          <RawFileViewer
            title={`النص الأصلي للعبة (${items.length} سجلاً)`}
            subtitle="النص المصدري كما تم استخراجه من الملف المختار"
            content={items.map((i) => i.original).join('\n')}
            fileName={metadata.fileName}
            isArabic={false}
          />
        )}
      </main>

      {/* Import Modal (TXT / JSON / XLS / XLSX / CSV) */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onLoadDataset={handleLoadDataset}
      />

      {/* Export Modal (TXT / JSON / XLS / XLSX / CSV) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={items}
        metadata={metadata}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-900/60 py-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            برنامج ترجمة نصوص الألعاب الشامل (TXT / JSON / XLS / XLSX) | دعم كافة المحركات وصون وسوم التنسيق
          </span>
          <span className="font-mono text-neutral-400">
            {metadata.fileType.toUpperCase()} • {items.length} عنصراً
          </span>
        </div>
      </footer>
    </div>
  );
}
