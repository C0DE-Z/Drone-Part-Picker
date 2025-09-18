interface MarketDataPoint {
  timestamp: Date;
  category: string;
  brand?: string;
  model?: string;
  price: number;
  volume: number;
  demand: number;
  supply: number;
  marketCap: number;
}

interface TrendPrediction {
  category: string;
  timeframe: '1week' | '1month' | '3months' | '1year';
  prediction: {
    priceDirection: 'increasing' | 'decreasing' | 'stable';
    priceChange: number; // Percentage change
    demandForecast: 'high' | 'medium' | 'low';
    confidence: number;
  };
  factors: TrendFactor[];
  recommendations: string[];
}

interface TrendFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

interface PriceforecastResult {
  currentPrice: number;
  predictedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  timeframe: string;
  influencingFactors: string[];
}

interface MarketInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'seasonal';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations: string[];
  timeRelevance: string;
}

interface SeasonalPattern {
  category: string;
  pattern: {
    month: number;
    demandMultiplier: number;
    priceMultiplier: number;
    description: string;
  }[];
  reliability: number;
}

interface CompetitorAnalysis {
  category: string;
  competitors: {
    brand: string;
    marketShare: number;
    averagePrice: number;
    priceStrategy: 'premium' | 'competitive' | 'budget';
    trendDirection: 'gaining' | 'losing' | 'stable';
  }[];
  marketConcentration: number; // 0-1, how concentrated the market is
  entryBarriers: 'high' | 'medium' | 'low';
}

interface InventoryOptimization {
  category: string;
  brand?: string;
  recommendations: {
    action: 'increase' | 'decrease' | 'maintain';
    percentage: number;
    reasoning: string;
    urgency: 'high' | 'medium' | 'low';
  };
  stockoutRisk: number;
  overStockRisk: number;
  optimalLevel: number;
}

export class PredictiveAnalyticsService {
  private static instance: PredictiveAnalyticsService;
  private marketData: MarketDataPoint[] = [];
  
  // Machine learning model parameters (simplified)
  private readonly trendModels = {
    shortTerm: {
      lookbackPeriod: 30, // days
      weight: 0.4
    },
    mediumTerm: {
      lookbackPeriod: 90, // days
      weight: 0.35
    },
    longTerm: {
      lookbackPeriod: 365, // days
      weight: 0.25
    }
  };

  // Market factors and their impact weights
  private readonly marketFactors = {
    seasonality: 0.25,
    innovation: 0.20,
    competition: 0.15,
    economy: 0.15,
    regulation: 0.10,
    technology: 0.10,
    supply_chain: 0.05
  };

  // Seasonal patterns for drone components
  private readonly seasonalPatterns: SeasonalPattern[] = [
    {
      category: 'frame',
      pattern: [
        { month: 1, demandMultiplier: 0.8, priceMultiplier: 0.95, description: 'Post-holiday low demand' },
        { month: 2, demandMultiplier: 0.9, priceMultiplier: 0.98, description: 'Building for spring' },
        { month: 3, demandMultiplier: 1.2, priceMultiplier: 1.05, description: 'Spring build season starts' },
        { month: 4, demandMultiplier: 1.4, priceMultiplier: 1.10, description: 'Peak spring building' },
        { month: 5, demandMultiplier: 1.3, priceMultiplier: 1.08, description: 'Continued high demand' },
        { month: 6, demandMultiplier: 1.1, priceMultiplier: 1.02, description: 'Summer flying season' },
        { month: 7, demandMultiplier: 1.0, priceMultiplier: 1.00, description: 'Baseline summer' },
        { month: 8, demandMultiplier: 1.1, priceMultiplier: 1.03, description: 'Back to school builds' },
        { month: 9, demandMultiplier: 1.3, priceMultiplier: 1.08, description: 'Fall racing season prep' },
        { month: 10, demandMultiplier: 1.2, priceMultiplier: 1.05, description: 'Pre-winter stockup' },
        { month: 11, demandMultiplier: 1.5, priceMultiplier: 1.15, description: 'Black Friday surge' },
        { month: 12, demandMultiplier: 1.4, priceMultiplier: 1.12, description: 'Holiday gift season' }
      ],
      reliability: 0.85
    },
    {
      category: 'battery',
      pattern: [
        { month: 1, demandMultiplier: 0.7, priceMultiplier: 0.90, description: 'Low flying activity' },
        { month: 2, demandMultiplier: 0.8, priceMultiplier: 0.95, description: 'Indoor flying only' },
        { month: 3, demandMultiplier: 1.3, priceMultiplier: 1.08, description: 'Spring prep, battery refresh' },
        { month: 4, demandMultiplier: 1.6, priceMultiplier: 1.15, description: 'Peak flying season starts' },
        { month: 5, demandMultiplier: 1.7, priceMultiplier: 1.18, description: 'High flight frequency' },
        { month: 6, demandMultiplier: 1.5, priceMultiplier: 1.12, description: 'Summer flying' },
        { month: 7, demandMultiplier: 1.4, priceMultiplier: 1.10, description: 'Vacation flying' },
        { month: 8, demandMultiplier: 1.3, priceMultiplier: 1.08, description: 'Late summer flying' },
        { month: 9, demandMultiplier: 1.2, priceMultiplier: 1.05, description: 'Fall racing season' },
        { month: 10, demandMultiplier: 1.0, priceMultiplier: 1.00, description: 'Moderate activity' },
        { month: 11, demandMultiplier: 1.1, priceMultiplier: 1.03, description: 'Indoor season prep' },
        { month: 12, demandMultiplier: 1.2, priceMultiplier: 1.05, description: 'Holiday gifts' }
      ],
      reliability: 0.90
    }
  ];

