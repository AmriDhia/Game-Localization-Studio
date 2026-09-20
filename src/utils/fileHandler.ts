import * as XLSX from 'xlsx';
import { TranslationItem, FileMetadata, FileType, SpreadsheetInspection, SpreadsheetColumnInfo } from '../types';
import { translateSingleLine, categorizeLine } from './translator';

/**
 * Parses a plain text file into TranslationItems
 */
export function parseTxtFile(content: string, fileName: string): { items: TranslationItem[]; metadata: FileMetadata } {
  const lines = content.split(/\r?\n/);
  const items: TranslationItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const orig = lines[i];
    const dictTrans = translateSingleLine(orig);
    const isTrans = dictTrans !== orig && orig.trim().length > 0;

    items.push({
      id: i + 1,
      original: orig,
      translated: isTrans ? dictTrans : '',
      isTranslated: isTrans,
      category: categorizeLine(orig),
      key: `line_${i + 1}`,
    });
  }

  const metadata: FileMetadata = {
    fileName,
    fileType: 'txt',
    rawText: content,
    isUntranslatedFile: items.filter((i) => i.isTranslated).length === 0,
  };

  return { items, metadata };
}

/**
 * Recursively extracts translatable strings from JSON
 */
function extractJsonStrings(
  obj: any,
  prefix: string,
  items: TranslationItem[],
  idCounter: { value: number }
) {
  if (obj === null || obj === undefined) return;

  if (typeof obj === 'string') {
    const orig = obj;
    const dictTrans = translateSingleLine(orig);
    const isTrans = dictTrans !== orig && orig.trim().length > 0;

    items.push({
      id: idCounter.value++,
      original: orig,
      translated: isTrans ? dictTrans : '',
      isTranslated: isTrans,
      category: categorizeLine(orig),
      key: prefix,
    });
  } else if (Array.isArray(obj)) {
    obj.forEach((elem, idx) => {
      if (elem && typeof elem === 'object' && !Array.isArray(elem)) {
        const textKey = Object.keys(elem).find((k) =>
          /^(text|source|english|en|original|msg|message|string|value|dialogue|subtitle|line|content)$/i.test(k)
        );
        const transKey = Object.keys(elem).find((k) =>
          /^(translation|target|arabic|ar|translated|معرب|ترجمة)$/i.test(k)
        );
        const idKey = Object.keys(elem).find((k) => /^(id|key|code|name|string_id|ref)$/i.test(k));

        if (textKey && typeof elem[textKey] === 'string') {
          const orig = elem[textKey];
          const existingTrans =
            transKey && typeof elem[transKey] === 'string' && elem[transKey].trim() ? elem[transKey].trim() : null;

          let finalTrans = '';
          let isTrans = false;

          if (existingTrans) {
            finalTrans = existingTrans;
            isTrans = true;
          } else {
            const dictTrans = translateSingleLine(orig);
            if (dictTrans !== orig && orig.trim().length > 0) {
              finalTrans = dictTrans;
              isTrans = true;
            }
          }

          items.push({
            id: idCounter.value++,
            original: orig,
            translated: finalTrans,
            isTranslated: isTrans,
            category: categorizeLine(orig),
            key: idKey ? String(elem[idKey]) : `${prefix}[${idx}].${textKey}`,
            context: elem.speaker || elem.context || elem.character || elem.notes || undefined,
          });
          return;
        }
      }

      extractJsonStrings(elem, `${prefix}[${idx}]`, items, idCounter);
    });
  } else if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const nextKey = prefix ? `${prefix}.${k}` : k;
      extractJsonStrings(obj[k], nextKey, items, idCounter);
    }
  }
}

/**
 * Parses a JSON file into TranslationItems
 */
export function parseJsonFile(content: string, fileName: string): { items: TranslationItem[]; metadata: FileMetadata } {
  const parsed = JSON.parse(content);
  const items: TranslationItem[] = [];
  const idCounter = { value: 1 };

  extractJsonStrings(parsed, '', items, idCounter);

  const metadata: FileMetadata = {
    fileName,
    fileType: 'json',
    rawText: content,
    jsonStructure: parsed,
    isUntranslatedFile: items.filter((i) => i.isTranslated).length === 0,
  };

  return { items, metadata };
}

/**
 * Inspects an Excel or CSV file to detect sheets, columns, and smart recommendations.
 */
