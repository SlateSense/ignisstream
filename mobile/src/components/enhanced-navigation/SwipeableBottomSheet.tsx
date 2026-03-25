import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = 100;
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.8;

interface SwipeableBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapIndex?: number;
}

export const SwipeableBottomSheet: React.FC<SwipeableBottomSheetProps> = ({
  isVisible,
  onClose,
  title,
  children,
  snapPoints = [0.3, 0.8],
  initialSnapIndex = 0,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const gestureHandler = useRef<any>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnapIndex);

  const snapPointsPixels = snapPoints.map(point => SCREEN_HEIGHT * (1 - point));

  useEffect(() => {
    if (isVisible) {
      Animated.spring(translateY, {
        toValue: snapPointsPixels[currentSnapIndex],
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: SCREEN_HEIGHT,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isVisible, currentSnapIndex]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationY, velocityY } = event.nativeEvent;
    
    if (state === 5) { // END state
      let targetSnapIndex = currentSnapIndex;
      
      // Determine which snap point to animate to
      if (velocityY > 500) {
        // Fast swipe down - go to next lower snap point or close
        targetSnapIndex = Math.min(snapPoints.length - 1, currentSnapIndex + 1);
      } else if (velocityY < -500) {
        // Fast swipe up - go to next higher snap point
        targetSnapIndex = Math.max(0, currentSnapIndex - 1);
      } else {
        // Slow drag - find closest snap point
        const currentPosition = snapPointsPixels[currentSnapIndex] + translationY;
        let closestIndex = 0;
        let closestDistance = Math.abs(currentPosition - snapPointsPixels[0]);
        
        snapPointsPixels.forEach((snapPoint, index) => {
          const distance = Math.abs(currentPosition - snapPoint);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        targetSnapIndex = closestIndex;
      }

      // If trying to go below the last snap point, close the sheet
      if (targetSnapIndex >= snapPoints.length || 
          (snapPointsPixels[currentSnapIndex] + translationY > SCREEN_HEIGHT * 0.5)) {
        onClose();
        return;
      }

      setCurrentSnapIndex(targetSnapIndex);
      
      Animated.spring(translateY, {
        toValue: snapPointsPixels[targetSnapIndex],
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: SCREEN_HEIGHT,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      minHeight: BOTTOM_SHEET_MAX_HEIGHT,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 10,
    },
    handle: {
      width: 50,
      height: 5,
      backgroundColor: colors.border,
      borderRadius: 3,
      alignSelf: 'center',
      marginBottom: 15,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
  });

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      
      <PanGestureHandler
        ref={gestureHandler}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.content}>
              {children}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Quick Actions Bottom Sheet Component
interface QuickActionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
}

export const QuickActionsSheet: React.FC<QuickActionsSheetProps> = ({
  isVisible,
  onClose,
  navigation,
}) => {
  const { colors } = useTheme();

  const quickActions = [
    {
      id: 1,
      title: 'Capture Moment',
      subtitle: 'Record or take a photo',
      icon: 'camera',
      gradient: ['#7c3aed', '#ec4899'],
      onPress: () => {
        navigation.navigate('Camera');
        onClose();
      },
    },
    {
      id: 2,
      title: 'Go Live',
      subtitle: 'Start streaming',
      icon: 'radio',
      gradient: ['#ef4444', '#f97316'],
      onPress: () => {
        navigation.navigate('Streaming');
        onClose();
      },
    },
    {
      id: 3,
      title: 'Create Post',
      subtitle: 'Share your thoughts',
      icon: 'create',
      gradient: ['#10b981', '#06b6d4'],
      onPress: () => {
        navigation.navigate('CreatePost');
        onClose();
      },
    },
    {
      id: 4,
      title: 'Join Tournament',
      subtitle: 'Compete with others',
      icon: 'trophy',
      gradient: ['#f59e0b', '#eab308'],
      onPress: () => {
        navigation.navigate('Tournaments');
        onClose();
      },
    },
  ];

  const styles = StyleSheet.create({
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    actionCard: {
      width: (SCREEN_WIDTH - 60) / 2,
      height: 120,
      borderRadius: 16,
      overflow: 'hidden',
    },
    actionContent: {
      flex: 1,
      padding: 20,
      justifyContent: 'space-between',
    },
    actionIcon: {
      alignSelf: 'flex-start',
    },
    actionText: {
      marginTop: 10,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    actionSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.8)',
    },
  });

  return (
    <SwipeableBottomSheet
      isVisible={isVisible}
      onClose={onClose}
      title="Quick Actions"
      snapPoints={[0.4, 0.6]}
    >
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={action.gradient}
              style={styles.actionContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={28} color="#ffffff" />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </SwipeableBottomSheet>
  );
};
