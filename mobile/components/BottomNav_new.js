import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform, 
  Animated, 
  Easing,
  Dimensions,
  PanResponder
} from 'react-native';
import { tokens, getTheme } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Icon components - clean geometric style
const HomeIcon = ({ active, size = 24, color }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={[{
      width: size * 0.75,
      height: size * 0.65,
      borderWidth: 1.5,
      borderColor: color,
      borderBottomWidth: 0
    }]} />
    <View style={[{
      width: size * 0.5,
      height: size * 0.35,
      borderLeftWidth: 1.5,
      borderRightWidth: 1.5,
      borderBottomWidth: 1.5,
      borderColor: color,
      marginTop: -1
    }]} />
  </View>
);

const CalendarIcon = ({ active, size = 24, color }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={[{
      width: size * 0.75,
      height: size * 0.75,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 2
    }]} />
    <View style={[{
      position: 'absolute',
      top: size * 0.25,
      width: size * 0.55,
      height: 1,
      backgroundColor: color
    }]} />
    <View style={[{
      position: 'absolute',
      top: size * 0.45,
      width: size * 0.55,
      height: 1,
      backgroundColor: color
    }]} />
  </View>
);

const MicIcon = ({ state, size = 24, color }) => {
  switch (state) {
    case 'recording':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[{
            width: size * 0.4,
            height: size * 0.6,
            borderWidth: 2,
            borderColor: color,
            borderRadius: size * 0.2,
            marginBottom: size * 0.1
          }]} />
          <View style={[{
            width: size * 0.7,
            height: 2,
            backgroundColor: color
          }]} />
        </View>
      );
    case 'processing':
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[{
            width: size * 0.6,
            height: size * 0.6,
            borderWidth: 2,
            borderColor: color,
            borderRadius: size * 0.3
          }]} />
        </View>
      );
    default:
      return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[{
            width: size * 0.4,
            height: size * 0.6,
            borderWidth: 2,
            borderColor: color,
            borderRadius: size * 0.2,
            marginBottom: size * 0.1
          }]} />
          <View style={[{
            width: 1,
            height: size * 0.15,
            backgroundColor: color,
            marginBottom: size * 0.05
          }]} />
          <View style={[{
            width: size * 0.7,
            height: 2,
            backgroundColor: color
          }]} />
        </View>
      );
  }
};

export function BottomNav({ onTabChange, onMicPress }) {
  const theme = getTheme('light');
  
  // Tab configuration - Home left, Calendar right  
  const tabs = [
    { id: 'home', icon: HomeIcon, screen: 'Home' },
    { id: 'calendar', icon: CalendarIcon, screen: 'Calendar' }
  ];
  
  const [activeTab, setActiveTab] = useState('home');
  const [fabScale] = useState(new Animated.Value(1));
  const [micState, setMicState] = useState('idle'); // 'idle', 'recording', 'processing'
  
  // Animation refs for tab transitions
  const tabAnimations = useRef(
    tabs.reduce((acc, tab) => {
      acc[tab.id] = new Animated.Value(tab.id === 'home' ? 1 : 0.6);
      return acc;
    }, {})
  ).current;
  
  const handleTabPress = (tabId) => {
    if (tabId === activeTab) return;
    
    // Animate out current tab
    Animated.spring(tabAnimations[activeTab], {
      toValue: 0.6,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
    
    // Animate in new tab
    Animated.spring(tabAnimations[tabId], {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20
    }).start();
    
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };
  
  const handleMicPress = () => {
    // Scale animation
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 400,
        friction: 10
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 10
      })
    ]).start();
    
    onMicPress?.();
  };
  
  const renderTab = (tab, index) => {
    const isActive = activeTab === tab.id;
    const IconComponent = tab.icon;
    const animatedValue = tabAnimations[tab.id];
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.tab}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tabContent,
            {
              transform: [{ scale: animatedValue }]
            }
          ]}
        >
          <IconComponent
            active={isActive}
            size={24}
            color={isActive ? theme.colors.activeIcon : theme.colors.inactiveIcon}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Navigation shadow */}
      <View style={[styles.shadow, { backgroundColor: theme.colors.surface }]} />
      
      {/* Tab container */}
      <View style={styles.tabsContainer}>
        {/* Left tab (Home) */}
        <View style={styles.tabSection}>
          {renderTab(tabs[0], 0)}
        </View>
        
        {/* Center FAB */}
        <View style={styles.fabSection}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.fabBg }]}
            onPress={handleMicPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.fabContent,
                {
                  transform: [{ scale: fabScale }]
                }
              ]}
            >
              <MicIcon
                state={micState}
                size={28}
                color={theme.colors.fabIcon}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Right tab (Calendar) */}
        <View style={styles.tabSection}>
          {renderTab(tabs[1], 1)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88, // Total height including safe area
    justifyContent: 'flex-end'
  },
  
  shadow: {
    position: 'absolute',
    top: -12,
    left: 0,
    right: 0,
    height: 12,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowColor: '#000',
    elevation: 8
  },
  
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64, // Navigation content height
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8 // Safe area bottom
  },
  
  tabSection: {
    flex: 1,
    alignItems: 'center'
  },
  
  tab: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  fabSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    shadowColor: '#000',
    elevation: 12
  },
  
  fabContent: {
    alignItems: 'center',
    justifyContent: 'center'
  }
});
