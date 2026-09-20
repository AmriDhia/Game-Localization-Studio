import React from 'react';
import { Stats, FileMetadata } from '../types';
import { BookOpen, Cpu, ShieldAlert, Users, Layers, Info, Sparkles, Upload, FileCode, Table as TableIcon } from 'lucide-react';

interface StatsBarProps {
  stats: Stats;
  metadata?: FileMetadata;
  onOpenImportModal?: () => void;
  onBatchAiTranslate?: () => void;
  isAiTranslating?: boolean;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  metadata,
  onOpenImportModal,
  onBatchAiTranslate,
  isAiTranslating,
}) => {
  const percent = stats.totalLines > 0 ? Math.round((stats.translatedCount / stats.totalLines) * 100) : 0;
  const untranslated = stats.totalLines - stats.translatedCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>إجمالي النصوص</span>
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
          </div>
          <div className="text-xl font-bold text-neutral-100">{stats.totalLines.toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {metadata ? `صيغة ${metadata.fileType.toUpperCase()}` : 'نصوص اللعبة'}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span>النصوص المعربة</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-xl font-bold text-emerald-400">{stats.translatedCount.toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-emerald-500/80 mt-0.5">نسبة الإنجاز {percent}%</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
            <span>نصوص بانتظار التعريب</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-xl font-bold text-amber-400">{untranslated.toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">جاهزة للترجمة الفورية</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>حوارات وقصة</span>
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-neutral-200">{stats.storyCount.toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">مذكرات، شخصيات</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>أنظمة وتحكم</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-neutral-200">{stats.gameplayCount.toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">أوامر ومؤشرات</div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>واجهة وقوائم</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-neutral-200">{(stats.uiCount + stats.creditsCount).toLocaleString('ar-EG')}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">أزرار وإعدادات وفريق</div>
        </div>
      </div>

      {/* Progress & File Metadata Notice */}
      <div className="mt-4 bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-neutral-200">توافق تام مع وسوم محركات الألعاب:</strong> يحافظ البرنامج تلقائياً على وسوم اللعبة البرمجية مثل{' '}
            <code className="px-1.5 py-0.5 bg-neutral-800 text-amber-300 rounded font-mono text-[11px]">&lt;cf&gt;</code> و{' '}
            <code className="px-1.5 py-0.5 bg-neutral-800 text-amber-300 rounded font-mono text-[11px]">{"{/n}"}</code> والمتغيرات البرمجية ومفاتيح الـ JSON لضمان تشغيل ملف الترجمة مباشرة داخل اللعبة.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-32 bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <span className="font-mono text-neutral-300 font-bold">{percent}%</span>
        </div>
      </div>

      {/* Untranslated Alert Banner with 1-Click AI Translation */}
      {untranslated > 0 && onBatchAiTranslate && (
        <div className="mt-2.5 bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              يوجد <strong>{untranslated}</strong> نصاً غير معرب في هذا الملف. يمكنك تعريبها دفعة واحدة باستخدام نموذج Gemini للذكاء الاصطناعي مع الحفاظ التام على وسوم اللعبة.
            </span>
          </div>
          <button
            onClick={onBatchAiTranslate}
            disabled={isAiTranslating}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiTranslating ? 'animate-spin' : ''}`} />
            <span>{isAiTranslating ? 'جاري التعريب بالـ AI...' : 'تعريب المتبقي بالذكاء الاصطناعي'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
