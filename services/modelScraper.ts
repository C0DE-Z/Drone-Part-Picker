import axios from 'axios';
import * as cheerio from 'cheerio';
import { cacheService } from '@/lib/simple-cache';

export type ModelLink = {
  url: string;
  type: 'gltf' | 'glb' | 'obj' | 'stl' | 'unknown';
  size?: string;
  title?: string;
};

export type ScrapeResult = {
  source: string;
  models: ModelLink[];
  pageTitle?: string;
};

const MODEL_EXTENSIONS = ['.gltf', '.glb', '.obj', '.stl'];

function detectType(url: string): ModelLink['type'] {
  const lower = url.toLowerCase();
  if (lower.endsWith('.gltf')) return 'gltf';
  if (lower.endsWith('.glb')) return 'glb';
  if (lower.endsWith('.obj')) return 'obj';
  if (lower.endsWith('.stl')) return 'stl';
  return 'unknown';
}

async function allowedByRobotsTxt(origin: string, path: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', origin).toString();
    const cacheKey = `robots:${origin}`;
    let robots = cacheService.get<string>(cacheKey);
    if (!robots) {
      const res = await axios.get(robotsUrl, { timeout: 5000, validateStatus: () => true });
      if (res.status >= 200 && res.status < 300) {
        robots = String(res.data);
        cacheService.set(cacheKey, robots, 3600);
      } else {
        return true; // be permissive when unavailable
      }
    }
    const lines = robots.split('\n').map(l => l.trim());
    const disallows = lines
      .filter(l => l.toLowerCase().startsWith('disallow:'))
      .map(l => l.split(':')[1]?.trim() || '')
      .filter(Boolean);
    // Very naive path check
    return !disallows.some(rule => rule !== '/' && path.startsWith(rule));
  } catch {
    return true;
  }
}

export async function scrapeModelsFromPage(url: string): Promise<ScrapeResult> {
  const cacheKey = `scrape-models:${url}`;
  const cached = cacheService.get<ScrapeResult>(cacheKey);
  if (cached) return cached;

  const u = new URL(url);
  if (!(await allowedByRobotsTxt(u.origin, u.pathname))) {
    return { source: url, models: [], pageTitle: 'Blocked by robots.txt' };
  }

  const res = await axios.get(url, { timeout: 15000 });
  const html = res.data as string;
  const $ = cheerio.load(html);
  const pageTitle = $('title').first().text().trim();

  const candidates = new Set<string>();

  // <a href="...">
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const abs = new URL(href, url).toString();
      if (MODEL_EXTENSIONS.some(ext => abs.toLowerCase().includes(ext))) {
        candidates.add(abs);
      }
    } catch {}
  });

  // <source src>, <script src> sometimes host .gltf
  $('[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    try {
      const abs = new URL(src, url).toString();
      if (MODEL_EXTENSIONS.some(ext => abs.toLowerCase().includes(ext))) {
        candidates.add(abs);
      }
    } catch {}
  });

  const models: ModelLink[] = Array.from(candidates).map(link => ({
    url: link,
    type: detectType(link)
  }));

  const result: ScrapeResult = { source: url, models, pageTitle };
  cacheService.set(cacheKey, result, 600);
  return result;
}

export default { scrapeModelsFromPage };
