import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  FileCode,
  Table as TableIcon,
  FileType as FileTypeIcon,
  Play,
  RotateCcw,
  Layers,
  Settings2,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  parseTxtFile,
  parseJsonFile,
  parseSpreadsheet,
  inspectSpreadsheet,
} from '../utils/fileHandler';
import { TranslationItem, FileMetadata, FileType, SpreadsheetInspection } from '../types';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDataset: (items: TranslationItem[], metadata: FileMetadata, startAiTranslate?: boolean) => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onLoadDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteType, setPasteType] = useState<FileType>('txt');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Spreadsheet inspection state for XLS/XLSX/CSV files
  const [spreadsheetInspection, setSpreadsheetInspection] = useState<SpreadsheetInspection | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [selectedSourceCol, setSelectedSourceCol] = useState<number>(0);
  const [selectedTargetCol, setSelectedTargetCol] = useState<number>(-1);
  const [selectedIdCol, setSelectedIdCol] = useState<number>(-1);
  const [hasHeaderToggle, setHasHeaderToggle] = useState<boolean>(true);

  // Preview of parsed file before applying
  const [parsedPreview, setParsedPreview] = useState<{
    items: TranslationItem[];
    metadata: FileMetadata;
    translatedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    setSpreadsheetInspection(null);

    try {
      const fileName = file.name;
      const lower = fileName.toLowerCase();

      if (lower.endsWith('.json')) {
        const text = await file.text();
        const res = parseJsonFile(text, fileName);
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const inspection = inspectSpreadsheet(buffer, fileName);
        setSpreadsheetInspection(inspection);
        setSelectedSheet(inspection.activeSheet);
        setSelectedSourceCol(inspection.recommendedSourceCol);
        setSelectedTargetCol(inspection.recommendedTargetCol);
        setSelectedIdCol(inspection.recommendedIdCol);
        setHasHeaderToggle(inspection.hasHeader);

        const res = parseSpreadsheet(buffer, fileName, {
          sheetName: inspection.activeSheet,
          sourceCol: inspection.recommendedSourceCol,
          targetCol: inspection.recommendedTargetCol,
          idCol: inspection.recommendedIdCol,
          hasHeader: inspection.hasHeader,
        });

        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else {
        // Assume text / .txt or raw file
        const text = await file.text();
        const res = parseTxtFile(text, fileName);
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err?.message || 'تعذر قراءة الملف، يرجى التأكد من صحة الصيغة والمحتوى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetChange = (newSheet: string) => {
    if (!spreadsheetInspection) return;
    try {
      setSelectedSheet(newSheet);
      const reInspect = inspectSpreadsheet(
        spreadsheetInspection.buffer,
        spreadsheetInspection.fileName,
        newSheet
      );
      setSpreadsheetInspection(reInspect);
      setSelectedSourceCol(reInspect.recommendedSourceCol);
      setSelectedTargetCol(reInspect.recommendedTargetCol);
      setSelectedIdCol(reInspect.recommendedIdCol);
      setHasHeaderToggle(reInspect.hasHeader);

      const res = parseSpreadsheet(spreadsheetInspection.buffer, spreadsheetInspection.fileName, {
        sheetName: newSheet,
        sourceCol: reInspect.recommendedSourceCol,
        targetCol: reInspect.recommendedTargetCol,
        idCol: reInspect.recommendedIdCol,
        hasHeader: reInspect.hasHeader,
      });

      const transCount = res.items.filter((i) => i.isTranslated).length;
      setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل في قراءة ورقة العمل المحددة.');
    }
  };

  const handleColumnMappingChange = (
    newSource: number,
    newTarget: number,
    newId: number,
    newHasHeader: boolean
  ) => {
    if (!spreadsheetInspection) return;
    try {
      setSelectedSourceCol(newSource);
      setSelectedTargetCol(newTarget);
      setSelectedIdCol(newId);
      setHasHeaderToggle(newHasHeader);

      const res = parseSpreadsheet(spreadsheetInspection.buffer, spreadsheetInspection.fileName, {
        sheetName: selectedSheet,
        sourceCol: newSource,
        targetCol: newTarget,
        idCol: newId,
        hasHeader: newHasHeader,
      });

      const transCount = res.items.filter((i) => i.isTranslated).length;
      setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل في تطبيق توزيع الأعمدة.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleProcessPastedText = () => {
    if (!pasteContent.trim()) return;
    setErrorMsg(null);
    setSpreadsheetInspection(null);
    try {
      if (pasteType === 'json') {
        const res = parseJsonFile(pasteContent, 'pasted_data.json');
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else {
        const res = parseTxtFile(pasteContent, 'pasted_strings.txt');
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل في تحليل النص الملصق.');
    }
  };

  // Sample presets for quick testing
  const loadSample = async (type: 'mole_json' | 'mole_csv' | 'quest_json' | 'untranslated_xls') => {
    setErrorMsg(null);
    setIsLoading(true);
    setSpreadsheetInspection(null);

    try {
      if (type === 'mole_json') {
        const sample = {
          game_title: 'M.O.L.E. Subterranean Excavator',
          system_messages: {
            drill_online: 'DRILL SYSTEM ONLINE. RPM STABLE.',
            engine_warning: 'WARNING: ENGINE OVERHEAT IN COMPARTMENT 3',
            hull_integrity: 'HULL INTEGRITY AT 42 PERCENT. EVACUATION RECOMMENDED.',
            core_power: 'POWER CORE CHARGING: 88 PERCENT',
          },
          dialogues: [
            { id: 'DIA_01', speaker: 'Dr. Aris Thorne', text: "The drill won't hold under this magma pressure!" },
            { id: 'DIA_02', speaker: 'Operator Miller', text: 'Divert hydraulic fluids to secondary cooling immediately.' },
          ],
        };
        const res = parseJsonFile(JSON.stringify(sample, null, 2), 'mole_dialogue_sample.json');
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else if (type === 'untranslated_xls') {
        // Build untranslated sample with XLSX in memory
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const wsData = [
          ['String_ID', 'Original_Text', 'Arabic_Translation', 'Context'],
          ['UI_START', 'Start Expedition', '', 'Main Menu Button'],
          ['UI_SETTINGS', 'Audio & Video Settings', '', 'Main Menu Button'],
          ['UI_QUIT', 'Exit Game', '', 'Main Menu Button'],
          ['DIA_INTRO_01', 'Welcome to the underground facility, technician.', '', 'Narrator'],
          ['DIA_INTRO_02', 'Your mission is to stabilize the geothermal core before eruption.', '', 'Narrator'],
          ['WARN_HEAT', 'Danger: Ambient temperature exceeding safety limits!', '', 'System Alert'],
          ['SYS_DRILL_MAX', 'Excavation drill operating at maximum capacity.', '', 'Cockpit HUD'],
          ['ITEM_BATTERY', 'Heavy Duty Titanium Battery Cell', '', 'Inventory Item'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'GameDialogues');
        const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

        const inspection = inspectSpreadsheet(buf, 'Untranslated_Game_Texts.xlsx');
        setSpreadsheetInspection(inspection);
        setSelectedSheet(inspection.activeSheet);
        setSelectedSourceCol(inspection.recommendedSourceCol);
        setSelectedTargetCol(inspection.recommendedTargetCol);
        setSelectedIdCol(inspection.recommendedIdCol);
        setHasHeaderToggle(inspection.hasHeader);

        const res = parseSpreadsheet(buf, 'Untranslated_Game_Texts.xlsx', {
          sheetName: inspection.activeSheet,
          sourceCol: inspection.recommendedSourceCol,
          targetCol: inspection.recommendedTargetCol,
          idCol: inspection.recommendedIdCol,
          hasHeader: inspection.hasHeader,
        });
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else if (type === 'mole_csv') {
        const csvContent = `ID,Key,Original,Context
1,SYS_DRILL,DRILL SYSTEM ONLINE. RPM STABLE.,HUD
2,SYS_OVERHEAT,WARNING: ENGINE OVERHEAT IN COMPARTMENT 3,Alert
3,SYS_RAD,ALERT: HAZARDOUS RADIATION DETECTED,Alarm
4,DIA_01,The seismic sensors are spiking uncontrollably!,Dialogue`;
        const encoder = new TextEncoder();
        const buffer = encoder.encode(csvContent).buffer;
        const res = parseSpreadsheet(buffer, 'mole_strings.csv');
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      } else if (type === 'quest_json') {
        const quests = [
          {
            id: 'QUEST_01',
            title: 'Subterranean Rescue',
            description: 'Locate the trapped mining crew in Sector 4-B.',
            objectives: [
              'Repair primary drill bit',
              'Clear rockfall obstruction',
              'Extract personnel safely',
            ],
          },
        ];
        const res = parseJsonFile(JSON.stringify(quests, null, 2), 'quest_log.json');
        const transCount = res.items.filter((i) => i.isTranslated).length;
        setParsedPreview({ items: res.items, metadata: res.metadata, translatedCount: transCount });
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'فشل في تحميل النموذج.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (startAi: boolean = false) => {
    if (!parsedPreview) return;
    onLoadDataset(parsedPreview.items, parsedPreview.metadata, startAi);
    onClose();
  };

  const isUntranslated = parsedPreview && parsedPreview.translatedCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <span>استيراد ملف نصوص اللعبة (TXT, JSON, XLS, XLSX)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  دعم الملفات غير المترجمة والمترجمة
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                يدعم قراءة جداول الإكسل تلقائياً، والتعرف الذكي على أعمدة النصوص والسياق
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-6 pt-2 gap-2">
          <button
            onClick={() => {
              setActiveTab('upload');
              setParsedPreview(null);
              setSpreadsheetInspection(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>رفع ملف (XLS / XLSX / TXT / JSON)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('paste');
              setParsedPreview(null);
              setSpreadsheetInspection(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>لصق نصوص أو JSON</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('samples');
              setParsedPreview(null);
              setSpreadsheetInspection(null);
            }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'samples'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>نماذج إكسل جاهزة للتجربة</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!parsedPreview ? (
            <>
              {/* Tab 1: Upload */}
              {activeTab === 'upload' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                      dragActive
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.json,.xls,.xlsx,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Upload className="w-10 h-10 mx-auto text-amber-400 mb-3 opacity-90" />
                    <h3 className="text-sm font-bold text-neutral-200 mb-1">
                      اسحب وأفلت ملف نصوص اللعبة هنا، أو انقر للاختيار من جهازك
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                      الصيغ المدعومة: جداول نصوص وإكسل <code className="text-emerald-400">.xls / .xlsx / .csv</code> (مترجمة أو غير مترجمة)، ملفات نصية <code className="text-amber-400">.txt</code>، وملفات ترجمة برمجية <code className="text-cyan-400">.json</code>
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3">
                      <TableIcon className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                      <div className="font-bold text-neutral-200">ملفات إكسل XLS / XLSX</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">قراءة الملفات غير المترجمة وتعيين الأعمدة بدقة</div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3">
                      <FileText className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                      <div className="font-bold text-neutral-200">ملفات أسطر TXT</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">مطابقة الأسطر 1:1 وحفظ وسوم &lt;cf&gt;</div>
                    </div>
                    <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-3">
                      <FileCode className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                      <div className="font-bold text-neutral-200">شفرات JSON</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">حفظ المفاتيح والشجرة البرمجية بالكامل</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Paste */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      اختر نوع المحتوى الملصق:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPasteType('txt')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          pasteType === 'txt'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        نصوص أسطر (TXT)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasteType('json')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          pasteType === 'json'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        شفرة JSON
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder={
                      pasteType === 'json'
                        ? '{\n  "menu_start": "Start Game",\n  "menu_options": "Options"\n}'
                        : 'DRILL SYSTEM ONLINE\nWARNING: OVERHEAT IN SECTOR 3\nMISSION COMPLETE'
                    }
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleProcessPastedText}
                      disabled={!pasteContent.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      تحليل النص الملصق ومعاينته
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Samples */}
              {activeTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-neutral-400">
                    اختر نموذجاً للتجربة الفورية للتحقق من كفاءة قراءة الجداول غير المترجمة والمترجمة:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => loadSample('untranslated_xls')}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 text-right transition group cursor-pointer relative overflow-hidden"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <TableIcon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                        <span>جدول إكسل غير مترجم (Un-translated XLS)</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-mono">جديد</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        ملف إكسل كامل بأعمدة (ID, Original, Arabic, Context) مع عمود تعريب فارغ تماماً بانتظار الترجمة
                      </div>
                    </button>

                    <button
                      onClick={() => loadSample('mole_csv')}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 text-right transition group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <TableIcon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-neutral-200">جدول نصوص (CSV / Excel)</div>
                      <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        جدول أعمدة: معرف، نص إنجليزي، وسياق اللعبة مأخوذ من نظام M.O.L.E.
                      </div>
                    </button>

                    <button
                      onClick={() => loadSample('mole_json')}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 text-right transition group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-neutral-200">حوارات اللعبة (JSON)</div>
                      <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        كائنات متداخلة مع أسماء الشخصيات والأنظمة
                      </div>
                    </button>

                    <button
                      onClick={() => loadSample('quest_json')}
                      className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 text-right transition group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                        <FileTypeIcon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-neutral-200">مهام ومذكرات (Quests)</div>
                      <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">
                        مصفوفة نصوص ومهام استكشافية
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Parsed File Preview and Spreadsheet Mapping */
            <div className="space-y-4 animate-in fade-in">
              {/* Spreadsheet Column Mapping Controls (If XLS/XLSX/CSV) */}
              {spreadsheetInspection && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
                      <Settings2 className="w-4 h-4 text-amber-400" />
                      <span>إعدادات وتوزيع أعمدة الإكسل (Excel Column Mapping)</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      إجمالي الصفوف: <strong className="text-neutral-200">{spreadsheetInspection.totalRows}</strong> صفاً
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Sheet Selector */}
                    <div>
                      <label className="block text-[11px] text-neutral-400 font-semibold mb-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>ورقة العمل (Sheet):</span>
                      </label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => handleSheetChange(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {spreadsheetInspection.sheetNames.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Source Column Selector */}
                    <div>
                      <label className="block text-[11px] text-amber-300 font-semibold mb-1">
                        عمود النص الأصلي (Source):
                      </label>
                      <select
                        value={selectedSourceCol}
                        onChange={(e) =>
                          handleColumnMappingChange(
                            parseInt(e.target.value, 10),
                            selectedTargetCol,
                            selectedIdCol,
                            hasHeaderToggle
                          )
                        }
                        className="w-full bg-neutral-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {spreadsheetInspection.columns.map((col) => (
                          <option key={col.index} value={col.index}>
                            [{col.name}] ({col.nonEmptyCount} نصاً)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Column Selector */}
                    <div>
                      <label className="block text-[11px] text-emerald-300 font-semibold mb-1">
                        عمود الترجمة (Translation):
                      </label>
                      <select
                        value={selectedTargetCol}
                        onChange={(e) =>
                          handleColumnMappingChange(
                            selectedSourceCol,
                            parseInt(e.target.value, 10),
                            selectedIdCol,
                            hasHeaderToggle
                          )
                        }
                        className="w-full bg-neutral-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
                      >
                        <option value={-1}>— ملف غير مترجم بعد (عمود تعريب جديد) —</option>
                        {spreadsheetInspection.columns.map((col) => (
                          <option key={col.index} value={col.index}>
                            [{col.name}] {col.nonEmptyCount === 0 ? '(فارغ)' : `(${col.nonEmptyCount} نصاً)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ID Column Selector */}
                    <div>
                      <label className="block text-[11px] text-neutral-400 font-semibold mb-1">
                        عمود المفتاح / المعرف (ID/Key):
                      </label>
                      <select
                        value={selectedIdCol}
                        onChange={(e) =>
                          handleColumnMappingChange(
                            selectedSourceCol,
                            selectedTargetCol,
                            parseInt(e.target.value, 10),
                            hasHeaderToggle
                          )
                        }
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value={-1}>— بدون معرف (توليد معرف تلقائي) —</option>
                        {spreadsheetInspection.columns.map((col) => (
                          <option key={col.index} value={col.index}>
                            [{col.name}]
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Header Row Toggle */}
                  <div className="pt-2 flex items-center justify-between text-xs text-neutral-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasHeaderToggle}
                        onChange={(e) =>
                          handleColumnMappingChange(
                            selectedSourceCol,
                            selectedTargetCol,
                            selectedIdCol,
                            e.target.checked
                          )
                        }
                        className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500 bg-neutral-900 w-4 h-4 cursor-pointer"
                      />
                      <span>الصف الأول عبارة عن عناوين للأعمدة (Header Row) ولا يحتوي على نصوص لعب</span>
                    </label>

                    <span className="text-[11px] text-neutral-500">
                      النص الأصلي المحدد: <strong className="text-amber-400">{spreadsheetInspection.columns.find(c => c.index === selectedSourceCol)?.name || 'العمود 1'}</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div
                className={`border rounded-xl p-4 flex items-center justify-between ${
                  isUntranslated
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2
                    className={`w-6 h-6 shrink-0 ${
                      isUntranslated ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>تمت قراءة وتحليل الملف بنجاح:</span>
                      <span className="font-mono text-xs text-neutral-100">{parsedPreview.metadata.fileName}</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5">
                      نوع الملف: <strong className="uppercase">{parsedPreview.metadata.fileType}</strong> | 
                      إجمالي النصوص المقروءة: <strong>{parsedPreview.items.length}</strong> | 
                      {isUntranslated ? (
                        <span className="text-amber-300 font-semibold">
                          ملف غير مترجم جاهز للتعريب الفوري بنسبة 100%
                        </span>
                      ) : (
                        <span>
                          معرب مسبقاً أو بالقاموس: <strong className="text-emerald-300">{parsedPreview.translatedCount}</strong> نصاً
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    isUntranslated
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isUntranslated
                    ? 'ملف غير معرب (جديد)'
                    : `${Math.round((parsedPreview.translatedCount / Math.max(parsedPreview.items.length, 1)) * 100)}% معرب`}
                </span>
              </div>

              {/* Sample list */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5">
                <div className="text-[11px] text-neutral-500 pb-1.5 border-b border-neutral-800 flex justify-between">
                  <span>معاينة عينة من النصوص المستخرجة ({parsedPreview.items.length} نصاً):</span>
                  <span>العمود الأصلي: {parsedPreview.metadata.sourceColumn}</span>
                </div>
                {parsedPreview.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex gap-2 text-[11px] py-1 border-b border-neutral-900 last:border-0 items-center">
                    <span className="text-neutral-600 w-14 shrink-0">{item.key || `#${item.id}`}:</span>
                    <span className="text-neutral-300 truncate w-1/2" dir="ltr">{item.original || '<فارغ>'}</span>
                    <span className="text-neutral-600 shrink-0">➔</span>
                    <div className="w-1/2 truncate" dir="rtl">
                      {item.translated ? (
                        <span className="text-emerald-400 font-sans">{item.translated}</span>
                      ) : (
                        <span className="text-neutral-500 italic text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                          بانتظار التعريب ⏳
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setParsedPreview(null);
                    setSpreadsheetInspection(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>اختيار ملف آخر</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApply(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    <span>فتح الملف في الاستوديو</span>
                  </button>

                  <button
                    onClick={() => handleApply(true)}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>فتح وبدء الترجمة بالذكاء الاصطناعي (Gemini)</span>
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
