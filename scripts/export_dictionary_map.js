import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translationDictionary } from './dictionary_part1.js';
import { dictionaryPart2 } from './dictionary_part2.js';
import { dictionaryPart3 } from './dictionary_part3.js';
import { dictionaryPart4 } from './dictionary_part4.js';
import { dictionaryPart5 } from './dictionary_part5.js';
import { dictionaryPart6 } from './dictionary_part6.js';
import { dictionaryPart7 } from './dictionary_part7.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MASTER_DICT = {
  ...translationDictionary,
  ...dictionaryPart2,
  ...dictionaryPart3,
  ...dictionaryPart4,
  ...dictionaryPart5,
  ...dictionaryPart6,
  ...dictionaryPart7
};

// Also read translations.json to get any extra mapped items
const translationsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/translations.json'), 'utf8'));
translationsData.forEach(item => {
  if (item.isTranslated && item.original && item.translated) {
    if (!MASTER_DICT[item.original]) {
      MASTER_DICT[item.original] = item.translated;
    }
    const trimmed = item.original.trim();
    if (!MASTER_DICT[trimmed]) {
      MASTER_DICT[trimmed] = item.translated.trim();
    }
  }
});

const outPath = path.join(__dirname, '../src/data/translation_map.json');
fs.writeFileSync(outPath, JSON.stringify(MASTER_DICT), 'utf8');
console.log("Exported translation map with", Object.keys(MASTER_DICT).length, "keys to", outPath);
