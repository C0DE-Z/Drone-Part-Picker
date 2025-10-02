import axios, { type AxiosResponse } from 'axios';
import { scrapeModelsFromPage } from '@/services/modelScraper';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('modelScraper.scrapeModelsFromPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts direct model links from anchors and src attributes when allowed by robots.txt', async () => {
    // Use origin A for allow case
    const pageUrl = 'https://allow.example.com/product';
    const robotsUrl = 'https://allow.example.com/robots.txt';
    // robots.txt allow
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url === robotsUrl) {
        return { status: 200, data: 'User-agent: *\nDisallow: /private\n' } as unknown as AxiosResponse<string>;
      }
      if (url === pageUrl) {
        const html = `
          <html>
            <head><title>Test Product</title></head>
            <body>
              <a href="/files/model.glb">GLB</a>
              <a href="https://cdn.example.com/asset.stl?dl=1">STL</a>
              <img src="/images/preview.gltf" />
              <script src="/static/foo.js"></script>
            </body>
          </html>
        `;
        return { status: 200, data: html } as unknown as AxiosResponse<string>;
      }
      // Fallback for unexpected URLs
      return { status: 404, data: '' } as unknown as AxiosResponse<string>;
    });

    const result = await scrapeModelsFromPage(pageUrl);
    const urls = result.models.map(m => m.url).sort();
    expect(result.pageTitle).toBe('Test Product');
    expect(urls).toEqual([
      'https://allow.example.com/files/model.glb',
      'https://allow.example.com/images/preview.gltf',
      'https://cdn.example.com/asset.stl?dl=1',
    ].sort());
  });

  it('returns empty results when blocked by robots.txt rules', async () => {
    // Use origin B for blocked case
    const pageUrl = 'https://blocked.example.com/product';
    const robotsUrl = 'https://blocked.example.com/robots.txt';
    mockedAxios.get.mockImplementation(async (url: string) => {
      if (url === robotsUrl) {
        return { status: 200, data: 'User-agent: *\nDisallow: /product\n' } as unknown as AxiosResponse<string>;
      }
      if (url === pageUrl) {
        return { status: 200, data: '<html><title>Blocked</title></html>' } as unknown as AxiosResponse<string>;
      }
      return { status: 404, data: '' } as unknown as AxiosResponse<string>;
    });

    const result = await scrapeModelsFromPage(pageUrl);
    expect(result.models).toHaveLength(0);
    expect(result.pageTitle).toBe('Blocked by robots.txt');
  });
});
