import path from 'path';

interface ImageFeatures {
  dominantColors: string[];
  aspectRatio: number;
  shapeScore: number;
  textDetected: string[];
  sizeBounds: { width: number; height: number };
  visualComplexity: number;
  fileSize: number;
  format: string;
}

interface ImageClassificationResult {
  category: string;
  confidence: number;
  features: ImageFeatures;
  reasoning: string[];
  visualCues: string[];
}


export class ImageClassificationService {
  private static instance: ImageClassificationService;
  
  // Color patterns for different component types
  private readonly colorPatterns = {
    frame: {
      common: ['#1a1a1a', '#2d2d2d', '#ff0000', '#0066cc', '#ffffff'],
      materials: ['carbon_fiber', 'aluminum', 'plastic']
    },
    motor: {
      common: ['#2d2d2d', '#1a1a1a', '#666666', '#ff4444', '#0066cc'],
      indicators: ['copper_coils', 'metal_housing', 'bearing_rings']
    },
    propeller: {
      common: ['#1a1a1a', '#ffffff', '#ff0000', '#0066cc', '#ffaa00'],
      materials: ['carbon_fiber', 'plastic', 'wood']
    },
    battery: {
      common: ['#1a1a1a', '#666666', '#ff0000', '#ffff00', '#ffffff'],
      indicators: ['label_text', 'connector_colors', 'cell_markings']
    },
    camera: {
      common: ['#1a1a1a', '#2d2d2d', '#666666', '#ffffff', '#ff0000'],
      features: ['lens_glass', 'pcb_green', 'connector_gold']
    },
    stack: {
      common: ['#00aa00', '#1a1a1a', '#666666', '#ff0000', '#0066cc'],
      indicators: ['pcb_green', 'component_colors', 'connector_metals']
    }
  };

  // Shape analysis patterns
  private readonly shapePatterns = {
    frame: {
      aspectRatio: [0.8, 1.2], // Usually square-ish
      complexity: 'high',
      symmetry: 'radial'
    },
    motor: {
      aspectRatio: [0.9, 1.1], // Circular
      complexity: 'medium',
      symmetry: 'circular'
    },
    propeller: {
      aspectRatio: [0.2, 0.4], // Wide and thin
      complexity: 'low',
      symmetry: 'radial'
    },
    battery: {
      aspectRatio: [2.0, 4.0], // Rectangular
      complexity: 'low',
      symmetry: 'rectangular'
    },
    camera: {
      aspectRatio: [0.8, 1.5], // Various shapes
      complexity: 'medium',
      symmetry: 'rectangular'
    },
    stack: {
      aspectRatio: [0.8, 1.2], // Square PCB
      complexity: 'very_high',
      symmetry: 'rectangular'
    }
  };

  // Text patterns commonly found on components
  private readonly textPatterns = {
    frame: ['carbon', 'fiber', 'racing', 'fpv', 'freestyle', 'frame'],
    motor: ['motor', 'kv', 'rpm', 'brushless', 'stator', 'rotor'],
    propeller: ['prop', 'inch', 'pitch', 'carbon', 'tri', 'blade'],
    battery: ['mah', 'lipo', 'cell', 'voltage', 'discharge', 'battery'],
    camera: ['camera', 'fpv', 'lens', 'cmos', 'ccd', 'resolution'],
    stack: ['fc', 'esc', 'pdb', 'osd', 'gyro', 'mpu', 'betaflight']
  };

  private constructor() {}

  public static getInstance(): ImageClassificationService {
    if (!ImageClassificationService.instance) {
      ImageClassificationService.instance = new ImageClassificationService();
    }
    return ImageClassificationService.instance;
  }

  /**
   * Analyze product image and classify component type
   */
  public async classifyProductImage(
    imagePath: string,
    productName?: string,
    description?: string
  ): Promise<ImageClassificationResult> {
    try {
      const features = await this.extractImageFeatures(imagePath);
      const classification = await this.analyzeFeatures(features, productName, description);
      
      return {
        ...classification,
        features
      };
    } catch (error) {
      console.error('Image classification error:', error);
      return {
        category: 'unknown',
        confidence: 0,
        features: this.getEmptyFeatures(),
        reasoning: ['Error processing image'],
        visualCues: []
      };
    }
  }

  /**
   * Extract visual features from image URL or file
   */
  private async extractImageFeatures(imagePath: string): Promise<ImageFeatures> {
    // For web environment, we'll simulate image analysis based on URL patterns and metadata
    const filename = path.basename(imagePath).toLowerCase();
    const fileExtension = path.extname(imagePath).toLowerCase();
    
    // Simulate basic image properties
    const simulatedFeatures: ImageFeatures = {
      dominantColors: this.simulateColorsFromFilename(filename),
      aspectRatio: this.estimateAspectRatio(filename),
      shapeScore: this.estimateShapeComplexity(filename),
      textDetected: this.extractTextFromFilename(filename),
      sizeBounds: { width: 800, height: 600 }, // Default estimates
      visualComplexity: this.estimateComplexity(filename),
      fileSize: imagePath.length * 100, // Rough estimate
      format: fileExtension.replace('.', '')
    };
    
    return simulatedFeatures;
  }

