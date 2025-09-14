# Deployment-Friendly Web Scraper

## Overview

The Deployment-Friendly Web Scraper is a production-ready alternative to the Puppeteer-based scraper that works in serverless environments without browser dependencies.

## Why This Solution?

**Problem**: Puppeteer requires a full browser environment, which isn't available in most serverless platforms (Vercel, Netlify, AWS Lambda, etc.)

**Solution**: Use native fetch API with regex-based HTML parsing for reliable, lightweight scraping.

## Key Features

- ✅ **Serverless Compatible**: Works on Vercel, Netlify, and other serverless platforms
- ✅ **No Browser Dependencies**: Uses only Node.js built-in fetch API
- ✅ **Rate Limited**: Built-in delays (1-2 seconds) to respect vendor servers
- ✅ **Error Handling**: Automatic retries and graceful error handling
- ✅ **Multiple Vendors**: Supports GetFPV, RaceDayQuads, and easy to extend
- ✅ **Pagination Support**: Handles multi-page category listings
- ✅ **Regex-Based Parsing**: Efficient HTML parsing without DOM manipulation

## Supported Vendors

### GetFPV
- Categories: motors, props, frames, cameras, batteries, vtx, receivers
- Base URL: `https://www.getfpv.com`
- Features: Price parsing, stock detection, image extraction

### RaceDayQuads (RDQ)
- Categories: motors, props, frames
- Base URL: `https://www.racedayquads.com`
- Features: Price parsing, stock detection, category navigation

## API Endpoints

### Primary Scraper
- **Endpoint**: `POST /api/scraper`
- **Body**: `{ vendor, category, usePuppeteer: false }`
- **Response**: Background job initiation

### Test Endpoint
- **Endpoint**: `POST /api/scraper/test`
- **Body**: `{ vendor, category }`
- **Response**: Sample scraped data for validation

### Deployment-Friendly Specific
- **Endpoint**: `POST /api/scraper/deployment-friendly`
- **Body**: `{ vendor, category, maxPages }`
- **Response**: Direct scraping results

## Configuration

The scraper configuration is stored in `services/DeploymentFriendlyScraperService.ts`:

```typescript
const VENDOR_CONFIGS = {
  getfpv: {
    baseUrl: 'https://www.getfpv.com',
    categories: {
      motors: '/collections/brushless-motors',
      props: '/collections/propellers',
      // ... other categories
    }
  },
  rdq: {
    baseUrl: 'https://www.racedayquads.com',
    categories: {
      motors: '/collections/motors',
      // ... other categories
    }
  }
};
```

## Performance

- **Speed**: 1-2 seconds per page (respects rate limits)
- **Memory**: Low memory footprint (no browser overhead)
- **Reliability**: Handles network errors and timeouts gracefully
- **Scalability**: Suitable for serverless auto-scaling

## Usage in Admin Panel

1. Navigate to Admin Dashboard → Scraper Management
2. Select vendor and category
3. Check "Production Mode (no browser)"
4. Click "Start Scraping"

Or test directly:
1. Check "Production Mode"
2. Click "Test Production Scraper" to validate setup

## Limitations

- **JavaScript-Rendered Content**: Cannot scrape SPAs or heavily JS-dependent sites
- **Dynamic Content**: Limited to static HTML content
- **Complex Interactions**: No ability to click buttons, fill forms, etc.
- **Visual Validation**: Cannot screenshot or validate visual elements

## Extending Support

To add a new vendor:

1. Add vendor configuration to `VENDOR_CONFIGS`
2. Implement regex patterns for product data extraction
3. Update category mappings
4. Test with the test endpoint

## Migration from Puppeteer

The deployment-friendly scraper is designed as a drop-in replacement:

- Same API interface
- Same data structure output
- Automatic fallback in production environments
- UI toggle for easy switching

## Monitoring

Check scraper status via:
- Admin panel job logs
- Browser console for test results
- Server logs for detailed error information

## Best Practices

1. **Rate Limiting**: Always respect vendor rate limits
2. **Error Handling**: Monitor for blocked requests or structure changes
3. **Fallback**: Keep Puppeteer scraper for local development and complex cases
4. **Testing**: Use test endpoint before full scraping runs
5. **Monitoring**: Track success rates and adjust patterns as needed