import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiAPI } from '../api/apiClient';
import { getTheme } from '../theme/tokens';
import { useApiOperation } from '../hooks/useErrorHandler';
import { ErrorHandler } from '../utils/errorHandler';

const ChatScreen = ({ colorScheme, onThemeToggle }) => {
  const theme = getTheme(colorScheme);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef(null);
  
  // Error handling
  const { executeApiCall, isLoading: isApiLoading, error: apiError } = useApiOperation('chatScreen');

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const savedMessages = await AsyncStorage.getItem('chatHistory');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      ErrorHandler.handleError(error, 'Loading Chat History', () => loadChatHistory());
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveChatHistory = async (newMessages) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving chat history:', error);
      // Don't show error alert for saving - it's not critical
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isApiLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    await executeApiCall(async () => {
      const response = await aiAPI.chat(messageText);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.text || response.data.message || 'I apologize, but I couldn\'t process your request right now.',
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      await saveChatHistory(finalMessages);
    }, {
      context: 'Sending Chat Message',
      showErrorAlert: false, // We'll handle errors inline
      enableRetry: true,
      maxRetries: 2,
      onError: async (error) => {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I\'m having trouble connecting right now. Please try again.',
          isUser: false,
          timestamp: new Date(),
          isError: true,
        };

        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        await saveChatHistory(finalMessages);
      }
    }).finally(() => {
      setIsTyping(false);
    });
  };

  const clearChat = () => {
    ErrorHandler.showConfirmation(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      async () => {
        try {
          setMessages([]);
          await AsyncStorage.removeItem('chatHistory');
          ErrorHandler.showSuccess('Chat history cleared successfully!');
        } catch (error) {
          ErrorHandler.handleError(error, 'Clearing Chat History');
        }
      }
    );
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }) => {
    const isLastMessage = index === messages.length - 1;
    const showTimestamp = index === 0 || 
      (messages[index - 1] && 
       Math.abs(item.timestamp - messages[index - 1].timestamp) > 5 * 60 * 1000); // 5 minutes

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={[styles.timestamp, { color: theme.colors.textTertiary }]}>
            {formatTime(item.timestamp)}
          </Text>
        )}
        
        <View style={[
          styles.messageBubble,
          item.isUser ? [
            styles.userBubble,
            { backgroundColor: theme.colors.accent }
          ] : [
            styles.aiBubble,
            { backgroundColor: theme.colors.surface },
            item.isError && { backgroundColor: theme.colors.error + '20' }
          ]
        ]}>
          {!item.isUser && (
            <View style={styles.aiAvatar}>
              <Ionicons 
                name="sparkles" 
                size={14} 
                color={item.isError ? theme.colors.error : theme.colors.accent} 
              />
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            item.isUser ? 
              { color: theme.colors.bg } : 
              { color: item.isError ? theme.colors.error : theme.colors.textPrimary }
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.messageContainer}>
        <View style={[
          styles.messageBubble,
          styles.aiBubble,
          { backgroundColor: theme.colors.surface }
        ]}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color={theme.colors.accent} />
          </View>
          <View style={styles.typingContainer}>
            <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.aiHeaderAvatar}>
            <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>AI Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Always here to help</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.colors.bg }]}
            onPress={clearChat}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, { backgroundColor: theme.colors.bg }]}
            onPress={onThemeToggle}
          >
            <Ionicons 
              name={colorScheme === 'dark' ? 'sunny' : 'moon'} 
              size={18} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      {isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading chat history...
          </Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start a conversation with your AI assistant
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Ask questions, get help with tasks, or just chat!
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={renderTypingIndicator}
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.bg, borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.textInput, { color: theme.colors.textPrimary }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything..."
            placeholderTextColor={theme.colors.textTertiary}
            multiline
            maxLength={1000}
            editable={!isApiLoading}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.colors.accent : theme.colors.textTertiary }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isApiLoading}
          >
            {isApiLoading ? (
              <ActivityIndicator size="small" color={theme.colors.bg} />
            ) : (
              <Ionicons name="send" size={18} color={theme.colors.bg} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  aiHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20
  },
  headerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16
  },
  messageContainer: {
    marginVertical: 4
  },
  timestamp: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 8
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  aiAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    opacity: 0.6
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    maxHeight: 100,
    marginRight: 8
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center'
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8
  }
});
