# BottomNav Component

A comprehensive, fully-featured bottom navigation component built according to detailed design specifications.

## Features

### 🎯 Core Navigation
- **Three persistent tabs**: Calendar, Home, Chat
- **Center FAB microphone**: Dead-center positioning with visual notch cutout
- **Smart spacing**: Symmetric layout with balanced tab distribution
- **Cross-platform**: iOS-safe with Android parity

### 🎨 Visual Design
- **Precise measurements**: 88px height with 16px horizontal padding
- **FAB specifications**: 64px diameter, raised 10px above bar
- **Circular notch cutout**: 36px radius for nested FAB appearance
- **Icon sizing**: 24px for tabs, proper scaling for different states

### 🌓 Theming Support
- **Light/Dark modes**: Automatic color adaptation
- **Design tokens**: Integrated with existing theme system
- **Color specifications**: Exact colors per design requirements
- **Elevation shadows**: Appropriate shadow depths for each mode

### ✨ Micro-Animations
- **Tab transitions**: Smooth scale animations (0.92 → 1.0)
- **FAB interactions**: Press feedback with spring physics
- **Recording states**: Pulse rings and morphing icons
- **Error handling**: Shake animations for failed states
- **Indicator slides**: Smooth underline transitions

### 🎙️ Voice Recording States
- **Idle**: Ready state with mic icon
- **Recording**: Animated pulse ring with waveform hints
- **Processing**: Spinner with processing label
- **Success**: Checkmark confirmation
- **Error**: Shake animation with retry message

### 🔔 Notifications & Badges
- **Chat unread count**: Circular badge with "9+" overflow
- **Payment notifications**: Amber dot for pending payments
- **Badge positioning**: Top-right for chat, bottom-right for payments
- **Accessible counts**: Screen reader friendly

### 📱 Responsive Behavior
- **Keyboard adaptation**: Moves above keyboard when visible
- **Landscape mode**: Compact 56px FAB with reduced height
- **Safe areas**: Proper iOS home indicator spacing
- **Small screens**: Smart label hiding when space is limited

### ♿ Accessibility
- **VoiceOver support**: Proper labels and state announcements
- **Minimum touch targets**: 44×44px compliance
- **Color independence**: Shape indicators, not just color
- **Screen reader navigation**: Logical reading order
- **State announcements**: Recording state feedback

### 🎛️ Variants & Experiments
- **Variant A**: Active tab labels only (default)
- **Variant B**: All tabs show labels
- **Variant C**: Background tint behind active tab
- **Toggleable features**: Easy A/B testing support

### ⚡ Advanced Features
- **Swipe navigation**: Left/right swipes to change tabs
- **Double-tap handling**: Quick restart after accidental stop
- **Hold-to-talk**: Long press for continuous recording
- **Permission handling**: Graceful mic permission management
- **Network awareness**: Offline queueing with sync indicators

## Props API

```jsx
<BottomNav
  // Core navigation
  current="home"                    // Current active tab: 'calendar' | 'home' | 'chat'
  onSelect={(tab) => {}}           // Tab selection callback
  
  // Microphone functionality  
  recordingState="idle"            // 'idle' | 'recording' | 'processing' | 'success' | 'error'
  onMicPress={() => {}}           // Mic tap handler
  onMicLongPress={() => {}}       // Mic long press handler
  micPermission={true}            // Mic permission state
  
  // Notifications
  chatUnreadCount={3}             // Chat unread message count
  paymentsPending={2}             // Number of pending payments
  
  // Theming & Variants
  colorScheme="light"             // 'light' | 'dark'
  variant="A"                     // 'A' | 'B' | 'C' (label display variants)
  
  // Responsive behavior
  isLandscape={false}             // Landscape mode adaptation
  keyboardVisible={false}         // Keyboard presence
/>
```

## Usage Examples

### Basic Implementation
```jsx
import { BottomNav } from '../components/BottomNav';

function App() {
  const [currentTab, setCurrentTab] = useState('home');
  
  return (
    <View style={{ flex: 1 }}>
      {/* Your screen content */}
      <BottomNav
        current={currentTab}
        onSelect={setCurrentTab}
        onMicPress={() => startVoiceRecording()}
      />
    </View>
  );
}
```

### Advanced Implementation with All Features
```jsx
function AdvancedApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const [recordingState, setRecordingState] = useState('idle');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const handleMicPress = async () => {
    setRecordingState('recording');
    try {
      const result = await processVoiceInput();
      setRecordingState('success');
    } catch (error) {
      setRecordingState('error');
    } finally {
      setTimeout(() => setRecordingState('idle'), 1000);
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      {/* Content */}
      <BottomNav
        current={currentTab}
        onSelect={setCurrentTab}
        recordingState={recordingState}
        onMicPress={handleMicPress}
        onMicLongPress={() => startHoldToTalk()}
        chatUnreadCount={unreadCount}
        paymentsPending={getPendingPaymentsCount()}
        colorScheme={useColorScheme()}
        variant="A"
        micPermission={hasMicPermission}
      />
    </View>
  );
}
```