export function inspectSpreadsheet(
  buffer: ArrayBuffer,
  fileName: string,
  preferredSheet?: string
): SpreadsheetInspection {
  const fileExt: FileType = fileName.toLowerCase().endsWith('.csv')
    ? 'csv'
    : fileName.toLowerCase().endsWith('.xls')
    ? 'xls'
    : 'xlsx';

  // Read buffer using Uint8Array for maximum compatibility with .xls (BIFF8) and .xlsx
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('الملف لا يحتوي على أي ورقة عمل صالحة.');
  }

  // Find the best sheet: the one with the most populated rows
  let activeSheet = preferredSheet && sheetNames.includes(preferredSheet) ? preferredSheet : sheetNames[0];
  let maxRows = 0;

  if (!preferredSheet) {
    for (const name of sheetNames) {
      const ws = workbook.Sheets[name];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows && rows.length > maxRows) {
        maxRows = rows.length;
        activeSheet = name;
      }
    }
  }

  const worksheet = workbook.Sheets[activeSheet];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`ورقة العمل "${activeSheet}" فارغة ولا تحتوي على بيانات.`);
  }

  // Find max columns across first 30 rows
  let maxCols = 0;
  const sampleRowCount = Math.min(rawRows.length, 35);
  for (let r = 0; r < sampleRowCount; r++) {
    if (rawRows[r] && rawRows[r].length > maxCols) {
      maxCols = rawRows[r].length;
    }
  }

  // Detect header row: Check row 0
  const row0 = (rawRows[0] || []).map((c) => String(c || '').trim());
  const sourcePattern =
    /(source|orig|english|en|dialogue|dialog|text|msg|message|subtitle|line|string|content|sentence|caption|desc|description|quote|phrase|نص|الأصل|انجليزي|انكليزي|كلام|حوار)/i;
  const targetPattern =
    /(target|trans|arabic|ar|ar_sa|arab|trad|ترجم|معرب|مترجم|الترجمة|العربية)/i;
  const idPattern =
    /(id|key|code|tag|ref|name|label|idx|index|string_id|معرف|مفتاح|رمز|كود|رقم)/i;
  const contextPattern =
    /(context|speaker|char|character|actor|note|comment|سياق|متحدث|شخصية|ملاحظ|المتكلم)/i;

  let hasHeaderKeyword = false;
  row0.forEach((val) => {
    if (sourcePattern.test(val) || targetPattern.test(val) || idPattern.test(val) || contextPattern.test(val)) {
      hasHeaderKeyword = true;
    }
  });

  const hasHeader = hasHeaderKeyword || (rawRows.length > 1 && row0.some((v) => v.length > 0));

  // Build Column Information
  const columns: SpreadsheetColumnInfo[] = [];
  const startRow = hasHeader ? 1 : 0;

  for (let c = 0; c < maxCols; c++) {
    const headerName = hasHeader && row0[c] ? row0[c] : `العمود ${c + 1}`;
    let nonEmptyCount = 0;
    let totalLength = 0;
    let hasArabic = false;
    let hasEnglish = false;
    let sample = '';

    for (let r = startRow; r < Math.min(rawRows.length, 60); r++) {
      const cell = rawRows[r] ? rawRows[r][c] : undefined;
      if (cell !== undefined && cell !== null && String(cell).trim().length > 0) {
        nonEmptyCount++;
        const str = String(cell).trim();
        totalLength += str.length;
        if (!sample) sample = str;
        if (/[\u0600-\u06FF]/.test(str)) hasArabic = true;
        if (/[a-zA-Z]/.test(str)) hasEnglish = true;
      }
    }

    const avgLength = nonEmptyCount > 0 ? Math.round(totalLength / nonEmptyCount) : 0;

    columns.push({
      index: c,
      name: headerName,
      sample: sample.length > 40 ? sample.slice(0, 38) + '...' : sample,
      nonEmptyCount,
      avgLength,
      hasArabic,
      hasEnglish,
    });
  }

  // Determine Recommended Columns
  let recommendedSourceCol = -1;
  let recommendedTargetCol = -1;
  let recommendedIdCol = -1;
  let recommendedContextCol = -1;

  // 1. Check header keywords first
  if (hasHeader) {
    row0.forEach((colName, idx) => {
      if (recommendedTargetCol === -1 && targetPattern.test(colName)) {
        recommendedTargetCol = idx;
      }
      if (recommendedSourceCol === -1 && sourcePattern.test(colName)) {
        recommendedSourceCol = idx;
      }
      if (recommendedIdCol === -1 && idPattern.test(colName)) {
        recommendedIdCol = idx;
      }
      if (recommendedContextCol === -1 && contextPattern.test(colName)) {
        recommendedContextCol = idx;
      }
    });
  }

  // 2. Identify Source Column if not found from header
  // Crucial: NEVER pick an empty column as source! Score based on avg length and non-empty count
  if (recommendedSourceCol === -1) {
    let bestScore = -1;
    columns.forEach((col) => {
      if (col.index === recommendedTargetCol || col.index === recommendedIdCol) return;
      if (col.nonEmptyCount === 0) return; // ignore completely empty columns!

      const score = col.avgLength * Math.min(col.nonEmptyCount, 15);
      if (score > bestScore) {
        bestScore = score;
        recommendedSourceCol = col.index;
      }
    });
  }

  // Fallback if still -1: first non-empty column
  if (recommendedSourceCol === -1) {
    const firstNonEmpty = columns.find((c) => c.nonEmptyCount > 0);
    recommendedSourceCol = firstNonEmpty ? firstNonEmpty.index : 0;
  }

  // 3. Identify Target Column
  // If target column was found by header name (e.g. "Arabic", "Translation")
  // Even if its cells are currently empty (untranslated file!), keep it as recommendedTargetCol!
  if (recommendedTargetCol === -1) {
    // Check if another column contains Arabic text
    const arabicCol = columns.find(
      (c) => c.index !== recommendedSourceCol && c.index !== recommendedIdCol && c.hasArabic
    );
    if (arabicCol) {
      recommendedTargetCol = arabicCol.index;
    }
  }

  // 4. Identify ID Column
  if (recommendedIdCol === -1) {
    const idCol = columns.find(
      (c) =>
        c.index !== recommendedSourceCol &&
        c.index !== recommendedTargetCol &&
        c.nonEmptyCount > 0 &&
        c.avgLength > 0 &&
        c.avgLength <= 15
    );
    if (idCol) {
      recommendedIdCol = idCol.index;
    }
  }

  // Calculate untranslated row count
  let untranslatedRowCount = 0;
  const targetColInfo = columns.find((c) => c.index === recommendedTargetCol);
  if (!targetColInfo || targetColInfo.nonEmptyCount === 0) {
    // Completely untranslated file!
    untranslatedRowCount = Math.max(0, rawRows.length - (hasHeader ? 1 : 0));
  } else {
    // Some or all rows are translated
    untranslatedRowCount = Math.max(0, rawRows.length - (hasHeader ? 1 : 0) - targetColInfo.nonEmptyCount);
  }

  return {
    fileName,
    fileType: fileExt,
    sheetNames,
    activeSheet,
    columns,
    recommendedSourceCol,
    recommendedTargetCol,
    recommendedIdCol,
    recommendedContextCol,
    hasHeader,
    totalRows: Math.max(0, rawRows.length - (hasHeader ? 1 : 0)),
    untranslatedRowCount,
    buffer,
  };
}

