import fs from 'node:fs';
import path from 'node:path';

export interface KnowledgeDocument {
  id: number | string;
  title: string;
  author: string;
  niche: string;
  excerpt?: string;
  tag?: string;
}

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

/**
 * Perform fast keyword & semantic matching across the 11 cognitive knowledge lobes
 */
export function queryGnosisKnowledge(query: string, limit = 3): KnowledgeDocument[] {
  const docs = loadCatalog();
  if (!docs.length || !query) return [];

  const lowerQuery = query.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter(t => t.length > 3);

  const scored = docs.map(doc => {
    let score = 0;
    const titleLower = doc.title.toLowerCase();
    const nicheLower = (doc.niche || '').toLowerCase();
    const tagLower = (doc.tag || '').toLowerCase();

    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 5;
      if (nicheLower.includes(token)) score += 3;
      if (tagLower.includes(token)) score += 2;
    }

    return { doc, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.doc);
}