  private constructor() {
    this.initializeMarketData();
  }

  public static getInstance(): PredictiveAnalyticsService {
    if (!PredictiveAnalyticsService.instance) {
      PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
    }
    return PredictiveAnalyticsService.instance;
  }

  /**
   * Initialize with simulated market data
   */
  private initializeMarketData(): void {
    const categories = ['frame', 'motor', 'propeller', 'battery', 'camera', 'stack'];
    const brands = ['DJI', 'Betaflight', 'TMotor', 'HQProp', 'Lumenier', 'ImpulseRC', 'TATTU'];
    const now = new Date();
    
    // Generate 2 years of historical data
    for (let days = 730; days >= 0; days--) {
      const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      categories.forEach(category => {
        const seasonalMultiplier = this.getSeasonalMultiplier(category, date.getMonth() + 1);
        
        brands.forEach(brand => {
          this.marketData.push({
            timestamp: date,
            category,
            brand,
            price: this.generateRealisticPrice(category, brand, seasonalMultiplier),
            volume: Math.floor(Math.random() * 1000 + 100) * seasonalMultiplier.demandMultiplier,
            demand: Math.floor(Math.random() * 100 + 50) * seasonalMultiplier.demandMultiplier,
            supply: Math.floor(Math.random() * 150 + 100),
            marketCap: Math.floor(Math.random() * 1000000 + 500000)
          });
        });
      });
    }
  }

  /**
   * Generate realistic prices based on category and brand
   */
  private generateRealisticPrice(category: string, brand: string, seasonalMultiplier: { priceMultiplier: number }): number {
    const basePrices = {
      frame: { min: 20, max: 200 },
      motor: { min: 15, max: 80 },
      propeller: { min: 2, max: 25 },
      battery: { min: 25, max: 150 },
      camera: { min: 30, max: 300 },
      stack: { min: 50, max: 400 }
    };

    const brandMultipliers = {
      'DJI': 1.5,
      'TMotor': 1.3,
      'Lumenier': 1.2,
      'ImpulseRC': 1.1,
      'Betaflight': 1.0,
      'HQProp': 0.9,
      'TATTU': 1.0
    };

    const base = basePrices[category as keyof typeof basePrices] || { min: 10, max: 100 };
    const brandMultiplier = brandMultipliers[brand as keyof typeof brandMultipliers] || 1.0;
    
    const basePrice = Math.random() * (base.max - base.min) + base.min;
    return Math.round(basePrice * brandMultiplier * seasonalMultiplier.priceMultiplier * 100) / 100;
  }

  /**
   * Get seasonal multiplier for a category and month
   */
  private getSeasonalMultiplier(category: string, month: number): { demandMultiplier: number; priceMultiplier: number } {
    const pattern = this.seasonalPatterns.find(p => p.category === category);
    if (!pattern) {
      return { demandMultiplier: 1.0, priceMultiplier: 1.0 };
    }

    const monthData = pattern.pattern.find(p => p.month === month);
    return monthData ? 
      { demandMultiplier: monthData.demandMultiplier, priceMultiplier: monthData.priceMultiplier } :
      { demandMultiplier: 1.0, priceMultiplier: 1.0 };
  }