export interface ParseSpreadsheetOptions {
  sheetName?: string;
  sourceCol?: number;
  targetCol?: number;
  idCol?: number;
  contextCol?: number;
  hasHeader?: boolean;
}

/**
 * Parses an Excel / CSV spreadsheet into TranslationItems with full support for untranslated files.
 */
export function parseSpreadsheet(
  buffer: ArrayBuffer,
  fileName: string,
  options?: ParseSpreadsheetOptions
): { items: TranslationItem[]; metadata: FileMetadata } {
  const inspection = inspectSpreadsheet(buffer, fileName, options?.sheetName);

  const activeSheet = options?.sheetName || inspection.activeSheet;
  const sourceColIdx = options?.sourceCol !== undefined ? options.sourceCol : inspection.recommendedSourceCol;
  const targetColIdx = options?.targetCol !== undefined ? options.targetCol : inspection.recommendedTargetCol;
  const idColIdx = options?.idCol !== undefined ? options.idCol : inspection.recommendedIdCol;
  const contextColIdx = options?.contextCol !== undefined ? options.contextCol : inspection.recommendedContextCol;
  const hasHeader = options?.hasHeader !== undefined ? options.hasHeader : inspection.hasHeader;

  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const worksheet = workbook.Sheets[activeSheet];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('الملف فارغ أو لا يحتوي على بيانات مقروءة.');
  }

  const startRow = hasHeader ? 1 : 0;
  const items: TranslationItem[] = [];
  let currentId = 1;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Source cell (English / Game string)
    const origCell =
      sourceColIdx !== -1 && row[sourceColIdx] !== undefined && row[sourceColIdx] !== null
        ? String(row[sourceColIdx]).trim()
        : '';

    // If source cell is empty, check if row has anything
    if (!origCell) {
      const hasAnyData = row.some((c) => c !== undefined && c !== null && String(c).trim().length > 0);
      if (!hasAnyData) continue; // skip pure blank rows
    }

    // Existing translation (if target column was mapped and cell has content)
    const existingTransCell =
      targetColIdx !== -1 && row[targetColIdx] !== undefined && row[targetColIdx] !== null
        ? String(row[targetColIdx]).trim()
        : '';

    // ID / Key cell
    const keyCell =
      idColIdx !== -1 && row[idColIdx] !== undefined && row[idColIdx] !== null
        ? String(row[idColIdx]).trim()
        : `row_${r + 1}`;

    // Context / Speaker cell
    const contextCell =
      contextColIdx !== -1 && row[contextColIdx] !== undefined && row[contextColIdx] !== null
        ? String(row[contextColIdx]).trim()
        : undefined;

    let finalTrans = '';
    let isTrans = false;

    // Check if cell already contains a real translation
    if (existingTransCell && existingTransCell.length > 0) {
      finalTrans = existingTransCell;
      isTrans = true;
    } else if (origCell) {
      // Check local M.O.L.E. dictionary
      const dictTrans = translateSingleLine(origCell);
      if (dictTrans !== origCell && origCell.trim().length > 0) {
        finalTrans = dictTrans;
        isTrans = true;
      } else {
        // UNTRANSLATED!
        finalTrans = '';
        isTrans = false;
      }
    }

    items.push({
      id: currentId++,
      original: origCell,
      translated: finalTrans,
      isTranslated: isTrans,
      category: categorizeLine(origCell),
      key: keyCell,
      rowIndex: r,
      sheetName: activeSheet,
      context: contextCell,
    });
  }

  const headerRow = (rawRows[0] || []).map((c) => String(c || '').trim());
  const translatedCount = items.filter((i) => i.isTranslated).length;
  const isUntranslated = translatedCount === 0 || translatedCount < items.length * 0.1;

  const metadata: FileMetadata = {
    fileName,
    fileType: inspection.fileType,
    sheetNames: inspection.sheetNames,
    activeSheet,
    columns: headerRow.length > 0 ? headerRow : inspection.columns.map((c) => c.name),
    sourceColumn: sourceColIdx !== -1 ? headerRow[sourceColIdx] || `العمود ${sourceColIdx + 1}` : 'العمود 1',
    targetColumn:
      targetColIdx !== -1
        ? headerRow[targetColIdx] || `العمود ${targetColIdx + 1}`
        : 'عمود تعريب جديد (Arabic_Translation)',
    sourceColIdx,
    targetColIdx,
    idColIdx,
    contextColIdx,
    hasHeader,
    originalWorkbook: workbook,
    isUntranslatedFile: isUntranslated,
  };

  return { items, metadata };
}

