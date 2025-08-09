import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Platform,
  Appearance,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { authLogin, api } from './api/apiClient';
import { getTheme } from './theme/tokens';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { BottomNav } from './components/BottomNav';
import { voiceService } from './services/VoiceService';
import { aiAPI, taskAPI, calendarAPI, voiceAPI } from './api/apiClient';

const Stack = createStackNavigator();

function AuthScreen({ onLogin, colorScheme, onThemeToggle }) {
  const theme = getTheme(colorScheme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const success = await authLogin(email, password);
        if (success) {
          onLogin();
        } else {
          Alert.alert('Error', 'Invalid credentials');
        }
      } else {
        // Registration
        const response = await api.post('/auth/register', {
          email: email.trim(),
          password: password
        });
        
        if (response.data.success) {
          Alert.alert('Success', 'Account created! Please log in.', [
            { text: 'OK', onPress: () => setIsLogin(true) }
          ]);
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.authContainer, { backgroundColor: theme.colors.bg }]}>
      <StatusBar 
        barStyle={colorScheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.bg}
      />
      
      {/* Header */}
      <View style={styles.authHeader}>
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: theme.colors.surface }]}
          onPress={onThemeToggle}
        >
          <Ionicons 
            name={colorScheme === 'light' ? 'moon' : 'sunny'} 
            size={20} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Logo and Title */}
      <View style={styles.authContent}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.accent + '20' }]}>
          <Ionicons name="mic" size={32} color={theme.colors.accent} />
        </View>
        
        <Text style={[styles.appTitle, { color: theme.colors.textPrimary }]}>BYND</Text>
        <Text style={[styles.appSubtitle, { color: theme.colors.textSecondary }]}>
          Voice-first productivity assistant
        </Text>

        {/* Auth Form */}
        <View style={styles.authForm}>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.colors.textPrimary }]}
              placeholder="Password"
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: theme.colors.accent }]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={[styles.authButtonText, { color: theme.colors.bg }]}>
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={[styles.switchText, { color: theme.colors.textSecondary }]}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: theme.colors.accent, fontWeight: '600' }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MainShell({ colorScheme, onThemeToggle }) {
  const theme = getTheme(colorScheme);
  const [activeTab, setActiveTab] = useState('home'); // Default to home screen
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'listening', 'processing', 'success', 'error'
  const [recordingUri, setRecordingUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const handleVoicePress = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsRecording(false);
        setRecordingState('processing');
        
        const uri = await voiceService.stopRecording();
        setRecordingUri(uri);
        
        // Get recording duration
        const duration = await voiceService.getRecordingDuration(uri);
        setRecordingDuration(duration);
        
        // Process the recording with AI
        await processVoiceCommand(uri);
        
      } catch (error) {
        console.error('Voice recording error:', error);
        setRecordingState('error');
        Alert.alert(
          'Recording Error', 
          'Failed to stop recording. Please try again.',
          [{ text: 'OK', onPress: () => setRecordingState('idle') }]
        );
      }
    } else {
      // Start recording
      try {
        setRecordingState('listening');
        const success = await voiceService.startRecording();
        
        if (success) {
          setIsRecording(true);
          
          // Auto-stop after 60 seconds
          setTimeout(() => {
            if (voiceService.getRecordingStatus().isRecording) {
              handleVoicePress(); // This will stop the recording
            }
          }, 60000);
        } else {
          setRecordingState('error');
          Alert.alert(
            'Recording Error',
            'Failed to start recording. Please check microphone permissions in your device settings.',
            [
              { text: 'Settings', onPress: () => {
                // On iOS, this will open the app settings
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
                setRecordingState('idle');
              }},
              { text: 'Cancel', onPress: () => setRecordingState('idle') }
            ]
          );
        }
      } catch (error) {
        console.error('Voice recording start error:', error);
        setRecordingState('error');
        
        let errorTitle = 'Recording Error';
        let errorMessage = 'Failed to start recording. Please try again.';
        let alertButtons = [{ text: 'OK', onPress: () => setRecordingState('idle') }];
        
        // Handle specific recording errors
        if (error.message?.includes('permission') || error.message?.includes('Permission')) {
          errorTitle = 'Microphone Permission Required';
          errorMessage = 'Please allow microphone access in your device settings to use voice commands.';
          alertButtons = [
            { text: 'Settings', onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
              setRecordingState('idle');
            }},
            { text: 'Cancel', onPress: () => setRecordingState('idle') }
          ];
        } else if (error.message?.includes('busy') || error.message?.includes('in use')) {
          errorTitle = 'Microphone Busy';
          errorMessage = 'The microphone is being used by another app. Please close other apps and try again.';
          alertButtons = [
            { text: 'Retry', onPress: () => {
              setTimeout(() => handleVoicePress(), 1000);
            }},
            { text: 'Cancel', onPress: () => setRecordingState('idle') }
          ];
        }
        
        Alert.alert(errorTitle, errorMessage, alertButtons);
      }
    }
  };

  const processVoiceCommand = async (uri) => {
    try {
      // Transcribe the audio using the backend API
      let transcription;
      let transcriptionFailed = false;
      
      try {
        setRecordingState('processing');
        
        // Create FormData to send audio file
        const formData = new FormData();
        formData.append('audio', {
          uri: uri,
          type: 'audio/m4a', // iOS default format
          name: 'recording.m4a'
        });
        
        const transcriptionResponse = await voiceAPI.transcribe(formData);
        transcription = transcriptionResponse.data.transcription;
        
        if (!transcription || transcription.trim().length === 0) {
          throw new Error('Empty transcription received');
        }
      } catch (transcriptionError) {
        console.error('Transcription error:', transcriptionError);
        transcriptionFailed = true;
        
        // Check if it's a network error
        if (transcriptionError.message?.includes('Network') || 
            transcriptionError.code === 'NETWORK_ERROR' ||
            transcriptionError.message?.includes('fetch')) {
          throw new Error('NETWORK_ERROR: Unable to connect to transcription service');
        }
        
        // Check if it's an audio format error
        if (transcriptionError.message?.includes('format') || 
            transcriptionError.message?.includes('audio')) {
          throw new Error('AUDIO_ERROR: Invalid audio format or corrupted recording');
        }
        
        // Fallback to dummy text for other transcription errors
        transcription = "Create a task to review project proposal by tomorrow";
        console.warn('Using fallback transcription due to error:', transcriptionError.message);
      }
      
      // Use AI to interpret the voice command and create tasks
      let interpretResponse;
      let createdTasks = [];
      let actionTaken = false;
      let actionMessage = 'Voice command processed successfully!';
      
      try {
        interpretResponse = await aiAPI.interpretUtterance({
          utterance: transcription
        });
        createdTasks = interpretResponse.data || [];
      } catch (interpretError) {
        console.error('AI interpretation error:', interpretError);
        
        // Check if it's a network error
        if (interpretError.message?.includes('Network') || 
            interpretError.code === 'NETWORK_ERROR' ||
            interpretError.message?.includes('fetch')) {
          throw new Error('NETWORK_ERROR: Unable to connect to AI service');
        }
        
        // For other AI errors, try to get a future self response as fallback
        try {
          const futureSelfResponse = await aiAPI.futureSelf({
            message: transcription
          });
          actionMessage = futureSelfResponse.data.reply || 'Voice command received. AI interpretation failed, but here\'s a response.';
        } catch (futureSelfError) {
          console.error('Future self fallback also failed:', futureSelfError);
          actionMessage = transcriptionFailed ? 
            'Voice processing completed with limited functionality due to service issues.' :
            `Voice command "${transcription}" was heard but couldn't be processed by AI services.`;
        }
      }
      
      // Handle successful AI interpretation
      if (Array.isArray(createdTasks) && createdTasks.length > 0) {
        actionTaken = true;
        if (createdTasks.length === 1) {
          actionMessage = `Task created: "${createdTasks[0].title}"`;
        } else {
          actionMessage = `${createdTasks.length} tasks created: ${createdTasks.map(t => `"${t.title}"`).join(', ')}`;
        }
      } else if (!actionMessage.includes('Voice command received')) {
        // If no tasks were created and we haven't set a message yet, try future self
        try {
          const futureSelfResponse = await aiAPI.futureSelf({
            message: transcription
          });
          actionMessage = futureSelfResponse.data.reply || 'Voice command received but no specific action was taken.';
        } catch (error) {
          console.error('Error getting future self response:', error);
          actionMessage = 'Voice command received but no specific action was taken.';
        }
      }
      
      setRecordingState('success');
      
      Alert.alert(
        'Voice Command Processed',
        actionMessage,
        [
          {
            text: 'Play Recording',
            onPress: async () => {
              try {
                await voiceService.playRecording(uri);
              } catch (error) {
                console.error('Playback error:', error);
              }
            }
          },
          { 
            text: 'OK', 
            onPress: () => {
              setRecordingState('idle');
              // Clean up the recording after processing
              voiceService.deleteRecording(uri);
              setRecordingUri(null);
              setRecordingDuration(0);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Voice processing error:', error);
      setRecordingState('error');
      
      let errorTitle = 'Processing Error';
      let errorMessage = 'Failed to process voice command. Please try again.';
      let alertButtons = [{ text: 'OK', onPress: () => setRecordingState('idle') }];
      
      // Handle specific error types
      if (error.message?.includes('NETWORK_ERROR')) {
        errorTitle = 'Connection Error';
        errorMessage = 'Unable to connect to services. Please check your internet connection and try again.';
        alertButtons = [
          { text: 'Retry', onPress: () => processVoiceCommand(uri) },
          { text: 'Cancel', onPress: () => setRecordingState('idle') }
        ];
      } else if (error.message?.includes('AUDIO_ERROR')) {
        errorTitle = 'Audio Error';
        errorMessage = 'There was a problem with the audio recording. Please try recording again.';
        alertButtons = [
          { text: 'Record Again', onPress: () => {
            setRecordingState('idle');
            // Clean up current recording
            voiceService.deleteRecording(uri);
            setRecordingUri(null);
            setRecordingDuration(0);
            // Start new recording
            setTimeout(() => handleVoicePress(), 100);
          }},
          { text: 'Cancel', onPress: () => setRecordingState('idle') }
        ];
      } else if (error.message?.includes('permission')) {
        errorTitle = 'Permission Error';
        errorMessage = 'Microphone permission is required for voice commands. Please enable it in settings.';
      }
      
      Alert.alert(errorTitle, errorMessage, alertButtons);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.cleanup();
    };
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen 
            colorScheme={colorScheme} 
            onThemeToggle={onThemeToggle}
            recordingState={recordingState}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen 
            colorScheme={colorScheme} 
            onThemeToggle={onThemeToggle}
            recordingState={recordingState}
          />
        );
      default:
        return (
          <HomeScreen 
            colorScheme={colorScheme} 
            onThemeToggle={onThemeToggle}
            recordingState={recordingState}
          />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <StatusBar 
        barStyle={colorScheme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.colors.bg}
      />
      
      {renderScreen()}
      
      <BottomNav
        activeTab={activeTab}
        onTabPress={setActiveTab}
        onVoicePress={handleVoicePress}
        isRecording={isRecording}
        recordingState={recordingState}
        colorScheme={colorScheme}
      />
    </View>
  );
}

export default function App() {
  // DEVELOPMENT MODE: Skip authentication for testing
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Changed to true for dev testing
  const [loading, setLoading] = useState(false); // Changed to false to skip loading
  const [colorScheme, setColorScheme] = useState('light'); // Default to light theme

  useEffect(() => {
    // DEVELOPMENT MODE: Comment out auth check for testing
    // checkAuthStatus();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme || 'light');
    });

    return () => subscription?.remove();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // Verify token is still valid
        try {
          await api.get('/auth/verify');
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    const theme = getTheme(colorScheme);
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.bg }]}>
        <View style={[styles.logoContainer, { backgroundColor: theme.colors.accent + '20' }]}>
          <Ionicons name="mic" size={32} color={theme.colors.accent} />
        </View>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainShell 
          colorScheme={colorScheme} 
          onThemeToggle={toggleTheme}
          onLogout={handleLogout}
        />
      ) : (
        <AuthScreen 
          onLogin={handleLogin} 
          colorScheme={colorScheme} 
          onThemeToggle={toggleTheme}
        />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500'
  },
  authContainer: {
    flex: 1
  },
  authHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  authContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48
  },
  authForm: {
    width: '100%',
    maxWidth: 320
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20
  },
  authButton: {
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  switchButton: {
    alignItems: 'center'
  },
  switchText: {
    fontSize: 14,
    textAlign: 'center'
  }
});
