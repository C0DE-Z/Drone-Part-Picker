import { NextRequest, NextResponse } from 'next/server';
import { scrapeModelsFromPage } from '@/services/modelScraper';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }
    const result = await scrapeModelsFromPage(url);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Model scrape error', err);
    return NextResponse.json({ error: 'Failed to scrape models' }, { status: 500 });
  }
}
