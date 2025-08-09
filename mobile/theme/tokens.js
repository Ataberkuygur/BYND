// Design tokens for minimalist grayscale design
export const tokens = {
  // Spacing (8-pt grid)
  spacing: { 
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
    screen: 16,      // Screen padding
    section: 12,     // Section gap
    item: 8,         // Item gap (8-10 range)
    itemLarge: 10,   // Larger item gap
    cardV: 12,       // Card vertical padding
    cardH: 16        // Card horizontal padding
  },
  
  // Radii
  radius: { 
    xs: 8, sm: 12, md: 16, lg: 20, xl: 28, xxl: 32, pill: 999,
    section: 20,     // Section containers
    card: 16,        // Item cards
    fab: 32          // FAB mic (28-32 range)
  },
  
  // Typography (SF Pro / Inter fallback)
  typography: {
    fontFamily: 'SF Pro Display, Inter, system-ui',
    screenTitle: { size: 24, lineHeight: 28, weight: '600', fontFamily: 'SF Pro Display, Inter, system-ui' },      // Semibold
    sectionTitle: { size: 17, lineHeight: 22, weight: '600', fontFamily: 'SF Pro Display, Inter, system-ui' },     // Semibold
    itemTitle: { size: 16, lineHeight: 22, weight: '500', fontFamily: 'SF Pro Display, Inter, system-ui' },        // Medium
    meta: { size: 13, lineHeight: 16, weight: '500', fontFamily: 'SF Pro Display, Inter, system-ui' },             // Medium
    placeholder: { size: 15, lineHeight: 20, weight: '400', fontFamily: 'SF Pro Display, Inter, system-ui' }       // Regular
  },
  
  // Shadows (exact specifications)
  shadows: {
    card: '0 4 12 rgba(0,0,0,0.06)',     // Cards shadow
    fab: '0 10 30 rgba(0,0,0,0.18)',     // FAB shadow
    nav: '0 6 24 rgba(0,0,0,0.10)'
  },
  
  // Color palette - Exact grayscale specifications
  palette: {
    light: {
      // Core grayscale (exact hex values from specs)
      bg: '#F7F8FA',           // App background (canvas) - very light neutral
      surface: '#FFFFFF',       // Cards, nav bar, FAB
      textPrimary: '#1B1C1E',   // Primary text
      textSecondary: '#6B7078', // Secondary text
      divider: '#EDEDED',       // Dividers/skeletons
      
      // Section backgrounds (Home screen containers)
      sectionBg: '#F3F4F6',     // Section container background (subtle tint above canvas)
      
      // Selected states
      selectedFill: '#1B1C1E',  // Calendar selected day fill (white numeral)
      todayRing: 'rgba(27,28,30,0.4)', // Today ring at 40% opacity
      
      // Interactive states
      selected: '#1B1C1E',
      selectedText: '#FFFFFF',
      pressed: '#E5E5E5',
      
      // Navigation icons
      activeIcon: '#1B1C1E',    // Active tab icon
      inactiveIcon: '#6B7078',  // Inactive tab icon
      
      // Section containers
      sectionBackground: '#F3F4F6',
      
      // FAB specific
      fabBackground: '#1B1C1E',
      fabText: '#FFFFFF',
      
      // Legacy accent colors (keeping for compatibility)
      accent: '#1B1C1E',
      accentMeetings: '#E8F4FD',
      accentPayments: '#FFF4E6',
      accentTasks: '#F0F9FF',
      calendarDot: '#1B1C1E',
      error: '#D92D20', 
      success: '#12B76A', 
      warning: '#F79009'
    },
    dark: {
      // Improved dark mode variants
      bg: '#0A0B0D',           // Deeper, richer black background
      surface: '#1A1D21',       // Slightly lighter surface for better contrast
      textPrimary: '#FFFFFF',   // Pure white for better readability
      textSecondary: '#A8B0B8', // Improved secondary text contrast
      divider: '#2A2F35',       // Better divider visibility
      sectionBg: '#151A1F',     // Better section background contrast
      selectedFill: '#FFFFFF',  // Pure white for selected state
      todayRing: 'rgba(255,255,255,0.5)', // Higher opacity for better visibility
      activeIcon: '#FFFFFF',    // Pure white for active icons
      inactiveIcon: 'rgba(168,176,184,0.8)', // Higher opacity for inactive icons
      fabBg: '#1A1D21',         // Consistent with surface
      fabIcon: '#FFFFFF',       // Pure white for FAB icon
      accentMic: '#1A1D21',     // Consistent with surface
      accentMeetings: '#1E3A5F', // Improved accent colors with better contrast
      accentPayments: '#5A3F26', 
      accentTasks: '#234A30',
      calendarDot: '#5A9BFF',   // Brighter blue for better visibility
      error: '#FF6B66',         // Brighter error red
      success: '#4AE584',       // Brighter success green
      warning: '#FFB347'        // Improved warning orange
    }
  }
};

const enhancedLightPalette = {
  ...tokens.palette.light,
  // Section accent colors (all grayscale)
  accentMeetings: '#F3F4F6',
  accentMeetingsText: '#1B1C1E',
  accentPayments: '#F3F4F6',
  accentPaymentsText: '#1B1C1E',
  accentTasks: '#F3F4F6',
  accentTasksText: '#1B1C1E',
  
  // Additional colors
  textTertiary: '#6B7078',
  border: '#EDEDED',
  accent: '#1B1C1E',
  
  // Voice/Recording
  recordingActive: '#FF3B30',
  recordingInactive: '#6B7078'
};

const enhancedDarkPalette = {
  ...tokens.palette.dark,
  // Section accent colors
  accentMeetings: '#1A2332',
  accentMeetingsText: '#FFFFFF',
  accentPayments: '#2D1B0A',
  accentPaymentsText: '#FFFFFF',
  accentTasks: '#0A1929',
  accentTasksText: '#FFFFFF',
  
  // Additional colors
  textTertiary: '#8E8E93',
  border: '#38383A',
  accent: '#5A9BFF',
  
  // Voice/Recording
  recordingActive: '#FF453A',
  recordingInactive: '#8E8E93'
};

export function getTheme(colorScheme) {
  const pal = colorScheme === 'dark' ? enhancedDarkPalette : enhancedLightPalette;
  return { ...tokens, colors: pal };
}
