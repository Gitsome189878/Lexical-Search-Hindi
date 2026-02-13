
// Pure deterministic filter functions

export function hindiAlphabeticalSort(words: string[]): string[] {
  return [...words].sort((a, b) => a.localeCompare(b, 'hi-IN'));
}

export function hindiVowelOrderSort(words: string[]): string[] {
  const vowels = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'];
  
  return [...words].sort((a, b) => {
    const aFirst = a.charAt(0);
    const bFirst = b.charAt(0);
    const aIndex = vowels.indexOf(aFirst);
    const bIndex = vowels.indexOf(bFirst);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1; // Vowels first
    if (bIndex !== -1) return 1;

    return a.localeCompare(b, 'hi-IN');
  });
}

export function filterByLengthBucket(words: string[], bucket: 'all'|'2-3'|'4'|'5+'): string[] {
  return words.filter(word => {
    // Count distinct unicode characters (graphemes mostly align with chars in JS for simple logic)
    // For more precision we might split by grapheme, but length is acceptable proxy for MVP
    const len = [...word].length; 
    if (bucket === '2-3') return len >= 2 && len <= 3;
    if (bucket === '4') return len === 4;
    if (bucket === '5+') return len >= 5;
    return true;
  });
}

export function filterMultiWordHyphen(words: string[], enabled: boolean): string[] {
  if (!enabled) return words;
  return words.filter(word => word.includes(' ') || word.includes('-'));
}

export function filterStartsWith(words: string[], prefix: string): string[] {
  if (!prefix) return words;
  return words.filter(w => w.startsWith(prefix));
}

export function filterEndsWith(words: string[], suffix: string): string[] {
  if (!suffix) return words;
  return words.filter(w => w.endsWith(suffix));
}

export function filterContains(words: string[], needle: string): string[] {
  if (!needle) return words;
  return words.filter(w => w.includes(needle));
}

export function patternToRegex(pattern: string): RegExp {
  // Escape regex chars except underscore
  const escaped = pattern.split('').map(c => {
    if (c === '_') return '.';
    return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return new RegExp(`^${escaped}$`);
}

export function filterByPattern(words: string[], pattern: string): string[] {
  if (!pattern) return words;
  const regex = patternToRegex(pattern);
  return words.filter(w => regex.test(w));
}

export type FilterOpts = {
  sortMode: 'alpha-hi' | 'vowel';
  lengthBucket: 'all' | '2-3' | '4' | '5+';
  multiWordOnly: boolean;
  startsWith: string;
  endsWith: string;
  contains: string;
  pattern: string;
};

export function applyAllWordFilters(words: string[], opts: FilterOpts): string[] {
  let result = filterByLengthBucket(words, opts.lengthBucket);
  result = filterMultiWordHyphen(result, opts.multiWordOnly);
  result = filterStartsWith(result, opts.startsWith);
  result = filterEndsWith(result, opts.endsWith);
  result = filterContains(result, opts.contains);
  result = filterByPattern(result, opts.pattern);

  if (opts.sortMode === 'vowel') {
    result = hindiVowelOrderSort(result);
  } else {
    result = hindiAlphabeticalSort(result);
  }

  return result;
}
