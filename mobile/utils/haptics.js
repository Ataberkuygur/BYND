import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light impact for subtle interactions
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not supported on this device
      console.log('Haptics not supported:', error);
    }
  },

  // Medium impact for standard interactions
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  },

  // Heavy impact for important interactions
  heavy: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  },

  // Success notification
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  },

  // Warning notification
  warning: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  },

  // Error notification
  error: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  },

  // Selection feedback for picker/selector interactions
  selection: () => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  }
};