  /**
   * Predict market trends for a specific category
   */
  public async predictMarketTrends(
    category: string,
    timeframe: '1week' | '1month' | '3months' | '1year' = '1month'
  ): Promise<TrendPrediction> {
    const historicalData = this.getHistoricalData(category);
    const currentData = this.getCurrentMarketState(category);
    
    // Analyze trends using different time horizons
    const shortTermTrend = this.calculateTrend(historicalData, this.trendModels.shortTerm.lookbackPeriod);
    const mediumTermTrend = this.calculateTrend(historicalData, this.trendModels.mediumTerm.lookbackPeriod);
    const longTermTrend = this.calculateTrend(historicalData, this.trendModels.longTerm.lookbackPeriod);
    
    // Weighted prediction
    const weightedTrend = 
      shortTermTrend * this.trendModels.shortTerm.weight +
      mediumTermTrend * this.trendModels.mediumTerm.weight +
      longTermTrend * this.trendModels.longTerm.weight;

    // Apply seasonal adjustments
    const seasonalAdjustment = this.applySeasonalForecast(category, timeframe);
    const adjustedTrend = weightedTrend * seasonalAdjustment;

    // Determine price direction and forecast
    const priceDirection = adjustedTrend > 0.05 ? 'increasing' : 
                          adjustedTrend < -0.05 ? 'decreasing' : 'stable';
    
    const priceChange = adjustedTrend * 100; // Convert to percentage
    
    // Forecast demand based on historical patterns and trends
    const demandForecast = this.forecastDemand(category, adjustedTrend, timeframe);
    
    // Calculate confidence based on data quality and trend consistency
    const confidence = this.calculateTrendConfidence(historicalData, [shortTermTrend, mediumTermTrend, longTermTrend]);
    
    // Identify contributing factors
    const factors = this.identifyTrendFactors(category, adjustedTrend, currentData);
    
    // Generate actionable recommendations
    const recommendations = this.generateTrendRecommendations(category, priceDirection, demandForecast, adjustedTrend);

    return {
      category,
      timeframe,
      prediction: {
        priceDirection,
        priceChange,
        demandForecast,
        confidence
      },
      factors,
      recommendations
    };
  }

  /**
   * Forecast price for a specific product
   */
  public async forecastPrice(
    category: string,
    brand?: string,
    model?: string,
    timeframe: string = '30d'
  ): Promise<PriceforecastResult> {
    const historicalData = this.getProductHistoricalData(category, brand, model);
    const currentPrice = this.getCurrentPrice(category, brand, model);
    
    // Apply trend analysis
    const trend = this.calculateTrend(historicalData, 30);
    const seasonalMultiplier = this.getSeasonalForecastMultiplier(category, timeframe);
    
    // Predict price change
    const forecastMultiplier = 1 + (trend * seasonalMultiplier);
    const predictedPrice = Math.round(currentPrice * forecastMultiplier * 100) / 100;
    
    // Calculate price range with confidence intervals
    const variance = this.calculatePriceVariance(historicalData);
    const priceRange = {
      min: Math.round((predictedPrice - variance) * 100) / 100,
      max: Math.round((predictedPrice + variance) * 100) / 100
    };
    
    // Identify influencing factors
    const influencingFactors = this.identifyPriceFactors(category, trend, brand);
    
    // Calculate confidence
    const confidence = Math.max(0.1, Math.min(0.95, 0.8 - Math.abs(trend) * 2));

    return {
      currentPrice,
      predictedPrice,
      priceRange,
      confidence,
      timeframe,
      influencingFactors
    };
  }

