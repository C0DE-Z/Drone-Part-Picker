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
          <div className="whitespace-nowrap text-sm font-semibold text-emerald-700">${comp.price}</div>
          {comp.vendor && (
            <div className="break-words text-right text-xs text-slate-500">{comp.vendor}</div>
          )}
          {comp.inStock === false && (
            <div className="whitespace-nowrap text-xs text-rose-600">Out of Stock</div>
          )}
        </div>
      );
    }

    if (comp.vendorPrices && comp.vendorPrices.length > 0) {
      const bestPrice = comp.vendorPrices[0];
      return (
        <div className="text-right min-w-[80px]">
          <div className="whitespace-nowrap text-sm font-semibold text-emerald-700">${bestPrice.price}</div>
          <div className="break-words text-right text-xs text-slate-500">{bestPrice.vendor}</div>
          {comp.vendorPrices.length > 1 && (
            <div className="whitespace-nowrap text-xs text-slate-400">+{comp.vendorPrices.length - 1} more</div>
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
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {comp.brand}
          </span>
          {comp.imageUrl && (
            <span className="text-xs text-slate-400">Image</span>
          )}
        </div>
      );
    }

    return null;
  };
  const getCardColor = () => {
    if (isSelected) {
      return 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-200 shadow-md shadow-blue-900/10';
    }
    if (!isCompatible) {
      return 'border-slate-300 bg-slate-100/80 opacity-70';
    }
    return 'border-slate-200 bg-white/95 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-900/10';
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
    const baseStyle = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300/80 bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-sm';
    switch (type) {
      case 'motor': return <span className={baseStyle}>MTR</span>;
      case 'frame': return <span className={baseStyle}>FRM</span>;
      case 'stack': return <span className={baseStyle}>STK</span>;
      case 'camera': return <span className={baseStyle}>CAM</span>;
      case 'prop': return <span className={baseStyle}>PRP</span>;
      case 'battery': return <span className={baseStyle}>BAT</span>;
      case 'customWeight': return <span className={baseStyle}>WGT</span>;
      default: return <span className={baseStyle}>PRT</span>;
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`relative w-full max-w-none cursor-pointer rounded-xl border p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.995] ${getCardColor()}`}
      onClick={handleCardClick}
    >
      {!isCompatible && (
        <div className="absolute right-3 top-3 z-10 rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">Issue</div>
      )}
      
      <div className="flex items-start gap-4 min-h-[80px]">
        {/* Icon Section */}
        <div className="flex-shrink-0 pt-1 transition-transform duration-200 hover:scale-[1.03]">
          {getTypeIcon()}
        </div>
        
        {/* Main Content - Improved Layout */}
        <div className="flex-1 min-w-0 max-w-full">
          <div className="space-y-2 w-full">
            {/* Name and Brand Row */}
            <div className="w-full">
              {renderBrandInfo()}
              <h3 className="mb-2 break-words text-base font-semibold leading-tight text-slate-900">
                {name}
              </h3>
            </div>
            
            {/* Specs and Price Row */}
            <div className="flex items-center justify-between gap-4 w-full">
              {/* Key Specs - Single Line Text */}
              <div className="flex-1 min-w-0 mr-4">
                <span 
                  className="block text-xs text-slate-600"
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
                    className="flex-shrink-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50"
                    title="View detailed specifications"
                  >
                    <div className="text-slate-600 transition-colors duration-200 group-hover:text-slate-800">
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
        <div className="absolute left-3 top-3 z-10 h-2 w-2 rounded-full bg-blue-600 animate-pulse"></div>
      )}
    </div>
  );
}