### Voice Recording Flow
```jsx
const handleVoiceRecording = async () => {
  // Start recording
  setRecordingState('recording');
  
  try {
    // Simulate recording
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Process audio
    setRecordingState('processing');
    const result = await processAudio();
    
    // Show success
    setRecordingState('success');
    
    // Add result to tasks/notes
    addVoiceResult(result);
    
  } catch (error) {
    // Show error with shake animation
    setRecordingState('error');
  } finally {
    // Return to idle after 1 second
    setTimeout(() => setRecordingState('idle'), 1000);
  }
};
```

## Styling Customization

The component uses the theme system from `../theme/tokens.js`. Key customizable aspects:

### Colors
- Surface background
- Text primary/secondary
- Accent colors for FAB
- Error/success states
- Badge colors

### Spacing & Sizing
- Container height (88px default)
- FAB size (64px default, 56px landscape)
- Padding and margins
- Icon sizes

### Animations
- Timing curves (spring physics)
- Duration settings
- Easing functions

## Performance Considerations

- **Native driver**: All animations use native driver for 60fps
- **Optimized re-renders**: Memoized calculations and minimal state updates
- **Gesture handling**: Efficient pan responder for swipe navigation
- **Memory management**: Proper cleanup of animations and timers

## Accessibility Compliance

- **WCAG 2.1 AA**: Meets contrast requirements (4.5:1 minimum)
- **Touch targets**: 44×44px minimum tap areas
- **Screen readers**: Comprehensive VoiceOver/TalkBack support
- **Keyboard navigation**: Full keyboard accessibility
- **Motion sensitivity**: Respects reduced motion preferences

## Platform Considerations

### iOS Specific
- **Safe area handling**: Automatic home indicator spacing
- **Haptic feedback**: Impact feedback on interactions (when available)
- **Status bar**: Proper status bar color coordination

### Android Specific
- **Navigation gestures**: Material design compliance
- **Elevation shadows**: Proper shadow rendering
- **Back gesture**: Integration with system navigation

### Web Specific
- **Mouse interactions**: Proper hover states
- **Keyboard shortcuts**: Tab navigation support
- **Touch simulation**: Mobile-like interactions on desktop

## Migration Guide

### From Previous Version
The new BottomNav has breaking changes:

**Old API:**
```jsx
<BottomNav current="home" onSelect={setTab} recordingState="idle" />
```

**New API:**
```jsx
<BottomNav 
  current="home" 
  onSelect={setTab}
  recordingState="idle"
  onMicPress={handleMic}
  // Additional props for enhanced functionality
/>
```

**Key Changes:**
1. Separate `onMicPress` handler required
2. New props for badges and theming
3. Enhanced accessibility props
4. Variant system for different layouts

## Telemetry & Analytics

The component supports tracking these events:

```jsx
// Tab navigation
analytics.track('nav_tab_click', {
  tab: 'calendar|home|chat',
  from: currentTab
});

// Microphone usage
analytics.track('mic_start', {
  mode: 'tap|hold',
  timestamp: Date.now()
});

analytics.track('mic_stop', {
  duration_ms: recordingDuration,
  success: true
});

// Error tracking
analytics.track('mic_error', {
  reason: 'permission|timeout|network',
  state: recordingState
});
```

## Testing

### Unit Tests
```jsx
import { render, fireEvent } from '@testing-library/react-native';
import { BottomNav } from './BottomNav';

test('navigates between tabs', () => {
  const onSelect = jest.fn();
  const { getByText } = render(
    <BottomNav current="home" onSelect={onSelect} />
  );
  
  fireEvent.press(getByText('Calendar'));
  expect(onSelect).toHaveBeenCalledWith('calendar');
});
```

### Integration Tests
- Voice recording flow
- Badge updates
- Theme switching
- Responsive behavior

### Accessibility Tests
- Screen reader navigation
- Keyboard navigation
- Color contrast validation
- Touch target verification

## Performance Monitoring

Key metrics to monitor:

1. **Animation performance**: Frame rate during transitions
2. **Touch responsiveness**: Time from touch to visual feedback
3. **Memory usage**: Component lifecycle impact
4. **Bundle size**: JavaScript bundle impact

## Troubleshooting

### Common Issues

**FAB not visible:**
- Check z-index values
- Verify container height
- Ensure proper positioning

**Animations not smooth:**
- Verify native driver usage
- Check for blocking JavaScript
- Monitor memory usage

**Accessibility issues:**
- Test with screen reader enabled
- Verify touch target sizes
- Check color contrast ratios

**Theme not applying:**
- Verify theme system integration
- Check prop passing
- Validate color scheme detection

## Future Enhancements

Planned improvements:

1. **Haptic feedback**: Enhanced tactile responses
2. **Voice visualizations**: Real-time audio waveforms
3. **Gesture shortcuts**: Swipe actions for quick tasks
4. **Adaptive sizing**: Dynamic scaling based on content
5. **Custom animations**: User-configurable animation preferences
6. **Advanced badges**: Rich notification previews
