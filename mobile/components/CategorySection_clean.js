import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getTheme } from '../theme/tokens';

export function CategorySection({ title, accentBg, accentText, items = [], onPressItem, onViewAll }) {
  const theme = getTheme('light');
  return (
    <View style={[styles.sectionContainer, { backgroundColor: accentBg }]}>
      <Text style={[styles.sectionTitle, { color: accentText }]}>{title}</Text>
      <View style={styles.itemsContainer}>
        {items.slice(0,3).map(item => (
          <TouchableOpacity 
            key={item.id || item.title} 
            style={[styles.miniCard, { shadowColor:'#000' }]} 
            onPress={() => onPressItem && onPressItem(item)}
          >
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.itemMeta}>{item.subtitle}</Text>
            )}
          </TouchableOpacity>
        ))}
        {items.length === 0 && (
          <Text style={styles.empty}>No {title.toLowerCase()}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12
  },
  
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: 'SF Pro Display, Inter, system-ui',
    marginBottom: 8
  },
  
  itemsContainer: {
    gap: 8
  },
  
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
    minHeight: 56
  },
  
  itemTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: '#1B1C1E',
    fontFamily: 'SF Pro Display, Inter, system-ui',
    flex: 1
  },
  
  itemMeta: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: '#6B7078',
    fontFamily: 'SF Pro Display, Inter, system-ui'
  },
  
  empty: {
    fontSize: 13,
    lineHeight: 16,
    color: '#6B7078',
    fontFamily: 'SF Pro Display, Inter, system-ui',
    textAlign: 'center',
    paddingVertical: 20
  }
});
