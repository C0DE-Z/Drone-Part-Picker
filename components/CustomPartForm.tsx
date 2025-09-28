'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useContentValidation } from '@/hooks/useContentValidation';
import { Upload, FileText, Eye, X, Loader2 } from 'lucide-react';

interface ComponentSpecs {
  [key: string]: string | number;
}

interface CustomPartFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    category?: string;
    specifications?: ComponentSpecs;
    isPublic?: boolean;
    modelFile?: string;
    modelFormat?: string;
  };
}

interface FileValidation {
  isValid: boolean;
  error?: string;
  size?: number;
  type?: string;
}

const CustomPartForm: React.FC<CustomPartFormProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialData 
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Motors',
    isPublic: initialData?.isPublic || false,
  });
  
  const [specs, setSpecs] = useState<ComponentSpecs>(initialData?.specifications || {});
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelPreview, setModelPreview] = useState<string | null>(initialData?.modelFile || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content validation
  const contentValidation = useContentValidation({
    allowMildProfanity: false,
    blockHighSeverity: true,
    validateOnChange: true
  });

  const categories = [
    'Motors', 'Frames', 'Stacks', 'Camera', 'Props', 'Batteries', 'Simple Weight', 'Antennas', 'Tools', 'Electronics', 'Other'
  ];

  const allowedFileTypes = React.useMemo(() => ['.stl', '.obj', '.gltf', '.glb', '.3mf', '.ply'], []);
  const maxFileSize = React.useMemo(() => 40 * 1024 * 1024, []); // 40MB

  const validateFile = useCallback((file: File): FileValidation => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedFileTypes.includes(extension)) {
      return {
        isValid: false,
        error: `Unsupported file type. Allowed types: ${allowedFileTypes.join(', ')}`
      };
    }
    
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`
      };
    }
    
    return {
      isValid: true,
      size: file.size,
      type: extension
    };
  }, [allowedFileTypes, maxFileSize]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setModelFile(file);
    
    // Create preview URL for supported formats
    if (['.gltf', '.glb'].includes(validation.type!)) {
      const url = URL.createObjectURL(file);
      setModelPreview(url);
    }
  }, [validateFile]);

  const removeFile = useCallback(() => {
    setModelFile(null);
    if (modelPreview && modelPreview.startsWith('blob:')) {
      URL.revokeObjectURL(modelPreview);
    }
    setModelPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [modelPreview]);

  const getSpecFields = (category: string) => {
    switch (category) {
      case 'Motors':
        return [
          { key: 'size', label: 'Size', type: 'text', placeholder: '2207', required: true },
          { key: 'kv', label: 'KV Rating', type: 'number', placeholder: '2750', required: true },
          { key: 'maxCurrent', label: 'Max Current (A)', type: 'number', placeholder: '28' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '32g', required: true },
          { key: 'shaft', label: 'Shaft Size', type: 'text', placeholder: '5mm' },
          { key: 'mountingHoles', label: 'Mounting Holes', type: 'text', placeholder: '16x16mm' },
          { key: 'magnetCount', label: 'Magnet Count', type: 'number', placeholder: '14' },
          { key: 'resistance', label: 'Resistance (mΩ)', type: 'number', placeholder: '65' },
        ];
      case 'Frames':
        return [
          { key: 'type', label: 'Type', type: 'select', options: ['Freestyle', 'Racing', 'Cinematic', 'Long Range', 'Micro', 'Hybrid'], required: true },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '95g (frame only)', required: true },
          { key: 'wheelbase', label: 'Wheelbase', type: 'text', placeholder: '220mm (5-inch)', required: true },
          { key: 'propellerSizeCompatibility', label: 'Prop Size', type: 'text', placeholder: '5-inch', required: true },
          { key: 'material', label: 'Material', type: 'select', options: ['3K Carbon Fiber', '6K Carbon Fiber', 'Aluminum', 'Titanium', 'Plastic', 'Mixed'], required: true },
          { key: 'armThickness', label: 'Arm Thickness', type: 'text', placeholder: '4mm' },
          { key: 'cameraMount', label: 'Camera Mount', type: 'select', options: ['Micro (19mm)', 'Mini (21mm)', 'Standard (28mm)', 'Custom', 'None'] },
          { key: 'stackMounting', label: 'Stack Mounting', type: 'text', placeholder: '30.5x30.5mm' },
          { key: 'topPlateThickness', label: 'Top Plate Thickness', type: 'text', placeholder: '2mm' },
          { key: 'bottomPlateThickness', label: 'Bottom Plate Thickness', type: 'text', placeholder: '2mm' },
        ];
      case 'Stacks':
        return [
          { key: 'type', label: 'Type', type: 'select', options: ['FC + 4-in-1 ESC', 'FC Only', 'ESC Only', 'AIO (All-in-One)'], required: true },
          { key: 'fcProcessor', label: 'FC Processor', type: 'select', options: ['STM32F722', 'STM32F405', 'STM32F411', 'STM32H743', 'Other'] },
          { key: 'escCurrentRating', label: 'ESC Current', type: 'text', placeholder: '45A (Burst 50A)', required: true },
          { key: 'mountingSize', label: 'Mounting Size', type: 'select', options: ['20x20mm', '30.5x30.5mm', '25.5x25.5mm', 'Custom'], required: true },
          { key: 'gyro', label: 'Gyro', type: 'select', options: ['MPU6000', 'ICM20602', 'ICM42688', 'BMI270', 'Other'] },
          { key: 'osd', label: 'OSD', type: 'select', options: ['Betaflight OSD', 'Analog OSD', 'None'] },
          { key: 'voltageInput', label: 'Voltage Input', type: 'text', placeholder: '2-6S LiPo', required: true },
          { key: 'firmware', label: 'Firmware', type: 'select', options: ['Betaflight', 'iNav', 'ArduPilot', 'KISS', 'Other'] },
        ];
      case 'Camera':
        return [
          { key: 'type', label: 'Type', type: 'select', options: ['FPV Camera', 'HD Recording', 'Action Camera', 'Hybrid'], required: true },
          { key: 'sensorSize', label: 'Sensor Size', type: 'text', placeholder: '1/2.8 inch' },
          { key: 'resolution', label: 'Resolution', type: 'text', placeholder: '1000TVL' },
          { key: 'aspectRatio', label: 'Aspect Ratio', type: 'select', options: ['4:3', '16:9', '4:3 / 16:9 Switchable'] },
          { key: 'lens', label: 'Lens', type: 'text', placeholder: '2.1mm' },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '8.5g', required: true },
          { key: 'voltageInput', label: 'Voltage Input', type: 'text', placeholder: 'DC 5-36V' },
          { key: 'minIllumination', label: 'Min Illumination', type: 'text', placeholder: '0.001Lux@F1.2' },
          { key: 'format', label: 'Video Format', type: 'select', options: ['NTSC', 'PAL', 'NTSC/PAL'] },
        ];
      case 'Props':
        return [
          { key: 'size', label: 'Size', type: 'text', placeholder: '5 inch', required: true },
          { key: 'pitch', label: 'Pitch', type: 'text', placeholder: '4.3 inch', required: true },
          { key: 'blades', label: 'Blades', type: 'select', options: ['2', '3', '4', '5', '6'], required: true },
          { key: 'material', label: 'Material', type: 'select', options: ['Polycarbonate', 'ABS', 'Nylon', 'Carbon Fiber', 'Glass Filled Nylon'], required: true },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '3.8g (per prop)', required: true },
          { key: 'hubID', label: 'Hub ID', type: 'text', placeholder: '5mm' },
          { key: 'recommendedMotorSize', label: 'Recommended Motor', type: 'text', placeholder: '2207, 2306' },
          { key: 'style', label: 'Style', type: 'select', options: ['Standard', 'Racing', 'Freestyle', 'Long Range', 'Quiet'] },
        ];
      case 'Batteries':
        return [
          { key: 'capacity', label: 'Capacity', type: 'text', placeholder: '1300mAh', required: true },
          { key: 'voltage', label: 'Voltage', type: 'select', options: ['1S (3.7V)', '2S (7.4V)', '3S (11.1V)', '4S (14.8V)', '5S (18.5V)', '6S (22.2V)'], required: true },
          { key: 'cRating', label: 'C Rating', type: 'text', placeholder: '95C', required: true },
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '165g', required: true },
          { key: 'connector', label: 'Connector', type: 'select', options: ['XT60', 'XT30', 'XT90', 'Deans', 'JST', 'Other'] },
          { key: 'dimensions', label: 'Dimensions', type: 'text', placeholder: '70x35x30mm' },
          { key: 'chemistry', label: 'Chemistry', type: 'select', options: ['LiPo', 'Li-Ion', 'LiFe', 'LiHV'] },
          { key: 'maxChargeRate', label: 'Max Charge Rate', type: 'text', placeholder: '5C' },
        ];
      case 'Simple Weight':
        return [
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '50g', required: true },
          { key: 'description', label: 'Description', type: 'text', placeholder: 'Custom part, antenna, etc.' },
        ];
      default:
        return [
          { key: 'weight', label: 'Weight', type: 'text', placeholder: '10g' },
          { key: 'description', label: 'Description', type: 'text', placeholder: 'Additional information' },
        ];
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (typeof value === 'string' && field !== 'category') {
      contentValidation.validateField(field, value);
    }
  };

  const handleSpecChange = (key: string, value: string | number) => {
    setSpecs(prev => ({ ...prev, [key]: value }));
    
    if (typeof value === 'string') {
      contentValidation.validateField(`spec_${key}`, value);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', '3d-model');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', '/api/parts/3d-model');
      xhr.send(formData);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a part name');
      return;
    }

    // Validate required specs
    const specFields = getSpecFields(formData.category);
    const requiredSpecs = specFields.filter(field => field.required);
    const missingSpecs = requiredSpecs.filter(field => !specs[field.key]);
    
    if (missingSpecs.length > 0) {
      alert(`Please fill in required fields: ${missingSpecs.map(s => s.label).join(', ')}`);
      return;
    }

    // Content validation
    const fieldsToValidate: Record<string, string> = {
      name: formData.name,
      category: formData.category
    };
    
    if (formData.description) {
      fieldsToValidate.description = formData.description;
    }

    Object.entries(specs).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fieldsToValidate[`spec_${key}`] = value;
      }
    });

    const validation = contentValidation.validateFields(fieldsToValidate);
    
    if (!validation.isValid) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      let modelFileUrl = null;
      let modelFormat = null;

      // Upload 3D model if provided
      if (modelFile) {
        setUploadProgress(0);
        modelFileUrl = await uploadFile(modelFile);
        modelFormat = '.' + modelFile.name.split('.').pop()?.toLowerCase();
      }

      // Create/update part
      const partData = {
        ...formData,
        specifications: specs,
        modelFile: modelFileUrl,
        modelFormat: modelFormat
      };

      const url = initialData?.id ? `/api/parts/custom/${initialData.id}` : '/api/parts/custom';
      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(partData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save part');
      }

      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'Motors',
        isPublic: false,
      });
      setSpecs({});
      removeFile();
      contentValidation.clearErrors();
      
    } catch (error) {
      console.error('Error saving part:', error);
      alert(error instanceof Error ? error.message : 'Failed to save part. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData?.id ? 'Edit Custom Part' : 'Create Custom Part'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(95vh-80px)]">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter part name"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                      contentValidation.hasFieldError('name')
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    required
                  />
                  {contentValidation.hasFieldError('name') && (
                    <p className="text-sm text-red-600">
                      {contentValidation.getFieldError('name')?.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      setSpecs({}); // Reset specs when category changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your custom part..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors resize-none ${
                    contentValidation.hasFieldError('description')
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {contentValidation.hasFieldError('description') && (
                  <p className="text-sm text-red-600">
                    {contentValidation.getFieldError('description')?.message}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Maximum 500 characters
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this part public (visible to all users)
                </label>
              </div>
            </div>

            {/* 3D Model Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">3D Model (Optional)</h3>
              
              {!modelFile && !modelPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">Upload 3D Model</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop or click to select a 3D model file
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: {allowedFileTypes.join(', ')} • Max size: 40MB
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {modelFile?.name || 'Existing Model'}
                      </span>
                      {modelFile && (
                        <span className="text-xs text-gray-500">
                          ({(modelFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Replace File
                    </button>
                    {modelPreview && (
                      <button
                        type="button"
                        className="text-sm text-gray-600 hover:text-gray-700 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedFileTypes.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSpecFields(formData.category).map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={specs[field.key] || ''}
                        onChange={(e) => handleSpecChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={specs[field.key] || ''}
                        onChange={(e) => {
                          const value = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                          handleSpecChange(field.key, value);
                        }}
                        placeholder={field.placeholder}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                          contentValidation.hasFieldError(`spec_${field.key}`)
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        required={field.required}
                      />
                    )}
                    
                    {contentValidation.hasFieldError(`spec_${field.key}`) && (
                      <p className="text-sm text-red-600">
                        {contentValidation.getFieldError(`spec_${field.key}`)?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Errors Summary */}
            {contentValidation.hasErrors && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-800">
                  <strong>Please fix the following issues:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {contentValidation.errors.map((error, index) => (
                      <li key={index}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{initialData?.id ? 'Update Part' : 'Create Part'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomPartForm;