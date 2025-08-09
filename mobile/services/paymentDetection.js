import { paymentAPI } from '../api/apiClient';
import { Alert } from 'react-native';

// Simulated SMS/Email payment detection service
export class PaymentDetectionService {
  constructor() {
    this.isListening = false;
    this.detectedPayments = [];
    this.listeners = [];
  }

  // Start listening for payment notifications
  startListening() {
    if (this.isListening) return;
    
    this.isListening = true;
    console.log('Payment detection service started');
    
    // Simulate periodic payment detection
    this.simulatePaymentDetection();
  }

  // Stop listening for payment notifications
  stopListening() {
    this.isListening = false;
    console.log('Payment detection service stopped');
  }

  // Add listener for payment detection events
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(payment) {
    this.listeners.forEach(listener => {
      try {
        listener(payment);
      } catch (error) {
        console.error('Error in payment detection listener:', error);
      }
    });
  }

  // Simulate payment detection from various sources
  async simulatePaymentDetection() {
    if (!this.isListening) return;

    // Simulate different types of payment notifications
    const mockNotifications = [
      {
        source: 'sms',
        text: 'Your Netflix subscription of $15.99 will be charged tomorrow. Reply STOP to cancel.',
        sender: 'Netflix'
      },
      {
        source: 'email',
        text: 'Your Spotify Premium subscription ($9.99) is due on Aug 25th. Update your payment method if needed.',
        sender: 'spotify@spotify.com'
      },
      {
        source: 'sms',
        text: 'Reminder: Your car insurance payment of $120.87 is due tomorrow. Pay now to avoid late fees.',
        sender: 'StateInsurance'
      },
      {
        source: 'email',
        text: 'Your internet service bill ($55.99) is ready. Due date: Aug 24, 2024. View bill online.',
        sender: 'billing@internetprovider.com'
      }
    ];

    // Randomly select and process a notification every 30-60 seconds
    const randomDelay = Math.random() * 30000 + 30000; // 30-60 seconds
    
    setTimeout(async () => {
      if (!this.isListening) return;
      
      const notification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
      await this.processNotification(notification);
      
      // Continue simulation
      this.simulatePaymentDetection();
    }, randomDelay);
  }

  // Process a notification and extract payment information
  async processNotification(notification) {
    try {
      console.log('Processing notification:', notification);
      
      // Use AI to detect payment information from text
      const response = await paymentAPI.detectFromText(notification.text, notification.source);
      
      if (response.data && response.data.detected) {
        const paymentInfo = response.data.payment;
        
        // Add to detected payments
        this.detectedPayments.push(paymentInfo);
        
        // Notify listeners
        this.notifyListeners(paymentInfo);
        
        // Show user notification
        this.showPaymentDetectedAlert(paymentInfo, notification.source);
        
        console.log('Payment detected:', paymentInfo);
      }
    } catch (error) {
      console.error('Error processing payment notification:', error);
    }
  }

  // Show alert when payment is detected
  showPaymentDetectedAlert(payment, source) {
    const sourceText = source === 'sms' ? 'SMS' : 'Email';
    
    Alert.alert(
      'Payment Detected',
      `Found payment from ${sourceText}:\n\n${payment.title}\nAmount: ${payment.amount}\nDue: ${payment.dueDate}`,
      [
        { text: 'Dismiss', style: 'cancel' },
        { 
          text: 'Add to Payments', 
          onPress: () => this.addPaymentToList(payment)
        }
      ]
    );
  }

  // Add detected payment to the user's payment list
  async addPaymentToList(payment) {
    try {
      await paymentAPI.addPayment(payment);
      Alert.alert('Success', 'Payment added to your list!');
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment. Please try again.');
    }
  }

  // Manually process text (for testing)
  async processText(text, source = 'manual') {
    const notification = { text, source, sender: 'Manual Input' };
    await this.processNotification(notification);
  }

  // Get all detected payments
  getDetectedPayments() {
    return this.detectedPayments;
  }

  // Clear detected payments
  clearDetectedPayments() {
    this.detectedPayments = [];
  }
}

// Singleton instance
export const paymentDetectionService = new PaymentDetectionService();

// Helper function to format payment due dates
export function formatPaymentDueDate(dueDate) {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays > 1) return `Due in ${diffDays} days`;
  if (diffDays === -1) return 'Due yesterday';
  return `Overdue by ${Math.abs(diffDays)} days`;
}

// Helper function to extract payment amount from text
export function extractPaymentAmount(text) {
  const amountRegex = /\$([0-9]+(?:\.[0-9]{2})?)/g;
  const matches = text.match(amountRegex);
  return matches ? matches[0] : null;
}

// Helper function to extract company name from text
export function extractCompanyName(text) {
  const commonCompanies = [
    'Netflix', 'Spotify', 'Amazon', 'Apple', 'Google', 'Microsoft',
    'Insurance', 'Internet', 'Phone', 'Electric', 'Gas', 'Water'
  ];
  
  for (const company of commonCompanies) {
    if (text.toLowerCase().includes(company.toLowerCase())) {
      return company;
    }
  }
  
  return 'Unknown Service';
}