  /**
   * Generate market insights and opportunities
   */
  public async generateMarketInsights(categories?: string[]): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];
    const categoriesToAnalyze = categories || ['frame', 'motor', 'propeller', 'battery', 'camera', 'stack'];
    
    for (const category of categoriesToAnalyze) {
      // Trend-based insights
      const trendPrediction = await this.predictMarketTrends(category, '3months');
      
      if (trendPrediction.prediction.priceDirection === 'increasing' && 
          trendPrediction.prediction.priceChange > 10) {
        insights.push({
          type: 'opportunity',
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Price Surge Expected`,
          description: `Prices predicted to increase by ${trendPrediction.prediction.priceChange.toFixed(1)}% over the next 3 months`,
          impact: 'high',
          actionable: true,
          recommendations: [
            'Consider stocking up on inventory before price increases',
            'Review supplier contracts and pricing agreements',
            'Communicate potential price changes to customers early'
          ],
          timeRelevance: 'Next 3 months'
        });
      }

      // Seasonal insights
      const currentMonth = new Date().getMonth() + 1;
      const seasonalPattern = this.seasonalPatterns.find(p => p.category === category);
      if (seasonalPattern) {
        const nextMonthPattern = seasonalPattern.pattern.find(p => p.month === (currentMonth % 12) + 1);
        if (nextMonthPattern && nextMonthPattern.demandMultiplier > 1.3) {
          insights.push({
            type: 'seasonal',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Seasonal Demand Spike Coming`,
            description: nextMonthPattern.description,
            impact: 'medium',
            actionable: true,
            recommendations: [
              'Increase inventory levels to meet seasonal demand',
              'Plan marketing campaigns for peak season',
              'Review staffing levels for increased order volume'
            ],
            timeRelevance: 'Next month'
          });
        }
      }

      // Risk insights
      const currentData = this.getCurrentMarketState(category);
      if (currentData.supply < currentData.demand * 0.5) {
        insights.push({
          type: 'risk',
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Supply Shortage Risk`,
          description: 'Current supply levels are significantly below demand, indicating potential shortages',
          impact: 'high',
          actionable: true,
          recommendations: [
            'Diversify supplier base to reduce shortage risk',
            'Implement just-in-time inventory alerts',
            'Consider alternative product options for customers'
          ],
          timeRelevance: 'Immediate'
        });
      }
    }

    return insights.sort((a, b) => {
      const impactWeight = { high: 3, medium: 2, low: 1 };
      return impactWeight[b.impact] - impactWeight[a.impact];
    });
  }

  /**
   * Analyze competitor positioning and market share
   */
  public async analyzeCompetitors(category: string): Promise<CompetitorAnalysis> {
    const categoryData = this.marketData.filter(d => d.category === category);
    const brands = [...new Set(categoryData.map(d => d.brand).filter(Boolean))];
    
    const competitors = brands.map(brand => {
      const brandData = categoryData.filter(d => d.brand === brand);
      const totalVolume = categoryData.reduce((sum, d) => sum + d.volume, 0);
      const brandVolume = brandData.reduce((sum, d) => sum + d.volume, 0);
      const averagePrice = brandData.reduce((sum, d) => sum + d.price, 0) / brandData.length;
      
      // Determine price strategy
      const categoryAvgPrice = categoryData.reduce((sum, d) => sum + d.price, 0) / categoryData.length;
      let priceStrategy: 'premium' | 'competitive' | 'budget';
      if (averagePrice > categoryAvgPrice * 1.2) priceStrategy = 'premium';
      else if (averagePrice < categoryAvgPrice * 0.8) priceStrategy = 'budget';
      else priceStrategy = 'competitive';
      
      // Determine trend direction (simplified)
      const recentTrend = this.calculateTrend(brandData, 30);
      const trendDirection: 'gaining' | 'losing' | 'stable' = recentTrend > 0.02 ? 'gaining' : recentTrend < -0.02 ? 'losing' : 'stable';
      
      return {
        brand: brand!,
        marketShare: brandVolume / totalVolume,
        averagePrice: Math.round(averagePrice * 100) / 100,
        priceStrategy,
        trendDirection
      };
    });

    // Calculate market concentration (Herfindahl index)
    const marketConcentration = competitors.reduce((sum, comp) => sum + Math.pow(comp.marketShare, 2), 0);
    
    // Determine entry barriers based on market concentration and average prices
    let entryBarriers: 'high' | 'medium' | 'low';
    if (marketConcentration > 0.25 || competitors.some(c => c.marketShare > 0.4)) {
      entryBarriers = 'high';
    } else if (marketConcentration > 0.15) {
      entryBarriers = 'medium';
    } else {
      entryBarriers = 'low';
    }

    return {
      category,
      competitors: competitors.sort((a, b) => b.marketShare - a.marketShare),
      marketConcentration,
      entryBarriers
    };
  }

  /**
   * Optimize inventory levels based on predictions
   */
  public async optimizeInventory(
    category: string,
    brand?: string,
    currentLevel: number = 100
  ): Promise<InventoryOptimization> {
    const trendPrediction = await this.predictMarketTrends(category, '1month');
    const seasonalMultiplier = this.getSeasonalMultiplier(category, new Date().getMonth() + 1);
    
    // Calculate optimal level based on predicted demand
    const demandMultiplier = seasonalMultiplier.demandMultiplier;
    const trendMultiplier = trendPrediction.prediction.demandForecast === 'high' ? 1.5 :
                           trendPrediction.prediction.demandForecast === 'medium' ? 1.2 : 1.0;
    
    const optimalLevel = Math.round(currentLevel * demandMultiplier * trendMultiplier);
    
    // Determine recommended action
    let action: 'increase' | 'decrease' | 'maintain';
    let percentage = 0;
    let reasoning = '';
    let urgency: 'high' | 'medium' | 'low' = 'medium';
    
    const difference = (optimalLevel - currentLevel) / currentLevel;
    
    if (difference > 0.2) {
      action = 'increase';
      percentage = Math.round(difference * 100);
      reasoning = `Predicted demand increase due to ${trendPrediction.prediction.demandForecast} demand forecast and seasonal patterns`;
      urgency = percentage > 50 ? 'high' : 'medium';
    } else if (difference < -0.2) {
      action = 'decrease';
      percentage = Math.round(Math.abs(difference) * 100);
      reasoning = `Predicted demand decrease, optimize cash flow by reducing inventory`;
      urgency = 'low';
    } else {
      action = 'maintain';
      reasoning = 'Current inventory level is optimal for predicted demand';
      urgency = 'low';
    }
    
    // Calculate risk scores
    const stockoutRisk = action === 'increase' ? 0.8 : action === 'maintain' ? 0.3 : 0.1;
    const overStockRisk = action === 'decrease' ? 0.1 : action === 'maintain' ? 0.3 : 0.7;

    return {
      category,
      brand,
      recommendations: {
        action,
        percentage,
        reasoning,
        urgency
      },
      stockoutRisk,
      overStockRisk,
      optimalLevel
    };
  }

  // Helper methods
  private getHistoricalData(category: string): MarketDataPoint[] {
    return this.marketData.filter(d => d.category === category);
  }

  private getProductHistoricalData(category: string, brand?: string, model?: string): MarketDataPoint[] {
    return this.marketData.filter(d => 
      d.category === category && 
      (!brand || d.brand === brand) &&
      (!model || d.model === model)
    );
  }

  private getCurrentMarketState(category: string): { demand: number; supply: number; price: number } {
    const recentData = this.marketData
      .filter(d => d.category === category)
      .filter(d => d.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return {
      demand: recentData.reduce((sum, d) => sum + d.demand, 0) / recentData.length,
      supply: recentData.reduce((sum, d) => sum + d.supply, 0) / recentData.length,
      price: recentData.reduce((sum, d) => sum + d.price, 0) / recentData.length
    };
  }

  private getCurrentPrice(category: string, brand?: string, model?: string): number {
    const recentData = this.getProductHistoricalData(category, brand, model)
      .filter(d => d.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return recentData.length > 0 ?
      recentData.reduce((sum, d) => sum + d.price, 0) / recentData.length :
      0;
  }

  private calculateTrend(data: MarketDataPoint[], lookbackDays: number): number {
    const cutoffDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);
    const relevantData = data.filter(d => d.timestamp > cutoffDate).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    if (relevantData.length < 2) return 0;
    
    const firstValue = relevantData[0].price;
    const lastValue = relevantData[relevantData.length - 1].price;
    
    return (lastValue - firstValue) / firstValue;
  }

  private applySeasonalForecast(category: string, timeframe: string): number {
    const months = timeframe === '1week' ? 0.25 : 
                  timeframe === '1month' ? 1 :
                  timeframe === '3months' ? 3 : 12;
    
    const currentMonth = new Date().getMonth() + 1;
    const targetMonth = (currentMonth + Math.floor(months)) % 12 || 12;
    
    const seasonalMultiplier = this.getSeasonalMultiplier(category, targetMonth);
    return seasonalMultiplier.priceMultiplier;
  }

  private forecastDemand(category: string, trend: number, timeframe: string): 'high' | 'medium' | 'low' {
    const seasonalMultiplier = this.applySeasonalForecast(category, timeframe);
    const combinedFactor = trend + (seasonalMultiplier - 1);
    
    if (combinedFactor > 0.1) return 'high';
    if (combinedFactor < -0.1) return 'low';
    return 'medium';
  }

  private calculateTrendConfidence(data: MarketDataPoint[], trends: number[]): number {
    // Base confidence on data quantity
    let confidence = Math.min(0.9, data.length / 100);
    
    // Reduce confidence if trends are inconsistent
    const trendVariance = trends.reduce((sum, trend) => sum + Math.abs(trend - trends[0]), 0) / trends.length;
    confidence *= Math.max(0.1, 1 - trendVariance * 5);
    
    return Math.round(confidence * 100) / 100;
  }

  private identifyTrendFactors(category: string, trend: number, currentData: { demand: number; supply: number }): TrendFactor[] {
    const factors: TrendFactor[] = [];
    
    // Supply/demand factor
    const supplyDemandRatio = currentData.supply / currentData.demand;
    if (supplyDemandRatio < 0.8) {
      factors.push({
        factor: 'Supply Shortage',
        impact: 'positive',
        weight: 0.3,
        description: 'Low supply relative to demand driving price increases'
      });
    } else if (supplyDemandRatio > 1.5) {
      factors.push({
        factor: 'Oversupply',
        impact: 'negative',
        weight: 0.3,
        description: 'High supply relative to demand putting downward pressure on prices'
      });
    }
    
    // Seasonal factor
    const currentMonth = new Date().getMonth() + 1;
    const seasonalMultiplier = this.getSeasonalMultiplier(category, currentMonth);
    if (seasonalMultiplier.demandMultiplier > 1.2) {
      factors.push({
        factor: 'Seasonal Demand',
        impact: 'positive',
        weight: 0.25,
        description: 'Seasonal peak driving increased demand and prices'
      });
    }
    
    // Add general trend factor
    if (Math.abs(trend) > 0.05) {
      factors.push({
        factor: 'Market Trend',
        impact: trend > 0 ? 'positive' : 'negative',
        weight: 0.2,
        description: `Sustained ${trend > 0 ? 'upward' : 'downward'} price movement in the market`
      });
    }
    
    return factors;
  }

  private generateTrendRecommendations(
    category: string, 
    priceDirection: string, 
    demandForecast: string, 
    trend: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (priceDirection === 'increasing') {
      recommendations.push('Consider increasing inventory levels before prices rise further');
      recommendations.push('Review supplier agreements for price protection clauses');
    } else if (priceDirection === 'decreasing') {
      recommendations.push('Delay large inventory purchases if possible');
      recommendations.push('Focus on moving existing inventory quickly');
    }
    
    if (demandForecast === 'high') {
      recommendations.push('Prepare for increased customer demand');
      recommendations.push('Consider expanding product variety in this category');
    } else if (demandForecast === 'low') {
      recommendations.push('Focus marketing efforts on other product categories');
      recommendations.push('Consider promotional pricing to stimulate demand');
    }
    
    if (Math.abs(trend) > 0.15) {
      recommendations.push('Monitor market conditions closely due to high volatility');
      recommendations.push('Implement dynamic pricing strategies to respond to rapid changes');
    }
    
    return recommendations;
  }

  private identifyPriceFactors(category: string, trend: number, brand?: string): string[] {
    const factors: string[] = [];
    
    factors.push(`Historical price trend: ${trend > 0 ? 'increasing' : 'decreasing'} by ${Math.abs(trend * 100).toFixed(1)}%`);
    
    const currentMonth = new Date().getMonth() + 1;
    const seasonalMultiplier = this.getSeasonalMultiplier(category, currentMonth);
    if (seasonalMultiplier.priceMultiplier !== 1.0) {
      factors.push(`Seasonal price impact: ${seasonalMultiplier.priceMultiplier > 1 ? 'increasing' : 'decreasing'} prices`);
    }
    
    if (brand) {
      factors.push(`Brand positioning: ${brand} market position affects pricing power`);
    }
    
    factors.push(`Category dynamics: ${category} market conditions`);
    
    return factors;
  }

  private calculatePriceVariance(data: MarketDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const prices = data.map(d => d.price);
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) / prices.length;
    
    return Math.sqrt(variance);
  }

  private getSeasonalForecastMultiplier(category: string, timeframe: string): number {
    const months = timeframe === '1week' ? 0.25 : 
                  timeframe === '1month' ? 1 :
                  timeframe === '3months' ? 3 : 12;
    
    const currentMonth = new Date().getMonth() + 1;
    const targetMonth = (currentMonth + Math.floor(months)) % 12 || 12;
    
    return this.getSeasonalMultiplier(category, targetMonth).priceMultiplier;
  }
}