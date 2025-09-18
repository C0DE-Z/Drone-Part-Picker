import React, { useRef } from 'react';
import { Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';

interface ComponentCardProps {
  name: string;
  component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;
  type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight';
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: (name: string, component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight, type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight', cardRect?: DOMRect) => void;
  isCompatible?: boolean;
}

export default function ComponentCard({ 
  name, 
  component, 
  type, 
  isSelected, 
  onSelect,
  onViewDetails,
  isCompatible = true 
}: ComponentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cardRect = cardRef.current?.getBoundingClientRect();
    onViewDetails(name, component, type, cardRect);
  };

  const renderPriceInfo = () => {
    const comp = component as Motor & Frame & Stack & Camera & Prop & Battery & CustomWeight & {
      price?: number;
      vendor?: string;
      inStock?: boolean;
      vendorPrices?: Array<{
        vendor: string;
        price: number;
        inStock: boolean;
      }>;
    };
    
    if (comp.price) {
      return (
        <div className="text-right min-w-[80px]">
          <div className="text-green-600 font-semibold text-sm whitespace-nowrap">${comp.price}</div>
          {comp.vendor && (
            <div className="text-xs text-gray-500 break-words text-right">{comp.vendor}</div>
          )}
          {comp.inStock === false && (
            <div className="text-xs text-red-500 whitespace-nowrap">Out of Stock</div>
          )}
        </div>
      );
    }

    if (comp.vendorPrices && comp.vendorPrices.length > 0) {
      const bestPrice = comp.vendorPrices[0];
      return (
        <div className="text-right min-w-[80px]">
          <div className="text-green-600 font-semibold text-sm whitespace-nowrap">${bestPrice.price}</div>
          <div className="text-xs text-gray-500 break-words text-right">{bestPrice.vendor}</div>
          {comp.vendorPrices.length > 1 && (
            <div className="text-xs text-gray-400 whitespace-nowrap">+{comp.vendorPrices.length - 1} more</div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderBrandInfo = () => {
    const comp = component as Motor & Frame & Stack & Camera & Prop & Battery & CustomWeight & {
      brand?: string;
      imageUrl?: string;
    };
    
    if (comp.brand) {
      return (
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {comp.brand}
          </span>
          {comp.imageUrl && (
            <span className="text-xs text-gray-400">📷</span>
          )}
        </div>
      );
    }

    return null;
  };
  const getCardColor = () => {
    if (isSelected) {
      return 'border-blue-400 bg-blue-50 ring-1 ring-blue-200 shadow-md';
    }
    if (!isCompatible) {
      return 'border-gray-300 bg-gray-50 opacity-60';
    }
    return 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md';
  };

  const renderCompactSpecs = () => {
    switch (type) {
      case 'motor':
        const motor = component as Motor;
        return `KV: ${motor.kv} • Weight: ${motor.weight}`;
      case 'frame':
        const frame = component as Frame;
        return `Type: ${frame.type} • Weight: ${frame.weight}`;
      case 'battery':
        const battery = component as Battery;
        return `Capacity: ${battery.capacity} • Voltage: ${battery.voltage}`;
      case 'stack':
        const stack = component as Stack;
        return `ESC: ${stack.escCurrentRating} • Mount: ${stack.mountingSize}`;
      case 'camera':
        const camera = component as Camera;
        return `Resolution: ${camera.resolution} • Weight: ${camera.weight}`;
      case 'prop':
        const prop = component as Prop;
        return `Size: ${prop.size} • Pitch: ${prop.pitch}`;
      default:
        return 'Click expand for details';
    }
  };

  const getTypeIcon = () => {
    const iconStyle = "text-2xl";
    switch (type) {
      case 'motor': return <span className={`${iconStyle} text-orange-500`}>⚡</span>;
      case 'frame': return <span className={`${iconStyle} text-gray-600`}>🔧</span>;
      case 'stack': return <span className={`${iconStyle} text-blue-600`}>💻</span>;
      case 'camera': return <span className={`${iconStyle} text-purple-600`}>📹</span>;
      case 'prop': return <span className={`${iconStyle} text-green-600`}>🌀</span>;
      case 'battery': return <span className={`${iconStyle} text-red-500`}>🔋</span>;
      case 'customWeight': return <span className={`${iconStyle} text-indigo-600`}>⚖️</span>;
      default: return <span className={`${iconStyle} text-gray-500`}>⚙️</span>;
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-1 active:scale-95 w-full max-w-none ${getCardColor()}`}
      onClick={handleCardClick}
    >
      {!isCompatible && (
        <div className="absolute top-3 right-3 text-red-500 text-lg animate-pulse z-10">⚠️</div>
      )}
      
      <div className="flex items-start gap-4 min-h-[80px]">
        {/* Icon Section */}
        <div className="flex-shrink-0 transition-transform duration-300 hover:scale-110 pt-1">
          {getTypeIcon()}
        </div>
        
        {/* Main Content - Improved Layout */}
        <div className="flex-1 min-w-0 max-w-full">
          <div className="space-y-2 w-full">
            {/* Name and Brand Row */}
            <div className="w-full">
              {renderBrandInfo()}
              <h3 className="font-semibold text-base text-gray-900 leading-tight break-words mb-2">
                {name}
              </h3>
            </div>
            
            {/* Specs and Price Row */}
            <div className="flex items-center justify-between gap-4 w-full">
              {/* Key Specs - Single Line Text */}
              <div className="flex-1 min-w-0 mr-4">
                <span 
                  className="text-xs text-gray-600 block"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}
                >
                  {renderCompactSpecs()}
                </span>
              </div>
              
              {/* Price and Actions - Fixed Width */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  {renderPriceInfo()}
                </div>
                {type !== 'customWeight' && (
                  <button
                    onClick={handleExpandClick}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 flex-shrink-0"
                    title="View detailed specifications"
                  >
                    <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 11H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-4"/>
                        <path d="M14 3h7v7"/>
                        <path d="M21 3l-8 8"/>
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-blue-600 rounded-full animate-pulse z-10"></div>
      )}
    </div>
  );
}