  /**
   * Simulate color extraction from filename patterns
   */
  private simulateColorsFromFilename(filename: string): string[] {
    const colors: string[] = [];
    
    // Color keywords in filename
    const colorMap = {
      'black': '#1a1a1a',
      'white': '#ffffff',
      'red': '#ff0000',
      'blue': '#0066cc',
      'green': '#00aa00',
      'carbon': '#1a1a1a',
      'aluminum': '#999999',
      'gold': '#ffd700',
      'silver': '#c0c0c0'
    };
    
    Object.entries(colorMap).forEach(([keyword, hex]) => {
      if (filename.includes(keyword)) {
        colors.push(hex);
      }
    });
    
    // Default colors based on component type
    if (filename.includes('frame')) colors.push('#1a1a1a', '#ff0000');
    if (filename.includes('motor')) colors.push('#2d2d2d', '#666666');
    if (filename.includes('prop')) colors.push('#1a1a1a', '#ffffff');
    if (filename.includes('battery')) colors.push('#1a1a1a', '#ffff00');
    if (filename.includes('camera')) colors.push('#1a1a1a', '#666666');
    if (filename.includes('fc') || filename.includes('stack')) colors.push('#00aa00');
    
    return colors.length > 0 ? colors : ['#1a1a1a', '#666666'];
  }

  /**
   * Estimate aspect ratio from filename
   */
  private estimateAspectRatio(filename: string): number {
    if (filename.includes('prop') || filename.includes('propeller')) return 0.3;
    if (filename.includes('battery')) return 3.0;
    if (filename.includes('frame')) return 1.0;
    if (filename.includes('motor')) return 1.0;
    if (filename.includes('camera')) return 1.2;
    if (filename.includes('stack') || filename.includes('fc')) return 1.0;
    
    return 1.33; // Default 4:3 aspect ratio
  }

  /**
   * Estimate shape complexity
   */
  private estimateShapeComplexity(filename: string): number {
    if (filename.includes('frame')) return 0.8;
    if (filename.includes('stack') || filename.includes('fc')) return 0.9;
    if (filename.includes('motor')) return 0.4;
    if (filename.includes('camera')) return 0.5;
    if (filename.includes('prop')) return 0.3;
    if (filename.includes('battery')) return 0.2;
    
    return 0.5;
  }

  /**
   * Extract text patterns from filename
   */
  private extractTextFromFilename(filename: string): string[] {
    const detectedTerms: string[] = [];
    
    // Check filename for text clues
    Object.entries(this.textPatterns).forEach(([, patterns]) => {
      patterns.forEach(pattern => {
        if (filename.includes(pattern)) {
          detectedTerms.push(pattern);
        }
      });
    });
    
    return detectedTerms;
  }

  /**
   * Estimate visual complexity
   */
  private estimateComplexity(filename: string): number {
    let complexity = 0.3; // Base complexity
    
    if (filename.includes('stack') || filename.includes('fc')) complexity += 0.4;
    if (filename.includes('frame')) complexity += 0.3;
    if (filename.includes('motor')) complexity += 0.2;
    if (filename.includes('camera')) complexity += 0.2;
    if (filename.includes('prop')) complexity += 0.1;
    
    return Math.min(complexity, 1.0);
  }

  /**
   * Detect text in image (simplified based on filename patterns)
   */
  private async detectText(imagePath: string): Promise<string[]> {
    return this.extractTextFromFilename(path.basename(imagePath).toLowerCase());
  }

