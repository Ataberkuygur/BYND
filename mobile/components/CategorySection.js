import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../theme/tokens';
import { HapticFeedback } from '../utils/haptics';

export function CategorySection({ 
  title, 
  accentBg, 
  accentText, 
  items, 
  onPressItem, 
  onViewAll, 
  colorScheme,
  icon,
  badge,
  showCheckboxes = false
}) {
  const theme = getTheme(colorScheme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => {
        HapticFeedback.light();
        onPressItem?.(item);
      }}
      activeOpacity={0.7}
    >
      {showCheckboxes && (
        <TouchableOpacity 
          style={[styles.checkbox, { borderColor: theme.colors.border }]}
          onPress={() => onPressItem?.(item)}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={14} color={theme.colors.accent} />
          )}
        </TouchableOpacity>
      )}
      
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.itemSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
        {item.amount && (
          <Text style={[styles.itemAmount, { color: theme.colors.textPrimary }]}>
            {item.amount}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={theme.colors.textTertiary} 
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  if (!items || items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: accentBg }]}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {icon && (
              <Ionicons 
                name={icon} 
                size={20} 
                color={accentText} 
                style={styles.titleIcon}
              />
            )}
            <Text style={[styles.title, { color: accentText }]}>{title}</Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
                <Text style={[styles.badgeText, { color: theme.colors.bg }]}>{badge}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Gray background for empty state */}
        <View style={[styles.emptyContainer, { backgroundColor: '#FFFFFF' }]}>
          <Ionicons 
            name={getEmptyIcon(title)} 
            size={32} 
            color={theme.colors.textTertiary} 
          />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {getEmptyMessage(title)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: accentBg,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={accentText} 
              style={styles.titleIcon}
            />
          )}
          <Text style={[styles.title, { color: accentText }]}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.badgeText, { color: theme.colors.bg }]}>{badge}</Text>
            </View>
          )}
        </View>
        
        {onViewAll && items.length > 2 && (
          <TouchableOpacity onPress={() => {
              HapticFeedback.medium();
              onViewAll();
            }}>
            <Text style={[styles.viewAll, { color: accentText }]}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </Animated.View>
  );
}

function getEmptyIcon(title) {
  switch (title.toLowerCase()) {
    case 'meetings': return 'calendar-outline';
    case 'awaiting payments': return 'wallet-outline';
    case 'tasks': return 'checkmark-circle-outline';
    default: return 'ellipse-outline';
  }
}

function getEmptyMessage(title) {
  switch (title.toLowerCase()) {
    case 'meetings': return 'No upcoming meetings';
    case 'awaiting payments': return 'All payments up to date';
    case 'tasks': return 'No pending tasks';
    default: return 'Nothing here yet';
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  titleIcon: {
    marginRight: 8
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    flex: 1,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 56
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemContent: {
    flex: 1,
    marginRight: 8
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 2,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  itemSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2
  },
  chevron: {
    opacity: 0.5
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  }
});
