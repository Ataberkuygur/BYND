import { useState, useCallback, useRef } from 'react';
import { ErrorHandler, RetryHandler, globalLoadingManager } from '../utils/errorHandler';

/**
 * Custom hook for handling errors, loading states, and retries
 * @param {string} operationKey - Unique key for this operation
 */
export const useErrorHandler = (operationKey = 'default') => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const retryFunctionRef = useRef(null);
  
  /**
   * Execute an async operation with error handling and loading state
   * @param {Function} operation - The async operation to execute
   * @param {Object} options - Options for error handling
   */
  const executeWithErrorHandling = useCallback(async (operation, options = {}) => {
    const {
      showErrorAlert = true,
      context = 'Operation',
      enableRetry = true,
      maxRetries = 3,
      onSuccess = null,
      onError = null
    } = options;
    
    setError(null);
    setIsLoading(true);
    globalLoadingManager.setLoading(operationKey, true);
    
    try {
      let result;
      
      if (enableRetry) {
        result = await RetryHandler.retry(operation, maxRetries);
      } else {
        result = await operation();
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (onError) {
        onError(err);
      }
      
      if (showErrorAlert) {
        const retryFunction = enableRetry ? () => {
          executeWithErrorHandling(operation, options);
        } : null;
        
        retryFunctionRef.current = retryFunction;
        ErrorHandler.handleError(err, context, retryFunction);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
      globalLoadingManager.setLoading(operationKey, false);
    }
  }, [operationKey]);
  
  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Retry the last failed operation
   */
  const retry = useCallback(() => {
    if (retryFunctionRef.current) {
      retryFunctionRef.current();
    }
  }, []);
  
  /**
   * Set loading state manually
   */
  const setLoadingState = useCallback((loading) => {
    setIsLoading(loading);
    globalLoadingManager.setLoading(operationKey, loading);
  }, [operationKey]);
  
  return {
    error,
    isLoading,
    executeWithErrorHandling,
    clearError,
    retry,
    setLoadingState
  };
};

/**
 * Hook for handling API operations with standardized error handling
 */
export const useApiOperation = (operationKey = 'api') => {
  const { executeWithErrorHandling, ...rest } = useErrorHandler(operationKey);
  
  /**
   * Execute an API call with standardized error handling
   * @param {Function} apiCall - The API function to call
   * @param {Object} options - Options for the API call
   */
  const executeApiCall = useCallback(async (apiCall, options = {}) => {
    return executeWithErrorHandling(apiCall, {
      context: 'API Request',
      enableRetry: true,
      maxRetries: 2,
      ...options
    });
  }, [executeWithErrorHandling]);
  
  return {
    executeApiCall,
    executeWithErrorHandling,
    ...rest
  };
};

/**
 * Hook for handling voice operations with specialized error handling
 */
export const useVoiceHandler = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  
  /**
   * Execute a voice operation with specialized error handling
   * @param {Function} operation - The voice operation to execute
   * @param {Object} options - Options for voice handling
   */
  const executeVoiceOperation = useCallback(async (operation, options = {}) => {
    const {
      showErrorAlert = true,
      onSuccess = null,
      onError = null,
      enableRetry = true
    } = options;
    
    setVoiceError(null);
    
    try {
      const result = await operation();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setVoiceError(err);
      
      if (onError) {
        onError(err);
      }
      
      if (showErrorAlert) {
        const retryFunction = enableRetry ? () => {
          executeVoiceOperation(operation, options);
        } : null;
        
        ErrorHandler.handleVoiceError(err, retryFunction);
      }
      
      throw err;
    }
  }, []);
  
  /**
   * Set recording state
   */
  const setRecordingState = useCallback((recording) => {
    setIsRecording(recording);
    if (!recording) {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Set processing state
   */
  const setProcessingState = useCallback((processing) => {
    setIsProcessing(processing);
  }, []);
  
  /**
   * Clear voice error
   */
  const clearVoiceError = useCallback(() => {
    setVoiceError(null);
  }, []);
  
  return {
    isRecording,
    isProcessing,
    voiceError,
    executeVoiceOperation,
    setRecordingState,
    setProcessingState,
    clearVoiceError
  };
};

/**
 * Hook for form validation and error handling
 */
export const useFormHandler = () => {
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  /**
   * Validate a form field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Object} rules - Validation rules
   */
  const validateField = useCallback((field, value, rules = {}) => {
    const errors = { ...validationErrors };
    
    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
    }
    // Min length validation
    else if (rules.minLength && value && value.toString().length < rules.minLength) {
      errors[field] = `${field} must be at least ${rules.minLength} characters`;
    }
    // Max length validation
    else if (rules.maxLength && value && value.toString().length > rules.maxLength) {
      errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
    }
    // Email validation
    else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field] = 'Please enter a valid email address';
    }
    // Custom validation
    else if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        errors[field] = customError;
      } else {
        delete errors[field];
      }
    }
    // Clear error if validation passes
    else {
      delete errors[field];
    }
    
    setValidationErrors(errors);
    return !errors[field];
  }, [validationErrors]);
  
  /**
   * Validate entire form
   * @param {Object} formData - Form data to validate
   * @param {Object} validationRules - Validation rules for each field
   */
  const validateForm = useCallback((formData, validationRules) => {
    const errors = {};
    let isValid = true;
    
    Object.keys(validationRules).forEach(field => {
      const value = formData[field];
      const rules = validationRules[field];
      
      if (!validateField(field, value, rules)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      ErrorHandler.handleValidationError(validationErrors);
    }
    
    return isValid;
  }, [validateField, validationErrors]);
  
  /**
   * Submit form with validation and error handling
   * @param {Object} formData - Form data
   * @param {Object} validationRules - Validation rules
   * @param {Function} submitFunction - Function to call on successful validation
   */
  const submitForm = useCallback(async (formData, validationRules, submitFunction) => {
    if (!validateForm(formData, validationRules)) {
      return false;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitFunction(formData);
      setValidationErrors({});
      return true;
    } catch (error) {
      ErrorHandler.handleError(error, 'Form Submission');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm]);
  
  /**
   * Clear all validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);
  
  return {
    validationErrors,
    isSubmitting,
    validateField,
    validateForm,
    submitForm,
    clearValidationErrors
  };
};