  /**
   * Analyze extracted features to determine component type
   */
  private async analyzeFeatures(
    features: ImageFeatures,
    productName?: string,
    description?: string
  ): Promise<Omit<ImageClassificationResult, 'features'>> {
    const scores = new Map<string, number>();
    const reasoning: string[] = [];
    const visualCues: string[] = [];
    
    // Analyze colors
    Object.entries(this.colorPatterns).forEach(([category, patterns]) => {
      let colorScore = 0;
      features.dominantColors.forEach(color => {
        if (this.isColorSimilar(color, patterns.common)) {
          colorScore += 0.2;
        }
      });
      scores.set(category, (scores.get(category) || 0) + colorScore);
      
      if (colorScore > 0.3) {
        reasoning.push(`Color analysis suggests ${category} (score: ${colorScore.toFixed(2)})`);
        visualCues.push(`Dominant colors match ${category} patterns`);
      }
    });
    
    // Analyze shape
    Object.entries(this.shapePatterns).forEach(([category, patterns]) => {
      let shapeScore = 0;
      
      // Aspect ratio analysis
      const [minRatio, maxRatio] = patterns.aspectRatio;
      if (features.aspectRatio >= minRatio && features.aspectRatio <= maxRatio) {
        shapeScore += 0.4;
        visualCues.push(`Aspect ratio (${features.aspectRatio.toFixed(2)}) matches ${category}`);
      }
      
      // Complexity analysis
      const complexityMatch = this.matchComplexity(features.visualComplexity, patterns.complexity);
      shapeScore += complexityMatch * 0.3;
      
      scores.set(category, (scores.get(category) || 0) + shapeScore);
      
      if (shapeScore > 0.4) {
        reasoning.push(`Shape analysis suggests ${category} (score: ${shapeScore.toFixed(2)})`);
      }
    });
    
    // Analyze detected text
    if (features.textDetected.length > 0) {
      Object.entries(this.textPatterns).forEach(([category, patterns]) => {
        let textScore = 0;
        features.textDetected.forEach(text => {
          if (patterns.some(pattern => text.includes(pattern))) {
            textScore += 0.3;
          }
        });
        
        scores.set(category, (scores.get(category) || 0) + textScore);
        
        if (textScore > 0.2) {
          reasoning.push(`Text analysis suggests ${category} (detected: ${features.textDetected.join(', ')})`);
          visualCues.push(`Text indicators: ${features.textDetected.join(', ')}`);
        }
      });
    }
    
    // Context analysis from product name/description
    if (productName || description) {
      const contextText = `${productName || ''} ${description || ''}`.toLowerCase();
      Object.entries(this.textPatterns).forEach(([category, patterns]) => {
        let contextScore = 0;
        patterns.forEach(pattern => {
          if (contextText.includes(pattern)) {
            contextScore += 0.2;
          }
        });
        
        scores.set(category, (scores.get(category) || 0) + contextScore);
        
        if (contextScore > 0.2) {
          reasoning.push(`Context analysis suggests ${category}`);
        }
      });
    }
    
    // Find best match
    const sortedScores = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const [bestCategory, bestScore] = sortedScores[0] || ['unknown', 0];
    const confidence = Math.min(bestScore, 1.0);
    
    return {
      category: bestCategory,
      confidence,
      reasoning,
      visualCues
    };
  }

  /**
   * Check if color is similar to pattern colors
   */
  private isColorSimilar(color: string, patternColors: string[]): boolean {
    return patternColors.some(patternColor => {
      const distance = this.colorDistance(color, patternColor);
      return distance < 50; // Threshold for similarity
    });
  }

  /**
   * Calculate color distance
   */
  private colorDistance(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 255;
    
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  /**
   * Match complexity level
   */
  private matchComplexity(actualComplexity: number, expectedLevel: string): number {
    const ranges = {
      'low': [0, 0.2],
      'medium': [0.15, 0.4],
      'high': [0.35, 0.6],
      'very_high': [0.55, 1.0]
    };
    
    const [min, max] = ranges[expectedLevel as keyof typeof ranges] || [0, 1];
    
    if (actualComplexity >= min && actualComplexity <= max) {
      return 1.0;
    } else {
      const distance = Math.min(
        Math.abs(actualComplexity - min),
        Math.abs(actualComplexity - max)
      );
      return Math.max(0, 1 - distance * 2);
    }
  }

  /**
   * Utility functions
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private getEmptyFeatures(): ImageFeatures {
    return {
      dominantColors: [],
      aspectRatio: 1.0,
      shapeScore: 0,
      textDetected: [],
      sizeBounds: { width: 0, height: 0 },
      visualComplexity: 0,
      fileSize: 0,
      format: 'unknown'
    };
  }

  /**
   * Batch process multiple images
   */
  public async batchClassifyImages(
    imagePaths: string[],
    productNames?: string[],
    descriptions?: string[]
  ): Promise<ImageClassificationResult[]> {
    const results: ImageClassificationResult[] = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const result = await this.classifyProductImage(
        imagePaths[i],
        productNames?.[i],
        descriptions?.[i]
      );
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get confidence score for existing classification using image analysis
   */
  public async validateClassification(
    imagePath: string,
    proposedCategory: string,
    productName?: string,
    description?: string
  ): Promise<{ isValid: boolean; confidence: number; suggestions: string[] }> {
    const result = await this.classifyProductImage(imagePath, productName, description);
    
    const isValid = result.category === proposedCategory;
    const suggestions: string[] = [];
    
    if (!isValid && result.confidence > 0.6) {
      suggestions.push(`Image analysis suggests ${result.category} instead of ${proposedCategory}`);
      suggestions.push(`Visual evidence: ${result.visualCues.join(', ')}`);
    }
    
    return {
      isValid,
      confidence: isValid ? result.confidence : 1 - result.confidence,
      suggestions
    };
  }
}