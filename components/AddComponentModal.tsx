'use client';

import React, { useState, useEffect } from 'react';
import { useContentValidation } from '@/hooks/useContentValidation';

interface ComponentSpecs {
  [key: string]: string | number;
}

interface CustomPart {
  id: string;
  name: string;
  category: string;
  specifications: ComponentSpecs;
  public: boolean;
  creator: {
    username: string;
  };
  createdAt: string;
}

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (category: string, name: string, specs: ComponentSpecs) => void;
}

const AddComponentModal: React.FC<AddComponentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [category, setCategory] = useState('Motors');
  const [name, setName] = useState('');
  const [specs, setSpecs] = useState<ComponentSpecs>({});
  const [communityParts, setCommunityParts] = useState<CustomPart[]>([]);
  const [showCommunityParts, setShowCommunityParts] = useState(true);
  const [loadingCommunityParts, setLoadingCommunityParts] = useState(false);
  
  // Content validation
  const contentValidation = useContentValidation({
    allowMildProfanity: false,
    blockHighSeverity: true,
    validateOnChange: true
  });

  const categories = ['Motors', 'Frames', 'Stacks', 'Camera', 'Props', 'Batteries', 'Simple Weight'];

  const loadCommunityParts = async () => {
    setLoadingCommunityParts(true);
    try {
      const response = await fetch('/api/parts/custom?public=true');
      if (response.ok) {
        const data = await response.json();
        setCommunityParts(data.customParts || []);
      }
    } catch (error) {
      console.error('Error loading community parts:', error);
    } finally {
      setLoadingCommunityParts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCommunityParts();
    }
  }, [isOpen]);

  const getSpecFields = (category: string) => {
    switch (category) {
      case 'Simple Weight':
        return [
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '50g' },
          { key: 'description', label: 'Description (optional)', type: 'text', placeholder: 'Custom part, antenna, etc.' },
        ];
      case 'Motors':
        return [
          { key: 'size', label: 'Size', type: 'text', placeholder: '2207' },
          { key: 'kv', label: 'KV Rating', type: 'number', placeholder: '2750' },
          { key: 'maxCurrent', label: 'Max Current (A)', type: 'number', placeholder: '28' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '32g' },
          { key: 'shaft', label: 'Shaft Size', type: 'text', placeholder: '5mm' },
          { key: 'mountingHoles', label: 'Mounting Holes', type: 'text', placeholder: '16x16mm' },
        ];
      case 'Frames':
        return [
          { key: 'type', label: 'Type', type: 'text', placeholder: 'Freestyle' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '95g (frame only)' },
          { key: 'wheelbase', label: 'Wheelbase', type: 'text', placeholder: '220mm (5-inch)' },
          { key: 'propellerSizeCompatibility', label: 'Prop Size', type: 'text', placeholder: '5-inch' },
          { key: 'material', label: 'Material', type: 'text', placeholder: '3K Carbon Fiber' },
          { key: 'armThickness', label: 'Arm Thickness', type: 'text', placeholder: '4mm' },
          { key: 'cameraMount', label: 'Camera Mount', type: 'text', placeholder: 'Micro (19mm)' },
          { key: 'stackMounting', label: 'Stack Mounting', type: 'text', placeholder: '30.5x30.5mm' },
        ];
      case 'Stacks':
        return [
          { key: 'type', label: 'Type', type: 'text', placeholder: 'FC + 4-in-1 ESC' },
          { key: 'fcProcessor', label: 'FC Processor', type: 'text', placeholder: 'STM32F722' },
          { key: 'escCurrentRating', label: 'ESC Current', type: 'text', placeholder: '45A (Burst 50A)' },
          { key: 'mountingSize', label: 'Mounting Size', type: 'text', placeholder: '30.5x30.5mm' },
          { key: 'gyro', label: 'Gyro', type: 'text', placeholder: 'MPU6000' },
          { key: 'osd', label: 'OSD', type: 'text', placeholder: 'Betaflight OSD' },
          { key: 'voltageInput', label: 'Voltage Input', type: 'text', placeholder: '2-6S LiPo' },
        ];
      case 'Camera':
        return [
          { key: 'sensorSize', label: 'Sensor Size', type: 'text', placeholder: '1/2.8 inch' },
          { key: 'resolution', label: 'Resolution', type: 'text', placeholder: '1000TVL' },
          { key: 'aspectRatio', label: 'Aspect Ratio', type: 'text', placeholder: '4:3 / 16:9 Switchable' },
          { key: 'lens', label: 'Lens', type: 'text', placeholder: '2.1mm' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '8.5g' },
          { key: 'voltageInput', label: 'Voltage Input', type: 'text', placeholder: 'DC 5-36V' },
          { key: 'minIllumination', label: 'Min Illumination', type: 'text', placeholder: '0.001Lux@F1.2' },
        ];
      case 'Props':
        return [
          { key: 'size', label: 'Size', type: 'text', placeholder: '5 inch' },
          { key: 'pitch', label: 'Pitch', type: 'text', placeholder: '4.3 inch' },
          { key: 'blades', label: 'Blades', type: 'number', placeholder: '3' },
          { key: 'material', label: 'Material', type: 'text', placeholder: 'Polycarbonate' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '3.8g (per prop)' },
          { key: 'hubID', label: 'Hub ID', type: 'text', placeholder: '5mm' },
          { key: 'recommendedMotorSize', label: 'Recommended Motor', type: 'text', placeholder: '2207, 2306' },
        ];
      case 'Batteries':
        return [
          { key: 'capacity', label: 'Capacity', type: 'text', placeholder: '1300mAh' },
          { key: 'voltage', label: 'Voltage', type: 'text', placeholder: '4S (14.8V)' },
          { key: 'cRating', label: 'C Rating', type: 'text', placeholder: '95C' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '165g' },
          { key: 'connector', label: 'Connector', type: 'text', placeholder: 'XT60' },
          { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '70x35x30mm' },
        ];
      default:
        return [];
    }
  };

  const handleSpecChange = (key: string, value: string) => {
    setSpecs((prev: ComponentSpecs) => ({ ...prev, [key]: value }));
  };

  const handleUseCommunityPart = (part: CustomPart) => {
    setCategory(part.category);
    setName(part.name);
    setSpecs(part.specifications);
    setShowCommunityParts(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Validate content before submission
    const fieldsToValidate: Record<string, string> = {
      name,
      category
    };
    
    // Add specifications to validation
    Object.entries(specs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fieldsToValidate[`spec_${key}`] = value;
      }
    });
    
    const validation = contentValidation.validateFields(fieldsToValidate);
    
    if (!validation.isValid) {
      // Errors are already set in the validation hook
      return;
    }
    
    onAdd(category, name, specs);
    setName('');
    setSpecs({});
    contentValidation.clearErrors();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Add Custom Component</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-150"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {showCommunityParts && (
            <div className="space-y-4 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Community Parts</h3>
                <button
                  type="button"
                  onClick={() => setShowCommunityParts(!showCommunityParts)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              
              {loadingCommunityParts ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : communityParts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {communityParts.slice(0, 10).map((part) => (
                    <div
                      key={part.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-all duration-150"
                      onClick={() => handleUseCommunityPart(part)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{part.name}</h4>
                          <p className="text-xs text-gray-500">{part.category}</p>
                          <p className="text-xs text-gray-400">by @{part.creator.username}</p>
                        </div>
                        <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No community parts available</p>
              )}
            </div>
          )}

          {!showCommunityParts && (
            <button
              type="button"
              onClick={() => setShowCommunityParts(true)}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-2"
            >
              Show Community Parts
            </button>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSpecs({});
              }}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-150"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Component Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                contentValidation.validateField('name', e.target.value);
              }}
              onBlur={() => contentValidation.validateField('name', name)}
              placeholder="Enter component name"
              className={`w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 transition-all duration-150 ${
                contentValidation.hasFieldError('name')
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
              }`}
              required
            />
            {contentValidation.hasFieldError('name') && (
              <p className="text-sm text-red-600" id="name-error">
                {contentValidation.getFieldError('name')?.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getSpecFields(category).map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={specs[field.key] || ''}
                    onChange={(e) => {
                      handleSpecChange(field.key, e.target.value);
                      if (field.type === 'text') {
                        contentValidation.validateField(`spec_${field.key}`, e.target.value);
                      }
                    }}
                    onBlur={() => {
                      if (field.type === 'text') {
                        contentValidation.validateField(`spec_${field.key}`, specs[field.key] as string || '');
                      }
                    }}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 transition-all duration-150 ${
                      contentValidation.hasFieldError(`spec_${field.key}`)
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-gray-500 focus:ring-gray-500'
                    }`}
                  />
                  {contentValidation.hasFieldError(`spec_${field.key}`) && (
                    <p className="text-sm text-red-600" id={`spec-${field.key}-error`}>
                      {contentValidation.getFieldError(`spec_${field.key}`)?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {contentValidation.hasErrors && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <strong>Please fix the following issues:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {contentValidation.errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
        className="px-6 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all duration-150 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-150 font-medium"
            >
              Add Component
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddComponentModal;
