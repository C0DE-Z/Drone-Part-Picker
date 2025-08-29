import React, { useState } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  const getCardColor = () => {
    if (isSelected) return 'border-black bg-gray-50 ring-2 ring-gray-200 shadow-lg scale-105';
    if (!isCompatible) return 'border-gray-300 bg-gray-100 opacity-60';
    return 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-lg hover:scale-102';
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
        const basicSpecs = [
          { label: 'KV', value: motor.kv },
          { label: 'Stator', value: motor.statorSize },
          { label: 'Weight', value: motor.weight },
          { label: 'Thrust', value: motor.maxThrust }
        ];
        const detailedSpecs = [
          { label: 'Voltage', value: motor.voltageCompatibility },
          { label: 'Shaft Diameter', value: motor.shaftDiameter || 'N/A' }
        ];
        return renderSpecList(basicSpecs, detailedSpecs);
      
      case 'frame':
        const frame = component as Frame;
        const frameBasic = [
          { label: 'Type', value: frame.type },
          { label: 'Weight', value: frame.weight },
          { label: 'Wheelbase', value: frame.wheelbase },
          { label: 'Props', value: frame.propellerSizeCompatibility }
        ];
        const frameDetailed = [
          { label: 'Material', value: frame.material },
          { label: 'Stack Mount', value: frame.stackMounting || 'N/A' }
        ];
        return renderSpecList(frameBasic, frameDetailed);
      
      case 'stack':
        const stack = component as Stack;
        const stackBasic = [
          { label: 'Processor', value: stack.fcProcessor },
          { label: 'ESC', value: stack.escCurrentRating },
          { label: 'Mounting', value: stack.mountingSize },
          { label: 'Gyro', value: stack.gyro }
        ];
        const stackDetailed = [
          { label: 'Voltage', value: stack.voltageInput },
          { label: 'Bluetooth', value: stack.bluetooth ? 'Yes' : 'No' }
        ];
        return renderSpecList(stackBasic, stackDetailed);
      
      case 'camera':
        const camera = component as Camera;
        const cameraBasic = [
          { label: 'Resolution', value: camera.resolution },
          { label: 'Weight', value: camera.weight },
          { label: 'Lens', value: camera.lens },
          { label: 'Voltage', value: camera.voltageInput }
        ];
        const cameraDetailed = [
          { label: 'Type', value: camera.type || 'N/A' }
        ];
        return renderSpecList(cameraBasic, cameraDetailed);
      
      case 'prop':
        const prop = component as Prop;
        const propBasic = [
          { label: 'Size', value: prop.size },
          { label: 'Pitch', value: prop.pitch },
          { label: 'Blades', value: prop.blades },
          { label: 'Weight', value: prop.weight }
        ];
        const propDetailed = [
          { label: 'Motor', value: prop.recommendedMotorSize },
          { label: 'Material', value: prop.material || 'N/A' }
        ];
        return renderSpecList(propBasic, propDetailed);
      
      case 'battery':
        const battery = component as Battery;
        const batteryBasic = [
          { label: 'Capacity', value: battery.capacity },
          { label: 'Voltage', value: battery.voltage },
          { label: 'C-Rating', value: battery.cRating },
          { label: 'Weight', value: battery.weight }
        ];
        const batteryDetailed = [
          { label: 'Connector', value: battery.connector },
          { label: 'Dimensions', value: battery.dimensions || 'N/A' }
        ];
        return renderSpecList(batteryBasic, batteryDetailed);
      
      case 'customWeight':
        const customWeight = component as CustomWeight;
        return (
          <div className="space-y-2 text-xs text-gray-700">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600 truncate">Weight:</span> 
              <span className="font-semibold text-gray-900 text-right ml-2 truncate">{customWeight.weight}</span>
            </div>
            {customWeight.description && (
              <div className="text-gray-600 text-xs mt-2 break-words">{customWeight.description}</div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderSpecList = (basicSpecs: { label: string; value: string | number }[], detailedSpecs: { label: string; value: string | number }[]) => {
    const displaySpecs = isExpanded ? [...basicSpecs, ...detailedSpecs] : basicSpecs;
    
    return (
      <div className="space-y-2 text-xs text-gray-700">
        {displaySpecs.map((spec) => (
          <div key={spec.label} className="flex justify-between items-center">
            <span className="font-medium text-gray-600 truncate">{spec.label}:</span> 
            <span className="font-semibold text-gray-900 text-right ml-2 truncate">{spec.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`relative p-5 rounded-xl border cursor-pointer transition-all duration-300 ease-out h-full transform hover:-translate-y-1 active:scale-95 ${getCardColor()}`}
      onClick={handleCardClick}
    >
      {!isCompatible && (
        <div className="absolute top-3 right-3 text-red-500 text-lg animate-pulse">⚠️</div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="text-3xl opacity-70 transition-transform duration-300 hover:scale-110">{getTypeIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-900 leading-tight transition-colors duration-200 hover:text-black pr-2">{name}</h3>
            {type !== 'customWeight' && (
              <button
                onClick={handleExpandClick}
                className="ml-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200 group flex-shrink-0"
                title={isExpanded ? 'Show less details' : 'Show more details'}
              >
                <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                  {isExpanded ? (
                    // Collapse icon (minimize)
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                    </svg>
                  ) : (
                    // Expand icon (maximize)
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                  )}
                </div>
              </button>
            )}
          </div>
          {renderSpecs()}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full animate-pulse"></div>
      )}
    </div>
  );
}
