import { VendorListingDefinition } from './types';

const COMMON_PRODUCT_SELECTORS = {
  cardSelectors: [
    '.product-item',
    '.product-grid-item',
    '.grid-product',
    '.card-product',
    '[data-product-id]',
    '.product'
  ],
  nameSelectors: [
    '.product-name a',
    '.product-item-title a',
    '.product-item__title a',
    '.product-title a',
    '.title a',
    'a[title]'
  ],
  priceSelectors: [
    '.price-box .price',
    '.price-item--sale',
    '.price-item--regular',
    '.price',
    '.money',
    '[data-price]'
  ],
  linkSelectors: [
    '.product-name a',
    '.product-item-title a',
    '.product-item__title a',
    '.product-title a',
    'a[href*="/products/"]'
  ],
  stockSelectors: [
    '.availability',
    '.stock-status',
    '.product-form__inventory',
    '[data-stock]'
  ],
  imageSelectors: [
    '.product-image img',
    '.product-item-photo img',
    '.product-item__primary-image img',
    'img'
  ],
  brandSelectors: [
    '.brand',
    '.product-vendor',
    '.vendor',
    '[data-brand]'
  ],
  descriptionSelectors: [
    '.product-description',
    '.description',
    '.product-content',
    '[data-product-description]'
  ]
};

export const vendorListingConfigs: VendorListingDefinition[] = [
  {
    vendor: 'GetFPV',
    baseUrl: 'https://www.getfpv.com',
    rateLimitMs: 1200,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    categories: {
      motors: {
        path: '/products/motors?limit=48',
        maxPages: 10,
        ...COMMON_PRODUCT_SELECTORS
      },
      frames: {
        path: '/products/frames?limit=48',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      stacks: {
        path: '/products/flight-controllers-and-escs?limit=48',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      cameras: {
        path: '/products/fpv/video-transmitters-and-cameras?limit=48',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      props: {
        path: '/products/propellers?limit=48',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      batteries: {
        path: '/products/batteries?limit=48',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      }
    }
  },
  {
    vendor: 'RDQ',
    baseUrl: 'https://www.racedayquads.com',
    rateLimitMs: 900,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    categories: {
      motors: {
        path: '/collections/motors?sort_by=best-selling',
        maxPages: 10,
        ...COMMON_PRODUCT_SELECTORS
      },
      frames: {
        path: '/collections/frames?sort_by=best-selling',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      stacks: {
        path: '/collections/stacks-aios-fc-esc?sort_by=best-selling',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      cameras: {
        path: '/collections/fpv-cameras?sort_by=best-selling',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      props: {
        path: '/collections/propellers?sort_by=best-selling',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      batteries: {
        path: '/collections/batteries?sort_by=best-selling',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      }
    }
  },
  {
    vendor: 'PyrodDrone',
    baseUrl: 'https://pyrodrone.com',
    rateLimitMs: 1000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    categories: {
      motors: {
        path: '/collections/motors',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      frames: {
        path: '/collections/frames',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      stacks: {
        path: '/collections/flight-controllers',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      cameras: {
        path: '/collections/cameras',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      props: {
        path: '/collections/propellers',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      },
      batteries: {
        path: '/collections/batteries',
        maxPages: 8,
        ...COMMON_PRODUCT_SELECTORS
      }
    }
  }
];

export const getVendorConfig = (vendor: string): VendorListingDefinition | undefined =>
  vendorListingConfigs.find((config) => config.vendor.toLowerCase() === vendor.toLowerCase());
