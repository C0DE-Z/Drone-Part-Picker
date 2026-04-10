import { ScrapedProduct } from '@/types/drone';
import { ScraperPipeline, toLegacyScrapedProducts } from './scraper/pipeline';
import { ScrapeTestResult, ScraperPipelineResult } from './scraper/types';

const vendorAliasMap: Record<string, string> = {
  getfpv: 'GetFPV',
  rdq: 'RDQ',
  racedayquads: 'RDQ',
  pyrodrone: 'PyrodDrone',
  pyrodronefpv: 'PyrodDrone'
};

const categoryAliasMap: Record<string, string> = {
  motors: 'motors',
  motor: 'motors',
  frames: 'frames',
  frame: 'frames',
  stacks: 'stacks',
  stack: 'stacks',
  fc: 'stacks',
  esc: 'stacks',
  flight_controllers: 'stacks',
  'flight-controllers': 'stacks',
  cameras: 'cameras',
  camera: 'cameras',
  props: 'props',
  prop: 'props',
  propellers: 'props',
  batteries: 'batteries',
  battery: 'batteries'
};

const normalizeVendor = (vendor: string): string => {
  const alias = vendorAliasMap[vendor.toLowerCase().trim()];
  return alias || vendor;
};

const normalizeCategory = (category: string): string => {
  const alias = categoryAliasMap[category.toLowerCase().trim()];
  return alias || category;
};

export class DeploymentFriendlyScraperService {
  private pipeline: ScraperPipeline;

  constructor() {
    this.pipeline = new ScraperPipeline();
  }

  async scrapeCategory(vendor: string, category: string, maxProducts = 100): Promise<ScrapedProduct[]> {
    const normalizedVendor = normalizeVendor(vendor);
    const normalizedCategory = normalizeCategory(category);

    const result = await this.pipeline.scrapeVendorCategory(
      normalizedVendor,
      normalizedCategory,
      maxProducts
    );

    return toLegacyScrapedProducts(result.records);
  }

  async scrapeCategoryWithMetadata(
    vendor: string,
    category: string,
    maxProducts = 100
  ): Promise<ScraperPipelineResult> {
    const normalizedVendor = normalizeVendor(vendor);
    const normalizedCategory = normalizeCategory(category);

    return this.pipeline.scrapeVendorCategory(normalizedVendor, normalizedCategory, maxProducts);
  }

  async scrapeAllVendors(maxProductsPerVendor = 120): Promise<ScrapedProduct[]> {
    const result = await this.pipeline.scrapeAllVendors(maxProductsPerVendor);
    return toLegacyScrapedProducts(result.records);
  }

  async scrapeAllVendorsWithMetadata(maxProductsPerVendor = 120): Promise<ScraperPipelineResult> {
    return this.pipeline.scrapeAllVendors(maxProductsPerVendor);
  }

  getVendorConfig(vendor: string) {
    return this.pipeline.getVendorConfig(normalizeVendor(vendor));
  }

  getAvailableVendors(): string[] {
    return this.pipeline.getAvailableVendors();
  }

  async testScraping(vendor: string, category: string): Promise<ScrapeTestResult> {
    try {
      const result = await this.scrapeCategoryWithMetadata(vendor, category, 12);
      return {
        success: true,
        products: toLegacyScrapedProducts(result.records).slice(0, 12),
        meta: {
          lowConfidenceCount: result.lowConfidenceCount,
          dedupedCount: result.dedupedCount
        }
      };
    } catch (error) {
      return {
        success: false,
        products: [],
        error: error instanceof Error ? error.message : 'Unknown scraper error'
      };
    }
  }
}

export const deploymentFriendlyScraperService = new DeploymentFriendlyScraperService();
