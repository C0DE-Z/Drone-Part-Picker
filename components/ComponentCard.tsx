import React from 'react';
import { Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';

interface ComponentCardProps {
  name: string;
  component: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;
  type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight';
  isSelected: boolean;
  onSelect: () => void;
  isCompatible?: boolean;
}

export default function ComponentCard({ 
  name, 
  component, 
  type, 
  isSelected, 
  onSelect,
  isCompatible = true 
}: ComponentCardProps) {
  const getCardColor = () => {
    if (isSelected) return 'border-black bg-gray-50 ring-2 ring-gray-200 shadow-md';
    if (!isCompatible) return 'border-gray-300 bg-gray-100 opacity-60';
    return 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm';
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'motor': return '⚡';
      case 'frame': return '🔧';
      case 'stack': return '💻';
      case 'camera': return '📹';
      case 'prop': return '🌀';
      case 'battery': return '🔋';
      case 'customWeight': return '⚖️';
      default: return '⚙️';
    }
  };

  const renderSpecs = () => {
    switch (type) {
      case 'motor':
        const motor = component as Motor;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">KV:</span> <span className="font-semibold text-gray-900 text-right ml-2">{motor.kv}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Stator:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{motor.statorSize}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{motor.weight}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Thrust:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate text-xs">{motor.maxThrust}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Voltage:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate text-xs">{motor.voltageCompatibility}</span></div>
          </div>
        );
      
      case 'frame':
        const frame = component as Frame;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Type:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{frame.type}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{frame.weight}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Wheelbase:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{frame.wheelbase}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Props:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{frame.propellerSizeCompatibility}</span></div>
            <div className="truncate"><span className="font-medium text-gray-500">Material:</span> <span className="font-semibold text-gray-900 ml-1">{frame.material}</span></div>
          </div>
        );
      
      case 'stack':
        const stack = component as Stack;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Processor:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{stack.fcProcessor}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">ESC:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{stack.escCurrentRating}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Mounting:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{stack.mountingSize}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Gyro:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{stack.gyro}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Voltage:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{stack.voltageInput}</span></div>
          </div>
        );
      
      case 'camera':
        const camera = component as Camera;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Resolution:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{camera.resolution}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{camera.weight}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Lens:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{camera.lens}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Voltage:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{camera.voltageInput}</span></div>
            {camera.type && <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Type:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{camera.type}</span></div>}
          </div>
        );
      
      case 'prop':
        const prop = component as Prop;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Size:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{prop.size}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Pitch:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{prop.pitch}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Blades:</span> <span className="font-semibold text-gray-900 text-right ml-2">{prop.blades}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{prop.weight}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Motor:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate text-xs">{prop.recommendedMotorSize}</span></div>
          </div>
        );
      
      case 'battery':
        const battery = component as Battery;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Capacity:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{battery.capacity}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Voltage:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{battery.voltage}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">C-Rating:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{battery.cRating}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{battery.weight}</span></div>
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Connector:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{battery.connector}</span></div>
          </div>
        );
      
      case 'customWeight':
        const customWeight = component as CustomWeight;
        return (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between items-center"><span className="font-medium text-gray-500 truncate">Weight:</span> <span className="font-semibold text-gray-900 text-right ml-2 truncate">{customWeight.weight}</span></div>
            {customWeight.description && <div className="text-gray-500 text-xs mt-2 truncate">{customWeight.description}</div>}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-200 ${getCardColor()}`}
      onClick={onSelect}
    >
      {!isCompatible && (
        <div className="absolute top-3 right-3 text-red-500 text-lg">⚠️</div>
      )}
      
      <div className="flex items-start gap-3">
        <div className="text-2xl opacity-70">{getTypeIcon()}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 mb-3 truncate">{name}</h3>
          {renderSpecs()}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full"></div>
      )}
    </div>
  );
}
