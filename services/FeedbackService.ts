// User feedback service for improving performance predictions
interface PerformanceFeedback {
  id: string;
  userId: string;
  timestamp: Date;
  predictionId: string;
  
  // Predicted values
  predictedFlightTime: number;
  predictedTopSpeed: number;
  predictedThrustToWeight: number;
  predictedPowerConsumption: number;
  
  // Actual user-reported values
  actualFlightTime?: number;
  actualTopSpeed?: number;
  actualThrustToWeight?: number;
  actualPowerConsumption?: number;
  
  // User ratings (1-5 scale)
  accuracyRating: number;
  usefulnessRating: number;
  
  // Additional feedback
  comments?: string;
  flightConditions?: {
    weather: 'calm' | 'windy' | 'very_windy';
    temperature: number; // Celsius
    altitude: number; // meters
    flightStyle: 'gentle' | 'normal' | 'aggressive' | 'racing';
  };
  
  // Build configuration
  buildConfig: {
    motors: string[];
    props: string[];
    batteries: string[];
    frame: string;
    weight: number; // grams
  };
}

interface FeedbackStats {
  totalFeedbacks: number;
  averageAccuracy: number;
  averageUsefulness: number;
  predictionErrors: {
    flightTime: { mean: number; stdDev: number; };
    topSpeed: { mean: number; stdDev: number; };
    thrustToWeight: { mean: number; stdDev: number; };
    powerConsumption: { mean: number; stdDev: number; };
  };
  improvementSuggestions: string[];
}

export class FeedbackService {
  private static readonly STORAGE_KEY = 'drone_performance_feedback';
  