/**
 * Reconstructs JSON with translated strings
 */
function applyTranslationsToJson(obj: any, translationMap: Map<string, string>, prefix: string): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return translationMap.get(prefix) ?? obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((elem, idx) => {
      if (elem && typeof elem === 'object' && !Array.isArray(elem)) {
        const textKey = Object.keys(elem).find((k) =>
          /^(text|source|english|en|original|msg|message|string|value|dialogue|subtitle|line|content)$/i.test(k)
        );
        const transKey = Object.keys(elem).find((k) =>
          /^(translation|target|arabic|ar|translated|معرب|ترجمة)$/i.test(k)
        );
        const idKey = Object.keys(elem).find((k) => /^(id|key|code|name|string_id|ref)$/i.test(k));

        const key = idKey && elem[idKey] ? String(elem[idKey]) : `${prefix}[${idx}].${textKey}`;
        const translatedValue = translationMap.get(key);

        if (translatedValue) {
          if (transKey) {
            return { ...elem, [transKey]: translatedValue };
          } else if (textKey) {
            return { ...elem, [textKey]: translatedValue, arabic: translatedValue };
          }
        }
      }
      return applyTranslationsToJson(elem, translationMap, `${prefix}[${idx}]`);
    });
  }

  if (typeof obj === 'object') {
    const res: any = {};
    for (const k of Object.keys(obj)) {
      const nextKey = prefix ? `${prefix}.${k}` : k;
      const trans = translationMap.get(nextKey);
      if (typeof obj[k] === 'string' && trans !== undefined) {
        res[k] = trans;
      } else {
        res[k] = applyTranslationsToJson(obj[k], translationMap, nextKey);
      }
    }
    return res;
  }

  return obj;
}

/**
 * Reconstructs original TXT lines with translations
 */
export function exportToTxt(items: TranslationItem[]): string {
  return items.map((i) => i.translated || i.original).join('\n');
}

