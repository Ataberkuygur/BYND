import { Alert } from 'react-native';

/**
 * Centralized error handling utility for the BYND app
 */
export class ErrorHandler {
  /**
   * Handle API errors with user-friendly messages
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @param {Function} onRetry - Optional retry function
   */
  static handleError(error, context = 'Operation', onRetry = null) {
    console.error(`Error in ${context}:`, error);
    
    let title = 'Error';
    let message = 'Something went wrong. Please try again.';
    
    // Parse different types of errors
    if (error.response) {
      // API response error
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          title = 'Invalid Request';
          message = data?.message || 'Please check your input and try again.';
          break;
        case 401:
          title = 'Authentication Required';
          message = 'Please log in to continue.';
          break;
        case 403:
          title = 'Access Denied';
          message = 'You don\'t have permission to perform this action.';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found.';
          break;
        case 429:
          title = 'Too Many Requests';
          message = 'Please wait a moment before trying again.';
          break;
        case 500:
          title = 'Server Error';
          message = 'Our servers are experiencing issues. Please try again later.';
          break;
        default:
          title = 'Network Error';
          message = data?.message || 'Please check your connection and try again.';
      }
    } else if (error.request) {
      // Network error
      title = 'Connection Error';
      message = 'Please check your internet connection and try again.';
    } else if (error.message) {
      // Other errors
      if (error.message.includes('timeout')) {
        title = 'Request Timeout';
        message = 'The request took too long. Please try again.';
      } else if (error.message.includes('Network')) {
        title = 'Network Error';
        message = 'Please check your internet connection.';
      } else {
        message = error.message;
      }
    }
    
    // Show alert with retry option if provided
    const buttons = [{ text: 'OK', style: 'default' }];
    
    if (onRetry && typeof onRetry === 'function') {
      buttons.unshift({
        text: 'Retry',
        onPress: onRetry
      });
    }
    
    Alert.alert(title, message, buttons);
  }
  
  /**
   * Handle voice recording errors
   * @param {Error} error - The error object
   * @param {Function} onRetry - Optional retry function
   */
  static handleVoiceError(error, onRetry = null) {
    console.error('Voice error:', error);
    
    let title = 'Voice Error';
    let message = 'Failed to process voice command. Please try again.';
    
    if (error.message) {
      if (error.message.includes('permission')) {
        title = 'Microphone Permission';
        message = 'Please allow microphone access in your device settings.';
      } else if (error.message.includes('recording')) {
        title = 'Recording Error';
        message = 'Failed to record audio. Please try again.';
      } else if (error.message.includes('processing')) {
        title = 'Processing Error';
        message = 'Failed to process your voice command. Please try again.';
      }
    }
    
    const buttons = [{ text: 'OK', style: 'default' }];
    
    if (onRetry && typeof onRetry === 'function') {
      buttons.unshift({
        text: 'Try Again',
        onPress: onRetry
      });
    }
    
    Alert.alert(title, message, buttons);
  }
  
  /**
   * Handle authentication errors
   * @param {Error} error - The error object
   * @param {Function} onLogin - Function to redirect to login
   */
  static handleAuthError(error, onLogin = null) {
    console.error('Auth error:', error);
    
    let title = 'Authentication Error';
    let message = 'Your session has expired. Please log in again.';
    
    if (error.response?.status === 401) {
      title = 'Session Expired';
      message = 'Your session has expired. Please log in again.';
    } else if (error.response?.status === 403) {
      title = 'Access Denied';
      message = 'You don\'t have permission to access this feature.';
    }
    
    const buttons = [];
    
    if (onLogin && typeof onLogin === 'function') {
      buttons.push({
        text: 'Log In',
        onPress: onLogin
      });
    }
    
    buttons.push({ text: 'OK', style: 'default' });
    
    Alert.alert(title, message, buttons);
  }
  
  /**
   * Handle validation errors
   * @param {Object} validationErrors - Object containing field validation errors
   */
  static handleValidationError(validationErrors) {
    const errors = Object.values(validationErrors).filter(Boolean);
    const message = errors.length > 0 ? errors.join('\n') : 'Please check your input.';
    
    Alert.alert('Validation Error', message);
  }
  
  /**
   * Show a success message
   * @param {string} message - Success message
   * @param {string} title - Optional title (defaults to 'Success')
   */
  static showSuccess(message, title = 'Success') {
    Alert.alert(title, message);
  }
  
  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {Function} onConfirm - Function to call on confirmation
   * @param {Function} onCancel - Optional function to call on cancel
   */
  static showConfirmation(title, message, onConfirm, onCancel = null) {
    const buttons = [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel
      },
      {
        text: 'Confirm',
        onPress: onConfirm
      }
    ];
    
    Alert.alert(title, message, buttons);
  }
}

/**
 * Retry utility for failed operations
 */
export class RetryHandler {
  /**
   * Retry an async operation with exponential backoff
   * @param {Function} operation - The async operation to retry
   * @param {number} maxRetries - Maximum number of retries (default: 3)
   * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
   */
  static async retry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff: delay increases with each attempt
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      }
    }
    
    throw lastError;
  }
}

/**
 * Loading state manager
 */
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
  }
  
  /**
   * Set loading state for a specific operation
   * @param {string} key - Operation key
   * @param {boolean} isLoading - Loading state
   */
  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners();
  }
  
  /**
   * Get loading state for a specific operation
   * @param {string} key - Operation key
   */
  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }
  
  /**
   * Check if any operation is loading
   */
  isAnyLoading() {
    return Array.from(this.loadingStates.values()).some(Boolean);
  }
  
  /**
   * Add a listener for loading state changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.loadingStates);
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }
  
  /**
   * Clear all loading states
   */
  clearAll() {
    this.loadingStates.clear();
    this.notifyListeners();
  }
}

// Global loading manager instance
export const globalLoadingManager = new LoadingManager();