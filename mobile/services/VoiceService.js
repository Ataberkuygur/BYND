import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

class VoiceService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.recordingUri = null;
  }

  async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant microphone permission to use voice features.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  async startRecording() {
    try {
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.isRecording = true;
      
      console.log('Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recordingUri = uri;
      this.isRecording = false;
      
      console.log('Recording stopped, saved to:', uri);
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    } finally {
      this.recording = null;
    }
  }

  async playRecording(uri = null) {
    try {
      const playUri = uri || this.recordingUri;
      if (!playUri) {
        throw new Error('No recording to play');
      }

      // Unload any existing sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: playUri },
        { shouldPlay: true }
      );
      
      this.sound = sound;
      
      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.sound.unloadAsync();
          this.sound = null;
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw error;
    }
  }

  async getRecordingDuration(uri = null) {
    try {
      const targetUri = uri || this.recordingUri;
      if (!targetUri) {
        return 0;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: targetUri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      return status.durationMillis || 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      return 0;
    }
  }

  async deleteRecording(uri = null) {
    try {
      const targetUri = uri || this.recordingUri;
      if (!targetUri) {
        return;
      }

      await FileSystem.deleteAsync(targetUri, { idempotent: true });
      
      if (targetUri === this.recordingUri) {
        this.recordingUri = null;
      }
      
      console.log('Recording deleted:', targetUri);
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  }

  async cleanup() {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      this.isRecording = false;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      hasRecording: !!this.recordingUri,
      recordingUri: this.recordingUri
    };
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
export default voiceService;