/**
 * Export items to JSON
 */
export function exportToJson(items: TranslationItem[], metadata?: FileMetadata): string {
  if (metadata?.jsonStructure) {
    const map = new Map<string, string>();
    items.forEach((item) => {
      if (item.key) {
        map.set(item.key, item.translated || item.original);
      }
    });
    const updated = applyTranslationsToJson(metadata.jsonStructure, map, '');
    return JSON.stringify(updated, null, 2);
  }

  const hasKeys = items.some((i) => i.key && !i.key.startsWith('line_'));
  if (hasKeys) {
    const dict: Record<string, string> = {};
    items.forEach((i) => {
      dict[i.key || `id_${i.id}`] = i.translated || i.original;
    });
    return JSON.stringify(dict, null, 2);
  }

  const output = items.map((i) => ({
    id: i.id,
    original: i.original,
    translated: i.translated,
    isTranslated: i.isTranslated,
    category: i.category,
    ...(i.context ? { context: i.context } : {}),
  }));
  return JSON.stringify(output, null, 2);
}

/**
 * Export items to Excel workbook (.xlsx / .xls)
 */
export function exportToWorkbook(items: TranslationItem[], metadata?: FileMetadata): Uint8Array {
  // If we have an existing workbook and activeSheet, update that sheet preserving original columns
  if (metadata?.originalWorkbook && metadata?.activeSheet) {
    const wb = XLSX.utils.book_new();
    const sheetName = metadata.activeSheet;
    const origSheet = metadata.originalWorkbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(origSheet, { header: 1 });

    const hasHeader = metadata.hasHeader !== false;
    const header = rows[0] ? [...rows[0]] : [];

    let targetIdx = metadata.targetColIdx !== undefined && metadata.targetColIdx >= 0 ? metadata.targetColIdx : -1;

    if (targetIdx === -1) {
      // Find if an Arabic column exists in header
      targetIdx = header.findIndex((h: any) =>
        /^(target|arabic|ar|translation|translated|الترجمة|المعرب|العربية)$/i.test(String(h || '').trim().toLowerCase())
      );
    }

    if (targetIdx === -1) {
      // Append a brand new Arabic translation column
      targetIdx = header.length;
      if (hasHeader) {
        header.push('Arabic_Translation (الترجمة العربية)');
        rows[0] = header;
      }
    }

    // Map item by rowIndex
    const itemMap = new Map<number, TranslationItem>();
    items.forEach((i) => {
      if (i.rowIndex !== undefined) {
        itemMap.set(i.rowIndex, i);
      }
    });

    const startRow = hasHeader ? 1 : 0;
    for (let r = startRow; r < rows.length; r++) {
      const item = itemMap.get(r);
      if (item) {
        if (!rows[r]) rows[r] = [];
        // Put the translation, or keep existing if empty
        if (item.translated) {
          rows[r][targetIdx] = item.translated;
        }
      }
    }

    const newWs = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, newWs, sheetName);

    // Copy other sheets if workbook had multiple sheets
    if (metadata.sheetNames && metadata.sheetNames.length > 1) {
      for (const otherSheet of metadata.sheetNames) {
        if (otherSheet !== sheetName && metadata.originalWorkbook.Sheets[otherSheet]) {
          XLSX.utils.book_append_sheet(wb, metadata.originalWorkbook.Sheets[otherSheet], otherSheet);
        }
      }
    }

    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(wbOut);
  }

  // Build clean bilingual Excel table
  const tableData = [
    ['ID', 'Key / Reference', 'Original Text (English)', 'Arabic Translation (الترجمة العربية)', 'Status', 'Category', 'Context'],
    ...items.map((i) => [
      i.id,
      i.key || '',
      i.original,
      i.translated || '',
      i.isTranslated ? 'مترجم' : 'غير مترجم',
      i.category,
      i.context || '',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(tableData);
  ws['!cols'] = [{ wch: 8 }, { wch: 18 }, { wch: 45 }, { wch: 45 }, { wch: 12 }, { wch: 12 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Game_Localization');
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbOut);
}

/**
 * Export items to CSV
 */
export function exportToCsv(items: TranslationItem[]): string {
  const tableData = [
    ['ID', 'Key', 'Original', 'Arabic_Translation', 'Status', 'Category'],
    ...items.map((i) => [
      i.id,
      i.key || '',
      i.original,
      i.translated || '',
      i.isTranslated ? 'مترجم' : 'غير مترجم',
      i.category,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(tableData);
  return XLSX.utils.sheet_to_csv(ws);
}
