import translationMapData from '../data/translation_map.json';
import { TranslationItem } from '../types';

const DICT: Record<string, string> = translationMapData as Record<string, string>;

export function translateSingleLine(orig: string): string {
  if (!orig) return orig;
  const trimmed = orig.trim();

  // Direct lookup
  if (DICT[orig]) return DICT[orig];
  if (DICT[trimmed]) {
    // Preserve leading / trailing whitespace if any
    const leadingSpace = orig.match(/^\s*/)?.[0] || '';
    const trailingSpace = orig.match(/\s*$/)?.[0] || '';
    return leadingSpace + DICT[trimmed] + trailingSpace;
  }

  // <cf> tag handling
  if (orig.includes('<cf>')) {
    const parts = orig.split('<cf>');
    const translatedParts = parts.map((p) => {
      const pt = p.trim();
      if (DICT[p]) return DICT[p];
      if (DICT[pt]) return DICT[pt];
      return p;
    });

    let trans = translatedParts.join('<cf>');

    // Credit roles translation inside <cf> blocks
    trans = trans
      .replace(/- CONTRIBUTING PERSONNEL -/g, '- الموظفون المساهمون -')
      .replace(/- VOICE ACTING -/g, '- الأداء الصوتي -')
      .replace(/- Community Assistance/g, '- دعم ومساعدة المجتمع')
      .replace(/- Level Design/g, '- تصميم المراحل')
      .replace(/- Music Composing/g, '- التأليف الموسيقي')
      .replace(/- VFX Art/g, '- فن المؤثرات البصرية')
      .replace(/- UI & UX Design/g, '- تصميم واجهة وتجربة المستخدم')
      .replace(/- 2D Art and 3D Art/g, '- فن ثنائي وثلاثي الأبعاد')
      .replace(/- 2D Art and Game Design/g, '- الفنون وتصميم اللعبة')
      .replace(/- 2D Art/g, '- رسوم ثنائية الأبعاد')
      .replace(/- Head of Localization/g, '- رئيس قسم التعريب والترجمة')
      .replace(/- Project Manager/g, '- مدير المشروع')
      .replace(/- Test Coordinator/g, '- منسقة الاختبارات')
      .replace(/- Test Lead/g, '- قائد فريق الاختبار')
      .replace(/- Localization Support/g, '- دعم التعريب والترجمة')
      .replace(/- Founder & CEO/g, '- المؤسس والمدير التنفيذي')
      .replace(/- Chief Publishing Officer/g, '- رئيس قطاع النشر')
      .replace(/- Head of Communications/g, '- رئيس الاتصالات')
      .replace(/- Head of Business Development/g, '- رئيس تطوير الأعمال')
      .replace(/- Head of Scouting/g, '- رئيس الاستكشاف')
      .replace(/- Senior Producer/g, '- منتج أول')
      .replace(/- Director/g, '- مخرج العمل')
      .replace(/- Producer/g, '- منتج')
      .replace(/- Game Designer/g, '- مصمم اللعبة')
      .replace(/- Programmer/g, '- مبرمج')
      .replace(/- Main Writer/g, '- الكاتب الرئيسي')
      .replace(/- Animator/g, '- تحريك')
      .replace(/- Sound Designer/g, '- مصمم الأصوات')
      .replace(/- French Localization/g, '- التعريب للفرنسية')
      .replace(/- German Localization/g, '- التعريب للألمانية')
      .replace(/- Spanish Localization/g, '- التعريب للإسبانية')
      .replace(/- Ukrainian Localization/g, '- التعريب للأوكرانية')
      .replace(/- Russian Localization/g, '- التعريب للروسية')
      .replace(/- Japanese Localization/g, '- التعريب لليابانية')
      .replace(/- Simplified Chinese Localization/g, '- التعريب للصينية')
      .replace(/- Korean Store Page Localization/g, '- التعريب للكورية');

    return trans;
  }

  // {/n} tag handling
  if (orig.includes('{/n}')) {
    const parts = orig.split('{/n}');
    const translatedParts = parts.map((p) => {
      const pt = p.trim();
      return DICT[p] || DICT[pt] || p;
    });
    return translatedParts.join('{/n}');
  }

  return orig;
}

export function categorizeLine(orig: string): 'story' | 'gameplay' | 'ui' | 'credits' | 'system' {
  if (
    orig.includes('Maria') ||
    orig.includes('Stepan') ||
    orig.includes('Viktor') ||
    orig.includes('Petro') ||
    orig.includes('Dad') ||
    orig.includes('Letter') ||
    orig.includes('Nov') ||
    orig.includes('Nov 1982') ||
    orig.includes('Nov<cf>1982')
  ) {
    return 'story';
  }
  if (
    orig.includes('PERSONNEL') ||
    orig.includes('VOICE ACTING') ||
    orig.includes('ORO INTERACTIVE') ||
    orig.includes('CREW') ||
    orig.includes('Localization')
  ) {
    return 'credits';
  }
  if (
    orig.includes('Option') ||
    orig.includes('Back') ||
    orig.includes('Confirm') ||
    orig.includes('Left') ||
    orig.includes('Right') ||
    orig.includes('Crouch') ||
    orig.includes('Sprint') ||
    orig.includes('Interact') ||
    orig.includes('Audio') ||
    orig.includes('Graphics')
  ) {
    return 'ui';
  }
  if (
    orig.includes('RPM') ||
    orig.includes('ENGINE') ||
    orig.includes('TORPEDO') ||
    orig.includes('FUSEBOX') ||
    orig.includes('EXAM') ||
    orig.includes('COCKPIT') ||
    orig.includes('DRILL')
  ) {
    return 'gameplay';
  }
  return 'system';
}

export function translateFullText(rawContent: string): {
  items: TranslationItem[];
  translatedText: string;
  totalLines: number;
  translatedCount: number;
} {
  const lines = rawContent.split(/\r?\n/);
  const items: TranslationItem[] = [];
  const translatedLines: string[] = [];
  let translatedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const orig = lines[i];
    const trans = translateSingleLine(orig);
    const isTrans = trans !== orig && orig.trim().length > 0;

    if (isTrans) {
      translatedCount++;
    }

    items.push({
      id: i + 1,
      original: orig,
      translated: trans,
      isTranslated: isTrans,
      category: categorizeLine(orig),
    });

    translatedLines.push(trans);
  }

  return {
    items,
    translatedText: translatedLines.join('\n'),
    totalLines: lines.length,
    translatedCount,
  };
}
