import fs from 'node:fs';
import path from 'node:path';

export interface KnowledgeDocument {
  id: number | string;
  title: string;
  author: string;
  niche: string;
  tag?: string;
}

const STOP_WORDS = new Set([
  'the', 'and', 'what', 'is', 'relationship', 'between', 'for', 'with', 
  'in', 'of', 'to', 'a', 'an', 'explain', 'according', 'synthesize'
]);

let catalogCache: KnowledgeDocument[] | null = null;

export function loadCatalog(): KnowledgeDocument[] {
  if (catalogCache) return catalogCache;
  try {
    const catalogPath = path.resolve(process.cwd(), 'catalog_dump.json');
    if (fs.existsSync(catalogPath)) {
      catalogCache = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      return catalogCache || [];
    }
  } catch (err) {
    console.error('Failed to load catalog_dump.json:', err);
  }
  return [];
}

export function queryGnosisKnowledge(query: string, limit = 2): KnowledgeDocument[] {
  const docs = loadCatalog();
  if (!docs.length || !query) return [];

  const tokens = query.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  const scored = docs.map(doc => {
    let score = 0;
    const titleLower = (doc.title || '').toLowerCase();
    const nicheLower = (doc.niche || '').toLowerCase();
    const tagLower = (doc.tag || '').toLowerCase();
    const authorLower = (doc.author || '').toLowerCase();

    for (const token of tokens) {
      if (titleLower.includes(token)) score += 12;
      if (nicheLower.includes(token)) score += 8;
      if (authorLower.includes(token)) score += 6;
      if (tagLower.includes(token)) score += 4;
    }
    return { doc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}
