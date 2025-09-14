export interface VariantPattern {
  category: string;
  pattern: RegExp;
  separator: RegExp;
  unit: string;
  description: string;
}

export interface DetectedVariant {
  original: string;
  variants: string[];
  baseName: string;
  variantType: string;
  unit: string;
}

export interface SplitProduct {
  name: string;
  description?: string;
  category: string;
  brand?: string;
  sku?: string;
  imageUrl?: string;
  specifications?: Record<string, unknown>;
  variant: string;
  variantType: string;
}

export class ProductVariantService {
  private variantPatterns: VariantPattern[] = [
    {
      category: 'motor',
      pattern: /(\d+(?:\.\d+)?kv)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?kv))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'KV',
      description: 'Motor KV ratings'
    },
    {
      category: 'battery',
      pattern: /(\d+(?:\.\d+)?mah)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?mah))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'mAh',
      description: 'Battery capacities'
    },
    {
      category: 'stack',
      pattern: /(\d+(?:\.\d+)?a)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?a))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'A',
      description: 'ESC amp ratings'
    },
    {
      category: 'prop',
      pattern: /(\d+(?:\.\d+)?x\d+(?:\.\d+)?x\d+(?:\.\d+)?)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?x\d+(?:\.\d+)?x\d+(?:\.\d+)?))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'inches',
      description: 'Propeller sizes'
    },
    {
      category: 'generic',
      pattern: /(\d+(?:\.\d+)?)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?))+(?=\s|$)/gi,
      separator: /\s*[\/|,]\s*/,
      unit: '',
      description: 'Generic numeric variants'
    },
    {
      category: 'battery',
      pattern: /(\d+(?:\.\d+)?v)(?:\s*[\/|,]\s*(\d+(?:\.\d+)?v))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'V',
      description: 'Voltage variants'
    },
    {
      category: 'battery',
      pattern: /(\d+s)(?:\s*[\/|,]\s*(\d+s))+/gi,
      separator: /\s*[\/|,]\s*/,
      unit: 'S',
      description: 'Cell count variants'
    }
  ];

  public detectVariants(productName: string, category?: string): DetectedVariant | null {
    const lowercaseName = productName.toLowerCase();
    
    // Filter patterns by category if provided
    const patterns = category 
      ? this.variantPatterns.filter(p => p.category === category || p.category === 'generic')
      : this.variantPatterns;

    for (const variantPattern of patterns) {
      const matches = Array.from(lowercaseName.matchAll(variantPattern.pattern));
      
      if (matches.length > 0) {
        const fullMatch = matches[0][0];
        const variants = fullMatch.split(variantPattern.separator)
          .map(v => v.trim())
          .filter(v => v.length > 0);

        if (variants.length > 1) {
          const baseName = productName.replace(new RegExp(fullMatch, 'gi'), '').trim();
          
          return {
            original: productName,
            variants,
            baseName: this.cleanBaseName(baseName),
            variantType: variantPattern.description,
            unit: variantPattern.unit
          };
        }
      }
    }

    return null;
  }

  public splitProductVariants(
    product: {
      name: string;
      description?: string;
      category: string;
      brand?: string;
      sku?: string;
      imageUrl?: string;
      specifications?: Record<string, unknown>;
    }
  ): SplitProduct[] {
    const detected = this.detectVariants(product.name, product.category);
    
    if (!detected) {
      return [{
        ...product,
        variant: 'single',
        variantType: 'none'
      }];
    }

    return detected.variants.map((variant) => {
      const variantName = this.createVariantName(detected.baseName, variant);
      
      return {
        ...product,
        name: variantName,
        description: this.updateDescriptionWithVariant(product.description, variant, detected.unit),
        variant,
        variantType: detected.variantType,
        specifications: {
          ...product.specifications,
          variant: variant,
          variantType: detected.variantType,
          originalName: detected.original
        }
      };
    });
  }

  private cleanBaseName(baseName: string): string {
    return baseName
      .replace(/\s*[-–—]\s*$/, '')
      .replace(/\s*[-–—]\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private createVariantName(baseName: string, variant: string): string {
    if (baseName.match(/[-–—\s]$/)) {
      return `${baseName}${variant.toUpperCase()}`;
    }
    return `${baseName} - ${variant.toUpperCase()}`;
  }

  private updateDescriptionWithVariant(
    description: string | undefined, 
    variant: string, 
    unit: string
  ): string {
    const baseDesc = description || '';
    const variantInfo = unit ? `${variant.toUpperCase()} ${unit}` : variant.toUpperCase();
    
    if (baseDesc && !baseDesc.toLowerCase().includes(variant.toLowerCase())) {
      return `${baseDesc} (${variantInfo} variant)`;
    }
    
    return baseDesc;
  }

  public hasLikelyVariants(productName: string): boolean {
    const indicators = [
      /\d+(?:\.\d+)?kv\s*[\/|,]\s*\d+/i,
      /\d+(?:\.\d+)?mah\s*[\/|,]\s*\d+/i,
      /\d+(?:\.\d+)?a\s*[\/|,]\s*\d+/i,
      /\d+x\d+x\d+\s*[\/|,]\s*\d+x\d+x\d+/i,
      /\d+s\s*[\/|,]\s*\d+s/i,
      /\d+(?:\.\d+)?v\s*[\/|,]\s*\d+/i,
      /\d+\s*[\/|,]\s*\d+\s*[\/|,]\s*\d+/i
    ];

    return indicators.some(pattern => pattern.test(productName));
  }

  public getVariantStats(productNames: string[]): {
    totalProducts: number;
    productsWithVariants: number;
    detectedVariants: Array<{
      name: string;
      variantCount: number;
      variantType: string;
    }>;
  } {
    const detectedVariants: Array<{
      name: string;
      variantCount: number;
      variantType: string;
    }> = [];

    let productsWithVariants = 0;

    for (const name of productNames) {
      const detected = this.detectVariants(name);
      if (detected) {
        productsWithVariants++;
        detectedVariants.push({
          name: detected.original,
          variantCount: detected.variants.length,
          variantType: detected.variantType
        });
      }
    }

    return {
      totalProducts: productNames.length,
      productsWithVariants,
      detectedVariants
    };
  }
}