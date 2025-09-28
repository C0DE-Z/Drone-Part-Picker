import React, { useState } from "react";
import { X, Star } from "lucide-react";

interface PredictionData {
  predictionId: string;
  estimatedPerformance: {
    thrust: number;
    flightTime: number;
    topSpeed: number;
    powerConsumption: number;
    thrustToWeight: number;
    totalWeight: number;
  };
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionData?: PredictionData;
  buildParts?: unknown[];
  userId?: string;
}

interface ActualPerformance {
  actualFlightTime: number;
  actualTopSpeed: number;
  actualThrustToWeight: number;
  batteryUsage: number;
  overallSatisfaction: number;
  comments: string;
}

const StarRating: React.FC<{
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
}> = ({ rating, onRatingChange, label }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star)}
          className={`p-1 rounded transition-colors ${
            star <= rating ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          <Star size={20} fill={star <= rating ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  </div>
);

const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose,
  predictionData,
  userId 
}) => {
  const [actualPerformance, setActualPerformance] = useState<ActualPerformance>({
    actualFlightTime: 0,
    actualTopSpeed: 0,
    actualThrustToWeight: 0,
    batteryUsage: 0,
    overallSatisfaction: 0,
    comments: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isOpen || !predictionData) return null;
  
  const handleSubmit = async () => {
    if (!userId) {
      alert("Please sign in to submit feedback");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const feedback = {
        predictionId: predictionData.predictionId,
        userId,
        predicted: predictionData.estimatedPerformance,
        actual: actualPerformance,
        timestamp: new Date().toISOString(),
      };
      
      const response = await fetch('/api/performance-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
      
      if (response.ok) {
        alert("Thank you for your feedback! This helps improve our predictions.");
        onClose();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Performance Feedback</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {/* Predicted vs Actual Performance */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Predicted Performance</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Flight Time: <span className="font-medium">{predictionData.estimatedPerformance.flightTime} min</span></div>
            <div>Top Speed: <span className="font-medium">{predictionData.estimatedPerformance.topSpeed} km/h</span></div>
            <div>Thrust/Weight: <span className="font-medium">{predictionData.estimatedPerformance.thrustToWeight}</span></div>
            <div>Total Weight: <span className="font-medium">{predictionData.estimatedPerformance.totalWeight}g</span></div>
          </div>
        </div>
        
        {/* Actual Performance Input */}
        <div className="space-y-4 mb-6">
          <h3 className="font-medium text-gray-900">Actual Performance</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Flight Time (minutes)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualPerformance.actualFlightTime || ""}
                onChange={(e) => setActualPerformance(prev => ({
                  ...prev,
                  actualFlightTime: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 8.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Top Speed (km/h)
              </label>
              <input
                type="number"
                step="1"
                value={actualPerformance.actualTopSpeed || ""}
                onChange={(e) => setActualPerformance(prev => ({
                  ...prev,
                  actualTopSpeed: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 75"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Perceived Thrust/Weight (1-5)
              </label>
              <select
                value={actualPerformance.actualThrustToWeight || ""}
                onChange={(e) => setActualPerformance(prev => ({
                  ...prev,
                  actualThrustToWeight: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="1">1 - Very weak</option>
                <option value="2">2 - Weak</option>
                <option value="3">3 - Adequate</option>
                <option value="4">4 - Strong</option>
                <option value="5">5 - Very strong</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Battery Usage (% per minute)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualPerformance.batteryUsage || ""}
                onChange={(e) => setActualPerformance(prev => ({
                  ...prev,
                  batteryUsage: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 8.5"
              />
            </div>
          </div>
        </div>
        
        {/* Overall Satisfaction Rating */}
        <StarRating
          rating={actualPerformance.overallSatisfaction}
          onRatingChange={(rating) => setActualPerformance(prev => ({
            ...prev,
            overallSatisfaction: rating
          }))}
          label="Overall Prediction Accuracy"
        />
        
        {/* Comments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={actualPerformance.comments}
            onChange={(e) => setActualPerformance(prev => ({
              ...prev,
              comments: e.target.value
            }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any additional feedback about the prediction accuracy or build performance..."
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || actualPerformance.overallSatisfaction === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
