// Client-side content validation hook
'use client';

import React, { useState, useCallback } from 'react';
import { validateContent, validateMultipleFields } from '@/utils/profanityFilter';

export interface ValidationError {
  field: string;
  message: string;
}

export interface UseContentValidationOptions {
  allowMildProfanity?: boolean;
  blockHighSeverity?: boolean;
  validateOnChange?: boolean;
  showFilteredContent?: boolean;
}

export function useContentValidation(options: UseContentValidationOptions = {}) {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const {
    allowMildProfanity = false,
    blockHighSeverity = true,
    validateOnChange = true,
    showFilteredContent = false
  } = options;

  const validateField = useCallback((fieldName: string, value: string) => {
    if (!value || typeof value !== 'string') {
      // Remove any existing errors for this field
      setErrors(prev => prev.filter(error => error.field !== fieldName));
      return { isValid: true, filteredContent: value };
    }

    const result = validateContent(value, {
      allowMildProfanity,
      blockHighSeverity
    });

    if (!result.isValid) {
      const errorMessage = result.message || 'Content contains inappropriate language';
      
      setErrors(prev => {
        const filtered = prev.filter(error => error.field !== fieldName);
        return [...filtered, { field: fieldName, message: errorMessage }];
      });

      return {
        isValid: false,
        message: errorMessage,
        filteredContent: showFilteredContent ? result.filteredContent : undefined
      };
    } else {
      // Remove any existing errors for this field
      setErrors(prev => prev.filter(error => error.field !== fieldName));
      return {
        isValid: true,
        filteredContent: showFilteredContent ? result.filteredContent : value
      };
    }
  }, [allowMildProfanity, blockHighSeverity, showFilteredContent]);

  const validateFields = useCallback((fields: Record<string, string>) => {
    setIsValidating(true);
    
    const validation = validateMultipleFields(fields, {
      allowMildProfanity,
      blockHighSeverity
    });

    const newErrors: ValidationError[] = [];
    
    if (!validation.isValid) {
      validation.invalidFields.forEach(fieldName => {
        const message = validation.messages[fieldName] || 'Content contains inappropriate language';
        newErrors.push({ field: fieldName, message });
      });
    }

    setErrors(newErrors);
    setIsValidating(false);

    return {
      isValid: validation.isValid,
      errors: newErrors,
      invalidFields: validation.invalidFields
    };
  }, [allowMildProfanity, blockHighSeverity]);

  const clearErrors = useCallback((fieldName?: string) => {
    if (fieldName) {
      setErrors(prev => prev.filter(error => error.field !== fieldName));
    } else {
      setErrors([]);
    }
  }, []);

  const getFieldError = useCallback((fieldName: string) => {
    return errors.find(error => error.field === fieldName);
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasFieldError = useCallback((fieldName: string) => {
    return errors.some(error => error.field === fieldName);
  }, [errors]);

  return {
    validateField,
    validateFields,
    clearErrors,
    getFieldError,
    hasFieldError,
    errors,
    hasErrors,
    isValidating
  };
}

// Helper function for real-time input validation
export function createValidatedInputProps(
  fieldName: string,
  value: string,
  onChange: (value: string) => void,
  validation: ReturnType<typeof useContentValidation>,
  options: { validateOnChange?: boolean } = {}
) {
  const { validateOnChange = true } = options;
  const hasError = validation.hasFieldError(fieldName);
  const error = validation.getFieldError(fieldName);

  return {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      
      if (validateOnChange) {
        // Debounce validation to avoid too many calls
        setTimeout(() => {
          validation.validateField(fieldName, newValue);
        }, 300);
      }
    },
    onBlur: () => {
      validation.validateField(fieldName, value);
    },
    className: hasError 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    'aria-invalid': hasError,
    'aria-describedby': hasError ? `${fieldName}-error` : undefined,
    error: error?.message
  };
}