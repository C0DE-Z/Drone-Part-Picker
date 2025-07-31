'use client';

import React, { useState, KeyboardEvent } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export default function TagInput({ 
  tags, 
  onChange, 
  placeholder = 'Add tags...',
  maxTags = 10,
  className = ''
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChange([...tags, tag]);
      setInputValue('');
    }
  };

  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-blue-600 hover:text-blue-800 ml-1"
            >
              ×
            </button>
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
          disabled={tags.length >= maxTags}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <div>Press Enter or comma to add tags</div>
        <div>{tags.length}/{maxTags} tags</div>
      </div>
      
      {/* Popular tags suggestions */}
      <div className="mt-2 flex flex-wrap gap-1">
        <span className="text-xs text-gray-500 mr-2">Popular:</span>
        {['racing', 'freestyle', '5inch', 'fpv', 'mini', 'cinematic'].map((suggestedTag) => (
          !tags.includes(suggestedTag) && tags.length < maxTags && (
            <button
              key={suggestedTag}
              type="button"
              onClick={() => {
                onChange([...tags, suggestedTag]);
              }}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
            >
              #{suggestedTag}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
