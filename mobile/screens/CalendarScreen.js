import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/tokens';
import { calendarAPI } from '../api/apiClient';
import { useApiOperation, useFormHandler } from '../hooks/useErrorHandler';
import { ErrorHandler } from '../utils/errorHandler';
import { HapticFeedback } from '../utils/haptics';

export function CalendarScreen({ colorScheme, onThemeToggle }) {
  const theme = getTheme(colorScheme);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  
  // Error handling
  const { executeApiCall, isLoading: isApiLoading, error: apiError } = useApiOperation('calendarScreen');
  const { submitForm, isSubmitting, validationErrors } = useFormHandler();

  const loadEvents = useCallback(async () => {
    await executeApiCall(async () => {
      const response = await calendarAPI.getEvents();
      setEvents(response.data || []);
    }, {
      context: 'Loading Events',
      enableRetry: true,
      maxRetries: 3
    });
  }, [executeApiCall]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setRefreshing(false);
    }
  }, [loadEvents]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getSelectedDateEvents = () => {
    return getEventsForDate(selectedDate);
  };

  const navigateMonth = (direction) => {
    HapticFeedback.light();
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDatePress = (date) => {
    if (date) {
      HapticFeedback.light();
      setSelectedDate(date);
    }
  };

  const handleEventPress = (event) => {
    const startTime = new Date(event.start_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = event.end_time ? new Date(event.end_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : null;
    
    Alert.alert(
      event.title,
      `Time: ${startTime}${endTime ? ` - ${endTime}` : ''}${event.location ? `\nLocation: ${event.location}` : ''}${event.description ? `\nDescription: ${event.description}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => editEvent(event) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(event) }
      ]
    );
  };

  const editEvent = (event) => {
    // TODO: Implement event editing
    Alert.alert('Edit Event', 'Event editing will be implemented soon.');
  };

  const deleteEvent = async (event) => {
    ErrorHandler.showConfirmation(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"?`,
      async () => {
        await executeApiCall(async () => {
          await calendarAPI.deleteEvent(event.id);
          setEvents(prev => prev.filter(e => e.id !== event.id));
          ErrorHandler.showSuccess('Event deleted successfully!');
        }, {
          context: 'Deleting Event',
          enableRetry: true
        });
      }
    );
  };

  const createEvent = async () => {
    const validationRules = {
      title: { required: true, message: 'Please enter an event title' },
      time: { required: true, message: 'Please enter an event time' }
    };

    const formData = {
      title: newEventTitle.trim(),
      time: newEventTime.trim()
    };

    await submitForm(formData, validationRules, async (data) => {
      await executeApiCall(async () => {
        // Parse the time input (assuming format like "2:00 PM" or "14:00")
        const eventDateTime = new Date(selectedDate);
        const timeMatch = data.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3]?.toUpperCase();
          
          if (ampm === 'PM' && hours !== 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          
          eventDateTime.setHours(hours, minutes, 0, 0);
        } else {
          throw new Error('Invalid time format. Please use format like "2:00 PM" or "14:00"');
        }

        const eventData = {
          title: data.title,
          description: newEventDescription.trim() || undefined,
          location: newEventLocation.trim() || undefined,
          start_time: eventDateTime.toISOString(),
          end_time: new Date(eventDateTime.getTime() + 60 * 60 * 1000).toISOString() // Default 1 hour duration
        };

        const response = await calendarAPI.scheduleEvent(eventData);
        
        // Add the new event to the list
        setEvents(prev => [...prev, response.data]);
        
        // Reset form and close modal
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventLocation('');
        setNewEventTime('');
        setShowEventModal(false);
        
        ErrorHandler.showSuccess('Event created successfully!');
      }, {
        context: 'Creating Event',
        enableRetry: true
      });
    });
  };

  const renderCalendarDay = (date, index) => {
    if (!date) {
      return <View key={index} style={styles.emptyDay} />;
    }

    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();
    const dayEvents = getEventsForDate(date);
    const hasEvents = dayEvents.length > 0;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          isSelected && { backgroundColor: theme.colors.selected },
          isToday && !isSelected && { borderColor: theme.colors.selected, borderWidth: 1, opacity: 0.4 }
        ]}
        onPress={() => handleDatePress(date)}
      >
        <Text style={[
          styles.dayText,
          { color: isSelected ? theme.colors.selectedText : theme.colors.textPrimary },
          isToday && !isSelected && { color: theme.colors.selected }
        ]}>
          {date.getDate()}
        </Text>
        {hasEvents && (
          <View style={[
            styles.eventDot,
            { backgroundColor: isSelected ? theme.colors.selectedText : theme.colors.selected }
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }) => {
    const startTime = new Date(item.start_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = item.end_time ? new Date(item.end_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : null;

    return (
      <TouchableOpacity 
        style={[styles.eventCard, { backgroundColor: theme.colors.surface }]}
        onPress={() => handleEventPress(item)}
      >
        <View style={styles.eventTime}>
          <Text style={[styles.timeText, { color: theme.colors.accent }]}>
            {startTime}{endTime ? ` - ${endTime}` : ''}
          </Text>
        </View>
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.location && (
            <Text style={[styles.eventLocation, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              📍 {item.location}
            </Text>
          )}
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={theme.colors.textTertiary} 
        />
      </TouchableOpacity>
    );
  };

  const selectedDateEvents = getSelectedDateEvents();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateString = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
      
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Calendar</Text>

      {/* Calendar */}
      <View style={[styles.calendarContainer, { backgroundColor: theme.colors.surface }]}>
        {/* Month navigation */}
        <View style={styles.monthHeader}>
          <Text style={[styles.monthTitle, { color: theme.colors.textSecondary }]}>
            {monthName}
          </Text>
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.chevronButton}>
              <Ionicons name="chevron-back" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.chevronButton}>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Day headers */}
        <View style={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={[styles.dayHeader, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {getDaysInMonth(currentDate).map((date, index) => renderCalendarDay(date, index))}
        </View>
      </View>

      {/* Selected date agenda */}
      <View style={[styles.agendaContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.agendaTitle, { color: theme.colors.textPrimary }]}>
          {selectedDateString}
        </Text>
        
        {isApiLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading events...
            </Text>
          </View>
        ) : apiError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color={theme.colors.error || '#FF6B6B'} />
            <Text style={[styles.errorText, { color: theme.colors.error || '#FF6B6B' }]}>
              Failed to load events
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
              onPress={loadEvents}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.bg }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : selectedDateEvents.length > 0 ? (
          <FlatList
            data={selectedDateEvents}
            renderItem={renderEvent}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          />
        ) : (
          <View style={styles.noEvents}>
            <Ionicons name="calendar-outline" size={32} color={theme.colors.textTertiary} />
            <Text style={[styles.noEventsText, { color: theme.colors.textSecondary }]}>
              No events scheduled
            </Text>
          </View>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: theme.colors.accent }]}
        onPress={() => {
          HapticFeedback.medium();
          setShowEventModal(true);
        }}
      >
        <Ionicons name="add" size={24} color={theme.colors.bg} />
      </TouchableOpacity>

      {/* Event Creation Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: theme.colors.bg }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Text style={[styles.modalCancel, { color: theme.colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>New Event</Text>
            <TouchableOpacity 
              onPress={() => {
                HapticFeedback.success();
                createEvent();
              }}
              disabled={isSubmitting || isApiLoading}
            >
              <Text style={[styles.modalSave, { 
                color: (isSubmitting || isApiLoading) ? theme.colors.textTertiary : theme.colors.accent 
              }]}>
                {isSubmitting || isApiLoading ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Title *</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: validationErrors.title ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Event title"
                placeholderTextColor={theme.colors.textTertiary}
              />
              {validationErrors.title && (
                <Text style={[styles.errorMessage, { color: theme.colors.error || '#FF6B6B' }]}>
                  {validationErrors.title}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Time *</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: validationErrors.time ? (theme.colors.error || '#FF6B6B') : theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newEventTime}
                onChangeText={setNewEventTime}
                placeholder="e.g., 2:00 PM or 14:00"
                placeholderTextColor={theme.colors.textTertiary}
              />
              {validationErrors.time && (
                <Text style={[styles.errorMessage, { color: theme.colors.error || '#FF6B6B' }]}>
                  {validationErrors.time}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Location</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newEventLocation}
                onChangeText={setNewEventLocation}
                placeholder="Event location"
                placeholderTextColor={theme.colors.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary
                }]}
                value={newEventDescription}
                onChangeText={setNewEventDescription}
                placeholder="Event description"
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.selectedDateInfo}>
              <Text style={[styles.selectedDateText, { color: theme.colors.textSecondary }]}>Date: {selectedDateString}</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 28,
    fontFamily: 'SF Pro Display, Inter, system-ui',
    marginBottom: 8
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
  calendarContainer: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chevronButton: {
    marginLeft: 8
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    paddingVertical: 8,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 8,
    position: 'relative'
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4
  },
  agendaContainer: {
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  agendaTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 64
  },
  eventTime: {
    marginRight: 12
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  eventContent: {
    flex: 1,
    marginRight: 8
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 2,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  eventLocation: {
    fontSize: 12,
    opacity: 0.8
  },
  noEvents: {
    alignItems: 'center',
    padding: 32
  },
  noEventsText: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
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
  },
  selectedDateInfo: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)'
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center'
  }
});
