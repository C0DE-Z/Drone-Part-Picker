import React, { useState } from 'react';
import { SelectedComponents } from '@/types/drone';
import TagInput from './TagInput';

interface BuildSummaryProps {
  selectedComponents: SelectedComponents;
  onClearBuild: () => void;
  onSaveBuild: (buildName: string, description: string, isPublic: boolean, tags: string[]) => void;
}

export default function BuildSummary({ selectedComponents, onClearBuild, onSaveBuild }: BuildSummaryProps) {
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [description, setDescription] = useState('');
  
  const componentCount = Object.keys(selectedComponents).filter(key => selectedComponents[key as keyof SelectedComponents]).length;
  
  const isComplete = componentCount >= 4;

  const handleSave = () => {
    if (!buildName.trim()) {
      alert('Please enter a build name');
      return;
    }
    onSaveBuild(buildName.trim(), description.trim(), isPublic, tags);
    setShowSaveOptions(false);
    setTags([]);
    setIsPublic(false);
    setBuildName('');
    setDescription('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 w-full h-fit">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-black">Build Summary</h2>
        <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
          {componentCount}/6 components
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {selectedComponents.motor && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">⚡</span>
                <span className="font-semibold text-black text-sm sm:text-base">Motor</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.motor.name}</span>
          </div>
        )}

        {selectedComponents.frame && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">🔧</span>
                <span className="font-semibold text-black text-sm sm:text-base">Frame</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.frame.name}</span>
          </div>
        )}

        {selectedComponents.stack && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">💻</span>
                <span className="font-semibold text-black text-sm sm:text-base">Flight Controller</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.stack.name}</span>
          </div>
        )}

        {selectedComponents.camera && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">📹</span>
                <span className="font-semibold text-black text-sm sm:text-base">Camera</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.camera.name}</span>
          </div>
        )}

        {selectedComponents.prop && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">🌀</span>
                <span className="font-semibold text-black text-sm sm:text-base">Propeller</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.prop.name}</span>
          </div>
        )}

        {selectedComponents.battery && (
          <div className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-base sm:text-lg">🔋</span>
                <span className="font-semibold text-black text-sm sm:text-base">Battery</span>
              </div>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{selectedComponents.battery.name}</span>
          </div>
        )}

        {selectedComponents.customWeights && selectedComponents.customWeights.length > 0 && (
          <div className="space-y-2">
            {selectedComponents.customWeights.map((weight, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                    <span className="text-base sm:text-lg">⚖️</span>
                    <span className="font-semibold text-black text-sm sm:text-base">Weight</span>
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-gray-600 font-medium break-words whitespace-normal w-full">{weight.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {componentCount === 0 && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-gray-600 font-medium text-sm sm:text-base">Start building your drone by selecting components above!</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full">
        <button
          onClick={onClearBuild}
          disabled={componentCount === 0}
          className="w-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Clear Build
        </button>
        <button
          onClick={() => setShowSaveOptions(!showSaveOptions)}
          disabled={!isComplete}
          className="w-full px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-black hover:bg-gray-800 border border-transparent rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isComplete ? 'Save Build' : 'Need More Parts'}
        </button>
      </div>

      {/* Save Options Panel */}
      {showSaveOptions && isComplete && (
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
          <div className="space-y-3 sm:space-y-4">
            {/* Build Name Input */}
            <div>
              <label htmlFor="buildName" className="text-xs sm:text-sm font-medium text-gray-900 mb-2 block">
                Build Name *
              </label>
              <input
                type="text"
                id="buildName"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="Enter a catchy name for your build..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">Give your build a unique name that others will remember</p>
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="text-sm font-medium text-gray-900 mb-2 block">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell the community about your build, its purpose, flight characteristics..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">Share what makes this build special ({description.length}/300)</p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="isPublic" className="text-sm font-medium text-gray-900">
                  Make Public
                </label>
                <p className="text-xs text-gray-500">Share this build with the community</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isPublic ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Tags Input */}
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Tags (optional)
              </label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="Add tags like 'racing', 'freestyle'..."
                maxTags={5}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Save Build
            </button>
          </div>
        </div>
      )}

      {!isComplete && componentCount > 0 && (
        <p className="text-xs text-gray-500 mt-4 text-center font-medium">
          Add at least a motor, frame, flight controller, and battery to save your build
        </p>
      )}
    </div>
  );
}
