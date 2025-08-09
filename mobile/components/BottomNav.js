import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/tokens';
import { HapticFeedback } from '../utils/haptics';

export function BottomNav({ 
  activeTab, 
  onTabPress, 
  onVoicePress, 
  isRecording, 
  recordingState, 
  colorScheme 
}) {
  const theme = getTheme(colorScheme);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [waveAnim1] = useState(new Animated.Value(0.3));
  const [waveAnim2] = useState(new Animated.Value(0.5));
  const [waveAnim3] = useState(new Animated.Value(0.7));

  // Enhanced animations for recording states
  useEffect(() => {
    if (recordingState === 'listening') {
      // Pulse animation for listening
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      );
      
      // Wave animations for sound visualization
      const wave1 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1.5,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(waveAnim1, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true
          })
        ])
      );
      
      const wave2 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, {
            toValue: 2,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(waveAnim2, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true
          })
        ])
      );
      
      const wave3 = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, {
            toValue: 1.2,
            duration: 350,
            useNativeDriver: true
          }),
          Animated.timing(waveAnim3, {
            toValue: 0.7,
            duration: 350,
            useNativeDriver: true
          })
        ])
      );
      
      // Fade in indicator
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
      
      pulse.start();
      // Start waves with slight delays
      setTimeout(() => wave1.start(), 0);
      setTimeout(() => wave2.start(), 150);
      setTimeout(() => wave3.start(), 300);
      
      return () => {
        pulse.stop();
        wave1.stop();
        wave2.stop();
        wave3.stop();
      };
    } else if (recordingState === 'processing') {
      // Rotation for processing
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true
        })
      );
      
      // Keep indicator visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      rotate.start();
      return () => {
        rotate.stop();
        rotateAnim.setValue(0);
      };
    } else if (recordingState === 'success') {
      // Success bounce animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      
      // Show indicator briefly
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      // Auto-hide after 2 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start();
      }, 2000);
    } else if (recordingState === 'error') {
      // Error shake animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
      
      // Show error indicator
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start();
      }, 3000);
    } else {
      // Reset to idle state
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [recordingState, pulseAnim, rotateAnim, fadeAnim, scaleAnim, waveAnim1, waveAnim2, waveAnim3]);

  const getMicIcon = () => {
    switch (recordingState) {
      case 'listening':
        return 'radio-button-on'; // Black filled circle for recording
      case 'processing':
        return 'sync';
      case 'success':
        return 'checkmark';
      case 'error':
        return 'close';
      case 'idle':
      default:
        return 'radio-button-on'; // Black filled circle as default
    }
  };

  const getMicColor = () => {
    switch (recordingState) {
      case 'listening':
        return '#FF0000'; // Red for recording
      case 'processing':
        return '#FFFFFF';
      case 'success':
        return '#FFFFFF';
      case 'error':
        return '#FFFFFF';
      case 'idle':
      default:
        return '#000000'; // Black filled circle
    }
  };

  const getMicBackgroundColor = () => {
    switch (recordingState) {
      case 'listening':
        return '#FFFFFF'; // White background when recording
      case 'processing':
        return theme.colors.accent;
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'idle':
      default:
        return '#FFFFFF'; // White background as default
    }
  };

  const getIndicatorBackgroundColor = () => {
    switch (recordingState) {
      case 'listening':
        return theme.colors.surface;
      case 'processing':
        return theme.colors.surface;
      case 'success':
        return '#E8F5E8'; // Light green background
      case 'error':
        return '#FFEBEE'; // Light red background
      default:
        return theme.colors.surface;
    }
  };

  const getIndicatorTextColor = () => {
    switch (recordingState) {
      case 'listening':
        return theme.colors.textSecondary;
      case 'processing':
        return theme.colors.textSecondary;
      case 'success':
        return '#2E7D32'; // Dark green text
      case 'error':
        return '#C62828'; // Dark red text
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderTab = (tabKey, icon, label) => {
    const isActive = activeTab === tabKey;
    
    return (
      <TouchableOpacity
        key={tabKey}
        style={styles.tab}
        onPress={() => {
          if (tabKey !== activeTab) {
            HapticFeedback.light();
            onTabPress(tabKey);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.tabIconContainer,
          isActive && { backgroundColor: theme.colors.accent + '20' }
        ]}>
          <Ionicons
            name={isActive ? icon : icon + '-outline'}
            size={24}
            color={isActive ? theme.colors.activeIcon : theme.colors.inactiveIcon}
          />
        </View>
        {/* Removed tab labels as requested */}
      </TouchableOpacity>
    );
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.divider
      }
    ]}>
      {/* Home Tab */}
      {renderTab('home', 'home', 'Home')}
      
      {/* Center Microphone FAB */}
      <View style={styles.micContainer}>
        <TouchableOpacity
          style={[
            styles.micButton,
            {
              backgroundColor: getMicBackgroundColor(),
              shadowColor: recordingState === 'listening' ? '#FF4444' : theme.colors.accent
            }
          ]}
          onPress={() => {
            if (recordingState === 'idle') {
              HapticFeedback.medium();
            } else if (recordingState === 'listening') {
              HapticFeedback.light();
            }
            onVoicePress();
          }}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.micInner,
              {
                transform: [
                  { 
                    scale: recordingState === 'listening' ? pulseAnim : 
                           recordingState === 'success' || recordingState === 'error' ? scaleAnim : 1 
                  },
                  { rotate: recordingState === 'processing' ? spin : '0deg' }
                ]
              }
            ]}
          >
            <Ionicons
              name={getMicIcon()}
              size={28}
              color={getMicColor()}
            />
          </Animated.View>
        </TouchableOpacity>
        
        {/* Enhanced Recording State Indicator */}
        <Animated.View 
          style={[
            styles.recordingIndicator,
            { 
              backgroundColor: getIndicatorBackgroundColor(),
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }]
            }
          ]}
        >
          <View style={styles.indicatorContent}>
            {recordingState === 'listening' && (
               <View style={styles.listeningIndicator}>
                 <Animated.View style={[
                   styles.soundWave, 
                   styles.wave1,
                   { transform: [{ scaleY: waveAnim1 }] }
                 ]} />
                 <Animated.View style={[
                   styles.soundWave, 
                   styles.wave2,
                   { transform: [{ scaleY: waveAnim2 }] }
                 ]} />
                 <Animated.View style={[
                   styles.soundWave, 
                   styles.wave3,
                   { transform: [{ scaleY: waveAnim3 }] }
                 ]} />
               </View>
             )}
            {recordingState === 'processing' && (
              <Ionicons name="sync" size={12} color={theme.colors.textSecondary} />
            )}
            {recordingState === 'success' && (
              <Ionicons name="checkmark" size={12} color="#4CAF50" />
            )}
            {recordingState === 'error' && (
              <Ionicons name="close" size={12} color="#F44336" />
            )}
            {(recordingState === 'listening' || recordingState === 'processing' || recordingState === 'success' || recordingState === 'error') && (
              <Text style={[
                styles.recordingText,
                { color: getIndicatorTextColor() }
              ]}>
                {recordingState === 'listening' ? 'Listening...' :
                 recordingState === 'processing' ? 'Processing...' :
                 recordingState === 'success' ? 'Success!' :
                 recordingState === 'error' ? 'Try again' : ''}
              </Text>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Calendar Tab */}
      {renderTab('calendar', 'calendar', 'Calendar')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    height: 88
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
    flex: 1
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  tabLabel: {
    fontSize: 11,
    textAlign: 'center'
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    top: -32 // Move up so vertical center aligns with top edge of nav bar
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0' // Add subtle border for better definition
   },
   micInner: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordingIndicator: {
    position: 'absolute',
    top: -35,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 100,
    alignItems: 'center'
  },
  indicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordingText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4
  },
  soundWave: {
    width: 2,
    backgroundColor: '#FF4444',
    borderRadius: 1,
    marginHorizontal: 1
  },
  wave1: {
    height: 8,
    animationDelay: '0ms'
  },
  wave2: {
    height: 12,
    animationDelay: '150ms'
  },
  wave3: {
    height: 6,
    animationDelay: '300ms'
  }
});
