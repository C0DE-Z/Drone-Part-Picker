'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { AIClassificationService, ProductFeatures } from '@/utils/AIClassificationService';
import { EnhancedClassificationIntegrationService } from '@/utils/EnhancedClassificationIntegrationService';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  currentCategory?: string;
  aiSuggested?: {
    category: string;
    confidence: number;
    reasoning: string[];
    features: ProductFeatures;
  };
}

interface ClassificationGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateCategory: (productId: string, category: string, confidence: number) => void;
}

const CATEGORIES = [
  { id: 'motor', name: 'Motors', icon: '⚡', color: 'from-blue-500 to-blue-600' },
  { id: 'stack', name: 'ESC/FC', icon: '🔗', color: 'from-green-500 to-green-600' },
  { id: 'frame', name: 'Frames', icon: '🏗️', color: 'from-purple-500 to-purple-600' },
  { id: 'prop', name: 'Props', icon: '🌀', color: 'from-yellow-500 to-yellow-600' },
  { id: 'battery', name: 'Batteries', icon: '🔋', color: 'from-red-500 to-red-600' },
  { id: 'camera', name: 'Cameras', icon: '📷', color: 'from-indigo-500 to-indigo-600' },
];

export default function ClassificationGameModal({ 
  isOpen, 
  onClose, 
  products, 
  onUpdateCategory 
}: ClassificationGameModalProps) {
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [gameStats, setGameStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0
  });
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentProduct = products[currentProductIndex];
  const aiService = AIClassificationService.getInstance();
  const enhancedClassifier = EnhancedClassificationIntegrationService.getInstance();

  useEffect(() => {
    if (isOpen && products.length > 0) {
      // Generate AI classifications for all products using enhanced classifier
      const updatedProducts = products.map(product => {
        if (!product.aiSuggested) {
          // Use enhanced classification for better accuracy
          const enhancedResult = enhancedClassifier.classifyProduct(product.name, product.description);
          const enhanced = enhancedResult.enhanced;
          
          // Also get legacy classification for comparison
          const legacyClassification = aiService.classifyProduct(product.name, product.description);
          
          return {
            ...product,
            aiSuggested: {
              category: enhanced.category,
              confidence: enhanced.confidence,
              reasoning: [enhanced.reasoning],
              features: legacyClassification.features,
              enhanced: {
                specifications: enhanced.specifications,
                analysis: enhancedResult.analysis
              }
            }
          };
        }
        return product;
      });
      
      // Update products with AI suggestions (you'd need to pass this back to parent)
      console.log('🚀 Enhanced AI Classifications generated:', updatedProducts);
    }
  }, [isOpen, products, enhancedClassifier, aiService]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleConfirm = () => {
    if (!selectedCategory || !currentProduct) return;

    // Compare with the actual correct category, not the AI suggestion
    const isCorrect = selectedCategory === currentProduct.currentCategory;
    
    setGameStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      skipped: prev.skipped
    }));

    // Update the product category
    onUpdateCategory(
      currentProduct.id, 
      selectedCategory, 
      isCorrect ? 1.0 : 0.0 // 1.0 for correct, 0.0 for incorrect
    );

    nextProduct();
  };

  const handleSkip = () => {
    setGameStats(prev => ({
      ...prev,
      total: prev.total + 1,
      skipped: prev.skipped + 1
    }));
    nextProduct();
  };

  const nextProduct = () => {
    setSelectedCategory(null);
    // Cycle through products infinitely
    if (currentProductIndex < products.length - 1) {
      setCurrentProductIndex(prev => prev + 1);
    } else {
      // Loop back to the first product for infinite play
      setCurrentProductIndex(0);
    }
  };

  const stopGame = () => {
    setShowResults(true);
  };

  const resetGame = () => {
    setCurrentProductIndex(0);
    setGameStats({ total: 0, correct: 0, incorrect: 0, skipped: 0 });
    setShowResults(false);
    setSelectedCategory(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
        {showResults ? (
          // Results View
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Classification Results! 🎉
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{gameStats.correct}</div>
                <div className="text-sm text-green-700">Correct</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-red-600">{gameStats.incorrect}</div>
                <div className="text-sm text-red-700">Incorrect</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-yellow-600">{gameStats.skipped}</div>
                <div className="text-sm text-yellow-700">Skipped</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {gameStats.total > 0 ? Math.round((gameStats.correct / gameStats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-700">Accuracy</div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Play Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Game View
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">AI Classification Verification</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 text-white/90">
                Product {currentProductIndex + 1} of {products.length} • Round {Math.floor(gameStats.total / products.length) + 1}
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-300"
                  style={{ width: `${((currentProductIndex + 1) / products.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-gray-50 px-6 py-3 flex gap-6 text-sm">
              <div className="text-green-600">✓ {gameStats.correct} Correct</div>
              <div className="text-red-600">✗ {gameStats.incorrect} Wrong</div>
              <div className="text-yellow-600">⊘ {gameStats.skipped} Skipped</div>
            </div>

            {currentProduct && (
              <div className="p-6">
                {/* Product Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                  <div className="flex gap-4">
                    {currentProduct.imageUrl && (
                      <div className="w-24 h-24 relative">
                        <Image 
                          src={currentProduct.imageUrl} 
                          alt={currentProduct.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{currentProduct.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {currentProduct.description}
                      </p>
                      <div className="text-lg font-semibold text-blue-600">
                        ${currentProduct.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Suggestion */}
                  {currentProduct.aiSuggested && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🤖</span>
                        <span className="font-semibold">AI Suggests:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {CATEGORIES.find(c => c.id === currentProduct.aiSuggested?.category)?.name || 'Unknown'}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(currentProduct.aiSuggested.confidence)}`}>
                          ({getConfidenceLabel(currentProduct.aiSuggested.confidence)} - {Math.round(currentProduct.aiSuggested.confidence * 100)}%)
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Reasoning:</strong> {currentProduct.aiSuggested.reasoning.join(', ')}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer Hint */}
                  {currentProduct.currentCategory && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">✅</span>
                        <span className="font-semibold">Correct Category:</span>
                        <span className="text-lg font-bold text-green-600">
                          {CATEGORIES.find(c => c.id === currentProduct.currentCategory)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        This is the ground truth category for learning purposes.
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4">What category does this product belong to?</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          selectedCategory === category.id
                            ? 'border-blue-500 bg-gradient-to-br ' + category.color + ' text-white shadow-lg scale-105'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="font-medium">{category.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleSkip}
                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={stopGame}
                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Stop Playing
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!selectedCategory}
                    className={`px-8 py-3 font-semibold rounded-xl transition-all duration-200 ${
                      selectedCategory
                        ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Confirm Choice
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}