import React from 'react';
import { Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;
  type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight';
  cardRect?: DOMRect;
}

export default function ComponentModal({ isOpen, onClose, name, component, type, cardRect }: ComponentModalProps) {
  if (!isOpen) return null;

  // Calculate initial position based on card location
  const getInitialStyle = () => {
    if (cardRect) {
      return {
        transformOrigin: `${cardRect.left + cardRect.width / 2}px ${cardRect.top + cardRect.height / 2}px`,
      };
    }
    return {};
  };

  const getTypeIcon = () => {
    const iconStyle = "text-4xl";
    switch (type) {
      case 'motor': return <span className={`${iconStyle} text-orange-500`}>⚡</span>;
      case 'frame': return <span className={`${iconStyle} text-gray-600`}>🔧</span>;
      case 'stack': return <span className={`${iconStyle} text-blue-600`}>💻</span>;
      case 'camera': return <span className={`${iconStyle} text-purple-600`}>📷</span>;
      case 'prop': return <span className={`${iconStyle} text-green-600`}>🔄</span>;
      case 'battery': return <span className={`${iconStyle} text-red-600`}>🔋</span>;
      case 'customWeight': return <span className={`${iconStyle} text-indigo-600`}>⚖️</span>;
      default: return <span className={`${iconStyle} text-gray-500`}>⚙️</span>;
    }
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
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-600 font-bold text-2xl">${comp.price}</div>
          {comp.vendor && (
            <div className="text-gray-600 text-lg">{comp.vendor}</div>
          )}
          {comp.inStock === false && (
            <div className="text-red-500 font-medium">Out of Stock</div>
          )}
        </div>
      );
    }

    if (comp.vendorPrices && comp.vendorPrices.length > 0) {
      return (
        <div className="space-y-3">
          {comp.vendorPrices.map((vendor, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-green-600 font-bold text-xl">${vendor.price}</div>
                  <div className="text-gray-600">{vendor.vendor}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendor.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {vendor.inStock ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-gray-500">Price not available</div>
      </div>
    );
  };

  const renderBrandInfo = () => {
    const comp = component as Motor & Frame & Stack & Camera & Prop & Battery & CustomWeight & {
      brand?: string;
      imageUrl?: string;
    };
    
    if (comp.brand) {
      return (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold">
            {comp.brand}
          </span>
          {comp.imageUrl && (
            <span className="text-lg text-gray-400">📷 Image Available</span>
          )}
        </div>
      );
    }

    return null;
  };

  const renderAllSpecs = () => {
    switch (type) {
      case 'motor':
        const motor = component as Motor;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 text-sm font-medium mb-1">KV Rating</div>
              <div className="text-gray-900 font-bold text-xl">{motor.kv}</div>
              <div className="text-orange-600 text-xs mt-1">Rotations per Volt</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-1">Stator Size</div>
              <div className="text-gray-900 font-bold text-xl">{motor.statorSize}</div>
              <div className="text-gray-600 text-xs mt-1">Motor Dimensions</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{motor.weight}</div>
              <div className="text-blue-600 text-xs mt-1">Grams</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Max Thrust</div>
              <div className="text-gray-900 font-bold text-xl">{motor.maxThrust}</div>
              <div className="text-green-600 text-xs mt-1">Force Output</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Voltage Range</div>
              <div className="text-gray-900 font-bold text-xl">{motor.voltageCompatibility}</div>
              <div className="text-purple-600 text-xs mt-1">Supported Voltage</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Shaft Diameter</div>
              <div className="text-gray-900 font-bold text-xl">{motor.shaftDiameter || 'N/A'}</div>
              <div className="text-yellow-600 text-xs mt-1">Prop Mount Size</div>
            </div>
          </div>
        );
      
      case 'frame':
        const frame = component as Frame;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-1">Type</div>
              <div className="text-gray-900 font-bold text-xl">{frame.type}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{frame.weight}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Wheelbase</div>
              <div className="text-gray-900 font-bold text-xl">{frame.wheelbase}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Propeller Size</div>
              <div className="text-gray-900 font-bold text-xl">{frame.propellerSizeCompatibility}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Material</div>
              <div className="text-gray-900 font-bold text-xl">{frame.material}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-indigo-600 text-sm font-medium mb-1">Stack Mounting</div>
              <div className="text-gray-900 font-bold text-xl">{frame.stackMounting || 'N/A'}</div>
            </div>
          </div>
        );
      
      case 'stack':
        const stack = component as Stack;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">FC Processor</div>
              <div className="text-gray-900 font-bold text-xl">{stack.fcProcessor}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-red-600 text-sm font-medium mb-1">ESC Current Rating</div>
              <div className="text-gray-900 font-bold text-xl">{stack.escCurrentRating}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-1">Mounting Size</div>
              <div className="text-gray-900 font-bold text-xl">{stack.mountingSize}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Gyro</div>
              <div className="text-gray-900 font-bold text-xl">{stack.gyro}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Voltage Input</div>
              <div className="text-gray-900 font-bold text-xl">{stack.voltageInput}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Bluetooth</div>
              <div className="text-gray-900 font-bold text-xl">{stack.bluetooth ? 'Yes' : 'No'}</div>
            </div>
          </div>
        );
      
      case 'camera':
        const camera = component as Camera;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Resolution</div>
              <div className="text-gray-900 font-bold text-xl">{camera.resolution}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{camera.weight}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Lens</div>
              <div className="text-gray-900 font-bold text-xl">{camera.lens}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Voltage Input</div>
              <div className="text-gray-900 font-bold text-xl">{camera.voltageInput}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-1">Type</div>
              <div className="text-gray-900 font-bold text-xl">{camera.type || 'N/A'}</div>
            </div>
          </div>
        );
      
      case 'prop':
        const prop = component as Prop;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Size</div>
              <div className="text-gray-900 font-bold text-xl">{prop.size}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Pitch</div>
              <div className="text-gray-900 font-bold text-xl">{prop.pitch}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Blades</div>
              <div className="text-gray-900 font-bold text-xl">{prop.blades}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{prop.weight}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 text-sm font-medium mb-1">Recommended Motor</div>
              <div className="text-gray-900 font-bold text-xl">{prop.recommendedMotorSize}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-gray-600 text-sm font-medium mb-1">Material</div>
              <div className="text-gray-900 font-bold text-xl">{prop.material || 'N/A'}</div>
            </div>
          </div>
        );
      
      case 'battery':
        const battery = component as Battery;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-red-600 text-sm font-medium mb-1">Capacity</div>
              <div className="text-gray-900 font-bold text-xl">{battery.capacity}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-1">Voltage</div>
              <div className="text-gray-900 font-bold text-xl">{battery.voltage}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-orange-600 text-sm font-medium mb-1">C-Rating</div>
              <div className="text-gray-900 font-bold text-xl">{battery.cRating}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{battery.weight}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">Connector</div>
              <div className="text-gray-900 font-bold text-xl">{battery.connector}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-1">Dimensions</div>
              <div className="text-gray-900 font-bold text-xl">{battery.dimensions || 'N/A'}</div>
            </div>
          </div>
        );
      
      case 'customWeight':
        const customWeight = component as CustomWeight;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="text-indigo-600 text-sm font-medium mb-1">Weight</div>
              <div className="text-gray-900 font-bold text-xl">{customWeight.weight}</div>
            </div>
            {customWeight.description && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="text-gray-600 text-sm font-medium mb-1">Description</div>
                <div className="text-gray-900 font-semibold text-lg">{customWeight.description}</div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        ...getInitialStyle()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-2xl max-w-3xl w-full max-h-[70vh] overflow-y-auto shadow-2xl border border-white/20 transform transition-all duration-500 ease-out animate-in zoom-in-95 fade-in"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          ...getInitialStyle()
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-white/30 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getTypeIcon()}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <div className="text-lg text-gray-600 capitalize">{type}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 6-12 12"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          {renderBrandInfo()}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Specifications - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Specifications</h3>
              {renderAllSpecs()}
            </div>

            {/* Pricing - Takes up 1 column */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Pricing</h3>
              {renderPriceInfo()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}