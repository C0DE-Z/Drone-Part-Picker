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
      alert('Give your build a name first!');
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
  <div className="h-fit w-full rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-sm sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Build Summary</h2>
        <div className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
          {componentCount}/6 picked
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {selectedComponents.motor && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Motor</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.motor.name}</span>
          </div>
        )}

        {selectedComponents.frame && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Frame</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.frame.name}</span>
          </div>
        )}

        {selectedComponents.stack && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Flight Controller</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.stack.name}</span>
          </div>
        )}

        {selectedComponents.camera && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Camera</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.camera.name}</span>
          </div>
        )}

        {selectedComponents.prop && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Propeller</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.prop.name}</span>
          </div>
        )}

        {selectedComponents.battery && (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                <span className="text-sm font-semibold text-slate-900 sm:text-base">Battery</span>
              </div>
            </div>
            <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{selectedComponents.battery.name}</span>
          </div>
        )}

        {selectedComponents.customWeights && selectedComponents.customWeights.length > 0 && (
          <div className="space-y-2">
            {selectedComponents.customWeights.map((weight, index) => (
              <div key={index} className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-900 sm:text-base">Weight</span>
                  </div>
                </div>
                <span className="w-full break-words whitespace-normal text-xs font-medium text-slate-600 sm:text-sm">{weight.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {componentCount === 0 && (
        <div className="text-center py-8 sm:py-12">
          <p className="text-sm font-medium text-slate-600 sm:text-base">Start building your drone by selecting components above.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 w-full">
        <button
          onClick={onClearBuild}
          disabled={componentCount === 0}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3 sm:text-sm"
        >
          Clear Build
        </button>
        <button
          onClick={() => setShowSaveOptions(!showSaveOptions)}
          disabled={!isComplete}
          className="w-full rounded-xl border border-transparent bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3 sm:text-sm"
        >
          {isComplete ? 'Save Build' : 'Add Required Parts'}
        </button>
      </div>

      {/* Save Options Panel */}
      {showSaveOptions && isComplete && (
  <div className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:mt-4 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="buildName" className="mb-2 block text-xs font-medium text-slate-900 sm:text-sm">
                Build name *
              </label>
              <input
                type="text"
                id="buildName"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                placeholder="Example: 5-inch Freestyle v2"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                maxLength={50}
              />
              <p className="mt-1 text-xs text-slate-500">Use a descriptive name for easy comparison later.</p>
            </div>

            {/* Description Input */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-900">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Purpose, expected flying style, and notes about the setup"
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                rows={3}
                maxLength={300}
              />
              <p className="mt-1 text-xs text-slate-500">{description.length}/300 characters</p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="isPublic" className="text-sm font-medium text-slate-900">
                  Public visibility
                </label>
                <p className="text-xs text-slate-500">Allow other users to discover and clone this build.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-100 ${
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

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-900">
                Tags
              </label>
              <TagInput
                tags={tags}
                onChange={setTags}
                placeholder="racing, freestyle, beginner..."
                maxTags={5}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
            >
              Save Build
            </button>
          </div>
        </div>
      )}

      {!isComplete && componentCount > 0 && (
        <p className="mt-4 text-center text-xs font-medium text-slate-500">
          Select at least a motor, frame, flight controller, and battery before saving.
        </p>
      )}
    </div>
  );
}
