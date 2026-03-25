import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
// import * as Haptics from 'expo-haptics'; // Commented out - install expo-haptics if needed
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeNavigationProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  showIndicators?: boolean;
}

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  showIndicators = true,
}) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX: tx, translationY: ty, velocityX, velocityY } = event.nativeEvent;

    if (state === 2) { // BEGAN
      setIsSwipeActive(true);
    } else if (state === 5) { // END
      setIsSwipeActive(false);

      // Determine swipe direction based on distance and velocity
      const absTx = Math.abs(tx);
      const absTy = Math.abs(ty);

      // Horizontal swipes
      if (absTx > absTy && absTx > SWIPE_THRESHOLD) {
        if (tx > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (tx < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
      // Vertical swipes
      else if (absTy > absTx && absTy > SWIPE_THRESHOLD) {
        if (ty > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (ty < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      // Reset animation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    swipeContainer: {
      flex: 1,
    },
    indicators: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    },
    indicator: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: isSwipeActive ? 0.7 : 0.3,
    },
    leftIndicator: {
      left: 20,
      top: '50%',
      marginTop: -20,
    },
    rightIndicator: {
      right: 20,
      top: '50%',
      marginTop: -20,
    },
    upIndicator: {
      top: 60,
      left: '50%',
      marginLeft: -20,
    },
    downIndicator: {
      bottom: 100,
      left: '50%',
      marginLeft: -20,
    },
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minPointers={1}
        maxPointers={1}
      >
        <Animated.View
          style={[
            styles.swipeContainer,
            {
              transform: [
                { translateX: translateX },
                { translateY: translateY },
              ],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>

      {showIndicators && (
        <View style={styles.indicators}>
          {onSwipeLeft && (
            <View style={[styles.indicator, styles.leftIndicator]}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </View>
          )}
          {onSwipeRight && (
            <View style={[styles.indicator, styles.rightIndicator]}>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </View>
          )}
          {onSwipeUp && (
            <View style={[styles.indicator, styles.upIndicator]}>
              <Ionicons name="chevron-up" size={24} color="#ffffff" />
            </View>
          )}
          {onSwipeDown && (
            <View style={[styles.indicator, styles.downIndicator]}>
              <Ionicons name="chevron-down" size={24} color="#ffffff" />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

// Floating Action Button with swipe gestures
interface FloatingActionButtonProps {
  onPress: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  icon: string;
  size?: number;
  position?: 'bottom-right' | 'bottom-left' | 'center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  icon,
  size = 56,
  position = 'bottom-right',
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    // Handle gesture event if needed
  };

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationX: tx, translationY: ty } = event.nativeEvent;

    if (state === State.BEGAN) {
      setIsPressed(true);
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    } else if (state === State.END) {
      setIsPressed(false);
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      const absTx = Math.abs(tx);
      const absTy = Math.abs(ty);
      const threshold = 30;

      if (absTx > absTy && absTx > threshold) {
        if (tx > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (tx < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absTy > absTx && absTy > threshold) {
        if (ty > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (ty < 0 && onSwipeUp) {
          onSwipeUp();
        }
      } else if (absTx < 10 && absTy < 10) {
        onPress();
      }
    }
  };

  const getPositionStyle = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      case 'center':
        return { 
          bottom: '50%' as any, 
          left: '50%' as any, 
          marginBottom: -size / 2, 
          marginLeft: -size / 2 
        };
      default:
        return { bottom: 20, right: 20 };
    }
  };

  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      ...getPositionStyle(),
    },
  });

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Ionicons name={icon as any} size={size * 0.4} color="#ffffff" />
      </Animated.View>
    </PanGestureHandler>
  );
};
