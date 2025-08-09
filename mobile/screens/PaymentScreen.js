import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/tokens';
import { paymentAPI } from '../api/apiClient';
import { paymentDetectionService, formatPaymentDueDate } from '../services/paymentDetection';
import { useApiOperation, useFormHandler } from '../hooks/useErrorHandler';
import { ErrorHandler } from '../utils/errorHandler';
import { HapticFeedback } from '../utils/haptics';

export function PaymentScreen({ colorScheme, onThemeToggle }) {
  const theme = getTheme(colorScheme);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetectionModal, setShowDetectionModal] = useState(false);
  const [newPaymentTitle, setNewPaymentTitle] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDueDate, setNewPaymentDueDate] = useState('');
  const [detectionText, setDetectionText] = useState('');
  
  // Error handling hooks
  const { executeApiCall, isApiLoading, apiError } = useApiOperation();
  const { 
    submitForm: submitPaymentForm, 
    isSubmitting: isSubmittingPayment, 
    validationErrors: paymentValidationErrors 
  } = useFormHandler();
  const { 
    submitForm: submitDetectionForm, 
    isSubmitting: isSubmittingDetection, 
    validationErrors: detectionValidationErrors 
  } = useFormHandler();

  const loadPayments = useCallback(async () => {
    return executeApiCall(async () => {
      const response = await paymentAPI.getPayments();
      const allPayments = response.data || [];
      
      // Sort payments by due date
      const sortedPayments = allPayments.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA - dateB;
      });
      
      setPayments(sortedPayments);
    }, {
      errorMessage: 'Failed to load payments',
      showErrorAlert: true
    });
  }, [executeApiCall]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Listen for payment detection events
  useEffect(() => {
    const handlePaymentDetected = (payment) => {
      console.log('Payment detected in PaymentScreen:', payment);
      loadPayments(); // Refresh the list
    };
    
    paymentDetectionService.addListener(handlePaymentDetected);
    
    return () => {
      paymentDetectionService.removeListener(handlePaymentDetected);
    };
  }, [loadPayments]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadPayments();
    } finally {
      setRefreshing(false);
    }
  }, [loadPayments]);

  const handlePaymentPress = (payment) => {
    const options = [
      { text: 'Cancel', style: 'cancel' }
    ];
    
    if (!payment.paidAt) {
      options.push({
        text: 'Mark as Paid',
        onPress: () => markPaymentPaid(payment)
      });
    }
    
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => deletePayment(payment)
    });
    
    Alert.alert(
      payment.title,
      `Amount: ${payment.amount}\nDue: ${formatPaymentDueDate(payment.dueDate)}${payment.paidAt ? '\nStatus: Paid' : ''}`,
      options
    );
  };

  const markPaymentPaid = async (payment) => {
    HapticFeedback.success();
    executeApiCall(async () => {
      await paymentAPI.markPaid(payment.id);
      await loadPayments();
      ErrorHandler.showSuccess(`${payment.title} marked as paid!`);
    }, {
      errorMessage: 'Failed to mark payment as paid',
      showErrorAlert: true
    });
  };

  const deletePayment = async (payment) => {
    ErrorHandler.showConfirmation(
      'Delete Payment',
      `Are you sure you want to delete "${payment.title}"?`,
      () => {
        executeApiCall(async () => {
          await paymentAPI.deletePayment(payment.id);
          await loadPayments();
          ErrorHandler.showSuccess('Payment deleted successfully!');
        }, {
          errorMessage: 'Failed to delete payment',
          showErrorAlert: true
        });
      }
    );
  };

  const createPayment = async () => {
    const validationRules = {
      title: { required: true, message: 'Payment title is required' },
      amount: { required: true, message: 'Payment amount is required' }
    };
    
    const formData = {
      title: newPaymentTitle.trim(),
      amount: newPaymentAmount.trim()
    };
    
    submitPaymentForm(formData, validationRules, async (validatedData) => {
      const paymentData = {
        title: validatedData.title,
        amount: validatedData.amount.startsWith('$') ? validatedData.amount : `$${validatedData.amount}`,
        dueDate: newPaymentDueDate.trim() || new Date().toISOString(),
        source: 'manual'
      };

      await paymentAPI.addPayment(paymentData);
      await loadPayments();
      
      // Reset form and close modal
      setNewPaymentTitle('');
      setNewPaymentAmount('');
      setNewPaymentDueDate('');
      setShowAddModal(false);
      
      ErrorHandler.showSuccess('Payment added successfully!');
    }, {
      errorMessage: 'Failed to create payment'
    });
  };

  const processDetectionText = async () => {
    const validationRules = {
      text: { required: true, message: 'Please enter some text to analyze' }
    };
    
    const formData = {
      text: detectionText.trim()
    };
    
    submitDetectionForm(formData, validationRules, async (validatedData) => {
      await paymentDetectionService.processText(validatedData.text, 'manual');
      
      // Reset form and close modal
      setDetectionText('');
      setShowDetectionModal(false);
      
      // Refresh payments
      await loadPayments();
      ErrorHandler.showSuccess('Text processed successfully!');
    }, {
      errorMessage: 'Failed to process text'
    });
  };

  const renderPaymentItem = ({ item: payment }) => {
    const isPaid = !!payment.paidAt;
    const isOverdue = !isPaid && new Date(payment.dueDate) < new Date();
    
    return (
      <TouchableOpacity
        style={[
          styles.paymentItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: isPaid ? 0.6 : 1
          }
        ]}
        onPress={() => handlePaymentPress(payment)}
      >
        <View style={styles.paymentIcon}>
          <Ionicons
            name={isPaid ? 'checkmark-circle' : isOverdue ? 'warning' : 'wallet-outline'}
            size={24}
            color={isPaid ? theme.colors.success : isOverdue ? theme.colors.error : theme.colors.accent}
          />
        </View>
        
        <View style={styles.paymentContent}>
          <Text style={[styles.paymentTitle, { color: theme.colors.textPrimary }]}>
            {payment.title}
          </Text>
          <Text style={[styles.paymentSubtitle, { color: theme.colors.textSecondary }]}>
            {formatPaymentDueDate(payment.dueDate)}
            {isPaid && ' • Paid'}
          </Text>
        </View>
        
        <Text style={[
          styles.paymentAmount,
          {
            color: isPaid ? theme.colors.textSecondary : isOverdue ? theme.colors.error : theme.colors.textPrimary
          }
        ]}>
          {payment.amount}
        </Text>
      </TouchableOpacity>
    );
  };

  const unpaidPayments = payments.filter(p => !p.paidAt);
  const paidPayments = payments.filter(p => p.paidAt);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Payments</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.bg }]}
            onPress={() => setShowDetectionModal(true)}
          >
            <Ionicons name="scan-outline" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.bg }]}
            onPress={() => {
              HapticFeedback.light();
              onThemeToggle();
            }}
          >
            <Ionicons
              name={colorScheme === 'light' ? 'moon' : 'sunny'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment List */}
      {isApiLoading && !refreshing && payments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading payments...
          </Text>
        </View>
      ) : apiError && payments.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#FF6B6B'} />
          <Text style={[styles.errorTitle, { color: theme.colors.error || '#FF6B6B' }]}>
            Failed to load payments
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.textSecondary }]}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
            onPress={loadPayments}
          >
            <Text style={[styles.retryButtonText, { color: theme.colors.bg }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          style={styles.paymentsList}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing || isApiLoading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="wallet-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No payments yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                Add payments manually or let us detect them from your messages.
              </Text>
            </View>
          }
          ListHeaderComponent={
            unpaidPayments.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                  Upcoming ({unpaidPayments.length})
                </Text>
              </View>
            )
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.accent }]}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color={theme.colors.bg} />
      </TouchableOpacity>

      {/* Add Payment Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.modalCancel, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add Payment</Text>
            <TouchableOpacity onPress={createPayment} disabled={isSubmittingPayment || isApiLoading}>
              <Text style={[styles.modalSave, { 
                color: (isSubmittingPayment || isApiLoading) ? theme.colors.textTertiary : theme.colors.accent 
              }]}>
                {isSubmittingPayment || isApiLoading ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Title</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: theme.colors.surface,
                  borderColor: paymentValidationErrors.title ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newPaymentTitle}
                onChangeText={setNewPaymentTitle}
                placeholder="e.g., Netflix Subscription"
                placeholderTextColor={theme.colors.textTertiary}
                maxLength={100}
              />
              {paymentValidationErrors.title && (
                <Text style={[styles.errorMessage, { color: theme.colors.error || '#FF6B6B' }]}>
                  {paymentValidationErrors.title}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Amount</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: theme.colors.surface,
                  borderColor: paymentValidationErrors.amount ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newPaymentAmount}
                onChangeText={setNewPaymentAmount}
                placeholder="$15.99"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                maxLength={20}
              />
              {paymentValidationErrors.amount && (
                <Text style={[styles.errorMessage, { color: theme.colors.error || '#FF6B6B' }]}>
                  {paymentValidationErrors.amount}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Due Date (Optional)</Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newPaymentDueDate}
                onChangeText={setNewPaymentDueDate}
                placeholder="YYYY-MM-DD or leave empty for today"
                placeholderTextColor={theme.colors.textTertiary}
                maxLength={50}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Payment Detection Modal */}
      <Modal
        visible={showDetectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetectionModal(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowDetectionModal(false)}>
              <Text style={[styles.modalCancel, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Detect Payment</Text>
            <TouchableOpacity onPress={processDetectionText} disabled={isSubmittingDetection || isApiLoading}>
              <Text style={[styles.modalSave, { 
                color: (isSubmittingDetection || isApiLoading) ? theme.colors.textTertiary : theme.colors.accent 
              }]}>
                {isSubmittingDetection || isApiLoading ? 'Detecting...' : 'Detect'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>SMS or Email Text</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, {
                  backgroundColor: theme.colors.surface,
                  borderColor: detectionValidationErrors.text ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={detectionText}
                onChangeText={setDetectionText}
                placeholder="Paste SMS or email text here to detect payment information..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={6}
                maxLength={1000}
              />
              {detectionValidationErrors.text && (
                <Text style={[styles.errorMessage, { color: theme.colors.error || '#FF6B6B' }]}>
                  {detectionValidationErrors.text}
                </Text>
              )}
            </View>
            
            <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
              Our AI will analyze the text and extract payment information like amount, due date, and service name.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600'
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
  paymentsList: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionHeader: {
    paddingVertical: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1
  },
  paymentIcon: {
    marginRight: 12
  },
  paymentContent: {
    flex: 1
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  paymentSubtitle: {
    fontSize: 14
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600'
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
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
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
    height: 120,
    textAlignVertical: 'top'
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  }
});