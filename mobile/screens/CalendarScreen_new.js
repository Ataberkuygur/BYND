import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { getTheme } from '../theme/tokens';

export function CalendarScreen() {
  const theme = getTheme('light');
  const [selectedDay, setSelectedDay] = useState(17);
  const currentMonth = 'February';
  const currentYear = '2023';
  
  // Sample agenda items for selected day
  const agendaItems = [
    { id: 'a1', title: 'Breakfast with Alice', time: '10:00 AM' },
    { id: 'a2', title: 'Design Review', time: 'Feb 21' },
    { id: 'a3', title: 'Call with Paul', time: '3:00 PM' }
  ];
  
  // Generate calendar grid (simplified for demo)
  const generateCalendarDays = () => {
    const days = [];
    for (let i = 1; i <= 28; i++) {
      days.push(i);
    }
    return days;
  };
  
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const calendarDays = generateCalendarDays();
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Calendar
        </Text>
        
        {/* Month chip row */}
        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.chevron}>
            <Text style={[styles.chevronText, { color: theme.colors.textSecondary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>
            {currentMonth} {currentYear}
          </Text>
          <TouchableOpacity style={styles.chevron}>
            <Text style={[styles.chevronText, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Month Grid */}
      <View style={styles.monthGrid}>
        {/* Weekday labels */}
        <View style={styles.weekdayRow}>
          {weekdays.map((day, index) => (
            <Text key={index} style={[styles.weekdayLabel, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar days */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const isToday = day === 15; // Mock today
            const isSelected = day === selectedDay;
            
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayCell,
                  isToday && styles.todayCell,
                  isSelected && [styles.selectedCell, { backgroundColor: theme.colors.selectedFill }]
                ]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[
                  styles.dayNumber,
                  { color: theme.colors.textPrimary },
                  isSelected && styles.selectedDayNumber
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Agenda List */}
      <View style={styles.agendaSection}>
        {agendaItems.length > 0 ? (
          agendaItems.map((item) => (
            <View key={item.id} style={[styles.agendaCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.agendaTitle, { color: theme.colors.textPrimary }]}>
                {item.title}
              </Text>
              <Text style={[styles.agendaTime, { color: theme.colors.textSecondary }]}>
                {item.time}
              </Text>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No events
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16                 // Screen padding
  },
  
  // Header section
  header: {
    marginTop: 16,              // Top safe area to title: 16-20
    marginBottom: 12
  },
  
  title: {
    fontSize: 24,               // Screen title: 24/28 Semibold
    lineHeight: 28,
    fontWeight: '600',          // Semibold
    fontFamily: 'SF Pro Display, Inter, system-ui',
    marginBottom: 8             // Vertical gap title → month row: 8
  },
  
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8
  },
  
  monthLabel: {
    fontSize: 13,               // Month label: 13/16 Medium
    lineHeight: 16,
    fontWeight: '500',          // Medium
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  
  chevron: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  chevronText: {
    fontSize: 20,               // Chevron buttons: 18-20
    fontWeight: '400'
  },
  
  // Month grid
  monthGrid: {
    marginBottom: 12
  },
  
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8             // Vertical gap between weeks: 8
  },
  
  weekdayLabel: {
    fontSize: 13,               // Weekday labels: 13/16 Medium
    lineHeight: 16,
    fontWeight: '500',          // Medium
    fontFamily: 'SF Pro Display, Inter, system-ui',
    textAlign: 'center',
    width: 40
  },
  
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around'
  },
  
  dayCell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 20
  },
  
  todayCell: {
    borderWidth: 1,             // Today: thin ring (1 pt)
    borderColor: 'rgba(27,28,30,0.4)' // #1B1C1E at 40% opacity
  },
  
  selectedCell: {
    // backgroundColor set dynamically to theme.colors.selectedFill
  },
  
  dayNumber: {
    fontSize: 16,               // Day numbers: 16/22 Medium
    lineHeight: 22,
    fontWeight: '500',          // Medium
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  
  selectedDayNumber: {
    color: '#FFFFFF'            // White numeral on selected day
  },
  
  // Agenda section
  agendaSection: {
    marginTop: 12,              // Top margin from grid: 12
    gap: 10                     // Item gap: 8-10
  },
  
  agendaCard: {
    borderRadius: 16,           // Card radius: 16
    paddingVertical: 14,        // Internal padding: 12-14 vertical
    paddingHorizontal: 16,      // 16 horizontal
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,        // Cards: 0 4 12 rgba(0,0,0,0.06)
    shadowRadius: 12,
    elevation: 2,
    minHeight: 64,              // Height flexible; typical content 64-72 tall
    shadowColor: '#000'
  },
  
  agendaTitle: {
    fontSize: 16,               // Title: 16/22 Medium
    lineHeight: 22,
    fontWeight: '500',          // Medium
    fontFamily: 'SF Pro Display, Inter, system-ui',
    flex: 1
  },
  
  agendaTime: {
    fontSize: 13,               // Meta/time: 13/16 Medium
    lineHeight: 16,
    fontWeight: '500',          // Medium
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  
  emptyCard: {
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    shadowColor: '#000'
  },
  
  emptyText: {
    fontSize: 13,               // Empty state: 13/16
    lineHeight: 16,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  }
});
