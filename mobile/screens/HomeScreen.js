import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/tokens';
import { CategorySection } from '../components/CategorySection';
import { taskAPI, calendarAPI, paymentAPI } from '../api/apiClient';
import { paymentDetectionService } from '../services/paymentDetection';
import { useApiOperation, useFormHandler } from '../hooks/useErrorHandler';
import { ErrorHandler } from '../utils/errorHandler';
import { HapticFeedback } from '../utils/haptics';

export function HomeScreen({ colorScheme, onThemeToggle }) {
  const theme = getTheme(colorScheme);
  const [refreshing, setRefreshing] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  
  // Error handling hooks
  const { executeApiCall, isLoading: isApiLoading, error: apiError } = useApiOperation('homeScreen');
  const { 
    validateField, 
    validateForm, 
    submitForm, 
    validationErrors, 
    isSubmitting,
    clearValidationErrors 
  } = useFormHandler();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load tasks
      const tasksResponse = await taskAPI.getTasks();
      const allTasks = tasksResponse.data || [];
      
      // Load calendar events (meetings)
      const eventsResponse = await calendarAPI.getEvents();
      const allEvents = eventsResponse.data || [];
      
      // Filter incomplete tasks
      const incompleteTasks = allTasks
        .filter(task => !task.completedAt)
        .slice(0, 3)
        .map(task => ({
          id: task.id,
          title: task.title,
          subtitle: task.dueAt ? formatDueDate(task.dueAt) : 'No due date',
          checked: false,
          originalTask: task
        }));
      
      // Format meetings from events
      const upcomingMeetings = allEvents
        .filter(event => new Date(event.start_time) > new Date())
        .slice(0, 2)
        .map(event => ({
          id: event.id,
          title: event.title,
          subtitle: formatEventTime(event.start_time),
          location: event.location,
          originalEvent: event
        }));
      
      // Load payments from API
      const paymentsResponse = await paymentAPI.getPayments();
      const allPayments = paymentsResponse.data || [];
      
      // Format payments for display
      const formattedPayments = allPayments
        .filter(payment => !payment.paidAt) // Only show unpaid payments
        .slice(0, 3)
        .map(payment => ({
          id: payment.id,
          title: payment.title,
          subtitle: formatPaymentDueDate(payment.dueDate),
          amount: payment.amount,
          originalPayment: payment
        }));
      
      setTasks(incompleteTasks);
      setMeetings(upcomingMeetings);
      setPayments(formattedPayments);
      
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Start payment detection service
  useEffect(() => {
    // Start the payment detection service
    paymentDetectionService.startListening();
    
    // Add listener for detected payments
    const handlePaymentDetected = async (payment) => {
      console.log('Payment detected in HomeScreen:', payment);
      // Refresh data to show new payments
      await executeApiCall(async () => {
        await loadData();
      }, {
        context: 'Refreshing Payments',
        showErrorAlert: false, // Silent refresh
        enableRetry: false
      });
    };
    
    paymentDetectionService.addListener(handlePaymentDetected);
    
    // Cleanup on unmount
    return () => {
      paymentDetectionService.removeListener(handlePaymentDetected);
      paymentDetectionService.stopListening();
    };
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      // Error already handled by loadData
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleTaskToggle = async (task) => {
    HapticFeedback.success();
    await executeApiCall(async () => {
      await taskAPI.completeTask(task.originalTask.id);
      
      // Remove completed task from list
      setTasks(prev => prev.filter(t => t.id !== task.id));
      
    }, {
      context: 'Completing Task',
      showErrorAlert: true,
      onSuccess: () => {
        // Task completed successfully - no need for additional feedback
      }
    });
  };

  const handleMeetingPress = (meeting) => {
    Alert.alert(
      meeting.title,
      `Time: ${meeting.subtitle}${meeting.location ? `\nLocation: ${meeting.location}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const handlePaymentPress = (payment) => {
    Alert.alert(
      payment.title,
      `Amount: ${payment.amount}\n${payment.subtitle}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Paid', onPress: () => markPaymentPaid(payment) }
      ]
    );
  };

  const markPaymentPaid = async (payment) => {
    await executeApiCall(async () => {
      await paymentAPI.markPaid(payment.originalPayment.id);
      
      // Remove payment from list
      setPayments(prev => prev.filter(p => p.id !== payment.id));
      
    }, {
      context: 'Marking Payment as Paid',
      showErrorAlert: true,
      onSuccess: () => {
        ErrorHandler.showSuccess(`${payment.title} marked as paid!`);
      }
    });
  };

  const createTask = async () => {
    const formData = {
      title: newTaskTitle,
      description: newTaskDescription
    };
    
    const validationRules = {
      title: {
        required: true,
        minLength: 1,
        maxLength: 100
      },
      description: {
        maxLength: 500
      }
    };
    
    const success = await submitForm(formData, validationRules, async (data) => {
      const taskData = {
        title: data.title.trim(),
        description: data.description.trim(),
        priority: 'medium'
      };
      
      const response = await taskAPI.createTask(taskData);
      
      // Add the new task to the list
      const newTask = {
        id: `task-${Date.now()}`,
        title: data.title.trim(),
        subtitle: data.description.trim() || 'No description',
        originalTask: response.data
      };
      
      setTasks(prev => [newTask, ...prev]);
      
      // Reset form and close modal
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowTaskModal(false);
      clearValidationErrors();
      
      ErrorHandler.showSuccess('Task created successfully!');
    });
  };

  const formatDueDate = (dueAt) => {
    const due = new Date(dueAt);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 1) return `Due in ${diffDays} days`;
    if (diffDays === -1) return 'Due yesterday';
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  const formatEventTime = (startTime) => {
    const event = new Date(startTime);
    const now = new Date();
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const timeStr = event.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffDays === 0) return `Today ${timeStr}`;
    if (diffDays === 1) return `Tomorrow ${timeStr}`;
    return `${event.toLocaleDateString()} ${timeStr}`;
  };

  const formatPaymentDueDate = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 1) return `Due in ${diffDays} days`;
    if (diffDays === -1) return 'Due yesterday';
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.bg }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || isApiLoading} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.accent}
          />
        }
      >
      {/* Theme toggle button */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: theme.colors.surface }]}
          onPress={onThemeToggle}
        >
          <Ionicons 
            name={colorScheme === 'light' ? 'moon' : 'sunny'} 
            size={18} 
            color={theme.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.header, { color: theme.colors.textPrimary }]}>Home</Text>
      
      <View style={styles.sectionsContainer}>
        <CategorySection
          title='Meetings'
          accentBg={theme.colors.sectionBackground}
          accentText={theme.colors.textPrimary}
          items={meetings}
          onPressItem={handleMeetingPress}
          colorScheme={colorScheme}
          icon="calendar-outline"
        />
        <CategorySection
          title='Awaiting Payments'
          accentBg={theme.colors.sectionBackground}
          accentText={theme.colors.textPrimary}
          items={payments}
          onPressItem={handlePaymentPress}
          colorScheme={colorScheme}
          icon="wallet-outline"
          badge={payments.length > 0 ? payments.length : null}
        />
        <CategorySection
          title='Tasks'
          accentBg={theme.colors.sectionBackground}
          accentText={theme.colors.textPrimary}
          items={tasks}
          onPressItem={handleTaskToggle}
          colorScheme={colorScheme}
          icon="checkmark-circle-outline"
          showCheckboxes={true}
        />
      </View>
      
      {/* Loading State */}
      {isApiLoading && !refreshing && (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>Loading your data...</Text>
        </View>
      )}
      
      {/* Error State */}
      {apiError && !isApiLoading && (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#FF6B6B'} />
          <Text style={[styles.emptyTitle, { color: theme.colors.error || '#FF6B6B' }]}>Failed to load data</Text>
          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: theme.colors.accent, position: 'relative', bottom: 0, right: 0, marginTop: 16 }]}
            onPress={loadData}
          >
            <Text style={[{ color: theme.colors.bg, fontWeight: '600' }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Empty state removed as requested */}
    </ScrollView>

    <TouchableOpacity
      style={[styles.fab, { backgroundColor: theme.colors.accent }]}
      onPress={() => {
        HapticFeedback.medium();
        setShowTaskModal(true);
      }}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={24} color={theme.colors.bg} />
    </TouchableOpacity>

    {/* Task Creation Modal */}
    <Modal
      visible={showTaskModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowTaskModal(false)}
    >
      <KeyboardAvoidingView 
        style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => setShowTaskModal(false)}>
            <Text style={[styles.modalCancel, { color: theme.colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>New Task</Text>
          <TouchableOpacity onPress={createTask} disabled={isSubmitting || isApiLoading}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.accent} />
            ) : (
              <Text style={[styles.modalSave, { color: theme.colors.accent }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Title</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: theme.colors.surface,
                borderColor: validationErrors.title ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                color: theme.colors.textPrimary
              }]}
              value={newTaskTitle}
              onChangeText={(text) => {
                setNewTaskTitle(text);
                validateField('title', text, { required: true, minLength: 1, maxLength: 100 });
              }}
              placeholder="Enter task title..."
              placeholderTextColor={theme.colors.textTertiary}
              maxLength={100}
            />
            {validationErrors.title && (
              <Text style={[styles.emptySubtitle, { color: theme.colors.error || '#FF6B6B', marginTop: 4 }]}>
                {validationErrors.title}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, { 
                backgroundColor: theme.colors.surface,
                borderColor: validationErrors.description ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                color: theme.colors.textPrimary
              }]}
              value={newTaskDescription}
              onChangeText={(text) => {
                setNewTaskDescription(text);
                validateField('description', text, { maxLength: 500 });
              }}
              placeholder="Enter task description..."
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            {validationErrors.description && (
              <Text style={[styles.emptySubtitle, { color: theme.colors.error || '#FF6B6B', marginTop: 4 }]}>
                {validationErrors.description}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingTop: 16
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  themeToggle: {
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
  header: { 
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 8,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  emptyState: {
    borderRadius: 16,
    padding: 32,
    margin: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20
  },
  sectionsContainer: {
    gap: 12
  },
  fab: {
    position: 'absolute',
    bottom: 108, // 88 (navbar height) + 20 (spacing)
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
    zIndex: 1000 // Ensure it stays above other elements
  },
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '400'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  inputGroup: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 20
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  }
});