  // Store feedback in localStorage (in production, this would go to a database)
  static async saveFeedback(feedback: PerformanceFeedback): Promise<void> {
    try {
      const existingFeedback = this.getFeedbackData();
      existingFeedback.push(feedback);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedback));
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  }
  
  // Get all feedback data
  static getFeedbackData(): PerformanceFeedback[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading feedback:', error);
      return [];
    }
  }
  
  // Calculate prediction accuracy statistics
  static calculateFeedbackStats(): FeedbackStats {
    const feedbacks = this.getFeedbackData();
    
    if (feedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageAccuracy: 0,
        averageUsefulness: 0,
        predictionErrors: {
          flightTime: { mean: 0, stdDev: 0 },
          topSpeed: { mean: 0, stdDev: 0 },
          thrustToWeight: { mean: 0, stdDev: 0 },
          powerConsumption: { mean: 0, stdDev: 0 },
        },
        improvementSuggestions: [],
      };
    }
    
    // Calculate averages
    const totalAccuracy = feedbacks.reduce((sum, f) => sum + f.accuracyRating, 0);
    const totalUsefulness = feedbacks.reduce((sum, f) => sum + f.usefulnessRating, 0);
    
    // Calculate prediction errors for feedbacks with actual data
    const flightTimeErrors: number[] = [];
    const topSpeedErrors: number[] = [];
    const twrErrors: number[] = [];
    const powerErrors: number[] = [];
    
    feedbacks.forEach(feedback => {
      if (feedback.actualFlightTime) {
        const error = Math.abs(feedback.predictedFlightTime - feedback.actualFlightTime) / feedback.actualFlightTime;
        flightTimeErrors.push(error * 100); // Percentage error
      }
      if (feedback.actualTopSpeed) {
        const error = Math.abs(feedback.predictedTopSpeed - feedback.actualTopSpeed) / feedback.actualTopSpeed;
        topSpeedErrors.push(error * 100);
      }
      if (feedback.actualThrustToWeight) {
        const error = Math.abs(feedback.predictedThrustToWeight - feedback.actualThrustToWeight) / feedback.actualThrustToWeight;
        twrErrors.push(error * 100);
      }
      if (feedback.actualPowerConsumption) {
        const error = Math.abs(feedback.predictedPowerConsumption - feedback.actualPowerConsumption) / feedback.actualPowerConsumption;
        powerErrors.push(error * 100);
      }
    });
    
    // Generate improvement suggestions based on feedback patterns
    const suggestions: string[] = [];
    const avgAccuracy = totalAccuracy / feedbacks.length;
    
    if (avgAccuracy < 3) {
      suggestions.push('Prediction accuracy is below average - consider algorithm refinements');
    }
    
    if (flightTimeErrors.length > 0 && this.calculateMean(flightTimeErrors) > 20) {
      suggestions.push('Flight time predictions show high error rate - review battery discharge models');
    }
    
    if (topSpeedErrors.length > 0 && this.calculateMean(topSpeedErrors) > 15) {
      suggestions.push('Speed predictions need calibration - check aerodynamic assumptions');
    }
    
    const windyFlights = feedbacks.filter(f => 
      f.flightConditions?.weather === 'windy' || f.flightConditions?.weather === 'very_windy'
    );
    if (windyFlights.length > feedbacks.length * 0.3) {
      suggestions.push('Many flights in windy conditions - consider weather compensation factors');
    }
    
    return {
      totalFeedbacks: feedbacks.length,
      averageAccuracy: avgAccuracy,
      averageUsefulness: totalUsefulness / feedbacks.length,
      predictionErrors: {
        flightTime: { 
          mean: this.calculateMean(flightTimeErrors), 
          stdDev: this.calculateStdDev(flightTimeErrors) 
        },
        topSpeed: { 
          mean: this.calculateMean(topSpeedErrors), 
          stdDev: this.calculateStdDev(topSpeedErrors) 
        },
        thrustToWeight: { 
          mean: this.calculateMean(twrErrors), 
          stdDev: this.calculateStdDev(twrErrors) 
        },
        powerConsumption: { 
          mean: this.calculateMean(powerErrors), 
          stdDev: this.calculateStdDev(powerErrors) 
        },
      },
      improvementSuggestions: suggestions,
    };
  }
  
  // Get calibration factors based on user feedback
  static getCalibrationFactors(): {
    flightTimeMultiplier: number;
    topSpeedMultiplier: number;
    thrustToWeightMultiplier: number;
    powerConsumptionMultiplier: number;
  } {
    const feedbacks = this.getFeedbackData().filter(f => 
      f.actualFlightTime || f.actualTopSpeed || f.actualThrustToWeight || f.actualPowerConsumption
    );
    
    if (feedbacks.length < 5) {
      // Not enough data for calibration
      return {
        flightTimeMultiplier: 1.0,
        topSpeedMultiplier: 1.0,
        thrustToWeightMultiplier: 1.0,
        powerConsumptionMultiplier: 1.0,
      };
    }
    
    // Calculate average ratios of actual vs predicted
    const flightTimeRatios: number[] = [];
    const topSpeedRatios: number[] = [];
    const twrRatios: number[] = [];
    const powerRatios: number[] = [];
    
    feedbacks.forEach(feedback => {
      if (feedback.actualFlightTime && feedback.predictedFlightTime > 0) {
        flightTimeRatios.push(feedback.actualFlightTime / feedback.predictedFlightTime);
      }
      if (feedback.actualTopSpeed && feedback.predictedTopSpeed > 0) {
        topSpeedRatios.push(feedback.actualTopSpeed / feedback.predictedTopSpeed);
      }
      if (feedback.actualThrustToWeight && feedback.predictedThrustToWeight > 0) {
        twrRatios.push(feedback.actualThrustToWeight / feedback.predictedThrustToWeight);
      }
      if (feedback.actualPowerConsumption && feedback.predictedPowerConsumption > 0) {
        powerRatios.push(feedback.actualPowerConsumption / feedback.predictedPowerConsumption);
      }
    });
    
    return {
      flightTimeMultiplier: flightTimeRatios.length > 0 ? this.calculateMean(flightTimeRatios) : 1.0,
      topSpeedMultiplier: topSpeedRatios.length > 0 ? this.calculateMean(topSpeedRatios) : 1.0,
      thrustToWeightMultiplier: twrRatios.length > 0 ? this.calculateMean(twrRatios) : 1.0,
      powerConsumptionMultiplier: powerRatios.length > 0 ? this.calculateMean(powerRatios) : 1.0,
    };
  }
  
  // Utility functions
  private static calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private static calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(this.calculateMean(squaredDiffs));
  }
  
  // Generate a unique ID for predictions
  static generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export type { PerformanceFeedback, FeedbackStats };