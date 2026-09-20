export interface TranslationItem {
  id: number;
  original: string;
  translated: string;
  isTranslated: boolean;
  category: 'story' | 'gameplay' | 'ui' | 'credits' | 'system';
  key?: string; // For JSON keys or Excel keys
  sheetName?: string; // For Excel sheet
  rowIndex?: number; // For Excel row
  context?: string; // Speaker or note
}

export type FilterCategory = 'all' | 'story' | 'gameplay' | 'ui' | 'credits' | 'system';
export type FilterStatus = 'all' | 'translated' | 'untranslated';

export type FileType = 'txt' | 'json' | 'xls' | 'xlsx' | 'csv';

export type ViewMode = 'table' | 'split' | 'raw_original' | 'raw_translated';

export interface SpreadsheetColumnInfo {
  index: number;
  name: string;
  sample: string;
  nonEmptyCount: number;
  avgLength: number;
  hasArabic: boolean;
  hasEnglish: boolean;
}

export interface SpreadsheetInspection {
  fileName: string;
  fileType: FileType;
  sheetNames: string[];
  activeSheet: string;
  columns: SpreadsheetColumnInfo[];
  recommendedSourceCol: number;
  recommendedTargetCol: number; // -1 if no translation column exists (untranslated file)
  recommendedIdCol: number;
  recommendedContextCol: number;
  hasHeader: boolean;
  totalRows: number;
  untranslatedRowCount: number;
  buffer: ArrayBuffer;
}

export interface FileMetadata {
  fileName: string;
  fileType: FileType;
  fileSize?: number;
  rawText?: string;
  jsonStructure?: any;
  sheetNames?: string[];
  activeSheet?: string;
  columns?: string[];
  sourceColumn?: string;
  targetColumn?: string;
  sourceColIdx?: number;
  targetColIdx?: number;
  idColIdx?: number;
  contextColIdx?: number;
  hasHeader?: boolean;
  originalWorkbook?: any; // For rebuilding xlsx
  isUntranslatedFile?: boolean;
}

export interface Stats {
  totalLines: number;
  translatedCount: number;
  untranslatedCount: number;
  storyCount: number;
  gameplayCount: number;
  uiCount: number;
  creditsCount: number;
}
